import { Pool } from 'pg';
import nextEnv from '@next/env';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { configuration } from '../src/server/intelligence/config.ts';
import { runOnce } from '../src/server/intelligence/worker.ts';
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') throw Error('DATABASE_URL required');
  const local = JSON.parse(readFileSync('.growora-local/credentials.json', 'utf8'));
  process.env.DATABASE_URL =
    'postgresql://growora_local:' + local.password + '@127.0.0.1:55432/postgres';
  process.env.BETTER_AUTH_SECRET = local.secret;
}
const config = configuration(),
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: (config?.concurrency ?? 1) + 1,
    connectionTimeoutMillis: 5000,
  });
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => {
    stopping = true;
  });
console.log(
  JSON.stringify({
    event: 'ai.worker_started',
    configured: Boolean(config),
    concurrency: config?.concurrency ?? 1,
  }),
);
try {
  do {
    try {
      await Promise.all(
        Array.from({ length: config?.concurrency ?? 1 }, () => runOnce(pool, config)),
      );
    } catch {
      console.error(JSON.stringify({ event: 'ai.worker_database_error' }));
      if (process.argv.includes('--once')) process.exitCode = 1;
    }
    if (process.argv.includes('--once')) break;
    if (!stopping) await delay(2000);
  } while (!stopping);
} finally {
  await pool.end();
}
