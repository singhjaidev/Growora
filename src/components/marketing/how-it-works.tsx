'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Plus,
  ArrowLeft,
  ArrowRight,
  Inbox,
  Sparkles,
  Users,
  CalendarDays,
  ChartNoAxesCombined,
  ShieldCheck,
  Clock,
  Zap,
  Layers,
  X,
  Target,
  ExternalLink,
} from 'lucide-react';
import s from './how-it-works-page.module.css';

interface WalkthroughStep {
  id: string;
  tabLabel: string;
  stageNum: string;
  title: string;
  copy: string;
  takeaway: string;
  statusBadge: string;
  specimenClient: string;
  specimenService: string;
  fields: [string, string][];
  checklist: string[];
  actionBanner: string;
}

const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'capture',
    tabLabel: 'Capture & Intake',
    stageNum: '01',
    title: 'Intelligent Diagnostic Intake',
    copy: 'Replace generic contact forms with a structured diagnostic journey. Capture the prospect’s scope, timeline, and commercial expectations in one unified record before anyone has to write an email.',
    takeaway: 'Your team sees exactly what the client requires without endless back-and-forth clarifying emails.',
    statusBadge: 'New Inquiry • Diagnostic Complete',
    specimenClient: 'Northline Architecture Studio',
    specimenService: 'Full-Cycle Workspace Redesign',
    fields: [
      ['Inbound Channel', 'Portfolio Case Study'],
      ['Budget Expectation', '$45,000 – $60,000'],
      ['Target Delivery', 'Q2 Launch (60 Days)'],
      ['Initial Score', '94 / 100 (Tier 1)'],
      ['Key Requirement', 'Sustainable Materials & LEED'],
      ['Project Lead', 'Alex Morgan (Founder)'],
    ],
    checklist: [
      'Gathers concrete timeline and budget constraints upfront',
      'Adapts questions dynamically based on selected services',
      'Zero generic unstructured blank forms',
    ],
    actionBanner: 'Diagnostic dossier generated • Ready for automated qualification triage',
  },
  {
    id: 'qualify',
    tabLabel: 'Commercial Fit',
    stageNum: '02',
    title: 'Automated Fit & Priority Scoring',
    copy: 'Evaluate every inquiry against your firm’s commercial criteria, service capabilities, and minimum budget thresholds. Ensure partner hours are focused exclusively on viable, high-margin projects.',
    takeaway: 'Prioritize opportunities with a transparent, rubric-backed scoring model your whole team understands.',
    statusBadge: 'Scored: 94/100 • Priority Match',
    specimenClient: 'Northline Architecture Studio',
    specimenService: 'Commercial Architecture Fit',
    fields: [
      ['Commercial Tier', 'Enterprise Studio Retainer'],
      ['Budget Threshold', 'Surpasses $30k Minimum Floor'],
      ['Urgency Rating', 'High Priority (< 24h SLA)'],
      ['Fit Confidence', '98% Service Alignment'],
      ['Decision Authority', 'Sole Managing Director'],
      ['Engagement Type', 'Fixed-Scope + Advisory'],
    ],
    checklist: [
      'Transparent scoring rubric based on deal size and timeline',
      'Instantly separates high-budget proposals from casual queries',
      'Protects senior partner hours from out-of-scope work',
    ],
    actionBanner: 'Approved for priority routing • Dispatched to Design Director queue',
  },
  {
    id: 'assign',
    tabLabel: 'Routing & Ownership',
    stageNum: '03',
    title: 'Direct Specialist Routing & Ownership',
    copy: 'Eliminate the black hole of shared team inboxes. High-intent opportunities are assigned immediately to the designated practice lead, regional director, or account specialist with complete context attached.',
    takeaway: 'Clear responsibility is established in seconds, ensuring no promising opportunity goes unattended.',
    statusBadge: 'Assigned to Jamie Lee • Design Director',
    specimenClient: 'Northline Architecture Studio',
    specimenService: 'Commercial Architecture Lead',
    fields: [
      ['Designated Owner', 'Jamie Lee (Director)'],
      ['Routing Rule', 'Commercial Architecture Specialism'],
      ['Slack Notification', 'Pushed to #priority-deals'],
      ['Context Sync', 'Full dossier attached to record'],
      ['SLA Response Timer', 'Active (Target: < 15 mins)'],
      ['Fallback Assignee', 'Sam Carter (Associate Director)'],
    ],
    checklist: [
      'Routing based on domain expertise, geography, or round-robin rules',
      'Instant push alerts delivered straight to Slack and email',
      'Automatic escalation if a priority lead sits unacknowledged',
    ],
    actionBanner: 'Owner notified via Slack • Self-serve booking dispatched to prospect',
  },
  {
    id: 'schedule',
    tabLabel: 'Calendar Scheduling',
    stageNum: '04',
    title: 'Automated Consultation Scheduling',
    copy: 'Qualified prospects can book directly onto the assigned advisor’s live Google or Microsoft calendar. Eliminate scheduling friction while client enthusiasm and commercial momentum are at their highest.',
    takeaway: 'Prospects choose convenient consultation times on their terms with zero manual coordination overhead.',
    statusBadge: 'Confirmed: Thursday 2:00 PM EST',
    specimenClient: 'Northline Architecture Studio',
    specimenService: '30-Min Discovery Consultation',
    fields: [
      ['Scheduled Slot', 'Thursday, Nov 12 • 2:00 PM EST'],
      ['Calendar Sync', 'Google Calendar & Outlook 365'],
      ['Meeting Link', 'Google Meet video link attached'],
      ['Invitee', 'alex@northlinestudio.com'],
      ['Buffer Time', '15 min prep window reserved'],
      ['Prep Document', 'Intake diagnostic shared with rep'],
    ],
    checklist: [
      'Two-way live availability verification across calendars',
      'Automated timezone translation and smart buffer times',
      'Meeting invitations pre-populated with diagnostic context',
    ],
    actionBanner: 'Calendar event created • Confirmation & prep email dispatched to Alex',
  },
  {
    id: 'track',
    tabLabel: 'Pipeline Tracking',
    stageNum: '05',
    title: 'Two-Way CRM Sync & Pipeline Visibility',
    copy: 'Keep conversations connected through to proposal and signed agreement. Growora synchronizes lead status, deal stages, and diagnostic notes automatically into your CRM of choice.',
    takeaway: 'Your entire team maintains a shared, transparent view of where every active conversation stands.',
    statusBadge: 'Pipeline: Qualified Discovery • $50k Value',
    specimenClient: 'Northline Architecture Studio',
    specimenService: 'Deal Record #4920 Synchronized',
    fields: [
      ['CRM Destination', 'HubSpot / Salesforce Deal Created'],
      ['Pipeline Stage', 'Qualified Discovery Booked'],
      ['Projected Value', '$50,000 Initial Scope'],
      ['Next Action', 'Lead Discovery Workshop (Nov 12)'],
      ['Lifecycle History', 'Full audit log preserved'],
      ['Conversion Velocity', '< 48 hours first touch to call'],
    ],
    checklist: [
      'Real-time sync to HubSpot, Salesforce, Pipedrive, or webhooks',
      'Single source of truth with zero duplicated records',
      'Complete diagnostic transcript permanently attached to deal',
    ],
    actionBanner: 'HubSpot pipeline synchronized • Deal assigned to Jamie Lee',
  },
];

const architecturePillars = [
  {
    icon: Target,
    title: 'Zero Context Loss',
    desc: 'Every parameter, project timeline, and customer answer travels seamlessly with the lead. When team members join a discovery call, they already have a comprehensive brief in hand.',
    features: [
      'Complete diagnostic dossier attached to every lead',
      'No repetitive questioning on initial discovery calls',
      'Full conversation history preserved in your CRM',
      'Smooth handovers between marketing, sales, and delivery',
    ],
  },
  {
    icon: Clock,
    title: 'Automated SLA Enforcement',
    desc: 'High-value inquiries demand rapid response. Growora evaluates deal urgency in real time, triggering instant notifications and automated booking links within seconds.',
    features: [
      'Sub-60-second automated triage and scoring',
      'Real-time Slack, Teams, and SMS priority notifications',
      'Automated re-assignment if assignees are out of office',
      'Eliminates lost deals caused by inbox latency',
    ],
  },
  {
    icon: Sparkles,
    title: 'Frictionless Client Experience',
    desc: 'Give prospective clients an elegant, modern intake journey. They receive instant clarity, structured questions, and direct calendar access on desktop or mobile.',
    features: [
      'Clean, branded multi-step mobile intake flow',
      'Self-serve scheduling on live advisor calendars',
      'Automated appointment prep and directions',
      'No frustrating generic "we will be in touch" delays',
    ],
  },
];

const howItWorksFaqs = [
  [
    'How much setup time is required before we can start taking live inquiries?',
    'Most teams launch within a single afternoon. You can select one of our pre-built qualification blueprints, connect your team calendar and CRM via one-click OAuth, and embed the intake widget onto your website with a single snippet.',
  ],
  [
    'Can we customize the qualification questions and scoring rules?',
    'Yes, completely. Every step, question, and scoring threshold is fully configurable in your dashboard. You can set minimum budget floors, require specific project criteria, or create custom branching paths for different service lines.',
  ],
  [
    'What happens if a prospect qualifies but doesn’t book a call immediately?',
    'Growora automatically triggers a gentle follow-up sequence with their direct booking link via email or SMS. If they still do not book, the lead is preserved in your pipeline for manual follow-up by the assigned owner.',
  ],
  [
    'Does Growora replace our existing website or work alongside it?',
    'Growora works alongside your existing website. You can embed Growora intake journeys directly onto existing landing pages, replace generic contact forms, or link to a standalone hosted enquiry page under your custom domain.',
  ],
  [
    'Can different enquiry forms have different stages or routing paths?',
    'Yes. You can build multiple distinct intake workflows with their own qualification logic. For example, high-value consulting inquiries can route directly to partner calendars, while support inquiries route to a triage queue.',
  ],
  [
    'How does the mobile experience look for our prospective clients?',
    'Growora is built mobile-first. Prospective clients experience lightning-fast, thumb-friendly touch interactions, instant photo uploads, and responsive calendar selection across iOS and Android browsers.',
  ],
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const step = walkthroughSteps[activeStep];

  return (
    <div className={s.howItWorksPage}>
      {/* --------------------------------------------------------------------
          1. Hero Section: Dark Jade Obsidian with Ambient Trajectory Glow
          -------------------------------------------------------------------- */}
      <section className={s.heroSection}>
        <div className={s.container}>
          <div className={s.heroContent}>
            <span className={s.label}>
              <span className={s.dot} aria-hidden="true" />
              INTERACTIVE STEP-BY-STEP WALKTHROUGH
            </span>
            <h1 className={s.heroTitle}>
              A first hello.
              <br />
              <em>A clear next step.</em>
            </h1>
            <p className={s.heroCopy}>
              Follow one inbound enquiry from first touch through automated diagnostic scoring,
              specialist assignment, live calendar scheduling, and pipeline progression.
            </p>
            <div className={s.heroActions}>
              <a href="#walkthrough" className={s.primaryAction}>
                Start the walkthrough
                <ArrowRight size={17} />
              </a>
              <Link href="/pricing" className={s.secondaryAction}>
                Explore pricing &amp; plans
              </Link>
            </div>
          </div>

          {/* Hero Metrics Bar */}
          <div className={s.metricsBar}>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>5 Stages</span>
              <span className={s.metricLabel}>
                From first touch
                <br />
                to closed proposal
              </span>
            </div>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>100%</span>
              <span className={s.metricLabel}>
                Diagnostic context
                <br />
                retained on handover
              </span>
            </div>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>&lt; 60s</span>
              <span className={s.metricLabel}>
                Automated triage
                <br />
                and routing speed
              </span>
            </div>
            <div className={s.metricItem}>
              <span className={s.metricNumber}>0</span>
              <span className={s.metricLabel}>
                Dropped leads or
                <br />
                scattered inbox notes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          2. The 5-Stage Interactive Journey Simulator
          -------------------------------------------------------------------- */}
      <section id="walkthrough" className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>INTERACTIVE JOURNEY</span>
            <h2 className={s.sectionTitle}>
              Follow an enquiry across <em>five connected stages.</em>
            </h2>
            <p className={s.sectionSubtitle}>
              Select each stage below to see how Growora captures context, scores commercial fit,
              and coordinates next actions automatically.
            </p>
          </div>

          {/* Stage Tabs */}
          <div className={s.stageTabs} role="tablist" aria-label="Walkthrough stages">
            {walkthroughSteps.map((st, index) => {
              const isSelected = activeStep === index;
              return (
                <button
                  key={st.id}
                  type="button"
                  role="tab"
                  id={`stage-tab-${st.id}`}
                  aria-selected={isSelected}
                  aria-controls={`stage-panel-${st.id}`}
                  className={s.stageTabBtn}
                  onClick={() => setActiveStep(index)}
                >
                  <span className={s.stageNumPill}>{st.stageNum}</span>
                  <span>{st.tabLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Walkthrough Interactive Card */}
          <div
            id={`stage-panel-${step.id}`}
            role="tabpanel"
            aria-labelledby={`stage-tab-${step.id}`}
            className={s.walkthroughCard}
          >
            {/* Left Column: Description & Controls */}
            <div className={s.walkLeft}>
              <div className={s.walkStageIndex}>
                {step.stageNum}
                <small>/ 05</small>
              </div>

              <h3>{step.title}</h3>
              <p>{step.copy}</p>

              <div className={s.takeawayBox}>
                <Check size={20} />
                <p>{step.takeaway}</p>
              </div>

              <ul className={s.stageChecklist}>
                {step.checklist.map((item) => (
                  <li key={item}>
                    <Check size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className={s.stageNavControls}>
                <button
                  type="button"
                  className={s.navPrevBtn}
                  onClick={() => setActiveStep(activeStep - 1)}
                  disabled={activeStep === 0}
                >
                  <ArrowLeft size={16} />
                  Previous stage
                </button>
                <button
                  type="button"
                  className={s.navNextBtn}
                  onClick={() => setActiveStep(activeStep === 4 ? 0 : activeStep + 1)}
                >
                  {activeStep === 4 ? 'Restart walkthrough' : 'Next stage'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Column: Live Specimen Dossier */}
            <div className={s.walkSpecimenCard}>
              <div className={s.specimenTop}>
                <div>
                  <small style={{ color: '#92b8aa', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Live Opportunity Dossier
                  </small>
                  <div className={s.specimenClientTitle}>{step.specimenClient}</div>
                  <div className={s.specimenClientSub}>{step.specimenService}</div>
                </div>
                <span className={s.specimenTag}>{step.statusBadge}</span>
              </div>

              <dl className={s.specimenGrid}>
                {step.fields.map(([label, val]) => (
                  <div key={label} className={s.specimenCell}>
                    <dt>{label}</dt>
                    <dd>{val}</dd>
                  </div>
                ))}
              </dl>

              <div className={s.specimenActionBanner}>
                <Sparkles size={16} />
                <div>
                  <strong>Action: </strong>
                  <span>{step.actionBanner}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          3. Lifecycle Architecture Pillars
          -------------------------------------------------------------------- */}
      <section className={`${s.section} ${s.sectionBordered}`}>
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>WHY IT WORKS</span>
            <h2 className={s.sectionTitle}>
              Three architectural pillars for <em>reliable conversion.</em>
            </h2>
            <p className={s.sectionSubtitle}>
              Built from the ground up to eliminate the friction points where good customer
              conversations stall or get dropped.
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
          4. Comparison Matrix: Traditional Intake vs. Growora
          -------------------------------------------------------------------- */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>THE CONTRAST</span>
            <h2 className={s.sectionTitle}>
              The difference between <em>manual chaos and orchestrated momentum.</em>
            </h2>
            <p className={s.sectionSubtitle}>
              Compare traditional enquiry handling with Growora’s automated workflow engine.
            </p>
          </div>

          <div className={s.comparisonGrid}>
            {/* Before Card */}
            <div className={s.beforeCard}>
              <span className={s.beforeBadge}>
                <X size={14} />
                Traditional Manual Intake
              </span>
              <h3>Scattered messages &amp; delayed responses</h3>
              <p>
                Inquiries arrive via generic email boxes. Team members scramble to identify who is
                available, chase leads for basic budget requirements, and lose momentum.
              </p>
              <ul className={s.beforeList}>
                <li>
                  <X size={16} />
                  <span>Leads wait 24 to 48 hours for someone to check a shared inbox</span>
                </li>
                <li>
                  <X size={16} />
                  <span>3+ emails required just to determine if budget meets service minimums</span>
                </li>
                <li>
                  <X size={16} />
                  <span>Advisors enter discovery calls with zero context on client constraints</span>
                </li>
                <li>
                  <X size={16} />
                  <span>No clear ownership means valuable prospective clients slip through cracks</span>
                </li>
                <li>
                  <X size={16} />
                  <span>Manual copy-pasting of notes into disconnected CRMs and calendars</span>
                </li>
              </ul>
            </div>

            {/* After Card */}
            <div className={s.afterCard}>
              <span className={s.afterBadge}>
                <Check size={14} />
                With Growora
              </span>
              <h3>Structured context from first touch</h3>
              <p>
                Every enquiry is systematically captured, scored, routed, and scheduled on a live
                calendar within minutes of arrival.
              </p>
              <ul className={s.afterList}>
                <li>
                  <Check size={16} />
                  <span>Comprehensive diagnostic completed upfront in under 90 seconds</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Instant automated scoring against your firm’s commercial thresholds</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Qualified prospects self-schedule on assigned advisor calendars</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Real-time notifications pushed to designated Slack channels and mobile</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Two-way CRM synchronization keeps deal pipelines and notes up to date</span>
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
                <span className={s.faqCardLabel}>WALKTHROUGH FAQ</span>
                <h2>
                  Questions about
                  <br />
                  how it works.
                </h2>
                <p className={s.bodyCopy}>
                  Get complete clarity on implementation times, workflow customization, calendar
                  sync, and lead routing.
                </p>
              </div>
            </div>

            {/* Accordion FAQ Questions List */}
            <div className={s.faqList}>
              {howItWorksFaqs.map(([question, answer], idx) => {
                const isOpen = openFaq === idx;
                return (
                  <article key={question} data-open={isOpen}>
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`hiw-faq-answer-${idx}`}
                        id={`hiw-faq-question-${idx}`}
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                      >
                        <span>{question}</span>
                        <Plus size={20} />
                      </button>
                    </h3>
                    <div
                      className={s.faqAnswer}
                      id={`hiw-faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`hiw-faq-question-${idx}`}
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
