import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from '../auth/schema';
const time = (key: string) => timestamp(key, { withTimezone: true });
const dates = () => ({
  createdAt: time('created_at').notNull().defaultNow(),
  updatedAt: time('updated_at').notNull().defaultNow(),
});
export const role = pgEnum('workspace_role', ['OWNER', 'ADMIN', 'MEMBER']);
export const invitedRole = pgEnum('workspace_invited_role', ['ADMIN', 'MEMBER']);
export const workspace = pgTable('workspace', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  industry: text('industry').notNull().default(''),
  website: text('website').notNull().default(''),
  location: text('location').notNull().default(''),
  ...dates(),
});
const tenant = () =>
  uuid('workspace_id')
    .notNull()
    .references(() => workspace.id, { onDelete: 'cascade' });
export const membership = pgTable(
  'workspace_membership',
  {
    workspaceId: tenant(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    role: role('role').notNull(),
    ...dates(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    index().on(t.userId),
    uniqueIndex('one_workspace_owner')
      .on(t.workspaceId)
      .where(sql`${t.role}='OWNER'`),
  ],
);
export const invitation = pgTable(
  'workspace_invitation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: tenant(),
    email: text('email').notNull(),
    role: invitedRole('role').notNull(),
    invitedBy: text('invited_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    tokenHash: text('token_hash').unique().notNull(),
    expiresAt: time('expires_at').notNull(),
    closedAt: time('closed_at'),
    codeHash: text('code_hash'),
    codeSession: text('code_session'),
    codeExpires: time('code_expires'),
    createdAt: time('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('one_open_invitation')
      .on(t.workspaceId, t.email)
      .where(sql`${t.closedAt} is null`),
    index().on(t.workspaceId, t.expiresAt),
  ],
);
export const audit = pgTable(
  'workspace_audit',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: tenant(),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    event: text('event').notNull(),
    target: text('target'),
    createdAt: time('created_at').notNull().defaultNow(),
  },
  (t) => [index().on(t.workspaceId, t.createdAt)],
);
