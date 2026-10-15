'use client';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, MoreHorizontal, Zap } from 'lucide-react';
import { useId, useState } from 'react';
import { useLeads } from '@/components/providers';
import { metrics, money, stages, type Lead } from '@/lib/domain';
import { reportingWindow, inReportingWindow, windowLabel, percentage } from '@/lib/reporting';
import { Logo, SectionTitle } from '@/components/ui';
export function VolumeChart({
  range = '30',
  large = false,
  records,
  window: suppliedWindow,
}: {
  range?: string;
  large?: boolean;
  records?: Lead[];
  window?: ReturnType<typeof reportingWindow>;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId().replaceAll(':', '');
  const window = suppliedWindow ?? reportingWindow(records ?? [], Number(range));
  const dates = Array.from(
    { length: window.days },
    (_, i) => new Date(window.start + i * 86400000),
  );
  const visibleRecords = records ? inReportingWindow(records, window) : undefined;
  const data = records
    ? dates.map(
        (date) =>
          visibleRecords!.filter(
            (l) =>
              Date.parse(l.created) <
              Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
          ).length,
      )
    : range === '7'
      ? [2, 4, 1, 3, 5, 2, 3]
      : [
          1, 3, 2, 4, 2, 3, 5, 3, 4, 3, 6, 4, 5, 4, 7, 5, 8, 6, 7, 6, 9, 7, 8, 6, 9, 8, 11, 9, 10,
          12,
        ];
  const maximum = Math.max(3, ...data);
  const scale = 144 / maximum;
  const points = data
    .map((v, i) => `${30 + i * (660 / (data.length - 1))},${190 - v * scale}`)
    .join(' ');
  return (
    <div className={`volume-chart ${large ? 'large' : ''}`}>
      <svg
        viewBox="0 0 720 225"
        role="img"
        aria-label={`${records ? 'Cumulative captured leads' : 'lead volume'} over ${range} days. ${data.join(', ')}.`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2b49ae" stopOpacity=".1" />
            <stop offset="100%" stopColor="#2b49ae" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[46, 94, 142, 190].map((y, i) => (
          <g key={y}>
            <line x1="30" x2="690" y1={y} y2={y} stroke="#25332920" strokeWidth=".7" />
            <text x="4" y={y + 4} fill="#879189" fontSize="10">
              {Math.round(maximum * (1 - i / 3))}
            </text>
          </g>
        ))}
        <polygon points={`30,190 ${points} 690,190`} fill={`url(#${gradientId})`} />
        <polyline
          className="chart-line"
          points={points}
          fill="none"
          stroke="#2b49ae"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {data.map((v, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <title>{`${dates[i].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}: ${v} ${records ? 'captured leads' : 'sample signals'}`}</title>
            <rect
              x={19 + i * (660 / (data.length - 1))}
              y="20"
              width={range === '7' ? 70 : 24}
              height="175"
              fill="transparent"
            />
            <circle
              cx={30 + i * (660 / (data.length - 1))}
              cy={190 - v * scale}
              r={hover === i ? 4 : 0}
              fill="#2b49ae"
            />
            {hover === i && (
              <g>
                <rect
                  x={Math.min(632, Math.max(20, 10 + i * (660 / (data.length - 1))))}
                  y={Math.max(5, 153 - v * scale)}
                  width="65"
                  height="25"
                  rx="4"
                  fill="#263633"
                />
                <text
                  x={Math.min(638, Math.max(26, 16 + i * (660 / (data.length - 1))))}
                  y={Math.max(21, 169 - v * scale)}
                  fill="#e9f2e9"
                  fontSize="10"
                >
                  {v} {records ? 'leads' : 'signals'}
                </text>
              </g>
            )}
          </g>
        ))}
        {['01 SEP', '07 SEP', '14 SEP', '21 SEP', '26 SEP'].map((d, i) => (
          <text key={d} x={30 + i * 158} y="218" fill="#879189" fontSize="9">
            {records
              ? dates[Math.round((i * (dates.length - 1)) / 4)]
                  .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
                  .toUpperCase()
              : range === '7'
                ? ['MON', 'TUE', 'THU', 'SAT', 'SUN'][i]
                : d}
          </text>
        ))}
      </svg>
      <details className="chart-data">
        <summary>View chart data</summary>
        <table>
          <thead>
            <tr>
              <th>Date (UTC)</th>
              <th>{records ? 'Cumulative leads' : 'Sample signals'}</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((date, i) => (
              <tr key={date.toISOString()}>
                <td>{date.toLocaleDateString('en-GB', { timeZone: 'UTC' })}</td>
                <td>{data[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <span className="micro chart-caption">
        {records ? 'CUMULATIVE WORKSPACE LEADS' : 'DAILY LEAD TREND'}
      </span>
    </div>
  );
}
export function Dashboard({ preview = false }: { preview?: boolean }) {
  const { leads: allLeads, ready } = useLeads();
  const [range, setRange] = useState('30');
  const window = reportingWindow(allLeads, Number(range));
  const leads = inReportingWindow(allLeads, window);
  const sources = Array.from(new Set(leads.map((lead) => lead.source)));
  const m = metrics(leads);
  const sourceColors = ['#2b49ae', '#879aaf', '#aa8e64', '#b8bcb6', '#ddd2b8'];
  let sourceOffset = 0;
  const sourceStops = sources
    .map((source, i) => {
      const start = sourceOffset;
      sourceOffset +=
        (leads.filter((l) => l.source === source).length / Math.max(1, leads.length)) * 100;
      return `${sourceColors[i % sourceColors.length]} ${start}% ${sourceOffset}%`;
    })
    .join(',');
  if (!ready)
    return (
      <div className="workspace-loading" role="status">
        Loading your workspace…
        <div />
        <div />
        <div />
      </div>
    );
  return (
    <div className={`dashboard ${preview ? 'preview-dashboard' : ''}`}>
      <div className="dashboard-title">
        <div>
          <p className="micro">YOUR GROWTH, IN FOCUS</p>
          <h3>
            {preview ? 'A good day to grow.' : 'Workspace overview'}
            <span className="lime"> ↗</span>
          </h3>
          <p>{windowLabel(window)} · Based on the latest workspace record.</p>
        </div>
        <label className="date-select">
          <span className="sr-only">Date range</span>
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="30">Last 30 days</option>
            <option value="7">Last 7 days</option>
          </select>
          <ChevronDown size={13} />
        </label>
      </div>
      <div className="metrics-grid">
        {[
          ['Leads captured', String(m.count), 'Selected reporting period'],
          ['Qualified leads', String(m.qualified), 'Score of 75 or higher'],
          ['Pipeline value', money(m.value), 'Open opportunities'],
          ['Conversion rate', `${m.conversion}%`, 'Won / captured'],
        ].map(([label, value, sub], i) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>
              <i className={i === 2 ? 'cyan-dot' : 'live-dot'} />
              {sub}
            </small>
          </div>
        ))}
      </div>
      <div className="action-register">
        <div>
          <span className="kicker">NEXT CONVERSATIONS</span>
          <h4>Give ready leads your attention.</h4>
        </div>
        <div>
          {allLeads
            .filter((l) => l.score >= 75 && ['New', 'Qualified'].includes(l.status))
            .slice(0, 3)
            .map((l) => (
              <Link key={l.id} href={`/app/leads?highlight=${l.id}`}>
                <span>
                  {l.name}
                  <small>{l.company}</small>
                </span>
                <strong>{l.score}</strong>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          {!allLeads.some((l) => l.score >= 75 && ['New', 'Qualified'].includes(l.status)) && (
            <p>No high-intent leads waiting for a first conversation.</p>
          )}
        </div>
      </div>
      <div className="dashboard-body">
        <div className="chart-panel">
          <div className="panel-heading">
            <h4>Lead growth</h4>
            <span>
              <i className="live-dot" /> Captured signals
            </span>
          </div>
          <VolumeChart range={range} records={leads} window={window} />
        </div>
        <div className="source-panel">
          <div className="panel-heading">
            <h4>Lead sources</h4>
            <ArrowDownLeft size={16} />
          </div>
          <div
            className="source-donut"
            style={{ background: leads.length ? `conic-gradient(${sourceStops})` : '#253120' }}
          >
            <div>
              <strong>{leads.length}</strong>
              <span>LEADS</span>
            </div>
          </div>
          <div className="source-legend">
            {sources.map((source, i) => {
              const count = leads.filter((l) => l.source === source).length;
              return count ? (
                <div key={source}>
                  <span>
                    <i
                      style={{
                        background: sourceColors[i % sourceColors.length],
                      }}
                    />
                    {source}
                  </span>
                  <b>{Math.round((count / leads.length) * 100)}%</b>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
      <div className="dashboard-lower">
        <div className="recent-panel">
          <div className="panel-heading">
            <h4>Recent opportunities</h4>
            <Link href="/app/leads">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 4).map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link href={`/app/leads?highlight=${l.id}`} className="lead-person">
                        <span className="avatar">
                          {l.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </span>
                        <span>
                          {l.name}
                          <small>{l.company}</small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <span className="score-chip">{l.score}</span>
                    </td>
                    <td>
                      <span className={`stage-tag ${l.status.toLowerCase()}`}>{l.status}</span>
                    </td>
                    <td>{money(l.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="pipeline-mini">
          <div className="panel-heading">
            <h4>Pipeline snapshot</h4>
            <MoreHorizontal size={17} />
          </div>
          {stages.map((stage, i) => (
            <div className="mini-stage" key={stage}>
              <span>{stage}</span>
              <div>
                <i
                  style={{
                    width: `${percentage(leads.filter((l) => l.status === stage).length, leads.length)}%`,
                    opacity: 0.4 + i * 0.15,
                  }}
                />
              </div>
              <b>{leads.filter((l) => l.status === stage).length}</b>
            </div>
          ))}
          <Link className="automation-active" href="/app/automations">
            <Zap size={15} />
            <span>Explore your automation flows</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
export function DashboardPreview() {
  const { leads } = useLeads();
  return (
    <section className="section container">
      <SectionTitle
        number="03"
        kicker="THE BIG PICTURE"
        title="Less tab-hopping. More forward."
        description="Your leads, conversations and next steps. Finally working together."
      />
      <div className="product-window">
        <div className="window-chrome">
          <span className="workspace-caption">G / WORKSPACE</span>
          <span>Your opportunity desk</span>
          <span>
            <i className="live-dot" /> workspace
          </span>
        </div>
        <div className="preview-layout">
          <aside>
            <Logo />
            <div className="preview-workspace">
              G{' '}
              <span>
                Growora workspace<small>Your connected workspace</small>
              </span>
            </div>
            {['Overview', 'Leads', 'Pipeline', 'Automations', 'Forms', 'Analytics'].map(
              (item, i) => (
                <Link
                  className={i === 0 ? 'active' : ''}
                  key={item}
                  href={i === 0 ? '/app' : `/app/${item.toLowerCase()}`}
                >
                  <span>{['◫', '⊙', '▥', '⌘', '▤', '↗'][i]}</span>
                  {item}
                  {i === 1 && <small>{leads.length}</small>}
                </Link>
              ),
            )}
            <span className="preview-bottom">YOUR PIPELINE, CONNECTED</span>
          </aside>
          <Dashboard preview />
        </div>
      </div>
      <div className="under-window">
        <span>
          <i className="live-dot" /> Not a screenshot. A real working workspace.
        </span>
        <Link href="/app">
          Step inside the workspace <ArrowUpRight size={15} />
        </Link>
      </div>
    </section>
  );
}
