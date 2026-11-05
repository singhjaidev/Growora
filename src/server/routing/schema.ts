import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  unique,
  foreignKey,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { workspace, membership } from '../workspace/schema';
import { lead } from '../leads/schema';
import type { Policy, Decision } from './engine';
const time = (n: string) => timestamp(n, { withTimezone: true });
export const routingPolicy = pgTable('routing_policy', {
  workspaceId: uuid('workspace_id')
    .primaryKey()
    .references(() => workspace.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(false),
  strategy: text('strategy').notNull().default('MANUAL'),
  version: integer('version').notNull().default(1),
  rules: jsonb('rules').$type<Omit<Policy, 'version' | 'strategy' | 'enabled'>>().notNull(),
  createdAt: time('created_at').notNull().defaultNow(),
  updatedAt: time('updated_at').notNull().defaultNow(),
});
export const profiles = pgTable(
  'member_routing_profile',
  {
    workspaceId: uuid('workspace_id').notNull(),
    userId: text('user_id').notNull(),
    eligible: boolean('eligible').notNull().default(false),
    available: boolean('available').notNull().default(false),
    capacity: integer('capacity').notNull().default(10),
    skills: jsonb('skills').$type<string[]>().notNull().default([]),
    version: integer('version').notNull().default(1),
    lastAssignedAt: time('last_assigned_at'),
    updatedAt: time('updated_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    foreignKey({
      columns: [t.workspaceId, t.userId],
      foreignColumns: [membership.workspaceId, membership.userId],
    }).onDelete('cascade'),
    check('routing_capacity_range', sql`${t.capacity} between 1 and 1000`),
  ],
);
export const routingJobs = pgTable(
  'routing_job',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull(),
    leadId: uuid('lead_id').notNull(),
    revision: integer('revision').notNull(),
    status: text('status').notNull().default('PENDING'),
    attempts: integer('attempts').notNull().default(0),
    leaseToken: uuid('lease_token'),
    leaseUntil: time('lease_until'),
    availableAt: time('available_at').notNull().defaultNow(),
    errorCode: text('error_code'),
    createdAt: time('created_at').notNull().defaultNow(),
    finishedAt: time('finished_at'),
  },
  (t) => [
    unique('routing_job_revision').on(t.leadId, t.revision),
    foreignKey({
      columns: [t.workspaceId, t.leadId],
      foreignColumns: [lead.workspaceId, lead.id],
    }).onDelete('cascade'),
    index().on(t.status, t.availableAt),
    index().on(t.leaseUntil),
    unique('routing_job_tenant_id').on(t.workspaceId, t.id),
  ],
);
export const decisions = pgTable(
  'routing_decision',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull(),
    leadId: uuid('lead_id').notNull(),
    jobId: uuid('job_id').notNull().unique(),
    selectedUserId: text('selected_user_id'),
    strategy: text('strategy').notNull(),
    policyVersion: integer('policy_version').notNull(),
    outcome: text('outcome').notNull(),
    reason: text('reason').notNull(),
    explanation: jsonb('explanation').$type<Decision>().notNull(),
    latencyMs: integer('latency_ms').notNull(),
    createdAt: time('created_at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.workspaceId, t.leadId],
      foreignColumns: [lead.workspaceId, lead.id],
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.workspaceId, t.jobId],
      foreignColumns: [routingJobs.workspaceId, routingJobs.id],
    }).onDelete('cascade'),
    index().on(t.workspaceId, t.createdAt),
    index().on(t.workspaceId, t.leadId, t.createdAt),
  ],
);
