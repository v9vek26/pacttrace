import "server-only";

import { withGroqRetry } from "@/lib/groq-retry";
import { z } from "zod";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";

const extractedCommitmentsSchema = z.strictObject({
  vendor: z.string(),
  summary: z.string(),
  commitments: z.array(z.strictObject({
    type: z.string(),
    description: z.string(),
    value: z.string().nullable(),
    condition: z.string().nullable(),
    deadline: z.string().nullable(),
    status: z.enum(["promised", "active", "honored", "violated", "unknown"]),
  })),
});

export type ExtractedCommitments = z.infer<typeof extractedCommitmentsSchema>;
export type Commitment = ExtractedCommitments["commitments"][number];

const commitmentSchema = {
  type: "object",
  properties: {
    vendor: {
      type: "string",
    },
    summary: {
      type: "string",
    },
    commitments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
          },
          description: {
            type: "string",
          },
          value: {
            type: ["string", "null"],
          },
          condition: {
            type: ["string", "null"],
          },
          deadline: {
            type: ["string", "null"],
          },
          status: {
            type: "string",
            enum: ["promised", "active", "honored", "violated", "unknown"],
          },
        },
        required: [
          "type",
          "description",
          "value",
          "condition",
          "deadline",
          "status",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["vendor", "summary", "commitments"],
  additionalProperties: false,
};

export async function extractCommitments(
  vendor: string,
  interaction: string,
): Promise<ExtractedCommitments> {
  const groq = getGroqClient();

  const completion = await withGroqRetry(() => groq.chat.completions.create({
    model: GROQ_MODEL,
    reasoning_effort: "low",
    reasoning_format: "hidden",
    messages: [
      {
        role: "system",
        content: `
You are the commitment extraction engine for PactTrace.

PactTrace helps procurement teams remember vendor promises.

Extract only explicit or strongly supported vendor commitments from the provided interaction.

A commitment may include:
- discounts
- pricing guarantees
- fee waivers
- service-level promises
- support promises
- implementation commitments
- credits
- renewal terms
- delivery promises
- contract conditions

Do not invent commitments.

If a value, condition, or deadline is not present, return null.

The status should normally be "promised" for a newly extracted vendor promise.
        `.trim(),
      },
      {
        role: "user",
        content: `
Vendor: ${vendor}

Interaction:
${interaction}
        `.trim(),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "pacttrace_commitment_extraction",
        strict: true,
        schema: commitmentSchema,
      },
    },
  }, { timeout: 60_000, maxRetries: 0 }));

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response");
  }

  return extractedCommitmentsSchema.parse(JSON.parse(content));

}
