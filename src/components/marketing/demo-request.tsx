'use client';
import { useState } from 'react';
import { ArrowUpRight, CheckCheck } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
export function DemoRequest() {
  const [state, setState] = useState<'form' | 'success'>('form');
  const [name, setName] = useState('');
  const [storage, setStorage] = useState(true);
  const [plan, setPlan] = useState('');
  const [draft, setDraft] = useState<Record<string, string>>({});
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setDraft(Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])));
    setName(String(data.name).split(' ')[0]);
    const chosen = new URLSearchParams(window.location.search).get('plan');
    setPlan(chosen && ['starter', 'growth', 'scale'].includes(chosen) ? chosen : '');
    try {
      localStorage.setItem(
        'growora-demo-request',
        JSON.stringify({ ...data, plan: chosen, created: new Date().toISOString() }),
      );
    } catch {
      setStorage(false);
    }
    setState('success');
  }
  if (state === 'success')
    return (
      <div className="request-panel request-success" role="status">
        <CheckCheck size={40} />
        <p className="kicker">YOUR NEXT STEP IS READY</p>
        <h3>Step inside, {name}.</h3>
        <p>
          {storage
            ? 'Your contact request is saved in this browser.'
            : 'Your request was captured for this visit; browser storage is unavailable.'}{' '}
          {plan && `You explored the ${plan} plan. `}Your request stays on this device and was not
          sent and no meeting has been booked. You can explore the workspace now.
        </p>
        <ButtonLink href="/app">Open your workspace</ButtonLink>
        <button className="text-button" style={{ marginTop: 20 }} onClick={() => setState('form')}>
          Edit request
        </button>
      </div>
    );
  return (
    <form className="request-panel" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Name
          <input
            name="name"
            defaultValue={draft.name}
            autoComplete="name"
            placeholder="Your full name"
            required
            maxLength={80}
          />
        </label>
        <label>
          Work email
          <input
            name="email"
            defaultValue={draft.email}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            maxLength={160}
          />
        </label>
        <label>
          Company
          <input
            name="company"
            defaultValue={draft.company}
            autoComplete="organization"
            placeholder="Company name"
            required
            maxLength={100}
          />
        </label>
        <label>
          Website
          <input
            name="website"
            defaultValue={draft.website}
            type="url"
            placeholder="https://yourcompany.com"
            maxLength={200}
          />
        </label>
        <label className="full">
          Monthly lead volume
          <select name="volume" required defaultValue={draft.volume ?? ''}>
            <option value="" disabled>
              Select your monthly volume
            </option>
            <option>Fewer than 50</option>
            <option>50–250</option>
            <option>250–1,000</option>
            <option>1,000+</option>
          </select>
        </label>
        <label className="full">
          What’s your biggest lead challenge?
          <textarea
            name="challenge"
            defaultValue={draft.challenge}
            placeholder="Tell us where good opportunities get stuck…"
            required
            minLength={10}
            maxLength={1000}
          />
        </label>
      </div>
      <button className="button" type="submit">
        Explore your next step
        <ArrowUpRight size={16} />
      </button>
      <p className="micro">
        This workspace saves your request locally. No sales emails, appointments or external
        submissions.
      </p>
    </form>
  );
}
