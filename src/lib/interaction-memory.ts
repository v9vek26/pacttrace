import "server-only";

import { randomUUID } from "node:crypto";
import type { MemoryItemInput } from "@vectorize-io/hindsight-client";
import type { Commitment, ExtractedCommitments } from "@/lib/commitments";
import { getHindsightBankId, getHindsightClient } from "@/lib/hindsight";
import type { InteractionInput } from "@/lib/interaction-input";

function commitmentMemory(vendor: string, commitment: Commitment): string {
  return [
    `Vendor ${vendor} commitment (${commitment.type}): ${commitment.description}`,
    commitment.value !== null ? `The committed value is ${commitment.value}.` : null,
    commitment.condition !== null ? `This commitment applies under this condition: ${commitment.condition}.` : null,
    commitment.deadline !== null ? `The deadline is ${commitment.deadline}.` : null,
    `The commitment status is ${commitment.status}.`,
  ].filter((part) => part !== null).join(" ");
}

export async function retainInteraction(
  input: InteractionInput,
  extracted: ExtractedCommitments,
) {
  const interactionId = randomUUID();
  const bankId = getHindsightBankId();
  const metadata = {
    vendor: input.vendor,
    source: input.source,
    interaction_id: interactionId,
  };
  const items: MemoryItemInput[] = [
    {
      content: `Original vendor interaction with ${input.vendor} (source: ${input.source}):\n\n${input.interaction}`,
      context: "vendor negotiation",
      document_id: `${interactionId}:interaction`,
      metadata: { ...metadata, memory_type: "vendor_interaction" },
    },
    ...extracted.commitments.map((commitment, index): MemoryItemInput => ({
      content: commitmentMemory(input.vendor, commitment),
      context: "vendor negotiation",
      document_id: `${interactionId}:commitment:${index}`,
      metadata: {
        ...metadata,
        memory_type: "vendor_commitment",
        commitment_type: commitment.type,
        status: commitment.status,
      },
    })),
  ];

  const result = await getHindsightClient().retainBatch(bankId, items, { async: false });
  // Do not claim retention if the provider only queued or partially accepted it.
  if (!result.success || result.async || result.items_count !== items.length) {
    throw new Error("Hindsight did not confirm the complete batch");
  }

  return {
    retained: true,
    bankId,
    interactionId,
    itemsCount: result.items_count,
    interactionCount: 1,
    commitmentCount: extracted.commitments.length,
  };
}
