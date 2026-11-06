import { getService } from '@/server/auth/service';
import { readFields, reply, withinLimit } from '@/server/auth/http';
import { WorkspaceError } from '@/server/workspace/access';
import { settings, saveDestination } from '@/server/marketing/destination';
export const dynamic = 'force-dynamic';
function error(e: unknown) {
  if (e instanceof WorkspaceError) return reply(e.status, { message: e.message });
  console.error(JSON.stringify({ event: 'marketing.settings_failed' }));
  return reply(503, { message: 'Website settings temporarily unavailable.' });
}
export async function GET(request: Request) {
  try {
    const session = await getService().auth.api.getSession({ headers: request.headers });
    if (!session) return reply(401, { message: 'Sign in to continue.' });
    return reply(200, await settings(session.user.id));
  } catch (e) {
    return error(e);
  }
}
export async function POST(request: Request) {
  try {
    const { auth, origin } = getService();
    if (request.headers.get('origin') !== origin) return reply(403, { message: 'Invalid origin.' });
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return reply(401, { message: 'Sign in to continue.' });
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
      return reply(415, { message: 'Send JSON.' });
    if (!(await withinLimit('marketing-settings', session.user.id, 30)))
      return reply(429, { message: 'Too many attempts.' });
    let fields;
    try {
      fields = await readFields(request);
    } catch {
      return reply(400, { message: 'Invalid settings.' });
    }
    await saveDestination(session.user.id, fields);
    return reply(200, { ok: true });
  } catch (e) {
    return error(e);
  }
}
