import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { Pool } from 'pg';
import EmbeddedPostgres from 'embedded-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { runOnce } from '../src/server/intelligence/worker.ts';
import { AnalysisError, type Extraction } from '../src/server/intelligence/contract.ts';
import type { AIConfig } from '../src/server/intelligence/config.ts';
import type { Provider } from '../src/server/intelligence/provider.ts';
test(
  'durable intelligence processing with disposable PostgreSQL and fixture provider',
  { timeout: 120000 },
  async (t) => {
    const server = createServer();
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw Error('port');
    const port = address.port;
    await new Promise<void>((r) => server.close(() => r()));
    const password = randomBytes(24).toString('hex'),
      cluster = new EmbeddedPostgres({
        databaseDir: await mkdtemp(join(tmpdir(), 'growora-ai-')),
        port,
        user: 'ai_test',
        password,
        persistent: false,
        autoRehydrateSymlinks: true,
        onLog: () => {},
        onError: () => {},
      });
    await cluster.initialise();
    await cluster.start();
    const pool = new Pool({
      host: '127.0.0.1',
      port,
      user: 'ai_test',
      password,
      database: 'postgres',
      max: 8,
    });
    try {
      await migrate(drizzle(pool), { migrationsFolder: 'migrations' });
      await migrate(drizzle(pool), { migrationsFolder: 'migrations' });
      const w = randomUUID(),
        other = randomUUID(),
        form = randomUUID(),
        sample = JSON.parse(await readFile('tests/fixtures/intelligence-eval.json', 'utf8'))[0] as {
          input: string;
          fixture: Extraction;
        };
      await pool.query('INSERT INTO workspace(id,name) VALUES($1,$2),($3,$4)', [
        w,
        'Synthetic AI workspace',
        other,
        'Other workspace',
      ]);
      await pool.query(
        "INSERT INTO lead_form(id,workspace_id,public_id,name,privacy_notice) VALUES($1,$2,$3,'Synthetic form','Synthetic notice')",
        [form, w, randomBytes(24).toString('hex')],
      );
      const config: AIConfig = {
        key: 'fixture',
        model: 'fixture-model',
        policy: 'test-synthetic-only',
        workspaces: [w],
        timeoutMs: 1000,
        maxOutputTokens: 2000,
        dailyRequests: 100,
        concurrency: 2,
        maxAttempts: 3,
        inputRate: 1,
        outputRate: 2,
      };
      const provider: Provider = async () => ({
        data: structuredClone(sample.fixture),
        model: 'fixture-model',
        inputTokens: 100,
        outputTokens: 50,
        latencyMs: 3,
      });
      async function reset() {
        await pool.query('DELETE FROM lead');
        await pool.query('DELETE FROM lead_ai_usage');
      }
      async function enqueue() {
        const id = randomUUID();
        await pool.query(
          "INSERT INTO lead(id,workspace_id,source_form_id,customer_name,customer_email,subject,message,consent_notice) VALUES($1,$2,$3,'Synthetic person','synthetic@example.test','Synthetic', $4,'Notice')",
          [id, w, form, sample.input],
        );
        await pool.query('INSERT INTO lead_intelligence(lead_id,workspace_id) VALUES($1,$2)', [
          id,
          w,
        ]);
        await pool.query(
          'INSERT INTO lead_ai_job(workspace_id,lead_id,generation) VALUES($1,$2,1)',
          [w, id],
        );
        return id;
      }
      const row = async (id: string) =>
        (
          await pool.query('SELECT * FROM lead_ai_job WHERE lead_id=$1 ORDER BY generation DESC', [
            id,
          ])
        ).rows[0];
      const tick = (cfg: AIConfig | null = config, p: Provider = provider) =>
        runOnce(pool, cfg, p, 'test-secret-only');
      await t.test(
        'successful extraction, atomic result, version metadata, usage and unchanged original',
        async () => {
          await reset();
          const id = await enqueue();
          const before = (await pool.query('SELECT * FROM lead WHERE id=$1', [id])).rows[0];
          await tick();
          const j = await row(id);
          assert.equal(j.status, 'COMPLETED');
          assert.equal(j.result.scoring.value, 100);
          assert.equal(j.model, 'fixture-model');
          assert.equal(j.prompt_version, 'qualification-1');
          assert.equal(j.cost_usd, '0.0002');
          assert.deepEqual(
            (await pool.query('SELECT * FROM lead WHERE id=$1', [id])).rows[0],
            before,
          );
          assert.equal(
            (await pool.query('SELECT requests FROM lead_ai_usage')).rows[0].requests,
            1,
          );
          assert.equal(await tick(), false);
        },
      );
      await t.test(
        'concurrent workers claim once and preserve composite tenant integrity',
        async () => {
          await reset();
          const id = await enqueue();
          let calls = 0;
          await Promise.all(
            Array.from({ length: 6 }, () =>
              tick(config, async (...args) => {
                calls++;
                await new Promise((r) => setTimeout(r, 20));
                return provider(...args);
              }),
            ),
          );
          assert.equal(calls, 1);
          assert.equal((await row(id)).attempts, 1);
          await assert.rejects(
            pool.query('UPDATE lead_intelligence SET workspace_id=$1 WHERE lead_id=$2', [
              other,
              id,
            ]),
            /foreign key/,
          );
        },
      );
      await t.test(
        'missing policy/configuration never calls provider; resumed configured processing works',
        async () => {
          await reset();
          const id = await enqueue();
          let called = false;
          await tick(null, async () => {
            called = true;
            return provider('', config);
          });
          assert.equal(called, false);
          assert.equal((await row(id)).status, 'UNAVAILABLE');
          assert.equal((await row(id)).attempts, 0);
          await pool.query('UPDATE lead_ai_job SET available_at=now()');
          await tick({ ...config, workspaces: [other] }, async () => {
            called = true;
            return provider('', config);
          });
          assert.equal(called, false);
          await pool.query('UPDATE lead_ai_job SET available_at=now()');
          await tick();
          assert.equal((await row(id)).status, 'COMPLETED');
        },
      );
      await t.test(
        'retryable failure backs off; exhausted and invalid output fail permanently',
        async () => {
          await reset();
          const id = await enqueue();
          const failure: Provider = async () => {
            throw new AnalysisError('TIMEOUT', true);
          };
          for (let i = 1; i <= 3; i++) {
            await tick(config, failure);
            assert.equal((await row(id)).attempts, i);
            assert.equal((await row(id)).status, i === 3 ? 'FAILED' : 'PENDING');
            await pool.query('UPDATE lead_ai_job SET available_at=now()');
          }
          assert.equal(await tick(), false);
          await reset();
          const invalid = await enqueue();
          await tick(config, async () => ({
            ...(await provider('', config)),
            data: {} as Extraction,
          }));
          assert.equal((await row(invalid)).status, 'FAILED');
          assert.equal((await row(invalid)).error_code, 'INVALID_OUTPUT');
        },
      );
      await t.test(
        'expired lease recovers after restart; old worker cannot overwrite the new result',
        async () => {
          await reset();
          const id = await enqueue();
          let release!: () => void;
          const gate = new Promise<void>((r) => (release = r));
          let started!: () => void;
          const ready = new Promise<void>((r) => (started = r));
          const old = tick(config, async () => {
            started();
            await gate;
            return { ...(await provider('', config)), model: 'obsolete-worker' };
          });
          await ready;
          await pool.query(
            "UPDATE lead_ai_job SET lease_until=now()-interval '1 second' WHERE lead_id=$1",
            [id],
          );
          await tick();
          release();
          await old;
          assert.equal((await row(id)).model, 'fixture-model');
          assert.equal((await row(id)).attempts, 2);
        },
      );
      await t.test('shared concurrency and daily budget bound outbound requests', async () => {
        await reset();
        await enqueue();
        const b = await enqueue();
        let release!: () => void, started!: () => void;
        const gate = new Promise<void>((r) => (release = r)),
          ready = new Promise<void>((r) => (started = r));
        const first = tick({ ...config, concurrency: 1 }, async () => {
          started();
          await gate;
          return provider('', config);
        });
        await ready;
        assert.equal(await tick({ ...config, concurrency: 1 }), false);
        release();
        await first;
        await tick({ ...config, dailyRequests: 1 });
        const jobs = (await pool.query("SELECT * FROM lead_ai_job WHERE status='PENDING'")).rows;
        assert.equal(jobs.length, 1);
        assert.equal(jobs[0].error_code, 'DAILY_LIMIT');
        assert.equal((await pool.query('SELECT requests FROM lead_ai_usage')).rows[0].requests, 1);
        assert.ok(b);
      });
      await t.test(
        'deletion during processing cannot restore a deleted customer record',
        async () => {
          await reset();
          const id = await enqueue();
          let release!: () => void, started!: () => void;
          const gate = new Promise<void>((r) => (release = r)),
            ready = new Promise<void>((r) => (started = r));
          const running = tick(config, async () => {
            started();
            await gate;
            return provider('', config);
          });
          await ready;
          await pool.query('DELETE FROM lead WHERE id=$1', [id]);
          release();
          await running;
          assert.equal((await pool.query('SELECT * FROM lead_ai_job')).rowCount, 0);
          assert.equal((await pool.query('SELECT * FROM lead_intelligence')).rowCount, 0);
        },
      );
      await t.test(
        'result persistence failure rolls back and recovers through lease expiry',
        async () => {
          await reset();
          const id = await enqueue();
          await pool.query(
            "CREATE FUNCTION reject_result() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.status='COMPLETED' THEN RAISE EXCEPTION 'synthetic failure'; END IF; RETURN NEW; END $$",
          );
          await pool.query(
            'CREATE TRIGGER reject_result BEFORE UPDATE ON lead_intelligence FOR EACH ROW EXECUTE FUNCTION reject_result()',
          );
          try {
            await assert.rejects(tick(), /synthetic failure/);
          } finally {
            await pool.query('DROP TRIGGER reject_result ON lead_intelligence');
            await pool.query('DROP FUNCTION reject_result()');
          }
          assert.equal((await row(id)).result, null);
          await pool.query("UPDATE lead_ai_job SET lease_until=now()-interval '1 second'");
          await tick();
          assert.equal((await row(id)).status, 'COMPLETED');
        },
      );
    } finally {
      await pool.end();
      await cluster.stop();
    }
  },
);
