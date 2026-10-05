'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useLeads } from '@/components/providers';
import { money, metrics, stages } from '@/lib/domain';
import { VolumeChart } from '@/components/product/dashboard';
import { reportingWindow, inReportingWindow, windowLabel, percentage } from '@/lib/reporting';
import { AppHeading } from './shell';
export function AnalyticsPage() {
  const { leads } = useLeads();
  const [range, setRange] = useState('30');
  const window = reportingWindow(leads, Number(range));
  const filtered = inReportingWindow(leads, window);
  const m = metrics(filtered);
  const won = filtered.filter((l) => l.status === 'Won').length;
  const proposal = filtered.filter((l) => ['Proposal', 'Won'].includes(l.status)).length;
  const qualified = filtered.filter((l) => l.status !== 'New').length;
  const funnel = [
    ['Captured', filtered.length],
    ['Qualified', qualified],
    ['Proposal', proposal],
    ['Won', won],
  ] as [string, number][];
  return (
    <>
      <AppHeading
        eyebrow="UNDERSTAND THE SIGNAL"
        title="A clearer picture of growth."
        description="Follow the journey, find the friction, and see where opportunities begin."
      >
        <label className="analytics-range">
          Reporting period
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="30">Last 30 days</option>
            <option value="7">Last 7 days</option>
          </select>
        </label>
      </AppHeading>
      <p className="reporting-note">
        {windowLabel(window)} · UTC · Based on the latest workspace record.
      </p>
      <div className="analytics-kpis">
        {[
          ['Captured', m.count],
          ['High-intent', m.qualified],
          ['Open pipeline', money(m.value)],
          ['Won rate', `${m.conversion}%`],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Selected reporting period</small>
          </div>
        ))}
      </div>
      <div className="analytics-main-grid">
        <section className="chart-panel">
          <div className="panel-heading">
            <h4>Captured leads over time</h4>
            <span>
              <i className="live-dot" /> Captured leads
            </span>
          </div>
          <VolumeChart range={range} large records={filtered} window={window} />
        </section>
        <section className="funnel-panel">
          <div className="panel-heading">
            <h4>The conversion journey</h4>
            <span>WORKSPACE COHORT</span>
          </div>
          <div className="funnel">
            {funnel.map(([label, count], i) => (
              <div key={label}>
                <span>
                  {label}
                  <strong>{count}</strong>
                </span>
                <div
                  style={{
                    width: `${percentage(count, filtered.length)}%`,
                    opacity: 0.35 + i * 0.15,
                  }}
                />
              </div>
            ))}
          </div>
          <p className="micro">
            Share of captured records currently at or beyond each stage. This is a snapshot, not
            historical conversion tracking.
          </p>
        </section>
      </div>
      <div className="analytics-secondary-grid">
        <section className="source-performance">
          <div className="panel-heading">
            <h4>Where opportunity begins</h4>
            <span>Source performance</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Leads</th>
                  <th>High intent</th>
                  <th>Won</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(filtered.map((l) => l.source))).map((source) => {
                  const rows = filtered.filter((l) => l.source === source);
                  return (
                    <tr key={source}>
                      <td>
                        <i className="live-dot" />
                        {source}
                      </td>
                      <td>{rows.length}</td>
                      <td>{rows.filter((l) => l.score >= 75).length}</td>
                      <td>{rows.filter((l) => l.status === 'Won').length}</td>
                      <td>{money(rows.reduce((a, l) => a + l.value, 0))}</td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5}>No leads in this reporting period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="stage-value">
          <div className="panel-heading">
            <h4>Value by stage</h4>
            <span>Share of total value · GBP</span>
          </div>
          {stages.map((stage, i) => {
            const value = filtered
              .filter((l) => l.status === stage)
              .reduce((a, l) => a + l.value, 0);
            return (
              <div className="value-bar" key={stage}>
                <div>
                  <span>{stage}</span>
                  <strong>{money(value)}</strong>
                </div>
                <div>
                  <i
                    style={{
                      width: `${percentage(
                        value,
                        filtered.reduce((a, l) => a + l.value, 0),
                      )}%`,
                      opacity: 0.4 + i * 0.15,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </section>
      </div>
      <div className="analytics-insight">
        <span className="settings-icon">
          <ArrowUpRight size={24} />
        </span>
        <div>
          <h3>Turn the numbers into a next step.</h3>
          <p>
            {m.qualified} high-intent leads in this view. Open the lead directory to see who needs a
            conversation.
          </p>
        </div>
        <Link className="button secondary small" href="/app/leads">
          Review opportunities <ArrowUpRight size={14} />
        </Link>
      </div>
    </>
  );
}
