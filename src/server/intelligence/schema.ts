import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  unique,
  foreignKey,
  check,
  date,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { lead } from '../leads/schema';
import { user } from '../auth/schema';
import type { Extraction, Score, State, Priority } from './contract';
const time = (name: string) => timestamp(name, { withTimezone: true });
export const intelligence = pgTable(
  'lead_intelligence',
  {
    leadId: uuid('lead_id').primaryKey(),
    workspaceId: uuid('workspace_id').notNull(),
    generation: integer('generation').notNull().default(1),
    status: text('status').$type<State>().notNull().default('PENDING'),
    score: integer('score'),
    priority: text('priority').$type<Priority>(),
    updatedAt: time('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique('intelligence_tenant_lead').on(t.workspaceId, t.leadId),
    foreignKey({
      columns: [t.workspaceId, t.leadId],
      foreignColumns: [lead.workspaceId, lead.id],
    }).onDelete('cascade'),
    index().on(t.workspaceId, t.priority, t.score),
    check('intelligence_score_range', sql`${t.score} between 0 and 100`),
    check(
      'intelligence_status',
      sql`${t.status} in ('PENDING','PROCESSING','COMPLETED','FAILED','UNAVAILABLE')`,
    ),
  ],
);
export const jobs = pgTable(
  'lead_ai_job',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull(),
    leadId: uuid('lead_id').notNull(),
    generation: integer('generation').notNull(),
    status: text('status').$type<State>().notNull().default('PENDING'),
    attempts: integer('attempts').notNull().default(0),
    availableAt: time('available_at').notNull().defaultNow(),
    leaseToken: uuid('lease_token'),
    leaseUntil: time('lease_until'),
    errorCode: text('error_code'),
    result: jsonb('result').$type<{ extraction: Extraction; scoring: Score }>(),
    model: text('model'),
    promptVersion: text('prompt_version'),
    schemaVersion: text('schema_version'),
    scoringVersion: text('scoring_version'),
    policy: text('policy'),
    inputHash: text('input_hash'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    latencyMs: integer('latency_ms'),
    costUsd: text('cost_usd'),
    processedAt: time('processed_at'),
    review: text('review'),
    reviewNote: text('review_note'),
    reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
    reviewedAt: time('reviewed_at'),
    createdAt: time('created_at').notNull().defaultNow(),
  },
  (t) => [
    unique('job_lead_generation').on(t.leadId, t.generation),
    foreignKey({
      columns: [t.workspaceId, t.leadId],
      foreignColumns: [intelligence.workspaceId, intelligence.leadId],
    }).onDelete('cascade'),
    index().on(t.status, t.availableAt),
    index().on(t.leaseUntil),
  ],
);
export const usage = pgTable('lead_ai_usage', {
  day: date('day').primaryKey(),
  requests: integer('requests').notNull().default(0),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
});
