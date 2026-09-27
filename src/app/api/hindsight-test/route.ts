import { NextResponse } from "next/server";

import {
  getHindsightBankId,
  getHindsightClient,
} from "@/lib/hindsight";

const TEST_MEMORY =
  "On June 12, 2026, CloudNova promised Acme Corp a 15% renewal discount if the account exceeded 100 seats.";

const TEST_QUERY =
  "What renewal discount did CloudNova promise and under what condition?";

async function ensureBankExists() {
  const client = getHindsightClient();
  const bankId = getHindsightBankId();

  try {
    await client.getBankProfile(bankId);
  } catch {
    await client.createBank(bankId, {
      name: "PactTrace Development",
      background:
        "Memory bank for PactTrace vendor commitments and negotiation history.",
    });
  }

  return bankId;
}

export async function GET() {
  try {
    const client = getHindsightClient();
    const bankId = await ensureBankExists();

    await client.retain(bankId, TEST_MEMORY, {
      context: "PactTrace Hindsight integration test",
      metadata: {
        vendor: "CloudNova",
        type: "vendor_commitment",
        source: "integration_test",
      },
    });

    const recall = await client.recall(bankId, TEST_QUERY, {
      limit: 5,
    });

    return NextResponse.json({
      success: true,
      bankId,
      retained: TEST_MEMORY,
      query: TEST_QUERY,
      recalledMemories: recall.results,
    });
  } catch (error) {
    console.error("Hindsight test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown Hindsight error",
      },
      { status: 500 },
    );
  }
}