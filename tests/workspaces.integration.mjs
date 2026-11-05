import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';

export async function testWorkspaces({
  base,
  origin,
  client,
  post,
  login,
  get,
  mailToken,
  inbox,
  b,
  ca,
  cb,
  ua,
  ub,
}) {
  const write = (action, cookie, body = {}, source = origin) =>
    fetch(base + '/api/workspaces/' + action, {
      method: 'POST',
      headers: { cookie, origin: source, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  const read = (action, id, cookie) => get('/api/workspaces/' + action + '?id=' + id, cookie);
  const status = async (p, n) => assert.equal((await p).status, n);
  const json = async (p, n = 200) => {
    const r = await p;
    assert.equal(r.status, n);
    return r.json();
  };
  await status(write('create', '', { name: 'No' }), 401);
  await status(write('create', ca, { name: 'No' }, 'https://foreign.example'), 403);
  for (const f of [
    { name: '' },
    { name: 'A', role: 'OWNER' },
    { name: 'A', website: 'javascript:alert(1)' },
  ])
    await status(write('create', ca, f), 400);
  const first = await json(write('create', ca, { name: 'Example' }), 201),
    other = await json(write('create', cb, { name: 'Example' }), 201);
  assert.notEqual(first.id, other.id);
  const id = first.id;
  const act = (action, cookie, fields = {}) =>
    write(action, cookie, { workspaceId: id, ...fields });
  const info = await json(read('details', id, ca));
  assert.equal(info.role, 'OWNER');
  assert.equal(info.members, 1);
  await status(read('details', other.id, ca), 404);
  await status(read('team', id, cb), 404);
  await status(act('switch', cb), 404);
  await status(write('settings', ca, { workspaceId: other.id, name: 'Forged' }), 404);
  await status(act('leave', ca), 403);
  await status(act('role', ca, { memberId: ua.id, role: 'MEMBER' }), 403);
  await status(act('settings', ca, { name: 'Updated', description: 'Private business' }), 200);
  const c = { email: 'ordinary@example.test', password: randomBytes(20).toString('hex') };
  async function invitation(email, role, issuer = ca) {
    const offset = inbox.length;
    await status(act('invite', issuer, { email, role }), 200);
    return mailToken('/join', offset);
  }
  async function challenge(cookie, token) {
    const offset = inbox.length;
    await status(write('challenge', cookie, { token }), 200);
    const raw = inbox
      .slice(offset)
      .find((m) => m.includes('Confirm your Growora workspace invitation'));
    assert.ok(raw);
    const match = raw.match(/confirmation code is (\d{8})/);
    assert.ok(match);
    return match[1];
  }
  const token = await invitation(b.email, 'ADMIN');
  await status(act('invite', ca, { email: b.email, role: 'ADMIN' }), 409);
  await status(write('challenge', ca, { token }), 400);
  const code = await challenge(cb, token);
  await status(write('accept', cb, { token, code: '00000000' }), 400);
  const otherSession = await login(b);
  await status(write('accept', otherSession, { token, code }), 400);
  const raced = await Promise.all([
    write('accept', cb, { token, code }),
    write('accept', cb, { token, code }),
  ]);
  assert.deepEqual(raced.map((r) => r.status).sort(), [200, 400]);
  assert.equal((await json(read('details', id, cb))).role, 'ADMIN');
  const list = await json(read('list', '', cb));
  assert.equal(list.workspaces.length, 2);
  const switched = await act('switch', cb);
  assert.equal(switched.status, 200);
  assert.ok(switched.headers.getSetCookie().some((s) => s.startsWith('growora-workspace=' + id)));
  await status(act('settings', cb, { name: 'No' }), 403);
  await status(act('remove', cb, { memberId: ua.id }), 403);
  await status(act('invite', cb, { email: c.email, role: 'ADMIN' }), 403);
  const memberToken = await invitation(c.email, 'MEMBER', cb);
  await status(post('signup', { ...c, name: 'Member' }), 200);
  const cc = await login(c);
  const uc = (await json(get('/api/auth/me', cc))).user;
  let memberCode = await challenge(cc, memberToken);
  await status(write('accept', cc, { token: memberToken, code: memberCode }), 200);
  assert.equal((await json(read('team', id, cc))).invites.length, 0);
  for (const [action, f] of [
    ['invite', { email: 'denied@example.test', role: 'MEMBER' }],
    ['role', { memberId: uc.id, role: 'ADMIN' }],
    ['remove', { memberId: ua.id }],
    ['settings', { name: 'No' }],
  ])
    await status(act(action, cc, f), 403);
  const toRevoke = await invitation('extra@example.test', 'MEMBER', cb);
  let pending = (await json(read('team', id, ca))).invites[0];
  await status(write('cancel', cb, { workspaceId: other.id, inviteId: pending.id }), 404);
  await status(act('cancel', cb, { inviteId: pending.id }), 200);
  await status(write('challenge', ca, { token: toRevoke }), 400);
  await status(act('role', ca, { memberId: ub.id, role: 'MEMBER' }), 200);
  await status(act('invite', cb, { email: 'another@example.test', role: 'MEMBER' }), 403);
  await status(act('role', ca, { memberId: ub.id, role: 'ADMIN' }), 200);
  const changes = await Promise.all([
    act('remove', cb, { memberId: uc.id }),
    act('role', ca, { memberId: uc.id, role: 'ADMIN' }),
  ]);
  assert.ok(changes.some((r) => r.status === 200));
  const result = await read('details', id, cc);
  if (result.ok) await status(act('remove', ca, { memberId: uc.id }), 200);
  await status(read('details', id, cc), 404);
  await status(act('switch', cc), 404);
  const revoked = await invitation(c.email, 'MEMBER');
  pending = (await json(read('team', id, ca))).invites[0];
  await status(act('cancel', ca, { inviteId: pending.id }), 200);
  await status(write('challenge', cc, { token: revoked }), 400);
  const expired = await invitation(c.email, 'MEMBER');
  memberCode = await challenge(cc, expired);
  const hashed = createHash('sha256').update(expired).digest('hex');
  await client.query(
    "UPDATE workspace_invitation SET code_expires=now()-interval '1 minute' WHERE token_hash=$1",
    [hashed],
  );
  await status(write('accept', cc, { token: expired, code: memberCode }), 400);
  memberCode = await challenge(cc, expired);
  await client.query(
    "UPDATE workspace_invitation SET expires_at=now()-interval '1 minute' WHERE token_hash=$1",
    [hashed],
  );
  await status(write('accept', cc, { token: expired, code: memberCode }), 400);
  await status(act('leave', cb), 200);
  await status(read('team', id, cb), 404);
  assert.equal((await json(read('details', other.id, cb))).role, 'OWNER');
  const audit = await client.query(
    'SELECT event,target FROM workspace_audit WHERE workspace_id=$1',
    [id],
  );
  assert.ok(audit.rows.some((r) => r.event === 'invitation.accepted'));
  assert.ok(!JSON.stringify(audit.rows).includes(token));
  assert.equal((await json(read('details', id, ca))).members, 1);
  // Force the owner insert to fail in this disposable database and verify all creation writes roll back.
  await client.query(
    "CREATE FUNCTION reject_test_owner() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test rollback'; END $$",
  );
  await client.query(
    'CREATE TRIGGER reject_test_owner BEFORE INSERT ON workspace_membership FOR EACH ROW EXECUTE FUNCTION reject_test_owner()',
  );
  try {
    await status(write('create', ca, { name: 'Rollback test' }), 503);
    assert.equal(
      (await client.query("SELECT id FROM workspace WHERE name='Rollback test'")).rowCount,
      0,
    );
  } finally {
    await client.query('DROP TRIGGER reject_test_owner ON workspace_membership');
    await client.query('DROP FUNCTION reject_test_owner()');
  }
  console.log(
    'PASS workspace creation, isolation, role matrix, ownership protection, switching, invitation expiry, mailbox binding, replay and concurrency',
  );
}
