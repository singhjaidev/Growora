import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
  unique,
  primaryKey,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { workspace, membership } from '../workspace/schema';
import { user } from '../auth/schema';
import { leadStatuses } from '../../lib/lead-policy';
const time = (key: string) => timestamp(key, { withTimezone: true });
const dates = () => ({
  createdAt: time('created_at').notNull().defaultNow(),
  updatedAt: time('updated_at').notNull().defaultNow(),
});
const tenant = () =>
  uuid('workspace_id')
    .notNull()
    .references(() => workspace.id, { onDelete: 'restrict' });
export const leadStatus = pgEnum('lead_status', leadStatuses);
export const leadForm = pgTable(
  'lead_form',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: tenant(),
    publicId: text('public_id').notNull().unique(),
    name: text('name').notNull(),
    privacyNotice: text('privacy_notice').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    retentionDays: integer('retention_days'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    version: integer('version').notNull().default(1),
    ...dates(),
  },
  (t) => [
    unique('form_workspace_id_unique').on(t.workspaceId, t.id),
    index().on(t.workspaceId, t.createdAt),
    check(
      'form_retention_valid',
      sql`${t.retentionDays} is null or ${t.retentionDays} between 1 and 3650`,
    ),
  ],
);
export const lead = pgTable(
  'lead',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: tenant(),
    sourceFormId: uuid('source_form_id').notNull(),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerPhone: text('customer_phone').notNull().default(''),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    consentNotice: text('consent_notice').notNull(),
    status: leadStatus('status').notNull().default('NEW'),
    assignedToUserId: text('assigned_to_user_id'),
    assignmentOrigin: text('assignment_origin').notNull().default('UNASSIGNED'),
    routingRevision: integer('routing_revision').notNull().default(0),
    routingState: text('routing_state').notNull().default('MANUAL'),
    reviewAt: time('review_at'),
    version: integer('version').notNull().default(1),
    ...dates(),
  },
  (t) => [
    unique('lead_workspace_id_unique').on(t.workspaceId, t.id),
    foreignKey({
      columns: [t.workspaceId, t.sourceFormId],
      foreignColumns: [leadForm.workspaceId, leadForm.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.workspaceId, t.assignedToUserId],
      foreignColumns: [membership.workspaceId, membership.userId],
    }).onDelete('restrict'),
    index().on(t.workspaceId, t.createdAt, t.id),
    index().on(t.workspaceId, t.status, t.createdAt),
    index().on(t.workspaceId, t.assignedToUserId, t.createdAt),
    index().on(t.sourceFormId),
    index().on(t.workspaceId, t.reviewAt),
    index().on(t.workspaceId, t.routingState, t.createdAt),
  ],
);
export const leadActivity = pgTable(
  'lead_activity',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: tenant(),
    leadId: uuid('lead_id').notNull(),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    before: text('before'),
    after: text('after'),
    createdAt: time('created_at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.workspaceId, t.leadId],
      foreignColumns: [lead.workspaceId, lead.id],
    }).onDelete('cascade'),
    index().on(t.workspaceId, t.leadId, t.createdAt, t.id),
  ],
);
export const leadReceipt = pgTable(
  'lead_receipt',
  {
    formId: uuid('form_id')
      .notNull()
      .references(() => leadForm.id, { onDelete: 'restrict' }),
    key: uuid('key').notNull(),
    payloadHash: text('payload_hash').notNull(),
    createdAt: time('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.formId, t.key] })],
);
