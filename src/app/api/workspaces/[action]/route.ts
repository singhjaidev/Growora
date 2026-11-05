import { getService } from '@/server/auth/service';
import { readFields, reply, withinLimit } from '@/server/auth/http';
import {
  WorkspaceError,
  listWorkspaces,
  details,
  team,
  scoped,
  uuid,
} from '@/server/workspace/access';
import { create, invite, manage, redeem } from '@/server/workspace/commands';
type Context = { params: Promise<{ action: string }> };
const operations = [
  'create',
  'switch',
  'settings',
  'invite',
  'cancel',
  'role',
  'remove',
  'leave',
  'challenge',
  'accept',
];
function errorResponse(e: unknown) {
  if (e instanceof WorkspaceError) return reply(e.status, { message: e.message });
  console.error(JSON.stringify({ event: 'workspace.request_failed' }));
  return reply(503, { message: 'Workspace service temporarily unavailable.' });
}
export async function GET(request: Request, { params }: Context) {
  try {
    const { action } = await params;
    const identity = await getService().auth.api.getSession({ headers: request.headers });
    if (!identity) return reply(401, { message: 'Sign in to continue.' });
    const id = new URL(request.url).searchParams.get('id') ?? '';
    if (action === 'list')
      return reply(200, { workspaces: await listWorkspaces(identity.user.id) });
    if (action === 'details') return reply(200, await details(identity.user.id, id));
    if (action === 'team') return reply(200, await team(identity.user.id, id));
    return reply(404, {});
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const { action } = await params;
    if (!operations.includes(action)) return reply(404, {});
    const { auth, origin } = getService();
    if (request.headers.get('origin') !== origin) return reply(403, { message: 'Invalid origin.' });
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session)
      return reply(401, {
        message: 'Sign in with the invited account or create an account to continue.',
      });
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
      return reply(415, {});
    let fields;
    try {
      fields = await readFields(request);
    } catch {
      return reply(400, { message: 'Invalid form data.' });
    }
    const actor = { id: session.user.id, email: session.user.email, sessionId: session.session.id };
    const max =
      action === 'challenge' || action === 'accept'
        ? 8
        : action === 'invite' || action === 'create'
          ? 12
          : 60;
    if (!(await withinLimit('workspace-' + action, actor.id, max)))
      return reply(429, { message: 'Too many attempts. Try again in 10 minutes.' });
    let selected: string | undefined;
    if (action === 'create') selected = (await create(actor, fields)).id;
    else if (action === 'challenge' || action === 'accept') {
      const result = await redeem(action, actor, fields);
      if (action === 'accept') selected = result.id;
    } else {
      const { workspaceId, ...values } = fields;
      if (!uuid(workspaceId)) return reply(400, { message: 'Invalid workspace identifier.' });
      if (action === 'switch') {
        if (Object.keys(values).length) return reply(400, {});
        selected = await scoped(actor.id, workspaceId, false, async (_tx, w) => w.id);
      } else if (action === 'invite') await invite(actor, workspaceId, values);
      else await manage(action, actor, workspaceId, values);
    }
    const result = reply(
      action === 'create' ? 201 : 200,
      selected ? { id: selected } : { ok: true },
    );
    if (selected || action === 'leave')
      result.headers.append(
        'Set-Cookie',
        'growora-workspace=' +
          (selected ?? '') +
          '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' +
          (selected ? 2592000 : 0) +
          (process.env.NODE_ENV === 'production' ? '; Secure' : ''),
      );
    return result;
  } catch (e) {
    return errorResponse(e);
  }
}
