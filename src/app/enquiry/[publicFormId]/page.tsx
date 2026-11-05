import { notFound } from 'next/navigation';
import { publicForm } from '@/server/leads/ingestion';
import { PublicEnquiry } from '@/components/leads/forms';
import { Logo } from '@/components/ui';
import l from '@/components/leads/leads.module.css';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Send an enquiry',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default async function Page({ params }: { params: Promise<{ publicFormId: string }> }) {
  const form = await publicForm((await params).publicFormId);
  if (!form) notFound();
  return (
    <main id="main" className={l.public}>
      <div>
        <Logo />
        <h1>{form.name}</h1>
        <p>Share your request with the business.</p>
        <PublicEnquiry form={form} />
      </div>
    </main>
  );
}
