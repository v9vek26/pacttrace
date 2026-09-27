import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

// Exercise actual service/route code with provider boundaries stubbed. No keys
// are loaded, and no real Hindsight reads or writes are made by this suite.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRequire = createRequire(path.join(root, "package.json"));
const memory = {
  id: "discount-memory",
  text: "ExampleVendor promised a 15% renewal discount if the account exceeds 100 seats.",
  metadata: { vendor: "ExampleVendor" },
};
const input = {
  vendor: "ExampleVendor",
  quote: "Renewal for 130 seats. No renewal discount is included.",
  source: "renewal_quote",
};
const comparison = {
  summary: "The renewal discount may be missing.",
  conflicts: [{
    memoryId: memory.id, type: "discount_missing", title: "Renewal discount may be missing",
    historicalCommitment: memory.text, currentEvidence: input.quote,
    condition: "account exceeds 100 seats", conditionStatus: "met",
    status: "potential_conflict", severity: "high",
    explanation: "The quote explicitly excludes the discount and the seat condition is met.",
  }],
  recommendation: "Ask the vendor to clarify and apply the promised discount.",
};

function setup({ results = [memory], answer = comparison, recallError = false, groqError = false, retainError = false, receipt = null } = {}) {
  const calls = { recall: [], groq: [], delays: [], retain: [] };
  const stubs = {
    "server-only": {},
    "next/server": { NextResponse: Response },
    "node:timers/promises": { setTimeout: async (ms) => { calls.delays.push(ms); } },
    "@/lib/groq": {
      GROQ_MODEL: "openai/gpt-oss-120b",
      getGroqClient: () => ({ chat: { completions: { create: async (...args) => {
        calls.groq.push(args);
        const failure = typeof groqError === "function" ? groqError(calls.groq.length) : groqError;
        if (failure) throw typeof failure === "boolean" ? new Error("PRIVATE_PROVIDER_DETAILS") : failure;
        const generated = typeof answer === "function" ? answer(calls.groq.length) : answer;
        return { choices: [{ message: { content: typeof generated === "string" ? generated : JSON.stringify(generated) } }] };
      } } } }),
    },
    "@/lib/hindsight": {
      getHindsightBankId: () => "test-bank",
      getHindsightClient: () => ({ retainBatch: async (...args) => {
        calls.retain.push(args);
        if (retainError) throw new Error("PRIVATE_PROVIDER_DETAILS");
        return receipt ?? { success: true, async: false, items_count: args[1].length };
      }, recall: async (...args) => {
        calls.recall.push(args);
        if (recallError) throw new Error("PRIVATE_PROVIDER_DETAILS");
        return { results };
      } }),
    },
  };
  const cache = new Map();
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative);
    const source = fs.readFileSync(path.join(root, relative), "utf8");
    const js = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    } }).outputText;
    const loadedModule = { exports: {} };
    const localRequire = (name) => {
      if (name in stubs) return stubs[name];
      if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
      return projectRequire(name);
    };
    const fakeProcess = { env: { HINDSIGHT_API_KEY: "PRIVATE_PROVIDER_DETAILS", HINDSIGHT_BASE_URL: "https://example.invalid", GROQ_API_KEY: "PRIVATE_PROVIDER_DETAILS" } };
    vm.runInThisContext(`(function(require,module,exports,process){${js}\n})`, { filename: relative })(localRequire, loadedModule, loadedModule.exports, fakeProcess);
    cache.set(relative, loadedModule.exports);
    return loadedModule.exports;
  }
  const post = load("src/app/api/analyze-quote/route.ts").POST;
  return { calls, load, async request(body = input, raw = false) {
    const response = await post(new Request("http://localhost/api/analyze-quote", {
      method: "POST", headers: { "content-type": "application/json" },
      body: raw ? body : JSON.stringify(body),
    }));
    return { status: response.status, body: await response.json() };
  } };
}

test("invalid JSON, types, blank fields and length limits fail before providers", async () => {
  const app = setup();
  assert.equal((await app.request("{", true)).status, 400);
  for (const body of [null, [], {}, ...[
    { vendor: 9 }, { vendor: " " }, { quote: " " }, { source: null },
    { vendor: "x".repeat(201) }, { quote: "x".repeat(50001) }, { source: "x".repeat(101) },
  ].map(change => ({ ...input, ...change }))]) {
    assert.equal((await app.request(body)).status, 400);
  }
  assert.equal(app.calls.recall.length, 0);
  assert.equal(app.calls.groq.length, 0);
});

test("vendor filtering rejects unrelated and unlabelled memories and deduplicates", async () => {
  const app = setup({ results: [memory, memory,
    { ...memory, id: "other", metadata: { vendor: "AnotherVendor" } },
    { ...memory, id: "unlabelled", metadata: null },
    { ...memory, id: "prefix", metadata: { vendor: "ExampleVendor Plus" } },
    { ...memory, id: "empty", text: " " },
  ] });
  const result = await app.request({ ...input, vendor: " examplevendor " });
  assert.equal(result.status, 200);
  assert.equal(result.body.memoryCount, 1);
  assert.equal(result.body.vendor, "examplevendor");
  const request = app.calls.groq[0][0];
  assert.deepEqual(JSON.parse(request.messages[1].content).memories, [{ id: memory.id, text: memory.text }]);
  assert.equal(request.response_format.json_schema.strict, true);
  assert.equal(request.model, "openai/gpt-oss-120b");
  assert.match(app.calls.recall[0][1], /examplevendor/);
});

test("no vendor memories returns a clean result without calling Groq", async () => {
  const app = setup({ results: [{ ...memory, metadata: { vendor: "WrongVendor" } }] });
  const result = await app.request();
  assert.equal(result.status, 200);
  assert.equal(result.body.analysisStatus, "no_memories");
  assert.equal(result.body.memoryCount, 0);
  assert.equal(result.body.model, null);
  assert.deepEqual(result.body.conflicts, []);
  assert.equal(app.calls.groq.length, 0);
});

test("grounded conflict returned with actual memory count and no guessed financial impact", async () => {
  const app = setup();
  const result = await app.request();
  assert.equal(result.status, 200);
  assert.equal(result.body.analysisStatus, "analyzed");
  assert.equal(result.body.memoryCount, 1);
  assert.deepEqual(result.body.conflicts, comparison.conflicts);
  assert.equal(result.body.financialImpact, null);
});

test("provider errors are sanitized and recall failures prevent Groq calls", async () => {
  for (const stage of ["recall", "analysis"]) {
    const app = setup({ recallError: stage === "recall", groqError: stage === "analysis" });
    const result = await app.request();
    assert.equal(result.status, 502);
    assert.equal(result.body.stage, stage);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_PROVIDER_DETAILS/);
    if (stage === "recall") assert.equal(app.calls.groq.length, 0);
  }
});

test("malformed and schema-invalid responses are rejected", async () => {
  for (const answer of ["", "{", "null", "{}", { ...comparison, conflicts: [{ ...comparison.conflicts[0], status: "violated" }] }]) {
    assert.equal((await setup({ answer }).request()).status, 502);
  }
});

test("invented historical, quote, condition or memory ID evidence is rejected", async () => {
  for (const change of [
    { memoryId: "invented" }, { historicalCommitment: "A 50% discount was promised" },
    { currentEvidence: "The price is 400000" }, { condition: "unconditional" },
    { historicalCommitment: " " }, { currentEvidence: "" },
  ]) {
    const answer = { ...comparison, conflicts: [{ ...comparison.conflicts[0], ...change }] };
    assert.equal((await setup({ answer }).request()).status, 502);
  }
});

test("unknown and unmet conditions cannot become conflicts or honored promises", async () => {
  for (const conditionStatus of ["unknown", "not_met"]) {
    const conflict = { ...comparison.conflicts[0], conditionStatus };
    assert.equal((await setup({ answer: { ...comparison, conflicts: [conflict] } }).request()).status, 502);
    const answer = { ...comparison, conflicts: [{ ...conflict, status: "insufficient_evidence", severity: "low" }] };
    assert.equal((await setup({ answer }).request()).status, 200);
  }
});

test("unconditional, honored and irrelevant-memory comparisons are supported", async () => {
  for (const conflicts of [[], [{ ...comparison.conflicts[0], condition: null, conditionStatus: "not_applicable" }],
    [{ ...comparison.conflicts[0], status: "honored", severity: "low" }]]) {
    assert.equal((await setup({ answer: { ...comparison, conflicts } }).request()).status, 200);
  }
});

test("invalid evidence gets one correction attempt without relaxing validation", async () => {
  const bad = { ...comparison, conflicts: [{ ...comparison.conflicts[0], currentEvidence: "invented" }] };
  const app = setup({ answer: (attempt) => attempt === 1 ? bad : comparison });
  assert.equal((await app.request()).status, 200);
  assert.equal(app.calls.groq.length, 2);
  const failing = setup({ answer: bad });
  const result = await failing.request();
  assert.equal(result.status, 502);
  assert.equal(result.body.code, "invalid_analysis");
  assert.equal(failing.calls.groq.length, 2);
});

test("structured-generation errors receive one correction; rate limits are bounded", async () => {
  for (const error of [{ code: "json_validate_failed" }, { error: { code: "json_validate_failed" } }]) {
    const app = setup({ groqError: { status: 400, error } });
    assert.equal((await app.request()).body.code, "invalid_analysis");
    assert.equal(app.calls.groq.length, 2);
  }
  const app = setup({ groqError: { status: 429, error: { code: "rate_limit_exceeded" } } });
  const result = await app.request();
  assert.equal(result.status, 502);
  assert.equal(result.body.code, "analysis_provider_failure");
  assert.equal(result.body.upstreamStatus, 429);
  assert.equal(app.calls.groq.length, 3);
  assert.equal(result.body.retryCount, 2);
  assert.deepEqual(app.calls.delays, [1000, 2000]);
});

test("429 then success respects Retry-After without exposing headers", async () => {
  const app = setup({ groqError: n => n === 1 ? { status: 429, headers: new Headers({ "Retry-After": "0.25", "x-secret": "PRIVATE_PROVIDER_DETAILS" }) } : false });
  const result = await app.request();
  assert.equal(result.status, 200);
  assert.equal(result.body.retryCount, 1);
  assert.deepEqual(app.calls.delays, [250]);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_PROVIDER_DETAILS/);
});

test("long cooldown fails rather than retrying early; malformed header uses backoff", async () => {
  const long = setup({ groqError: { status: 429, headers: new Headers({ "retry-after": "120" }) } });
  assert.equal((await long.request()).status, 502);
  assert.equal(long.calls.groq.length, 1);
  assert.deepEqual(long.calls.delays, []);
  const malformed = setup({ groqError: n => n === 1 ? { status: 429, headers: new Headers({ "retry-after": "garbage" }) } : false });
  assert.equal((await malformed.request()).status, 200);
  assert.deepEqual(malformed.calls.delays, [1000]);
});

test("HTTP date Retry-After and transient 503 retries work; normal 400 is not retried", async () => {
  const retryDate = new Date(Date.now() + 3000).toUTCString();
  const app = setup({ groqError: n => n === 1 ? { status: 503, headers: new Headers({ "retry-after": retryDate }) } : false });
  assert.equal((await app.request()).status, 200);
  assert.ok(app.calls.delays[0] >= 0 && app.calls.delays[0] <= 3000);
  const bad = setup({ groqError: { status: 400 } });
  assert.equal((await bad.request()).status, 502);
  assert.equal(bad.calls.groq.length, 1);
});

test("provider retry budget is shared across the structured correction", async () => {
  const app = setup({ groqError: n => [1, 3, 4].includes(n) ? { status: 429 } : false, answer: "{}" });
  const result = await app.request();
  assert.equal(result.status, 502);
  assert.equal(result.body.retryCount, 2);
  assert.equal(app.calls.groq.length, 4);
});

test("at most five minimal, deduplicated memories retain original IDs and distinct conditions", async () => {
  const results = [memory, { ...memory, id: "duplicate", text: memory.text + " | When: 2026-09-27" },
    ...Array.from({length: 7}, (_, i) => ({...memory, id: `extra-${i}`, text: `ExampleVendor promised delivery within ${i + 1} days.`}))];
  const app = setup({ results });
  const result = await app.request();
  const payload = JSON.parse(app.calls.groq[0][0].messages[1].content);
  assert.equal(result.body.memoryCount, 9);
  assert.equal(result.body.memoriesUsed, 5);
  assert.equal(payload.memories.length, 5);
  assert.equal(payload.memories[0].id, memory.id);
  assert.ok(payload.memories.every(m => Object.keys(m).sort().join() === "id,text"));
  assert.ok(payload.memories.every(m => m.id !== "duplicate"));
});

test("health and read-only connectivity expose no configuration values or writes", async () => {
  const app = setup();
  const health = await app.load("src/app/api/health/route.ts").GET();
  assert.deepEqual(await health.json(), { app: "ok", hindsightConfigured: true, groqConfigured: true });
  const check = await app.load("src/app/api/hindsight-test/route.ts").GET();
  assert.equal(check.status, 200);
  assert.deepEqual(app.calls.retain, []);
  const failure = setup({ recallError: true });
  const response = await failure.load("src/app/api/hindsight-test/route.ts").GET();
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /PRIVATE_PROVIDER_DETAILS/);
});

const extraction = { vendor: "ExampleVendor", summary: "Discount promised", commitments: [{type: "discount", description: "15% renewal discount", value: "15%", condition: "over 100 seats", deadline: null, status: "promised"}] };
const interaction = { vendor: "ExampleVendor", interaction: "A discount was promised.", source: "meeting" };
async function postRoute(app, name, body, raw = false) {
  const response = await app.load(`src/app/api/${name}/route.ts`).POST(new Request("http://localhost/api/test", {
    method: "POST", body: raw ? body : JSON.stringify(body),
  }));
  return { status: response.status, body: await response.json() };
}

test("interaction and extraction validate before any provider call", async () => {
  const app = setup();
  for (const route of ["interactions", "extract-commitment"]) {
    assert.equal((await postRoute(app, route, "{", true)).status, 400);
    for (const body of [null, {}, { ...interaction, vendor: " " }, { ...interaction, interaction: " " }, { ...interaction, interaction: "x".repeat(50001) }]) {
      assert.equal((await postRoute(app, route, body)).status, 400);
    }
  }
  assert.equal(app.calls.groq.length, 0);
  assert.equal(app.calls.retain.length, 0);
});

test("interactions retain actual text and each extracted commitment with vendor metadata", async () => {
  const app = setup({ answer: extraction });
  const result = await postRoute(app, "interactions", interaction);
  assert.equal(result.status, 200);
  assert.equal(result.body.memory.itemsCount, 2);
  const items = app.calls.retain[0][1];
  assert.ok(items[0].content.includes(interaction.interaction));
  assert.ok(items.every(m => m.metadata.vendor === interaction.vendor && m.context === "vendor negotiation"));
  assert.equal(items[1].metadata.commitment_type, "discount");
});

test("provider and incomplete retention errors are sanitized and never claim success", async () => {
  for (const options of [{groqError: true}, {retainError: true}, {receipt:{success:true,async:true,items_count:2}}, {receipt:{success:true,async:false,items_count:1}}]) {
    const app = setup({ answer: extraction, ...options });
    const result = await postRoute(app, "interactions", interaction);
    assert.equal(result.status, 502);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_PROVIDER_DETAILS/);
    if (!options.groqError) assert.equal(result.body.memory.retained, null);
  }
});

test("malformed extraction is rejected before retention; empty extraction retains interaction", async () => {
  const invalid = setup({ answer: { ...extraction, commitments: [{}] } });
  assert.equal((await postRoute(invalid, "interactions", interaction)).status, 502);
  assert.equal(invalid.calls.retain.length, 0);
  const empty = setup({ answer: { ...extraction, commitments: [] } });
  assert.equal((await postRoute(empty, "interactions", interaction)).body.memory.itemsCount, 1);
});
