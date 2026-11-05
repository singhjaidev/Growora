import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
export async function testLeads({ t, base, origin, client, post, login, get, ca, cb, ub, logs }) {
  const write = (action, cookie, body, source = origin) =>
    fetch(base + '/api/leads/' + action, {
      method: 'POST',
      headers: { cookie, origin: source, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  const workspace = (action, cookie, body) =>
    fetch(base + '/api/workspaces/' + action, {
      method: 'POST',
      headers: { cookie, origin, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  const json = async (p, expected = 200) => {
    const r = await p;
    const body = await r.text();
    assert.equal(r.status, expected, body);
    return JSON.parse(body);
  };
  const status = async (p, expected) => {
    const r = await p;
    assert.equal(r.status, expected, await r.text());
  };
  const wa = (await json(workspace('create', ca, { name: 'Lead tenant A' }), 201)).id;
  const wb = (await json(workspace('create', cb, { name: 'Lead tenant B' }), 201)).id;
  const read = (action, cookie = ca, w = wa, extra = {}) =>
    get('/api/leads/' + action + '?' + new URLSearchParams({ workspaceId: w, ...extra }), cookie);
  const change = (action, fields, cookie = ca, w = wa) =>
    write(action, cookie, { workspaceId: w, ...fields });
  const config = {
    name: 'Published enquiry',
    privacyNotice: 'Stored by the authorized business to respond to this enquiry.',
    retentionDays: 30,
    enabled: true,
  };
  let form, key, leadId, member, cm, admin, cd;
  const payload = {
    formVersion: 1,
    customerName: 'Customer One',
    customerEmail: 'private-lead@example.test',
    customerPhone: '+91 9876543210',
    subject: 'Website 100% enquiry',
    message: 'Private message <script>window.hacked=true</script>',
    consent: true,
    company: '',
  };
  const send = (body = payload, k = randomUUID(), publicId = form.publicId, source = origin) =>
    fetch(base + '/api/enquiry/' + publicId, {
      method: 'POST',
      headers: { origin: source, 'content-type': 'application/json', 'idempotency-key': k },
      body: JSON.stringify(body),
    });
  const row = async (cookie = ca, w = wa, id = leadId) =>
    (await json(read('detail', cookie, w, { id }))).lead;
  await t.test('lead forms: owner/admin access, public DTO and validation', async () => {
    await status(change('form-create', config, ''), 401);
    await status(
      write('form-create', ca, { workspaceId: wa, ...config }, 'https://foreign.test'),
      403,
    );
    await status(change('form-create', { ...config, role: 'OWNER' }), 400);
    await status(change('form-create', { ...config, retentionDays: 0 }), 400);
    await status(change('form-create', config, ca, wb), 404);
    await json(change('form-create', config), 201);
    form = (await json(read('forms'))).forms[0];
    assert.match(form.publicId, /^[0-9a-f]{48}$/);
    const response = await get('/api/enquiry/' + form.publicId);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.deepEqual(Object.keys(await response.json()).sort(), [
      'name',
      'privacyNotice',
      'publicId',
      'retentionDays',
      'version',
    ]);
    for (const [label, role] of [
      ['member', 'MEMBER'],
      ['admin', 'ADMIN'],
    ]) {
      const credentials = {
        email: label + '-leads@example.test',
        password: randomBytes(20).toString('hex'),
      };
      await status(post('signup', { ...credentials, name: label }), 200);
      const cookie = await login(credentials),
        u = (await json(get('/api/auth/me', cookie))).user;
      await client.query(
        'INSERT INTO workspace_membership(workspace_id,user_id,role) VALUES($1,$2,$3)',
        [wa, u.id, role],
      );
      if (role === 'MEMBER') {
        member = u;
        cm = cookie;
      } else {
        admin = u;
        cd = cookie;
      }
    }
    await status(read('forms', cm), 403);
    await status(change('form-create', config, cm), 403);
    await status(read('forms', cd), 200);
    await status(change('form-create', { ...config, name: 'Admin form' }, cd), 201);
  });
  await t.test('public validation, size, origin, honeypot and destination protection', async () => {
    for (const fields of [
      {},
      { ...payload, consent: false },
      { ...payload, customerEmail: 'bad' },
      { ...payload, customerName: '' },
      { ...payload, message: 'x'.repeat(4001) },
      { ...payload, company: 'Bot' },
      { ...payload, workspaceId: wb },
      { ...payload, assignedToUserId: ub.id },
    ])
      await status(send(fields), 400);
    await status(send({ ...payload, message: 'x'.repeat(25000) }), 413);
    await status(send(payload, 'invalid-key'), 400);
    await status(send(payload, randomUUID(), '0'.repeat(48)), 404);
    await status(send(payload, randomUUID(), form.publicId, 'https://foreign.test'), 403);
    await status(send(null), 400);
    await status(send([]), 400);
    await status(change('status', null), 400);
  });
  await t.test(
    'atomic public persistence, identical/concurrent retries and legitimate repeats',
    async () => {
      key = randomUUID();
      // Use distinct mailbox for the earlier invalid-key request to avoid consuming this retry budget.
      payload.customerEmail = 'persisted-private@example.test';
      assert.deepEqual(await json(send(payload, key)), { ok: true });
      await status(send(payload, key), 200);
      await Promise.all(Array.from({ length: 3 }, () => status(send(payload, key), 200)));
      let rows = await json(read('list'));
      assert.equal(rows.total, 1);
      leadId = rows.rows[0].id;
      const stored = await row();
      assert.equal(stored.status, 'NEW');
      assert.equal(stored.message, payload.message);
      assert.ok(stored.reviewAt);
      assert.equal(stored.consentNotice, config.privacyNotice);
      assert.equal((await json(read('detail', ca, wa, { id: leadId }))).activity.length, 1);
      await status(send({ ...payload, subject: 'Changed' }, key), 409);
      await status(send(payload), 200);
      assert.equal((await json(read('list'))).total, 2);
      assert.equal((await json(read('stats'))).counts.NEW, 2);
      const receipts = await client.query('SELECT * FROM lead_receipt WHERE form_id=$1', [form.id]);
      assert.equal(receipts.rows.length, 2);
      assert.ok(!JSON.stringify(receipts.rows).includes(payload.customerEmail));
    },
  );
  await t.test(
    'tenant and assignment isolation, eligible assignment and admin status changes',
    async () => {
      await status(read('list', ''), 401);
      await status(read('list', ca, wb), 404);
      await status(read('detail', cb, wb, { id: leadId }), 404);
      await status(read('detail', cb, wa, { id: leadId }), 404);
      await status(change('status', { id: leadId, version: 1, status: 'CONTACTED' }, cb, wb), 404);
      assert.equal((await json(read('list', cm))).total, 0);
      assert.equal((await json(read('stats', cm))).total, 0);
      await status(read('detail', cm, wa, { id: leadId }), 404);
      await status(change('assign', { id: leadId, version: 1, assignee: ub.id }), 400);
      await assert.rejects(
        client.query('UPDATE lead SET assigned_to_user_id=$1 WHERE id=$2', [ub.id, leadId]),
        /foreign key/,
      );
      await status(change('assign', { id: leadId, version: 1, assignee: member.id }, cd), 200);
      assert.equal((await json(read('list', cm))).total, 1);
      assert.equal((await row(cm)).assignedToUserId, member.id);
      await status(change('assign', { id: leadId, version: 2, assignee: admin.id }, cm), 403);
      await status(change('delete', { id: leadId, version: 2 }, cm), 403);
      await status(change('status', { id: leadId, version: 2, status: 'CONTACTED' }, cm), 200);
      await status(change('status', { id: leadId, version: 3, status: 'NEW' }, cm), 400);
      await status(change('status', { id: leadId, version: 3, status: 'INVENTED' }, cm), 400);
      await status(read('list', cm, wa, { assigned: 'unassigned' }), 403);
      await status(change('assign', { id: leadId, version: 3, assignee: admin.id }), 200);
      await status(read('detail', cm, wa, { id: leadId }), 404);
      await status(change('status', { id: leadId, version: 4, status: 'QUALIFIED' }, cd), 200);
      const data = await json(read('detail', cd, wa, { id: leadId }));
      assert.equal(data.activity.length, 5);
      assert.equal(data.activity[0].action, 'STATUS_CHANGED');
      const response = await read('detail', ca, wa, { id: leadId });
      assert.match(response.headers.get('cache-control'), /no-store/);
    },
  );
  await t.test(
    'concurrent updates reject stale versions; form versions and disabled ingestion',
    async () => {
      const results = await Promise.all(
        ['CONTACTED', 'CLOSED'].map((status) =>
          change('status', { id: leadId, version: 5, status }),
        ),
      );
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
      assert.equal((await row()).version, 6);
      await status(
        change('form-update', { id: form.id, version: 1, ...config, enabled: false }),
        200,
      );
      await status(get('/api/enquiry/' + form.publicId), 404);
      await status(send({ ...payload, customerEmail: 'disabled@example.test' }), 404);
      await status(change('form-update', { id: form.id, version: 1, ...config }), 409);
      await status(change('form-update', { id: form.id, version: 2, ...config }), 200);
      await status(send({ ...payload, customerEmail: 'stale@example.test' }), 409);
      payload.formVersion = 3;
    },
  );
  await t.test('activity failure rolls back lead and idempotency claim together', async () => {
    const rollbackKey = randomUUID(),
      body = { ...payload, customerEmail: 'rollback@example.test', subject: 'Rollback unique' };
    await client.query(
      "CREATE FUNCTION reject_lead_activity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test activity failure'; END $$",
    );
    await client.query(
      'CREATE TRIGGER reject_lead_activity BEFORE INSERT ON lead_activity FOR EACH ROW EXECUTE FUNCTION reject_lead_activity()',
    );
    try {
      await status(send(body, rollbackKey), 503);
    } finally {
      await client.query('DROP TRIGGER reject_lead_activity ON lead_activity');
      await client.query('DROP FUNCTION reject_lead_activity()');
    }
    assert.equal(
      (await client.query('SELECT * FROM lead WHERE subject=$1', [body.subject])).rowCount,
      0,
    );
    assert.equal(
      (await client.query('SELECT * FROM lead_receipt WHERE key=$1', [rollbackKey])).rowCount,
      0,
    );
    await status(send(body, rollbackKey), 200);
  });
  await t.test(
    'server pagination, literal search, filters, date order and accurate counts',
    async () => {
      for (let i = 0; i < 22; i++)
        await status(
          send({
            ...payload,
            customerName: 'Paging ' + String(i).padStart(2, '0'),
            customerEmail: 'paging' + i + '@example.test',
            subject: 'Paging request',
          }),
          200,
        );
      const first = await json(read('list', ca, wa, { sort: 'oldest' })),
        second = await json(read('list', ca, wa, { sort: 'oldest', page: '2' }));
      assert.equal(first.rows.length, 20);
      assert.equal(second.rows.length, 5);
      assert.equal(first.total, 25);
      assert.equal(new Set([...first.rows, ...second.rows].map((r) => r.id)).size, 25);
      assert.equal(first.rows[0].id, leadId);
      assert.equal((await json(read('list', ca, wa, { q: '%' }))).total, 2);
      assert.equal((await json(read('list', ca, wa, { q: 'paging' }))).total, 22);
      assert.equal((await json(read('list', ca, wa, { assigned: admin.id }))).total, 1);
      assert.equal((await json(read('list', ca, wa, { assigned: 'unassigned' }))).total, 24);
      assert.equal((await json(read('list', ca, wa, { status: 'NEW' }))).total, 24);
      assert.equal((await json(read('stats'))).total, 25);
      await client.query("UPDATE lead SET review_at=now()-interval '1 day' WHERE id=$1", [leadId]);
      assert.equal((await json(read('list', ca, wa, { review: 'due' }))).total, 1);
      for (const filters of [
        { page: '0' },
        { sort: 'bogus' },
        { status: 'bogus' },
        { q: 'x'.repeat(121) },
      ])
        await status(read('list', ca, wa, filters), 400);
      assert.equal((await json(read('list', cb, wb))).total, 0);
    },
  );
  await t.test('member removal clears assignments atomically and revokes access', async () => {
    await status(change('assign', { id: leadId, version: 6, assignee: member.id }), 200);
    await status(workspace('remove', ca, { workspaceId: wa, memberId: member.id }), 200);
    await status(read('list', cm), 404);
    const data = await json(read('detail', ca, wa, { id: leadId }));
    assert.equal(data.lead.assignedToUserId, null);
    assert.equal(data.lead.version, 8);
    assert.equal(data.activity[0].action, 'MEMBER_REMOVED');
  });
  await t.test(
    'confirmed retention deletion removes PII and history but prevents retry resurrection',
    async () => {
      // The original submission keeps its original form version in its receipt.
      await status(change('delete', { id: leadId, version: 8 }), 200);
      await status(read('detail', ca, wa, { id: leadId }), 404);
      assert.equal(
        (await client.query('SELECT * FROM lead_activity WHERE lead_id=$1', [leadId])).rowCount,
        0,
      );
      await status(send({ ...payload, formVersion: 1 }, key), 200);
      assert.equal((await json(read('list'))).total, 24);
      assert.equal((await json(read('forms'))).forms.find((f) => f.id === form.id).submissions, 25);
    },
  );
  await t.test('concurrent first submissions claim one receipt, lead and activity', async () => {
    const freshKey = randomUUID(),
      body = {
        ...payload,
        customerEmail: 'concurrent-first@example.test',
        subject: 'Simultaneous first submission',
      };
    const before = (await json(read('stats'))).total;
    await Promise.all(Array.from({ length: 6 }, () => status(send(body, freshKey), 200)));
    assert.equal((await json(read('stats'))).total, before + 1);
    const records = (
      await client.query('SELECT id FROM lead WHERE workspace_id=$1 AND subject=$2', [
        wa,
        body.subject,
      ])
    ).rows;
    assert.equal(records.length, 1);
    assert.equal(
      (await client.query('SELECT * FROM lead_activity WHERE lead_id=$1', [records[0].id]))
        .rowCount,
      1,
    );
    assert.equal(
      (await client.query('SELECT * FROM lead_receipt WHERE key=$1', [freshKey])).rowCount,
      1,
    );
    const current = await row(ca, wa, records[0].id);
    await status(
      change('assign', { id: current.id, version: current.version, assignee: admin.id }),
      200,
    );
    await status(workspace('leave', cd, { workspaceId: wa }), 200);
    assert.equal((await row(ca, wa, current.id)).assignedToUserId, null);
    await status(read('detail', cd, wa, { id: current.id }), 404);
  });
  await t.test('per-mailbox abuse quota and safe server logs', async () => {
    const body = { ...payload, customerEmail: 'limited@example.test' };
    for (let i = 0; i < 8; i++) await status(send(body), 200);
    await status(send(body), 429);
    for (const secret of [payload.customerEmail, payload.message, payload.customerPhone])
      assert.ok(!logs().includes(secret), 'No customer PII in server logs');
  });
}
