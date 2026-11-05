import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { requireProfile } from '@/server/account/profile';
import { listWorkspaces } from './access';
export const workspaceContext = cache(async () => {
  const actor = await requireProfile();
  const rows = await listWorkspaces(actor.id);
  const selected = (await cookies()).get('growora-workspace')?.value;
  return { actor, rows, active: rows.find((w) => w.id === selected) ?? rows[0] ?? null };
});
