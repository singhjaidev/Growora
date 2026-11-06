import type { Pool, PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';
import { context } from './context.ts';
import { evaluate, RoutingInputError, type Decision } from './engine.ts';
async function tx<T>(pool: Pool, fn: (c: PoolClient) => Promise<T>) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await fn(c);
    await c.query('COMMIT');
    return r;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}
type Job = {
  id: string;
  workspace_id: string;
  lead_id: string;
  revision: number;
  attempts: number;
  lease_token: string;
};
export async function runRoutingOnce(pool: Pool): Promise<boolean> {
  const job = await tx(pool, async (c) => {
    const row = (
      await c.query<Job>(
        `SELECT * FROM routing_job WHERE (status='PENDING' AND available_at<=now()) OR (status='PROCESSING' AND lease_until<=now()) ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1`,
      )
    ).rows[0];
    if (!row) return null;
    const token = randomUUID();
    await c.query(
      "UPDATE routing_job SET status='PROCESSING',attempts=attempts+1,lease_token=$2,lease_until=now()+interval '60 seconds' WHERE id=$1",
      [row.id, token],
    );
    return { ...row, attempts: row.attempts + 1, lease_token: token };
  });
  if (!job) return false;
  const start = Date.now();
  try {
    await tx(pool, async (c) => {
      // Same lock/order as manual assignment, status edits, membership changes and policy writes.
      await c.query('SELECT id FROM workspace WHERE id=$1 FOR UPDATE', [job.workspace_id]);
      const current = (
        await c.query(
          "SELECT id FROM routing_job WHERE id=$1 AND workspace_id=$2 AND lease_token=$3 AND status='PROCESSING' FOR UPDATE",
          [job.id, job.workspace_id, job.lease_token],
        )
      ).rows[0];
      if (!current) return;
      const ctx = await context(c, job.workspace_id, job.lead_id);
      if (!ctx) return;
      let decision: Decision = evaluate(ctx.policy, ctx.members, ctx.features);
      if (ctx.lead.routing_revision !== job.revision)
        decision = {
          ...decision,
          outcome: 'SKIPPED',
          reason: 'SUPERSEDED_MANUAL_OR_REROUTE',
          selectedId: null,
          factors: null,
        };
      else if (job.attempts > 3)
        decision = {
          ...decision,
          outcome: 'REVIEW',
          reason: 'RETRY_EXHAUSTED',
          selectedId: null,
          factors: null,
        };
      if (decision.selectedId) {
        await c.query(
          "UPDATE lead SET assigned_to_user_id=$3,assignment_origin='AUTOMATIC',routing_state='ASSIGNED',version=version+1,updated_at=now() WHERE workspace_id=$1 AND id=$2 AND routing_revision=$4",
          [job.workspace_id, job.lead_id, decision.selectedId, job.revision],
        );
        await c.query(
          'UPDATE member_routing_profile SET last_assigned_at=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2',
          [job.workspace_id, decision.selectedId],
        );
        await c.query(
          "INSERT INTO lead_activity(workspace_id,lead_id,action,after) VALUES($1,$2,'AUTO_ASSIGNED',$3)",
          [job.workspace_id, job.lead_id, decision.selectedId],
        );
      } else if (ctx.lead.routing_revision === job.revision) {
        await c.query('UPDATE lead SET routing_state=$3 WHERE workspace_id=$1 AND id=$2', [
          job.workspace_id,
          job.lead_id,
          decision.outcome === 'REVIEW'
            ? 'REVIEW'
            : decision.reason === 'LEAD_CLOSED'
              ? 'CLOSED'
              : decision.reason === 'EXISTING_ASSIGNMENT'
                ? ctx.lead.assigned_to_user_id
                  ? 'ASSIGNED'
                  : 'MANUAL'
                : 'MANUAL',
        ]);
      }
      await c.query(
        'INSERT INTO routing_decision(workspace_id,lead_id,job_id,selected_user_id,strategy,policy_version,outcome,reason,explanation,latency_ms) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [
          job.workspace_id,
          job.lead_id,
          job.id,
          decision.selectedId,
          decision.strategy,
          decision.policyVersion,
          decision.outcome,
          decision.reason,
          JSON.stringify(decision),
          Date.now() - start,
        ],
      );
      await c.query(
        "INSERT INTO workspace_audit(workspace_id,event,target) VALUES($1,'routing.decided',$2)",
        [job.workspace_id, job.lead_id],
      );
      await c.query(
        "UPDATE routing_job SET status='COMPLETED',finished_at=now(),lease_token=null,lease_until=null,error_code=$2 WHERE id=$1",
        [job.id, decision.reason],
      );
    });
    console.info(
      JSON.stringify({
        event: 'routing.processed',
        attempt: job.attempts,
        latencyMs: Date.now() - start,
      }),
    );
  } catch (e) {
    const code =
      e instanceof RoutingInputError
        ? 'INVALID_POLICY'
        : e instanceof Error && e.message === 'ROUTING_TEAM_LIMIT'
          ? 'TEAM_LIMIT'
          : 'PROCESSING_ERROR';
    const failureRecorded = await tx(pool, async (c) => {
      await c.query('SELECT id FROM workspace WHERE id=$1 FOR UPDATE', [job.workspace_id]);
      const fail = job.attempts >= 3 || code !== 'PROCESSING_ERROR';
      const changed = await c.query(
        "UPDATE routing_job SET status=$4,error_code=$5,lease_token=null,lease_until=null,available_at=now()+($6 * interval '1 second'),finished_at=CASE WHEN $4='FAILED' THEN now() ELSE null END WHERE id=$1 AND workspace_id=$2 AND lease_token=$3 AND status='PROCESSING' RETURNING id",
        [
          job.id,
          job.workspace_id,
          job.lease_token,
          fail ? 'FAILED' : 'PENDING',
          code,
          10 * 2 ** (Math.min(job.attempts, 3) - 1),
        ],
      );
      if (changed.rowCount && fail)
        await c.query(
          "UPDATE lead SET routing_state='FAILED' WHERE workspace_id=$1 AND id=$2 AND routing_revision=$3",
          [job.workspace_id, job.lead_id, job.revision],
        );
      return Boolean(changed.rowCount);
    });
    if (failureRecorded)
      console.error(JSON.stringify({ event: 'routing.failed', code, attempt: job.attempts }));
    else
      console.warn(
        JSON.stringify({ event: 'routing.outcome_unconfirmed', code, attempt: job.attempts }),
      );
  }
  return true;
}
