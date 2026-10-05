import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { LeadsPage } from '@/components/app/leads';
import { PipelinePage } from '@/components/app/pipeline';
import { AutomationsPage } from '@/components/app/automations';
import { FormsPage } from '@/components/app/forms';
import { AnalyticsPage } from '@/components/app/analytics';
import { SettingsPage } from '@/components/app/settings';
import { IntegrationDirectory } from '@/components/product/integrations';
import { AppHeading } from '@/components/app/shell';
const sections = [
  'leads',
  'pipeline',
  'automations',
  'forms',
  'analytics',
  'integrations',
  'settings',
];
export const dynamicParams = false;
export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return {
    title: sections.includes(section) ? section[0].toUpperCase() + section.slice(1) : 'Workspace',
  };
}
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  return (
    <Suspense
      fallback={
        <div className="loading">
          <p>Preparing your workspace…</p>
          <div className="skeleton" />
        </div>
      }
    >
      {section === 'leads' ? (
        <LeadsPage />
      ) : section === 'pipeline' ? (
        <PipelinePage />
      ) : section === 'automations' ? (
        <AutomationsPage />
      ) : section === 'forms' ? (
        <FormsPage />
      ) : section === 'analytics' ? (
        <AnalyticsPage />
      ) : section === 'settings' ? (
        <SettingsPage />
      ) : (
        <>
          <AppHeading
            eyebrow="A CONNECTED ECOSYSTEM"
            title="Your tools. In the loop."
            description="Explore how your existing stack could connect to the lead journey."
          />
          <IntegrationDirectory app />
        </>
      )}
    </Suspense>
  );
}
