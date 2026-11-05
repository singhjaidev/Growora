import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { APIError } from 'better-auth/api';
import { getService } from '@/server/auth/service';

const current = cache(async () => {
  const h = await headers();
  if (!h.has('cookie')) return null;
  return getService().auth.api.getSession({ headers: h });
});
export async function getProfile() {
  const identity = await current();
  if (!identity) return null;
  const { id, name, email, emailVerified, createdAt } = identity.user;
  return { id, name, email, emailVerified, createdAt: createdAt.toISOString() };
}
export async function requireProfile() {
  return (await getProfile()) ?? redirect('/login');
}
export async function activeSessions() {
  const identity = await current();
  if (!identity) redirect('/login');
  try {
    const rows = await getService().auth.api.listSessions({ headers: await headers() });
    return rows
      .map(({ id, createdAt, expiresAt }) => ({
        id,
        started: createdAt.toISOString(),
        expires: expiresAt.toISOString(),
        current: id === identity.session.id,
      }))
      .sort((a, b) => Number(b.current) - Number(a.current) || b.started.localeCompare(a.started));
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 403) return null;
    if (error instanceof APIError && error.statusCode === 401) redirect('/login');
    throw error;
  }
}
