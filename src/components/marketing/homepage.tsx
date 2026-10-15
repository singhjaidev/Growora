'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  LayoutDashboard,
  SlidersHorizontal,
  Users,
  Inbox,
} from 'lucide-react';
import { OpportunityHero } from './opportunity-hero';
import { useHomepageMotion } from './use-homepage-motion';
import { tabKeyboard } from '@/components/ui';
import s from './homepage.module.css';

const plans = [
  {
    name: 'Starter',
    price: 29,
    copy: 'A clear home for your first opportunities.',
    features: [
      '250 leads per month',
      '3 capture forms',
      'Lead scoring & pipeline',
      '1 workspace member',
    ],
  },
  {
    name: 'Growth',
    price: 79,
    copy: 'A connected process for an ambitious team.',
    features: [
      '2,000 leads per month',
      'Unlimited capture forms',
      'Custom automation flows',
      '5 workspace members',
    ],
  },
  {
    name: 'Scale',
    price: 179,
    copy: 'Bring more people and possibilities together.',
    features: [
      '10,000 leads per month',
      'Advanced routing rules',
      'Multiple team pipelines',
      '20 workspace members',
    ],
  },
];
const businesses = [
  {
    name: 'Agencies',
    title: 'Better briefs. Better first conversations.',
    copy: 'Bring project scope, budget and timing into the first conversation. Give your team the context to spot the work that fits.',
    inputs: ['Project brief', 'Budget range', 'Start date'],
    output: 'A better discovery call',
  },
  {
    name: 'Consultants',
    title: 'Get to the heart of the challenge.',
    copy: 'Understand what a potential client wants to change before you open your calendar. Make every discovery session more useful.',
    inputs: ['Business challenge', 'Engagement size', 'Decision timeline'],
    output: 'A focused consultation',
  },
  {
    name: 'Property teams',
    title: 'The right enquiry. The right local expert.',
    copy: 'Keep property preferences and buying timelines together, so the person who knows the area can pick up the conversation.',
    inputs: ['Property type', 'Location', 'Buying timeline'],
    output: 'A relevant viewing',
  },
  {
    name: 'Service businesses',
    title: 'Every request deserves a clear next step.',
    copy: 'Collect the useful details while your team is busy. Turn a quote request into a conversation that is ready to move.',
    inputs: ['Service needed', 'Project details', 'Preferred timing'],
    output: 'A well-prepared quote',
  },
];
const faqs = [
  [
    'Who is Growora for?',
    'Growora is designed for service businesses where the right conversation makes all the difference—agencies, consultants, property teams and growing service teams.',
  ],
  [
    'How does lead qualification work?',
    'Project context, budget and timing contribute to a transparent intent score. The score helps your team decide where to focus; it does not replace a personal conversation. In the enquiry above, the service, budget and timing match the example criteria. Your team can use that context to decide whether a discovery call is the right next step.',
  ],
  [
    'Can the process fit the way our team works?',
    'Capture forms, pipeline stages and routing are the building blocks of the experience. Talk with us about your intake process and the decisions your team needs to make.',
  ],
  [
    'Does Growora work with our existing tools?',
    'The integration section shows ecosystem concepts. Contact us to confirm availability and discuss the tools your workspace needs before choosing a plan.',
  ],
  [
    'How can we get started?',
    'Choose a plan to discuss or contact us about your requirements. We’ll use that conversation to define the right workspace and confirm availability. No payment is taken on this website.',
  ],
];
const pipeline = ['Qualified', 'In conversation', 'Proposal'];

function Workspace({ stage, select }: { stage: number; select: (index: number) => void }) {
  return (
    <section
      className={s.workspaceSection}
      id="platform"
      aria-labelledby="workspace-heading"
      data-workspace-scroll
    >
      <div className={s.workspaceSticky} data-workspace-sticky>
        <div className={s.sectionHeading}>
          <div>
            <span className={s.eyebrow}>THE NEXT CHAPTER / YOUR WORKSPACE</span>
            <h2 id="workspace-heading">
              A place for every
              <br />
              opportunity to move.
            </h2>
          </div>
          <p>
            The same enquiry, now part of the bigger picture. Keep the brief, the conversation and
            the next action together.
          </p>
        </div>
        <div className={s.workspace}>
          <div className={s.workspaceBar}>
            <span>
              <b>g.</b> Northline workspace <small>WORKSPACE</small>
            </span>
            <Link href="/app">
              Open workspace <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className={s.workspaceBody}>
            <aside className={s.workspaceNav} aria-label="Workspace preview">
              <span>
                <LayoutDashboard size={16} /> Overview
              </span>
              <strong>
                <Inbox size={16} /> Opportunities
              </strong>
              <span>
                <Users size={16} /> Contacts
              </span>
              <span>
                <SlidersHorizontal size={16} /> Workflows
              </span>
              <small>
                EVERY DETAIL,
                <br />
                STILL CONNECTED.
              </small>
            </aside>
            <div className={s.boardArea}>
              <div className={s.boardTitle}>
                <h3>Opportunities</h3>
                <span>
                  Example pipeline <SlidersHorizontal size={15} />
                </span>
              </div>
              <div className={s.board}>
                {pipeline.map((name, i) => (
                  <div className={s.lane} key={name} data-current={stage === i}>
                    <h4>
                      <i />
                      {name}
                      <span>{stage === i ? '01' : '00'}</span>
                    </h4>
                    <div className={s.lanePlaceholder}>
                      {
                        [
                          'Project fit confirmed',
                          'Start the conversation',
                          'Define the next chapter',
                        ][i]
                      }
                    </div>
                  </div>
                ))}
                <article className={s.movingOpportunity}>
                  <div>
                    <span>G / 001</span>
                    <span className={s.badge}>Priority</span>
                  </div>
                  <h4>Northline Studio</h4>
                  <p>Website redesign</p>
                  <dl>
                    <div>
                      <dt>Budget</dt>
                      <dd>£5,000–£10,000</dd>
                    </div>
                    <div>
                      <dt>Timeline</dt>
                      <dd>Within 30 days</dd>
                    </div>
                  </dl>
                  <div className={s.cardOwner}>
                    <span>JL</span>
                    <strong>Jamie Lee</strong>
                    <Check size={14} />
                  </div>
                </article>
              </div>
              <div className={s.workspaceStatus} aria-live="polite">
                <Check size={15} />
                <span>
                  {
                    [
                      'Brief and fit confirmed. Ready for discovery.',
                      'Next action: arrange a discovery conversation.',
                      'Next action: prepare the scope and proposal.',
                    ][stage]
                  }
                </span>
              </div>
            </div>
          </div>
          <div
            className={s.workspaceControls}
            role="group"
            aria-label="Move the example opportunity"
          >
            {pipeline.map((name, index) => (
              <button key={name} aria-pressed={stage === index} onClick={() => select(index)}>
                <span>0{index + 1}</span>
                {name}
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </div>
        <div className={s.workspaceFoot}>
          <span>This example does not change your workspace.</span>
          <Link href="/app/leads">
            Explore lead management <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
export function Homepage() {
  const root = useRef<HTMLDivElement>(null);
  const motion = useHomepageMotion(root);
  const [business, setBusiness] = useState(0);
  const [annual, setAnnual] = useState(false);
  const [faq, setFaq] = useState<number | null>(null);
  const industry = businesses[business];
  return (
    <div
      ref={root}
      className={s.home}
      data-motion={motion.easing && !motion.reduced ? 'eased' : 'instant'}
      data-workspace-stage={motion.workspaceStage}
    >
      <OpportunityHero stage={motion.stage} select={motion.selectStory} />
      <div className={s.motionBar}>
        <span>SCROLL TO FOLLOW THE ENQUIRY</span>
        <button
          disabled={motion.reduced}
          aria-pressed={motion.easing && !motion.reduced}
          onClick={() => motion.setEasing(!motion.easing)}
        >
          {motion.reduced
            ? 'Reduced motion enabled'
            : `Motion easing ${motion.easing ? 'on' : 'off'}`}
          <span aria-hidden="true" className={s.toggle} />
        </button>
      </div>
      <Workspace stage={motion.workspaceStage} select={motion.selectWorkspace} />
      <section className={s.businessSection} id="solutions">
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <div>
              <span className={s.eyebrow}>BUILT AROUND YOUR BUSINESS</span>
              <h2>
                Different work.
                <br />
                The same need for clarity.
              </h2>
            </div>
            <p>
              When relationships drive your business, the first conversation matters. Make it a
              useful one.
            </p>
          </div>
          <div
            className={s.businessTabs}
            role="tablist"
            aria-label="Business type"
            onKeyDown={tabKeyboard}
          >
            {businesses.map((item, index) => (
              <button
                key={item.name}
                role="tab"
                id={`business-${index}`}
                aria-selected={business === index}
                aria-controls="business-panel"
                tabIndex={business === index ? 0 : -1}
                onClick={() => setBusiness(index)}
              >
                {item.name}
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          <div
            className={s.businessPanel}
            role="tabpanel"
            id="business-panel"
            aria-labelledby={`business-${business}`}
          >
            <div>
              <span className={s.eyebrow}>GROWORA FOR {industry.name.toUpperCase()}</span>
              <h3>{industry.title}</h3>
              <p>{industry.copy}</p>
              <Link href="/contact" className={s.textLink}>
                Talk about your business <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className={s.fitDiagram}>
              <span>THE CONTEXT YOU NEED</span>
              {industry.inputs.map((input, index) => (
                <div key={input}>
                  <small>0{index + 1}</small>
                  {input}
                  <Check size={16} />
                </div>
              ))}
              <p>
                <ArrowRight size={20} />
                {industry.output}
              </p>
            </div>
          </div>
          <div className={s.integrations} id="connections">
            <div>
              <span className={s.eyebrow}>PART OF YOUR PROCESS</span>
              <h3>Your tools. Connected thinking.</h3>
              <p>Explore the ecosystem. Confirm availability with your workspace.</p>
            </div>
            <div className={s.integrationLinks}>
              {['HubSpot', 'Slack', 'Google Calendar', 'Mailchimp', 'Zapier', 'Email'].map(
                (name) => (
                  <Link key={name} href="/integrations">
                    {name}
                    <ArrowUpRight size={14} />
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </section>
      <section className={s.pricingSection} id="pricing">
        <div className={s.container}>
          <div className={s.sectionHeading}>
            <div>
              <span className={s.eyebrow}>ROOM FOR WHAT’S NEXT</span>
              <h2>
                A clear starting point.
                <br />
                Space to grow.
              </h2>
            </div>
            <div>
              <p>Choose the plan to discuss with your team.</p>
              <div className={s.billingSwitch} role="group" aria-label="Billing preference">
                <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
                  Monthly
                </button>
                <button aria-pressed={annual} onClick={() => setAnnual(true)}>
                  Yearly <small>Save 20%</small>
                </button>
              </div>
            </div>
          </div>
          <div className={s.planGrid}>
            {plans.map((plan, index) => (
              <article key={plan.name} className={`${s.plan} ${index === 1 ? s.recommended : ''}`}>
                <div className={s.planLabel}>
                  <span>
                    {index === 1
                      ? 'Recommended'
                      : index === 0
                        ? 'MAKE A STRONG START'
                        : 'THINK A LITTLE BIGGER'}
                  </span>
                </div>
                <h3>{plan.name}</h3>
                <p>{plan.copy}</p>
                <div className={s.price}>
                  <strong>£{Math.round(plan.price * (annual ? 0.8 : 1))}</strong>
                  <span>/ month</span>
                </div>
                <small className={s.billingNote}>
                  {annual
                    ? `£${Math.round(plan.price * 0.8) * 12} billed yearly`
                    : 'Monthly billing'}
                </small>
                <Link
                  className={index === 1 ? s.primary : s.planCta}
                  href={`/contact?plan=${plan.name.toLowerCase()}`}
                >
                  Discuss {plan.name}
                  <ArrowUpRight size={17} />
                </Link>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className={s.pricingNote}>
            Discuss plan availability and requirements with us. No payment is taken on this website.
          </p>
        </div>
      </section>
      <section className={s.faqSection}>
        <div className={`${s.container} ${s.faqLayout}`}>
          <div>
            <span className={s.eyebrow}>A FEW GOOD QUESTIONS</span>
            <h2>
              Clarity,
              <br />
              from the start.
            </h2>
            <Link href="/contact" className={s.textLink}>
              Ask us something <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className={s.faqList}>
            {faqs.map(([question, answer], index) => (
              <article key={question} className={s.faqItem} data-open={faq === index}>
                <h3>
                  <button
                    id={`faq-question-${index}`}
                    aria-expanded={faq === index}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setFaq(faq === index ? null : index)}
                  >
                    <span>{question}</span>
                    <span className={s.plus} aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={`faq-answer-${index}`}
                  className={s.faqAnswer}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  aria-hidden={faq !== index}
                  inert={faq !== index}
                >
                  <div>
                    <p>{answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className={s.closing}>
        <div className={s.container}>
          <div>
            <span className={s.eyebrow}>ONE ENQUIRY CAN CHANGE WHAT’S NEXT.</span>
            <h2>
              Give your next
              <br />
              opportunity a beginning.
            </h2>
            <p>Bring the context, the conversation and the next step together.</p>
            <Link href="/contact" className={s.primary}>
              Let’s talk about your growth <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className={s.closingFile} aria-hidden="true">
            <span>
              G / 001 <Check size={18} />
            </span>
            <strong>
              Ready for
              <br />
              what’s next.
            </strong>
            <div>
              Context captured.
              <br />
              Priority understood.
              <br />
              Next step connected.
            </div>
            <span>
              ONE COMPLETE OPPORTUNITY <ArrowUpRight size={20} />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
