import { getService } from '@/server/auth/service';
import { readFields, reply, RequestSizeError, withinLimit } from '@/server/auth/http';
import { WorkspaceError } from '@/server/workspace/access';
import { id } from '@/server/leads/validation';
import { insights, command } from '@/server/intelligence/service';
type Context = { params: Promise<{ action: string }> };
function failure(e: unknown) {
  if (e instanceof WorkspaceError) return reply(e.status, { message: e.message });
  console.error(JSON.stringify({ event: 'ai.request_failed' }));
  return reply(503, { message: 'Intelligence temporarily unavailable.' });
}
export async function GET(request: Request, { params }: Context) {
  try {
    const session = await getService().auth.api.getSession({ headers: request.headers });
    if (!session) return reply(401, {});
    if ((await params).action !== 'detail') return reply(404, {});
    const q = new URL(request.url).searchParams;
    return reply(200, await insights(session.user.id, id(q.get('workspaceId')), id(q.get('id'))));
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const { origin, auth } = getService();
    if (request.headers.get('origin') !== origin) return reply(403, {});
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return reply(401, {});
    const { action } = await params;
    if (!['analyze', 'review'].includes(action)) return reply(404, {});
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
      return reply(415, {});
    let f;
    try {
      f = await readFields(request, 8192);
    } catch (e) {
      return reply(e instanceof RequestSizeError ? 413 : 400, { message: 'Invalid request.' });
    }
    if (!(await withinLimit('ai-' + action, session.user.id, 20)))
      return reply(429, { message: 'Too many requests. Try again in 10 minutes.' });
    const { workspaceId, ...fields } = f;
    await command(action, session.user.id, id(workspaceId), fields);
    return reply(200, { ok: true });
  } catch (e) {
    return failure(e);
  }
}
