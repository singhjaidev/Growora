import 'server-only';
import { and, eq, gt, isNull, count, asc } from 'drizzle-orm';
import { getService } from '@/server/auth/service';
import { user } from '@/server/auth/schema';
import { workspace, membership, invitation, audit } from './schema';
import type { Role } from '@/lib/workspace-policy';
type Db = ReturnType<typeof getService>['db'];
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export class WorkspaceError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export function deny(status: number, message: string): never {
  throw new WorkspaceError(status, message);
}
export const unavailable = () => deny(404, 'Workspace or resource unavailable.');
export const forbidden = () => deny(403, 'Your workspace role does not allow this action.');
export const uuid = (s: unknown): s is string =>
  typeof s === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(s);
export const memberKey = (workspaceId: string, userId: string) =>
  and(eq(membership.workspaceId, workspaceId), eq(membership.userId, userId));
export const pending = (id: string) =>
  and(
    eq(invitation.workspaceId, id),
    isNull(invitation.closedAt),
    gt(invitation.expiresAt, new Date()),
  );
export async function record(
  tx: Tx,
  workspaceId: string,
  actorId: string,
  event: string,
  target?: string,
) {
  await tx.insert(audit).values({ workspaceId, actorId, event, target });
}
export function listWorkspaces(userId: string) {
  return getService()
    .db.select({ id: workspace.id, name: workspace.name, role: membership.role })
    .from(membership)
    .innerJoin(workspace, eq(workspace.id, membership.workspaceId))
    .where(eq(membership.userId, userId))
    .orderBy(asc(workspace.createdAt), asc(workspace.id));
}
export async function lockedWorkspace(tx: Tx, id: string, write: boolean) {
  if (!uuid(id)) return unavailable();
  const [w] = await tx
    .select()
    .from(workspace)
    .where(eq(workspace.id, id))
    .for(write ? 'update' : 'share');
  return w ?? unavailable();
}
export async function scoped<T>(
  userId: string,
  id: string,
  write: boolean,
  work: (tx: Tx, w: typeof workspace.$inferSelect, role: Role) => Promise<T>,
) {
  return getService().db.transaction(async (tx) => {
    const w = await lockedWorkspace(tx, id, write);
    const [m] = await tx
      .select({ role: membership.role })
      .from(membership)
      .where(memberKey(id, userId));
    if (!m) return unavailable();
    return work(tx, w, m.role);
  });
}
export function details(userId: string, id: string) {
  return scoped(userId, id, false, async (tx, w, role) => {
    const [members] = await tx
      .select({ count: count() })
      .from(membership)
      .where(eq(membership.workspaceId, id));
    const invitations =
      role === 'MEMBER'
        ? null
        : (await tx.select({ count: count() }).from(invitation).where(pending(id)))[0].count;
    return { ...w, role, members: members.count, invitations };
  });
}
export function team(userId: string, id: string) {
  return scoped(userId, id, false, async (tx, w, role) => {
    const members = await tx
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: membership.role,
        joined: membership.createdAt,
      })
      .from(membership)
      .innerJoin(user, eq(user.id, membership.userId))
      .where(eq(membership.workspaceId, id))
      .orderBy(asc(membership.createdAt));
    const invites =
      role === 'MEMBER'
        ? []
        : await tx
            .select({
              id: invitation.id,
              email: invitation.email,
              role: invitation.role,
              expiresAt: invitation.expiresAt,
            })
            .from(invitation)
            .where(pending(id))
            .orderBy(asc(invitation.createdAt));
    return { id: w.id, name: w.name, role, members, invites };
  });
}
