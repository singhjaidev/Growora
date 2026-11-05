import 'server-only';
import { and, eq, desc } from 'drizzle-orm';
import { scoped, unavailable, forbidden, deny, record, type Tx } from '@/server/workspace/access';
import { lead } from '@/server/leads/schema';
import { id, revision, text, only, type Fields } from '@/server/leads/validation';
import { intelligence, jobs } from './schema';
import { available } from './config';
async function allowed(tx: Tx, userId: string, workspaceId: string, leadId: string, role: string) {
  const [row] = await tx
    .select({ id: lead.id })
    .from(lead)
    .where(
      and(
        eq(lead.id, leadId),
        eq(lead.workspaceId, workspaceId),
        role === 'MEMBER' ? eq(lead.assignedToUserId, userId) : undefined,
      ),
    );
  if (!row) unavailable();
}
export function insights(userId: string, workspaceId: string, leadId: string) {
  id(leadId);
  return scoped(userId, workspaceId, false, async (tx, _w, role) => {
    await allowed(tx, userId, workspaceId, leadId, role);
    const [current] = await tx
      .select()
      .from(intelligence)
      .where(and(eq(intelligence.leadId, leadId), eq(intelligence.workspaceId, workspaceId)));
    const history = await tx
      .select({
        id: jobs.id,
        generation: jobs.generation,
        status: jobs.status,
        result: jobs.result,
        model: jobs.model,
        promptVersion: jobs.promptVersion,
        schemaVersion: jobs.schemaVersion,
        scoringVersion: jobs.scoringVersion,
        attempts: jobs.attempts,
        errorCode: jobs.errorCode,
        processedAt: jobs.processedAt,
        review: jobs.review,
        reviewNote: jobs.reviewNote,
        reviewedAt: jobs.reviewedAt,
      })
      .from(jobs)
      .where(and(eq(jobs.workspaceId, workspaceId), eq(jobs.leadId, leadId)))
      .orderBy(desc(jobs.generation))
      .limit(5);
    return {
      current: current ?? null,
      history,
      configured: available(workspaceId),
      canAnalyze: role !== 'MEMBER',
      canReview: role !== 'MEMBER',
    };
  });
}
export function command(action: string, userId: string, workspaceId: string, f: Fields) {
  only(f, action === 'analyze' ? ['id', 'generation'] : ['id', 'generation', 'verdict', 'note']);
  const leadId = id(f.id),
    generation = f.generation === 0 ? 0 : revision(f.generation);
  return scoped(userId, workspaceId, true, async (tx, _w, role) => {
    await allowed(tx, userId, workspaceId, leadId, role);
    if (role === 'MEMBER') forbidden();
    const [current] = await tx
      .select()
      .from(intelligence)
      .where(and(eq(intelligence.workspaceId, workspaceId), eq(intelligence.leadId, leadId)))
      .for('update');
    if ((current?.generation ?? 0) !== generation)
      deny(409, 'Analysis changed. Refresh before continuing.');
    if (action === 'analyze') {
      if (current && ['PENDING', 'PROCESSING'].includes(current.status))
        deny(409, 'Analysis is already queued or processing.');
      if (!available(workspaceId))
        deny(
          409,
          'AI processing is unavailable until credentials and workspace processing policy are configured.',
        );
      const next = generation + 1;
      if (current?.status === 'UNAVAILABLE')
        await tx
          .update(jobs)
          .set({ status: 'FAILED', errorCode: 'SUPERSEDED' })
          .where(
            and(
              eq(jobs.workspaceId, workspaceId),
              eq(jobs.leadId, leadId),
              eq(jobs.generation, generation),
            ),
          );
      if (current)
        await tx
          .update(intelligence)
          .set({
            generation: next,
            status: 'PENDING',
            score: null,
            priority: null,
            updatedAt: new Date(),
          })
          .where(and(eq(intelligence.workspaceId, workspaceId), eq(intelligence.leadId, leadId)));
      else await tx.insert(intelligence).values({ workspaceId, leadId, generation: next });
      await tx.insert(jobs).values({ workspaceId, leadId, generation: next });
      await record(tx, workspaceId, userId, 'ai.analysis_requested', leadId);
    } else if (action === 'review') {
      if (current?.status !== 'COMPLETED') deny(409, 'Only completed analysis can be reviewed.');
      if (!['ACCEPTED', 'FLAGGED'].includes(String(f.verdict)))
        deny(400, 'Choose a review verdict.');
      const note = text(f.note, 1000, true, true);
      const [job] = await tx
        .select({ reviewedAt: jobs.reviewedAt })
        .from(jobs)
        .where(
          and(
            eq(jobs.workspaceId, workspaceId),
            eq(jobs.leadId, leadId),
            eq(jobs.generation, generation),
          ),
        )
        .for('update');
      if (job.reviewedAt)
        deny(
          409,
          'This version has already been reviewed. Request a new analysis to review again.',
        );
      await tx
        .update(jobs)
        .set({
          review: String(f.verdict),
          reviewNote: note,
          reviewedAt: new Date(),
          reviewedBy: userId,
        })
        .where(
          and(
            eq(jobs.workspaceId, workspaceId),
            eq(jobs.leadId, leadId),
            eq(jobs.generation, generation),
          ),
        );
      await record(tx, workspaceId, userId, 'ai.analysis_reviewed', leadId);
    } else unavailable();
  });
}
