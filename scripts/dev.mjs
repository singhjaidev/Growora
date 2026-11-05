import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import nextEnv from '@next/env';
import EmbeddedPostgres from 'embedded-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

nextEnv.loadEnvConfig(process.cwd(), true);
const env = { ...process.env };
const args = process.argv.slice(2);
const keys = [
  'DATABASE_URL',
  'BETTER_AUTH_URL',
  'BETTER_AUTH_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'MAIL_FROM',
];
let cluster;
let app;
let intelligenceWorker;
let routingWorker;
let stage = 'initializing the development environment';

async function localSetup() {
  const root = resolve('.growora-local');
  const dbDir = resolve(root, 'postgres');
  await mkdir(resolve(root, 'inbox'), { recursive: true, mode: 0o700 });
  const credentials = resolve(root, 'credentials.json');
  if (!existsSync(credentials)) {
    await writeFile(
      credentials,
      JSON.stringify({
        password: randomBytes(32).toString('hex'),
        secret: randomBytes(48).toString('hex'),
      }),
      { flag: 'wx', mode: 0o600 },
    );
  }
  const { password, secret } = JSON.parse(await readFile(credentials, 'utf8'));
  const dbPort = 55432;
  const appPort = Number(env.PORT || 3000);
  if (args.length) throw new Error('For the bundled local setup, use PORT to select the app port.');
  stage = 'starting local PostgreSQL on port ' + dbPort;
  cluster = new EmbeddedPostgres({
    databaseDir: dbDir,
    port: dbPort,
    user: 'growora_local',
    password,
    persistent: true,
    authMethod: 'scram-sha-256',
    postgresFlags: ['-h', '127.0.0.1'],
    autoRehydrateSymlinks: true,
    onLog: () => {},
    onError: () => {},
  });
  if (!existsSync(resolve(dbDir, 'PG_VERSION'))) await cluster.initialise();
  await cluster.start();
  stage = 'applying local database migrations';
  const client = cluster.getPgClient('postgres', '127.0.0.1');
  await client.connect();
  try {
    await migrate(drizzle(client), { migrationsFolder: 'migrations' });
  } finally {
    await client.end();
  }
  Object.assign(env, {
    DATABASE_URL: 'postgresql://growora_local:' + password + '@127.0.0.1:' + dbPort + '/postgres',
    BETTER_AUTH_SECRET: secret,
    BETTER_AUTH_URL: 'http://localhost:' + appPort,
    GROWORA_LOCAL_INBOX: '1',
  });
  args.push('--hostname', 'localhost', '--port', String(appPort));
  console.log(
    'Signup: ' +
      env.BETTER_AUTH_URL +
      '/signup\nDevelopment password reset mail: ' +
      resolve(root, 'inbox'),
  );
}

try {
  if (keys.some((key) => env[key])) {
    const missing = keys.filter((key) => !env[key]);
    if (missing.length) throw new Error('Missing configuration: ' + missing.join(', '));
  } else {
    await localSetup();
  }
  stage = 'starting Next.js';
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', ...args], {
    env,
    stdio: 'inherit',
    windowsHide: true,
  });
  intelligenceWorker = spawn(
    process.execPath,
    ['--experimental-strip-types', 'scripts/ai-worker.ts'],
    { env, stdio: 'inherit', windowsHide: true },
  );
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => app.kill());
  routingWorker = spawn(
    process.execPath,
    ['--experimental-strip-types', 'scripts/routing-worker.ts'],
    { env, stdio: 'inherit', windowsHide: true },
  );
  const [code] = await once(app, 'exit');
  process.exitCode = code ?? 0;
} catch (error) {
  console.error(
    'Growora failed while ' + stage + '.',
    stage === 'initializing the development environment'
      ? error.message
      : 'Check for another running instance or a port conflict.',
  );
  process.exitCode = 1;
} finally {
  if (routingWorker && routingWorker.exitCode === null) {
    routingWorker.kill();
    await once(routingWorker, 'exit');
  }
  if (intelligenceWorker && intelligenceWorker.exitCode === null) {
    intelligenceWorker.kill();
    await once(intelligenceWorker, 'exit');
  }
  if (cluster?.process && cluster.process.exitCode === null && cluster.process.signalCode === null)
    await cluster.stop();
}
