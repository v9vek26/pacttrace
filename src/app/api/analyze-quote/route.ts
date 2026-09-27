import { NextRequest, NextResponse } from "next/server";

import { analyzeQuote, quoteInputSchema } from "@/lib/conflict-analysis";
import { GROQ_MODEL } from "@/lib/groq";
import { recallVendorMemories, type VendorMemory } from "@/lib/vendor-memory";

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
  const input = quoteInputSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json(
      { success: false, error: "vendor, quote, and source must be non-empty strings (maximum lengths: 200, 50000, and 100)" },
      { status: 400 },
    );
  }

  let memories: VendorMemory[];
  try {
    memories = await recallVendorMemories(input.data.vendor, input.data.quote);
  } catch {
    return NextResponse.json(
      { success: false, analysisStatus: "failed", stage: "recall", error: "Historical vendor memories could not be retrieved" },
      { status: 502 },
    );
  }

  try {
    const analysis = await analyzeQuote(input.data, memories);
    return NextResponse.json({
      success: true,
      ...analysis,
      model: memories.length ? GROQ_MODEL : null,
      analysisStatus: memories.length ? "analyzed" : "no_memories",
    });
  } catch (error) {
    // Do not expose provider errors, headers, prompts, or configuration values.
    return NextResponse.json(
      {
        success: false,
        analysisStatus: "failed",
        stage: "analysis",
        memoryCount: memories.length,
        upstreamStatus: typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : null,
        code: error instanceof Error && error.message === "Quote comparison failed validation"
          ? "invalid_analysis" : "analysis_provider_failure",
        error: "Quote analysis could not be completed reliably",
      },
      { status: 502 },
    );
  }
}
