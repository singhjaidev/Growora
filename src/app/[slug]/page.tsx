import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CheckCheck, GitBranch, MousePointer2 } from 'lucide-react';
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
import { DemoRequest } from '@/components/marketing/demo-request';
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
  about: {
    title: 'The thinking behind Growora',
    eyebrow: 'A PRODUCT WITH A POINT OF VIEW',
    headline: 'Interest is a beginning.',
    accent: 'Not an inbox item.',
    description:
      'Growora is a portfolio product built around the space between an enquiry and a meaningful conversation.',
  },
  demo: {
    title: 'Explore the demo',
    eyebrow: 'EXPERIENCE THE FLOW',
    headline: 'Meet your next',
    accent: 'way of working.',
    description:
      'A few details. A clear next step. Explore how a connected lead process could work for your business.',
  },
  contact: {
    title: 'Contact and product exploration',
    eyebrow: 'START A CONVERSATION',
    headline: 'A better process',
    accent: 'starts with a question.',
    description:
      'Use this local demo request to frame what you would like to explore. No message is transmitted.',
  },
  docs: {
    title: 'Product documentation',
    eyebrow: 'THE GROWORA FIELD GUIDE',
    headline: 'Get to know',
    accent: 'your workspace.',
    description:
      'A practical guide to the demonstration, the decisions behind it, and the way your data moves.',
  },
  guides: {
    title: 'Lead conversion guides',
    eyebrow: 'BETTER PROCESSES, SMALLER STEPS',
    headline: 'Make the next step',
    accent: 'a useful one.',
    description: 'Simple ways to build a thoughtful lead journey, from capture to follow-up.',
  },
  privacy: {
    title: 'Privacy in this demonstration',
    eyebrow: 'YOUR DATA, EXPLAINED',
    headline: 'Local by design.',
    accent: 'Clear by default.',
    description: 'How this portfolio demonstration handles the information you choose to enter.',
  },
  terms: {
    title: 'Demonstration terms',
    eyebrow: 'THE DEMONSTRATION',
    headline: 'Explore freely.',
    accent: 'Know the boundaries.',
    description: 'A clear description of what this portfolio product provides.',
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
const editorial: Record<string, { lead: string; items: [string, string][] }> = {
  about: {
    lead: '“Why should a high-intent enquiry wait inside an inbox?”',
    items: [
      [
        'Start with the opportunity.',
        'A form submission contains more than contact details. It contains a need, a timeframe and an intention. Growora is designed to preserve that context all the way through the sales process.',
      ],
      [
        'Make automation understandable.',
        'A good workflow should be easy to explain. Clear conditions, visible routes and useful next steps help a team understand why a lead is moving and who should act.',
      ],
      [
        'Give people better conversations.',
        'Automation can handle the repetitive work. People should spend their time understanding a challenge, offering advice and building trust. The process exists to support that work.',
      ],
      [
        'Build with intent.',
        'This product is a working portfolio demonstration: custom interaction design, purposeful WebGL, accessible controls and a shared local data model. It is not a claim of an operating company or a live customer base.',
      ],
    ],
  },
  docs: {
    lead: 'One lead. One connected journey. Here is how to follow it.',
    items: [
      [
        '01 — Capture a lead',
        'Use the interactive lead demo on the homepage. Enter a name, company, email, service, budget and timeline. The details stay in your browser. Avoid entering sensitive information.',
      ],
      [
        '02 — Understand the score',
        'The demo uses deterministic rules, not an AI service. Budget contributes up to 35 points, urgency up to 21, a company name adds 5, and the base score is 30. A score of 75 or more routes the lead to the priority queue.',
      ],
      [
        '03 — Work the pipeline',
        'Open Leads to search, filter or sort. Select a lead to view qualification details, change its status and save a note. In Pipeline, drag between stages or use the stage selector on each card.',
      ],
      [
        '04 — Shape the process',
        'Automations lets you select nodes, edit settings, pause a flow and visualize a test run. Forms lets you add, rename, reorder and remove fields. Changes are local to your browser.',
      ],
      [
        '05 — Reset and start again',
        'Workspace settings include a data reset for the sample leads. Saved data is not synced across devices or browsers. Clearing browser storage also clears this demonstration.',
      ],
    ],
  },
  guides: {
    lead: 'Good lead processes are built around useful decisions, not more notifications.',
    items: [
      [
        'Ask only what changes the next step.',
        'Every field has a cost. Start with the service needed, a realistic budget range and a timeline. Ask yourself what action would change based on each answer.',
      ],
      [
        'Make your scoring legible.',
        'A score should help explain priority. Show which inputs shaped it, allow the team to inspect the context, and avoid treating a number as a replacement for judgment.',
      ],
      [
        'Give every stage a definition.',
        'New means unreviewed. Qualified means there is a fit worth discussing. Contacted means a conversation has begun. Proposal means there is a concrete offer. Won means the next phase can start.',
      ],
      [
        'Follow up with a reason.',
        'A useful follow-up adds context, answers a question or offers a practical next step. A delay node should support a considered conversation, not a flood of reminders.',
      ],
    ],
  },
  privacy: {
    lead: 'This version keeps your demonstration data in browser storage.',
    items: [
      [
        'What is stored',
        'Lead form submissions, lead status changes, notes, form builder fields, automation settings, integration simulation states, workspace preferences and demo requests may be saved in localStorage on this browser.',
      ],
      [
        'What is not connected',
        'There is no authentication service, payment provider, email delivery, CRM synchronization or AI processing API. Form details are not sent to an external service by this application.',
      ],
      [
        'How to remove your data',
        'Reset sample leads from workspace settings, or clear this site’s browser storage to remove all saved demonstration data. There is no central account to delete.',
      ],
      [
        'Hosting and third-party links',
        'A hosting provider may receive normal HTTP connection information when you load the website. Any future production deployment should publish its actual hosting, retention and contact details before collecting real customer data.',
      ],
    ],
  },
  terms: {
    lead: 'Growora is an interactive software portfolio demonstration.',
    items: [
      [
        'Purpose',
        'The site illustrates a possible lead-conversion product. Sample records are fictional. Metrics describe demonstration data. No customer endorsement, certification or operational business claim is implied.',
      ],
      [
        'Plans and integrations',
        'Prices illustrate a potential product model and are not an offer to purchase. Integration states are simulations. No external account access, automated delivery or live synchronization is provided.',
      ],
      [
        'Local data and availability',
        'Data is stored on this device and may be lost if browser storage is cleared. The demonstration is not intended to manage real customer records or support business-critical operations.',
      ],
      [
        'Responsible exploration',
        'Use fictional or non-sensitive information when trying the forms. This demonstration does not provide a service agreement, support commitment or availability guarantee.',
      ],
    ],
  },
};
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
        ) : slug === 'demo' || slug === 'contact' ? (
          <div className="container demo-page-grid">
            <div className="demo-benefits">
              {[
                [
                  MousePointer2,
                  'Feel the product.',
                  'Explore a working workspace with realistic sample opportunities.',
                ],
                [
                  GitBranch,
                  'Follow a lead.',
                  'Try capture, qualification and routing, then see your lead in the dashboard.',
                ],
                [
                  CheckCheck,
                  'Make it yours.',
                  'Move pipeline cards, configure workflows and build a capture form.',
                ],
              ].map(([Icon, title, copy]) => {
                const I = Icon as typeof MousePointer2;
                return (
                  <div key={String(title)}>
                    <I size={20} />
                    <div>
                      <h3>{title as string}</h3>
                      <p>{copy as string}</p>
                    </div>
                  </div>
                );
              })}
              <ButtonLink href="/app" secondary>
                Skip straight to the demo
              </ButtonLink>
            </div>
            <DemoRequest />
          </div>
        ) : editorial[slug] ? (
          <div className="container">
            <div className="editorial">
              <p className="editorial-lead">{editorial[slug].lead}</p>
              {editorial[slug].items.map(([title, copy], i) => (
                <article key={title}>
                  <span>0{i + 1} /</span>
                  <div>
                    <h2>{title}</h2>
                    <p>{copy}</p>
                  </div>
                </article>
              ))}
              {slug === 'docs' && <ButtonLink href="/app">Open the workspace</ButtonLink>}
            </div>
          </div>
        ) : null}
      </div>
      {!['privacy', 'terms', 'demo', 'contact'].includes(slug) && <FinalCTA />}
    </MarketingShell>
  );
}
