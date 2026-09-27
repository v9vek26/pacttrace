import "server-only";

import { setTimeout as delay } from "node:timers/promises";

export interface GroqRetryState {
  retryCount: number;
}

const MAX_RETRIES = 2;
const MAX_DELAY_MS = 5_000;

function retryAfterMs(error: object): number | null {
  if (!("headers" in error) || !(error.headers instanceof Headers)) return null;
  const value = error.headers.get("retry-after")?.trim();
  if (!value) return null;
  if (/^\d+(?:\.\d+)?$/.test(value)) return Number(value) * 1000;
  if (/^[+-]?[\d.]+$/.test(value)) return null;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
}

/** Retry rate limits/transient server failures; share the correction budget. */
export async function withGroqRetry<T>(
  operation: () => Promise<T>,
  state: GroqRetryState = { retryCount: 0 },
): Promise<T> {
  for (;;) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (typeof error !== "object" || error === null || !("status" in error) ||
        typeof error.status !== "number" ||
        !(error.status === 429 || [500, 502, 503, 504].includes(error.status)) ||
        state.retryCount >= MAX_RETRIES) throw error;

      const waitMs = retryAfterMs(error) ?? 1000 * 2 ** state.retryCount;
      // A long provider cooldown must not be shortened: return the sanitized
      // failure instead of tying up the request or retrying before it expires.
      if (!Number.isFinite(waitMs) || waitMs > MAX_DELAY_MS) throw error;
      await delay(waitMs);
      state.retryCount++;
    }
  }
}
