import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { score } from '../src/server/intelligence/contract.ts';
export async function testIntelligenceAPI({ t, base, origin, client, get, ca, cb, ua, ub }) {
  const w = '11111111-1111-1111-1111-111111111111',
    other = randomUUID(),
    id = randomUUID(),
    foreign = randomUUID(),
    form = randomUUID(),
    foreignForm = randomUUID();
  await client.query('INSERT INTO workspace(id,name) VALUES($1,$2),($3,$4)', [
    w,
    'AI synthetic workspace',
    other,
    'AI other workspace',
  ]);
  await client.query(
    "INSERT INTO workspace_membership(workspace_id,user_id,role) VALUES($1,$2,'OWNER'),($1,$3,'MEMBER'),($4,$3,'OWNER')",
    [w, ua.id, ub.id, other],
  );
  for (const [wid, f, l] of [
    [w, form, id],
    [other, foreignForm, foreign],
  ]) {
    await client.query(
      "INSERT INTO lead_form(id,workspace_id,public_id,name,privacy_notice) VALUES($1,$2,$3,'Synthetic AI form','Synthetic notice')",
      [f, wid, randomBytes(24).toString('hex')],
    );
    await client.query(
      "INSERT INTO lead(id,workspace_id,source_form_id,customer_name,customer_email,subject,message,consent_notice) VALUES($1,$2,$3,'AI synthetic customer','synthetic@example.test','Synthetic','Original preserved','Notice')",
      [l, wid, f],
    );
  }
  const read = (cookie = ca, wid = w, l = id) =>
    get('/api/intelligence/detail?' + new URLSearchParams({ workspaceId: wid, id: l }), cookie);
  const write = (action, fields = {}, cookie = ca, wid = w, source = origin) =>
    fetch(base + '/api/intelligence/' + action, {
      method: 'POST',
      headers: { cookie, origin: source, 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceId: wid, id, ...fields }),
    });
  const status = async (p, n) => {
    const r = await p;
    const body = await r.text();
    assert.equal(r.status, n, body);
    return { headers: r.headers, json: async () => JSON.parse(body) };
  };
  const json = async (p, n = 200) => (await status(p, n)).json();
  await t.test(
    'AI APIs enforce authentication, origin, tenant and assigned-member access',
    async () => {
      await status(read(''), 401);
      await status(read(ca, other, foreign), 404);
      await status(read(ca, w, foreign), 404);
      await status(read(cb), 404);
      await status(write('analyze', { generation: 0 }, '', w), 401);
      await status(write('analyze', { generation: 0 }, ca, w, 'https://foreign.test'), 403);
      await status(write('analyze', { generation: 0 }, ca, other), 404);
      await status(write('analyze', { generation: 0, role: 'OWNER' }), 400);
      await client.query('UPDATE lead SET assigned_to_user_id=$1 WHERE id=$2', [ub.id, id]);
      assert.equal((await json(read(cb))).canAnalyze, false);
      await status(write('analyze', { generation: 0 }, cb), 403);
      assert.match((await read()).headers.get('cache-control'), /no-store/);
    },
  );
  await t.test(
    'manual analysis of existing lead is idempotent under concurrent requests',
    async () => {
      const requests = await Promise.all([
        write('analyze', { generation: 0 }),
        write('analyze', { generation: 0 }),
      ]);
      assert.deepEqual(requests.map((r) => r.status).sort(), [200, 409]);
      const data = await json(read());
      assert.equal(data.current.status, 'PENDING');
      assert.equal(data.current.generation, 1);
      assert.equal(data.history.length, 1);
      assert.equal(
        (await client.query('SELECT message FROM lead WHERE id=$1', [id])).rows[0].message,
        'Original preserved',
      );
      await status(write('analyze', { generation: 1 }), 409);
    },
  );
  await t.test(
    'completed fixture display, immutable human review and priority query isolation',
    async () => {
      // Deliberately persisted fixture output for API tests; never a live provider result.
      const fixture = JSON.parse(await readFile('tests/fixtures/intelligence-eval.json', 'utf8'))[0]
          .fixture,
        result = { extraction: fixture, scoring: score(fixture) };
      await client.query(
        "UPDATE lead_ai_job SET status='COMPLETED',model='TEST_FIXTURE_NOT_LIVE',result=$2,processed_at=now() WHERE lead_id=$1",
        [id, JSON.stringify(result)],
      );
      await client.query(
        "UPDATE lead_intelligence SET status='COMPLETED',score=100,priority='HIGH' WHERE lead_id=$1",
        [id],
      );
      assert.equal((await json(read(cb))).history[0].result.scoring.value, 100);
      await status(write('review', { generation: 1, verdict: 'ACCEPTED', note: '' }, cb), 403);
      await status(
        write('review', {
          generation: 1,
          verdict: 'FLAGGED',
          note: 'Interpretation needs correction',
        }),
        200,
      );
      await status(write('review', { generation: 1, verdict: 'ACCEPTED', note: 'overwrite' }), 409);
      assert.equal((await json(read())).history[0].review, 'FLAGGED');
      const list = await json(
        get(
          '/api/leads/list?' +
            new URLSearchParams({ workspaceId: w, priority: 'HIGH', sort: 'priority' }),
          ca,
        ),
      );
      assert.equal(list.total, 1);
      assert.equal(list.rows[0].id, id);
      assert.equal(
        (
          await json(
            get(
              '/api/leads/list?' +
                new URLSearchParams({ workspaceId: other, priority: 'HIGH', sort: 'priority' }),
              cb,
            ),
          )
        ).total,
        0,
      );
      await status(
        get('/api/leads/list?' + new URLSearchParams({ workspaceId: w, priority: 'INVALID' }), ca),
        400,
      );
    },
  );
  await t.test(
    'new generations preserve reviewed history; administrator permission and member revocation',
    async () => {
      await status(write('analyze', { generation: 1 }), 200);
      let data = await json(read());
      assert.equal(data.current.generation, 2);
      assert.equal(data.history[1].review, 'FLAGGED');
      assert.equal(data.current.score, null);
      await client.query(
        "UPDATE workspace_membership SET role='ADMIN' WHERE workspace_id=$1 AND user_id=$2",
        [w, ub.id],
      );
      assert.equal((await json(read(cb))).canAnalyze, true);
      await client.query(
        "UPDATE lead_ai_job SET status='FAILED',error_code='INVALID_OUTPUT' WHERE lead_id=$1 AND generation=2",
        [id],
      );
      await client.query("UPDATE lead_intelligence SET status='FAILED' WHERE lead_id=$1", [id]);
      await status(write('analyze', { generation: 2 }, cb), 200);
      await client.query('UPDATE lead SET assigned_to_user_id=null WHERE id=$1', [id]);
      await client.query('DELETE FROM workspace_membership WHERE workspace_id=$1 AND user_id=$2', [
        w,
        ub.id,
      ]);
      await status(read(cb), 404);
      await status(write('analyze', { generation: 3 }, cb), 404);
      data = await json(read());
      assert.equal(data.history.length, 3);
    },
  );
  await t.test('lead ingestion durably created jobs without any provider call', async () => {
    const count = await client.query(
      'SELECT count(*)::int n FROM lead l LEFT JOIN lead_intelligence i ON i.lead_id=l.id WHERE l.id<>$1 AND l.id<>$2 AND i.lead_id IS NULL',
      [id, foreign],
    );
    assert.equal(count.rows[0].n, 0);
  });
}
