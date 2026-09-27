import { NextRequest, NextResponse } from "next/server";

import { extractCommitments } from "@/lib/commitments";
import { GROQ_MODEL } from "@/lib/groq";
import { extractionInputSchema } from "@/lib/interaction-input";

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

  const input = extractionInputSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json(
      { success: false, error: "vendor and interaction are required" },
      { status: 400 },
    );
  }

  try {
    const extracted = await extractCommitments(input.data.vendor, input.data.interaction);
    return NextResponse.json({ success: true, model: GROQ_MODEL, extracted });
  } catch {
    // Provider errors can include request details; never return or log them raw.
    return NextResponse.json(
      { success: false, error: "Commitment extraction failed" },
      { status: 500 },
    );
  }
}
