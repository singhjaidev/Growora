'use client';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Inbox,
  Users,
  CalendarDays,
  ChartNoAxesCombined,
  Sparkles,
} from 'lucide-react';
import { tabKeyboard } from '@/components/ui';
import s from './premium-homepage.module.css';
const steps = [
  {
    title: 'Capture the enquiry',
    label: 'Capture',
    icon: Inbox,
    copy: 'A customer asks about a project. Keep their brief, budget and timing in a single record, so the conversation starts with context.',
    status: 'New enquiry',
    detail: 'A new website for Northline Studio.',
    fields: [
      ['Contact', 'Alex Morgan'],
      ['Budget', '£7,500'],
      ['Timing', 'Within 30 days'],
    ],
    takeaway: 'Your team can see what the customer needs without searching through messages.',
  },
  {
    title: 'Recognise the fit',
    label: 'Qualify',
    icon: Sparkles,
    copy: 'Compare the enquiry with the work your business takes on. Make the reason for its priority clear to everyone.',
    status: 'Ready for review',
    detail: 'A project that matches your services.',
    fields: [
      ['Service', 'Website design'],
      ['Budget fit', 'Matches example criteria'],
      ['Priority', 'High'],
    ],
    takeaway: 'Prioritise with a visible reason. Your team still makes the decision.',
  },
  {
    title: 'Give it an owner',
    label: 'Assign',
    icon: Users,
    copy: 'Assign the opportunity to a teammate. The original brief stays with the record, so nobody has to start from scratch.',
    status: 'Assigned to Jamie',
    detail: 'Jamie Lee takes the conversation forward.',
    fields: [
      ['Owner', 'Jamie Lee'],
      ['Context', 'Brief and budget attached'],
      ['Stage', 'In conversation'],
    ],
    takeaway: 'Everyone knows who is responsible for the next step.',
  },
  {
    title: 'Plan the follow-up',
    label: 'Follow up',
    icon: CalendarDays,
    copy: 'Record a useful next action while the conversation is fresh. Keep follow-up details beside the opportunity.',
    status: 'Next action ready',
    detail: 'Arrange a discovery conversation.',
    fields: [
      ['Action', 'Book a discovery call'],
      ['Preparation', 'Review the project brief'],
      ['Follow-up', 'Draft for team review'],
    ],
    takeaway:
      'A visible next action helps a promising enquiry keep moving. This demo sends no messages.',
  },
  {
    title: 'Keep progress visible',
    label: 'Track',
    icon: ChartNoAxesCombined,
    copy: 'Update the stage as the conversation develops. Keep the owner, project context and next action connected through to a decision.',
    status: 'Proposal stage',
    detail: 'One record, from first hello to next step.',
    fields: [
      ['Pipeline', 'Proposal'],
      ['Owner', 'Jamie Lee'],
      ['Next action', 'Review scope with Alex'],
    ],
    takeaway: 'Your team has a shared view of where things stand and what needs attention.',
  },
];
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const step = steps[active];
  return (
    <div className={s.home}>
      <section className={s.pageIntro}>
        <div className={s.container}>
          <span className={s.label}>A WALKTHROUGH, ONE ENQUIRY AT A TIME</span>
          <h1>
            A first hello.
            <br />A clear next step.
          </h1>
          <p>
            See how Growora keeps an enquiry, its owner and its next action connected. Follow
            Northline Studio through five simple steps.
          </p>
        </div>
      </section>
      <section
        className={`${s.container} ${s.walkthrough}`}
        aria-label="Interactive Growora walkthrough"
      >
        <div
          className={s.featureTabs}
          role="tablist"
          aria-label="Walkthrough stages"
          onKeyDown={tabKeyboard}
        >
          {steps.map((item, i) => (
            <button
              role="tab"
              id={`walk-tab-${i}`}
              aria-selected={active === i}
              aria-controls="walk-panel"
              tabIndex={active === i ? 0 : -1}
              key={item.label}
              onClick={() => setActive(i)}
            >
              {String(i + 1).padStart(2, '0')} {item.label}
            </button>
          ))}
        </div>
        <div
          className={s.walkPanel}
          id="walk-panel"
          role="tabpanel"
          aria-labelledby={`walk-tab-${active}`}
          tabIndex={0}
        >
          <div className={s.walkCopy}>
            <span className={s.walkNumber}>
              0{active + 1}
              <small> / 05</small>
            </span>
            <h2>{step.title}</h2>
            <p>{step.copy}</p>
            <div className={s.walkTakeaway}>
              <Check size={20} />
              <p>{step.takeaway}</p>
            </div>
          </div>
          <div className={s.walkRecord} key={active}>
            <div className={s.storyHeader}>
              <span>ILLUSTRATIVE OPPORTUNITY</span>
              <step.icon size={22} />
            </div>
            <span className={s.walkStatus}>{step.status}</span>
            <h3>Northline Studio</h3>
            <p>{step.detail}</p>
            <dl>
              {step.fields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className={s.walkProgress} aria-hidden="true">
              {steps.map((item, i) => (
                <span key={item.label} data-complete={i <= active} />
              ))}
            </div>
          </div>
        </div>
        <div className={s.walkControls}>
          <button onClick={() => setActive(active - 1)} disabled={active === 0}>
            <ArrowLeft size={18} /> Previous
          </button>
          <span>Step {active + 1} of 5</span>
          <button onClick={() => setActive(active === 4 ? 0 : active + 1)}>
            {active === 4 ? 'Start again' : 'Next step'}
            <ArrowRight size={18} />
          </button>
        </div>
        <p className={s.walkNote}>
          An interactive product explanation using sample information. No account, live integration
          or message sending is involved.
        </p>
      </section>
    </div>
  );
}
