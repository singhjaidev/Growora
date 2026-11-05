import { and, eq } from 'drizzle-orm';
import { getService } from '@/server/auth/service';
import { session } from '@/server/auth/schema';
import { reply, failure, readFields, withinLimit, copyCookies } from '@/server/auth/http';

const paths = {
  profile: 'update-user',
  password: 'change-password',
  revoke: 'revoke-session',
  'revoke-others': 'revoke-other-sessions',
} as const;
export async function POST(request: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  if (!Object.hasOwn(paths, action)) return reply(404, {});
  try {
    const { auth, db, origin } = getService();
    if (request.headers.get('origin') !== origin)
      return reply(403, { message: 'Request origin rejected.' });
    const identity = await auth.api.getSession({ headers: request.headers });
    if (!identity) return reply(401, { message: 'Sign in to continue.' });
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
      return reply(415, {});
    let fields;
    try {
      fields = await readFields(request);
    } catch {
      return reply(400, { message: 'Invalid request.' });
    }
    const invalid = () => reply(400, { message: 'Check the submitted fields.' });
    const keys = Object.keys(fields);
    const body: Record<string, string | boolean> = {};
    if (action === 'profile') {
      if (keys.length !== 1 || typeof fields.name !== 'string') return invalid();
      const name = fields.name.normalize('NFC').trim().replace(/ +/g, ' ');
      if (!name || name.length > 100 || /\p{Cc}/u.test(name)) return invalid();
      body.name = name;
    } else if (action === 'password') {
      const { currentPassword, newPassword } = fields;
      if (
        keys.length !== 2 ||
        typeof currentPassword !== 'string' ||
        !currentPassword ||
        currentPassword.length > 128 ||
        typeof newPassword !== 'string' ||
        newPassword.length < 15 ||
        newPassword.length > 128 ||
        newPassword === currentPassword
      )
        return invalid();
      Object.assign(body, { currentPassword, newPassword, revokeOtherSessions: true });
    } else if (action === 'revoke') {
      if (
        keys.length !== 1 ||
        typeof fields.id !== 'string' ||
        fields.id.length > 128 ||
        fields.id === identity.session.id
      )
        return invalid();
      const [owned] = await db
        .select({ token: session.token })
        .from(session)
        .where(and(eq(session.id, fields.id), eq(session.userId, identity.user.id)));
      if (!owned) return reply(404, { message: 'Session unavailable.' });
      body.token = owned.token;
    } else if (keys.length) return invalid();
    if (!(await withinLimit('account-' + action, identity.user.id, action === 'password' ? 8 : 40)))
      return reply(429, { message: 'Too many attempts. Try again in 10 minutes.' });
    const response = await auth.handler(
      new Request(new URL('/api/auth/' + paths[action as keyof typeof paths], origin), {
        method: 'POST',
        headers: {
          origin,
          'content-type': 'application/json',
          cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify(body),
      }),
    );
    if (response.status >= 500) return failure();
    if (!response.ok)
      return reply(response.status, {
        message:
          action === 'password'
            ? 'Password change failed. Check your current password.'
            : 'Unable to complete this request.',
      });
    return copyCookies(response.headers, reply(200, { ok: true }));
  } catch {
    return failure();
  }
}
