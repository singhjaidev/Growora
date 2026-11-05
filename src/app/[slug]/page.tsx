import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MarketingShell, FinalCTA } from '@/components/marketing/shell';
import {
  Workflow,
  SolutionsSelector,
  Pricing,
  PipelineSection,
  AnalyticsSection,
  IntegrationUniverse,
} from '@/components/marketing/sections';
import { LeadCapture } from '@/components/product/lead-capture';
import { AutomationSection } from '@/components/product/automation';
import { IntegrationDirectory } from '@/components/product/integrations';
import { ButtonLink } from '@/components/ui';
const pages: Record<
  string,
  { title: string; eyebrow: string; headline: string; accent: string; description: string }
> = {
  product: {
    title: 'The platform',
    eyebrow: 'THE GROWORA PLATFORM',
    headline: 'A connected process.',
    accent: 'From first hello.',
    description:
      'Capture the context. Find the intent. Keep every conversation moving toward a clear next step.',
  },
  solutions: {
    title: 'Solutions for your business',
    eyebrow: 'BUILT AROUND YOUR BUSINESS',
    headline: 'Different businesses.',
    accent: 'The same need to grow.',
    description: 'Your leads come with their own context. Build a journey that understands it.',
  },
  integrations: {
    title: 'Integration concepts',
    eyebrow: 'YOUR CONNECTED ECOSYSTEM',
    headline: 'Good tools work better',
    accent: 'when they work together.',
    description:
      'Explore a considered ecosystem of connection concepts for the tools your team already knows.',
  },
  pricing: {
    title: 'Plans and pricing',
    eyebrow: 'A CLEAR PATH TO GROWTH',
    headline: 'Start with what you need.',
    accent: 'Grow from there.',
    description: 'Three illustrative plans. One philosophy: every lead deserves a next step.',
  },

};
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${slug}` },
    openGraph: { title: `${page.title} | Growora`, description: page.description, url: `/${slug}` },
  };
}
export default async function MarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <MarketingShell>
      <div className="container">
        <div className={`page-intro ${slug === 'pricing' ? 'center' : ''}`}>
          <p className="kicker">{page.eyebrow}</p>
          <h1>
            {page.headline}
            <br />
            <span>{page.accent}</span>
          </h1>
          <p>{page.description}</p>
          {slug === 'product' && <ButtonLink href="/app">Explore the workspace</ButtonLink>}
        </div>
      </div>
      <div className="subpage-content">
        {slug === 'product' ? (
          <>
            <Workflow />
            <LeadCapture />
            <AutomationSection />
            <PipelineSection />
            <AnalyticsSection />
            <IntegrationUniverse />
          </>
        ) : slug === 'solutions' ? (
          <>
            <div className="container">
              <SolutionsSelector full />
            </div>
            <LeadCapture />
          </>
        ) : slug === 'integrations' ? (
          <div className="container">
            <IntegrationDirectory />
          </div>
        ) : slug === 'pricing' ? (
          <div className="container">
            <Pricing detailed />
          </div>
        ) : null}
      </div>
      <FinalCTA />
    </MarketingShell>
  );
}
