import { createHmac } from 'node:crypto';
import { sql, lt } from 'drizzle-orm';
import { getService } from '@/server/auth/service';
import { throttle } from '@/server/auth/schema';

export const reply = (status: number, body: object) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
export const failure = () => {
  console.error(JSON.stringify({ event: 'auth.request_failed' }));
  return reply(503, { message: 'Account service temporarily unavailable.' });
};

export async function withinLimit(scope: string, value: string, max: number) {
  const { db, secret } = getService();
  const key = createHmac('sha256', secret)
    .update(scope + ':' + value)
    .digest('hex');
  const windowEnd = sql`now() + interval '10 minutes'`;
  // Only the first writer for an expired window resets it, including across app instances.
  const [row] = await db
    .insert(throttle)
    .values({ key, hits: 1, expiresAt: windowEnd })
    .onConflictDoUpdate({
      target: throttle.key,
      set: {
        hits: sql`case when ${throttle.expiresAt} <= now() then 1 else ${throttle.hits} + 1 end`,
        expiresAt: sql`case when ${throttle.expiresAt} <= now() then ${windowEnd} else ${throttle.expiresAt} end`,
      },
    })
    .returning({ hits: throttle.hits });
  await db.delete(throttle).where(lt(throttle.expiresAt, sql`now()`));
  return row.hits <= max;
}

export { readFields, RequestSizeError } from './body';

export function copyCookies(from: Headers, to: Response) {
  for (const cookie of from.getSetCookie()) to.headers.append('Set-Cookie', cookie);
  return to;
}
