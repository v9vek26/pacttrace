import "server-only";

import { HindsightClient } from "@vectorize-io/hindsight-client";

let hindsightClient: HindsightClient | null = null;

export function getHindsightClient() {
  if (!process.env.HINDSIGHT_API_KEY) {
    throw new Error("HINDSIGHT_API_KEY is missing");
  }

  if (!process.env.HINDSIGHT_BASE_URL) {
    throw new Error("HINDSIGHT_BASE_URL is missing");
  }

  if (!hindsightClient) {
    hindsightClient = new HindsightClient({
      baseUrl: process.env.HINDSIGHT_BASE_URL,
      apiKey: process.env.HINDSIGHT_API_KEY,
    });
  }

  return hindsightClient;
}

export function getHindsightBankId() {
  return process.env.HINDSIGHT_BANK_ID || "pacttrace-dev";
}