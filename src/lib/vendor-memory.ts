import "server-only";

import { getHindsightBankId, getHindsightClient } from "@/lib/hindsight";

export interface VendorMemory {
  id: string;
  text: string;
}

const normalizeVendor = (vendor: string) =>
  vendor.normalize("NFKC").trim().toLowerCase();

const normalizeMemoryText = (text: string) =>
  text
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export async function recallVendorMemories(
  vendor: string,
  quote: string,
): Promise<VendorMemory[]> {
  const response = await getHindsightClient().recall(
    getHindsightBankId(),
    `Recall previous commitments, discounts, pricing promises, fee waivers, conditions, and negotiation history involving vendor ${JSON.stringify(
      vendor,
    )} relevant to this new quote:\n${quote}`,
    {
      types: ["world", "experience"],
      maxTokens: 4_000,
      budget: "mid",
      signal: AbortSignal.timeout(60_000),
    },
  );

  const normalizedVendor = normalizeVendor(vendor);
  const seen = new Set<string>();

  return response.results.flatMap((memory): VendorMemory[] => {
    // Recall query wording is not an isolation boundary.
    // Require the vendor metadata written by PactTrace's retention flow.
    const owner = memory.metadata?.vendor;

    if (
      !owner ||
      normalizeVendor(owner) !== normalizedVendor ||
      !memory.text.trim()
    ) {
      return [];
    }

    // Remove duplicate memories while preserving Hindsight's relevance order.
    const normalizedText = normalizeMemoryText(memory.text);

    if (seen.has(normalizedText)) {
      return [];
    }

    seen.add(normalizedText);

    return [
      {
        id: memory.id,
        text: memory.text.trim(),
      },
    ];
  });
}