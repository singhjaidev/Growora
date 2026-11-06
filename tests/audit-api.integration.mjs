import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { request as httpRequest } from 'node:http';
export async function testAuditAPI({ t, base, origin, client, get, ca, cb, ua, ub }) {
  const w = randomUUID(),
    other = randomUUID(),
    form = randomUUID(),
    foreignForm = randomUUID(),
    lead = randomUUID(),
    foreignLead = randomUUID();
  await client.query(
    "INSERT INTO workspace(id,name) VALUES($1,'Phase 7 disposable A'),($2,'Phase 7 disposable B')",
    [w, other],
  );
  await client.query(
    "INSERT INTO workspace_membership(workspace_id,user_id,role) VALUES($1,$2,'OWNER'),($1,$3,'ADMIN'),($4,$3,'OWNER')",
    [w, ua.id, ub.id, other],
  );
  for (const [wid, f, l] of [
    [w, form, lead],
    [other, foreignForm, foreignLead],
  ]) {
    await client.query(
      "INSERT INTO lead_form(id,workspace_id,public_id,name,privacy_notice) VALUES($1,$2,$3,'Audit fixture','Notice')",
      [f, wid, randomBytes(24).toString('hex')],
    );
    await client.query(
      "INSERT INTO lead(id,workspace_id,source_form_id,customer_name,customer_email,subject,message,consent_notice) VALUES($1,$2,$3,'Fixture','fixture@example.test','Audit fixture','Synthetic only','Notice')",
      [l, wid, f],
    );
  }
  const send = (path, data, cookie = ca) =>
    fetch(base + path, {
      method: 'POST',
      headers: { origin, cookie, 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
  const status = async (p, code) => {
    const r = await p,
      b = await r.text();
    assert.equal(r.status, code, b);
    return b;
  };
  await t.test(
    'audit: private endpoint matrix rejects guests and direct auth-library bypass',
    async () => {
      for (const path of [
        '/api/account/profile',
        '/api/workspaces/settings',
        '/api/leads/assign',
        '/api/intelligence/analyze',
        '/api/routing/policy',
      ])
        await status(send(path, { workspaceId: w, id: lead }, ''), 401);
      for (const path of [
        '/api/auth/me',
        '/api/workspaces/list',
        '/api/leads/list?workspaceId=' + w,
        '/api/intelligence/detail?workspaceId=' + w + '&id=' + lead,
        '/api/routing/settings?workspaceId=' + w,
      ])
        await status(get(path), 401);
      await status(
        send('/api/auth/sign-up/email', {
          email: 'bypass@example.test',
          password: randomBytes(20).toString('hex'),
        }),
        404,
      );
      await status(
        fetch(base + '/api/leads/list', { method: 'DELETE', headers: { cookie: ca, origin } }),
        405,
      );
    },
  );
  await t.test(
    'audit: invalid pagination and injection-shaped filters fail safely or match literal text',
    async () => {
      for (const page of ['0', '-1', 'NaN', '1.5', '100001']) {
        await status(get('/api/leads/list?workspaceId=' + w + '&page=' + page, ca), 400);
        await status(get('/api/routing/history?workspaceId=' + w + '&page=' + page, ca), 400);
      }
      const r = await get(
        '/api/leads/list?' + new URLSearchParams({ workspaceId: w, q: "%' OR 1=1 --" }),
        ca,
      );
      assert.equal(r.status, 200);
      assert.equal((await r.json()).total, 0);
      await status(
        send('/api/leads/assign', {
          workspaceId: w,
          id: lead,
          version: 1,
          assignee: ub.id,
          role: 'OWNER',
        }),
        400,
      );
      await status(get('/api/routing/history?workspaceId=' + w + '&id=' + foreignLead, ca), 404);
      await status(get('/api/leads/forms?workspaceId=' + other, ca), 404);
    },
  );
  await t.test(
    'audit: owner protection holds under concurrent remove, demotion and leave',
    async () => {
      const calls = [
        send('/api/workspaces/remove', { workspaceId: w, memberId: ua.id }, cb),
        send('/api/workspaces/role', { workspaceId: w, memberId: ua.id, role: 'MEMBER' }, cb),
        send('/api/workspaces/leave', { workspaceId: w }),
      ];
      await Promise.all(calls.map((p) => status(p, 403)));
      assert.equal(
        (
          await client.query(
            "SELECT count(*)::int n FROM workspace_membership WHERE workspace_id=$1 AND role='OWNER'",
            [w],
          )
        ).rows[0].n,
        1,
      );
    },
  );
  await t.test(
    'audit: membership revocation serializes against an already waiting protected request',
    async () => {
      await client.query('BEGIN');
      await client.query('SELECT id FROM workspace WHERE id=$1 FOR UPDATE', [w]);
      const pending = get('/api/routing/settings?workspaceId=' + w, cb);
      try {
        let waiting = false;
        for (let i = 0; i < 100; i++) {
          const q = await client.query(
            "SELECT count(*)::int n FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND pid<>pg_backend_pid()",
          );
          if (q.rows[0].n) {
            waiting = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 10));
        }
        assert.ok(waiting, 'request must actually wait on workspace lock');
        await client.query(
          'DELETE FROM workspace_membership WHERE workspace_id=$1 AND user_id=$2',
          [w, ub.id],
        );
      } finally {
        await client.query('COMMIT');
      }
      await status(pending, 404);
    },
  );
  await t.test(
    'audit: cross-tenant references fail and explicit lead deletion cascades only owned history',
    async () => {
      await assert.rejects(
        client.query('UPDATE lead SET source_form_id=$2 WHERE id=$1', [lead, foreignForm]),
      );
      await assert.rejects(
        client.query('UPDATE lead SET assigned_to_user_id=$2 WHERE id=$1', [lead, ub.id]),
      );
      await assert.rejects(
        client.query('INSERT INTO routing_job(workspace_id,lead_id,revision) VALUES($1,$2,0)', [
          other,
          lead,
        ]),
      );
      await client.query('INSERT INTO lead_intelligence(workspace_id,lead_id) VALUES($1,$2)', [
        w,
        lead,
      ]);
      await client.query(
        'INSERT INTO lead_ai_job(workspace_id,lead_id,generation) VALUES($1,$2,1)',
        [w, lead],
      );
      await client.query('INSERT INTO routing_job(workspace_id,lead_id,revision) VALUES($1,$2,0)', [
        w,
        lead,
      ]);
      await status(send('/api/leads/delete', { workspaceId: w, id: lead, version: 1 }), 200);
      for (const table of ['lead_intelligence', 'lead_ai_job', 'routing_job', 'routing_decision'])
        assert.equal(
          (await client.query('SELECT count(*)::int n FROM ' + table + ' WHERE lead_id=$1', [lead]))
            .rows[0].n,
          0,
        );
      assert.equal(
        (await client.query('SELECT id FROM lead WHERE id=$1', [foreignLead])).rowCount,
        1,
      );
    },
  );
  await t.test(
    'audit: stalled HTTP upload is rejected without waiting for client completion',
    async () => {
      const start = Date.now();
      const code = await new Promise((resolve, reject) => {
        const request = httpRequest(
          base + '/api/auth/login',
          {
            method: 'POST',
            headers: { origin, 'content-type': 'application/json', 'transfer-encoding': 'chunked' },
          },
          (response) => {
            response.resume();
            response.on('end', () => {
              resolve(response.statusCode);
              request.destroy();
            });
          },
        );
        request.on('error', reject);
        request.setTimeout(14000, () => request.destroy(Error('body deadline missing')));
        request.write('{');
      });
      assert.equal(code, 400);
      assert.ok(Date.now() - start < 14000);
    },
  );
  await t.test(
    'audit: bounded 1000-lead list/statistics performance and query plan evidence',
    async () => {
      await client.query(
        "INSERT INTO lead(workspace_id,source_form_id,customer_name,customer_email,subject,message,consent_notice) SELECT $1,$2,'Audit fixture '||n,'fixture@example.test','Audit requirement','Synthetic only','Notice' FROM generate_series(1,1000) n",
        [w, form],
      );
      const times = [];
      for (let n = 0; n < 12; n++) {
        const start = performance.now(),
          r = await get('/api/leads/list?workspaceId=' + w + '&page=2', ca),
          data = await r.json();
        assert.equal(r.status, 200);
        assert.equal(data.total, 1000);
        assert.equal(data.rows.length, 20);
        times.push(performance.now() - start);
      }
      const stats = await (await get('/api/leads/stats?workspaceId=' + w, ca)).json();
      assert.equal(stats.total, 1000);
      await client.query('ANALYZE lead');
      const plan = await client.query(
        'EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id FROM lead WHERE workspace_id=$1 ORDER BY created_at DESC,id DESC LIMIT 20',
        [w],
      );
      times.sort((a, b) => a - b);
      await mkdir('test-results/phase7', { recursive: true });
      await writeFile(
        'test-results/phase7/performance.json',
        JSON.stringify(
          {
            fixtureLeads: 1000,
            requests: 12,
            minMs: times[0],
            medianMs: times[6],
            p95Ms: times[11],
            maxMs: times[11],
            plan: plan.rows[0]['QUERY PLAN'],
            scope: 'Local disposable database, not a production benchmark',
          },
          null,
          2,
        ),
      );
    },
  );
}
