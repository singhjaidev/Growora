import { MarketingShell } from '@/components/marketing/shell';
import { HowItWorks } from '@/components/marketing/how-it-works';
export const metadata = {
  title: 'See how Growora works',
  description:
    'Follow one enquiry from first contact to a clear next step in a guided Growora walkthrough.',
  alternates: { canonical: '/how-it-works' },
};
export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <HowItWorks />
    </MarketingShell>
  );
}
