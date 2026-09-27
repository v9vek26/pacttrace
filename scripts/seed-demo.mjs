import { HindsightClient } from "@vectorize-io/hindsight-client";

// Fixture text is intentional demo input, not a simulated model response.
export const demoItems = [
  { content: "CloudNova agreed to waive the onboarding fee and promised a 15% renewal discount if the account exceeds 100 seats.", type: "vendor_interaction", commitment: "none" },
  { content: "CloudNova promised to waive the onboarding fee.", type: "vendor_commitment", commitment: "fee_waiver" },
  { content: "CloudNova promised a 15% renewal discount if the account exceeds 100 seats.", type: "vendor_commitment", commitment: "discount" },
].map((item, index) => ({
  content: item.content,
  context: "vendor negotiation",
  document_id: `pacttrace-demo-v1:${index}`,
  update_mode: "replace",
  metadata: { vendor: "CloudNova", memory_type: item.type, commitment_type: item.commitment, source: "intentional_demo_seed" },
}));

export async function seedDemo(client, bankId) {
  if (bankId !== "pacttrace-demo") throw new Error("Demo bank confirmation required");
  try {
    await client.getBankProfile(bankId);
  } catch (error) {
    if (error?.statusCode !== 404) throw error;
    await client.createBank(bankId, { name: "PactTrace Demo" });
  }
  const result = await client.retainBatch(bankId, demoItems, { async: false });
  if (!result.success || result.async || result.items_count !== demoItems.length) {
    throw new Error("Seed retention unconfirmed");
  }
}

// Importing the module for tests never loads environment files or runs a seed.
if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  if (!process.argv.includes("--confirm-bank=pacttrace-demo")) {
    console.log("Dry run: 3 fixed demo documents. Manually configure HINDSIGHT_BANK_ID=pacttrace-demo, then run pnpm demo:seed --confirm-bank=pacttrace-demo. Existing fixture documents are replaced; other documents are untouched.");
  } else {
    try {
      // Existing process variables take precedence; never print any values.
      if ((await import("node:fs")).existsSync(".env.local")) process.loadEnvFile(".env.local");
      if (process.env.HINDSIGHT_BANK_ID !== "pacttrace-demo" || !process.env.HINDSIGHT_API_KEY || !process.env.HINDSIGHT_BASE_URL) {
        throw new Error("Missing configuration or wrong demo bank");
      }
      const client = new HindsightClient({ baseUrl: process.env.HINDSIGHT_BASE_URL, apiKey: process.env.HINDSIGHT_API_KEY });
      await seedDemo(client, process.env.HINDSIGHT_BANK_ID);
      console.log("Demo seed confirmed: 3 documents retained in pacttrace-demo.");
    } catch {
      console.error("Demo seed failed. Check bank selection and provider configuration privately; retention may be unconfirmed. No bank was reset.");
      process.exitCode = 1;
    }
  }
}
