'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import { useLeads } from '@/components/providers';
import { ButtonLink, SectionTitle, ScoreMeter } from '@/components/ui';
import { createLead, qualify, nextAction, type LeadInput } from '@/lib/domain';
const steps = [
  'Lead captured',
  'Analyzing responses',
  'Qualifying intent',
  'Calculating score',
  'Selecting route',
];
export function LeadCapture({ compact = false }: { compact?: boolean }) {
  const { addLead, notice, ready, leads } = useLeads();
  const [phase, setPhase] = useState(-1);
  const [resultId, setResultId] = useState<string | null>(null);
  const result = leads.find((lead) => lead.id === resultId);
  const submitted = useRef(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (resultId && phase === -1) resultHeading.current?.focus({ preventScroll: true });
  }, [resultId, phase]);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || submitted.current || !event.currentTarget.reportValidity()) return;
    submitted.current = true;
    const data = Object.fromEntries(new FormData(event.currentTarget)) as LeadInput;
    const lead = createLead(data);
    addLead(lead);
    setResultId(lead.id);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setPhase(0);
    let index = 0;
    timer.current = setInterval(() => {
      index++;
      if (index === steps.length) {
        if (timer.current) clearInterval(timer.current);
        setPhase(-1);
      } else setPhase(index);
    }, 450);
  }
  return (
    <section
      id="lead-demo"
      className={compact ? 'capture-standalone' : 'section container capture-section'}
    >
      {!compact && (
        <SectionTitle
          number="03"
          kicker="MEET YOUR NEXT OPPORTUNITY"
          title="Not every enquiry is equal."
          description="Send a signal. Watch Growora find the intent behind it. Then follow your lead into the workspace."
        />
      )}
      <div className="capture-grid">
        <div className="capture-story">
          <span className="small-label">CAPTURE YOUR NEXT OPPORTUNITY</span>
          <h3>
            A little context.
            <br /> A much smarter
            <br /> <span>next step.</span>
          </h3>
          <p>
            A project budget, a timeline, a clear need. Turn the details you already collect into a
            route your team can act on.
          </p>
          <div className="capture-rule">
            <ShieldCheck size={19} />
            <span>
              Your workspace stays in this browser.
              <br />
              No emails sent. No account required.
            </span>
          </div>
          <div className="rule-example">
            <span>
              01 <i /> PROJECT FIT
            </span>
            <span>
              02 <i /> BUDGET SIGNAL
            </span>
            <span>
              03 <i /> TIMING & INTENT
            </span>
          </div>
        </div>
        <div className="capture-panel">
          <div className="panel-top">
            <span>
              <i className="live-dot" /> SMART CAPTURE
            </span>
            <span>LEAD CAPTURE</span>
          </div>
          {result && phase === -1 ? (
            <div className="lead-result" aria-live="polite">
              <span className="result-check">
                <Check />
              </span>
              <p className="kicker">CAPTURED · QUALIFIED · ROUTED</p>
              <h3 ref={resultHeading} tabIndex={-1}>
                Your lead. A clear next step.
              </h3>
              <div className="score-result">
                <ScoreMeter score={result.score} />
                <div>
                  <span className="result-priority">
                    {qualify(result).priority} priority · {result.status}
                  </span>
                  <h4>{result.name}</h4>
                  <p>{result.company}</p>
                </div>
              </div>
              <dl className="result-details">
                <div>
                  <dt>Project</dt>
                  <dd>{result.service}</dd>
                </div>
                <div>
                  <dt>Route</dt>
                  <dd>{qualify(result).route}</dd>
                </div>
                <div>
                  <dt>Suggested action</dt>
                  <dd>{nextAction(result)}</dd>
                </div>
              </dl>
              <ButtonLink href={`/app/leads?highlight=${result.id}`}>
                View lead in dashboard
              </ButtonLink>
              <button
                className="text-button"
                onClick={() => {
                  setResultId(null);
                  submitted.current = false;
                }}
              >
                <RotateCcw size={14} />
                Try another lead
              </button>
              {notice && <p role="status">{notice}</p>}
            </div>
          ) : phase >= 0 ? (
            <div className="processing" role="status" aria-live="polite">
              <h3>Finding the opportunity.</h3>
              <p>Your lead is captured. Reviewing its score and route.</p>
              {steps.map((step, i) => (
                <div className={`process-step ${phase >= i ? 'active' : ''}`} key={step}>
                  <span>{phase > i ? <Check size={15} /> : String(i + 1).padStart(2, '0')}</span>
                  {step}
                  {phase === i && <i className="live-dot" />}
                </div>
              ))}
              {result && (
                <ButtonLink href={`/app/leads?highlight=${result.id}`}>
                  Open captured lead
                </ButtonLink>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="lead-form">
              <div className="form-grid">
                <label>
                  Name
                  <input
                    name="name"
                    placeholder="Alex Morgan"
                    autoComplete="name"
                    required
                    maxLength={80}
                  />
                </label>
                <label>
                  Company
                  <input
                    name="company"
                    placeholder="Northline Studio"
                    autoComplete="organization"
                    required
                    maxLength={100}
                  />
                </label>
                <label className="full">
                  Work email
                  <input
                    name="email"
                    type="email"
                    placeholder="alex@yourcompany.com"
                    autoComplete="email"
                    required
                    maxLength={160}
                  />
                </label>
                <label className="full">
                  What can we help with?
                  <select name="service" defaultValue="Website redesign">
                    <option>Website redesign</option>
                    <option>Lead generation</option>
                    <option>Marketing strategy</option>
                    <option>Sales automation</option>
                  </select>
                </label>
                <label>
                  Project budget
                  <select name="budget" defaultValue="£5,000–£10,000">
                    <option>Under £2,000</option>
                    <option>£2,000–£5,000</option>
                    <option>£5,000–£10,000</option>
                    <option>£10,000+</option>
                  </select>
                </label>
                <label>
                  Timeline
                  <select name="timeline" defaultValue="Within 30 days">
                    <option>Within 30 days</option>
                    <option>1–3 months</option>
                    <option>Just exploring</option>
                  </select>
                </label>
              </div>
              <button className="button" type="submit" disabled={!ready}>
                {ready ? 'Qualify this lead' : 'Loading your workspace…'} <ArrowUpRight size={16} />
              </button>
              <p className="micro">CLEAR, RULE-BASED SCORING</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
