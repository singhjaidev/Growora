'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, ArrowUpRight, Check, Download, Mail, Plus, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLeads } from '@/components/providers';
import { AppHeading } from './shell';
import { Dialog, ScoreMeter } from '@/components/ui';
import { LeadCapture } from '@/components/product/lead-capture';
import { money, qualify, nextAction, stages, type Lead, type Stage } from '@/lib/domain';
export function LeadDetails({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const { updateLead } = useLeads();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setNote(lead?.notes ?? '');
  }, [lead?.id, lead?.notes]);
  useEffect(() => {
    setSaved(false);
  }, [lead?.id]);
  return (
    <Dialog open={!!lead} onClose={onClose} title="Opportunity details" wide>
      {lead && (
        <>
          <div className="lead-detail-identity">
            <span className="avatar">
              {lead.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
            <div>
              <h2>{lead.name}</h2>
              <p>{lead.company}</p>
              <span>
                <Mail size={12} />
                {lead.email}
              </span>
            </div>
            <ScoreMeter score={lead.score} />
          </div>
          <div className="lead-detail-grid">
            <div>
              <p className="kicker">QUALIFICATION</p>
              <dl className="result-details">
                {[
                  ['Service', lead.service],
                  ['Budget', lead.budget],
                  ['Timeline', lead.timeline],
                  ['Estimated value', money(lead.value)],
                  ['Source', lead.source],
                  ['Owner', lead.owner],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <label>
                Pipeline stage
                <select
                  value={lead.status}
                  onChange={(e) =>
                    updateLead(lead.id, {
                      status: e.target.value as Stage,
                      activity: [...lead.activity, `Moved to ${e.target.value}`],
                    })
                  }
                >
                  {stages.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <div className="next-action">
                <ArrowUpRight size={18} />
                <div>
                  <small>SUGGESTED NEXT STEP</small>
                  <strong>{nextAction(lead)}</strong>
                </div>
              </div>
            </div>
            <div>
              <p className="kicker">ACTIVITY TIMELINE</p>
              <div className="lead-timeline">
                {lead.activity.map((activity, i) => (
                  <div key={`${activity}-${i}`}>
                    <i />
                    <span>
                      {activity}
                      <small>
                        {i === 0
                          ? new Date(lead.created).toLocaleDateString('en-GB')
                          : 'Workspace activity'}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
              <label>
                Notes
                <textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="Add context for the next conversation…"
                  maxLength={2000}
                />
              </label>
              <button
                className="button small"
                onClick={() => {
                  updateLead(lead.id, { notes: note });
                  setSaved(true);
                }}
              >
                {saved ? (
                  <>
                    <Check size={14} />
                    Note saved
                  </>
                ) : (
                  'Save note'
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}
export function LeadsPage() {
  const { leads, ready } = useLeads();
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [score, setScore] = useState('All');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const arrival = useRef<HTMLDivElement>(null);
  const revealed = useRef<string | null>(null);
  const highlightedLead = ready ? leads.find((lead) => lead.id === highlight) : undefined;
  useEffect(() => {
    if (!ready || !highlight || revealed.current === highlight) return;
    revealed.current = highlight;
    arrival.current?.focus({ preventScroll: true });
    arrival.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [ready, highlight]);
  const filtered = useMemo(
    () =>
      leads
        .filter(
          (l) =>
            `${l.name} ${l.company} ${l.email}`.toLowerCase().includes(query.toLowerCase()) &&
            (status === 'All' || l.status === status) &&
            (score === 'All' || (score === 'high' ? l.score >= 75 : l.score < 75)),
        )
        .sort((a, b) =>
          sort === 'newest' && a.id === highlight
            ? -1
            : sort === 'newest' && b.id === highlight
              ? 1
              : sort === 'score'
                ? b.score - a.score
                : sort === 'value'
                  ? b.value - a.value
                  : sort === 'name'
                    ? a.name.localeCompare(b.name)
                    : Date.parse(b.created) - Date.parse(a.created),
        ),
    [leads, query, status, score, sort, highlight],
  );
  function exportCSV() {
    const header = ['Name', 'Company', 'Email', 'Score', 'Status', 'Value', 'Source', 'Owner'];
    const escape = (v: string | number) =>
      `"${String(v)
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""')}"`;
    const body = filtered.map((l) =>
      [l.name, l.company, l.email, l.score, l.status, l.value, l.source, l.owner]
        .map(escape)
        .join(','),
    );
    const blob = new Blob([[header.join(','), ...body].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'growora-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <AppHeading
        eyebrow="YOUR OPPORTUNITY DIRECTORY"
        title="Every lead. In the loop."
        description="The context you need, the next step that matters."
      >
        <div className="heading-actions">
          <button className="button small secondary" onClick={exportCSV}>
            <Download size={14} />
            Export
          </button>
          <button className="button small" onClick={() => setAdding(true)}>
            <Plus size={15} />
            Add lead
          </button>
        </div>
      </AppHeading>
      {highlight && ready && (
        <div className="lead-arrival" ref={arrival} tabIndex={-1} aria-label="Selected lead">
          {highlightedLead ? (
            <>
              <ScoreMeter score={highlightedLead.score} />
              <div className="arrival-identity">
                <p className="kicker">YOUR SELECTED LEAD</p>
                <h2>{highlightedLead.name}</h2>
                <p>
                  {highlightedLead.company} · {highlightedLead.email}
                </p>
                <span>
                  {highlightedLead.status} · {highlightedLead.owner}
                </span>
              </div>
              <div className="arrival-route">
                <strong>{qualify(highlightedLead).route}</strong>
                <span>{nextAction(highlightedLead)}</span>
              </div>
              <button
                className="button small secondary"
                onClick={() => setSelected(highlightedLead.id)}
              >
                View details <ArrowUpRight size={14} />
              </button>
            </>
          ) : (
            <p role="status">
              This lead is no longer in this browser’s workspace. Search the records below or
              capture a new lead.
            </p>
          )}
        </div>
      )}
      <div className="leads-summary">
        <span>
          <b>{leads.length}</b> total leads
        </span>
        <span>
          <b>{leads.filter((l) => l.score >= 75).length}</b> high-intent opportunities
        </span>
        <span>
          <b>{money(leads.reduce((a, l) => a + l.value, 0))}</b> total estimated value
        </span>
      </div>
      <div className="leads-filters">
        <label className="search-field">
          <span className="sr-only">Search leads</span>
          <Search />
          <input
            placeholder="Search name, company or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Filter status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All stages</option>
            {stages.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter score</span>
          <select value={score} onChange={(e) => setScore(e.target.value)}>
            <option value="All">All scores</option>
            <option value="high">High intent · 75+</option>
            <option value="low">Nurture · below 75</option>
          </select>
        </label>
        <label className="sort-control">
          <ArrowDownUp size={13} />
          <span className="sr-only">Sort leads</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="score">Highest score</option>
            <option value="value">Highest value</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>
      <div className="leads-table-panel">
        <div className="table-wrap">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Company</th>
                <th>Score</th>
                <th>Status</th>
                <th>Value</th>
                <th>Source</th>
                <th>Owner</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className={l.id === highlight ? 'highlight-lead' : ''}>
                  <td>
                    <button className="lead-person" onClick={() => setSelected(l.id)}>
                      <span className="avatar">
                        {l.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                      <span>
                        {l.name}
                        <small>{l.email}</small>
                      </span>
                    </button>
                  </td>
                  <td>{l.company}</td>
                  <td>
                    <span className="score-chip">
                      {l.score}
                      <i style={{ width: `${l.score}%` }} />
                    </span>
                  </td>
                  <td>
                    <span className={`stage-tag ${l.status.toLowerCase()}`}>{l.status}</span>
                  </td>
                  <td>{money(l.value)}</td>
                  <td>{l.source}</td>
                  <td>{l.owner}</td>
                  <td>
                    <span className="activity-date">
                      {new Date(l.updated ?? l.created).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <h3>No leads match these filters.</h3>
            <p>Try a broader search to find your next opportunity.</p>
            <button
              className="text-button"
              onClick={() => {
                setQuery('');
                setStatus('All');
                setScore('All');
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        <div className="table-footer">
          <span>
            Showing {filtered.length} of {leads.length} leads
          </span>
          <span>Sample and locally created records</span>
        </div>
      </div>
      <LeadDetails
        lead={leads.find((l) => l.id === selected) ?? null}
        onClose={() => setSelected(null)}
      />
      <Dialog title="Capture a new opportunity" open={adding} onClose={() => setAdding(false)} wide>
        <LeadCapture compact />
      </Dialog>
    </>
  );
}
