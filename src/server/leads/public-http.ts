import { isIP } from 'node:net';
import { getService } from '@/server/auth/service';
import { readFields, reply, RequestSizeError, withinLimit } from '@/server/auth/http';
import { WorkspaceError } from '@/server/workspace/access';
import { ingest, publicForm } from '@/server/leads/ingestion';
import { intake } from '@/server/leads/validation';
type Context = { params: Promise<{ publicFormId: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    const form = await publicForm((await params).publicFormId);
    return form ? reply(200, form) : reply(404, { message: 'Enquiry form unavailable.' });
  } catch {
    console.error(JSON.stringify({ event: 'enquiry.read_failed' }));
    return reply(503, { message: 'Enquiry service temporarily unavailable.' });
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const { origin } = getService();
    if (request.headers.get('origin') !== origin)
      return reply(403, { message: 'Request origin rejected.' });
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
      return reply(415, { message: 'Send JSON form data.' });
    const header = process.env.AUTH_CLIENT_IP_HEADER;
    const supplied = header ? request.headers.get(header) : null;
    const source = supplied && isIP(supplied) ? supplied : 'shared';
    if (!(await withinLimit('enquiry-source', source, 120)))
      return reply(429, { message: 'Too many submissions. Try again in 10 minutes.' });
    let fields;
    try {
      fields = await readFields(request, 24576);
    } catch (e) {
      return reply(e instanceof RequestSizeError ? 413 : 400, {
        message: 'Invalid or oversized form data.',
      });
    }
    const { formVersion, ...body } = fields;
    const values = intake(body);
    const { publicFormId } = await params;
    if (!(await publicForm(publicFormId)))
      return reply(404, { message: 'Enquiry form unavailable.' });
    if (
      !(await withinLimit('enquiry-mailbox', publicFormId + ':' + values.customerEmail, 8)) ||
      !(await withinLimit('enquiry-form', publicFormId, 100))
    )
      return reply(429, { message: 'Too many submissions. Try again in 10 minutes.' });
    await ingest(publicFormId, request.headers.get('idempotency-key') ?? '', {
      formVersion,
      ...body,
    });
    return reply(200, { ok: true });
  } catch (e) {
    if (e instanceof RequestSizeError) return reply(413, { message: 'Enquiry is too large.' });
    if (e instanceof WorkspaceError) return reply(e.status, { message: e.message });
    if (e instanceof SyntaxError) return reply(400, { message: 'Invalid form data.' });
    console.error(JSON.stringify({ event: 'enquiry.submit_failed' }));
    return reply(503, { message: 'Unable to save this enquiry. You can safely retry.' });
  }
}
