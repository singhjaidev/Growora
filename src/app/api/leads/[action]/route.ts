import { getService } from '@/server/auth/service';
import { reply, readFields, withinLimit, RequestSizeError } from '@/server/auth/http';
import { WorkspaceError } from '@/server/workspace/access';
import { id } from '@/server/leads/validation';
import { list, detail, overview, forms, saveForm, mutate } from '@/server/leads/service';
type Context = { params: Promise<{ action: string }> };
function failure(e: unknown) {
  if (e instanceof WorkspaceError) return reply(e.status, { message: e.message });
  if (e instanceof RequestSizeError) return reply(413, { message: 'Request too large.' });
  if (e instanceof SyntaxError) return reply(400, { message: 'Invalid request.' });
  console.error(JSON.stringify({ event: 'lead.request_failed' }));
  return reply(503, { message: 'Lead service temporarily unavailable.' });
}
export async function GET(request: Request, { params }: Context) {
  try {
    const session = await getService().auth.api.getSession({ headers: request.headers });
    if (!session) return reply(401, { message: 'Sign in to continue.' });
    const { action } = await params;
    const query = new URL(request.url).searchParams,
      workspaceId = id(query.get('workspaceId')),
      userId = session.user.id;
    if (action === 'list') return reply(200, await list(userId, workspaceId, query));
    if (action === 'detail')
      return reply(
        200,
        await detail(
          userId,
          workspaceId,
          id(query.get('id')),
          Number(query.get('activityPage') ?? 1),
        ),
      );
    if (action === 'stats') return reply(200, await overview(userId, workspaceId));
    if (action === 'forms') return reply(200, { forms: await forms(userId, workspaceId) });
    return reply(404, {});
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const { auth, origin } = getService();
    const { action } = await params;
    if (!['form-create', 'form-update', 'status', 'assign', 'delete'].includes(action))
      return reply(404, {});
    if (request.headers.get('origin') !== origin)
      return reply(403, { message: 'Request origin rejected.' });
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return reply(401, { message: 'Sign in to continue.' });
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
      return reply(415, {});
    let input: Record<string, unknown>;
    try {
      input = await readFields(request, 8192);
    } catch (e) {
      return reply(e instanceof RequestSizeError ? 413 : 400, { message: 'Invalid request.' });
    }
    const { workspaceId: raw, ...fields } = input,
      workspaceId = id(raw);
    if (!(await withinLimit('lead-' + action, session.user.id, action === 'form-create' ? 20 : 60)))
      return reply(429, { message: 'Too many changes. Try again in 10 minutes.' });
    if (action === 'form-create' || action === 'form-update')
      return reply(
        action === 'form-create' ? 201 : 200,
        await saveForm(session.user.id, workspaceId, fields, action === 'form-create'),
      );
    await mutate(action, session.user.id, workspaceId, fields);
    return reply(200, { ok: true });
  } catch (e) {
    return failure(e);
  }
}
