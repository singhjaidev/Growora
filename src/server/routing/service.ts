import 'server-only';
import { and, eq, asc, desc, count, sql } from 'drizzle-orm';
import { scoped, deny, forbidden, unavailable, record, type Tx } from '@/server/workspace/access';
import { membership } from '@/server/workspace/schema';
import { user } from '@/server/auth/schema';
import { lead, leadForm } from '@/server/leads/schema';
import { only, id, revision, text, type Fields } from '@/server/leads/validation';
import { routingPolicy, profiles, decisions, routingJobs } from './schema';
import { defaultPolicy, policyInput, RoutingInputError, skill, evaluate } from './engine';
import { context, type Query } from './context';
function adapter(tx: Tx): Query {
  // Internal static SQL only; each numbered value is rebound as a Drizzle parameter.
  return {
    query: async (source: string, values: unknown[] = []) =>
      tx.execute(
        sql.join(
          source
            .split(/(\$\d+)/)
            .map((part) =>
              /^\$\d+$/.test(part) ? sql`${values[Number(part.slice(1)) - 1]}` : sql.raw(part),
            ),
          sql.raw(''),
        ),
      ),
  } as unknown as Query;
}
function page(value: number) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 100000) deny(400, 'Invalid page.');
  return value;
}
function manager(role: string) {
  if (role === 'MEMBER') forbidden();
}
async function accessible(
  tx: Tx,
  userId: string,
  workspaceId: string,
  leadId: string,
  role: string,
) {
  const [row] = await tx
    .select()
    .from(lead)
    .where(
      and(
        eq(lead.workspaceId, workspaceId),
        eq(lead.id, leadId),
        role === 'MEMBER' ? eq(lead.assignedToUserId, userId) : undefined,
      ),
    );
  if (!row) unavailable();
  return row;
}
export function settings(userId: string, workspaceId: string, memberPage = 1) {
  page(memberPage);
  return scoped(userId, workspaceId, false, async (tx, _w, role) => {
    manager(role);
    const [p] = await tx
      .select()
      .from(routingPolicy)
      .where(eq(routingPolicy.workspaceId, workspaceId));
    const members = await tx
      .select({
        id: user.id,
        name: user.name,
        role: membership.role,
        eligible: profiles.eligible,
        available: profiles.available,
        capacity: profiles.capacity,
        skills: profiles.skills,
        version: profiles.version,
      })
      .from(membership)
      .innerJoin(user, eq(user.id, membership.userId))
      .leftJoin(
        profiles,
        and(eq(profiles.workspaceId, workspaceId), eq(profiles.userId, membership.userId)),
      )
      .where(eq(membership.workspaceId, workspaceId))
      .orderBy(asc(user.name), asc(user.id))
      .limit(25)
      .offset((memberPage - 1) * 25);
    const [total] = await tx
      .select({ n: count() })
      .from(membership)
      .where(eq(membership.workspaceId, workspaceId));
    const forms = await tx
      .select({ id: leadForm.id, name: leadForm.name })
      .from(leadForm)
      .where(eq(leadForm.workspaceId, workspaceId))
      .orderBy(desc(leadForm.createdAt))
      .limit(100);
    const metrics = await tx.execute(
      sql`SELECT outcome,count(*)::int count,round(avg(latency_ms))::int latency FROM routing_decision WHERE workspace_id=${workspaceId} GROUP BY outcome`,
    );
    const jobs = await tx.execute(
      sql`SELECT status,count(*)::int count,coalesce(sum(attempts),0)::int attempts,coalesce(sum(greatest(attempts-1,0)),0)::int retries FROM routing_job WHERE workspace_id=${workspaceId} GROUP BY status`,
    );
    const strategies = await tx.execute(
      sql`SELECT strategy,count(*)::int count FROM routing_decision WHERE workspace_id=${workspaceId} GROUP BY strategy`,
    );
    return {
      policy: p
        ? { ...p.rules, enabled: p.enabled, strategy: p.strategy, version: p.version }
        : defaultPolicy,
      members: members.map((m) => ({
        ...m,
        canEdit: role === 'OWNER' || m.id === userId || m.role === 'MEMBER',
      })),
      forms,
      memberPage,
      memberPages: Math.max(1, Math.ceil(total.n / 25)),
      metrics: metrics.rows as { outcome: string; count: number; latency: number }[],
      jobs: jobs.rows as { status: string; count: number; attempts: number; retries: number }[],
      strategies: strategies.rows as { strategy: string; count: number }[],
    };
  });
}
export function configure(action: string, userId: string, workspaceId: string, f: Fields) {
  return scoped(userId, workspaceId, true, async (tx, _w, role) => {
    manager(role);
    if (action === 'policy') {
      only(f, [
        'version',
        'enabled',
        'strategy',
        'fallback',
        'skillWeight',
        'loadWeight',
        'useReviewedAI',
        'formSkills',
      ]);
      let data;
      try {
        data = policyInput(f);
      } catch (e) {
        if (e instanceof RoutingInputError) deny(400, e.message);
        throw e;
      }
      const version = f.version === 0 ? 0 : revision(f.version);
      const [existing] = await tx
        .select()
        .from(routingPolicy)
        .where(eq(routingPolicy.workspaceId, workspaceId));
      if ((existing?.version ?? 0) !== version)
        deny(409, 'Routing policy changed. Refresh before saving.');
      for (const r of data.formSkills) {
        const [form] = await tx
          .select({ id: leadForm.id })
          .from(leadForm)
          .where(and(eq(leadForm.id, r.formId), eq(leadForm.workspaceId, workspaceId)));
        if (!form) deny(400, 'Choose a form in this workspace.');
      }
      const { enabled, strategy, ...rules } = data;
      await tx
        .insert(routingPolicy)
        .values({ workspaceId, enabled, strategy, rules, version: version + 1 })
        .onConflictDoUpdate({
          target: routingPolicy.workspaceId,
          set: { enabled, strategy, rules, version: version + 1, updatedAt: new Date() },
        });
      await record(tx, workspaceId, userId, 'routing.policy_updated');
    } else if (action === 'profile') {
      only(f, ['memberId', 'version', 'eligible', 'available', 'capacity', 'skills']);
      const memberId = text(f.memberId, 128),
        version = f.version === 0 ? 0 : revision(f.version);
      const [m] = await tx
        .select({ role: membership.role })
        .from(membership)
        .where(and(eq(membership.workspaceId, workspaceId), eq(membership.userId, memberId)));
      if (!m) unavailable();
      if (role === 'ADMIN' && memberId !== userId && m.role !== 'MEMBER') forbidden();
      if (
        typeof f.eligible !== 'boolean' ||
        typeof f.available !== 'boolean' ||
        !Number.isInteger(f.capacity) ||
        Number(f.capacity) < 1 ||
        Number(f.capacity) > 1000 ||
        !Array.isArray(f.skills) ||
        f.skills.length > 20
      )
        deny(400, 'Check eligibility, capacity and specialties.');
      let skills: string[];
      try {
        skills = [...new Set(f.skills.map(skill))];
      } catch {
        deny(400, 'Use short specialty names.');
      }
      const [old] = await tx
        .select()
        .from(profiles)
        .where(and(eq(profiles.workspaceId, workspaceId), eq(profiles.userId, memberId)));
      if ((old?.version ?? 0) !== version)
        deny(409, 'Member routing profile changed. Refresh before saving.');
      const data = {
        eligible: f.eligible,
        available: f.available,
        capacity: Number(f.capacity),
        skills,
        version: version + 1,
        updatedAt: new Date(),
      };
      await tx
        .insert(profiles)
        .values({ workspaceId, userId: memberId, ...data })
        .onConflictDoUpdate({ target: [profiles.workspaceId, profiles.userId], set: data });
      await record(tx, workspaceId, userId, 'routing.profile_updated', memberId);
    } else unavailable();
  });
}
export function preview(userId: string, workspaceId: string, leadId: string) {
  id(leadId);
  return scoped(userId, workspaceId, false, async (tx, _w, role) => {
    manager(role);
    await accessible(tx, userId, workspaceId, leadId, role);
    const ctx = await context(adapter(tx), workspaceId, leadId);
    if (!ctx) return unavailable();
    const decision = evaluate(ctx.policy, ctx.members, ctx.features);
    const [chosen] = decision.selectedId
      ? await tx
          .select({ name: user.name })
          .from(user)
          .innerJoin(
            membership,
            and(eq(membership.userId, user.id), eq(membership.workspaceId, workspaceId)),
          )
          .where(eq(user.id, decision.selectedId))
      : [];
    return { simulation: true, decision, selectedName: chosen?.name ?? null };
  });
}
export function reroute(userId: string, workspaceId: string, f: Fields) {
  only(f, ['id', 'version']);
  const leadId = id(f.id),
    version = revision(f.version);
  return scoped(userId, workspaceId, true, async (tx, _w, role) => {
    manager(role);
    const row = await accessible(tx, userId, workspaceId, leadId, role);
    if (row.version !== version) deny(409, 'Lead changed. Refresh before rerouting.');
    if (row.assignedToUserId)
      deny(409, 'Unassign this lead first if you want to request new routing.');
    if (row.status === 'CLOSED') deny(409, 'Closed leads cannot be routed.');
    if (row.routingState === 'PENDING') deny(409, 'Routing is already pending.');
    const [p] = await tx
      .select()
      .from(routingPolicy)
      .where(eq(routingPolicy.workspaceId, workspaceId));
    if (!p?.enabled || p.strategy === 'MANUAL')
      deny(409, 'Enable an automatic routing strategy first.');
    const next = row.routingRevision + 1;
    await tx
      .update(lead)
      .set({
        routingRevision: next,
        routingState: 'PENDING',
        version: version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(lead.workspaceId, workspaceId), eq(lead.id, leadId)));
    await tx.insert(routingJobs).values({ workspaceId, leadId, revision: next });
    await record(tx, workspaceId, userId, 'routing.requested', leadId);
    return { ok: true };
  });
}
export function history(userId: string, workspaceId: string, leadId?: string, historyPage = 1) {
  page(historyPage);
  if (leadId) id(leadId);
  return scoped(userId, workspaceId, false, async (tx, _w, role) => {
    if (leadId) await accessible(tx, userId, workspaceId, leadId, role);
    else manager(role);
    const filter = and(
      eq(decisions.workspaceId, workspaceId),
      leadId ? eq(decisions.leadId, leadId) : undefined,
    );
    const [total] = await tx.select({ n: count() }).from(decisions).where(filter);
    const rows = await tx
      .select({
        id: decisions.id,
        leadId: decisions.leadId,
        selectedName: user.name,
        strategy: decisions.strategy,
        policyVersion: decisions.policyVersion,
        outcome: decisions.outcome,
        reason: decisions.reason,
        explanation: decisions.explanation,
        createdAt: decisions.createdAt,
        attempts: routingJobs.attempts,
      })
      .from(decisions)
      .innerJoin(
        routingJobs,
        and(eq(routingJobs.id, decisions.jobId), eq(routingJobs.workspaceId, workspaceId)),
      )
      .leftJoin(user, eq(user.id, decisions.selectedUserId))
      .where(filter)
      .orderBy(desc(decisions.createdAt), desc(decisions.id))
      .limit(20)
      .offset((historyPage - 1) * 20);
    const jobRows = leadId
      ? await tx
          .select({
            status: routingJobs.status,
            attempts: routingJobs.attempts,
            errorCode: routingJobs.errorCode,
            createdAt: routingJobs.createdAt,
          })
          .from(routingJobs)
          .where(and(eq(routingJobs.workspaceId, workspaceId), eq(routingJobs.leadId, leadId)))
          .orderBy(desc(routingJobs.createdAt))
          .limit(5)
      : [];
    return { rows, jobs: jobRows, historyPage, pages: Math.max(1, Math.ceil(total.n / 20)) };
  });
}
