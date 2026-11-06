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
import { runRoutingOnce } from '../src/server/routing/worker.ts';
import { defaultPolicy } from '../src/server/routing/engine.ts';
import { context } from '../src/server/routing/context.ts';
import { spawn } from 'node:child_process';
test('routing with real disposable PostgreSQL', { timeout: 120000 }, async (t) => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('port');
  const port = address.port;
  await new Promise<void>((r) => server.close(() => r()));
  const password = randomBytes(24).toString('hex');
  const cluster = new EmbeddedPostgres({
    databaseDir: await mkdtemp(join(tmpdir(), 'growora-routing-')),
    port,
    user: 'routing_test',
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
    user: 'routing_test',
    password,
    database: 'postgres',
    max: 10,
  });
  try {
    await migrate(drizzle(pool), { migrationsFolder: 'migrations' });
    await migrate(drizzle(pool), { migrationsFolder: 'migrations' });
    const w = randomUUID(),
      other = randomUUID(),
      form = randomUUID();
    await pool.query(
      "INSERT INTO workspace(id,name) VALUES($1,'Routing fixture'),($2,'Other tenant')",
      [w, other],
    );
    for (const id of ['a', 'b', 'foreign']) {
      await pool.query('INSERT INTO auth_user(id,name,email) VALUES($1,$1,$2)', [
        id,
        id + '@example.test',
      ]);
      await pool.query(
        "INSERT INTO workspace_membership(workspace_id,user_id,role) VALUES($1,$2,'MEMBER')",
        [id === 'foreign' ? other : w, id],
      );
    }
    await pool.query(
      "INSERT INTO lead_form(id,workspace_id,public_id,name,privacy_notice) VALUES($1,$2,$3,'Fixture','Notice')",
      [form, w, randomBytes(24).toString('hex')],
    );
    const rules = { ...defaultPolicy, formSkills: [{ formId: form, skill: 'packaging' }] };
    await pool.query(
      "INSERT INTO routing_policy(workspace_id,enabled,strategy,rules) VALUES($1,true,'ROUND_ROBIN',$2)",
      [w, JSON.stringify(rules)],
    );
    async function reset() {
      await pool.query('DELETE FROM lead');
      await pool.query('DELETE FROM member_routing_profile');
      await pool.query(
        "INSERT INTO workspace_membership(workspace_id,user_id,role) VALUES($1,'a','MEMBER'),($1,'b','MEMBER') ON CONFLICT DO NOTHING",
        [w],
      );
      await pool.query(
        "INSERT INTO member_routing_profile(workspace_id,user_id,eligible,available,capacity,skills) VALUES($1,'a',true,true,10,'[\"packaging\"]'),($1,'b',true,true,10,'[\"software\"]'),($2,'foreign',true,true,100,'[\"packaging\"]')",
        [w, other],
      );
      await pool.query(
        "UPDATE routing_policy SET enabled=true,strategy='ROUND_ROBIN',version=1,rules=$2 WHERE workspace_id=$1",
        [w, JSON.stringify(rules)],
      );
    }
    async function enqueue() {
      const id = randomUUID();
      await pool.query(
        "INSERT INTO lead(id,workspace_id,source_form_id,customer_name,customer_email,subject,message,consent_notice,routing_state) VALUES($1,$2,$3,'Fixture','fixture@example.test','Packaging','Packaging enquiry','Notice','PENDING')",
        [id, w, form],
      );
      await pool.query('INSERT INTO routing_job(workspace_id,lead_id,revision) VALUES($1,$2,0)', [
        w,
        id,
      ]);
      return id;
    }
    const tick = () => runRoutingOnce(pool);
    const lead = async (id: string) =>
      (await pool.query('SELECT * FROM lead WHERE id=$1', [id])).rows[0];
    const job = async (id: string) =>
      (await pool.query('SELECT * FROM routing_job WHERE lead_id=$1', [id])).rows[0];
    const decision = async (id: string) =>
      (await pool.query('SELECT * FROM routing_decision WHERE lead_id=$1', [id])).rows[0];
    async function claimed(id: string) {
      for (let n = 0; n < 100; n++) {
        if ((await job(id)).status === 'PROCESSING') return;
        await new Promise((r) => setTimeout(r, 10));
      }
      throw Error('worker did not claim');
    }
    await t.test(
      'persistent round robin and atomic history survive separate worker calls',
      async () => {
        await reset();
        const selected = [];
        for (let n = 0; n < 4; n++) {
          const id = await enqueue();
          await tick();
          selected.push((await lead(id)).assigned_to_user_id);
          assert.equal((await decision(id)).policy_version, 1);
        }
        assert.deepEqual(selected, ['a', 'b', 'a', 'b']);
        assert.equal(
          (
            await pool.query(
              "SELECT count(*)::int n FROM lead_activity WHERE action='AUTO_ASSIGNED'",
            )
          ).rows[0].n,
          4,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT count(*)::int n FROM workspace_audit WHERE event='routing.decided'",
            )
          ).rows[0].n,
          4,
        );
      },
    );
    await t.test(
      'concurrent duplicate delivery commits only one assignment and decision',
      async () => {
        await reset();
        const id = await enqueue();
        await Promise.all(Array.from({ length: 6 }, tick));
        assert.equal((await job(id)).attempts, 1);
        assert.equal(
          (await pool.query('SELECT count(*)::int n FROM routing_decision WHERE lead_id=$1', [id]))
            .rows[0].n,
          1,
        );
        assert.equal(await tick(), false);
        await assert.rejects(
          pool.query('INSERT INTO routing_job(workspace_id,lead_id,revision) VALUES($1,$2,0)', [
            w,
            id,
          ]),
        );
        await assert.rejects(
          pool.query('INSERT INTO routing_job(workspace_id,lead_id,revision) VALUES($1,$2,1)', [
            other,
            id,
          ]),
        );
      },
    );
    await t.test('capacity race never overassigns and never chooses a foreign member', async () => {
      await reset();
      await pool.query(
        "UPDATE member_routing_profile SET capacity=1,eligible=(user_id='a') WHERE workspace_id=$1",
        [w],
      );
      const ids = await Promise.all([enqueue(), enqueue(), enqueue()]);
      await Promise.all([tick(), tick(), tick()]);
      const rows = await Promise.all(ids.map(lead));
      assert.equal(rows.filter((x) => x.assigned_to_user_id === 'a').length, 1);
      assert.equal(rows.filter((x) => x.routing_state === 'REVIEW').length, 2);
    });
    await t.test(
      'skill mapping works without AI and unavailable specialists go to review',
      async () => {
        await reset();
        await pool.query("UPDATE routing_policy SET strategy='SKILL'");
        const id = await enqueue();
        await tick();
        assert.equal((await lead(id)).assigned_to_user_id, 'a');
        assert.equal((await decision(id)).explanation.source, 'FORM_POLICY');
        await pool.query("UPDATE member_routing_profile SET available=false WHERE user_id='a'");
        const next = await enqueue();
        await tick();
        assert.equal((await decision(next)).reason, 'NO_SKILL_MATCH');
      },
    );
    await t.test(
      'least loaded ignores closed leads and hybrid persists numeric explanation',
      async () => {
        await reset();
        const first = await enqueue();
        await tick();
        await pool.query("UPDATE routing_policy SET strategy='LEAST_LOADED'");
        const second = await enqueue();
        await tick();
        assert.equal((await lead(second)).assigned_to_user_id, 'b');
        await pool.query("UPDATE lead SET status='CLOSED' WHERE id=$1", [first]);
        await pool.query("UPDATE routing_policy SET strategy='HYBRID'");
        const third = await enqueue();
        await tick();
        const d = await decision(third);
        assert.equal(d.selected_user_id, 'a');
        assert.equal(d.explanation.factors.active, 0);
        assert.equal(d.explanation.factors.total, 100);
      },
    );
    await t.test(
      'manual assignment and deliberate unassignment supersede claimed jobs',
      async () => {
        for (const assigned of ['b', null]) {
          await reset();
          const id = await enqueue(),
            lock = await pool.connect();
          await lock.query('BEGIN');
          await lock.query('SELECT id FROM workspace WHERE id=$1 FOR UPDATE', [w]);
          const running = tick();
          try {
            await claimed(id);
            await lock.query(
              "UPDATE lead SET assigned_to_user_id=$2,assignment_origin='MANUAL',routing_state='MANUAL',routing_revision=routing_revision+1 WHERE id=$1",
              [id, assigned],
            );
          } finally {
            await lock.query('COMMIT');
            lock.release();
          }
          await running;
          assert.equal((await lead(id)).assigned_to_user_id, assigned);
          assert.equal((await lead(id)).routing_state, 'MANUAL');
          assert.equal((await decision(id)).reason, 'SUPERSEDED_MANUAL_OR_REROUTE');
        }
      },
    );
    await t.test(
      'policy change after claim uses current policy inside workspace lock',
      async () => {
        await reset();
        const id = await enqueue(),
          lock = await pool.connect();
        await lock.query('BEGIN');
        await lock.query('SELECT id FROM workspace WHERE id=$1 FOR UPDATE', [w]);
        const running = tick();
        try {
          await claimed(id);
          await lock.query(
            'UPDATE routing_policy SET enabled=false,version=2 WHERE workspace_id=$1',
            [w],
          );
        } finally {
          await lock.query('COMMIT');
          lock.release();
        }
        await running;
        assert.equal((await lead(id)).assigned_to_user_id, null);
        assert.equal((await decision(id)).reason, 'ROUTING_DISABLED');
        assert.equal((await decision(id)).policy_version, 2);
      },
    );
    await t.test('member removed after claim cannot receive assignment', async () => {
      await reset();
      const id = await enqueue(),
        lock = await pool.connect();
      await lock.query('BEGIN');
      await lock.query('SELECT id FROM workspace WHERE id=$1 FOR UPDATE', [w]);
      const running = tick();
      try {
        await claimed(id);
        await lock.query("DELETE FROM workspace_membership WHERE workspace_id=$1 AND user_id='a'", [
          w,
        ]);
      } finally {
        await lock.query('COMMIT');
        lock.release();
      }
      await running;
      assert.equal((await lead(id)).assigned_to_user_id, 'b');
      assert.equal(
        (await pool.query("SELECT * FROM member_routing_profile WHERE user_id='a'")).rowCount,
        0,
      );
    });
    await t.test('expired lease recovers after restart with bounded attempts', async () => {
      await reset();
      const id = await enqueue();
      await pool.query(
        "UPDATE routing_job SET status='PROCESSING',lease_token=$2,lease_until=now()-interval '1 minute',attempts=1 WHERE lead_id=$1",
        [id, randomUUID()],
      );
      await tick();
      assert.equal((await job(id)).status, 'COMPLETED');
      assert.equal((await job(id)).attempts, 2);
      const exhausted = await enqueue();
      await pool.query(
        "UPDATE routing_job SET status='PROCESSING',lease_token=$2,lease_until=now()-interval '1 minute',attempts=3 WHERE lead_id=$1",
        [exhausted, randomUUID()],
      );
      await tick();
      assert.equal((await decision(exhausted)).reason, 'RETRY_EXHAUSTED');
      assert.equal((await lead(exhausted)).assigned_to_user_id, null);
    });
    await t.test(
      'failure before commit rolls back assignment, fairness and history; retry succeeds once',
      async () => {
        await reset();
        const id = await enqueue();
        await pool.query(
          "CREATE FUNCTION routing_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END $$",
        );
        await pool.query(
          'CREATE TRIGGER routing_test_fail BEFORE INSERT ON routing_decision FOR EACH ROW EXECUTE FUNCTION routing_test_fail()',
        );
        try {
          await tick();
          assert.equal((await lead(id)).assigned_to_user_id, null);
          assert.equal((await job(id)).status, 'PENDING');
          assert.equal((await pool.query('SELECT * FROM lead_activity')).rowCount, 0);
          assert.equal(
            (
              await pool.query(
                'SELECT * FROM member_routing_profile WHERE last_assigned_at IS NOT NULL',
              )
            ).rowCount,
            0,
          );
        } finally {
          await pool.query('DROP TRIGGER routing_test_fail ON routing_decision');
          await pool.query('DROP FUNCTION routing_test_fail()');
        }
        await pool.query('UPDATE routing_job SET available_at=now() WHERE lead_id=$1', [id]);
        await tick();
        assert.equal((await job(id)).attempts, 2);
        assert.equal((await lead(id)).assigned_to_user_id, 'a');
        assert.equal((await pool.query('SELECT * FROM routing_decision')).rowCount, 1);
      },
    );
    await t.test(
      'AI is optional: only current accepted validated extraction supplies a specialty',
      async () => {
        await reset();
        const id = await enqueue();
        await pool.query("UPDATE routing_policy SET strategy='SKILL',rules=$1", [
          JSON.stringify({ ...rules, useReviewedAI: true, formSkills: [] }),
        ]);
        assert.equal((await context(pool, w, id))?.features.source, 'NONE');
        const sample = JSON.parse(
          await readFile('tests/fixtures/intelligence-eval.json', 'utf8'),
        )[0];
        await pool.query('UPDATE lead SET message=$2 WHERE id=$1', [id, sample.input]);
        await pool.query(
          "INSERT INTO lead_intelligence(workspace_id,lead_id,status) VALUES($1,$2,'COMPLETED')",
          [w, id],
        );
        await pool.query(
          "INSERT INTO lead_ai_job(workspace_id,lead_id,generation,status,schema_version,result) VALUES($1,$2,1,'COMPLETED','extraction-1',$3)",
          [w, id, JSON.stringify({ extraction: sample.fixture })],
        );
        assert.equal((await context(pool, w, id))?.features.source, 'NONE');
        await pool.query("UPDATE lead_ai_job SET review='FLAGGED'");
        assert.equal((await context(pool, w, id))?.features.source, 'NONE');
        await pool.query("UPDATE lead_ai_job SET review='ACCEPTED'");
        assert.equal((await context(pool, w, id))?.features.source, 'REVIEWED_AI');
        assert.equal((await context(pool, w, id))?.features.skill, 'business requirement');
        await pool.query("UPDATE lead_intelligence SET generation=2,status='PENDING'");
        assert.equal((await context(pool, w, id))?.features.source, 'NONE');
        await pool.query('UPDATE routing_policy SET rules=$1', [
          JSON.stringify({ ...rules, useReviewedAI: true }),
        ]);
        assert.equal((await context(pool, w, id))?.features.source, 'FORM_POLICY');
      },
    );
    await t.test(
      'commit acknowledgement loss cannot duplicate persisted assignment effects',
      async () => {
        await reset();
        const id = await enqueue();
        let commits = 0;
        const faultPool = {
          connect: async () => {
            const c = await pool.connect();
            return {
              query: async (...args: Parameters<typeof c.query>) => {
                const result = await c.query(...args);
                if (args[0] === 'COMMIT' && ++commits === 2)
                  throw Error('Injected lost commit acknowledgement');
                return result;
              },
              release: () => c.release(),
            };
          },
        } as unknown as Pool;
        const errors: string[] = [];
        const originalError = console.error;
        console.error = (message) => {
          errors.push(String(message));
        };
        try {
          await runRoutingOnce(faultPool);
        } finally {
          console.error = originalError;
        }
        assert.ok(
          !errors.some((message) => message.includes('routing.failed')),
          'a committed decision must not be logged as a failed task',
        );
        assert.equal((await job(id)).status, 'COMPLETED');
        assert.equal((await lead(id)).assigned_to_user_id, 'a');
        assert.equal(await tick(), false);
        assert.equal(
          (await pool.query('SELECT * FROM routing_decision WHERE lead_id=$1', [id])).rowCount,
          1,
        );
        assert.equal(
          (
            await pool.query(
              "SELECT * FROM lead_activity WHERE lead_id=$1 AND action='AUTO_ASSIGNED'",
              [id],
            )
          ).rowCount,
          1,
        );
      },
    );
    await t.test(
      'routing and disabled-AI CLI workers release pools and naturally exit in once mode',
      async () => {
        await reset();
        await enqueue();
        for (const script of ['scripts/routing-worker.ts', 'scripts/ai-worker.ts']) {
          const child = spawn(process.execPath, ['--experimental-strip-types', script, '--once'], {
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              NODE_ENV: 'production',
              DATABASE_URL:
                'postgresql://routing_test:' + password + '@127.0.0.1:' + port + '/postgres',
              AI_ENABLED: 'false',
            },
          });
          let logs = '';
          child.stdout.on('data', (b) => {
            logs += b;
          });
          child.stderr.on('data', (b) => {
            logs += b;
          });
          const timer = setTimeout(() => child.kill(), 10000);
          try {
            const [code] = await once(child, 'exit');
            assert.equal(code, 0, logs);
            assert.ok(!logs.includes('database_error'));
          } finally {
            clearTimeout(timer);
          }
        }
      },
    );
    await t.test('repeated transient transaction failures stop at three attempts', async () => {
      await reset();
      const id = await enqueue();
      await pool.query(
        "CREATE FUNCTION routing_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END $$",
      );
      await pool.query(
        'CREATE TRIGGER routing_test_fail BEFORE INSERT ON routing_decision FOR EACH ROW EXECUTE FUNCTION routing_test_fail()',
      );
      try {
        for (let n = 0; n < 3; n++) {
          await pool.query('UPDATE routing_job SET available_at=now()');
          await tick();
        }
      } finally {
        await pool.query('DROP TRIGGER routing_test_fail ON routing_decision');
        await pool.query('DROP FUNCTION routing_test_fail()');
      }
      assert.equal((await job(id)).status, 'FAILED');
      assert.equal((await job(id)).attempts, 3);
      assert.equal((await lead(id)).routing_state, 'FAILED');
      assert.equal((await lead(id)).assigned_to_user_id, null);
      assert.equal(await tick(), false);
    });
    await t.test(
      'closed and preassigned leads are skipped; invalid persisted policy fails safely',
      async () => {
        await reset();
        const closed = await enqueue();
        await pool.query("UPDATE lead SET status='CLOSED' WHERE id=$1", [closed]);
        await tick();
        assert.equal((await decision(closed)).reason, 'LEAD_CLOSED');
        const assigned = await enqueue();
        await pool.query(
          "UPDATE lead SET assigned_to_user_id='b',assignment_origin='MANUAL' WHERE id=$1",
          [assigned],
        );
        await tick();
        assert.equal((await lead(assigned)).assigned_to_user_id, 'b');
        assert.equal((await decision(assigned)).reason, 'EXISTING_ASSIGNMENT');
        const bad = await enqueue();
        await pool.query("UPDATE routing_policy SET rules='{}'");
        await tick();
        assert.equal((await job(bad)).status, 'FAILED');
        assert.equal((await job(bad)).error_code, 'INVALID_POLICY');
        assert.equal((await lead(bad)).routing_state, 'FAILED');
      },
    );
  } finally {
    await pool.end();
    await cluster.stop();
  }
});
