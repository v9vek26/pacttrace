import "server-only";

import { z } from "zod";

export const extractionInputSchema = z.object({
  vendor: z.string().trim().min(1).max(200),
  interaction: z.string().trim().min(1).max(50_000),
});

export const interactionInputSchema = extractionInputSchema.extend({
  vendor: z.string().trim().min(1).max(200),
  // Validate whitespace without changing the original text saved in memory.
  interaction: z.string().max(50_000).refine((text) => text.trim().length > 0),
  source: z.string().trim().min(1).max(100),
});

export type InteractionInput = z.infer<typeof interactionInputSchema>;
