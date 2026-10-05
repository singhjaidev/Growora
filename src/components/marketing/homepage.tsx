'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  BriefcaseBusiness,
  Building2,
  Compass,
  Wrench,
  GitBranch,
  Mail,
  MoveUpRight,
  Plus,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { tabKeyboard } from '@/components/ui';
import styles from './homepage.module.css';

const examples = [
  {
    label: 'Ready to start',
    company: 'Northline Studio',
    initials: 'NS',
    project: 'Website redesign',
    budget: '£5,000–£10,000',
    timeline: 'Within 30 days',
    score: 91,
    route: 'Priority sales',
    action: 'Arrange a discovery call',
    owner: 'Jamie Lee',
    color: '#10263f',
  },
  {
    label: 'Finding the fit',
    company: 'Oak & Beam',
    initials: 'OB',
    project: 'Marketing strategy',
    budget: '£2,000–£5,000',
    timeline: '1–3 months',
    score: 69,
    route: 'Discovery',
    action: 'Explore the project scope',
    owner: 'Your team',
    color: '#10263f',
  },
  {
    label: 'Early interest',
    company: 'Forma Consulting',
    initials: 'FC',
    project: 'Lead generation',
    budget: 'Under £2,000',
    timeline: 'Just exploring',
    score: 47,
    route: 'Nurture',
    action: 'Share a useful project guide',
    owner: 'Your team',
    color: '#10263f',
  },
];
const businesses = [
  {
    name: 'Agencies',
    line: 'Less chasing briefs. More building great work.',
    copy: 'Bring project scope, budget and timing into the first conversation. Give your team the context to spot the work that fits.',
    inputs: ['Project brief', 'Budget range', 'Start date'],
    output: 'A better discovery call',
    tag: 'NEW PROJECT ENQUIRY',
  },
  {
    name: 'Consultants',
    line: 'Start with the challenge. Get to the right conversation.',
    copy: 'Understand what a potential client wants to change before you open your calendar. Make every discovery session more useful.',
    inputs: ['Business challenge', 'Engagement size', 'Decision timeline'],
    output: 'A focused consultation',
    tag: 'CONSULTATION REQUEST',
  },
  {
    name: 'Property teams',
    line: 'The right enquiry. The right local expert.',
    copy: 'Keep property preferences and buying timelines together, so the person who knows the area can pick up the conversation.',
    inputs: ['Property type', 'Location', 'Buying timeline'],
    output: 'A relevant viewing',
    tag: 'PROPERTY ENQUIRY',
  },
  {
    name: 'Service businesses',
    line: 'You do the work. Give enquiries a clear next step.',
    copy: 'Collect the useful details while your team is busy. Turn a quote request into a conversation that is ready to move.',
    inputs: ['Service needed', 'Project details', 'Preferred timing'],
    output: 'A well-prepared quote',
    tag: 'SERVICE REQUEST',
  },
];

function Action({
  href,
  children,
  light = false,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <Link className={`${styles.action} ${light ? styles.lightAction : ''}`} href={href}>
      {children}
      <ArrowUpRight size={20} />
    </Link>
  );
}

export function HomepageSections() {
  const [example, setExample] = useState(0);
  const [business, setBusiness] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [annual, setAnnual] = useState(false);
  const [pipeline, setPipeline] = useState(1);
  const [flow, setFlow] = useState<'priority' | 'nurture'>('priority');
  const sections = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = sections.current;
    if (!root) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          if (reduced.matches) return;
          const animation = entry.target.animate(
            [
              { opacity: 0, transform: 'translateY(24px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)' },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -35px 0px' },
    );
    root
      .querySelectorAll('section > div, section > h2, section > p, section > span, [data-reveal]')
      .forEach((element) => {
        if (element.getBoundingClientRect().top > innerHeight) observer.observe(element);
      });
    const stop = () => {
      if (reduced.matches) animations.forEach((animation) => animation.cancel());
    };
    reduced.addEventListener('change', stop);
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      reduced.removeEventListener('change', stop);
    };
  }, []);
  const lead = examples[example];
  const industry = businesses[business];
  return (
    <div ref={sections} className={styles.sections}>
      <div className={styles.businessStrip}>
        <span>Made for businesses built on relationships.</span>
        <div>
          <span>Agencies</span>
          <i />
          <span>Consultants</span>
          <i />
          <span>Property teams</span>
          <i />
          <span>Service businesses</span>
        </div>
      </div>

      <section className={styles.manifesto} id="platform">
        <div className={styles.sectionLabel}>
          <span>01 / THE OPPORTUNITY</span>
          <ArrowUpRight size={25} />
        </div>
        <div className={styles.manifestoTitle}>
          <h2>
            A new enquiry is
            <br />a <span>big possibility.</span>
          </h2>
          <p>
            Don’t let it get lost between your website, your inbox and your next meeting. Give every
            promising conversation a place to begin.
          </p>
        </div>
        <div className={styles.valueTriptych}>
          <article>
            <span className={styles.featureNumber}>01</span>
            <div className={styles.contextArt} aria-hidden="true">
              <div>
                <Mail size={22} />
                <span>A new enquiry</span>
                <Plus size={18} />
              </div>
              <div>
                <span>Project</span>
                <strong>Website redesign</strong>
              </div>
              <div>
                <span>Timing</span>
                <strong>Ready this month</strong>
              </div>
              <span className={styles.artSeal}>
                <Check size={15} /> Context, captured.
              </span>
            </div>
            <h3>
              Know more from
              <br />
              the first hello.
            </h3>
            <p>The right questions turn a contact form into the start of a useful conversation.</p>
          </article>
          <article>
            <span className={styles.featureNumber}>02</span>
            <div className={styles.signalArt} aria-hidden="true">
              <div className={styles.signalRing}>
                <span>
                  91<small>INTENT SCORE</small>
                </span>
              </div>
              <span className={styles.signalNote}>
                <Target size={16} /> The right fit, in focus.
              </span>
            </div>
            <h3>
              See the signal.
              <br />
              Find your fit.
            </h3>
            <p>
              Bring budget, timing and intent together. Give the best-fit opportunities your
              attention.
            </p>
          </article>
          <article>
            <span className={styles.featureNumber}>03</span>
            <div className={styles.ownerArt} aria-hidden="true">
              <div className={styles.ownerAvatar}>JL</div>
              <div className={styles.ownerLine} />
              <div>
                <Check size={18} />
                <span>Jamie has the next step.</span>
              </div>
              <span className={styles.ownerTask}>
                <Clock3 size={16} /> Discovery conversation
              </span>
            </div>
            <h3>
              A clear owner.
              <br />A confident next move.
            </h3>
            <p>
              Keep the context with the lead, so your team can pick up exactly where interest began.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.captureSection} id="capture">
        <div className={styles.captureCopy}>
          <span className={styles.eyebrow}>02 / CAPTURE THE CONTEXT</span>
          <h2>
            Small details.
            <br />
            <em>Better conversations.</em>
          </h2>
          <p>
            Go beyond a name and an email address. Understand the project, recognise the intent, and
            make the next conversation count.
          </p>
          <span className={styles.selectionHint}>SELECT AN ENQUIRY TO EXPLORE</span>
          <div
            className={styles.exampleTabs}
            role="tablist"
            aria-label="Enquiry examples"
            onKeyDown={tabKeyboard}
          >
            {examples.map((item, i) => (
              <button
                key={item.label}
                role="tab"
                id={`enquiry-${i}`}
                aria-selected={example === i}
                aria-controls="enquiry-preview"
                tabIndex={example === i ? 0 : -1}
                onClick={() => setExample(i)}
              >
                <span className={styles.optionCopy}>
                  <strong>{item.label}</strong>
                  <small>
                    {
                      [
                        'A clear brief. Ready for a conversation.',
                        'Explore the scope and find the right fit.',
                        'An early idea with room to grow.',
                      ][i]
                    }
                  </small>
                </span>
                <span className={styles.optionIndicator} aria-hidden="true" />
              </button>
            ))}
          </div>
          <Link className={styles.textLink} href="/product">
            Meet your opportunity workspace <ArrowUpRight size={18} />
          </Link>
        </div>
        <div
          key={`enquiry-${example}`}
          className={`${styles.captureScene} ${styles.swapMotion}`}
          id="enquiry-preview"
          role="tabpanel"
          aria-labelledby={`enquiry-${example}`}
          style={{ '--example-color': lead.color } as React.CSSProperties}
        >
          <div className={styles.sceneGrid} />
          <div className={styles.intakeCard}>
            <div className={styles.previewTop}>
              <span>
                <i /> WEBSITE ENQUIRY
              </span>
              <span>Product preview</span>
            </div>
            <div className={styles.companyIdentity}>
              <span>{lead.initials}</span>
              <div>
                <h3>{lead.company}</h3>
                <p>A new project. A fresh possibility.</p>
              </div>
            </div>
            <dl>
              {[
                ['Project', lead.project],
                ['Budget', lead.budget],
                ['Timeline', lead.timeline],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className={styles.captureReceipt}>
              <Check size={18} />
              <span>Everything you need to start well.</span>
            </div>
          </div>
          <div className={styles.qualificationCard}>
            <div>
              <span>INTENT SCORE</span>
              <strong>
                {lead.score}
                <small>/100</small>
              </strong>
            </div>
            <div>
              <span>{lead.route}</span>
              <strong>{lead.action}</strong>
              <small>Next owner · {lead.owner}</small>
            </div>
            <ArrowUpRight size={25} />
          </div>
        </div>
      </section>

      <section className={styles.flowSection} id="automation">
        <div className={styles.flowHeading}>
          <div>
            <span className={styles.eyebrow}>03 / KEEP GOOD THINGS MOVING</span>
            <h2>
              Your best process.
              <br />
              <span>Without the busywork.</span>
            </h2>
          </div>
          <p>
            A clear condition. The right owner. A thoughtful follow-up. Build a process your whole
            team can understand.
          </p>
        </div>
        <div className={styles.flowBoard}>
          <div className={styles.flowToolbar}>
            <span>
              <GitBranch size={18} /> A PATH FOR EVERY ENQUIRY
            </span>
            <div role="group" aria-label="Explore workflow routes">
              <button aria-pressed={flow === 'priority'} onClick={() => setFlow('priority')}>
                Ready to talk
              </button>
              <button aria-pressed={flow === 'nurture'} onClick={() => setFlow('nurture')}>
                Still exploring
              </button>
            </div>
          </div>
          <div key={flow} className={`${styles.flowPath} ${styles.swapMotion}`}>
            <div className={styles.flowStep}>
              <span className={styles.flowNumber} aria-hidden="true">
                01
              </span>
              <small>ARRIVAL</small>
              <h3>A new enquiry</h3>
              <p>
                Capture the project
                <br />
                behind the contact.
              </p>
            </div>
            <ArrowRight className={styles.pathArrow} />
            <div className={`${styles.flowStep} ${styles.decisionStep}`}>
              <span className={styles.flowNumber} aria-hidden="true">
                02
              </span>
              <small>DECISION</small>
              <h3>Find the right fit</h3>
              <p>
                Use context, budget
                <br />
                and timing to choose.
              </p>
            </div>
            <ArrowRight className={styles.pathArrow} />
            <div className={`${styles.flowStep} ${styles.outcomeStep}`}>
              <span className={styles.flowNumber} aria-hidden="true">
                03
              </span>
              <small>NEXT STEP</small>
              <h3>{flow === 'priority' ? 'Start a conversation' : 'Give the idea room'}</h3>
              <p>
                {flow === 'priority'
                  ? 'Assign the right owner and prepare the first response.'
                  : 'Keep the context and plan a useful resource to share.'}
              </p>
            </div>
          </div>
          <div className={styles.flowFoot} role="status">
            <span>
              <Check size={18} />
              {flow === 'priority'
                ? 'Priority route · Ready for a personal conversation.'
                : 'Nurture route · A thoughtful next step for early interest.'}
            </span>
            <Link href="/product#automation">
              Explore workflows <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.pipelineSection} id="opportunity-view">
        <div className={styles.pipelineVisual}>
          <div className={styles.pipelineTop}>
            <span>THE OPPORTUNITY VIEW</span>
            <span>
              <i /> One connected record
            </span>
          </div>
          <div
            className={styles.pipelineTabs}
            role="tablist"
            aria-label="Opportunity stages"
            onKeyDown={tabKeyboard}
          >
            {['Qualified', 'In conversation', 'Proposal'].map((label, i) => (
              <button
                key={label}
                id={`pipeline-tab-${i}`}
                role="tab"
                aria-selected={pipeline === i}
                aria-controls="pipeline-preview"
                tabIndex={pipeline === i ? 0 : -1}
                onClick={() => setPipeline(i)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            key={pipeline}
            id="pipeline-preview"
            role="tabpanel"
            aria-labelledby={`pipeline-tab-${pipeline}`}
            className={`${styles.pipelineColumns} ${styles.swapMotion}`}
          >
            {['Qualified', 'In conversation', 'Proposal'].map((stage, i) => (
              <div key={stage} data-active={pipeline === i}>
                <span>
                  <i />
                  {stage}
                </span>
                <div className={`${styles.dealCard} ${i === pipeline ? styles.mainDeal : ''}`}>
                  <span>{['A clear project', 'A real conversation', 'A considered offer'][i]}</span>
                  <h3>{['The context', 'The connection', 'The next chapter'][i]}</h3>
                  <div>
                    {i === pipeline ? (
                      <>
                        <span className={styles.dealAvatar}>JL</span>
                        <p>
                          Jamie Lee<small>Opportunity owner</small>
                        </p>
                      </>
                    ) : (
                      <>
                        <div className={styles.skeletonLine} />
                        <div className={styles.skeletonShort} />
                      </>
                    )}
                  </div>
                  <footer>
                    {['Project fit confirmed', 'Discovery call planned', 'Scope & next steps'][i]}
                    <ArrowUpRight size={16} />
                  </footer>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.pipelineBanner}>
            <span>
              <ShieldCheck size={21} /> Context stays connected.
            </span>
            <span>From first hello to the next chapter.</span>
          </div>
        </div>
        <div className={styles.pipelineCopy}>
          <span className={styles.eyebrow}>04 / THE BIGGER PICTURE</span>
          <h2>
            Less “where is that?”
            <br />
            <em>More “what’s next?”</em>
          </h2>
          <p>
            One place for the details, decisions and conversations that move an opportunity forward.
            A clear view for you. A shared direction for your team.
          </p>
          <ul>
            {[
              'Every opportunity has a place.',
              'Every conversation keeps its context.',
              'Every stage has a next step.',
            ].map((text) => (
              <li key={text}>
                <Check size={19} />
                {text}
              </li>
            ))}
          </ul>
          <Action href="/product">See the full picture</Action>
        </div>
      </section>

      <section className={styles.solutionsSection} id="solutions">
        <div className={styles.centerHeading}>
          <span className={styles.eyebrow}>05 / YOUR BUSINESS, YOUR WAY</span>
          <h2>
            Different work.
            <br />
            <span>The same drive to grow.</span>
          </h2>
          <p>A better lead journey starts with how your business actually works.</p>
        </div>
        <div
          className={styles.businessTabs}
          role="tablist"
          aria-label="Business type"
          onKeyDown={tabKeyboard}
        >
          {businesses.map((item, i) => {
            const BusinessIcon = [BriefcaseBusiness, Compass, Building2, Wrench][i];
            return (
              <button
                role="tab"
                id={`business-${i}`}
                aria-selected={business === i}
                aria-controls="business-panel"
                tabIndex={business === i ? 0 : -1}
                key={item.name}
                onClick={() => setBusiness(i)}
              >
                <BusinessIcon size={23} />
                <span>{item.name}</span>
                <span className={styles.businessCheck}>
                  {business === i ? <Check size={16} /> : <ArrowUpRight size={16} />}
                </span>
              </button>
            );
          })}
        </div>
        <div
          key={`business-${business}`}
          className={`${styles.businessPanel} ${styles.swapMotion}`}
          role="tabpanel"
          id="business-panel"
          aria-labelledby={`business-${business}`}
        >
          <div>
            <span className={styles.eyebrow}>GROWORA FOR {industry.name.toUpperCase()}</span>
            <h3>{industry.line}</h3>
            <p>{industry.copy}</p>
            <Link className={styles.textLink} href="/contact">
              Talk about your business <ArrowUpRight size={20} />
            </Link>
          </div>
          <div className={styles.businessDiagram}>
            <div className={styles.businessDocument}>
              <span>{industry.tag}</span>
              {industry.inputs.map((input, i) => (
                <div key={input}>
                  <span>0{i + 1}</span>
                  {input}
                  <Check size={17} />
                </div>
              ))}
            </div>
            <div className={styles.businessOutput}>
              <MoveUpRight size={26} />
              <strong>{industry.output}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.integrationsSection} id="connections">
        <div>
          <span className={styles.eyebrow}>06 / CONNECT THE DOTS</span>
          <h2>
            Your tools.
            <br />
            <em>A more connected future.</em>
          </h2>
          <p>
            Your process shouldn’t live on an island. Explore how Growora can fit around the tools
            your team knows.
          </p>
          <Link className={styles.textLink} href="/integrations">
            Explore the ecosystem <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className={styles.toolWall} aria-label="Integration ecosystem concepts">
          {[
            ['H', 'HubSpot'],
            ['#', 'Slack'],
            ['31', 'Google Calendar'],
            ['M', 'Mailchimp'],
            ['✳', 'Zapier'],
            ['@', 'Email'],
          ].map(([symbol, name], i) => (
            <Link href="/integrations" key={name} className={styles[`tool${i}`]}>
              <span>{symbol}</span>
              <strong>{name}</strong>
              <ArrowUpRight size={17} />
            </Link>
          ))}
          <p>Integration availability will be confirmed with your workspace.</p>
        </div>
      </section>

      <section className={styles.pricingSection} id="pricing">
        <div className={styles.pricingHeading}>
          <div>
            <span className={styles.eyebrow}>07 / MAKE ROOM FOR WHAT’S NEXT</span>
            <h2>
              Ambition looks
              <br />
              <span>good on you.</span>
            </h2>
          </div>
          <div>
            <p>
              Find the right starting point for your team.
              <br />
              Build a process with room to grow.
            </p>
            <div className={styles.billingSwitch} role="group" aria-label="Billing preference">
              <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
                Monthly
              </button>
              <button aria-pressed={annual} onClick={() => setAnnual(true)}>
                Yearly <span>Save 20%</span>
              </button>
            </div>
          </div>
        </div>
        <div className={styles.planGrid}>
          {[
            {
              name: 'Starter',
              price: 29,
              tag: 'MAKE A STRONG START',
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
              tag: 'FIND YOUR MOMENTUM',
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
              tag: 'THINK A LITTLE BIGGER',
              copy: 'Bring more people and possibilities together.',
              features: [
                '10,000 leads per month',
                'Advanced routing rules',
                'Multiple team pipelines',
                '20 workspace members',
              ],
            },
          ].map((plan, i) => (
            <article
              key={plan.name}
              className={`${styles.plan} ${i === 1 ? styles.growthPlan : ''}`}
            >
              <div className={styles.planTop}>
                {i === 1 ? (
                  <span className={styles.planBadge}>BUILT FOR YOUR NEXT CHAPTER</span>
                ) : (
                  <span className={styles.planTag}>{plan.tag}</span>
                )}
              </div>
              <h3>{plan.name}</h3>
              <p>{plan.copy}</p>
              <div key={String(annual)} className={`${styles.planPrice} ${styles.swapMotion}`}>
                <strong>£{Math.round(plan.price * (annual ? 0.8 : 1))}</strong>
                <span>/ month</span>
              </div>
              <span className={styles.planBilling}>
                {annual ? `£${Math.round(plan.price * 0.8) * 12} billed yearly` : 'Monthly billing'}
              </span>
              <Action href={`/contact?plan=${plan.name.toLowerCase()}`} light={i === 1}>
                Discuss {plan.name}
              </Action>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={18} />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className={styles.pricingNote}>
          Discuss plan availability and requirements with us. No payment is taken on this website.
        </p>
      </section>

      <section className={styles.faqSection}>
        <div>
          <span className={styles.eyebrow}>A FEW GOOD QUESTIONS</span>
          <h2>
            Clarity, from
            <br />
            the very start.
          </h2>
          <Link className={styles.textLink} href="/contact">
            Have another question? <ArrowUpRight size={20} />
          </Link>
        </div>
        <div>
          {[
            [
              'Who is Growora for?',
              'Growora is designed for service businesses where the right conversation makes all the difference—agencies, consultants, property teams and growing service teams.',
            ],
            [
              'How does lead qualification work?',
              'Project context, budget and timing contribute to a transparent intent score. The score helps your team decide where to focus; it does not replace a personal conversation.',
            ],
            [
              'Can the process fit the way our team works?',
              'Capture forms, pipeline stages and routing are the building blocks of the experience. Talk with us about your intake process and the decisions your team needs to make.',
            ],
            [
              'How can we get started?',
              'Choose a plan to discuss or contact us about your requirements. We’ll use that conversation to define the right workspace and confirm availability.',
            ],
          ].map(([question, answer], index) => (
            <div key={question} className={styles.faqItem}>
              <h3>
                <button
                  id={`faq-question-${index}`}
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  {question}
                  <Plus size={21} />
                </button>
              </h3>
              <div
                id={`faq-answer-${index}`}
                className={styles.faqAnswer}
                data-open={openFaq === index}
                aria-hidden={openFaq !== index}
                inert={openFaq !== index}
                role="region"
                aria-labelledby={`faq-question-${index}`}
              >
                <div>
                  <p>{answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.finalSection}>
        <Image
          className={styles.finalImage}
          src="/images/growora-blue-architecture.png"
          alt=""
          fill
          sizes="100vw"
        />
        <div className={styles.finalCopy}>
          <span className={styles.eyebrow}>EVERY LEAD DESERVES A NEXT STEP.</span>
          <h2>
            Make your next
            <br />
            opportunity <em>count.</em>
          </h2>
          <p>Bring the context, the conversation and the next step together.</p>
          <Action href="/contact" light>
            Let’s talk about your growth
          </Action>
        </div>
      </section>
    </div>
  );
}
