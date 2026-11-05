import { Pool } from 'pg';
import nextEnv from '@next/env';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { runRoutingOnce } from '../src/server/routing/worker.ts';
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') throw Error('DATABASE_URL required');
  const { password } = JSON.parse(readFileSync('.growora-local/credentials.json', 'utf8'));
  process.env.DATABASE_URL = 'postgresql://growora_local:' + password + '@127.0.0.1:55432/postgres';
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 5000,
});
let stop = false;
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => {
    stop = true;
  });
console.log(JSON.stringify({ event: 'routing.worker_started' }));
try {
  do {
    try {
      await Promise.all([runRoutingOnce(pool), runRoutingOnce(pool)]);
    } catch {
      console.error(JSON.stringify({ event: 'routing.database_error' }));
      if (process.argv.includes('--once')) process.exitCode = 1;
    }
    if (process.argv.includes('--once')) break;
    if (!stop) await delay(2000);
  } while (!stop);
} finally {
  await pool.end();
}
