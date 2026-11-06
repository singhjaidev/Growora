'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import s from '@/components/dashboard/dashboard.module.css';
type Settings = {
  workspaces: { id: string; name: string }[];
  forms: { id: string; workspaceId: string; name: string; publicId: string }[];
  version: number;
  connected: boolean;
  workspaceId: string;
  formId: string;
  canManage: boolean;
};
export function DestinationSettings() {
  const [data, setData] = useState<Settings | null>(null),
    [workspace, setWorkspace] = useState(''),
    [form, setForm] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function load() {
    const r = await fetch('/api/marketing/settings');
    const result = await r.json();
    if (!r.ok) throw Error(result.message || 'Unable to load website settings.');
    setData(result);
    setWorkspace(result.workspaceId || result.workspaces[0]?.id || '');
    setForm(result.formId);
  }
  useEffect(() => {
    let active = true;
    fetch('/api/marketing/settings')
      .then(async (r) => {
        const v = await r.json();
        if (!active) return;
        if (!r.ok) {
          setMessage(v.message);
          return;
        }
        setData(v);
        setWorkspace(v.workspaceId || v.workspaces[0]?.id || '');
        setForm(v.formId);
      })
      .catch(() => {
        if (active) setMessage('Unable to load website settings. Reload to retry.');
      });
    return () => {
      active = false;
    };
  }, []);
  async function save(disconnect = false) {
    if (pending.current || !data) return;
    pending.current = true;
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/marketing/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: data.version,
          workspaceId: disconnect ? null : workspace,
          formId: disconnect ? null : form,
        }),
      });
      const v = await r.json();
      if (!r.ok) throw Error(v.message || 'Unable to save.');
      await load();
      setMessage(disconnect ? 'Website enquiries disconnected.' : 'Website enquiries connected.');
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : 'Unable to save. Reload settings before retrying.',
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <section className={s.panel}>
      <h2>Marketing Website Enquiries</h2>
      <p>
        Choose where the main website sends customer enquiries. Only an authorized site owner who
        owns the workspace can connect it.
      </p>
      {data && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <p>Status: {data.connected ? 'Connected' : 'Not connected'}</p>
          {!data.canManage && (
            <p>
              The current destination belongs to another owner. It must be disconnected by an
              authorized owner of that workspace.
            </p>
          )}
          <label>
            Receiving workspace
            <select
              value={workspace}
              disabled={busy || !data.canManage}
              onChange={(e) => {
                setWorkspace(e.target.value);
                setForm('');
              }}
            >
              <option value="">Select a workspace</option>
              {data.workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Published enquiry form
            <select
              value={form}
              disabled={busy || !data.canManage}
              required
              onChange={(e) => setForm(e.target.value)}
            >
              <option value="">Select a published form</option>
              {data.forms
                .filter((f) => f.workspaceId === workspace)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </select>
          </label>
          <p>
            The form�s privacy notice and review period are shown to visitors. Confirm that they
            describe this website�s use of their details.
          </p>
          <div className={s.actions}>
            <button className={s.primary} disabled={busy || !form || !data.canManage}>
              {busy ? 'Saving…' : 'Connect'}
            </button>
            <button
              type="button"
              disabled={busy || !data.connected || !data.canManage}
              onClick={() => void save(true)}
            >
              Disconnect
            </button>
          </div>
          <Link href="/dashboard/lead-forms">Manage enquiry forms</Link>
        </form>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
