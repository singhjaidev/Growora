import { pgTable, integer, uuid, text, foreignKey, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { leadForm } from '../leads/schema';
import { user } from '../auth/schema';
export const marketingDestination = pgTable(
  'marketing_destination',
  {
    id: integer('id').primaryKey().default(1),
    version: integer('version').notNull().default(1),
    workspaceId: uuid('workspace_id'),
    formId: uuid('form_id'),
    connectedBy: text('connected_by').references(() => user.id, { onDelete: 'restrict' }),
  },
  (t) => [
    check('marketing_singleton', sql`${t.id} = 1`),
    check('marketing_version', sql`${t.version} > 0`),
    check(
      'marketing_destination_complete',
      sql`(${t.workspaceId} is null and ${t.formId} is null and ${t.connectedBy} is null) or (${t.workspaceId} is not null and ${t.formId} is not null and ${t.connectedBy} is not null)`,
    ),
    foreignKey({
      columns: [t.workspaceId, t.formId],
      foreignColumns: [leadForm.workspaceId, leadForm.id],
    }).onDelete('restrict'),
  ],
);
