import assert from "node:assert/strict";
import { test } from "node:test";
import { demoItems, seedDemo } from "../scripts/seed-demo.mjs";

test("seed is bank-guarded and replaces stable fixture documents", async () => {
  const stored = new Map();
  const client = {
    listDocuments: async () => ({}),
    retainBatch: async (bank, items) => {
      assert.equal(bank, "pacttrace-demo");
      for (const item of items) {
        assert.equal(item.update_mode, "replace");
        stored.set(item.document_id, item);
      }
      return { success: true, async: false, items_count: items.length };
    },
  };
  await assert.rejects(seedDemo(client, "pacttrace-dev"));
  await seedDemo(client, "pacttrace-demo");
  await seedDemo(client, "pacttrace-demo");
  assert.equal(stored.size, 3);
  assert.ok(demoItems.every(item => item.metadata.vendor === "CloudNova"));
});

test("seed creates a bank only after 404, never after authentication failure", async () => {
  let creates = 0;
  const client = {
    listDocuments: async () => { throw {statusCode: 401}; },
    createBank: async () => { creates++; },
    retainBatch: async () => ({success:true,async:false,items_count:3}),
  };
  await assert.rejects(seedDemo(client, "pacttrace-demo"));
  assert.equal(creates, 0);
  client.listDocuments = async () => { throw {statusCode:404}; };
  await seedDemo(client, "pacttrace-demo");
  assert.equal(creates, 1);
});


test("seed never writes after unavailable or unauthorized bank probes", async () => {
  for (const statusCode of [401, 403, 410, 429, 500, 503]) {
    let writes = 0;
    const client = {
      listDocuments: async (bank, options) => {
        assert.equal(bank, "pacttrace-demo");
        assert.equal(options.limit, 1);
        throw { statusCode };
      },
      createBank: async () => { writes++; },
      retainBatch: async () => { writes++; },
    };
    await assert.rejects(seedDemo(client, "pacttrace-demo"));
    assert.equal(writes, 0);
  }
});
