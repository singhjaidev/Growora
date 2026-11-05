import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, eq, isNull, count, asc, desc, ilike, or, sql, lte } from 'drizzle-orm';
import {
  scoped,
  deny,
  forbidden,
  unavailable,
  memberKey,
  record,
  type Tx,
} from '@/server/workspace/access';
import { user } from '@/server/auth/schema';
import { alias } from 'drizzle-orm/pg-core';
import { membership } from '@/server/workspace/schema';
import { leadPermissions, leadStatuses, transitions, type LeadStatus } from '@/lib/lead-policy';
import type { Role } from '@/lib/workspace-policy';
import { lead, leadForm, leadActivity, leadReceipt } from './schema';
import { id, revision, text, status, formFields, only, type Fields } from './validation';
import { intelligence } from '@/server/intelligence/schema';
import { priorities } from '@/server/intelligence/contract';

const scope = (workspaceId: string, userId: string, role: Role) =>
  and(
    eq(lead.workspaceId, workspaceId),
    leadPermissions[role].all ? undefined : eq(lead.assignedToUserId, userId),
  );
const summaryFields = {
  id: lead.id,
  customerName: lead.customerName,
  subject: lead.subject,
  status: lead.status,
  assignedToUserId: lead.assignedToUserId,
  assignedName: user.name,
  assignmentOrigin: lead.assignmentOrigin,
  routingState: lead.routingState,
  createdAt: lead.createdAt,
  version: lead.version,
};
export async function choices(tx: Tx, workspaceId: string) {
  return tx
    .select({ id: user.id, name: user.name })
    .from(membership)
    .innerJoin(user, eq(user.id, membership.userId))
    .where(eq(membership.workspaceId, workspaceId))
    .orderBy(asc(user.name), asc(user.id));
}
export async function forms(userId: string, workspaceId: string) {
  return scoped(userId, workspaceId, false, async (tx, _w, role) => {
    if (!leadPermissions[role].forms) return forbidden();
    const rows = await tx
      .select({
        id: leadForm.id,
        publicId: leadForm.publicId,
        name: leadForm.name,
        enabled: leadForm.enabled,
        privacyNotice: leadForm.privacyNotice,
        retentionDays: leadForm.retentionDays,
        version: leadForm.version,
        createdAt: leadForm.createdAt,
        submissions: count(leadReceipt.key),
      })
      .from(leadForm)
      .leftJoin(leadReceipt, eq(leadReceipt.formId, leadForm.id))
      .where(eq(leadForm.workspaceId, workspaceId))
      .groupBy(leadForm.id)
      .orderBy(desc(leadForm.createdAt), desc(leadForm.id));
    return rows;
  });
}
export async function saveForm(userId: string, workspaceId: string, f: Fields, creating: boolean) {
  only(
    f,
    creating
      ? ['name', 'privacyNotice', 'enabled', 'retentionDays']
      : ['id', 'version', 'name', 'privacyNotice', 'enabled', 'retentionDays'],
  );
  const data = formFields(f);
  return scoped(userId, workspaceId, true, async (tx, _w, role) => {
    if (!leadPermissions[role].forms) return forbidden();
    if (creating) {
      const [created] = await tx
        .insert(leadForm)
        .values({
          ...data,
          workspaceId,
          createdBy: userId,
          publicId: randomBytes(24).toString('hex'),
        })
        .returning({ id: leadForm.id });
      await record(tx, workspaceId, userId, 'lead_form.created', created.id);
      return created;
    }
    const formId = id(f.id),
      version = revision(f.version);
    const [existing] = await tx
      .select({ version: leadForm.version })
      .from(leadForm)
      .where(and(eq(leadForm.id, formId), eq(leadForm.workspaceId, workspaceId)));
    if (!existing) return unavailable();
    if (existing.version !== version) deny(409, 'This form changed. Refresh before saving.');
    await tx
      .update(leadForm)
      .set({ ...data, version: version + 1, updatedAt: new Date() })
      .where(and(eq(leadForm.id, formId), eq(leadForm.workspaceId, workspaceId)));
    await record(tx, workspaceId, userId, 'lead_form.updated', formId);
    return { id: formId };
  });
}
export function list(userId: string, workspaceId: string, params: URLSearchParams) {
  const search = text(params.get('q') ?? '', 120, true);
  const selected = params.get('status') || '';
  if (selected) status(selected);
  const sort = params.get('sort') ?? 'newest';
  if (!['newest', 'oldest', 'priority'].includes(sort)) deny(400, 'Invalid date sort.');
  const priority = params.get('priority') || '';
  const routing = params.get('routing') || '';
  if (routing && !['REVIEW', 'FAILED', 'PENDING', 'ASSIGNED', 'MANUAL'].includes(routing))
    deny(400, 'Invalid routing filter.');
  if (priority && !priorities.includes(priority as (typeof priorities)[number]))
    deny(400, 'Invalid priority.');
  const page = Number(params.get('page') ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) deny(400, 'Invalid page.');
  const assigned = text(params.get('assigned') ?? '', 128, true),
    review = params.get('review') ?? '';
  if (review && !['due'].includes(review)) deny(400, 'Invalid retention filter.');
  return scoped(userId, workspaceId, false, async (tx, _w, role) => {
    if (!leadPermissions[role].all && assigned && assigned !== userId) return forbidden();
    const pattern = '%' + search.replace(/[\\%_]/g, '\\$&') + '%';
    const filter = and(
      scope(workspaceId, userId, role),
      selected ? eq(lead.status, selected as LeadStatus) : undefined,
      search
        ? or(
            ilike(lead.customerName, pattern),
            ilike(lead.customerEmail, pattern),
            ilike(lead.subject, pattern),
          )
        : undefined,
      assigned === 'unassigned'
        ? isNull(lead.assignedToUserId)
        : assigned
          ? eq(lead.assignedToUserId, assigned)
          : undefined,
      review ? lte(lead.reviewAt, new Date()) : undefined,
      priority ? eq(intelligence.priority, priority as (typeof priorities)[number]) : undefined,
      routing ? eq(lead.routingState, routing) : undefined,
    );
    const [total] = await tx
      .select({ count: count() })
      .from(lead)
      .leftJoin(
        intelligence,
        and(eq(intelligence.leadId, lead.id), eq(intelligence.workspaceId, lead.workspaceId)),
      )
      .where(filter);
    const order = sort === 'newest' ? desc : asc;
    const rows = await tx
      .select({
        ...summaryFields,
        aiStatus: intelligence.status,
        priority: intelligence.priority,
        priorityScore: intelligence.score,
      })
      .from(lead)
      .leftJoin(
        intelligence,
        and(eq(intelligence.leadId, lead.id), eq(intelligence.workspaceId, lead.workspaceId)),
      )
      .leftJoin(user, eq(user.id, lead.assignedToUserId))
      .where(filter)
      .orderBy(
        ...(sort === 'priority' ? [sql`${intelligence.score} desc nulls last`] : []),
        order(lead.createdAt),
        order(lead.id),
      )
      .limit(20)
      .offset((page - 1) * 20);
    return {
      rows,
      total: total.count,
      page,
      pages: Math.max(1, Math.ceil(total.count / 20)),
      canManage: leadPermissions[role].all,
      assignees: leadPermissions[role].assign ? await choices(tx, workspaceId) : [],
    };
  });
}
export function overview(userId: string, workspaceId: string) {
  return scoped(userId, workspaceId, false, async (tx, _w, role) => {
    const filter = scope(workspaceId, userId, role);
    const grouped = await tx
      .select({ status: lead.status, count: count() })
      .from(lead)
      .where(filter)
      .groupBy(lead.status);
    const counts = Object.fromEntries(
      leadStatuses.map((s) => [s, grouped.find((g) => g.status === s)?.count ?? 0]),
    ) as Record<LeadStatus, number>;
    const recent = await tx
      .select(summaryFields)
      .from(lead)
      .leftJoin(user, eq(user.id, lead.assignedToUserId))
      .where(filter)
      .orderBy(desc(lead.createdAt), desc(lead.id))
      .limit(5);
    return {
      counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      recent,
      canManage: leadPermissions[role].all,
    };
  });
}
export function detail(userId: string, workspaceId: string, leadId: string, activityPage = 1) {
  id(leadId);
  if (!Number.isSafeInteger(activityPage) || activityPage < 1 || activityPage > 100000)
    deny(400, 'Invalid activity page.');
  return scoped(userId, workspaceId, false, async (tx, _w, role) => {
    const [row] = await tx
      .select({
        ...summaryFields,
        customerEmail: lead.customerEmail,
        customerPhone: lead.customerPhone,
        message: lead.message,
        updatedAt: lead.updatedAt,
        reviewAt: lead.reviewAt,
        consentNotice: lead.consentNotice,
        source: leadForm.name,
      })
      .from(lead)
      .innerJoin(
        leadForm,
        and(eq(leadForm.id, lead.sourceFormId), eq(leadForm.workspaceId, workspaceId)),
      )
      .leftJoin(user, eq(user.id, lead.assignedToUserId))
      .where(and(scope(workspaceId, userId, role), eq(lead.id, leadId)));
    if (!row) return unavailable();
    const activityFilter = and(
      eq(leadActivity.workspaceId, workspaceId),
      eq(leadActivity.leadId, leadId),
    );
    const [total] = await tx.select({ count: count() }).from(leadActivity).where(activityFilter);
    const beforeUser = alias(user, 'before_user'),
      afterUser = alias(user, 'after_user');
    const activity = await tx
      .select({
        id: leadActivity.id,
        action: leadActivity.action,
        before: leadActivity.before,
        after: leadActivity.after,
        actor: user.name,
        beforeName: beforeUser.name,
        afterName: afterUser.name,
        createdAt: leadActivity.createdAt,
      })
      .from(leadActivity)
      .leftJoin(user, eq(user.id, leadActivity.actorId))
      .leftJoin(beforeUser, eq(beforeUser.id, leadActivity.before))
      .leftJoin(afterUser, eq(afterUser.id, leadActivity.after))
      .where(activityFilter)
      .orderBy(desc(leadActivity.createdAt), desc(leadActivity.id))
      .limit(20)
      .offset((activityPage - 1) * 20);
    return {
      lead: row,
      activity,
      activityPages: Math.max(1, Math.ceil(total.count / 20)),
      activityPage,
      canManage: leadPermissions[role].all,
      assignees: leadPermissions[role].assign ? await choices(tx, workspaceId) : [],
    };
  });
}
export async function mutate(action: string, userId: string, workspaceId: string, f: Fields) {
  only(
    f,
    action === 'status'
      ? ['id', 'version', 'status']
      : action === 'assign'
        ? ['id', 'version', 'assignee']
        : ['id', 'version'],
  );
  const leadId = id(f.id),
    version = revision(f.version);
  return scoped(userId, workspaceId, true, async (tx, _w, role) => {
    const [existing] = await tx
      .select()
      .from(lead)
      .where(and(scope(workspaceId, userId, role), eq(lead.id, leadId)));
    if (!existing) return unavailable();
    if (existing.version !== version) deny(409, 'This enquiry changed. Refresh it before saving.');
    let actionName: string, before: string | null, after: string | null;
    if (action === 'status') {
      const next = status(f.status);
      if (next === existing.status) return;
      if (!transitions[existing.status].includes(next))
        deny(400, 'This status transition is not allowed.');
      await tx
        .update(lead)
        .set({ status: next, version: version + 1, updatedAt: new Date() })
        .where(and(eq(lead.workspaceId, workspaceId), eq(lead.id, leadId)));
      actionName = 'STATUS_CHANGED';
      before = existing.status;
      after = next;
    } else if (action === 'assign') {
      if (!leadPermissions[role].assign) return forbidden();
      const assignee = f.assignee === null ? null : text(f.assignee, 128);
      if (assignee) {
        const [member] = await tx
          .select({ id: membership.userId })
          .from(membership)
          .where(memberKey(workspaceId, assignee));
        if (!member) deny(400, 'Choose a current member of this workspace.');
      }
      await tx
        .update(lead)
        .set({
          assignedToUserId: assignee,
          version: version + 1,
          updatedAt: new Date(),
          assignmentOrigin: 'MANUAL',
          routingState: 'MANUAL',
          routingRevision: sql`${lead.routingRevision}+1`,
        })
        .where(and(eq(lead.workspaceId, workspaceId), eq(lead.id, leadId)));
      actionName = 'ASSIGNMENT_CHANGED';
      before = existing.assignedToUserId;
      after = assignee;
    } else if (action === 'delete') {
      if (!leadPermissions[role].erase) return forbidden();
      await tx.delete(lead).where(and(eq(lead.workspaceId, workspaceId), eq(lead.id, leadId)));
      await record(tx, workspaceId, userId, 'lead.deleted', leadId);
      return;
    } else return unavailable();
    await tx
      .insert(leadActivity)
      .values({ workspaceId, leadId, actorId: userId, action: actionName, before, after });
  });
}
// Membership removals already hold the workspace write lock. Clear assignments in that transaction.
export async function releaseAssignments(
  tx: Tx,
  workspaceId: string,
  departing: string,
  actorId: string,
) {
  const cleared = await tx
    .update(lead)
    .set({
      assignedToUserId: null,
      version: sql`${lead.version}+1`,
      updatedAt: new Date(),
      assignmentOrigin: 'UNASSIGNED',
      routingState: 'REVIEW',
      routingRevision: sql`${lead.routingRevision}+1`,
    })
    .where(and(eq(lead.workspaceId, workspaceId), eq(lead.assignedToUserId, departing)))
    .returning({ id: lead.id });
  if (cleared.length)
    await tx.insert(leadActivity).values(
      cleared.map((row) => ({
        workspaceId,
        leadId: row.id,
        actorId,
        action: 'MEMBER_REMOVED',
        before: departing,
      })),
    );
}
