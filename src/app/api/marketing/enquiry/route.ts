import { GET as readForm, POST as submit } from '@/server/leads/public-http';
import { publicIdValid } from '@/server/leads/ingestion';
import { reply } from '@/server/auth/http';

export const dynamic = 'force-dynamic';

// Only operator configuration selects the destination, never a session or customer field.
function destination() {
  const id = process.env.MARKETING_ENQUIRY_FORM_ID ?? '';
  return publicIdValid(id) ? id : null;
}
const unavailable = () => reply(503, { message: 'Website enquiries are temporarily unavailable. Please try again later.' });

export async function GET(request: Request) {
  const publicFormId = destination();
  if (!publicFormId) return unavailable();
  return readForm(request, { params: Promise.resolve({ publicFormId }) });
}

export async function POST(request: Request) {
  const publicFormId = destination();
  if (!publicFormId) return unavailable();
  // Bind consent and retries to the destination whose notice the visitor saw.
  if (request.headers.get('x-marketing-form') !== publicFormId)
    return reply(409, { message: 'The enquiry destination changed. Reload and review the privacy notice before submitting.' });
  return submit(request, { params: Promise.resolve({ publicFormId }) });
}
