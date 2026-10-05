'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { sampleLeads } from '@/data/demo';
import { stages, type Lead } from '@/lib/domain';
import { insertLead } from '@/lib/lead-store';
type Store = {
  leads: Lead[];
  ready: boolean;
  notice: string;
  activeLeadId: string | null;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  reset: () => void;
};
const Context = createContext<Store | null>(null);
const KEY = 'growora-leads-v1';
function valid(data: unknown): data is Lead[] {
  return (
    Array.isArray(data) &&
    data.every(
      (l) =>
        l &&
        typeof l.id === 'string' &&
        typeof l.name === 'string' &&
        typeof l.email === 'string' &&
        typeof l.company === 'string' &&
        typeof l.service === 'string' &&
        typeof l.budget === 'string' &&
        typeof l.timeline === 'string' &&
        typeof l.source === 'string' &&
        typeof l.owner === 'string' &&
        typeof l.created === 'string' &&
        Number.isFinite(Date.parse(l.created)) &&
        typeof l.notes === 'string' &&
        typeof l.score === 'number' &&
        Number.isFinite(l.score) &&
        typeof l.value === 'number' &&
        Number.isFinite(l.value) &&
        stages.includes(l.status) &&
        Array.isArray(l.activity) &&
        l.activity.every((entry: unknown) => typeof entry === 'string'),
    )
  );
}
export function Providers({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const records = useRef<Lead[]>([]);
  const hydrated = useRef(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let initial = sampleLeads;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (valid(parsed)) initial = parsed;
        else setNotice('Saved demo data could not be read. Sample data has been restored.');
      }
    } catch {
      setNotice('Browser storage is unavailable. Changes will last for this visit.');
    }
    records.current = initial;
    setLeads(initial);
    hydrated.current = true;
    setReady(true);
  }, []);
  const commit = useCallback((next: Lead[]) => {
    if (!hydrated.current || next === records.current) return;
    // Persist in the event, before presentation timers or route changes. No effects/updater writes.
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      setNotice('Browser storage is unavailable. Changes will last for this visit.');
    }
    records.current = next;
    setLeads(next);
  }, []);
  const addLead = useCallback((lead: Lead) => {
    if (!hydrated.current) return;
    commit(insertLead(records.current, lead));
    setActiveLeadId(lead.id);
  }, [commit]);
  const updateLead = useCallback(
    (id: string, patch: Partial<Lead>) =>
      commit(
        records.current.map((l) => (l.id === id ? { ...l, ...patch, id: l.id, updated: new Date().toISOString() } : l)),
      ),
    [commit],
  );
  return (
    <Context.Provider
      value={{ leads, ready, notice, activeLeadId, addLead, updateLead, reset: () => { commit(sampleLeads); setActiveLeadId(null); } }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLeads() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing Growora provider');
  return value;
}
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setReady(true);
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string; value: T }>).detail;
      if (detail?.key === key)
        setValue((prev) =>
          JSON.stringify(prev) === JSON.stringify(detail.value) ? prev : detail.value,
        );
    };
    window.addEventListener('growora-local-change', sync);
    return () => window.removeEventListener('growora-local-change', sync);
  }, [key]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent('growora-local-change', { detail: { key, value } }));
      } catch {}
  }, [value, key, ready]);
  return [value, setValue, ready] as const;
}
