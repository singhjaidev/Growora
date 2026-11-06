'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Plus,
  ShieldCheck,
  Zap,
  Users,
  GitBranch,
  BarChart3,
  Calendar,
  Sparkles,
  Inbox,
  Clock,
  CircleCheck,
  ArrowUpRight,
  FileText,
} from 'lucide-react';
import s from './product-page.module.css';

interface Pillar {
  id: string;
  name: string;
  badge: string;
  title: string;
  desc: string;
  bullets: string[];
  statNum: string;
  statLabel: string;
  specimen: {
    tag: string;
    title: string;
    rows: { key: string; val: string; highlight?: boolean }[];
  };
}

const pillars: Pillar[] = [
  {
    id: 'capture',
    name: '01 / Capture',
    badge: 'Context-Preserved Intake',
    title: 'Every enquiry arrives with its full story intact.',
    desc: 'Embed responsive intake forms on your site or connect external sources via webhook. Original referral channels, project briefs, budget ranges, and client intent stay unified in one shared lead record.',
    bullets: [
      'Automatic referrer attribution and campaign tracking',
      'Structured project brief intake with required scope fields',
      'Zero manual copy-pasting between inboxes and spreadsheets',
    ],
    statNum: '100%',
    statLabel: 'Context preserved on every incoming lead',
    specimen: {
      tag: 'Lead Record #2041',
      title: 'Northline Studio',
      rows: [
        { key: 'Source', val: 'Direct Website Enquiry · Organic' },
        { key: 'Project Scope', val: 'Full Brand Identity & Next.js Website' },
        { key: 'Stated Budget', val: '£7,500 – £10,000', highlight: true },
        { key: 'Target Timeline', val: 'Within 30–45 days' },
      ],
    },
  },
  {
    id: 'qualify',
    name: '02 / Qualify',
    badge: 'Automated Fit Scoring',
    title: 'Surface high-intent opportunities the second they arrive.',
    desc: 'Configurable qualification rules evaluate budget fit, project urgency, and technical alignment instantaneously. Promising conversations get flagged for immediate executive response.',
    bullets: [
      'Weighted 0–100 opportunity score based on your criteria',
      'Automatic flagging of budget mismatches or out-of-scope work',
      'Instant notifications to team leads when high-value leads submit',
    ],
    statNum: '2.4x',
    statLabel: 'Faster qualification and response turnaround',
    specimen: {
      tag: 'Qualification Engine',
      title: 'Fit Analysis: High Priority',
      rows: [
        { key: 'Budget Alignment', val: 'Within Tier A Range (+40 pts)', highlight: true },
        { key: 'Decision Authority', val: 'Founder / Managing Director (+30 pts)' },
        { key: 'Timeline Urgency', val: 'Immediate kick-off (+24 pts)' },
        { key: 'Composite Score', val: '94 / 100 · High Intent Route', highlight: true },
      ],
    },
  },
  {
    id: 'pipeline',
    name: '03 / Assign & Pipeline',
    badge: 'Ownership & Visual Board',
    title: 'Every conversation has a single, accountable owner.',
    desc: 'Route qualified enquiries directly to the right partner or specialist based on service vertical and workload. A visual stage board keeps team members aligned on what happens next.',
    bullets: [
      'Round-robin and skill-based ownership assignment',
      'Visual pipeline stages mapped to your custom delivery flow',
      'SLA breach warnings when an enquiry sits without contact',
    ],
    statNum: '<12 min',
    statLabel: 'Median time from enquiry to assigned owner',
    specimen: {
      tag: 'Workspace Pipeline',
      title: 'Owner: Jamie Lee',
      rows: [
        { key: 'Assigned Specialist', val: 'Jamie Lee · Senior Partner' },
        { key: 'Current Stage', val: 'Discovery Conversation Scheduled' },
        { key: 'SLA Status', val: 'First contact completed in 8 mins', highlight: true },
        { key: 'Next Deliverable', val: 'Discovery call brief attached' },
      ],
    },
  },
  {
    id: 'automate',
    name: '04 / Automate',
    badge: 'Next Step Acceleration',
    title: 'Prepared with context. Reviewed by your team.',
    desc: 'Eliminate friction between qualification and the next conversation. Growora prepares personalized next-step follow-ups referencing the client’s actual brief, ready for one-click approval.',
    bullets: [
      'Context-aware follow-up templates that sound bespoke, not robotic',
      'Two-way calendar sync directly to team availability',
      'Automated confirmation notifications sent to clients',
    ],
    statNum: '+38%',
    statLabel: 'Increase in discovery calls booked',
    specimen: {
      tag: 'Action Accelerator',
      title: 'Follow-Up Prepared',
      rows: [
        { key: 'Draft Status', val: 'Ready for partner review', highlight: true },
        { key: 'Calendar Booking', val: 'Tomorrow · 10:30 AM (Confirmed)' },
        { key: 'Context Carryover', val: 'Original brief & budget attached' },
        { key: 'Client Link', val: 'Secure personal portal active' },
      ],
    },
  },
];

const sampleEnquiries = [
  {
    name: 'Northline Studio',
    scope: 'Brand & Next.js Website',
    budget: '£7,500',
    timeline: '30 days',
    score: 94,
    tier: 'High Priority',
    owner: 'Jamie Lee',
    action: 'Discovery Call Confirmed',
  },
  {
    name: 'Apex Digital Co',
    scope: 'Platform Overhaul & API',
    budget: '£15,000',
    timeline: '45 days',
    score: 98,
    tier: 'Executive Priority',
    owner: 'Sam Chen',
    action: 'Proposal Workshop Slotted',
  },
  {
    name: 'Horizon Media',
    scope: 'Exploratory Consulting',
    budget: '£1,800',
    timeline: 'Flexible',
    score: 68,
    tier: 'Nurture Stream',
    owner: 'Auto-Sequence',
    action: 'Welcome Pack Dispatched',
  },
];

const productFaqs = [
  [
    'How is Growora different from a traditional CRM?',
    'Traditional CRMs are designed for enterprise sales reps doing aggressive outbound cold outreach. Growora is designed specifically for service agencies, studios, and consultants who receive incoming enquiries and need a fast, context-rich way to qualify, assign, and schedule the next conversation.',
  ],
  [
    'Can I embed Growora forms into my existing website?',
    'Yes. Growora provides lightweight, responsive web components and embeddable forms that integrate seamlessly into Webflow, WordPress, Next.js, Framer, or static HTML in under two minutes.',
  ],
  [
    'How does automated qualification scoring work?',
    'You define your ideal client criteria—such as minimum project budget, timeline urgency, company size, and service type. When an enquiry arrives, Growora’s scoring engine evaluates the inputs and outputs a composite score (0–100), automatically highlighting top opportunities.',
  ],
  [
    'Can our team collaborate on the same enquiry?',
    'Yes. Multiple workspace members can view the enquiry history, add internal context notes, reassign ownership, and review prepared follow-up communications without stepping on each other.',
  ],
  [
    'Does Growora integrate with our existing calendars and email?',
    'Growora connects with Google Calendar, Outlook, and major email providers, allowing you to generate meeting booking links and calendar invites that automatically attach the client’s original project brief.',
  ],
  [
    'What happens when a lead is marked as won?',
    'Once a discovery conversation leads to an agreement, you can mark the opportunity as Won. All original context, intake documents, and conversation history can be exported or pushed to your project delivery software.',
  ],
];

export function ProductPage() {
  const [activePillar, setActivePillar] = useState('capture');
  const [selectedEnquiry, setSelectedEnquiry] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const pillar = pillars.find((p) => p.id === activePillar) ?? pillars[0];
  const sim = sampleEnquiries[selectedEnquiry];

  return (
    <div className={s.productPage}>
      {/* ------------------------------------------------------------------
          Hero Section — Cinematic Dark Emerald Atmosphere
          ------------------------------------------------------------------ */}
      <section className={s.heroSection}>
        <div className={s.container}>
          <div className={s.heroContent}>
            <span className={s.label}>
              <span className={s.dot} aria-hidden="true" />
              THE GROWORA PLATFORM
            </span>
            <h1 className={s.heroTitle}>
              One connected pipeline.
              <br />
              <em>From first hello to next conversation.</em>
            </h1>
            <p className={s.heroCopy}>
              Growora replaces messy inboxes, disjointed forms, and lost context with a single,
              intelligent workspace. Capture enquiries, evaluate fit automatically, and keep every
              promising opportunity moving forward.
            </p>
            <div className={s.heroActions}>
              <a href="#features" className={s.primaryAction}>
                Explore the platform <ArrowRight size={16} />
              </a>
              <Link href="/pricing" className={s.secondaryAction}>
                View plans & pricing
              </Link>
            </div>
          </div>

          {/* Realistic Pipeline Preview Board */}
          <div className={s.heroBoardPreview} aria-label="Growora workspace snapshot">
            <div className={s.boardHeader}>
              <div className={s.boardTitleGroup}>
                <span className={s.boardDot} />
                <span className={s.boardTitle}>CONNECTED PIPELINE VIEW</span>
              </div>
              <span className={s.boardStatusBadge}>
                <CircleCheck size={13} /> All systems operational
              </span>
            </div>

            <div className={s.columnsGrid}>
              <div className={s.stageCol}>
                <div className={s.stageColHeader}>
                  <span>01 / Capture</span>
                  <span className={s.stageColCount}>3</span>
                </div>
                <div className={s.stageDealCard}>
                  <strong className={s.dealName}>Northline Studio</strong>
                  <span className={s.dealCompany}>Website Enquiry · Inbound</span>
                  <div className={s.dealFooter}>
                    <span>£7,500</span>
                    <span className={s.dealAvatar}>JL</span>
                  </div>
                </div>
              </div>

              <div className={s.stageCol}>
                <div className={s.stageColHeader}>
                  <span>02 / Qualify</span>
                  <span className={s.stageColCount}>2</span>
                </div>
                <div className={`${s.stageDealCard} ${s.dealActive}`}>
                  <strong className={s.dealName}>Apex Digital Co</strong>
                  <span className={s.dealCompany}>Score: 98 / 100 · Tier A</span>
                  <div className={s.dealFooter}>
                    <span>£15,000</span>
                    <span className={s.dealAvatar}>SC</span>
                  </div>
                </div>
              </div>

              <div className={s.stageCol}>
                <div className={s.stageColHeader}>
                  <span>03 / Connect</span>
                  <span className={s.stageColCount}>4</span>
                </div>
                <div className={s.stageDealCard}>
                  <strong className={s.dealName}>Vanguard Studio</strong>
                  <span className={s.dealCompany}>Call Booked: Tomorrow</span>
                  <div className={s.dealFooter}>
                    <span>£9,200</span>
                    <span className={s.dealAvatar}>JL</span>
                  </div>
                </div>
              </div>

              <div className={s.stageCol}>
                <div className={s.stageColHeader}>
                  <span>04 / Decision</span>
                  <span className={s.stageColCount}>2</span>
                </div>
                <div className={s.stageDealCard}>
                  <strong className={s.dealName}>Freya Design Ltd</strong>
                  <span className={s.dealCompany}>Proposal Reviewing</span>
                  <div className={s.dealFooter}>
                    <span>£6,000</span>
                    <span className={s.dealAvatar}>MK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          Interactive Feature Explorer (The 4 Pillars)
          ------------------------------------------------------------------ */}
      <section className={`${s.section} ${s.sectionBordered}`} id="features">
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>A CLEAR PROCESS</span>
            <h2 className={s.sectionTitle}>
              Four steps.
              <br />
              <em>One unbroken chain of context.</em>
            </h2>
            <p className={s.sectionSubtitle}>
              Explore how Growora connects every phase of enquiry management into a cohesive,
              repeatable revenue engine.
            </p>
          </div>

          <div className={s.pillarTabs} role="tablist" aria-label="Product capabilities">
            {pillars.map((item) => (
              <button
                key={item.id}
                role="tab"
                id={`pillar-tab-${item.id}`}
                aria-selected={activePillar === item.id}
                aria-controls={`pillar-panel-${item.id}`}
                className={s.pillarTabBtn}
                onClick={() => setActivePillar(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div
            className={s.pillarCard}
            id={`pillar-panel-${pillar.id}`}
            role="tabpanel"
            aria-labelledby={`pillar-tab-${pillar.id}`}
          >
            <div className={s.pillarInfo}>
              <h3>{pillar.title}</h3>
              <p>{pillar.desc}</p>
              <ul className={s.pillarList}>
                {pillar.bullets.map((b) => (
                  <li key={b}>
                    <Check size={16} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className={s.pillarStat}>
                <span className={s.pillarStatNumber}>{pillar.statNum}</span>
                <span className={s.pillarStatLabel}>{pillar.statLabel}</span>
              </div>
            </div>

            <div className={s.pillarSpecimen}>
              <div className={s.specimenHeader}>
                <span className={s.specimenTag}>
                  <Sparkles size={13} /> {pillar.specimen.tag}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                  {pillar.specimen.title}
                </span>
              </div>
              <div className={s.specimenBody}>
                {pillar.specimen.rows.map((row) => (
                  <div key={row.key} className={s.specimenRow}>
                    <span className={s.specimenKey}>{row.key}</span>
                    <span
                      className={
                        row.highlight ? s.specimenValHighlight : s.specimenVal
                      }
                    >
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          Interactive Lead Simulator Section
          ------------------------------------------------------------------ */}
      <section className={s.section}>
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>LIVE SIMULATOR</span>
            <h2 className={s.sectionTitle}>
              Test the qualification engine.
            </h2>
            <p className={s.sectionSubtitle}>
              Select a sample enquiry below to watch how Growora calculates fit scores and routes
              opportunities in real time.
            </p>
          </div>

          <div className={s.simulatorCard}>
            <div className={s.simIntro}>
              <h3>Choose a live enquiry:</h3>
              <p>Click any client enquiry to run it through Growora’s automated triage rules:</p>
              <div className={s.simEnquiryButtons} role="group" aria-label="Sample enquiries">
                {sampleEnquiries.map((enq, idx) => (
                  <button
                    key={enq.name}
                    aria-pressed={selectedEnquiry === idx}
                    className={s.simPickBtn}
                    onClick={() => setSelectedEnquiry(idx)}
                  >
                    <div>
                      <strong>{enq.name}</strong>
                      <span>{enq.scope}</span>
                    </div>
                    <strong>{enq.budget}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className={s.simOutputStage}>
              <div className={s.simScoreHeader}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4ee2b6', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    FIT EVALUATION COMPLETE
                  </span>
                  <h4 style={{ margin: '4px 0 0', fontSize: 18, color: '#ffffff' }}>
                    {sim.name} · {sim.tier}
                  </h4>
                </div>
                <div className={s.simScoreRing}>{sim.score}</div>
              </div>

              <div className={s.simContextGrid}>
                <div className={s.simContextBox}>
                  <small>BUDGET VERIFIED</small>
                  <strong>{sim.budget}</strong>
                </div>
                <div className={s.simContextBox}>
                  <small>TIMELINE DEMAND</small>
                  <strong>{sim.timeline}</strong>
                </div>
              </div>

              <div className={s.simRoutingCard}>
                <div className={s.simRoutingInfo}>
                  <strong>Assigned Owner: {sim.owner}</strong>
                  <span>Next Action: {sim.action}</span>
                </div>
                <Check size={18} style={{ color: '#4ee2b6' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          Lifecycle Timeline: How an Enquiry Travels
          ------------------------------------------------------------------ */}
      <section className={`${s.section} ${s.sectionBordered}`} style={{ background: '#ffffff' }}>
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <span className={s.label}>END-TO-END TIMELINE</span>
            <h2 className={s.sectionTitle}>
              From first submission to signed deal.
            </h2>
            <p className={s.sectionSubtitle}>
              Experience how Growora creates momentum at each critical touchpoint in your sales cycle.
            </p>
          </div>

          <div className={s.timelineGrid}>
            <div className={s.timelineCard}>
              <span className={s.timelineStepNum}>01</span>
              <h4>Minute 0: Intake & Context</h4>
              <p>
                The prospect submits your embedded form. Growora extracts the scope, records their
                referrer, and builds an immutable lead dossier before the visitor even closes their tab.
              </p>
              <span className={s.timelineMeta}>
                <Clock size={13} /> Instant Context Capture
              </span>
            </div>

            <div className={s.timelineCard}>
              <span className={s.timelineStepNum}>02</span>
              <h4>Minute 5: Scored & Assigned</h4>
              <p>
                Intent rules grade the submission. The right partner receives a notification with a
                suggested next move and an auto-drafted reply referencing the client’s project details.
              </p>
              <span className={s.timelineMeta}>
                <Zap size={13} /> Zero Manual Hand-offs
              </span>
            </div>

            <div className={s.timelineCard}>
              <span className={s.timelineStepNum}>03</span>
              <h4>Hour 24: Connected & Moving</h4>
              <p>
                The discovery conversation is confirmed on the calendar. Both your specialist and the
                client have access to the shared brief, eliminating duplicate questioning and lost context.
              </p>
              <span className={s.timelineMeta}>
                <CircleCheck size={13} /> 100% Context Carried Forward
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          FAQ Section — Exact Website Theme
          ------------------------------------------------------------------ */}
      <section className={s.faqSection} id="product-faq" aria-label="Frequently asked questions">
        <div className={`${s.container} ${s.faqLayout}`}>
          <div className={s.faqStickyCol}>
            <div className={s.faqHeadingGreenCard}>
              <span className={s.faqCardLabel}>PRODUCT & PLATFORM FAQ</span>
              <h2>
                A few things
                <br />
                worth knowing.
              </h2>
              <p className={s.bodyCopy}>
                Get complete clarity on how Growora integrates with your existing workflow, manages
                lead context, and accelerates conversations.
              </p>
            </div>
          </div>

          <div className={s.faqList}>
            {productFaqs.map(([question, answer], idx) => {
              const isOpen = openFaq === idx;
              return (
                <article key={question} data-open={isOpen}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`product-faq-answer-${idx}`}
                      id={`product-faq-question-${idx}`}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                    >
                      <span>{question}</span>
                      <Plus size={20} />
                    </button>
                  </h3>
                  <div
                    className={s.faqAnswer}
                    id={`product-faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`product-faq-question-${idx}`}
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
      </section>
    </div>
  );
}
