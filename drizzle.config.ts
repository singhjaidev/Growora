import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'postgresql',
  schema: [
    './src/server/auth/schema.ts',
    './src/server/workspace/schema.ts',
    './src/server/leads/schema.ts',
    './src/server/intelligence/schema.ts',
    './src/server/routing/schema.ts',
  ],
  out: './migrations',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
