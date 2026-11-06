'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  Users,
  Target,
  Briefcase,
  X,
  Zap,
  Building2,
  Stethoscope,
  Wrench,
  Palette,
} from 'lucide-react';
import s from './solutions-page.module.css';

interface IndustrySolution {
  id: string;
  tabLabel: string;
  title: string;
  problem: string;
  description: string;
  steps: { title: string; desc: string }[];
  statNumber: string;
  statLabel: string;
  specimen: {
    clientType: string;
    tag: string;
    inboundDetail: string;
    scopeDetail: string;
    qualificationDetail: string;
    routeAction: string;
  };
}

const industrySolutions: IndustrySolution[] = [
  {
    id: 'agencies',
    tabLabel: 'Creative & Digital Agencies',
    title: 'Creative, Design & Digital Studios',
    problem: 'Triage bottleneck: Vague briefs & unbudgeted inquiries eating partner hours',
    description:
      'Stop losing creative leads to inbox delays and eliminate endless email tennis over scopes. Growora pre-qualifies timelines, deliverables, and budgets before anyone books a discovery call.',
    steps: [
      {
        title: 'Dynamic Scope Diagnostic',
        desc: 'Interactive intake adapts questions based on project category (Brand, Web, Performance, Retainer).',
      },
      {
        title: 'Budget & Timeline Calibration',
        desc: 'Identifies budget ranges and hard launch deadlines before creative directors commit time.',
      },
      {
        title: 'Executive Calendar Dispatch',
        desc: 'High-value accounts immediately receive direct booking links to the designated account director.',
      },
    ],
    statNumber: '68%',
    statLabel: 'Faster turnaround from inbound inquiry to signed discovery workshop',
    specimen: {
      clientType: 'Growth-Stage SaaS (Series B)',
      tag: 'Qualified • Tier 1 Retainer',
      inboundDetail: 'Inbound via portfolio case study: Brand refresh & design system overhaul',
      scopeDetail: 'Budget: $45,000 – $60,000 • Desired timeline: Q2 completion • Team size: 60+',
      qualificationDetail: 'Score: 94/100 • Meets agency minimum budget ($30k) and timeline capacity',
      routeAction: 'Routed to Managing Director • Pre-brief PDF generated • Call booked for Thursday 2pm',
    },
  },
  {
    id: 'consulting',
    tabLabel: 'Consultancies & Advisory',
    title: 'Management & Strategy Consultancies',
    problem: 'Context fragmentation: Entering discovery meetings without diagnostic baseline data',
    description:
      'Equip partners with deep client context before the first consultation. Growora gathers strategic objectives, organizational roadblocks, and decision stakeholders upfront.',
    steps: [
      {
        title: 'Diagnostic Pre-Intake',
        desc: 'Gathers organizational friction points and current-state metrics prior to executive consultations.',
      },
      {
        title: 'Stakeholder & Decision Mapping',
        desc: 'Uncovers buying committees, internal sponsors, and project urgency during the initial intake.',
      },
      {
        title: 'Practice Area Routing',
        desc: 'Routes inquiries directly to the specialized practice partner (Operations, M&A, Technology).',
      },
    ],
    statNumber: '3.4x',
    statLabel: 'Higher conversion rate from discovery session to structured advisory engagement',
    specimen: {
      clientType: 'Mid-Market Logistics Firm',
      tag: 'High Intent • Strategic Advisory',
      inboundDetail: 'Inbound referral: Supply chain bottleneck optimization & ERP audit',
      scopeDetail: 'Annual Revenue: $42M • Sponsor: Chief Operating Officer • Timeline: Immediate',
      qualificationDetail: 'Score: 98/100 • Multiple stakeholder alignment verified • Budget unlocked',
      routeAction: 'Routed to Supply Chain Practice Lead • Diagnostic summary dispatched to Partner',
    },
  },
  {
    id: 'professional-services',
    tabLabel: 'Professional & Legal Services',
    title: 'Legal, Accounting & Corporate Practices',
    problem: 'Risk & conflict overhead: Sorting viable matters from unqualified administrative queries',
    description:
      'Protect billable partner hours with automated matter classification, jurisdiction screening, and preliminary conflict checks before consultations are scheduled.',
    steps: [
      {
        title: 'Jurisdiction & Practice Screening',
        desc: 'Filters prospective clients by jurisdiction, regulatory domain, and matter urgency.',
      },
      {
        title: 'Secure Document Intake',
        desc: 'Allows prospective clients to submit pertinent context documents through encrypted channels.',
      },
      {
        title: 'Fee Structure Transparency',
        desc: 'Clarifies engagement retainer minimums upfront to prevent billing misalignment.',
      },
    ],
    statNumber: '12 hrs',
    statLabel: 'Partner administrative triage time saved per practitioner every single week',
    specimen: {
      clientType: 'Corporate Cross-Border Transaction',
      tag: 'Verified • Corporate Advisory',
      inboundDetail: 'Direct inquiry: International subsidiary restructuring and tax compliance',
      scopeDetail: 'Jurisdictions: UK & EU • Entity structure: 3 operating subsidiaries • Urgency: 30 days',
      qualificationDetail: 'Score: 91/100 • Clear jurisdiction match • Retainer criteria acknowledged',
      routeAction: 'Assigned to Corporate Partner • Client onboarding verification kit triggered',
    },
  },
  {
    id: 'real-estate',
    tabLabel: 'Real Estate & Property',
    title: 'Commercial & Luxury Property Advisory',
    problem: 'Speed-to-lead latency: Losing high-net-worth buyers and tenants to delayed agent response',
    description:
      'Instantly route property inquiries to the right portfolio agent based on asset type, target submarket, square footage requirements, and purchase capacity.',
    steps: [
      {
        title: 'Location & Asset Classification',
        desc: 'Captures asset classification (commercial lease, industrial, prime residential) and geographic preferences.',
      },
      {
        title: 'Financing & Timeline Readiness',
        desc: 'Verifies pre-approval status, cash allocation, and projected lease commencement dates.',
      },
      {
        title: 'Instant Agent Notification',
        desc: 'Pushes high-priority lead dossiers via SMS and Slack to the designated territorial broker.',
      },
    ],
    statNumber: '< 4 min',
    statLabel: 'Average time between inquiry submission and broker phone contact on top listings',
    specimen: {
      clientType: 'Corporate Headquarters Relocation',
      tag: 'Priority Commercial Tenant',
      inboundDetail: 'Listing inquiry: 12,000 – 16,000 sq ft prime office space in central financial district',
      scopeDetail: 'Lease term: 5+ years • Move-in target: Q3 • Current headcount: 85 employees',
      qualificationDetail: 'Score: 96/100 • Board-approved relocation mandate • Budget confirmed',
      routeAction: 'Assigned to Commercial Broker • Curated property dossier automatically generated',
    },
  },
  {
    id: 'trades',
    tabLabel: 'Trades & Home Services',
    title: 'High-Value Trades & Architectural Services',
    problem: 'Field dispatch friction: Sorting small repairs from high-margin full renovations on the road',
    description:
      'Capture job site photos, project dimensions, and budget expectations while you are on site. Let Growora separate high-margin projects from low-value service calls automatically.',
    steps: [
      {
        title: 'Visual Project Diagnostics',
        desc: 'Clients upload site photos, architectural sketches, and damage documentation directly from mobile.',
      },
      {
        title: 'Postal Code & Trade Scoping',
        desc: 'Validates service territory coverage and assigns the specific estimator or trade lead.',
      },
      {
        title: 'Site Visit Self-Scheduling',
        desc: 'Qualified projects book an estimator on-site consultation within available routing windows.',
      },
    ],
    statNumber: '82%',
    statLabel: 'Reduction in wasted site visits for out-of-scope or under-budget job requests',
    specimen: {
      clientType: 'Residential Architectural Extension',
      tag: 'Qualified • Full Build',
      inboundDetail: 'Web inquiry: Ground floor extension & open-plan kitchen remodel with structural works',
      scopeDetail: 'Planning permission: Approved • Budget: $85,000+ • Start date: Next 60 days',
      qualificationDetail: 'Score: 93/100 • Within primary service zone • Architectural drawings attached',
      routeAction: 'Site survey scheduled for Friday 10:00 AM • Senior Estimator notified via SMS',
    },
  },
  {
    id: 'healthcare',
    tabLabel: 'Healthcare & Private Clinics',
    title: 'Specialist Clinics & Private Practice',
    problem: 'Front desk overwhelm: Repetitive intake calls delaying patient appointment scheduling',
    description:
      'Provide prospective patients with a private, frictionless intake experience that gathers treatment interest, insurance preferences, and scheduling availability around the clock.',
    steps: [
      {
        title: 'Treatment & Concern Triaging',
        desc: 'Patients choose their clinical focus area with clear, reassuring non-clinical questions.',
      },
      {
        title: 'Practitioner Matching',
        desc: 'Directs consultations to the appropriate clinical specialist or consultant doctor.',
      },
      {
        title: 'Automated Pre-Appointment Prep',
        desc: 'Dispatches consultation preparation instructions, clinic directions, and confirmation reminders.',
      },
    ],
    statNumber: '40%',
    statLabel: 'Decrease in front-desk call load while increasing confirmed new patient bookings',
    specimen: {
      clientType: 'Private Orthopedic Consultation',
      tag: 'Confirmed • Specialist Referral',
      inboundDetail: 'Self-referral: Sports injury diagnostic consultation & MRI review',
      scopeDetail: 'Coverage: Private Medical Insurance • Referral letter: Uploaded • Availability: Mornings',
      qualificationDetail: 'Score: 100/100 • Insurance pre-authorization active • Referral validated',
      routeAction: 'Consultation slot booked with Specialist Consultant • Clinic welcome pack sent',
    },
  },
];

const operationalModels = [
  {
    icon: Briefcase,
    title: 'High-Touch Advisory Model',
    desc: 'For boutique practices where partner face-time is scarce and deal sizes are high. Prospects complete an intelligent diagnostic that establishes timeline, strategic constraints, and budget before anyone enters a call.',
    features: [
      'Comprehensive diagnostic context prior to discovery meetings',
      'Eliminates unbudgeted consultation tyre-kickers',
      'Custom qualification thresholds per practice lead',
      'Automated briefing dossier delivered directly to partner inbox',
    ],
  },
  {
    icon: Users,
    title: 'Distributed Specialist Dispatch',
    desc: 'Automatically route high-intent inquiries to the exact practice specialist, regional director, or territorial advisor based on expertise, client geography, and transaction scale.',
    features: [
      'Intelligent routing by jurisdiction, territory, or asset class',
      'Round-robin assignment with team availability sync',
      'Instant push notifications via SMS, Slack, and email',
      'Automated fallback re-routing when assignees are unavailable',
    ],
  },
  {
    icon: Zap,
    title: 'High-Volume Inbound Triage',
    desc: 'Handle large marketing spikes without dropping a single opportunity. Growora instantly separates urgent opportunities from research inquiries, booking calendar slots in under five minutes.',
    features: [
      'Sub-5-minute automated qualification SLA',
      'Self-serve consultation booking for tier-one opportunities',
      'Automated nurture sequence for lower-urgency inquiries',
      'Zero leads lost in unmonitored generic web forms',
    ],
  },
];

const solutionsFaqs = [
  [
    'Can we customize the qualification questions for our specific service offerings?',
    'Yes, completely. Every Growora workflow is modular. You can define custom qualification criteria, branching logic, mandatory questions, and budget ranges that reflect your exact commercial requirements. Changes take effect instantly without writing any code.',
  ],
  [
    'How does Growora route inquiries between different partners or team members?',
    'Growora supports advanced multi-variable routing. You can route inbound leads based on project type, budget tier, geographical region, or equal round-robin distribution among designated team members. Leads are assigned instantly with complete context dossiers.',
  ],
  [
    'Will this integrate with our current CRM, calendar, and email tools?',
    'Growora connects natively with leading tools including Google Calendar, Microsoft Outlook, HubSpot, Salesforce, Pipedrive, Slack, and Zapier. Inbound leads, consultation bookings, and diagnostic dossiers sync automatically into your existing tech stack.',
  ],
  [
    'Can we set different qualification thresholds for different service lines?',
    'Yes. For instance, an agency can set a $50,000 minimum budget requirement for full-service branding engagements while maintaining a lower threshold for strategic audits. The intake flow adapts dynamically based on the visitor’s selections.',
  ],
  [
    'How quickly can our team launch a pre-built industry blueprint?',
    'Most teams launch within a single afternoon. You can select one of our pre-configured industry blueprints, adjust your brand styling and calendar availability, and embed the intake widget onto your website with a single line of script or custom link.',
  ],
  [
    'What happens if an inbound inquiry does not meet our qualification criteria?',
    'Unqualified or out-of-scope inquiries are handled gracefully without burning team time. Growora can provide helpful automated resources, redirect prospects to self-serve materials, or route them into a nurture email sequence while keeping your primary calendar protected.',
  ],
];

export function SolutionsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const activeSolution = industrySolutions[activeTab];

  return (
    <div className={s.solutionsPage}>
      {/* --------------------------------------------------------------------
          1. Hero Section: Forest Onyx with Champagne-Mint Accents
          -------------------------------------------------------------------- */}
      <section className={s.heroSection}>
        <div className={s.container}>
          <div className={s.heroContent}>
            <span className={s.label}>
              <span className={s.dot} aria-hidden="true" />
              SOLUTIONS & INDUSTRY BLUEPRINTS
            </span>
            <h1 className={s.heroTitle}>
              Different businesses.
              <br />
              <em>The same need to grow.</em>
            </h1>
            <p className={s.heroCopy}>
              Your inbound leads arrive with distinct context, budgets, and urgency. Growora replaces
              generic web forms with intelligent intake journeys that triage, qualify, and route
              every opportunity with zero dropped details.
            </p>
            <div className={s.heroActions}>
              <a href="#industries" className={s.primaryAction}>
                Explore industry workflows
                <ArrowRight size={17} />
              </a>
              <Link href="/pricing" className={s.secondaryAction}>
                View pricing plans
              </Link>
            </div>
          </div>

          {/* Hero Proof Metrics Bar */}
          <div className={s.metricsBar}>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>8+</span>
              <span className={s.metricLabel}>
                Pre-built industry
                <br />
                qualification blueprints
              </span>
            </div>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>&lt; 5 min</span>
              <span className={s.metricLabel}>
                Average qualification
                <br />
                and routing SLA
              </span>
            </div>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>100%</span>
              <span className={s.metricLabel}>
                Diagnostic context
                <br />
                retained on bookings
              </span>
            </div>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>3.4x</span>
              <span className={s.metricLabel}>
                Higher conversion
                <br />
                to signed engagements
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          2. Interactive Industry Solutions Explorer
          -------------------------------------------------------------------- */}
      <section id="industries" className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>TAILORED WORKFLOWS</span>
            <h2 className={s.sectionTitle}>
              Engineered for your industry’s <em>unique deal flow.</em>
            </h2>
            <p className={s.sectionSubtitle}>
              Select your domain below to see how Growora replaces generic contact forms with
              high-fidelity qualification and automated specialist dispatch.
            </p>
          </div>

          {/* Industry Tabs */}
          <div className={s.industryTabs} role="tablist" aria-label="Industry solutions">
            {industrySolutions.map((sol, index) => {
              const isSelected = activeTab === index;
              return (
                <button
                  key={sol.id}
                  type="button"
                  role="tab"
                  id={`tab-${sol.id}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${sol.id}`}
                  className={s.industryTabBtn}
                  onClick={() => setActiveTab(index)}
                >
                  {sol.tabLabel}
                </button>
              );
            })}
          </div>

          {/* Selected Industry Card */}
          <div
            id={`panel-${activeSolution.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeSolution.id}`}
            className={s.industrySolutionCard}
          >
            <div className={s.industryInfo}>
              <span className={s.industryProblem}>{activeSolution.problem}</span>
              <h3>{activeSolution.title}</h3>
              <p className={s.industryDesc}>{activeSolution.description}</p>

              <div className={s.industrySteps}>
                {activeSolution.steps.map((st, i) => (
                  <div key={st.title} className={s.stepRow}>
                    <div className={s.stepBadge}>{i + 1}</div>
                    <div className={s.stepContent}>
                      <strong>{st.title}</strong>
                      <p>{st.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={s.industryStat}>
                <div className={s.industryStatNumber}>{activeSolution.statNumber}</div>
                <div className={s.industryStatLabel}>{activeSolution.statLabel}</div>
              </div>
            </div>

            {/* Specimen Dossier Preview */}
            <div className={s.industrySpecimen}>
              <div className={s.specimenHeader}>
                <div>
                  <small style={{ color: '#92b8aa', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Live Lead Specimen
                  </small>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                    {activeSolution.specimen.clientType}
                  </div>
                </div>
                <span className={s.specimenTag}>{activeSolution.specimen.tag}</span>
              </div>

              <div className={s.specimenBody}>
                <div className={s.specimenBox}>
                  <small>Inbound Context & Channel</small>
                  <strong>{activeSolution.specimen.inboundDetail}</strong>
                </div>

                <div className={s.specimenBox}>
                  <small>Diagnostic Scope & Timeline Parameters</small>
                  <strong>{activeSolution.specimen.scopeDetail}</strong>
                </div>

                <div className={`${s.specimenBox} ${s.specimenHighlight}`}>
                  <small>Automated Qualification Assessment</small>
                  <strong>{activeSolution.specimen.qualificationDetail}</strong>
                </div>

                <div className={s.specimenBox}>
                  <small>Dispatch & Routing Execution</small>
                  <strong>{activeSolution.specimen.routeAction}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          3. Core Operational Architecture Models
          -------------------------------------------------------------------- */}
      <section className={`${s.section} ${s.sectionBordered}`}>
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>OPERATIONAL ARCHITECTURE</span>
            <h2 className={s.sectionTitle}>
              Three operational models, <em>one unified platform.</em>
            </h2>
            <p className={s.sectionSubtitle}>
              Whether your commercial motion relies on senior partners, distributed field reps, or
              high-velocity inbound triage, Growora adapts to your exact routing rules.
            </p>
          </div>

          <div className={s.modelsGrid}>
            {operationalModels.map((model) => {
              const Icon = model.icon;
              return (
                <article key={model.title} className={s.modelCard}>
                  <div className={s.modelIconWrap}>
                    <Icon size={24} />
                  </div>
                  <h3>{model.title}</h3>
                  <p>{model.desc}</p>
                  <ul className={s.modelFeatureList}>
                    {model.features.map((feat) => (
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
          4. Before & After Transformation Comparison
          -------------------------------------------------------------------- */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>THE OUTCOME</span>
            <h2 className={s.sectionTitle}>
              The difference between <em>passive intake and active qualification.</em>
            </h2>
            <p className={s.sectionSubtitle}>
              Compare the friction of traditional web forms with Growora’s automated context intelligence.
            </p>
          </div>

          <div className={s.comparisonGrid}>
            {/* Before Card */}
            <div className={s.beforeCard}>
              <span className={s.beforeBadge}>
                <X size={14} />
                Traditional Contact Forms
              </span>
              <h3>Scattered inboxes & lost deal momentum</h3>
              <p>
                Standard forms capture an email address and a blank comment box, forcing your team
                to chase prospects for days just to discover if they are a viable commercial fit.
              </p>
              <ul className={s.beforeList}>
                <li>
                  <X size={16} />
                  <span>Vague scopes require 3+ manual follow-up emails before discovery</span>
                </li>
                <li>
                  <X size={16} />
                  <span>High-value prospects wait 24–48 hours for a basic human reply</span>
                </li>
                <li>
                  <X size={16} />
                  <span>Critical project details get buried across unorganized email threads</span>
                </li>
                <li>
                  <X size={16} />
                  <span>Unqualified inquiries waste valuable senior partner consultation time</span>
                </li>
                <li>
                  <X size={16} />
                  <span>No visibility into deal attribution, pipeline velocity, or drop-off</span>
                </li>
              </ul>
            </div>

            {/* After Card */}
            <div className={s.afterCard}>
              <span className={s.afterBadge}>
                <Check size={14} />
                With Growora
              </span>
              <h3>Structured intelligence from the first second</h3>
              <p>
                Prospects experience a thoughtful, consultative intake journey. Your team receives a
                complete briefing dossier and an instantly booked consultation on the right calendar.
              </p>
              <ul className={s.afterList}>
                <li>
                  <Check size={16} />
                  <span>100% of scope, timeline, and budget parameters captured upfront</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Instant routing to the ideal practice lead in under 60 seconds</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Automated calendar booking for pre-qualified prospective clients</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Full audit trail and conversation context synced to your CRM</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Lower-urgency leads gently guided into automated nurture sequences</span>
                </li>
              </ul>
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
                <span className={s.faqCardLabel}>SOLUTIONS FAQ</span>
                <h2>
                  Questions about
                  <br />
                  tailored workflows.
                </h2>
                <p className={s.bodyCopy}>
                  Everything you need to know about setting up industry blueprints, custom triage
                  rules, and team routing.
                </p>
              </div>
            </div>

            {/* Accordion FAQ Questions List */}
            <div className={s.faqList}>
              {solutionsFaqs.map(([question, answer], idx) => {
                const isOpen = openFaq === idx;
                return (
                  <article key={question} data-open={isOpen}>
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`solutions-faq-answer-${idx}`}
                        id={`solutions-faq-question-${idx}`}
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                      >
                        <span>{question}</span>
                        <Plus size={20} />
                      </button>
                    </h3>
                    <div
                      className={s.faqAnswer}
                      id={`solutions-faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`solutions-faq-question-${idx}`}
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
