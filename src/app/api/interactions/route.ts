import { NextRequest, NextResponse } from "next/server";

import { extractCommitments, type ExtractedCommitments } from "@/lib/commitments";
import { GROQ_MODEL } from "@/lib/groq";
import { interactionInputSchema } from "@/lib/interaction-input";
import { retainInteraction } from "@/lib/interaction-memory";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const input = interactionInputSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json(
      {
        success: false,
        error: "vendor, interaction, and source must be non-empty strings (maximum lengths: 200, 50000, and 100)",
      },
      { status: 400 },
    );
  }

  let extracted: ExtractedCommitments;
  try {
    extracted = await extractCommitments(input.data.vendor, input.data.interaction);
  } catch {
    return NextResponse.json(
      { success: false, error: "Commitment extraction failed", stage: "extraction" },
      { status: 502 },
    );
  }

  try {
    const memory = await retainInteraction(input.data, extracted);
    return NextResponse.json({ success: true, model: GROQ_MODEL, extracted, memory });
  } catch {
    // A timed-out request may have written memories. Do not claim a rollback.
    return NextResponse.json(
      {
        success: false,
        error: "Hindsight retention could not be confirmed; some memories may have been stored",
        stage: "retention",
        extracted,
        memory: { retained: null, status: "unconfirmed" },
      },
      { status: 502 },
    );
  }
}
