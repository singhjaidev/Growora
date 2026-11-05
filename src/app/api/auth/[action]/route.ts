import { isIP } from 'node:net';
import { getService } from '@/server/auth/service';
import { reply, failure, withinLimit, readFields, copyCookies } from '@/server/auth/http';
const endpoints = {
  signup: '/sign-up/email',
  login: '/sign-in/email',
  logout: '/sign-out',
  forgot: '/request-password-reset',
  reset: '/reset-password',
} as const;
type Context = { params: Promise<{ action: string }> };
export async function GET(request: Request, ctx: Context) {
  if ((await ctx.params).action !== 'me') return reply(404, {});
  try {
    const { auth } = getService();
    const { response, headers } = await auth.api.getSession({
      headers: request.headers,
      returnHeaders: true,
    });
    if (!response) return reply(401, { message: 'Sign in to continue.' });
    const { id, name, email, emailVerified } = response.user;
    return copyCookies(headers, reply(200, { user: { id, name, email, emailVerified } }));
  } catch {
    return failure();
  }
}

export async function POST(request: Request, ctx: Context) {
  const { action } = await ctx.params;
  if (!Object.hasOwn(endpoints, action)) return reply(404, {});
  try {
    const { auth, origin } = getService();
    if (request.headers.get('origin') !== origin)
      return reply(403, { message: 'Request origin rejected.' });
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
      return reply(415, {});
    let input;
    try {
      input = await readFields(request);
    } catch {
      return reply(400, { message: 'Invalid form data.' });
    }
    const invalid = () => reply(400, { message: 'Check the details and try again.' });
    const limited = () => reply(429, { message: 'Too many attempts. Try again in 10 minutes.' });
    const ipHeader = process.env.AUTH_CLIENT_IP_HEADER;
    const ip = ipHeader && request.headers.get(ipHeader);
    if (action !== 'logout' && !(await withinLimit('source', ip && isIP(ip) ? ip : 'shared', 100)))
      return limited();
    const body: Record<string, string> = {};
    if (['signup', 'login', 'forgot'].includes(action)) {
      if (typeof input.email !== 'string') return invalid();
      body.email = input.email.trim().toLowerCase();
      if (body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
        return invalid();
      if (!(await withinLimit(action, body.email, action === 'login' ? 8 : 4))) return limited();
    }
    if (['signup', 'login', 'reset'].includes(action)) {
      if (
        typeof input.password !== 'string' ||
        input.password.length > 128 ||
        input.password.length < (action === 'login' ? 1 : 15)
      )
        return invalid();
      body[action === 'reset' ? 'newPassword' : 'password'] = input.password;
    }
    if (action === 'signup') {
      if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 100)
        return invalid();
      body.name = input.name.trim();
    }
    if (action === 'reset') {
      if (typeof input.token !== 'string' || !input.token || input.token.length > 2048)
        return invalid();
      body.token = input.token;
    }
    const url = new URL('/api/auth' + endpoints[action as keyof typeof endpoints], origin);
    const headers = new Headers({ 'content-type': 'application/json', origin });
    if (action === 'logout') headers.set('cookie', request.headers.get('cookie') ?? '');
    const response = await auth.handler(
      new Request(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }),
    );
    if (response.status >= 500) return failure();
    if (!response.ok) {
      if (action === 'signup')
        return reply(400, {
          message: 'Unable to create an account. Try signing in or resetting your password.',
        });
      if (action === 'login')
        return reply(401, {
          message: 'Unable to sign in. Check your email and password.',
        });
      return invalid();
    }
    return copyCookies(response.headers, reply(200, { ok: true }));
  } catch {
    return failure();
  }
}
