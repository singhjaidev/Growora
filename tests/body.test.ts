import test from 'node:test';
import assert from 'node:assert/strict';
import { readFields, RequestSizeError } from '../src/server/auth/body.ts';
const req = (body: ReadableStream<Uint8Array> | string) =>
  new Request('http://localhost', { method: 'POST', body, duplex: 'half' } as RequestInit);
test('body parsing accepts objects and rejects invalid or oversized data', async () => {
  assert.deepEqual(await readFields(req('{"name":"Example"}')), { name: 'Example' });
  for (const input of ['null', '[]', '1', 'bad']) await assert.rejects(readFields(req(input)));
  await assert.rejects(readFields(req('{"a":"12345"}'), 5), RequestSizeError);
});
test('stalled body is bounded and its stream is cancelled', async () => {
  let cancelled = false;
  const request = req(
    new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode('{'));
      },
      cancel() {
        cancelled = true;
      },
    }),
  );
  const result = await Promise.race([
    // A short injected deadline makes the production stream behavior deterministic in tests.
    (readFields as (r: Request, n: number, ms: number) => Promise<unknown>)(request, 4096, 30).then(
      () => 'accepted',
      () => 'rejected',
    ),
    new Promise<string>((r) => setTimeout(() => r('hung'), 150)),
  ]);
  if (result === 'hung') await request.body?.cancel().catch(() => {});
  assert.equal(result, 'rejected');
  assert.equal(cancelled, true);
});
