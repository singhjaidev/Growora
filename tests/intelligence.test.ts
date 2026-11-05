import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validateExtraction,
  score,
  AnalysisError,
  type Extraction,
} from '../src/server/intelligence/contract.ts';
import { openAIProvider, minimize } from '../src/server/intelligence/provider.ts';
import { configuration } from '../src/server/intelligence/config.ts';
const cases = JSON.parse(readFileSync('tests/fixtures/intelligence-eval.json', 'utf8')) as {
  id: string;
  input: string;
  fixture: Extraction;
  expected: { priority: string; missing: string[] };
}[];
const config = {
  key: 'fixture-only',
  model: 'fixture-model',
  policy: 'synthetic-test',
  workspaces: ['11111111-1111-1111-1111-111111111111'],
  timeoutMs: 10,
  maxOutputTokens: 2000,
  dailyRequests: 100,
  concurrency: 2,
  maxAttempts: 3,
  inputRate: 1,
  outputRate: 2,
};
for (const c of cases)
  test('fixture schema/scoring: ' + c.id, () => {
    const data = validateExtraction(c.fixture, c.input);
    assert.deepEqual(data.interpretation.missing, c.expected.missing);
    const result = score(data);
    assert.equal(result.label, c.expected.priority);
    assert.ok(result.value >= 0 && result.value <= 100);
    assert.deepEqual(result, score(structuredClone(data)));
  });
test('runtime validation rejects extra/missing fields, unsupported intent, ungrounded facts and urgency', () => {
  const valid = cases[0].fixture;
  for (const data of [
    null,
    {},
    { ...valid, extra: true },
    { ...valid, interpretation: { ...valid.interpretation, intent: 'EXECUTE' } },
    { ...valid, facts: { ...valid.facts, budget: 'invented money' } },
    {
      ...cases[1].fixture,
      interpretation: { ...cases[1].fixture.interpretation, urgency: 'URGENT' },
    },
    { ...cases[1].fixture, interpretation: { ...cases[1].fixture.interpretation, missing: [] } },
  ])
    assert.throws(() => validateExtraction(data, cases[0].input), AnalysisError);
});
test('priority threshold boundaries, missing features and review override', () => {
  const d = structuredClone(cases[0].fixture);
  assert.equal(score(d).value, 100);
  d.facts.budget = null;
  d.facts.quantity = null;
  d.facts.location = null;
  d.interpretation.urgency = 'NORMAL';
  assert.equal(score(d).value, 65);
  assert.equal(score(d).label, 'MEDIUM');
  d.facts.location = 'Mumbai';
  assert.equal(score(d).value, 70);
  assert.equal(score(d).label, 'HIGH');
  d.interpretation.intent = 'RESEARCH';
  d.facts.timeline = null;
  assert.equal(score(d).value, 40);
  assert.equal(score(d).label, 'MEDIUM');
  d.facts.location = null;
  assert.equal(score(d).value, 35);
  assert.equal(score(d).label, 'LOW');
  d.interpretation.warnings = ['Ambiguous requirement'];
  assert.equal(score(d).label, 'NEEDS_REVIEW');
});
test('provider adapter uses strict schema, no storage/tools, bounded output and minimized input', async () => {
  let request: Record<string, unknown> = {};
  const provider = openAIProvider(async (_url, init) => {
    request = JSON.parse(String(init?.body));
    assert.match(String((init?.headers as Record<string, string>).Authorization), /^Bearer /);
    return Response.json({
      status: 'completed',
      model: 'fixture',
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: JSON.stringify(cases[0].fixture) }],
        },
      ],
      usage: { input_tokens: 100, output_tokens: 80 },
    });
  });
  const result = await provider(cases[0].input, config);
  assert.equal(result.model, 'fixture');
  assert.equal(result.inputTokens, 100);
  assert.equal(request.store, false);
  assert.equal(request.max_output_tokens, 2000);
  assert.equal(request.tools, undefined);
  assert.ok(
    !minimize('Contact', 'email me at person@example.test or +91 9876543210').includes(
      'person@example.test',
    ),
  );
  assert.throws(() => minimize('x'.repeat(161), 'test'));
});
test('provider refuses malformed JSON, schema failures, refusals and partial outputs', async () => {
  for (const body of [
    { status: 'incomplete' },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] },
    {
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: '{}' }] }],
    },
  ]) {
    await assert.rejects(
      openAIProvider(async () => Response.json(body))(cases[0].input, config),
      AnalysisError,
    );
  }
});
test('provider timeout and retryable versus permanent HTTP failures', async () => {
  const hanging = openAIProvider(
    (_url, init) =>
      new Promise((_resolve, reject) =>
        init?.signal?.addEventListener('abort', () => reject(Error('aborted'))),
      ),
  );
  await assert.rejects(
    hanging(cases[0].input, config),
    (e: unknown) => e instanceof AnalysisError && e.code === 'TIMEOUT' && e.retryable,
  );
  for (const status of [401, 429, 500])
    await assert.rejects(
      openAIProvider(async () => new Response('', { status }))(cases[0].input, config),
      (e: unknown) => e instanceof AnalysisError && e.retryable === (status !== 401),
    );
});
test('configuration fails closed without credentials, workspace authorization or policy', () => {
  assert.equal(configuration({}), null);
  assert.equal(
    configuration({ AI_ENABLED: 'true', OPENAI_API_KEY: 'test', AI_MODEL: 'model' }),
    null,
  );
  assert.equal(
    configuration({
      AI_ENABLED: 'true',
      OPENAI_API_KEY: 'test',
      AI_MODEL: 'model',
      AI_PROCESSING_POLICY: 'ref',
      AI_APPROVED_WORKSPACE_IDS: '*',
    }),
    null,
  );
});
