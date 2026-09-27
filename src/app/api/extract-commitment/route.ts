import { NextRequest, NextResponse } from "next/server";

import { getGroqClient, GROQ_MODEL } from "@/lib/groq";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const vendor =
      typeof body.vendor === "string" ? body.vendor.trim() : "";

    const interaction =
      typeof body.interaction === "string"
        ? body.interaction.trim()
        : "";

    if (!vendor || !interaction) {
      return NextResponse.json(
        {
          success: false,
          error: "vendor and interaction are required",
        },
        { status: 400 },
      );
    }

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
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
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty response");
    }

    const extracted = JSON.parse(content);

    return NextResponse.json({
      success: true,
      model: GROQ_MODEL,
      extracted,
    });
  } catch (error) {
    console.error("Commitment extraction failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Groq error",
      },
      { status: 500 },
    );
  }
}