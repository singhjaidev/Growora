'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, GitBranch } from 'lucide-react';
import { ButtonLink, SectionTitle, tabKeyboard, ScoreMeter } from '@/components/ui';
import { useLeads } from '@/components/providers';
import { money, stages, type Stage } from '@/lib/domain';
import { storyStages, storyChapters, storyLead } from '@/lib/lead-story';
import { percentage } from '@/lib/reporting';
import { integrations } from '@/data/demo';

export function Problem() {
  const [organized, setOrganized] = useState(false);
  return (
    <section className="section container problem-section">
      <div className="problem-text">
        <p className="kicker">01 / CLOSE THE GAP</p>
        <h2>
          Interest moves fast.
          <br />
          <span className="muted">Give it a direction.</span>
        </h2>
        <p>
          The enquiry is only the beginning. Keep its context, its owner and its next step together.
        </p>
        <button
          className="text-button"
          aria-pressed={organized}
          onClick={() => setOrganized(!organized)}
        >
          {organized ? 'See the inbox view' : 'Bring some order'}
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="intake-ledger">
        <div className="ledger-heading">
          <span>{organized ? 'AN OPPORTUNITY DESK' : 'AN ORDINARY INBOX'}</span>
          <span>3 enquiries · illustrative</span>
        </div>
        {[
          ['Website redesign', 'Budget confirmed', 'Jamie · Discovery call'],
          ['Project proposal', 'Scope ready', 'Sam · Review proposal'],
          ['New consultation', 'Exploring options', 'Team · Share a guide'],
        ].map(([name, context, action], i) => (
          <div className="ledger-row" key={name}>
            <span>0{i + 1}</span>
            <div>
              <strong>{name}</strong>
              <small>
                {organized ? context : ['2 hours ago', 'Follow-up missed', 'Unassigned'][i]}
              </small>
            </div>
            <span className={organized ? 'ledger-assigned' : ''}>
              {organized ? action : 'Awaiting a next step'}
            </span>
          </div>
        ))}
        <p role="status">
          {organized
            ? 'Every enquiry has context and a clear owner.'
            : 'Three conversations waiting for someone to take the lead.'}
        </p>
      </div>
    </section>
  );
}
export function Workflow() {
  const [active, setActive] = useState(0);
  return (
    <section className="section container product-journey" id="workflow">
      <SectionTitle
        number="01"
        kicker="ONE CONNECTED JOURNEY"
        title="Six steps. One clear next move."
        description="Explore the same enquiry from capture to a qualified opportunity."
      />
      <div
        className="journey-tabs"
        role="tablist"
        aria-label="Lead journey"
        onKeyDown={tabKeyboard}
      >
        {storyStages.map((stage, i) => (
          <button
            key={stage}
            id={`product-stage-${i}`}
            role="tab"
            aria-selected={active === i}
            aria-controls="product-stage-panel"
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
          >
            <span>0{i + 1}</span>
            {stage}
          </button>
        ))}
      </div>
      <div
        className="product-stage-panel"
        id="product-stage-panel"
        role="tabpanel"
        aria-labelledby={`product-stage-${active}`}
      >
        <div>
          <p className="kicker">{storyStages[active]}</p>
          <h3>{storyChapters[active].title}</h3>
          <p>{storyChapters[active].description}</p>
        </div>
        <div className="product-specimen">
          <span className="micro">ILLUSTRATIVE OPPORTUNITY</span>
          <h3>{storyLead.name}</h3>
          <p>
            {storyLead.company} · {storyLead.service}
          </p>
          <ScoreMeter score={storyLead.score} />
          <strong>{storyChapters[active].receipt}</strong>
        </div>
      </div>
    </section>
  );
}
export function PipelineSection() {
  const { leads, activeLeadId, updateLead, ready } = useLeads();
  const lead = leads.find((l) => l.id === activeLeadId) ?? leads[0];
  const [message, setMessage] = useState('');
  function move(status: Stage) {
    if (!lead || lead.status === status) return;
    updateLead(lead.id, { status, activity: [...lead.activity, `Moved to ${status}`] });
    setMessage(`${lead.name} moved to ${status}. Saved to this workspace.`);
  }
  return (
    <section className="section container pipeline-section">
      <SectionTitle
        number="06"
        kicker="PROGRESS YOU CAN SEE"
        title="A next step, at every stage."
        description="Follow one opportunity. Move it when the conversation moves."
      />
      {!ready ? (
        <p role="status">Loading your workspace…</p>
      ) : lead ? (
        <div className="opportunity-rail">
          <div className="rail-identity">
            <div>
              <span className="kicker">
                {activeLeadId === lead.id ? 'YOUR CAPTURED LEAD' : 'LATEST WORKSPACE RECORD'}
              </span>
              <h3>{lead.name}</h3>
              <p>
                {lead.company} · {lead.owner}
              </p>
            </div>
            <strong>{money(lead.value)}</strong>
          </div>
          <ol>
            {stages.map((stage, i) => (
              <li
                key={stage}
                aria-current={lead.status === stage ? 'step' : undefined}
                className={lead.status === stage ? 'current' : ''}
              >
                <span>0{i + 1}</span>
                <strong>{stage}</strong>
                <small>
                  {
                    [
                      'Review the context',
                      'Confirm the fit',
                      'Start a conversation',
                      'Make an offer',
                      'Plan the handover',
                    ][i]
                  }
                </small>
              </li>
            ))}
          </ol>
          <div className="rail-controls">
            <label>
              Move this opportunity
              <select value={lead.status} onChange={(e) => move(e.target.value as Stage)}>
                {stages.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>
            <ButtonLink secondary href={`/app/leads?highlight=${lead.id}`}>
              Open opportunity
            </ButtonLink>
          </div>
          <p role="status">{message || 'Only your explicit stage changes update this record.'}</p>
        </div>
      ) : (
        <p>Capture a lead to start your pipeline.</p>
      )}
      <div className="under-window">
        <span>Your changes stay connected across the demo.</span>
        <Link href="/app/pipeline">
          See the full pipeline <ArrowUpRight size={15} />
        </Link>
      </div>
    </section>
  );
}
export function AnalyticsSection() {
  const { leads } = useLeads();
  const waiting = leads.filter(
    (l) => l.score >= 75 && ['New', 'Qualified'].includes(l.status),
  ).length;
  return (
    <section className="section container analytics-marketing">
      <div>
        <p className="kicker">07 / SIGNAL, NOT NOISE</p>
        <h2>
          Know where you stand.
          <br />
          <span className="muted">See where to go.</span>
        </h2>
        <p>
          {waiting} high-intent {waiting === 1 ? 'opportunity needs' : 'opportunities need'} a first
          conversation. Turn a useful signal into a useful action.
        </p>
        <ButtonLink href="/app/analytics" secondary>
          Explore your insights
        </ButtonLink>
      </div>
      <div className="stage-distribution">
        <div className="panel-heading">
          <h4>Your pipeline, right now</h4>
          <span>{leads.length} records</span>
        </div>
        {stages.map((stage) => {
          const count = leads.filter((l) => l.status === stage).length;
          return (
            <div key={stage}>
              <span>
                {stage}
                <strong>{count}</strong>
              </span>
              <div>
                <i style={{ width: `${percentage(count, leads.length)}%` }} />
              </div>
            </div>
          );
        })}
        <p className="micro">SHARE OF WORKSPACE RECORDS · LIVE LOCAL DATA</p>
      </div>
    </section>
  );
}
const industries = [
  {
    name: 'Agencies',
    problem: 'Great projects get buried under enquiries that aren’t a fit.',
    source: 'New project enquiry',
    qualify: 'Project type · Budget · Urgency',
    action: 'Priority consultation',
    detail:
      'Spot the projects your team is built for. Route qualified prospects to discovery and guide early-stage enquiries toward useful resources.',
  },
  {
    name: 'Real estate',
    problem: 'The right enquiry needs the right local agent.',
    source: 'Property website enquiry',
    qualify: 'Property type · Budget · Location',
    action: 'Assign the right agent',
    detail:
      'Capture what buyers are looking for, then match the enquiry with the person who knows the area.',
  },
  {
    name: 'Home services',
    problem: 'Quote requests arrive while the team is out on a job.',
    source: 'Quote request',
    qualify: 'Job type · Postcode · Timing',
    action: 'Arrange a site visit',
    detail:
      'Collect the job details first, flag urgent requests, and keep the next conversation focused.',
  },
  {
    name: 'Consultants',
    problem: 'Discovery time is valuable. Context makes it count.',
    source: 'Consultation enquiry',
    qualify: 'Challenge · Scope · Timeline',
    action: 'Book a discovery call',
    detail: 'Understand the challenge before the first call and keep potential engagements moving.',
  },
  {
    name: 'Healthcare / clinics',
    problem: 'Appointment enquiries need a clear administrative next step.',
    source: 'Appointment enquiry',
    qualify: 'Service · Timing · Contact',
    action: 'Booking follow-up',
    detail:
      'Organize appointment requests without collecting sensitive health information or making clinical decisions.',
  },
  {
    name: 'Professional services',
    problem: 'Different enquiries need different specialists.',
    source: 'Website enquiry',
    qualify: 'Service · Scope · Deadline',
    action: 'Route to a specialist',
    detail:
      'Build a consistent intake process that gives the right specialist the context they need.',
  },
];
export function SolutionsSelector({ full = false }: { full?: boolean }) {
  const [index, setIndex] = useState(0);
  const item = industries[index];
  return (
    <section className={full ? 'solutions-full' : 'section container'}>
      {!full && (
        <SectionTitle
          number="08"
          kicker="YOUR BUSINESS. YOUR FLOW."
          title="Built around how you work."
        />
      )}
      <div className="solutions-layout">
        <div
          className="industry-list"
          role="tablist"
          aria-label="Industries"
          onKeyDown={tabKeyboard}
        >
          {industries.map((industry, i) => (
            <button
              key={industry.name}
              role="tab"
              aria-selected={i === index}
              tabIndex={i === index ? 0 : -1}
              aria-controls="industry-panel"
              id={`industry-${i}`}
              onClick={() => setIndex(i)}
            >
              <span>0{i + 1}</span>
              {industry.name}
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
        <div
          className="industry-panel"
          id="industry-panel"
          role="tabpanel"
          aria-labelledby={`industry-${index}`}
        >
          <p className="kicker">GROWORA FOR {item.name.toUpperCase()}</p>
          <h3>{item.problem}</h3>
          <p>{item.detail}</p>
          <div className="industry-flow">
            {[item.source, item.qualify, item.action].map((t, i) => (
              <div key={t}>
                <span>{['01 / SOURCE', '02 / QUALIFICATION', '03 / ACTION'][i]}</span>
                <strong>{t}</strong>
                {i < 2 && <ArrowRight size={18} />}
              </div>
            ))}
          </div>
          <div className="industry-automation">
            <GitBranch size={17} />
            <span>
              Example rule: when the enquiry is qualified, assign an owner and prepare a response.
            </span>
          </div>
          <Link href="/demo">
            Try this journey <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
export function IntegrationUniverse() {
  return (
    <section className="section container integration-universe">
      <div className="integration-copy">
        <p className="kicker">09 / PART OF YOUR ECOSYSTEM</p>
        <h2>
          One connected flow.
          <br />
          <span className="muted">Your familiar tools.</span>
        </h2>
        <p>
          Designed to connect with the tools your team already uses. Explore the integration
          concepts.
        </p>
        <ButtonLink href="/integrations" secondary>
          Explore integrations
        </ButtonLink>
        <span className="micro">CONCEPTUAL CONNECTIONS · NO LIVE SYNC</span>
      </div>
      <div className="connection-register">
        {integrations.slice(0, 6).map((item) => (
          <Link href="/integrations" key={item.name}>
            <span className="connection-symbol">{item.symbol}</span>
            <strong>{item.name}</strong>
            <span>Explore concept</span>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </div>
    </section>
  );
}
export function Pricing({ detailed = false }: { detailed?: boolean }) {
  const [annual, setAnnual] = useState(false);
  return (
    <section className={detailed ? 'pricing-full' : 'section container pricing-section'}>
      {!detailed && (
        <SectionTitle
          number="10"
          kicker="ROOM TO GROW"
          title="A plan for your next chapter."
          description="Start focused. Build momentum. Scale your process."
        />
      )}
      <div className="pricing-top">
        <span className="micro">ILLUSTRATIVE PRICING · NO CHECKOUT OR CHARGES</span>
        <div className="segmented" aria-label="Billing period">
          <button
            aria-pressed={!annual}
            className={!annual ? 'active' : ''}
            onClick={() => setAnnual(false)}
          >
            Monthly
          </button>
          <button
            aria-pressed={annual}
            className={annual ? 'active' : ''}
            onClick={() => setAnnual(true)}
          >
            Yearly <span>−20%</span>
          </button>
        </div>
      </div>
      <div className="pricing-grid">
        {[
          {
            name: 'Starter',
            price: 29,
            desc: 'Give every enquiry a better beginning.',
            features: [
              '250 leads / month',
              '3 smart capture forms',
              'Lead scoring & pipeline',
              '1 workspace member',
            ],
          },
          {
            name: 'Growth',
            price: 79,
            desc: 'Turn a good process into your advantage.',
            features: [
              '2,000 leads / month',
              'Unlimited capture forms',
              'Custom automation flows',
              '5 workspace members',
            ],
          },
          {
            name: 'Scale',
            price: 179,
            desc: 'More volume. The same clear direction.',
            features: [
              '10,000 leads / month',
              'Advanced routing rules',
              'Multiple team pipelines',
              '20 workspace members',
            ],
          },
        ].map((plan, i) => (
          <div className={`price-column ${i === 1 ? 'featured' : ''}`} key={plan.name}>
            <div className="plan-title">
              <span>{plan.name}</span>
              {i === 1 && <small>BUILT FOR MOMENTUM</small>}
            </div>
            <p>{plan.desc}</p>
            <div className="price">
              <strong>£{Math.round(plan.price * (annual ? 0.8 : 1))}</strong>
              <span>/ month</span>
            </div>
            <small className="billing-copy">
              {annual
                ? `£${Math.round(plan.price * 0.8) * 12} billed yearly`
                : 'Billed monthly · illustrative plan'}
            </small>
            <ButtonLink href={`/demo?plan=${plan.name.toLowerCase()}`} secondary={i !== 1}>
              Explore {plan.name}
            </ButtonLink>
            <ul>
              {plan.features.map((f) => (
                <li key={f}>
                  <Check size={15} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {detailed && (
        <>
          <div className="comparison-table table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Make the process yours</th>
                  <th>Starter</th>
                  <th>Growth</th>
                  <th>Scale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Smart capture', '3 forms', 'Unlimited', 'Unlimited'],
                  ['Rule-based scoring', 'Included', 'Custom rules', 'Custom rules'],
                  ['Automation', '2 flows', '20 flows', 'Unlimited'],
                  ['Workspace members', '1', '5', '20'],
                  ['Pipeline views', '1', '3', 'Unlimited'],
                  ['Analytics', 'Overview', 'Source breakdown', 'Team breakdown'],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((v, i) => (i === 0 ? <th key={v}>{v}</th> : <td key={i}>{v}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="faq">
            <h3>A few good questions.</h3>
            {[
              [
                'Is this a live paid product?',
                'Growora is an interactive portfolio demonstration. Prices are illustrative. There is no checkout, subscription or payment collection.',
              ],
              [
                'What happens to the data I enter?',
                'Demo leads and workspace changes stay in your browser. No external service receives your form submissions.',
              ],
              [
                'Can I try every plan?',
                'Every demo workspace has the same interactive capabilities. Plan choices illustrate a possible commercial model.',
              ],
              [
                'Do integrations send real data?',
                'No. Integration controls demonstrate connection states only. No OAuth, email delivery or external sync is implemented.',
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span>+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
export function Philosophy() {
  return (
    <section className="philosophy container">
      <span className="kicker">THE GROWORA PHILOSOPHY</span>
      <h2>
        Every lead deserves
        <br />
        <span>a next step.</span>
        <span className="philosophy-arrow">↗</span>
      </h2>
      <div>
        <span className="philosophy-index">G / 01</span>
        <p>
          A form submission shouldn’t be the end of a journey.
          <br />
          It should be the beginning of a clear process.
        </p>
        <Link href="/about">
          The thinking behind Growora <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
