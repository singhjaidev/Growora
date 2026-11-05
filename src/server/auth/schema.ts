import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const date = (name: string) => timestamp(name, { withTimezone: true });
const timestamps = () => ({
  createdAt: date('created_at').notNull().defaultNow(),
  updatedAt: date('updated_at').notNull().defaultNow(),
});

export const user = pgTable('auth_user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  ...timestamps(),
});
const owner = () =>
  text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' });

export const session = pgTable(
  'auth_session',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    userId: owner(),
    expiresAt: date('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    ...timestamps(),
  },
  (t) => [index().on(t.userId), index().on(t.expiresAt)],
);

export const account = pgTable(
  'auth_account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: owner(),
    password: text('password'),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: date('access_token_expires_at'),
    refreshTokenExpiresAt: date('refresh_token_expires_at'),
    scope: text('scope'),
    ...timestamps(),
  },
  (t) => [index().on(t.userId), uniqueIndex().on(t.providerId, t.accountId)],
);

export const verification = pgTable(
  'auth_verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull().unique(),
    value: text('value').notNull(),
    expiresAt: date('expires_at').notNull(),
    ...timestamps(),
  },
  (t) => [index().on(t.expiresAt)],
);

export const throttle = pgTable(
  'auth_throttle',
  {
    key: text('key').primaryKey(),
    hits: integer('hits').notNull(),
    expiresAt: date('expires_at').notNull(),
  },
  (t) => [index().on(t.expiresAt)],
);
