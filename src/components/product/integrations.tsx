'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, Plug, Search } from 'lucide-react';
import { integrations } from '@/data/demo';
import { useLocalState } from '@/components/providers';
import { Dialog } from '@/components/ui';
export function IntegrationDirectory({ app = false }: { app?: boolean }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [connected, setConnected] = useLocalState<string[]>('growora-connections', []);
  const shown = integrations.filter(
    (i) =>
      (category === 'All' || i.category === category) &&
      `${i.name} ${i.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="integration-notice">
        <Plug size={20} />
        <p>
          These are integration settings.{' '}
          {app
            ? 'Connection controls save a local workspace state.'
            : 'Explore how Growora could fit into your existing workflow.'}{' '}
          No external accounts are connected and no data is sent.
        </p>
      </div>
      <div className="integration-toolbar">
        <label className="search-field">
          <span className="sr-only">Search integrations</span>
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find your tools…"
          />
        </label>
        <div className="category-filters" aria-label="Integration categories">
          {[
            'All',
            'CRM',
            'Communication',
            'Calendar',
            'Email',
            'Marketing',
            'Automation',
            'Webhooks',
          ].map((c) => (
            <button
              key={c}
              className={category === c ? 'active' : ''}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="integration-grid">
        {shown.map((i) => (
          <article className="integration-card" key={i.name}>
            <div className="integration-card-top">
              <span className="integration-symbol">{i.symbol}</span>
              <span className="micro">{i.category.toUpperCase()}</span>
            </div>
            <h3>{i.name}</h3>
            <p>{i.description}</p>
            <button className="text-button" onClick={() => setSelected(i.name)}>
              {app
                ? connected.includes(i.name)
                  ? 'Connection configured'
                  : 'Configure connection'
                : 'Explore connection'}
              {connected.includes(i.name) ? <Check size={14} /> : <ArrowUpRight size={14} />}
            </button>
          </article>
        ))}
        {shown.length === 0 && (
          <div className="empty-state">
            <h3>No tools match that signal.</h3>
            <p>Try another search or category.</p>
            <button
              className="text-button"
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`${selected ?? 'Integration'} connection`}
      >
        <p>
          This connection illustrates how lead information could move between Growora and {selected}
          . A production connection would require authentication, scoped permissions and a secure
          server integration.
        </p>
        <div className="integration-modal-details">
          <span>Connection type</span>
          <strong>Connection settings</strong>
          <span>Data transferred</span>
          <strong>None</strong>
          <span>Proposed events</span>
          <strong>Lead qualified · Stage changed</strong>
        </div>
        <div className="dialog-actions">
          <button className="button secondary small" onClick={() => setSelected(null)}>
            Close
          </button>
          {app && (
            <button
              className="button small"
              onClick={() => {
                if (selected)
                  setConnected(
                    connected.includes(selected)
                      ? connected.filter((n) => n !== selected)
                      : [...connected, selected],
                  );
                setSelected(null);
              }}
            >
              {selected && connected.includes(selected) ? 'Disconnect' : 'Save connection settings'}
            </button>
          )}
        </div>
      </Dialog>
    </>
  );
}
