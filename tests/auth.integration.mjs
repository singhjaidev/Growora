import { testWorkspaces } from './workspaces.integration.mjs';
import { testIntelligenceAPI } from './intelligence-api.integration.mjs';
import { testLeads } from './leads.integration.mjs';
import { testRoutingAPI } from './routing-api.integration.mjs';
import { testAuditAPI } from './audit-api.integration.mjs';
import { seedMarketingOwner, testMarketing } from './marketing.integration.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import EmbeddedPostgres from 'embedded-postgres';
import { SMTPServer } from 'smtp-server';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function unusedPort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

test(
  'production HTTP account lifecycle with disposable PostgreSQL and SMTP',
  { timeout: process.env.PHASE8_BROWSER === '1' ? 180000 : 120000 },
  async (t) => {
    const port = await unusedPort();
    const password = randomBytes(24).toString('hex');
    const pg = new EmbeddedPostgres({
      databaseDir: await mkdtemp(join(tmpdir(), 'growora-auth-')),
      port,
      user: 'auth_test',
      password,
      persistent: false,
      autoRehydrateSymlinks: true,
      onLog: () => {},
      onError: () => {},
    });
    let client, smtp, app;
    const originalFetch = globalThis.fetch;
    const responses = new Set();
    globalThis.fetch = async (...args) => {
      const response = await originalFetch(...args);
      responses.add(response);
      return response;
    };
    // Close clients before their servers. Keep real assertions and natural process exit.
    t.after(async () => {
      globalThis.fetch = originalFetch;
      let unread = 0;
      for (const response of responses) {
        if (response.body && !response.bodyUsed && !response.body.locked) {
          unread++;
          await response.body.cancel();
        }
      }
      console.log('HTTP cleanup: cancelled', unread, 'unread response bodies');
      if (app && app.exitCode === null && !app.killed) {
        const stopped = once(app, 'exit');
        app.kill();
        await stopped;
      }
      if (smtp) await new Promise((resolve) => smtp.close(resolve));
      if (client) await client.end();
      await pg.stop();
    });
    await pg.initialise();
    await pg.start();
    client = pg.getPgClient();
    await client.connect();
    await migrate(drizzle(client), { migrationsFolder: 'migrations' });
    await migrate(drizzle(client), { migrationsFolder: 'migrations' });
    const marketingOwner = await seedMarketingOwner(client);

    const inbox = [];
    smtp = new SMTPServer({
      authOptional: true,
      disabledCommands: ['AUTH', 'STARTTLS'],
      onData(stream, _session, callback) {
        let mail = '';
        stream.on('data', (chunk) => {
          mail += chunk;
        });
        stream.on('end', () => {
          inbox.push(mail);
          callback();
        });
      },
    });
    const smtpPort = await unusedPort();
    await new Promise((resolve) => smtp.listen(smtpPort, '127.0.0.1', resolve));
    const httpPort = await unusedPort();
    const base = 'http://127.0.0.1:' + httpPort;
    const origin = 'https://account.example.test';
    const secret = randomBytes(48).toString('hex');
    let logs = '';
    app = spawn(
      process.execPath,
      ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(httpPort)],
      {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://auth_test:' + password + '@127.0.0.1:' + port + '/postgres',
          BETTER_AUTH_URL: origin,
          BETTER_AUTH_SECRET: secret,
          SMTP_HOST: '127.0.0.1',
          SMTP_PORT: String(smtpPort),
          SMTP_USER: '',
          SMTP_PASSWORD: '',
          MAIL_FROM: 'accounts@example.test',
          AUTH_CLIENT_IP_HEADER: '',
          MARKETING_WEBSITE_OWNER_IDS: marketingOwner.id,
          AI_ENABLED: 'true',
          OPENAI_API_KEY: 'TEST_FIXTURE_KEY_NEVER_SENT',
          AI_MODEL: 'TEST_FIXTURE_NOT_LIVE',
          AI_PROCESSING_POLICY: 'synthetic-api-test',
          AI_APPROVED_WORKSPACE_IDS: '11111111-1111-1111-1111-111111111111',
        },
      },
    );
    app.stdout.on('data', (chunk) => {
      logs += chunk;
    });
    app.stderr.on('data', (chunk) => {
      logs += chunk;
    });
    const get = (path, cookie = '') =>
      fetch(base + path, { headers: { cookie }, redirect: 'manual' });
    const post = (action, body = {}, cookie = '', source = origin) =>
      fetch(base + '/api/auth/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: source, cookie },
        body: JSON.stringify(body),
      });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await get('/')).ok) {
          ready = true;
          break;
        }
      } catch {}
      await delay(100);
    }
    assert.ok(ready, 'production server ready');
    for (const path of [
      '/',
      '/product',
      '/integrations',
      '/pricing',
      '/solutions',
      '/how-it-works',
      '/login',
      '/signup',
      '/reset-password',
      '/forgot-password',
    ]) {
      const r = await get(path);
      assert.equal(r.status, 200, path);
      assert.match(await r.text(), /<h1/);
    }
    for (const path of [
      '/app',
      '/app/leads',
      '/verify-email',
      '/demo',
      '/about',
      '/docs',
      '/contact',
      '/privacy',
      '/terms',
      '/guides',
      '/api/auth/get-session',
    ])
      assert.equal((await get(path)).status, 404, path);

    async function mailToken(route, offset) {
      for (let i = 0; i < 100; i++) {
        for (const message of inbox.slice(offset)) {
          const split = message.indexOf('\r\n\r\n');
          let body = message.slice(split + 4);
          if (/Content-Transfer-Encoding: base64/i.test(message.slice(0, split)))
            body = Buffer.from(body, 'base64').toString();
          else body = body.replace(/=\r?\n/g, '').replace(/=3D/gi, '=');
          const match = body.match(/https:\/\/account\.example\.test\/[^\s]+/);
          if (match) {
            const url = new URL(match[0]);
            if (url.pathname === route) return new URLSearchParams(url.hash.slice(1)).get('token');
          }
        }
        await delay(50);
      }
      assert.fail('Expected email with ' + route + ' link');
    }
    const email = 'member@example.test',
      pass = randomBytes(18).toString('hex');
    const form = { name: 'Test member', email: '  MEMBER@example.test ', password: pass };
    assert.equal((await get('/api/auth/me')).status, 401);
    assert.equal((await post('signup', form, '', 'https://foreign.example')).status, 403);
    assert.equal((await post('signup', { ...form, password: 'short' })).status, 400);
    assert.equal((await post('signup', { ...form, email: 'bad' })).status, 400);
    const signup = await post('signup', form);
    assert.equal(signup.status, 200);
    assert.deepEqual(await signup.json(), { ok: true });
    const signupCookie = signup.headers
      .getSetCookie()
      .find((c) => c.includes('session_token='))
      ?.split(';')[0];
    assert.ok(signupCookie);
    assert.equal((await get('/api/auth/me', signupCookie)).status, 200);
    const duplicate = await post('signup', { ...form, password: randomBytes(20).toString('hex') });
    assert.equal(duplicate.status, 400);
    assert.equal(duplicate.headers.getSetCookie().length, 0);
    assert.equal((await post('verify', {})).status, 404);
    assert.equal(inbox.length, 0);
    const creds = { email, password: pass };
    const denied = await post('login', { email, password: 'incorrect' });
    const unknown = await post('login', { email: 'unknown@example.test', password: 'incorrect' });
    assert.equal(denied.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(await denied.json(), await unknown.json());
    async function login(credentials) {
      const r = await post('login', credentials);
      assert.equal(r.status, 200);
      assert.deepEqual(await r.json(), { ok: true });
      const value = r.headers.getSetCookie().find((c) => c.includes('session_token='));
      for (const flag of [/HttpOnly/i, /Secure/i, /SameSite=Lax/i])
        assert.ok(flag.test(value), 'cookie attribute');
      return value.split(';')[0];
    }
    const cookie = await login(creds);
    for (let i = 0; i < 2; i++) {
      const r = await get('/api/auth/me', cookie);
      assert.equal(r.status, 200);
      const { user } = await r.json();
      assert.deepEqual(Object.keys(user).sort(), ['email', 'emailVerified', 'id', 'name']);
      assert.equal(user.email, email);
    }
    const logout = await post('logout', {}, cookie);
    assert.equal(logout.status, 200);
    assert.ok(logout.headers.getSetCookie().some((c) => /Max-Age=0/i.test(c)));
    assert.equal((await get('/api/auth/me', cookie)).status, 401);
    const second = await login(creds);
    const missing = await post('forgot', { email: 'missing@example.test' });
    let offset = inbox.length;
    const recovery = await post('forgot', { email });
    assert.equal(recovery.status, 200);
    assert.equal(missing.status, 200);
    assert.deepEqual(await recovery.json(), await missing.json());
    const expired = await mailToken('/reset-password', offset);
    await client.query("UPDATE auth_verification SET expires_at=now()-interval '1 minute'");
    const newPass = randomBytes(18).toString('hex');
    assert.equal((await post('reset', { token: expired, password: newPass })).status, 400);
    offset = inbox.length;
    assert.equal((await post('forgot', { email })).status, 200);
    const valid = await mailToken('/reset-password', offset);
    const racing = await Promise.all([
      post('reset', { token: valid, password: newPass }),
      post('reset', { token: valid, password: newPass }),
    ]);
    assert.deepEqual(racing.map((r) => r.status).sort(), [200, 400]);
    assert.equal((await get('/api/auth/me', second)).status, 401);
    assert.equal((await get('/api/auth/me', signupCookie)).status, 401);
    assert.equal((await post('login', creds)).status, 401);
    await login({ email, password: newPass });
    let last;
    for (let i = 0; i < 9; i++)
      last = await post('login', { email: 'limited@example.test', password: 'incorrect' });
    assert.equal(last.status, 429);
    // Independent accounts and devices exercise the actual ownership and session boundaries.
    const dashboardPages = [
      '/dashboard',
      '/dashboard/settings/profile',
      '/dashboard/settings/security',
    ];
    const accountPost = (action, fields, cookie = '', source = origin) =>
      fetch(base + '/api/account/' + action, {
        method: 'POST',
        headers: { cookie, origin: source, 'content-type': 'application/json' },
        body: JSON.stringify(fields),
      });
    async function redirected(path, cookie, destination) {
      const response = await get(path, cookie);
      if (response.status === 307)
        assert.equal(new URL(response.headers.get('location'), base).pathname, destination);
      else {
        const html = await response.text();
        assert.match(html, /NEXT_REDIRECT/);
        assert.ok(html.includes(destination));
        assert.ok(!html.includes('Private Name A'));
      }
    }
    for (const path of dashboardPages) await redirected(path, '', '/login');
    for (const action of ['profile', 'password', 'revoke', 'revoke-others'])
      assert.equal((await accountPost(action, {})).status, 401);
    const a = { email: 'a@example.test', password: randomBytes(20).toString('hex') };
    const b = { email: 'b@example.test', password: randomBytes(20).toString('hex') };
    for (const user of [a, b])
      assert.equal((await post('signup', { ...user, name: user.email })).status, 200);
    const ca = await login(a),
      cb = await login(b);
    const ua = (await (await get('/api/auth/me', ca)).json()).user;
    const ub = (await (await get('/api/auth/me', cb)).json()).user;
    await testWorkspaces({
      base,
      origin,
      client,
      post,
      login,
      get,
      mailToken,
      inbox,
      a,
      b,
      ca,
      cb,
      ua,
      ub,
    });
    await testLeads({
      t,
      base,
      origin,
      client,
      post,
      login,
      get,
      ca,
      cb,
      ua,
      ub,
      logs: () => logs,
    });
    await testIntelligenceAPI({ t, base, origin, client, get, ca, cb, ua, ub });
    await testRoutingAPI({ t, base, origin, client, get, ca, cb, ua, ub });
    await testAuditAPI({ t, base, origin, client, get, ca, cb, ua, ub });
    await testMarketing({ t, base, origin, client, get, ca, cb, ua, ub, login, marketingOwner });
    const sb = (await client.query('SELECT id FROM auth_session WHERE user_id=$1', [ub.id])).rows[0]
      .id;
    assert.equal((await accountPost('profile', { name: 'No', id: ub.id }, ca)).status, 400);
    assert.equal((await accountPost('profile', { name: 'No', email: b.email }, ca)).status, 400);
    for (const name of ['  ', 'a'.repeat(101)])
      assert.equal((await accountPost('profile', { name }, ca)).status, 400);
    assert.equal(
      (await accountPost('profile', { name: 'No' }, ca, 'https://foreign.example')).status,
      403,
    );
    assert.equal((await accountPost('profile', { name: '  Private   Name A  ' }, ca)).status, 200);
    assert.equal((await (await get('/api/auth/me?id=' + ub.id, ca)).json()).user.id, ua.id);
    assert.equal((await (await get('/api/auth/me', cb)).json()).user.name, b.email);
    for (const path of dashboardPages) {
      const r = await get(path, ca);
      assert.equal(r.status, 200);
      const html = await r.text();
      assert.ok(html.includes('Private Name A'));
      assert.ok(!html.includes(b.email));
      assert.ok(!html.includes(ca.split('=')[1]));
      assert.match(r.headers.get('cache-control'), /private|no-store/);
    }
    for (const path of ['/login', '/signup']) await redirected(path, ca, '/dashboard');
    assert.equal((await accountPost('revoke', { id: sb }, ca)).status, 404);
    const ownSessions = (
      await client.query('SELECT id,token FROM auth_session WHERE user_id=$1 ORDER BY created_at', [
        ua.id,
      ])
    ).rows;
    const html = await (await get('/dashboard/settings/security', ca)).text();
    for (const row of ownSessions) assert.ok(!html.includes(row.token));
    assert.equal((await accountPost('revoke', { id: ownSessions[0].id }, ca)).status, 200);
    assert.equal(
      (await client.query('SELECT id FROM auth_session WHERE id=$1', [ownSessions[0].id])).rowCount,
      0,
    );
    const another = await login(a);
    assert.equal((await accountPost('revoke-others', {}, ca)).status, 200);
    await redirected('/dashboard', another, '/login');
    assert.equal((await accountPost('profile', { name: 'No' }, another)).status, 401);
    const expiredCookie = await login(a);
    await client.query(
      "UPDATE auth_session SET expires_at=now()-interval '1 minute' WHERE id=(SELECT id FROM auth_session WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1)",
      [ua.id],
    );
    await redirected('/dashboard/settings/security', expiredCookie, '/login');
    const newPassword = randomBytes(20).toString('hex');
    assert.equal(
      (await accountPost('password', { currentPassword: 'incorrect', newPassword }, ca)).status,
      400,
    );
    const pc = await accountPost('password', { currentPassword: a.password, newPassword }, ca);
    assert.equal(pc.status, 200);
    assert.deepEqual(await pc.json(), { ok: true });
    assert.equal((await get('/api/auth/me', ca)).status, 401);
    const rotated = pc.headers
      .getSetCookie()
      .find((c) => c.includes('session_token='))
      .split(';')[0];
    assert.equal((await get('/api/auth/me', rotated)).status, 200);
    assert.equal((await post('login', a)).status, 401);
    await login({ ...a, password: newPassword });
    assert.equal((await post('logout', {}, rotated)).status, 200);
    await redirected('/dashboard', rotated, '/login');
    assert.equal((await get('/dashboard', cb)).status, 200);
    const hash = (await client.query('SELECT password FROM auth_account')).rows[0].password;
    assert.ok(hash && hash !== pass && hash !== newPass);
    for (const sensitive of [secret, pass, newPass, email, valid, cookie, signupCookie])
      assert.ok(!logs.includes(sensitive), 'logs exclude sensitive values');
  },
);
