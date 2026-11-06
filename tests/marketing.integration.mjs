import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { defaultPolicy } from '../src/server/routing/engine.ts';

export async function seedMarketingOwner(client) {
  const owner = {
    id: randomUUID(),
    email: 'marketing-owner@example.test',
    password: randomBytes(24).toString('hex'),
  };
  await client.query("INSERT INTO auth_user(id,name,email) VALUES($1,'Marketing test owner',$2)", [
    owner.id,
    owner.email,
  ]);
  await client.query(
    "INSERT INTO auth_account(id,account_id,provider_id,user_id,password) VALUES($1,$2,'credential',$2,$3)",
    [randomUUID(), owner.id, await hashPassword(owner.password)],
  );
  return owner;
}
export async function testMarketing({
  t,
  base,
  origin,
  client,
  get,
  ca,
  cb,
  login,
  marketingOwner,
}) {
  const cookie = await login({ email: marketingOwner.email, password: marketingOwner.password });
  const json = async (p, status = 200) => {
    const r = await p,
      b = await r.text();
    assert.equal(r.status, status, b);
    return b ? JSON.parse(b) : {};
  };
  const post = (path, body, c = cookie, source = origin, extra = {}) =>
    fetch(base + path, {
      method: 'POST',
      headers: { cookie: c, origin: source, 'content-type': 'application/json', ...extra },
      body: JSON.stringify(body),
    });
  const create = async (name) => (await json(post('/api/workspaces/create', { name }), 201)).id;
  const w = await create('Marketing owned workspace'),
    w2 = await create('Marketing second workspace');
  const foreign = (
    await json(post('/api/workspaces/create', { name: 'Marketing unrelated workspace' }, ca), 201)
  ).id;
  const makeForm = async (wid, c = cookie) => {
    await json(
      post(
        '/api/leads/form-create',
        {
          workspaceId: wid,
          name: 'Website enquiries',
          privacyNotice:
            'Details are stored for authorized Growora team members to review and respond.',
          enabled: true,
          retentionDays: 30,
        },
        c,
      ),
      201,
    );
    return (await json(get('/api/leads/forms?workspaceId=' + wid, c))).forms[0];
  };
  const form = await makeForm(w),
    second = await makeForm(w2),
    foreignForm = await makeForm(foreign, ca);
  let settings, notice;
  const read = () => json(get('/api/marketing/settings', cookie));
  const connect = (f, version, c = cookie) =>
    post('/api/marketing/settings', { version, workspaceId: f.workspaceId ?? w, formId: f.id }, c);
  const payload = {
    formVersion: 1,
    customerName: 'Marketing customer',
    customerEmail: 'marketing-customer@example.test',
    subject: 'Website redesign',
    message: 'Company: Example\nProject budget: £5,000–£10,000\nTimeline: Within 30 days',
    consent: true,
    company: '',
  };
  const send = (body = payload, key = randomUUID(), n = notice, extra = {}) =>
    post('/api/marketing/enquiry', body, '', origin, {
      'idempotency-key': key,
      'x-marketing-form': n.publicId,
      'x-marketing-version': String(n.destinationVersion),
      ...extra,
    });
  await t.test(
    'marketing: unconfigured fails closed; settings require session, site authorization and OWNER role',
    async () => {
      await json(get('/api/marketing/enquiry'), 503);
      await json(get('/api/marketing/settings'), 401);
      await json(get('/api/marketing/settings', ca), 403);
      await json(connect(form, 0, ca), 403);
      settings = await read();
      assert.deepEqual(new Set(settings.workspaces.map((r) => r.id)), new Set([w, w2]));
      assert.ok(!settings.forms.some((f) => f.id === foreignForm.id));
      await json(
        post('/api/marketing/settings', {
          version: 0,
          workspaceId: foreign,
          formId: foreignForm.id,
        }),
        403,
      );
      await json(
        post('/api/marketing/settings', { version: 0, workspaceId: w, formId: foreignForm.id }),
        404,
      );
      await json(
        post(
          '/api/marketing/settings',
          { version: 0, workspaceId: w, formId: form.id },
          cookie,
          'https://evil.test',
        ),
        403,
      );
      await client.query(
        "UPDATE workspace_membership SET role='ADMIN' WHERE workspace_id=$1 AND user_id=$2",
        [w, marketingOwner.id],
      );
      await json(connect(form, 0), 403);
      await client.query(
        "UPDATE workspace_membership SET role='OWNER' WHERE workspace_id=$1 AND user_id=$2",
        [w, marketingOwner.id],
      );
      await json(connect(form, 0));
      notice = await json(get('/api/marketing/enquiry'));
      assert.ok(!('workspaceId' in notice));
      assert.ok(!('connectedBy' in notice));
      await json(connect(form, 0), 409);
    },
  );
  await t.test(
    'marketing: real concurrent submission persists one owned lead, activity and AI job without provider calls',
    async () => {
      const key = randomUUID();
      await Promise.all([json(send(payload, key)), json(send(payload, key))]);
      const rows = (await client.query('SELECT * FROM lead WHERE source_form_id=$1', [form.id]))
        .rows;
      assert.equal(rows.length, 1);
      assert.equal(rows[0].workspace_id, w);
      assert.equal(rows[0].message, payload.message);
      assert.equal(rows[0].routing_state, 'MANUAL');
      assert.equal(
        (await client.query('SELECT * FROM lead_activity WHERE lead_id=$1', [rows[0].id])).rows
          .length,
        1,
      );
      assert.equal(
        (await client.query('SELECT * FROM lead_ai_job WHERE lead_id=$1', [rows[0].id])).rows
          .length,
        1,
      );
      assert.deepEqual(await json(send(payload, key)), { ok: true });
      await json(send({ ...payload, message: 'changed' }, key), 409);
      const list = await json(get('/api/leads/list?workspaceId=' + w, cookie));
      assert.ok(list.rows.some((l) => l.id === rows[0].id));
      await json(get('/api/leads/list?workspaceId=' + w), 401);
      await json(get('/api/leads/detail?workspaceId=' + w + '&id=' + rows[0].id, ca), 404);
      await json(get('/api/leads/list?workspaceId=' + w, cb), 404);
      await json(
        post('/api/leads/status', {
          workspaceId: w,
          id: rows[0].id,
          version: rows[0].version,
          status: 'CONTACTED',
        }),
      );
      const current = (await client.query('SELECT * FROM lead WHERE id=$1', [rows[0].id])).rows[0];
      await json(
        post('/api/leads/assign', {
          workspaceId: w,
          id: current.id,
          version: current.version,
          assignee: marketingOwner.id,
        }),
      );
    },
  );
  await t.test(
    'marketing: rejects forged ownership, invalid input, missing consent, spam, stale binding and oversized bodies',
    async () => {
      for (const body of [
        { ...payload, workspaceId: foreign },
        { ...payload, publicFormId: foreignForm.publicId },
        { ...payload, customerEmail: 'bad' },
        { ...payload, consent: false },
        { ...payload, company: 'bot' },
      ])
        await json(send(body), 400);
      await json(send({ ...payload, message: 'x'.repeat(25000) }), 413);
      await json(send(payload, randomUUID(), { ...notice, publicId: foreignForm.publicId }), 409);
      await json(send(payload, randomUUID(), { ...notice, destinationVersion: 999 }), 409);
      const r = await post('/api/marketing/enquiry', payload, '', 'https://evil.test', {
        'x-marketing-form': notice.publicId,
        'x-marketing-version': String(notice.destinationVersion),
      });
      await json(Promise.resolve(r), 403);
    },
  );
  await t.test(
    'marketing: backend failure rolls back without false success; unchanged retry works',
    async () => {
      await client.query(
        "CREATE FUNCTION phase8_reject_activity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.workspace_id='" +
          w +
          "'::uuid THEN RAISE EXCEPTION 'test failure'; END IF; RETURN NEW; END $$",
      );
      await client.query(
        'CREATE TRIGGER phase8_reject BEFORE INSERT ON lead_activity FOR EACH ROW EXECUTE FUNCTION phase8_reject_activity()',
      );
      const key = randomUUID(),
        body = { ...payload, customerEmail: 'failure@example.test' };
      try {
        await json(send(body, key), 503);
        assert.equal(
          (await client.query('SELECT * FROM lead WHERE customer_email=$1', [body.customerEmail]))
            .rows.length,
          0,
        );
      } finally {
        await client.query('DROP TRIGGER phase8_reject ON lead_activity');
        await client.query('DROP FUNCTION phase8_reject_activity()');
      }
      await json(send(body, key));
      await json(send(body, key));
      assert.equal(
        (await client.query('SELECT * FROM lead WHERE customer_email=$1', [body.customerEmail]))
          .rows.length,
        1,
      );
    },
  );
  await t.test(
    'marketing: destination versioning, disconnect, disabled form and owner revocation fail closed',
    async () => {
      settings = await read();
      await json(
        post('/api/marketing/settings', {
          version: settings.version,
          workspaceId: null,
          formId: null,
        }),
      );
      await json(send(), 503);
      settings = await read();
      await json(connect(form, settings.version));
      await json(send(), 409);
      notice = await json(get('/api/marketing/enquiry'));
      await client.query('UPDATE lead_form SET enabled=false WHERE id=$1', [form.id]);
      await json(send(), 503);
      await client.query('UPDATE lead_form SET enabled=true WHERE id=$1', [form.id]);
      await client.query(
        "UPDATE workspace_membership SET role='MEMBER' WHERE workspace_id=$1 AND user_id=$2",
        [w, marketingOwner.id],
      );
      await json(send(), 503);
      await client.query(
        "UPDATE workspace_membership SET role='OWNER' WHERE workspace_id=$1 AND user_id=$2",
        [w, marketingOwner.id],
      );
      settings = await read();
      const changed = await Promise.all([
        post('/api/marketing/settings', {
          version: settings.version,
          workspaceId: w2,
          formId: second.id,
        }),
        post('/api/marketing/settings', {
          version: settings.version,
          workspaceId: w,
          formId: form.id,
        }),
      ]);
      assert.deepEqual(changed.map((r) => r.status).sort(), [200, 409]);
      await Promise.all(changed.map((r) => r.text()));
      settings = await read();
      await json(
        post('/api/marketing/settings', {
          version: settings.version,
          workspaceId: w,
          formId: form.id,
        }),
      );
      notice = await json(get('/api/marketing/enquiry'));
    },
  );
  await t.test('marketing: routing policy is respected and mailbox quota is enforced', async () => {
    await json(
      post('/api/routing/policy', {
        workspaceId: w,
        ...defaultPolicy,
        enabled: true,
        strategy: 'ROUND_ROBIN',
      }),
    );
    const body = { ...payload, customerEmail: 'routing-marketing@example.test' };
    await json(send(body));
    const lead = (
      await client.query('SELECT id,routing_state FROM lead WHERE customer_email=$1', [
        body.customerEmail,
      ])
    ).rows[0];
    assert.equal(lead.routing_state, 'PENDING');
    assert.equal(
      (await client.query('SELECT * FROM routing_job WHERE lead_id=$1', [lead.id])).rows.length,
      1,
    );
    for (let i = 0; i < 8; i++)
      await json(send({ ...payload, customerEmail: 'quota-marketing@example.test' }));
    await json(send({ ...payload, customerEmail: 'quota-marketing@example.test' }), 429);
  });
  await t.test(
    'marketing: disconnect serializes against an in-flight submission before commit',
    async () => {
      const body = { ...payload, customerEmail: 'race-marketing@example.test' };
      await client.query('BEGIN');
      let pending;
      try {
        await client.query('SELECT id FROM workspace WHERE id=$1 FOR UPDATE', [w]);
        pending = send(body);
        let waiting = false;
        for (let i = 0; i < 50; i++) {
        await client.query('SELECT pg_stat_clear_snapshot()');
          const result = await client.query(
            "SELECT 1 FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE '%workspace%' AND pid<>pg_backend_pid()",
          );
          if (result.rowCount) {
            waiting = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        assert.ok(waiting, 'submission reaches workspace lock');
        await client.query(
          'UPDATE marketing_destination SET workspace_id=NULL,form_id=NULL,connected_by=NULL,version=version+1 WHERE id=1',
        );
        await client.query('COMMIT');
      } finally {
        await client.query('ROLLBACK');
      }
      await json(pending, 409);
      assert.equal(
        (await client.query('SELECT * FROM lead WHERE customer_email=$1', [body.customerEmail]))
          .rows.length,
        0,
      );
      settings = await read();
      await json(connect(form, settings.version));
      notice = await json(get('/api/marketing/enquiry'));
    },
  );
  if (process.env.PHASE8_BROWSER === '1') {
    await t.test(
      'marketing: browser settings → real Solutions enquiry → authorized dashboard',
      async () => {
        const { testMarketingBrowser } = await import('./marketing-flow-browser.mjs');
        await testMarketingBrowser({
          base,
          origin,
          cookie,
          workspaceId: w,
          formId: form.id,
          client,
        });
      },
    );
    await t.test('marketing: all six pages desktop/mobile and link audit', async () => {
      process.env.AUDIT_BASE_URL = base;
      await import('./phase8-marketing-audit.mjs');
    });
  }
}
