import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { defaultPolicy } from '../src/server/routing/engine.ts';
export async function testRoutingAPI({ t, base, origin, client, get, ca, cb, ua, ub }) {
  const w = randomUUID(),
    other = randomUUID(),
    form = randomUUID(),
    foreignForm = randomUUID(),
    id = randomUUID(),
    foreign = randomUUID(),
    publicId = randomBytes(24).toString('hex');
  await client.query(
    "INSERT INTO workspace(id,name) VALUES($1,'Routing API'),($2,'Foreign routing')",
    [w, other],
  );
  await client.query(
    "INSERT INTO workspace_membership(workspace_id,user_id,role) VALUES($1,$2,'OWNER'),($1,$3,'MEMBER'),($4,$3,'OWNER')",
    [w, ua.id, ub.id, other],
  );
  for (const [wid, f, l, p] of [
    [w, form, id, publicId],
    [other, foreignForm, foreign, randomBytes(24).toString('hex')],
  ]) {
    await client.query(
      "INSERT INTO lead_form(id,workspace_id,public_id,name,privacy_notice) VALUES($1,$2,$3,'Routing enquiry','Notice')",
      [f, wid, p],
    );
    await client.query(
      "INSERT INTO lead(id,workspace_id,source_form_id,customer_name,customer_email,subject,message,consent_notice) VALUES($1,$2,$3,'Routing customer','routing@example.test','Routing','Packaging request','Notice')",
      [l, wid, f],
    );
  }
  const read = (action = 'settings', cookie = ca, wid = w, extra = {}) =>
    get(
      '/api/routing/' + action + '?' + new URLSearchParams({ workspaceId: wid, ...extra }),
      cookie,
    );
  const write = (action, fields = {}, cookie = ca, wid = w, source = origin) =>
    fetch(base + '/api/routing/' + action, {
      method: 'POST',
      headers: { cookie, origin: source, 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceId: wid, ...fields }),
    });
  const json = async (p, expected = 200) => {
    const r = await p,
      b = await r.text();
    assert.equal(r.status, expected, b);
    return b ? JSON.parse(b) : {};
  };
  const policy = { ...defaultPolicy, enabled: true, strategy: 'ROUND_ROBIN' };
  const profile = {
    memberId: ua.id,
    version: 0,
    eligible: true,
    available: true,
    capacity: 2,
    skills: ['Packaging'],
  };
  const row = async () => (await client.query('SELECT * FROM lead WHERE id=$1', [id])).rows[0];
  const changeLead = (action, fields) =>
    fetch(base + '/api/leads/' + action, {
      method: 'POST',
      headers: { cookie: ca, origin, 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceId: w, id, ...fields }),
    });
  await t.test(
    'routing APIs enforce tenant, role, origin and mass-assignment boundaries',
    async () => {
      await json(read('settings', ''), 401);
      await json(read('settings', ca, other), 404);
      await json(read('settings', cb), 403);
      await json(read('preview', cb, w, { id }), 403);
      await json(read('preview', ca, w, { id: foreign }), 404);
      await json(write('policy', policy, cb), 403);
      await json(write('policy', policy, 'https://invalid-cookie'), 401);
      await json(write('policy', policy, ca, w, 'https://foreign.test'), 403);
      await json(write('policy', { ...policy, role: 'OWNER' }), 400);
      await json(write('profile', { ...profile, memberId: 'foreign-user' }), 404);
      await json(write('reroute', { id, version: 1 }, cb), 403);
      await json(write('reroute', { id: foreign, version: 1 }), 404);
      await json(read('history', ca, w, { id: foreign }), 404);
      assert.equal((await json(read())).policy.enabled, false);
    },
  );
  await t.test(
    'versioned policy and profiles validate input and respect admin hierarchy',
    async () => {
      await json(
        write('policy', { ...policy, formSkills: [{ formId: foreignForm, skill: 'packaging' }] }),
        400,
      );
      await json(write('policy', { ...policy, skillWeight: 101 }), 400);
      await json(write('policy', policy));
      await json(write('policy', policy), 409);
      await json(write('profile', { ...profile, capacity: 0 }), 400);
      await json(write('profile', profile));
      await json(write('profile', profile), 409);
      assert.deepEqual((await json(read())).members.find((m) => m.id === ua.id).skills, [
        'packaging',
      ]);
      await client.query(
        "UPDATE workspace_membership SET role='ADMIN' WHERE workspace_id=$1 AND user_id=$2",
        [w, ub.id],
      );
      await json(write('profile', { ...profile, version: 1 }, cb), 403);
      await json(write('profile', { ...profile, memberId: ub.id }, cb));
      await client.query(
        "UPDATE workspace_membership SET role='MEMBER' WHERE workspace_id=$1 AND user_id=$2",
        [w, ub.id],
      );
    },
  );
  await t.test('preview is a real shared-engine simulation with no database effects', async () => {
    await client.query('UPDATE member_routing_profile SET last_assigned_at=now() WHERE workspace_id=$1', [w]);
    const before = await row(),
      profiles = (
        await client.query(
          'SELECT * FROM member_routing_profile WHERE workspace_id=$1 ORDER BY user_id',
          [w],
        )
      ).rows;
    const tasks = (await client.query('SELECT * FROM routing_job WHERE workspace_id=$1', [w])).rows;
    const p = await json(read('preview', ca, w, { id }));
    assert.equal(p.simulation, true);
    assert.equal(p.decision.outcome, 'ASSIGNED');
    assert.ok(p.selectedName);
    await json(read('preview', ca, w, { id }));
    assert.deepEqual(await row(), before);
    assert.deepEqual(
      (
        await client.query(
          'SELECT * FROM member_routing_profile WHERE workspace_id=$1 ORDER BY user_id',
          [w],
        )
      ).rows,
      profiles,
    );
    assert.deepEqual(
      (await client.query('SELECT * FROM routing_job WHERE workspace_id=$1', [w])).rows,
      tasks,
    );
    assert.equal(
      (await client.query('SELECT * FROM routing_decision WHERE workspace_id=$1', [w])).rowCount,
      0,
    );
  });
  await t.test(
    'explicit reroute is atomic and manual unassignment invalidates queued revision',
    async () => {
      await json(write('reroute', { id, version: 1 }));
      await json(write('reroute', { id, version: 1 }), 409);
      const pending = await row();
      assert.equal(pending.routing_state, 'PENDING');
      assert.equal(pending.routing_revision, 1);
      assert.equal(
        (await client.query('SELECT * FROM routing_job WHERE lead_id=$1', [id])).rowCount,
        1,
      );
      await json(changeLead('assign', { version: pending.version, assignee: null }));
      const unassigned = await row();
      assert.equal(unassigned.routing_state, 'MANUAL');
      assert.equal(unassigned.routing_revision, 2);
      await json(write('reroute', { id, version: unassigned.version }));
      await json(changeLead('assign', { version: (await row()).version, assignee: ub.id }));
      await json(write('reroute', { id, version: (await row()).version }), 409);
      await json(read('history', cb, w, { id }));
      await json(read('history', cb), 403);
      await json(changeLead('assign', { version: (await row()).version, assignee: null }));
      await json(changeLead('status', { version: (await row()).version, status: 'CLOSED' }));
      await json(write('reroute', { id, version: (await row()).version }), 409);
      await json(read('history', cb, w, { id }), 404);
    },
  );
  await t.test(
    'public ingestion atomically schedules enabled routing and leaves manual workspaces untouched',
    async () => {
      const send = () =>
        fetch(base + '/api/enquiry/' + publicId, {
          method: 'POST',
          headers: { origin, 'content-type': 'application/json', 'idempotency-key': randomUUID() },
          body: JSON.stringify({
            formVersion: 1,
            customerName: 'Disposable routing',
            customerEmail: randomUUID() + '@example.test',
            customerPhone: '',
            subject: 'Packaging',
            message: 'Please quote packaging services.',
            consent: true,
            company: '',
          }),
        });
      await json(send());
      const inserted = (
        await client.query('SELECT * FROM lead WHERE workspace_id=$1 AND id<>$2', [w, id])
      ).rows[0];
      assert.equal(inserted.routing_state, 'PENDING');
      assert.equal(
        (await client.query('SELECT * FROM routing_job WHERE lead_id=$1', [inserted.id])).rowCount,
        1,
      );
      await json(write('policy', { ...defaultPolicy, version: 1 }));
      await json(send());
      const manual = (
        await client.query(
          "SELECT * FROM lead WHERE workspace_id=$1 AND id<>$2 AND routing_state='MANUAL'",
          [w, id],
        )
      ).rows[0];
      assert.ok(manual);
      assert.equal(
        (await client.query('SELECT * FROM routing_job WHERE lead_id=$1', [manual.id])).rowCount,
        0,
      );
      await json(write('reroute', { id: manual.id, version: manual.version }), 409);
    },
  );
  await t.test(
    'revocation immediately blocks routing access and releases assignments for review',
    async () => {
      await json(changeLead('assign', { version: (await row()).version, assignee: ub.id }));
      const r = await fetch(base + '/api/workspaces/remove', {
        method: 'POST',
        headers: { cookie: ca, origin, 'content-type': 'application/json' },
        body: JSON.stringify({ workspaceId: w, memberId: ub.id }),
      });
      await json(Promise.resolve(r));
      assert.equal((await row()).assigned_to_user_id, null);
      assert.equal((await row()).routing_state, 'REVIEW');
      assert.equal(
        (
          await client.query(
            'SELECT * FROM member_routing_profile WHERE workspace_id=$1 AND user_id=$2',
            [w, ub.id],
          )
        ).rowCount,
        0,
      );
      await json(read('settings', cb), 404);
      await json(read('history', cb, w, { id }), 404);
      await json(write('reroute', { id, version: (await row()).version }, cb), 404);
    },
  );
}
