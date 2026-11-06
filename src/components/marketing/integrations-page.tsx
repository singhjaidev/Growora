'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Search,
  Zap,
  Calendar,
  Layers,
  Database,
  ShieldCheck,
  Cpu,
  Radio,
  ExternalLink,
} from 'lucide-react';
import s from './integrations-page.module.css';

interface IntegrationItem {
  name: string;
  category: 'CRM & Sales' | 'Calendar & Scheduling' | 'Communication & Chat' | 'Marketing & Nurture' | 'Automation & Webhooks';
  symbol: string;
  protocol: string;
  description: string;
  highlights: string[];
}

const integrationsList: IntegrationItem[] = [
  {
    name: 'HubSpot',
    category: 'CRM & Sales',
    symbol: 'H',
    protocol: 'Two-Way Sync',
    description: 'Automatically create and update CRM contacts, deals, and notes with complete qualification context.',
    highlights: ['Maps project budget, timeline & intent', 'Auto-creates deals in active pipeline', 'Tags owner based on routing rules'],
  },
  {
    name: 'Salesforce',
    category: 'CRM & Sales',
    symbol: 'SF',
    protocol: 'REST API',
    description: 'Push verified enterprise inbound opportunities directly into Salesforce Lead and Account objects.',
    highlights: ['Custom field & object mapping', 'Enterprise role-based attribution', 'Lead conversion workflow triggers'],
  },
  {
    name: 'Pipedrive',
    category: 'CRM & Sales',
    symbol: 'P',
    protocol: 'OAuth 2.0',
    description: 'Keep your visual sales pipeline full of qualified prospects with attached meeting agendas.',
    highlights: ['Instant deal card creation in stages', 'Attaches inquiry transcript to deals', 'Activity reminders for assigned reps'],
  },
  {
    name: 'Google Calendar',
    category: 'Calendar & Scheduling',
    symbol: '31',
    protocol: 'Real-Time Sync',
    description: 'Allow qualified prospects to book directly onto your team’s Google calendars without back-and-forth.',
    highlights: ['Live availability lookups', 'Buffer time & timezone intelligence', 'Automated Google Meet link generation'],
  },
  {
    name: 'Microsoft Outlook 365',
    category: 'Calendar & Scheduling',
    symbol: 'O',
    protocol: 'Graph API',
    description: 'Seamless calendar scheduling for corporate teams running Microsoft 365 and Exchange ecosystems.',
    highlights: ['Round-robin multi-calendar dispatch', 'Teams conference links created', 'Exchange busy/free slot detection'],
  },
  {
    name: 'Calendly & Cal.com',
    category: 'Calendar & Scheduling',
    symbol: 'Cal',
    protocol: 'Embed & Webhook',
    description: 'Embed existing scheduling workflows seamlessly into qualified lead progression paths.',
    highlights: ['Prefills invitee details automatically', 'Captures UTM source parameters', 'Triggers routing post-confirmation'],
  },
  {
    name: 'Slack',
    category: 'Communication & Chat',
    symbol: '#',
    protocol: 'Bot & Webhook',
    description: 'Push rich lead alert cards directly into dedicated sales channels with 1-click claim buttons.',
    highlights: ['Instant channel notifications for tier-1 leads', 'Claim and assign actions via buttons', 'Context thread summaries'],
  },
  {
    name: 'Microsoft Teams',
    category: 'Communication & Chat',
    symbol: 'T',
    protocol: 'Adaptive Cards',
    description: 'Notify enterprise teams in Microsoft Teams channels when high-priority proposals are requested.',
    highlights: ['Rich interactive card payloads', 'Direct links to advisor calendars', 'Supports private team channels'],
  },
  {
    name: 'WhatsApp Business',
    category: 'Communication & Chat',
    symbol: 'WA',
    protocol: 'Cloud API',
    description: 'Deliver instant SMS and WhatsApp appointment confirmations and reminders to mobile-first clients.',
    highlights: ['98% open-rate confirmation alerts', 'Automated directions & appointment prep', 'Two-way reply routing'],
  },
  {
    name: 'Zapier',
    category: 'Automation & Webhooks',
    symbol: '✳',
    protocol: 'App Connector',
    description: 'Connect Growora to 5,000+ business applications with zero lines of custom code.',
    highlights: ['Instant trigger on enquiry.qualified', 'Multi-step action sequences', 'Field mapping interface'],
  },
  {
    name: 'Make (Integromat)',
    category: 'Automation & Webhooks',
    symbol: 'M',
    protocol: 'Visual Engine',
    description: 'Design complex visual automation scenarios connecting backend databases, ERPs, and spreadsheets.',
    highlights: ['Branching logic based on lead score', 'Array & object aggregation', 'Real-time error recovery pathways'],
  },
  {
    name: 'Custom Webhooks',
    category: 'Automation & Webhooks',
    symbol: '{ }',
    protocol: 'HMAC SHA-256',
    description: 'Deliver signed JSON payloads to your proprietary servers or serverless functions with sub-second latency.',
    highlights: ['Cryptographic signature verification', 'Configurable retry exponential backoff', 'Full delivery log & replay inspect'],
  },
  {
    name: 'ActiveCampaign',
    category: 'Marketing & Nurture',
    symbol: 'AC',
    protocol: 'Tag & Pipeline',
    description: 'Automatically segment inbound contacts into customized email nurture campaigns based on budget tier.',
    highlights: ['Dynamic tag assignment by project type', 'Custom field synchronization', 'Nurture automation trigger'],
  },
  {
    name: 'Mailchimp',
    category: 'Marketing & Nurture',
    symbol: 'MC',
    protocol: 'Audience Sync',
    description: 'Ensure every prospective lead receives relevant thought leadership and follow-up sequences.',
    highlights: ['Audience list auto-categorization', 'Compliance & consent tracking', 'Campaign engagement reporting'],
  },
  {
    name: 'Klaviyo & Resend',
    category: 'Marketing & Nurture',
    symbol: 'K',
    protocol: 'Transactional API',
    description: 'Trigger branded, beautifully formatted intake confirmations and briefing dossiers in milliseconds.',
    highlights: ['Sub-second transactional dispatch', 'High inbox deliverability rates', 'Custom HTML template rendering'],
  },
];

const categories = [
  'All',
  'CRM & Sales',
  'Calendar & Scheduling',
  'Communication & Chat',
  'Automation & Webhooks',
  'Marketing & Nurture',
] as const;

const architecturePillars = [
  {
    icon: Database,
    title: 'Two-Way CRM Enrichment',
    desc: 'When an enquiry completes qualification, Growora creates or updates records with project scope, budget tier, and diagnostic context. No manual copy-pasting between forms and sales pipelines.',
    features: [
      'Synchronizes custom fields (budget, urgency, industry)',
      'Assigns deal ownership dynamically based on routing',
      'Attaches full diagnostic transcript to CRM activity feed',
      'Eliminates duplicate contacts and orphaned records',
    ],
  },
  {
    icon: Calendar,
    title: 'Real-Time Calendar Dispatch',
    desc: 'High-intent prospects can schedule a meeting immediately upon qualifying. Growora verifies live calendar availability across Google Calendar and Microsoft 365 without double-booking.',
    features: [
      'Direct integration with Google Calendar and Microsoft 365',
      'Multi-team round-robin availability distribution',
      'Buffer times and automatic timezone conversion',
      'Instant video meeting links generated on booking',
    ],
  },
  {
    icon: Radio,
    title: 'Instant Channel Push Alerts',
    desc: 'Keep sales teams alert with real-time notifications sent straight to Slack, Microsoft Teams, or WhatsApp. Team members can review the dossier and claim leads in one click.',
    features: [
      'Interactive Slack and Teams notification cards',
      'One-click lead assignment and status updates',
      'Configurable channel routing based on deal size',
      'Instant mobile SMS and WhatsApp reminders',
    ],
  },
];

const integrationsFaqs = [
  [
    'Do we need developers to connect our CRM or calendar?',
    'No. Most standard integrations (HubSpot, Google Calendar, Outlook, Slack, Zapier) use one-click OAuth authentication. You simply authenticate your account and map your desired fields using our visual interface in under five minutes.',
  ],
  [
    'How quickly does Growora synchronize new leads to HubSpot or Salesforce?',
    'Synchronization occurs in real time. As soon as a visitor completes an inquiry journey, the contact and deal records are created within sub-second latency via direct API connections.',
  ],
  [
    'What happens if our CRM or external service is temporarily unreachable?',
    'Growora employs resilient webhook and API delivery queues with exponential backoff retries. If your CRM or server returns an error or timeout, the event is automatically re-attempted over 24 hours, ensuring zero data loss.',
  ],
  [
    'Can we send custom webhook payloads to our proprietary internal software?',
    'Yes. You can configure custom HTTP webhooks with your own endpoint URLs. Payloads are signed with an HMAC SHA-256 secret header so your server can verify authenticity, and deliveries include full event timestamps and unique idempotency IDs.',
  ],
  [
    'Is customer data encrypted in transit when syncing to third-party tools?',
    'Yes, all data in transit is encrypted using modern TLS 1.3 encryption. We never store third-party credentials in plaintext and strictly adhere to standard OAuth token lifecycle management.',
  ],
  [
    'Can different enquiry forms sync into different CRM pipelines or Slack channels?',
    'Absolutely. You can establish granular routing rules so enterprise inquiries route to an enterprise CRM pipeline and a dedicated partner Slack channel, while general inquiries route to standard triage queues.',
  ],
];

export function IntegrationsPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredIntegrations = integrationsList.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className={s.integrationsPage}>
      {/* --------------------------------------------------------------------
          1. Hero Section: Obsidian Teal & Emerald Matrix
          -------------------------------------------------------------------- */}
      <section className={s.heroSection}>
        <div className={s.container}>
          <div className={s.heroContent}>
            <span className={s.label}>
              <span className={s.dot} aria-hidden="true" />
              CONNECTED ECOSYSTEM &amp; APIS
            </span>
            <h1 className={s.heroTitle}>
              Good tools work better
              <br />
              <em>when they work together.</em>
            </h1>
            <p className={s.heroCopy}>
              Connect Growora to your CRM, calendars, team channels, and automation stacks. Pass
              rich qualification context across your entire ecosystem with zero manual re-entry.
            </p>
            <div className={s.heroActions}>
              <a href="#directory" className={s.primaryAction}>
                Explore connected tools
                <ArrowRight size={17} />
              </a>
              <a href="#webhooks" className={s.secondaryAction}>
                Developer &amp; Webhook APIs
              </a>
            </div>
          </div>

          {/* Hero Metrics Bar */}
          <div className={s.metricsBar}>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>50+</span>
              <span className={s.metricLabel}>
                Supported platforms
                <br />
                &amp; webhooks
              </span>
            </div>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>&lt; 250ms</span>
              <span className={s.metricLabel}>
                Real-time event
                <br />
                delivery latency
              </span>
            </div>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>100%</span>
              <span className={s.metricLabel}>
                Diagnostic context
                <br />
                preserved on CRM sync
              </span>
            </div>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>0 Code</span>
              <span className={s.metricLabel}>
                One-click OAuth
                <br />
                authentications
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          2. Interactive Integrations Directory
          -------------------------------------------------------------------- */}
      <section id="directory" className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>INTEGRATION ECOSYSTEM</span>
            <h2 className={s.sectionTitle}>
              Connect your stack in <em>minutes, not weeks.</em>
            </h2>
            <p className={s.sectionSubtitle}>
              Filter by platform category or search for the specific CRM, calendar, or messaging tool
              your team uses every day.
            </p>
          </div>

          {/* Toolbar: Search & Category Filter Pills */}
          <div className={s.directoryToolbar}>
            <div className={s.searchWrap}>
              <Search className={s.searchIcon} size={18} />
              <input
                type="text"
                className={s.searchInput}
                placeholder="Search tools, CRMs, calendars..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search integrations"
              />
            </div>

            <div className={s.categoryFilterList} role="tablist" aria-label="Integration categories">
              {categories.map((cat) => {
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-pressed={isSelected}
                    className={s.categoryBtn}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Integrations Grid */}
          <div className={s.integrationsGrid}>
            {filteredIntegrations.map((item) => (
              <article key={item.name} className={s.integrationCard}>
                <div className={s.cardHeader}>
                  <div className={s.brandBadge}>{item.symbol}</div>
                  <div className={s.badgeStack}>
                    <span className={s.protocolBadge}>{item.protocol}</span>
                    <span className={s.categoryTag}>{item.category}</span>
                  </div>
                </div>

                <h3>{item.name}</h3>
                <p>{item.description}</p>

                <ul className={s.cardHighlights}>
                  {item.highlights.map((hl) => (
                    <li key={hl}>
                      <Check size={14} />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>

                <div className={s.cardFooter}>
                  <span className={s.statusIndicator}>
                    <span className={s.statusDot} />
                    Live sync ready
                  </span>
                  <a href="#webhooks" className={s.exploreBtn}>
                    View specs
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </article>
            ))}

            {filteredIntegrations.length === 0 && (
              <div className={s.emptyState}>
                <h3>No integrations matched your query</h3>
                <p>Try searching for a different tool name or reset your category filter.</p>
                <button
                  type="button"
                  className={s.clearFilterBtn}
                  onClick={() => {
                    setQuery('');
                    setActiveCategory('All');
                  }}
                >
                  Reset search &amp; filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          3. Core Architecture & Data Sync Pillars
          -------------------------------------------------------------------- */}
      <section className={`${s.section} ${s.sectionBordered}`}>
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>DATA ARCHITECTURE</span>
            <h2 className={s.sectionTitle}>
              How Growora orchestrates <em>data across your tools.</em>
            </h2>
            <p className={s.sectionSubtitle}>
              Three core synchronization pathways ensure information flows seamlessly from first
              touch to closed deal.
            </p>
          </div>

          <div className={s.pillarsGrid}>
            {architecturePillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.title} className={s.pillarCard}>
                  <div className={s.pillarIconWrap}>
                    <Icon size={24} />
                  </div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.desc}</p>
                  <ul className={s.pillarFeatureList}>
                    {pillar.features.map((feat) => (
                      <li key={feat}>
                        <Check size={16} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          4. Developer & Webhooks Engine Section
          -------------------------------------------------------------------- */}
      <section id="webhooks" className={s.developerSection}>
        <div className={s.container}>
          <div className={s.developerGrid}>
            <div className={s.developerInfo}>
              <span className={s.label}>DEVELOPER &amp; WEBHOOK ENGINE</span>
              <h2>
                Build custom pipelines with <em>event-driven webhooks.</em>
              </h2>
              <p>
                Need to trigger internal microservices, populate custom data warehouses, or execute
                complex backend logic? Growora dispatches signed, idempotent JSON payloads within
                milliseconds of enquiry qualification.
              </p>

              <div className={s.devFeatures}>
                <div className={s.devFeatureItem}>
                  <div className={s.devFeatureBadge}>
                    <ShieldCheck size={14} />
                  </div>
                  <div className={s.devFeatureText}>
                    <strong>HMAC SHA-256 Signatures</strong>
                    <span>Verify payload origin and integrity with cryptographic header signatures.</span>
                  </div>
                </div>

                <div className={s.devFeatureItem}>
                  <div className={s.devFeatureBadge}>
                    <Zap size={14} />
                  </div>
                  <div className={s.devFeatureText}>
                    <strong>Sub-250ms Delivery SLA</strong>
                    <span>Real-time webhook events dispatched the instant a prospect completes triage.</span>
                  </div>
                </div>

                <div className={s.devFeatureItem}>
                  <div className={s.devFeatureBadge}>
                    <Cpu size={14} />
                  </div>
                  <div className={s.devFeatureText}>
                    <strong>Exponential Backoff Retries</strong>
                    <span>Failed deliveries are safely queued and retried automatically for 24 hours.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Preview Terminal */}
            <div className={s.codeTerminal}>
              <div className={s.terminalBar}>
                <div className={s.terminalDots}>
                  <span className={`${s.termDot} ${s.dotRed}`} />
                  <span className={`${s.termDot} ${s.dotYellow}`} />
                  <span className={`${s.termDot} ${s.dotGreen}`} />
                </div>
                <span className={s.terminalTitle}>POST /api/webhooks/enquiry.qualified</span>
              </div>
              <pre className={s.terminalPre}>
                <code>
                  {'{'}{'\n'}
                  {'  '}<span className={s.jsonKey}>"event"</span>: <span className={s.jsonStr}>"enquiry.qualified"</span>,{'\n'}
                  {'  '}<span className={s.jsonKey}>"timestamp"</span>: <span className={s.jsonStr}>"2026-11-06T14:30:00Z"</span>,{'\n'}
                  {'  '}<span className={s.jsonKey}>"idempotency_key"</span>: <span className={s.jsonStr}>"evt_8f29c1b4e"</span>,{'\n'}
                  {'  '}<span className={s.jsonKey}>"data"</span>: {'{'}{'\n'}
                  {'    '}<span className={s.jsonKey}>"lead_id"</span>: <span className={s.jsonStr}>"lead_920384"</span>,{'\n'}
                  {'    '}<span className={s.jsonKey}>"score"</span>: <span className={s.jsonNum}>94</span>,{'\n'}
                  {'    '}<span className={s.jsonKey}>"status"</span>: <span className={s.jsonStr}>"QUALIFIED"</span>,{'\n'}
                  {'    '}<span className={s.jsonKey}>"contact"</span>: {'{'}{'\n'}
                  {'      '}<span className={s.jsonKey}>"name"</span>: <span className={s.jsonStr}>"Marcus Vance"</span>,{'\n'}
                  {'      '}<span className={s.jsonKey}>"email"</span>: <span className={s.jsonStr}>"marcus@apexcreative.io"</span>,{'\n'}
                  {'      '}<span className={s.jsonKey}>"company"</span>: <span className={s.jsonStr}>"Apex Creative"</span>{'\n'}
                  {'    '}{'}'},{'\n'}
                  {'    '}<span className={s.jsonKey}>"scope"</span>: {'{'}{'\n'}
                  {'      '}<span className={s.jsonKey}>"service"</span>: <span className={s.jsonStr}>"Brand Identity & System"</span>,{'\n'}
                  {'      '}<span className={s.jsonKey}>"budget"</span>: <span className={s.jsonStr}>"$50,000 - $75,000"</span>,{'\n'}
                  {'      '}<span className={s.jsonKey}>"timeline"</span>: <span className={s.jsonStr}>"Q1 Launch"</span>{'\n'}
                  {'    '}{'}'},{'\n'}
                  {'    '}<span className={s.jsonKey}>"routing"</span>: {'{'}{'\n'}
                  {'      '}<span className={s.jsonKey}>"assigned_to"</span>: <span className={s.jsonStr}>"sarah.k@growora.com"</span>,{'\n'}
                  {'      '}<span className={s.jsonKey}>"calendar_booked"</span>: <span className={s.jsonBool}>true</span>,{'\n'}
                  {'      '}<span className={s.jsonKey}>"slot"</span>: <span className={s.jsonStr}>"2026-11-10T15:00:00Z"</span>{'\n'}
                  {'    '}{'}'}{'\n'}
                  {'  '}{'}'}{'\n'}
                  {'}'}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          5. Sticky FAQ Section (Exact Website Theme)
          -------------------------------------------------------------------- */}
      <section className={s.faqSection}>
        <div className={s.container}>
          <div className={s.faqLayout}>
            {/* Sticky Green Column with Light Dots */}
            <div className={s.faqStickyCol}>
              <div className={s.faqHeadingGreenCard}>
                <span className={s.faqCardLabel}>INTEGRATIONS FAQ</span>
                <h2>
                  Everything about
                  <br />
                  connecting your stack.
                </h2>
                <p className={s.bodyCopy}>
                  Get complete clarity on authentication protocols, two-way sync latency, webhook
                  deliveries, and CRM compatibility.
                </p>
              </div>
            </div>

            {/* Accordion FAQ Questions List */}
            <div className={s.faqList}>
              {integrationsFaqs.map(([question, answer], idx) => {
                const isOpen = openFaq === idx;
                return (
                  <article key={question} data-open={isOpen}>
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`integrations-faq-answer-${idx}`}
                        id={`integrations-faq-question-${idx}`}
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                      >
                        <span>{question}</span>
                        <Plus size={20} />
                      </button>
                    </h3>
                    <div
                      className={s.faqAnswer}
                      id={`integrations-faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`integrations-faq-question-${idx}`}
                      aria-hidden={!isOpen}
                      inert={!isOpen}
                    >
                      <div>
                        <p>{answer}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
