import { GET as readForm, POST as submit } from '@/server/leads/public-http';
import { destination } from '@/server/marketing/destination';
import { reply } from '@/server/auth/http';

export const dynamic = 'force-dynamic';

const unavailable = () =>
  reply(503, { message: 'Website enquiries are temporarily unavailable. Please try again later.' });

export async function GET(request: Request) {
  try {
    const selected = await destination();
    if (!selected) return unavailable();
    const response = await readForm(request, {
      params: Promise.resolve({ publicFormId: selected.publicId }),
    });
    if (!response.ok) return response;
    return reply(200, { ...(await response.json()), destinationVersion: selected.version });
  } catch {
    return unavailable();
  }
}

export async function POST(request: Request) {
  try {
    const selected = await destination();
    if (!selected) return unavailable();
    const publicFormId = selected.publicId;
    // Bind consent and retries to the destination whose notice the visitor saw.
    if (
      request.headers.get('x-marketing-form') !== publicFormId ||
      request.headers.get('x-marketing-version') !== String(selected.version)
    )
      return reply(409, {
        message:
          'The enquiry destination changed. Reload and review the privacy notice before submitting.',
      });
    return await submit(request, {
      params: Promise.resolve({ publicFormId }),
      marketingVersion: selected.version,
    });
  } catch {
    return unavailable();
  }
}
