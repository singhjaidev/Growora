'use client';
import { useState } from 'react';
import { ArrowUpRight, GripVertical, Search } from 'lucide-react';
import { useLeads } from '@/components/providers';
import { stages, money, type Stage } from '@/lib/domain';
import { LeadDetails } from './leads';
import { AppHeading } from './shell';
export function PipelinePage() {
  const { leads, updateLead } = useLeads();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const [message, setMessage] = useState('');
  const filtered = leads.filter((l) =>
    `${l.name} ${l.company}`.toLowerCase().includes(query.toLowerCase()),
  );
  function move(id: string, status: Stage) {
    const l = leads.find((l) => l.id === id);
    if (!l || l.status === status) return;
    updateLead(id, { status, activity: [...l.activity, `Moved to ${status}`] });
    setMessage(`${l.name} moved to ${status}.`);
  }
  return (
    <>
      <AppHeading
        eyebrow="MAKE THE NEXT MOVE"
        title="Momentum, made visible."
        description="Drag an opportunity forward, or choose its next stage. Changes save automatically."
      >
        <label className="search-field">
          <span className="sr-only">Search pipeline</span>
          <Search />
          <input
            placeholder="Find an opportunity…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </AppHeading>
      <div className="pipeline-board">
        {stages.map((stage, i) => {
          const cards = filtered.filter((l) => l.status === stage);
          return (
            <section
              className={`pipeline-column ${dragOver === stage ? 'drop-active' : ''}`}
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(stage);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                move(e.dataTransfer.getData('text/plain'), stage);
                setDragOver(null);
              }}
              aria-label={`${stage} opportunities`}
            >
              <div className="pipeline-column-heading">
                <div>
                  <span style={{ opacity: 0.5 + i * 0.1 }} />
                  {stage}
                  <small>{cards.length}</small>
                </div>
                <strong>{money(cards.reduce((a, l) => a + l.value, 0))}</strong>
              </div>
              {cards.map((l) => (
                <article
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', l.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => setDragOver(null)}
                  className="kanban-card"
                  key={l.id}
                >
                  <span className="card-company">
                    <GripVertical size={12} />
                    {l.company}
                    <span className="score-chip">{l.score}</span>
                  </span>
                  <button className="pipeline-lead-name" onClick={() => setSelected(l.id)}>
                    {l.name}
                    <ArrowUpRight size={12} />
                  </button>
                  <span className="card-service">{l.service}</span>
                  <div>
                    <b>{money(l.value)}</b>
                    <span className="avatar small-avatar">
                      {l.owner
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <label className="pipeline-stage-control">
                    <span className="sr-only">Move {l.name} to stage</span>
                    <select value={l.status} onChange={(e) => move(l.id, e.target.value as Stage)}>
                      {stages.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
              {!cards.length && (
                <p className="pipeline-empty">A little room for your next opportunity.</p>
              )}
            </section>
          );
        })}
      </div>
      <p className="pipeline-feedback" role="status">
        {message || 'Tip: use each card’s stage selector for keyboard and touch-friendly moves.'}
      </p>
      <LeadDetails
        lead={leads.find((l) => l.id === selected) ?? null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
