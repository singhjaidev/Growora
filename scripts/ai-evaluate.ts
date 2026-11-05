import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { validateExtraction, score, type Extraction } from '../src/server/intelligence/contract.ts';
import { openAIProvider } from '../src/server/intelligence/provider.ts';
import { configuration } from '../src/server/intelligence/config.ts';
import nextEnv from '@next/env';
import { Pool } from 'pg';
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
const rows = JSON.parse(readFileSync('tests/fixtures/intelligence-eval.json', 'utf8')) as {
  id: string;
  input: string;
  fixture: Extraction;
  expected: { priority: string; missing: string[] };
}[];
const live = process.argv.includes('--live'),
  config = configuration();
if (live && !config)
  throw Error(
    'Live evaluation requires explicit provider and processing configuration. Nothing sent.',
  );
const results = [];
if (live && !process.env.DATABASE_URL)
  throw Error('Live evaluation requires DATABASE_URL for shared usage limits. Nothing sent.');
const pool = live
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 5000 })
  : null;
async function evaluate(input: string) {
  if (!pool || !config) return null;
  const c = await pool.connect();
  try {
    // Explicit live evaluations are serial and exclude worker claims while holding this session lock.
    await c.query('SELECT pg_advisory_lock(58419305)');
    const active = await c.query(
      "SELECT count(*)::int n FROM lead_ai_job WHERE status='PROCESSING' AND lease_until>now()",
    );
    if (active.rows[0].n) throw Error('Workers busy');
    await c.query(
      "INSERT INTO lead_ai_usage(day) VALUES((now() AT TIME ZONE 'UTC')::date) ON CONFLICT DO NOTHING",
    );
    const reserved = await c.query(
      "UPDATE lead_ai_usage SET requests=requests+1 WHERE day=(now() AT TIME ZONE 'UTC')::date AND requests<$1 RETURNING day",
      [config.dailyRequests],
    );
    if (!reserved.rowCount) throw Error('Daily limit');
    const result = await openAIProvider()(input, config);
    await c.query(
      'UPDATE lead_ai_usage SET input_tokens=input_tokens+$1,output_tokens=output_tokens+$2 WHERE day=$3',
      [result.inputTokens ?? 0, result.outputTokens ?? 0, reserved.rows[0].day],
    );
    return result;
  } finally {
    try {
      await c.query('SELECT pg_advisory_unlock(58419305)');
    } finally {
      c.release();
    }
  }
}
for (const row of rows) {
  const start = Date.now();
  try {
    const response = live ? await evaluate(row.input) : null;
    const data = validateExtraction(response?.data ?? row.fixture, row.input),
      scoring = score(data);
    results.push({
      id: row.id,
      schemaValid: true,
      priority: scoring.label,
      expectedPriority: row.expected.priority,
      priorityMatch: scoring.label === row.expected.priority,
      missingMatch: row.expected.missing.every((k) => data.interpretation.missing.includes(k)),
      factsMatch: Object.entries(row.fixture.facts).every(
        ([k, v]) => JSON.stringify(data.facts[k as keyof typeof data.facts]) === JSON.stringify(v),
      ),
      deterministic: JSON.stringify(scoring) === JSON.stringify(score(data)),
      latencyMs: Date.now() - start,
      inputTokens: response?.inputTokens ?? null,
      outputTokens: response?.outputTokens ?? null,
      estimatedCostUsd:
        response &&
        response.inputTokens !== null &&
        response.outputTokens !== null &&
        config?.inputRate !== null &&
        config?.outputRate !== null &&
        config
          ? (response.inputTokens * config.inputRate + response.outputTokens * config.outputRate) /
            1000000
          : null,
    });
  } catch {
    results.push({ id: row.id, schemaValid: false, failed: true, latencyMs: Date.now() - start });
  }
}
await pool?.end();
const report = {
  mode: live ? 'LIVE_SYNTHETIC' : 'MOCKED_FIXTURES_NOT_MODEL_ACCURACY',
  cases: results.length,
  results,
};
mkdirSync('test-results/phase5', { recursive: true });
writeFileSync('test-results/phase5/evaluation.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (results.some((r) => !r.schemaValid || !r.priorityMatch || !r.missingMatch || !r.factsMatch))
  process.exitCode = 1;
