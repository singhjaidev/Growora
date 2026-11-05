import { getService } from '@/server/auth/service';
import { reply, readFields, withinLimit, RequestSizeError } from '@/server/auth/http';
import { WorkspaceError } from '@/server/workspace/access';
import { id } from '@/server/leads/validation';
import { settings, configure, preview, reroute, history } from '@/server/routing/service';
import { RoutingInputError } from '@/server/routing/engine';
type Context = { params: Promise<{ action: string }> };
function failure(e: unknown) {
  if (e instanceof WorkspaceError) return reply(e.status, { message: e.message });
  if (e instanceof RoutingInputError) return reply(400, { message: e.message });
  console.error(JSON.stringify({ event: 'routing.request_failed' }));
  return reply(503, { message: 'Routing temporarily unavailable.' });
}
export async function GET(request: Request, { params }: Context) {
  try {
    const session = await getService().auth.api.getSession({ headers: request.headers });
    if (!session) return reply(401, {});
    const { action } = await params,
      q = new URL(request.url).searchParams,
      w = id(q.get('workspaceId'));
    if (action === 'settings')
      return reply(200, await settings(session.user.id, w, Number(q.get('page') ?? 1)));
    if (action === 'preview') return reply(200, await preview(session.user.id, w, id(q.get('id'))));
    if (action === 'history')
      return reply(
        200,
        await history(session.user.id, w, q.get('id') ?? undefined, Number(q.get('page') ?? 1)),
      );
    return reply(404, {});
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const { auth, origin } = getService();
    if (request.headers.get('origin') !== origin) return reply(403, {});
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return reply(401, {});
    const { action } = await params;
    if (!['policy', 'profile', 'reroute'].includes(action)) return reply(404, {});
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
      return reply(415, {});
    let body;
    try {
      body = await readFields(request, 16384);
    } catch (e) {
      return reply(e instanceof RequestSizeError ? 413 : 400, {
        message: 'Invalid routing request.',
      });
    }
    if (!(await withinLimit('routing-' + action, session.user.id, 60)))
      return reply(429, { message: 'Too many changes. Try again in 10 minutes.' });
    const { workspaceId, ...fields } = body,
      w = id(workspaceId);
    if (action === 'reroute') return reply(200, await reroute(session.user.id, w, fields));
    await configure(action, session.user.id, w, fields);
    return reply(200, { ok: true });
  } catch (e) {
    return failure(e);
  }
}
