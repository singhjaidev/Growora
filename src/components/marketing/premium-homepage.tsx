'use client';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  type PointerEvent,
} from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  Mail,
  Globe,
  LayoutDashboard,
  SlidersHorizontal,
  Users,
  Inbox,
  Plus,
  MoreHorizontal,
  Sparkles,
  GitBranch,
  BarChart3,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { Mark, Dialog, tabKeyboard } from '@/components/ui';
import s from './premium-homepage.module.css';
import { StudioVisual } from './studio-visual';
import { FlowingRibbon } from './flowing-ribbon';

function Label({ children }: { children: ReactNode }) {
  return (
    <span className={s.label}>
      <span className={s.dot} aria-hidden="true" />
      {children}
    </span>
  );
}
function Actions() {
  return (
    <div className={s.actions}>
      <Link className={s.primary} href="/app">
        Explore Growora <ArrowUpRight size={17} />
      </Link>
      <a className={s.secondary} href="#how-it-works">
        See how it works <ArrowRight size={17} />
      </a>
    </div>
  );
}
function Avatar({ name = 'JL' }: { name?: string }) {
  return <span className={s.avatar}>{name}</span>;
}
function DemoLabel({ children = 'Your workspace' }: { children?: ReactNode }) {
  return (
    <span className={s.demoLabel}>
      <i />
      {children}
    </span>
  );
}
function MiniLead({
  name,
  company,
  value,
  priority = false,
  owner,
}: {
  name: string;
  company: string;
  value: string;
  priority?: boolean;
  owner?: string;
}) {
  return (
    <div className={s.miniLead}>
      <div>
        <span className={s.companyIcon}>{company.slice(0, 1)}</span>
        <MoreHorizontal size={14} />
      </div>
      <strong>{company}</strong>
      <span>{name}</span>
      <div>
        <b>{value}</b>
        <Avatar name={owner ?? (priority ? 'JL' : 'SC')} />
      </div>
      <small className={priority ? s.priority : s.tag}>
        {priority ? '↗ High priority' : 'Discovery call'}
      </small>
    </div>
  );
}
function Hero() {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={`${s.container} ${s.heroGrid}`}>
        <div className={s.heroCopy}>
          <Label>EVERY CONVERSATION HAS POTENTIAL</Label>
          <h1 id="hero-title">
            Turn more enquiries into <em>paying customers.</em>
          </h1>
          <p>
            Capture leads, automate follow-ups, and keep your sales pipeline moving—all from one
            connected workspace.
          </p>
          <Actions />
          <div className={s.heroNote}>
            <Check size={17} /> Built around your next step
          </div>
        </div>
        <div
          className={s.heroSculpture}
          onPointerMove={(event) => {
            if (
              event.pointerType !== 'mouse' ||
              window.matchMedia('(prefers-reduced-motion: reduce)').matches
            )
              return;
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            event.currentTarget.style.setProperty('--pointer-x', `${x * 24}deg`);
            event.currentTarget.style.setProperty('--pointer-y', `${-y * 20}deg`);
          }}
          onPointerLeave={(event) => {
            event.currentTarget.style.setProperty('--pointer-x', '0deg');
            event.currentTarget.style.setProperty('--pointer-y', '0deg');
          }}
        >
          <div className={s.heroHalo} />
          <StudioVisual kind="cube" />
          <div className={s.heroReceipt}>
            <span className={s.iconTile}>
              <Globe size={18} />
            </span>
            <div>
              <small>01 / CAPTURED</small>
              <strong>Northline Studio</strong>
              <span>Website enquiry · £7,500</span>
            </div>
            <Check size={16} />
          </div>
          <div className={s.heroOutcome}>
            <span className={s.scoreRing}>91</span>
            <div>
              <small>02 / QUALIFIED</small>
              <strong>A promising connection.</strong>
              <span>Next step: discovery with Jamie</span>
            </div>
          </div>
          <span className={s.sculptureCaption}>FROM A FIRST HELLO. TO A CLEAR NEXT STEP.</span>
        </div>
      </div>
      <div className={`${s.container} ${s.heroRail}`}>
        <span>ONE CONNECTED WORKSPACE</span>
        <div>
          {['Capture', 'Qualify', 'Assign', 'Follow up', 'Track'].map((x, i) => (
            <span key={x}>
              {x}
              {i < 4 && <ArrowRight size={13} />}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
export function PremiumHomepage() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute('data-visible', 'true');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    el.querySelectorAll('[data-reveal]').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return (
    <div className={s.home} ref={root}>
      <Hero />
      <Problems />
      <CubeSection />
      <Journey />
      <Workspace />
      <Capture />
      <Qualification />
      <Automation />
      <Intelligence />
      <Analytics />
      <Integrations />
      <UseCases />
      <Pricing />
      <FAQ />
      <Closing />
    </div>
  );
}

function Heading({
  label,
  title,
  copy,
  center = false,
}: {
  label: string;
  title: string;
  copy?: string;
  center?: boolean;
}) {
  return (
    <div className={`${s.heading} ${center ? s.center : ''}`}>
      <div>
        <Label>{label}</Label>
        <h2>{title}</h2>
      </div>
      {copy && <p>{copy}</p>}
    </div>
  );
}
function Problems() {
  return (
    <section className={`${s.section} ${s.container}`}>
      <Heading
        label="GOOD ENQUIRIES DESERVE BETTER"
        title="Every missed follow-up is a missed opportunity."
        center
      />
      <div className={s.problemGrid}>
        {[
          {
            icon: Inbox,
            title: 'Scattered enquiries',
            copy: 'An inbox here. A spreadsheet there. The details you need are always somewhere else.',
            lines: ['Website enquiry', 'Email conversation', 'Another spreadsheet'],
          },
          {
            icon: Clock3,
            title: 'Missed follow-ups',
            copy: 'Busy days turn into quiet leads. A promising conversation slips through the cracks.',
            lines: ['Reply to Alex Morgan', 'Follow-up overdue', 'Opportunity cooling'],
          },
          {
            icon: Users,
            title: 'Unclear ownership',
            copy: 'When everyone thinks someone else is handling it, nobody takes the next step.',
            lines: ['New project enquiry', 'Owner: unassigned', 'Who’s picking this up?'],
          },
        ].map((p, i) => (
          <article
            className={s.problemCard}
            key={p.title}
            data-reveal
            style={{ '--delay': `${i * 100}ms` } as CSSProperties}
          >
            <div className={s.problemSculpture} data-kind={i} aria-hidden="true">
              <div className={s.sculptureGlow} />
              {i === 0 ? (
                <div className={s.enquiryStack}>
                  {p.lines.map((line, j) => (
                    <div
                      className={s.enquirySheet}
                      key={line}
                      style={{ '--sheet': j } as CSSProperties}
                    >
                      {j === 0 ? (
                        <Globe size={20} />
                      ) : j === 1 ? (
                        <Mail size={20} />
                      ) : (
                        <FileText size={20} />
                      )}
                      <span>{line}</span>
                      <i />
                      <i />
                    </div>
                  ))}
                </div>
              ) : i === 1 ? (
                <div className={s.followupObject}>
                  <div className={s.clockFace}>
                    <span className={s.clockTicks} />
                    <i className={s.hourHand} />
                    <i className={s.minuteHand} />
                    <b />
                  </div>
                  <div className={s.reminderPlate}>
                    <Clock3 size={17} />
                    <span>Follow-up overdue</span>
                    <span>!</span>
                  </div>
                </div>
              ) : (
                <div className={s.ownershipObject}>
                  <div className={s.ownerConnector} />
                  {['JL', '?', 'SC'].map((name, j) => (
                    <div
                      key={name}
                      className={s.ownerTile}
                      style={{ '--person': j } as CSSProperties}
                    >
                      <span>{name}</span>
                      <i />
                    </div>
                  ))}
                  <div className={s.assignmentPlate}>
                    <Users size={17} />
                    <span>Who’s taking the next step?</span>
                  </div>
                </div>
              )}
            </div>
            <h3>{p.title}</h3>
            <p>{p.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
const stages = [
  {
    name: 'Capture',
    title: 'A new conversation starts here.',
    detail: 'Alex’s enquiry arrives with the brief, budget and timing in one record.',
    status: 'Alex Morgan · Website enquiry',
  },
  {
    name: 'Qualify',
    title: 'Find the fit behind the form.',
    detail: 'A £7,500 budget and a 30-day timeline match the qualification criteria.',
    status: 'Intent score 91 · High priority',
  },
  {
    name: 'Assign',
    title: 'The right person takes it from here.',
    detail: 'Jamie Lee owns the opportunity, with the full project context close at hand.',
    status: 'Assigned to Jamie Lee',
  },
  {
    name: 'Follow up',
    title: 'Keep the conversation moving.',
    detail: 'A discovery follow-up is prepared for review. Your team decides what to send.',
    status: 'Discovery follow-up · Draft ready',
  },
  {
    name: 'Track',
    title: 'A clear view of what comes next.',
    detail: 'See the next action and deal stage together, from first reply to proposal.',
    status: 'In conversation · Next step recorded',
  },
];
function useSequence(
  ref: RefObject<HTMLDivElement | null>,
  paused: boolean,
  count: number,
  duration = 6000,
) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.running = 'false';
    if (paused) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      el.dataset.running = String(visible && !document.hidden && !motion.matches);
      if (visible && !document.hidden && !motion.matches)
        timer = setInterval(() => setStep((v) => (v + 1) % count), duration);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      observer.disconnect();
      motion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [ref, paused, count, duration]);
  return step;
}
function Journey() {
  const [tick, setTick] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const stage = tick % 5;
  const source = Math.floor(tick / 5);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let visible = false;
    const sync = () => {
      el.dataset.running = String(visible && !document.hidden);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return (
    <section className={`${s.section} ${s.journeySection}`} id="how-it-works">
      <div className={s.container}>
        <Heading
          label="ONE LEAD. EVERY NEXT STEP."
          title="One connected journey. From enquiry to customer."
          center
        />
        <div ref={box} className={s.journey} data-running="false">
          <div className={s.network}>
            <div className={s.sourceNodes}>
              {[
                [Globe, 'Website form'],
                [Mail, 'Email enquiry'],
                [Users, 'Referral'],
              ].map(([Icon, text], i) => {
                const I = Icon as typeof Globe;
                return (
                  <div key={String(text)} data-active={source === i}>
                    <I size={18} />
                    <span>{String(text)}</span>
                    <span className={s.sourceProgress}>
                      {source === i ? `${stage + 1} / 5` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <svg viewBox="0 0 500 240" className={s.networkPaths} aria-hidden="true">
              {[
                'M0 35 C180 35 160 120 360 120',
                'M0 120 H360',
                'M0 205 C180 205 160 120 360 120',
              ].map((d, i) => (
                <path key={d} d={d} data-active={source === i} />
              ))}
              <path
                key={`trace-${tick}`}
                className={s.routeTrace}
                pathLength={100}
                d={
                  [
                    'M0 35 C180 35 160 120 360 120',
                    'M0 120 H360',
                    'M0 205 C180 205 160 120 360 120',
                  ][source]
                }
              />
              <circle
                key={tick}
                r="5"
                className={s.routeSignal}
                onAnimationEnd={() => setTick((value) => (value + 1) % 15)}
                style={
                  {
                    offsetPath: `path('${['M0 35 C180 35 160 120 360 120', 'M0 120 H360', 'M0 205 C180 205 160 120 360 120'][source]}')`,
                    animationDuration: '2.4s',
                  } as CSSProperties
                }
              />
            </svg>
            <div className={s.destination} key={tick}>
              <small className={s.destinationEyebrow}>ONE CONNECTED WORKSPACE</small>
              <Mark />
              <strong>growora</strong>
              <span>
                {stage === 0
                  ? [
                      'Alex Morgan · Website enquiry',
                      'Alex Morgan · Email enquiry',
                      'Alex Morgan · Referral',
                    ][source]
                  : stages[stage].status}
              </span>
              <div className={s.journeyMilestones} aria-hidden="true">
                {stages.map((item, i) => (
                  <i key={item.name} data-complete={i <= stage} />
                ))}
              </div>
            </div>
          </div>
          <div
            className={s.stageTabs}
            role="tablist"
            aria-label="Lead journey"
            onKeyDown={tabKeyboard}
          >
            {stages.map((x, i) => (
              <button
                key={x.name}
                id={`stage-${i}`}
                role="tab"
                aria-selected={stage === i}
                aria-controls="journey-panel"
                tabIndex={stage === i ? 0 : -1}
                onClick={() => {
                  setTick(source * 5 + i);
                }}
              >
                <span>0{i + 1}</span>
                {x.name}
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
          <div
            className={s.journeyDetail}
            id="journey-panel"
            role="tabpanel"
            aria-labelledby={`stage-${stage}`}
          >
            <div key={stage}>
              <h3>{stages[stage].title}</h3>
              <p>{stages[stage].detail}</p>
            </div>
            <span className={s.journeyStepCount}>
              0{stage + 1}
              <span>/ 05</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
const boardLeads = [
  {
    company: 'Northline Studio',
    name: 'Alex Morgan',
    value: '£7,500',
    owner: 'JL',
    stage: 0,
    source: 'Website',
  },
  {
    company: 'Oak & Beam',
    name: 'Noah Ellis',
    value: '£3,500',
    owner: 'SC',
    stage: 0,
    source: 'Referral',
  },
  {
    company: 'Fieldwork Property',
    name: 'Olivia Reed',
    value: '£5,000',
    owner: 'JL',
    stage: 1,
    source: 'Website',
  },
  {
    company: 'Forma Consulting',
    name: 'Leo Parker',
    value: '£4,500',
    owner: 'SC',
    stage: 2,
    source: 'Referral',
  },
  {
    company: 'Goodkind Agency',
    name: 'Freya Scott',
    value: '£6,000',
    owner: 'JL',
    stage: 2,
    source: 'Website',
  },
];
function useScrollScene() {
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let nearby = false;
    const draw = () => {
      frame = 0;
      const top = el.getBoundingClientRect().top;
      const progress = reduced.matches
        ? 1
        : Math.max(0, Math.min(1, (window.innerHeight * 0.9 - top) / (window.innerHeight * 0.85)));
      const eased = progress * progress * (3 - 2 * progress);
      el.style.setProperty('--workspace-scale', String(0.86 + 0.14 * eased));
      el.style.setProperty('--workspace-angle', `${14 * (1 - eased)}deg`);
      el.style.setProperty('--workspace-rise', `${70 * (1 - eased)}px`);
    };
    const schedule = () => {
      if (nearby && !frame) frame = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        nearby = entry.isIntersecting;
        schedule();
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    draw();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduced.addEventListener('change', draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reduced.removeEventListener('change', draw);
    };
  }, []);
  return scene;
}
function Workspace() {
  const scene = useScrollScene();
  const [stage, setStage] = useState(0);
  const [filter, setFilter] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const lead = selected === null ? null : boardLeads[selected];
  return (
    <section className={`${s.section} ${s.container}`} id="platform">
      <Heading
        label="A WORKSPACE THAT MOVES WITH YOU"
        title="Your entire pipeline. Finally in one place."
        copy="The brief, the people, the next conversation. Give your team a shared view of every opportunity."
      />
      <div ref={scene} className={s.workspaceScene}>
        <div className={s.workspaceFrame}>
          <div className={s.workspaceChrome} aria-hidden="true">
            <span>
              <i />
              <i />
              <i />
            </span>
            <span>growora / your workspace</span>
            <span>
              <Mark />
            </span>
          </div>
          <div className={s.workspace}>
            <aside className={s.workspaceSide}>
              <div>
                <Mark />
                <strong>growora</strong>
              </div>
              <small>NORTHLINE WORKSPACE</small>
              {[
                [LayoutDashboard, 'Overview', '/app'],
                [Inbox, 'Opportunities', '/app/pipeline'],
                [Users, 'Contacts', '/app/leads'],
                [GitBranch, 'Workflows', '/app/automations'],
                [BarChart3, 'Reports', '/app/analytics'],
              ].map(([Icon, label, href], i) => {
                const I = Icon as typeof Globe;
                return (
                  <Link href={String(href)} data-active={i === 1} key={String(label)}>
                    <I size={15} />
                    {String(label)}
                  </Link>
                );
              })}
              <span className={s.sideFoot}>
                <Avatar /> Jamie Lee <ChevronDown size={12} />
              </span>
            </aside>
            <div className={s.workspaceMain}>
              <div className={s.workspaceToolbar}>
                <span>
                  Workspace <span>/</span> Opportunities
                </span>
                <DemoLabel>Workspace overview</DemoLabel>
              </div>
              <div className={s.boardHeading}>
                <h3>
                  Sales pipeline <small>{filter ? 3 : 5} opportunities</small>
                </h3>
                <Link className={s.smallButton} href="/app/leads">
                  <Plus size={14} /> Open workspace
                </Link>
              </div>
              <div className={s.boardFilters}>
                <span>
                  <LayoutDashboard size={14} /> Board view
                </span>
                <button
                  className={s.smallButton}
                  aria-pressed={filter}
                  onClick={() => setFilter(!filter)}
                >
                  <SlidersHorizontal size={13} />
                  {filter ? 'Jamie’s leads' : 'All owners'}
                  <ChevronDown size={12} />
                </button>
                <span className={s.boardHint}>Select a lead to see the details</span>
              </div>
              <div className={s.fullBoard}>
                {['Qualified', 'In conversation', 'Proposal'].map((name, i) => (
                  <div className={s.lane} key={name}>
                    <h4>
                      <i />
                      {name}
                      <small>
                        {
                          boardLeads.filter(
                            (l, j) =>
                              (j === 0 ? stage : l.stage) === i && (!filter || l.owner === 'JL'),
                          ).length
                        }
                      </small>
                    </h4>
                    {boardLeads.map(
                      (l, j) =>
                        (j === 0 ? stage : l.stage) === i &&
                        (!filter || l.owner === 'JL') && (
                          <button
                            className={s.leadButton}
                            key={l.company}
                            onClick={() => setSelected(j)}
                          >
                            <MiniLead
                              name={l.name}
                              company={l.company}
                              value={l.value}
                              priority={j === 0}
                              owner={l.owner}
                            />
                          </button>
                        ),
                    )}
                  </div>
                ))}
              </div>
              <div className={s.boardStatus}>
                <CircleCheck size={14} />
                <span>
                  Northline Studio ·{' '}
                  {
                    [
                      'Ready for discovery',
                      'Discovery conversation planned',
                      'Scope ready to prepare',
                    ][stage]
                  }
                </span>
                <button className={s.smallButton} onClick={() => setStage((stage + 1) % 3)}>
                  {stage === 2 ? 'Reset lead' : 'Move lead'} <ArrowRight size={14} />
                </button>
              </div>
            </div>
            {lead && (
              <Dialog
                open={lead !== null}
                onClose={() => setSelected(null)}
                title="Selected lead details"
              >
                <div className={s.detailSheet}>
                  <span className={s.companyIcon}>{lead.company[0]}</span>
                  <h3>{lead.company}</h3>
                  <p>{lead.name}</p>
                  <dl>
                    <div>
                      <dt>Value</dt>
                      <dd>{lead.value}</dd>
                    </div>
                    <div>
                      <dt>Source</dt>
                      <dd>{lead.source}</dd>
                    </div>
                    <div>
                      <dt>Owner</dt>
                      <dd>{lead.owner === 'JL' ? 'Jamie Lee' : 'Sam Carter'}</dd>
                    </div>
                    <div>
                      <dt>Next step</dt>
                      <dd>
                        {selected === 0
                          ? ['Arrange discovery', 'Discuss the brief', 'Prepare proposal'][stage]
                          : 'Review project requirements'}
                      </dd>
                    </div>
                  </dl>
                  <Link className={s.primary} href="/app/leads">
                    Explore lead workspace <ArrowUpRight size={15} />
                  </Link>
                </div>
              </Dialog>
            )}
          </div>
        </div>
      </div>
      <div className={s.underNote}>
        <span>Move a lead to see its next stage.</span>
        <Link href="/app/pipeline">
          Explore the pipeline <ArrowUpRight size={14} />
        </Link>
      </div>
    </section>
  );
}
function Capture() {
  const [captured, setCaptured] = useState(false);
  return (
    <section className={`${s.section} ${s.captureEditorial}`} id="lead-capture">
      <div className={`${s.container} ${s.captureLayout}`}>
        <div className={s.captureStatement}>
          <Label>01 / CAPTURE THE CONTEXT</Label>
          <h2>
            <span>New leads,</span>
            <span className={s.captureAside}>
              wherever they
              <br />
              come from.
            </span>
          </h2>
          <div className={s.captureSources}>
            <span>Website.</span>
            <span>Inbox.</span>
            <span>Introduction.</span>
          </div>
          <p className={s.bodyCopy}>
            Different ways in. One clear starting point. Bring the details together, so the first
            conversation starts a step ahead.
          </p>
          <dl className={s.capturePrinciples}>
            <div>
              <dt>
                <span>01</span>The brief
              </dt>
              <dd>Know what they have in mind.</dd>
            </div>
            <div>
              <dt>
                <span>02</span>The context
              </dt>
              <dd>Source, budget and timing. Together.</dd>
            </div>
            <div>
              <dt>
                <span>03</span>The next step
              </dt>
              <dd>A clear record, ready for your team.</dd>
            </div>
          </dl>
          <Link className={s.textLink} href="/app/forms">
            Explore capture forms <ArrowUpRight size={16} />
          </Link>
        </div>
        <div
          className={s.captureDimension}
          data-captured={captured}
          onPointerMove={(event) => {
            if (
              event.pointerType !== 'mouse' ||
              window.matchMedia('(prefers-reduced-motion: reduce)').matches
            )
              return;
            const rect = event.currentTarget.getBoundingClientRect();
            event.currentTarget.style.setProperty(
              '--capture-x',
              `${((event.clientY - rect.top) / rect.height - 0.5) * -5}deg`,
            );
            event.currentTarget.style.setProperty(
              '--capture-y',
              `${((event.clientX - rect.left) / rect.width - 0.5) * 7}deg`,
            );
          }}
          onPointerLeave={(event) => {
            event.currentTarget.style.setProperty('--capture-x', '0deg');
            event.currentTarget.style.setProperty('--capture-y', '0deg');
          }}
        >
          <div className={s.captureDepth}>
            <div className={s.captureBackplate}>
              <Mark />
              <span>
                EVERY DETAIL.
                <br />A BETTER BEGINNING.
              </span>
              <small>growora / capture</small>
            </div>
            <div className={s.capturePaper}>
              <div className={s.capturePaperBar}>
                <Globe size={15} />
                <span>yourwebsite.com</span>
                <span>↗</span>
              </div>
              <div className={s.capturePaperBody}>
                <small>LET’S START A CONVERSATION</small>
                <h3>
                  A little about
                  <br />
                  your next project.
                </h3>
                <dl>
                  <div>
                    <dt>Your name</dt>
                    <dd>Alex Morgan</dd>
                  </div>
                  <div>
                    <dt>The brief</dt>
                    <dd>A new website for Northline Studio.</dd>
                  </div>
                  <div>
                    <dt>Project budget</dt>
                    <dd>£5,000 – £10,000</dd>
                  </div>
                </dl>
                <button className={s.primary} onClick={() => setCaptured((v) => !v)}>
                  {captured ? 'Reset form' : 'See it become a lead'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <div className={s.captureRecord} aria-live="polite">
              <span className={s.captureRecordIcon}>
                {captured ? <CircleCheck size={21} /> : <Inbox size={21} />}
              </span>
              <div>
                <small>{captured ? 'CONTEXT CAPTURED' : 'ONE CONNECTED RECORD'}</small>
                <strong>Northline Studio</strong>
                <span>
                  {captured
                    ? 'Alex Morgan · Website · Ready for your team'
                    : 'Brief, budget and source. All in one place.'}
                </span>
              </div>
              <Avatar name="AM" />
            </div>
          </div>
          <p className={s.capturePreviewNote}>Every detail, ready for the next step.</p>
        </div>
      </div>
    </section>
  );
}
function moveDepth(event: PointerEvent<HTMLElement>) {
  if (
    event.pointerType !== 'mouse' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return;
  const element = event.currentTarget;
  const bounds = element.getBoundingClientRect();
  element.style.setProperty(
    '--depth-x',
    `${((event.clientY - bounds.top) / bounds.height - 0.5) * -7}deg`,
  );
  element.style.setProperty(
    '--depth-y',
    `${((event.clientX - bounds.left) / bounds.width - 0.5) * 9}deg`,
  );
}
function resetDepth(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty('--depth-x');
  event.currentTarget.style.removeProperty('--depth-y');
}
const depthEvents = { onPointerMove: moveDepth, onPointerLeave: resetDepth };

function Qualification() {
  const [tab, setTab] = useState(0);
  return (
    <section className={`${s.section} ${s.container} ${s.split}`}>
      <div className={`${s.qualificationPanel} ${s.qualificationDepth}`} {...depthEvents}>
        <div className={s.panelBar}>
          <span>
            <Users size={15} /> Lead details
          </span>
          <MoreHorizontal size={18} />
        </div>
        <div className={s.profile}>
          <span className={s.largeAvatar}>AM</span>
          <div>
            <h3>Alex Morgan</h3>
            <p>
              Northline Studio <span>·</span> Website redesign
            </p>
          </div>
          <span className={s.priority}>High priority</span>
        </div>
        <div
          className={s.tabs}
          role="tablist"
          aria-label="Lead information"
          onKeyDown={tabKeyboard}
        >
          {['Overview', 'Activity', 'Next action'].map((t, i) => (
            <button
              key={t}
              role="tab"
              id={`lead-tab-${i}`}
              aria-selected={tab === i}
              aria-controls="lead-panel"
              tabIndex={tab === i ? 0 : -1}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </div>
        <div
          className={s.qualificationContent}
          id="lead-panel"
          role="tabpanel"
          aria-labelledby={`lead-tab-${tab}`}
        >
          <div key={tab} className={s.tabContent}>
            {tab === 0 ? (
              <>
                <dl className={s.facts}>
                  {[
                    ['Source', 'Website form'],
                    ['Budget', '£5,000–£10,000'],
                    ['Timeline', 'Within 30 days'],
                    ['Owner', 'Jamie Lee'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className={s.fitScore}>
                  <div>
                    <Sparkles size={16} /> Qualification score{' '}
                    <strong>
                      91 <small>/ 100</small>
                    </strong>
                  </div>
                  <div className={s.scoreTrack}>
                    <i />
                  </div>
                  <p>Service, budget and timing match the qualification criteria.</p>
                </div>
              </>
            ) : tab === 1 ? (
              <div className={s.activityList}>
                {[
                  ['09:41', 'Website enquiry received'],
                  ['09:42', 'Project fit reviewed · score 91'],
                  ['09:43', 'Assigned to Jamie Lee'],
                ].map(([time, txt]) => (
                  <div key={time}>
                    <CircleCheck size={16} />
                    <span>{txt}</span>
                    <small>{time}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className={s.nextAction}>
                <CalendarDays size={26} />
                <h3>Arrange a discovery conversation.</h3>
                <p>
                  Confirm the launch date, discuss the brief, and agree the next step with Alex.
                </p>
                <span>
                  <Avatar /> Jamie Lee · Suggested for today
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={s.panelFoot}>
          <DemoLabel>Lead qualification</DemoLabel>
          <Check size={14} /> Context retained
        </div>
      </div>
      <div>
        <Label>02 / FIND THE RIGHT FIT</Label>
        <h2>Know which leads need attention first.</h2>
        <p className={s.bodyCopy}>
          Look beyond a name and an email address. Understand the project, spot the fit, and give
          every conversation the attention it deserves.
        </p>
        <p className={s.bodyCopy}>
          Clear qualification helps your team choose a useful next step. The final decision stays
          with you.
        </p>
        <Link className={s.textLink} href="/app/leads">
          Get to know your leads <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
const workflows = [
  {
    trigger: 'New lead received',
    steps: ['Capture the enquiry', 'Assign Jamie as owner', 'Prepare a welcome reply'],
    copy: 'Start the relationship with a named owner and a relevant first response.',
  },
  {
    trigger: 'Lead qualified',
    steps: [
      'Check qualification criteria',
      'Create a discovery task',
      'Prepare a meeting invitation',
    ],
    copy: 'Turn a strong fit into a clear action for the person handling the conversation.',
  },
  {
    trigger: 'No response received',
    steps: ['Wait two working days', 'Check for a reply', 'Suggest a gentle follow-up'],
    copy: 'Give a quiet conversation another chance, with a thoughtful follow-up for review.',
  },
];
function Automation() {
  const [trigger, setTrigger] = useState(0);
  const sequenceRef = useRef<HTMLDivElement>(null);
  const phase = useSequence(sequenceRef, false, 3, 2200);
  return (
    <section className={`${s.section} ${s.automationSection}`}>
      <div className={s.container}>
        <Heading
          label="03 / KEEP THE MOMENTUM"
          title="The right follow-up, without the busywork."
          copy="Keep every conversation moving with a thoughtful next step, a clear owner, and a timely follow-up."
        />
        <div className={`${s.automationLayout} ${s.automationDepth}`} ref={sequenceRef}>
          <div
            className={s.triggerList}
            role="tablist"
            aria-label="Automation trigger"
            onKeyDown={tabKeyboard}
          >
            {workflows.map((w, i) => (
              <button
                key={w.trigger}
                {...depthEvents}
                role="tab"
                id={`trigger-${i}`}
                aria-selected={trigger === i}
                aria-controls="workflow-panel"
                tabIndex={trigger === i ? 0 : -1}
                onClick={() => {
                  setTrigger(i);
                }}
              >
                <span className={s.iconTile}>
                  {i === 0 ? <Inbox /> : i === 1 ? <CircleCheck /> : <Clock3 />}
                </span>
                <span>
                  <small>WHEN</small>
                  {w.trigger}
                </span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
          <div
            className={`${s.workflowPanel} ${s.followupDepth}`}
            {...depthEvents}
            id="workflow-panel"
            role="tabpanel"
            aria-labelledby={`trigger-${trigger}`}
          >
            <div className={s.panelBar}>
              <span>
                <GitBranch size={16} /> Every next step, connected
              </span>
            </div>
            <div className={s.workflowSteps}>
              {workflows[trigger].steps.map((step, i) => (
                <div
                  key={step}
                  className={s.workflowNode}
                  data-active={phase === i}
                  {...depthEvents}
                >
                  <span>{i + 1}</span>
                  <div>
                    <small>{['TRIGGER', 'ACTION', 'NEXT STEP'][i]}</small>
                    <strong>{step}</strong>
                  </div>
                  {i < 2 && <i className={s.workflowConnector} />}
                </div>
              ))}
            </div>
            <div className={s.workflowResult}>
              <p>{workflows[trigger].copy}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConnectedSystemCard() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = false;
    const sync = () => {
      el.dataset.running = String(visible && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={s.connectedCard}
      data-running="false"
      onPointerMove={(event) => {
        if (
          event.pointerType !== 'mouse' ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
          return;
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          '--card-x',
          `${((event.clientY - rect.top) / rect.height - 0.5) * -8}deg`,
        );
        event.currentTarget.style.setProperty(
          '--card-y',
          `${((event.clientX - rect.left) / rect.width - 0.5) * 10}deg`,
        );
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty('--card-x', '0deg');
        event.currentTarget.style.setProperty('--card-y', '0deg');
      }}
    >
      <div className={s.connectedCardTop}>
        <Mark />
        <span>THE CONNECTED WORKSPACE</span>
        <span className={s.connectedIndicator} />
      </div>
      <div className={s.recordStage}>
        <div className={s.recordAssembly}>
          <div className={s.recordSpine} aria-hidden="true" />
          {[
            {
              icon: Inbox,
              label: '01 / CAPTURE',
              title: 'One enquiry. Every detail.',
              detail: 'Northline Studio',
              meta: 'Brief + budget + source',
              tag: 'Received',
            },
            {
              icon: SlidersHorizontal,
              label: '02 / QUALIFY',
              title: 'The right fit comes into focus.',
              detail: 'Budget & timing aligned',
              meta: 'Owner: Jamie Lee',
              tag: 'Matched',
            },
            {
              icon: CalendarDays,
              label: '03 / CONNECT',
              title: 'A next step with context.',
              detail: 'Discovery conversation',
              meta: 'Original brief attached',
              tag: 'Prepared',
            },
          ].map((item, i) => (
            <div
              key={item.label}
              className={s.recordPlane}
              style={{ '--layer': i, '--phase': `${i * 6}s` } as CSSProperties}
            >
              <div className={s.recordPlaneHeader}>
                <item.icon size={18} />
                <span>{item.label}</span>
                <small>{item.tag}</small>
              </div>
              <strong>{item.title}</strong>
              <div className={s.recordPlaneDetails}>
                <span>{item.detail}</span>
                <span>{item.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={s.connectedCardFoot}>
        <span>
          <Check size={16} /> One shared record
        </span>
        <span>
          Context carried forward <ArrowRight size={15} />
        </span>
      </div>
    </div>
  );
}
function CubeSection() {
  return (
    <section className={s.cinematic} id="connected-system">
      <div className={`${s.container} ${s.systemGrid}`}>
        <div className={s.systemCopy}>
          <Label>CONNECTED ON THE INSIDE</Label>
          <h2>Everything works better when it works together.</h2>
          <p>
            One enquiry sets the right things in motion. See how the details become a clear, shared
            next step.
          </p>
          <ol className={s.systemSteps}>
            {[
              [
                'Capture the whole story',
                'The brief, source and budget arrive in one lead record.',
              ],
              [
                'Give it direction',
                'Qualification criteria surface the fit. An owner takes responsibility.',
              ],
              [
                'Keep the next step moving',
                'A follow-up is prepared with the original context intact.',
              ],
            ].map(([title, copy], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ol>
          <a href="#how-it-works" className={s.textLink}>
            Follow an enquiry <ArrowRight size={16} />
          </a>
        </div>
        <ConnectedSystemCard />
      </div>
    </section>
  );
}
function Intelligence() {
  const [draft, setDraft] = useState(false);
  return (
    <section className={`${s.section} ${s.container}`}>
      <div className={s.intelligence}>
        <div className={s.fluidWrap}>
          <div className={s.reasoningCard}>
            <div className={s.reasoningTop}>
              <Sparkles size={20} />
              <span>OPPORTUNITY BRIEF</span>
              <span>01</span>
            </div>
            <div className={s.reasoningProfile}>
              <Avatar name="AM" />
              <div>
                <strong>Alex Morgan</strong>
                <span>Northline Studio · Website enquiry</span>
              </div>
            </div>
            <h3>
              A good fit.
              <br />
              And a clear way forward.
            </h3>
            <div className={s.evidenceGrid}>
              {[
                ['Budget', '£7,500', 'Within your range'],
                ['Timeline', '30 days', 'Ready to get started'],
                ['Intent', 'Website redesign', 'A detailed project brief'],
              ].map(([label, value, note]) => (
                <div key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                  <span>
                    <Check size={12} />
                    {note}
                  </span>
                </div>
              ))}
            </div>
            <div className={s.recommendation}>
              <span className={s.iconTile}>
                <CalendarDays size={19} />
              </span>
              <div>
                <small>SUGGESTED NEXT STEP</small>
                <strong>Book a discovery conversation</strong>
                <span>Jamie Lee · Suggested owner</span>
              </div>
              <ArrowUpRight size={18} />
            </div>
            <div className={s.reasoningFoot}>
              <span className={s.dot} /> Context connected. Ready for your review.
            </div>
          </div>
          <span className={s.fluidLabel}>
            <Sparkles size={13} /> A little perspective changes everything.
          </span>
        </div>
        <div className={s.intelligenceCopy}>
          <Label>THOUGHTFUL ASSISTANCE</Label>
          <h2>A little intelligence behind every next step.</h2>
          <p>Less time piecing things together. More time having the right conversation.</p>
          <div className={s.insight}>
            <div>
              <Sparkles size={16} />
              <span>{draft ? 'SUGGESTED FOLLOW-UP' : 'AN OPPORTUNITY WORTH A CLOSER LOOK'}</span>
            </div>
            <p key={String(draft)}>
              {draft
                ? 'Hi Alex, thanks for sharing the brief for Northline. Shall we find 20 minutes this week to discuss your launch timeline and what the new website needs to do?'
                : 'Alex has a clear brief, an aligned budget and a near-term timeline. A discovery conversation would be a useful next step.'}
            </p>
            <button onClick={() => setDraft(!draft)}>
              {draft ? 'Back to lead insight' : 'Preview a follow-up'}
              <ArrowRight size={15} />
            </button>
          </div>
          <small>Prepared with context. Reviewed by you.</small>
        </div>
      </div>
    </section>
  );
}
function Analytics() {
  const scene = useScrollScene();
  const [period, setPeriod] = useState(0);
  const bars = period
    ? [32, 42, 36, 58, 51, 66, 74, 60, 85, 76, 88, 96]
    : [26, 37, 30, 52, 46, 66, 57, 72, 63, 84, 75, 94];
  return (
    <section className={`${s.section} ${s.container}`}>
      <Heading
        label="04 / SEE THE BIGGER PICTURE"
        title="See what’s working. Find what’s slowing you down."
        copy="Bring the patterns into focus. Understand where enquiries come from and where conversations need a little attention."
      />
      <div ref={scene} className={s.workspaceScene}>
        <div className={s.workspaceFrame}>
          <div className={s.analytics}>
            <div className={s.panelBar}>
              <span>
                <BarChart3 size={16} /> Pipeline overview
              </span>
              <div className={s.period} role="group" aria-label="Analytics period">
                {['This month', 'Last month'].map((x, i) => (
                  <button key={x} aria-pressed={period === i} onClick={() => setPeriod(i)}>
                    {x}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.statGrid}>
              {[
                ['New enquiries', period ? '108' : '124', 'Across all sources'],
                ['Qualified leads', period ? '72' : '86', 'Ready for a conversation'],
                ['Median response', period ? '2.8h' : '2.4h', 'From enquiry to first reply'],
                ['Pipeline value', period ? '£38,000' : '£42,500', 'Open opportunities'],
              ].map(([k, v, sub]) => (
                <div key={k}>
                  <span>{k}</span>
                  <strong>{v}</strong>
                  <small>{sub}</small>
                </div>
              ))}
            </div>
            <div className={s.chartGrid}>
              <div className={s.barChart}>
                <div>
                  <h3>Pipeline activity</h3>
                  <span>
                    <i /> Enquiries <i /> Qualified
                  </span>
                </div>
                <div
                  className={s.bars}
                  role="img"
                  aria-label={
                    period
                      ? 'Last month: 108 enquiries, 72 qualified.'
                      : 'This month: 124 enquiries, 86 qualified.'
                  }
                >
                  {bars.map((v, i) => (
                    <div key={i}>
                      <i style={{ height: `${v}%` }} />
                      <b style={{ height: `${v * 0.66}%` }} />
                    </div>
                  ))}
                </div>
                <div className={s.chartAxis}>
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                </div>
              </div>
              <div className={s.sourceChart}>
                <h3>Where leads begin</h3>
                {[
                  ['Website forms', 52],
                  ['Referrals', 28],
                  ['Direct enquiries', 20],
                ].map(([name, n]) => (
                  <div key={name}>
                    <span>
                      {name}
                      <b>{n}%</b>
                    </span>
                    <div>
                      <i style={{ width: `${n}%` }} />
                    </div>
                  </div>
                ))}
                <div className={s.responseTrend}>
                  <span>Response trend</span>
                  <strong>
                    {period ? '3.1h → 2.8h' : '2.8h → 2.4h'} <ArrowRight size={14} />
                  </strong>
                </div>
              </div>
            </div>
            <div className={s.stageProgress}>
              <span>Stage progression</span>
              {[
                ['Enquiries', period ? 108 : 124],
                ['Qualified', period ? 72 : 86],
                ['In conversation', period ? 39 : 48],
                ['Proposal', period ? 17 : 21],
              ].map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
            <div className={s.panelFoot}>
              <DemoLabel>Pipeline activity</DemoLabel>
              <Link href="/app/analytics">
                Explore reports <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function Integrations() {
  const map = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = map.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => {
      el.dataset.running = String(visible && !paused && !document.hidden && !reduced.matches);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    sync();
    observer.observe(el);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [paused]);
  const routes = [
    'M90 60 Q250 60 250 200',
    'M410 60 Q250 60 250 200',
    'M48 200 H250',
    'M452 200 H250',
    'M90 340 Q250 340 250 200',
    'M410 340 Q250 340 250 200',
  ];
  return (
    <section className={`${s.section} ${s.softSection}`} id="connections">
      <div className={`${s.container} ${s.split}`}>
        <div>
          <Label>KEEP THE CONTEXT CLOSE</Label>
          <h2>
            Connect the tools.
            <br />
            Keep the context.
          </h2>
          <p className={s.bodyCopy}>
            A connected process starts with the tools your team already uses. Explore how enquiries,
            conversations and next steps could stay in sync.
          </p>
          <Link className={s.textLink} href="/integrations">
            Explore connections <ArrowUpRight size={16} />
          </Link>
          <p className={s.disclosure}>
            Tool connections. Confirm availability before choosing a plan.
          </p>
        </div>
        <div className={s.integrationMap} ref={map}>
          <svg viewBox="0 0 500 400" aria-hidden="true">
            {routes.map((d, i) => (
              <path key={d} d={d} data-active={i === active} />
            ))}
            <circle
              key={active}
              r="5"
              className={s.routeSignal}
              onAnimationEnd={() => setActive((value) => (value + 1) % routes.length)}
              style={
                {
                  offsetPath: `path('${routes[active]}')`,
                } as CSSProperties
              }
            />
          </svg>
          <div className={s.integrationHub}>
            <Mark />
            <strong>growora</strong>{' '}
            <small className={s.hubStatus}>
              {
                [
                  'Reply linked',
                  'Meeting recorded',
                  'Enquiry captured',
                  'Owner updated',
                  'Next step ready',
                  'Event received',
                ][active]
              }
            </small>
          </div>
          {[
            [Mail, 'Email'],
            [CalendarDays, 'Calendar'],
            [FileText, 'Forms'],
            [Users, 'CRM'],
            [GitBranch, 'Workflows'],
            [Globe, 'Webhooks'],
          ].map(([Icon, name], i) => {
            const I = Icon as typeof Globe;
            return (
              <Link
                key={String(name)}
                href="/integrations"
                className={s.integrationNode}
                data-node={i}
                data-active={active === i}
              >
                <I size={21} />
                <span>{String(name)}</span>
              </Link>
            );
          })}
          <button
            className={s.connectionPause}
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            {paused ? 'Play signals' : 'Pause signals'}
          </button>
        </div>
      </div>
    </section>
  );
}
function UseCases() {
  return (
    <section className={`${s.section} ${s.container}`} id="solutions">
      <Heading
        label="FOR THE PEOPLE BEHIND THE PIPELINE"
        title="Built for teams that can’t afford to lose a good lead."
        center
      />
      <div className={s.useCases}>
        {[
          {
            title: 'Service businesses',
            copy: 'Turn quote requests into conversations that win work.',
            label: 'QUOTE REQUEST',
            company: 'Oak & Beam',
            detail: 'Kitchen renovation · Ready for a quote',
            icon: FileText,
          },
          {
            title: 'Small sales teams',
            copy: 'Give every opportunity an owner, a next action and a shared place in your pipeline.',
            label: 'YOUR TEAM, ALIGNED',
            company: 'A clear next step.',
            detail: 'Jamie Lee · Discovery call tomorrow',
            icon: Users,
          },
          {
            title: 'Agencies & consultants',
            copy: 'See the scope, budget and timing before the first call. Start with the projects that fit.',
            label: 'PROJECT BRIEF',
            company: 'Northline Studio',
            detail: 'Website redesign · £5,000–£10,000',
            icon: Sparkles,
          },
        ].map((x, i) => (
          <article
            className={s.useCase}
            key={x.title}
            data-reveal
            style={{ '--delay': `${i * 100}ms` } as CSSProperties}
          >
            <div className={s.caseVisual}>
              <x.icon size={22} />
              <small>{x.label}</small>
              <strong>{x.company}</strong>
              <p>{x.detail}</p>
              <div>
                <Avatar name={i === 0 ? 'SC' : 'JL'} />
                <span>
                  {i === 1 ? 'Assigned. Aligned. Moving.' : 'The right context, from the start.'}
                </span>
                <Check size={13} />
              </div>
            </div>
            <h3>{x.title}</h3>
            <p>{x.copy}</p>
            <Link href="/solutions">
              Find your flow <ArrowUpRight size={15} />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
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
    copy: 'More people. More possibilities. One process.',
    features: [
      '10,000 leads per month',
      'Advanced routing rules',
      'Multiple team pipelines',
      '20 workspace members',
    ],
  },
];
function Pricing() {
  const [annual, setAnnual] = useState(false);
  return (
    <section className={`${s.section} ${s.pricingSection}`} id="pricing">
      <div className={s.container}>
        <Heading
          label="START FOCUSED. GROW WITH INTENT."
          title="Simple plans for every stage of growth."
          center
        />
        <div className={s.billing} role="group" aria-label="Billing preference">
          <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
            Monthly
          </button>
          <button aria-pressed={annual} onClick={() => setAnnual(true)}>
            Yearly <span>Save ~20%</span>
          </button>
        </div>
        <div className={s.planGrid}>
          {plans.map((p, i) => (
            <article key={p.name} className={`${s.plan} ${i === 1 ? s.growthPlan : ''}`}>
              <div className={s.planLabel}>
                {i === 1
                  ? 'A LITTLE MORE MOMENTUM'
                  : i === 0
                    ? 'MAKE A STRONG START'
                    : 'ROOM FOR WHAT’S NEXT'}
                {i === 1 && <span>Recommended</span>}
              </div>
              <h3>{p.name}</h3>
              <p>{p.copy}</p>
              <div className={s.price}>
                <strong>£{Math.round(p.price * (annual ? 0.8 : 1))}</strong>
                <span>/ month</span>
              </div>
              <small>
                {annual ? `£${Math.round(p.price * 0.8) * 12} billed yearly` : 'Monthly billing'}
              </small>
              <Link
                className={i === 1 ? s.primary : s.secondary}
                href={`/contact?plan=${p.name.toLowerCase()}`}
              >
                Discuss {p.name} <ArrowUpRight size={15} />
              </Link>
              <ul>
                {p.features.map((x) => (
                  <li key={x}>
                    <Check size={15} />
                    {x}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
const faqs = [
  [
    'What does Growora do?',
    'Growora brings lead capture, qualification, ownership and next actions into a connected workspace. ',
  ],
  [
    'Who is Growora for?',
    'Service businesses, small sales teams, agencies and consultants who want a clearer way to manage enquiries and move promising conversations forward.',
  ],
  [
    'How does lead management work?',
    'Enquiries become lead records with a source, project context, owner and pipeline stage. In the workspace you can explore lead details, change stages and try filters. Saved workspace changes stay in your browser.',
  ],
  [
    'What can I automate?',
    'The workspace lets you explore example rules for qualification, assignment and follow-up. These workflow tests show the steps; they do not send emails or run a background service. Discuss your actual requirements with the team.',
  ],
  [
    'Can I connect my existing tools?',
    'The integration views demonstrate possible connection categories and states. Live external integrations, OAuth and synchronisation are not implemented in this workspace. Confirm availability before making a decision.',
  ],
  [
    'Is there a free trial? How does pricing work?',
    'You can explore the workspace without an account. Choose Starter, Growth or Scale to discuss your requirements; the contact form currently saves a request locally and does not send it.',
  ],
];
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className={`${s.section} ${s.container} ${s.faqLayout}`}>
      <div>
        <Label>A LITTLE CLARITY</Label>
        <h2>
          A few things
          <br />
          worth knowing.
        </h2>
        <p className={s.bodyCopy}>Something else on your mind?</p>
        <Link className={s.textLink} href="/contact">
          Let’s talk <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className={s.faqList}>
        {faqs.map(([q, a], i) => (
          <article key={q} data-open={open === i}>
            <h3>
              <button
                aria-expanded={open === i}
                aria-controls={`premium-answer-${i}`}
                id={`premium-question-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {q}
                <Plus size={17} />
              </button>
            </h3>
            <div
              className={s.faqAnswer}
              id={`premium-answer-${i}`}
              role="region"
              aria-labelledby={`premium-question-${i}`}
              aria-hidden={open !== i}
              inert={open !== i}
            >
              <div>
                <p>{a}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
function Closing() {
  return (
    <section className={s.closing}>
      <div className={`${s.container} ${s.closingGrid}`}>
        <div>
          <Label>YOUR NEXT CHAPTER STARTS WITH A CONVERSATION</Label>
          <h2>
            Give every opportunity
            <br />a better chance.
          </h2>
          <p>A little less friction. A little more forward.</p>
          <Actions />
        </div>
        <FlowingRibbon />
      </div>
    </section>
  );
}
