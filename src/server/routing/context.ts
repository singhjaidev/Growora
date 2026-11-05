import type { PoolClient } from 'pg';
import {
  defaultPolicy,
  policyInput,
  skill,
  type Policy,
  type Candidate,
  type Decision,
} from './engine.ts';
import { validateExtraction } from '../intelligence/contract.ts';
import { minimize } from '../intelligence/provider.ts';
export type Query = Pick<PoolClient, 'query'>;
export async function context(db: Query, workspaceId: string, leadId: string) {
  const lead = (
    await db.query<{
      id: string;
      status: string;
      assigned_to_user_id: string | null;
      routing_revision: number;
      source_form_id: string;
      subject: string;
      message: string;
    }>(
      'SELECT id,status,assigned_to_user_id,routing_revision,source_form_id,subject,message FROM lead WHERE workspace_id=$1 AND id=$2',
      [workspaceId, leadId],
    )
  ).rows[0];
  if (!lead) return null;
  const p = (
    await db.query<{
      enabled: boolean;
      strategy: string;
      version: number;
      rules: Record<string, unknown>;
    }>('SELECT enabled,strategy,version,rules FROM routing_policy WHERE workspace_id=$1', [
      workspaceId,
    ])
  ).rows[0];
  const policy: Policy = p
    ? {
        ...policyInput({ ...p.rules, enabled: p.enabled, strategy: p.strategy }),
        version: p.version,
      }
    : defaultPolicy;
  const rows = (
    await db.query<{
      user_id: string;
      eligible: boolean;
      available: boolean;
      capacity: number;
      skills: string[];
      last_assigned_at: Date | string | null;
      active: number;
    }>(
      `SELECT m.user_id,coalesce(p.eligible,false) eligible,coalesce(p.available,false) available,coalesce(p.capacity,10) capacity,coalesce(p.skills,'[]'::jsonb) skills,p.last_assigned_at,coalesce(load.active,0)::int active
 FROM workspace_membership m LEFT JOIN member_routing_profile p ON p.workspace_id=m.workspace_id AND p.user_id=m.user_id
 LEFT JOIN (SELECT assigned_to_user_id,count(*) active FROM lead WHERE workspace_id=$1 AND status IN ('NEW','CONTACTED','QUALIFIED') AND assigned_to_user_id IS NOT NULL GROUP BY assigned_to_user_id) load ON load.assigned_to_user_id=m.user_id
 WHERE m.workspace_id=$1 ORDER BY m.user_id LIMIT 501`,
      [workspaceId],
    )
  ).rows;
  if (rows.length > 500) throw Error('ROUTING_TEAM_LIMIT');
  const members: Candidate[] = rows.map((m) => ({
    id: m.user_id,
    eligible: m.eligible,
    available: m.available,
    capacity: m.capacity,
    skills: m.skills,
    active: m.active,
    lastAssignedAt: m.last_assigned_at ? new Date(m.last_assigned_at).toISOString() : null,
  }));
  let category: string | null =
      policy.formSkills.find((r) => r.formId === lead.source_form_id)?.skill ?? null,
    source: Decision['source'] = category ? 'FORM_POLICY' : 'NONE';
  if (!category && policy.useReviewedAI) {
    const j = (
      await db.query<{ result: { extraction: unknown }; model: string }>(
        `SELECT j.result,j.model FROM lead_intelligence i JOIN lead_ai_job j ON j.workspace_id=i.workspace_id AND j.lead_id=i.lead_id AND j.generation=i.generation WHERE i.workspace_id=$1 AND i.lead_id=$2 AND i.status='COMPLETED' AND j.status='COMPLETED' AND j.review='ACCEPTED' AND j.schema_version='extraction-1'`,
        [workspaceId, leadId],
      )
    ).rows[0];
    if (j?.result)
      try {
        const d = validateExtraction(j.result.extraction, minimize(lead.subject, lead.message));
        if (
          d.interpretation.category &&
          !d.interpretation.warnings.length &&
          !['UNKNOWN', 'SPAM'].includes(d.interpretation.intent)
        ) {
          category = skill(d.interpretation.category);
          source = 'REVIEWED_AI';
        }
      } catch {
        /* Invalid or unsupported stored extraction cannot affect routing. */
      }
  }
  return {
    policy,
    members,
    lead,
    features: {
      status: lead.status,
      assignedId: lead.assigned_to_user_id,
      skill: category,
      source,
    },
  };
}
