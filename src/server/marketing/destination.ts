import 'server-only';
import { and, eq, sql } from 'drizzle-orm';
import { getService } from '@/server/auth/service';
import { membership, workspace } from '@/server/workspace/schema';
import { leadForm } from '@/server/leads/schema';
import { deny, lockedWorkspace, memberKey, record, type Tx } from '@/server/workspace/access';
import { id, only } from '@/server/leads/validation';
import { marketingDestination } from './schema';

export function siteOwner(userId: string) {
  return (process.env.MARKETING_WEBSITE_OWNER_IDS ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .includes(userId);
}
export function requireSiteOwner(userId: string) {
  if (!siteOwner(userId))
    deny(
      403,
      'This account is not authorized to configure the main website. Ask the site operator to authorize your account ID.',
    );
}
export async function destination() {
  const [row] = await getService()
    .db.select({
      publicId: leadForm.publicId,
      version: marketingDestination.version,
      connectedBy: marketingDestination.connectedBy,
    })
    .from(marketingDestination)
    .innerJoin(
      leadForm,
      and(
        eq(leadForm.id, marketingDestination.formId),
        eq(leadForm.workspaceId, marketingDestination.workspaceId),
        eq(leadForm.enabled, true),
      ),
    )
    .innerJoin(
      membership,
      and(
        eq(membership.workspaceId, marketingDestination.workspaceId),
        eq(membership.userId, marketingDestination.connectedBy),
        eq(membership.role, 'OWNER'),
      ),
    )
    .where(eq(marketingDestination.id, 1));
  return row && row.connectedBy && siteOwner(row.connectedBy) ? row : null;
}
// Called inside the existing ingestion transaction after locking the owning workspace.
export async function checkBinding(tx: Tx, publicId: string, version: number) {
  const [row] = await tx
    .select()
    .from(marketingDestination)
    .where(eq(marketingDestination.id, 1))
    .for('share');
  if (
    !row ||
    row.version !== version ||
    !row.formId ||
    !row.workspaceId ||
    !row.connectedBy ||
    !siteOwner(row.connectedBy)
  )
    deny(409, 'The website destination changed. Reload and review the privacy notice.');
  const [form] = await tx
    .select()
    .from(leadForm)
    .where(and(eq(leadForm.id, row.formId), eq(leadForm.publicId, publicId)));
  const [owner] = await tx
    .select()
    .from(membership)
    .where(memberKey(row.workspaceId, row.connectedBy));
  if (!form || owner?.role !== 'OWNER') deny(409, 'The website destination is unavailable.');
}
export async function settings(userId: string) {
  requireSiteOwner(userId);
  const db = getService().db;
  const workspaces = await db
    .select({ id: workspace.id, name: workspace.name })
    .from(workspace)
    .innerJoin(
      membership,
      and(
        eq(membership.workspaceId, workspace.id),
        eq(membership.userId, userId),
        eq(membership.role, 'OWNER'),
      ),
    );
  const forms = await db
    .select({
      id: leadForm.id,
      workspaceId: leadForm.workspaceId,
      name: leadForm.name,
      publicId: leadForm.publicId,
    })
    .from(leadForm)
    .innerJoin(
      membership,
      and(
        eq(membership.workspaceId, leadForm.workspaceId),
        eq(membership.userId, userId),
        eq(membership.role, 'OWNER'),
      ),
    )
    .where(eq(leadForm.enabled, true));
  const [current] = await db
    .select()
    .from(marketingDestination)
    .where(eq(marketingDestination.id, 1));
  const canManage = !current?.workspaceId || workspaces.some((w) => w.id === current.workspaceId);
  return {
    workspaces,
    forms,
    version: current?.version ?? 0,
    connected: !!current?.formId,
    workspaceId: canManage ? (current?.workspaceId ?? '') : '',
    formId: canManage ? (current?.formId ?? '') : '',
    canManage,
  };
}
export async function saveDestination(userId: string, fields: Record<string, unknown>) {
  requireSiteOwner(userId);
  only(fields, ['version', 'workspaceId', 'formId']);
  if (!Number.isSafeInteger(fields.version) || Number(fields.version) < 0)
    deny(400, 'Invalid settings version.');
  const disconnect = fields.formId === null && fields.workspaceId === null;
  const newWorkspace = disconnect ? null : id(fields.workspaceId);
  const newForm = disconnect ? null : id(fields.formId);
  const db = getService().db;
  const [before] = await db
    .select()
    .from(marketingDestination)
    .where(eq(marketingDestination.id, 1));
  await db.transaction(async (tx) => {
    // Same workspace-first lock order as lead ingestion and membership mutations.
    for (const wid of [
      ...new Set([before?.workspaceId, newWorkspace].filter((v): v is string => !!v)),
    ].sort()) {
      await lockedWorkspace(tx, wid, true);
      const [m] = await tx.select().from(membership).where(memberKey(wid, userId));
      if (m?.role !== 'OWNER')
        deny(
          403,
          'Only an owner of both the current and selected workspace may change this destination.',
        );
    }
    // Serialize first connection without a first-user-wins permission rule.
    await tx.execute(sql`select pg_advisory_xact_lock(82508001)`);
    const [current] = await tx
      .select()
      .from(marketingDestination)
      .where(eq(marketingDestination.id, 1))
      .for('update');
    if (
      (current?.version ?? 0) !== fields.version ||
      (current?.workspaceId ?? null) !== (before?.workspaceId ?? null)
    )
      deny(409, 'Settings changed. Reload before saving.');
    if (newForm) {
      const [form] = await tx
        .select()
        .from(leadForm)
        .where(
          and(
            eq(leadForm.id, newForm),
            eq(leadForm.workspaceId, newWorkspace!),
            eq(leadForm.enabled, true),
          ),
        )
        .for('share');
      if (!form) deny(404, 'Choose an enabled published form in your workspace.');
    }
    const value = {
      workspaceId: newWorkspace,
      formId: newForm,
      connectedBy: disconnect ? null : userId,
      version: Number(fields.version) + 1,
    };
    if (current)
      await tx.update(marketingDestination).set(value).where(eq(marketingDestination.id, 1));
    else await tx.insert(marketingDestination).values({ id: 1, ...value });
    const wid = newWorkspace ?? before?.workspaceId;
    if (wid)
      await record(
        tx,
        wid,
        userId,
        disconnect ? 'MARKETING_DISCONNECTED' : 'MARKETING_CONNECTED',
        newForm ?? undefined,
      );
  });
}
