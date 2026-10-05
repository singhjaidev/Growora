'use client';
import { useState } from 'react';
import { Check, Download, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { useLeads, useLocalState } from '@/components/providers';
import { AppHeading } from './shell';
import { Dialog } from '@/components/ui';
const sections = ['Workspace', 'Team', 'Lead rules', 'Notifications', 'Appearance', 'Data'];
export function SettingsPage() {
  const [tab, setTab] = useState('Workspace');
  const [prefs, setPrefs] = useLocalState('growora-workspace', {
    name: 'Growora workspace',
    timezone: 'Europe/London',
    compact: false,
    notifications: true,
    threshold: 75,
  });
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { leads, reset } = useLeads();
  function update(patch: Partial<typeof prefs>) {
    setPrefs({ ...prefs, ...patch });
    setSaved(false);
    window.dispatchEvent(new Event('growora-preferences'));
  }
  return (
    <>
      <AppHeading
        eyebrow="MAKE THE WORKSPACE YOURS"
        title="A considered setup."
        description="Small preferences that make your process feel like yours."
      >
        <button className="button small" onClick={() => setSaved(true)}>
          {saved ? <Check size={14} /> : <Save size={14} />}{' '}
          {saved ? 'Saved locally' : 'Save changes'}
        </button>
      </AppHeading>
      <div className="settings-layout">
        <nav aria-label="Settings sections">
          {sections.map((s) => (
            <button
              className={tab === s ? 'active' : ''}
              aria-pressed={tab === s}
              key={s}
              onClick={() => {
                setTab(s);
                setSaved(false);
              }}
            >
              {s}
            </button>
          ))}
        </nav>
        <div className="settings-panel">
          <h2>{tab}</h2>
          {tab === 'Workspace' ? (
            <>
              <p>Your workspace identity and local display preferences.</p>
              <label>
                Workspace name
                <input
                  value={prefs.name}
                  maxLength={45}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </label>
              <label>
                Preferred timezone
                <select
                  value={prefs.timezone}
                  onChange={(e) => update({ timezone: e.target.value })}
                >
                  <option>Europe/London</option>
                  <option>Asia/Kolkata</option>
                  <option>America/New_York</option>
                  <option>UTC</option>
                </select>
              </label>
              <p className="timezone-preview">
                Example appointment: {new Intl.DateTimeFormat('en-GB', {
                  dateStyle: 'medium', timeStyle: 'short', timeZone: prefs.timezone,
                }).format(new Date('2026-09-28T09:00:00Z'))} ({prefs.timezone}).
                Reporting charts use UTC day boundaries.
              </p>
              <div className="settings-note">
                <ShieldCheck size={17} />
                <span>
                  Preferences are stored in this browser. This demo has no account, billing or
                  authentication service.
                </span>
              </div>
            </>
          ) : tab === 'Team' ? (
            <>
              <p>A fictional team illustrates ownership and routing.</p>
              {[
                ['Jamie Demo', 'Workspace admin', 'JD'],
                ['Jamie Lee', 'Sales owner', 'JL'],
                ['Sam Carter', 'Sales owner', 'SC'],
              ].map(([name, role, initials]) => (
                <div className="team-row" key={name}>
                  <span className="avatar">{initials}</span>
                  <div>
                    <strong>{name}</strong>
                    <span>{role}</span>
                  </div>
                  <span className="status">Demo member</span>
                </div>
              ))}
              <p className="settings-note">
                Invitations and real member access are not part of this local demonstration.
              </p>
            </>
          ) : tab === 'Lead rules' ? (
            <>
              <p>
                Model your preferred high-intent threshold. This preview rule is separate from the
                fixed homepage scoring demonstration.
              </p>
              <label>
                High-intent threshold
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={prefs.threshold}
                  onChange={(e) =>
                    update({ threshold: Math.max(0, Math.min(100, Number(e.target.value))) })
                  }
                />
              </label>
              <div className="rule-preview">
                <strong>{leads.filter((l) => l.score >= prefs.threshold).length}</strong>
                <span>workspace leads meet a score of {prefs.threshold} or higher.</span>
              </div>
              <div className="settings-note">
                Homepage scoring uses its documented rule set. Automation thresholds can be edited
                within each flow.
              </div>
            </>
          ) : tab === 'Notifications' ? (
            <>
              <p>
                Choose whether to show the workspace activity indicator. No emails or push
                notifications are sent.
              </p>
              <label className="toggle-setting">
                <span>
                  <strong>Activity indicator</strong>
                  <small>Show new activity in the workspace header.</small>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.notifications}
                  onChange={(e) => update({ notifications: e.target.checked })}
                />
              </label>
            </>
          ) : tab === 'Appearance' ? (
            <>
              <p>Warm paper, precise rules, and a cobalt signal keep the focus on your work.</p>
              <div className="appearance-preview">
                <span />
                <span />
                <span />
                <span />
                <strong>Paper / ink / cobalt</strong>
              </div>
              <label className="toggle-setting">
                <span>
                  <strong>Compact table density</strong>
                  <small>Show more leads in the available space.</small>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.compact}
                  onChange={(e) => update({ compact: e.target.checked })}
                />
              </label>
            </>
          ) : (
            <>
              <p>Take a copy of your demonstration leads or restore the original sample dataset.</p>
              <div className="data-action">
                <div>
                  <h3>Export workspace leads</h3>
                  <p>Download {leads.length} records as JSON.</p>
                </div>
                <button
                  className="button small secondary"
                  onClick={() => {
                    const url = URL.createObjectURL(
                      new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' }),
                    );
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'growora-workspace.json';
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={14} />
                  Export
                </button>
              </div>
              <div className="data-action">
                <div>
                  <h3>Restore sample leads</h3>
                  <p>Remove local leads, notes and pipeline changes.</p>
                </div>
                <button className="button small secondary" onClick={() => setConfirm(true)}>
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
              <div className="settings-note">
                To remove all data including forms, preferences and demo requests, clear this site’s
                browser storage.
              </div>
            </>
          )}
        </div>
      </div>
      <Dialog title="Restore the sample leads?" open={confirm} onClose={() => setConfirm(false)}>
        <p>
          This replaces your local leads, notes and pipeline changes with the original 20 fictional
          sample records. Export your workspace first if you want to keep a copy.
        </p>
        <div className="dialog-actions">
          <button className="button small secondary" onClick={() => setConfirm(false)}>
            Keep my data
          </button>
          <button
            className="button small"
            onClick={() => {
              reset();
              setConfirm(false);
              setSaved(true);
            }}
          >
            Restore sample leads
          </button>
        </div>
      </Dialog>
    </>
  );
}
