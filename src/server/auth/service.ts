import { after } from 'next/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import { writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import * as schema from './schema';

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error('Missing auth configuration: ' + name);
  return value;
}

function createService() {
  const origin = new URL(required('BETTER_AUTH_URL')).origin;
  const production = process.env.NODE_ENV === 'production';
  if (production && !origin.startsWith('https://')) throw new Error('HTTPS required');
  const secret = required('BETTER_AUTH_SECRET');
  if (secret.length < 32) throw new Error('Invalid auth secret');
  const localInbox =
    process.env.NODE_ENV === 'development' && process.env.GROWORA_LOCAL_INBOX === '1';
  const host = localInbox ? undefined : required('SMTP_HOST');
  const port = localInbox ? undefined : Number(required('SMTP_PORT'));
  const from = localInbox ? undefined : required('MAIL_FROM');
  const mail = localInbox
    ? undefined
    : nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port !== 465 && host !== '127.0.0.1',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: required('SMTP_PASSWORD') }
          : undefined,
        connectionTimeout: 10000,
        socketTimeout: 15000,
      });
  async function sendMail(
    email: string,
    subject: string,
    text: string,
    kind: 'reset' | 'invite' | 'code',
  ) {
    if (mail) {
      const info = await mail.sendMail({ from, to: email, subject, text });
      if (!info.accepted.length) throw new Error('Mail not accepted');
    } else {
      const filename = Date.now() + '-' + kind + '-' + randomUUID() + '.txt';
      await writeFile(
        path.join(process.cwd(), '.growora-local', 'inbox', filename),
        'To: ' + email + '\n' + text + '\n',
        { flag: 'wx', mode: 0o600 },
      );
    }
  }
  async function deliver(email: string, token: string) {
    const link = new URL('/reset-password', origin);
    link.hash = new URLSearchParams({ token }).toString();
    const subject = 'Reset your Growora password';
    after(async () => {
      try {
        await sendMail(email, subject, subject + '\n\n' + link.href, 'reset');
      } catch {
        console.error(JSON.stringify({ event: 'auth.email_delivery_failed' }));
      }
    });
  }
  const db = drizzle(
    new Pool({ connectionString: required('DATABASE_URL'), max: 8, connectionTimeoutMillis: 5000 }),
    { schema },
  );
  const auth = betterAuth({
    appName: 'Growora',
    baseURL: origin,
    secret,
    database: drizzleAdapter(db, { provider: 'pg', schema, transaction: true }),
    // The HTTP boundary applies atomic database limits before hashing or dispatching mail.
    rateLimit: { enabled: false },
    advanced: { useSecureCookies: production, ipAddress: { disableIpTracking: true } },
    logger: {
      level: 'error',
      log: () => console.error(JSON.stringify({ event: 'auth.library_error' })),
    },
    session: { expiresIn: 7 * 86400, updateAge: 86400, cookieCache: { enabled: false } },
    verification: { storeIdentifier: 'hashed' },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 15,
      maxPasswordLength: 128,
      autoSignIn: true,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 900,
      sendResetPassword: ({ user, token }) => deliver(user.email, token),
    },
  });
  return { origin, auth, db, secret, sendMail };
}
let service: ReturnType<typeof createService> | undefined;
export const getService = () => (service ??= createService());
