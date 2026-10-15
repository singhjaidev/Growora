'use client';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
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
  Zap,
  GitBranch,
  BarChart3,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { Mark, Dialog, tabKeyboard } from '@/components/ui';
import s from './premium-homepage.module.css';
import { StudioVisual } from './studio-visual';

function Label({ children }: { children: ReactNode }) {
  return <span className={s.label}>{children}</span>;
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
function DemoLabel({ children = 'Illustrative workspace' }: { children?: ReactNode }) {
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
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <div className={`${s.container} ${s.heroGrid}`}>
        <div className={s.heroCopy}>
          <Label>
            <span className={s.dot} /> A little more connected. A lot more possible.
          </Label>
          <h1 id="hero-title">
            Turn more enquiries into <em>paying customers.</em>
          </h1>
          <p>
            Capture leads, automate follow-ups, and keep your sales pipeline moving—all from one
            workspace.
          </p>
          <Actions />
          <div className={s.heroNote}>
            <span>
              <Check size={14} /> Built around your next step
            </span>
            <span>Explore the interactive demo</span>
          </div>
        </div>
        <div
          className={s.heroScene}
          ref={ref}
          onPointerMove={(e) => {
            if (
              e.pointerType !== 'mouse' ||
              window.matchMedia('(prefers-reduced-motion: reduce)').matches
            )
              return;
            const r = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty(
              '--rx',
              `${-(e.clientY - r.top - r.height / 2) / 150}deg`,
            );
            e.currentTarget.style.setProperty(
              '--ry',
              `${(e.clientX - r.left - r.width / 2) / 180}deg`,
            );
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.setProperty('--rx', '0deg');
            e.currentTarget.style.setProperty('--ry', '0deg');
          }}
        >
          <div className={s.sceneOrbit} />
          <div className={s.heroBoard}>
            <div className={s.previewTop}>
              <span>
                <Mark /> growora<span className={s.divider}>/</span> My workspace
              </span>
              <Avatar />
            </div>
            <div className={s.previewBody}>
              <aside>
                <LayoutDashboard />
                <Inbox />
                <Users />
                <GitBranch />
                <BarChart3 />
              </aside>
              <div className={s.previewContent}>
                <div className={s.previewTitle}>
                  <strong>Opportunities</strong>
                  <span>
                    <SlidersHorizontal size={13} /> View
                  </span>
                </div>
                <div className={s.previewMetrics}>
                  <div>
                    <span>Pipeline value</span>
                    <strong>
                      £42,500 <small>↗ 12.4%</small>
                    </strong>
                  </div>
                  <div>
                    <span>Active leads</span>
                    <strong>
                      24 <small>+4 this week</small>
                    </strong>
                  </div>
                </div>
                <div className={s.miniBoard}>
                  <div>
                    <p>
                      <i /> New enquiries <small>08</small>
                    </p>
                    <MiniLead
                      name="Alex Morgan"
                      company="Northline Studio"
                      value="£7,500"
                      priority
                    />
                    <MiniLead name="Noah Ellis" company="Oak & Beam" value="£3,500" />
                  </div>
                  <div>
                    <p>
                      <i /> In conversation <small>06</small>
                    </p>
                    <MiniLead name="Olivia Reed" company="Fieldwork Property" value="£5,000" />
                    <MiniLead name="Leo Parker" company="Forma Consulting" value="£4,500" />
                  </div>
                </div>
              </div>
            </div>
            <div className={s.previewBottom}>
              <span className={s.dot} /> Every opportunity, a clear next step.
              <span>Sample data</span>
            </div>
          </div>
          <div className={`${s.floatCard} ${s.incoming}`}>
            <span className={s.iconTile}>
              <Inbox size={17} />
            </span>
            <div>
              <small>NEW ENQUIRY</small>
              <strong>Meet your next opportunity.</strong>
              <span>Alex Morgan · Website form</span>
            </div>
            <span className={s.dot} />
          </div>
          <div className={`${s.floatCard} ${s.qualified}`}>
            <div className={s.scoreRing}>91</div>
            <div>
              <small>A STRONG FIT</small>
              <strong>Ready for a conversation</strong>
              <span>Budget, timing and brief aligned.</span>
            </div>
          </div>
          <div className={`${s.floatCard} ${s.followup}`}>
            <span className={s.iconTile}>
              <Check size={17} />
            </span>
            <div>
              <strong>Next step, taken care of.</strong>
              <span>Discovery follow-up · Scheduled</span>
            </div>
            <span className={s.tinyAvatar}>JL</span>
          </div>
          <div className={s.sceneCaption}>YOUR PIPELINE. WITH A LITTLE MORE MOMENTUM.</div>
        </div>
      </div>
      <div className={`${s.container} ${s.heroRail}`}>
        <span>FROM FIRST HELLO TO WHAT’S NEXT</span>
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
      <Journey />
      <Workspace />
      <Capture />
      <Qualification />
      <Automation />
      <CubeSection />
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
            <div className={s.problemVisual}>
              <p.icon size={22} />
              {p.lines.map((l, j) => (
                <div key={l} style={{ opacity: 1 - j * 0.2, transform: `translateX(${j * 8}px)` }}>
                  <span className={s.dot} />
                  {l}
                  <span>{j === 1 ? '•••' : '↗'}</span>
                </div>
              ))}
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
    detail: 'Alex’s website enquiry arrives with the brief, budget and timing in one record.',
    status: 'Alex Morgan · Website enquiry',
  },
  {
    name: 'Qualify',
    title: 'Find the fit behind the form.',
    detail: 'A £7,500 budget and a 30-day timeline match the example qualification criteria.',
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
function useVisibleSignals(ref: RefObject<SVGSVGElement | null>, paused: boolean, version = 0) {
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    svg.setCurrentTime(0);
    const sync = () => {
      if (paused || reduced.matches || !visible || document.hidden) svg.pauseAnimations();
      else svg.unpauseAnimations();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(svg);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
    };
  }, [ref, paused, version]);
}
function Journey() {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const signals = useRef<SVGSVGElement>(null);
  useVisibleSignals(signals, !playing, stage);
  useEffect(() => {
    const el = box.current;
    if (!el || !playing) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => {
      clearInterval(timer);
      if (visible && !document.hidden && !motion.matches)
        timer = setInterval(() => setStage((v) => (v + 1) % 5), 3200);
    };
    const observer = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        sync();
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      clearInterval(timer);
      motion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [playing]);
  return (
    <section className={`${s.section} ${s.journeySection}`} id="how-it-works">
      <div className={s.container}>
        <Heading
          label="ONE LEAD. EVERY NEXT STEP."
          title="One connected journey. From enquiry to customer."
          center
        />
        <div ref={box} className={s.journey} data-playing={playing}>
          <div className={s.network}>
            <div className={s.sourceNodes}>
              {[
                [Globe, 'Website form'],
                [Mail, 'Email enquiry'],
                [Users, 'Referral'],
              ].map(([Icon, text]) => {
                const I = Icon as typeof Globe;
                return (
                  <div key={String(text)}>
                    <I size={18} />
                    {String(text)}
                  </div>
                );
              })}
            </div>
            <svg
              key={`signal-${stage}`}
              ref={signals}
              viewBox="0 0 500 240"
              className={s.networkPaths}
              aria-hidden="true"
            >
              <path d="M0 35 C180 35 160 120 360 120 M0 120 H360 M0 205 C180 205 160 120 360 120" />
              <circle r="4" className={s.signal}>
                <animateMotion
                  dur="3.2s"
                  repeatCount="indefinite"
                  path="M0 35 C180 35 160 120 360 120"
                />
              </circle>
              <circle r="3" className={s.signal}>
                <animateMotion
                  dur="3.2s"
                  begin="1s"
                  repeatCount="indefinite"
                  path="M0 205 C180 205 160 120 360 120"
                />
              </circle>
            </svg>
            <div className={s.destination} key={stage}>
              <Mark />
              <strong>growora</strong>
              <span>{stages[stage].status}</span>
              <CircleCheck size={18} />
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
                  setPlaying(false);
                  setStage(i);
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
            <button
              className={s.smallButton}
              aria-pressed={playing}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? 'Pause journey' : 'Play journey'}{' '}
              <span aria-hidden="true">{playing ? 'Ⅱ' : '▷'}</span>
            </button>
          </div>
          <DemoLabel>Illustrative lead journey · no external messages sent</DemoLabel>
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
function Workspace() {
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
      <div className={s.workspace} data-reveal>
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
            <DemoLabel>Sample data</DemoLabel>
          </div>
          <div className={s.boardHeading}>
            <h3>
              Sales pipeline <small>{filter ? 3 : 5} opportunities</small>
            </h3>
            <Link className={s.smallButton} href="/app/leads">
              <Plus size={14} /> Open demo
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
                ['Ready for discovery', 'Discovery conversation planned', 'Scope ready to prepare'][
                  stage
                ]
              }
            </span>
            <button className={s.smallButton} onClick={() => setStage((stage + 1) % 3)}>
              {stage === 2 ? 'Reset example' : 'Move example lead'} <ArrowRight size={14} />
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
      <div className={s.underNote}>
        <span>Try moving the example lead. Your saved workspace stays unchanged.</span>
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
    <section className={`${s.section} ${s.softSection}`}>
      <div className={`${s.container} ${s.split}`}>
        <div>
          <Label>01 / CAPTURE THE CONTEXT</Label>
          <h2>New leads, wherever they come from.</h2>
          <p className={s.bodyCopy}>
            Start with the details that matter. Bring a new enquiry into one clear record, ready for
            your team to pick up.
          </p>
          <ul className={s.checkList}>
            <li>
              <Check /> A useful brief from the first hello
            </li>
            <li>
              <Check /> Source, budget and timing together
            </li>
            <li>
              <Check /> One place to begin the conversation
            </li>
          </ul>
          <Link className={s.textLink} href="/app/forms">
            Explore capture forms <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className={s.captureVisual} data-reveal>
          <div className={s.captureForm}>
            <div>
              <Globe size={15} /> yourwebsite.com <span>ENQUIRY FORM</span>
            </div>
            <h3>Let’s make something happen.</h3>
            <span>Your name</span>
            <p>Alex Morgan</p>
            <span>What do you have in mind?</span>
            <p>A new website for Northline Studio.</p>
            <button className={s.primary} onClick={() => setCaptured(!captured)}>
              {captured ? 'Reset example' : 'Capture example enquiry'} <ArrowRight size={15} />
            </button>
          </div>
          <div className={s.captureReceipt} data-active={captured}>
            <span className={s.iconTile}>{captured ? <CircleCheck /> : <Inbox />}</span>
            <div>
              <small>{captured ? 'LEAD RECORD CREATED' : 'READY TO CAPTURE'}</small>
              <strong>Northline Studio</strong>
              <span>
                {captured
                  ? 'Alex Morgan · Website · Just now'
                  : 'Your next opportunity starts here'}
              </span>
            </div>
            <Avatar />
          </div>
          <DemoLabel>Interactive example · no form is submitted</DemoLabel>
        </div>
      </div>
    </section>
  );
}
function Qualification() {
  const [tab, setTab] = useState(0);
  return (
    <section className={`${s.section} ${s.container} ${s.split}`}>
      <div className={s.qualificationPanel} data-reveal>
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
                  <p>Service, budget and timing match the example criteria.</p>
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
          <DemoLabel>Illustrative qualification</DemoLabel>
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
  const [run, setRun] = useState(-1);
  useEffect(() => {
    if (run < 0 || run > 2) return;
    const timer = setTimeout(() => setRun(run + 1), 850);
    return () => clearTimeout(timer);
  }, [run]);
  return (
    <section className={`${s.section} ${s.automationSection}`}>
      <div className={s.container}>
        <Heading
          label="03 / KEEP THE MOMENTUM"
          title="The right follow-up, without the busywork."
          copy="Build a repeatable next step around the moments that matter. Explore how a simple workflow could work for your team."
        />
        <div className={s.automationLayout}>
          <div
            className={s.triggerList}
            role="tablist"
            aria-label="Automation trigger"
            onKeyDown={tabKeyboard}
          >
            {workflows.map((w, i) => (
              <button
                key={w.trigger}
                role="tab"
                id={`trigger-${i}`}
                aria-selected={trigger === i}
                aria-controls="workflow-panel"
                tabIndex={trigger === i ? 0 : -1}
                onClick={() => {
                  setTrigger(i);
                  setRun(-1);
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
            className={s.workflowPanel}
            id="workflow-panel"
            role="tabpanel"
            aria-labelledby={`trigger-${trigger}`}
          >
            <div className={s.panelBar}>
              <span>
                <GitBranch size={16} /> Follow-up workflow
              </span>
              <DemoLabel>Simulation</DemoLabel>
            </div>
            <div className={s.workflowSteps}>
              {workflows[trigger].steps.map((step, i) => (
                <div key={step} className={s.workflowNode} data-done={run >= i}>
                  <span>{run >= i ? <Check size={17} /> : i + 1}</span>
                  <div>
                    <small>{['TRIGGER', 'ACTION', 'NEXT STEP'][i]}</small>
                    <strong>{step}</strong>
                  </div>
                  {i < 2 && <i className={s.workflowConnector} />}
                </div>
              ))}
            </div>
            <div className={s.workflowResult}>
              <p>
                {run === 3
                  ? 'Example complete. No emails were sent or tasks saved.'
                  : workflows[trigger].copy}
              </p>
              <button
                className={s.primary}
                disabled={run >= 0 && run < 3}
                onClick={() => setRun(0)}
              >
                {run >= 0 && run < 3 ? 'Running…' : run === 3 ? 'Replay workflow' : 'Run example'}{' '}
                <Zap size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CubeSection() {
  return (
    <section className={s.cinematic} id="connected-system">
      <div className={s.container}>
        <Label>THE POWER OF CONNECTED THINKING</Label>
        <h2>
          Everything works better
          <br />
          when it works together.
        </h2>
        <StudioVisual kind="cube" />
        <div className={s.cubeCaption}>
          <span>ONE WORKSPACE. MANY MOVING PARTS.</span>
          <p>
            From first interest to a clear next step.
            <br />
            Every detail has its place.
          </p>
          <span>CAPTURE / QUALIFY / CONNECT</span>
        </div>
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
          <StudioVisual kind="fluid" />
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
          <small>AI concept preview · prewritten example, reviewed by you.</small>
        </div>
      </div>
    </section>
  );
}
function Analytics() {
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
      <div className={s.analytics} data-reveal>
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
          <DemoLabel>Illustrative analytics · sample data, not customer results</DemoLabel>
          <Link href="/app/analytics">
            Explore reports <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
function Integrations() {
  const signals = useRef<SVGSVGElement>(null);
  const [paused, setPaused] = useState(false);
  useVisibleSignals(signals, paused);
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
            Explore connection concepts <ArrowUpRight size={16} />
          </Link>
          <p className={s.disclosure}>
            Conceptual connections. Confirm availability before choosing a plan.
          </p>
        </div>
        <div className={s.integrationMap}>
          <svg ref={signals} viewBox="0 0 500 400" aria-hidden="true">
            <path d="M90 60 Q250 60 250 200 T410 340 M410 60 Q250 60 250 200 T90 340 M60 200 H440" />
            {['M90 60 Q250 60 250 200', 'M410 340 Q250 340 250 200', 'M60 200 H250'].map((d, i) => (
              <circle key={d} r="3.5">
                <animateMotion dur="5s" begin={`${i * 1.5}s`} repeatCount="indefinite" path={d} />
              </circle>
            ))}
          </svg>
          <div className={s.integrationHub}>
            <Mark />
            <strong>growora</strong>
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
            copy: 'Turn quote requests into well-prepared conversations, even when you’re busy doing the work.',
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
        <p className={s.pricingNote}>
          Illustrative plans and pricing from the Growora demo. Confirm availability and
          requirements with the team. No payment is taken here.
        </p>
      </div>
    </section>
  );
}
const faqs = [
  [
    'What does Growora do?',
    'Growora brings lead capture, qualification, ownership and next actions into a connected workspace. This website includes an interactive product demonstration so you can explore that journey.',
  ],
  [
    'Who is Growora for?',
    'Service businesses, small sales teams, agencies and consultants who want a clearer way to manage enquiries and move promising conversations forward.',
  ],
  [
    'How does lead management work?',
    'Enquiries become lead records with a source, project context, owner and pipeline stage. In the demo you can explore lead details, change stages and try filters. Saved demo changes stay in your browser.',
  ],
  [
    'What can I automate?',
    'The demo lets you explore example rules for qualification, assignment and follow-up. These workflows simulate actions; they do not send emails or run a background service. Discuss your actual requirements with the team.',
  ],
  [
    'Can I connect my existing tools?',
    'The integration views demonstrate possible connection categories and states. Live external integrations, OAuth and synchronisation are not implemented in this demonstration. Confirm availability before making a decision.',
  ],
  [
    'Is there a free trial? How does pricing work?',
    'You can explore the interactive demo without an account. The Starter, Growth and Scale prices are illustrative and no subscription is created. Choose a plan to discuss your needs; the contact form currently saves a request locally and does not send it.',
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
      <div className={s.closingMotif} aria-hidden="true">
        <i />
        <i />
        <i />
        <span />
      </div>
      <div className={s.container}>
        <Label>YOUR NEXT CHAPTER STARTS WITH A CONVERSATION</Label>
        <h2>
          Give every opportunity
          <br />a better chance.
        </h2>
        <p>A little less friction. A little more forward.</p>
        <Actions />
      </div>
    </section>
  );
}
