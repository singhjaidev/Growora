'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import { SectionTitle } from '@/components/ui';
type Destination = {
  publicId: string;
  version: number;
  destinationVersion: number;
  privacyNotice: string;
  retentionDays: number | null;
};
export function LeadCapture({ compact = false }: { compact?: boolean }) {
  const [form, setForm] = useState<Destination | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  const inFlight = useRef(false),
    key = useRef(''),
    lastBody = useRef(''),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/marketing/enquiry')
      .then(async (r) => {
        const value = await r.json();
        if (!active) return;
        if (!r.ok) {
          setError(value.message || 'Website enquiries are unavailable.');
          return;
        }
        setForm(value);
      })
      .catch(() => {
        if (active) setError('Unable to load enquiry details. Reload to retry.');
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (done) heading.current?.focus({ preventScroll: true });
  }, [done]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || inFlight.current || !event.currentTarget.reportValidity()) return;
    const d = new FormData(event.currentTarget);
    const body = JSON.stringify({
      formVersion: form.version,
      customerName: d.get('name'),
      customerEmail: d.get('email'),
      subject: d.get('service'),
      message: [
        'Company: ' + d.get('company'),
        'Project budget: ' + d.get('budget'),
        'Timeline: ' + d.get('timeline'),
      ].join('\n'),
      company: d.get('website') || '',
      consent: d.get('consent') === 'on',
    });
    if (lastBody.current !== body) {
      key.current = crypto.randomUUID();
      lastBody.current = body;
    }
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/marketing/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': key.current,
          'X-Marketing-Form': form.publicId,
          'X-Marketing-Version': String(form.destinationVersion),
        },
        body,
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.message || 'Unable to save your enquiry.');
      if (result.ok !== true) throw Error('Could not confirm your submission. Please retry.');
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not confirm your submission. Please retry; unchanged details are saved only once.',
      );
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  return (
    <section
      id="lead-demo"
      className={compact ? 'capture-standalone' : 'section container capture-section'}
    >
      {!compact && (
        <SectionTitle
          number="03"
          kicker="MEET YOUR NEXT OPPORTUNITY"
          title="Not every enquiry is equal."
          description="Share your requirements with the Growora team. Your enquiry is saved securely for authorized team members to review."
        />
      )}
      <div className="capture-grid">
        <div className="capture-story">
          <span className="small-label">CAPTURE YOUR NEXT OPPORTUNITY</span>
          <h3>
            A little context.
            <br /> A much smarter
            <br /> <span>next step.</span>
          </h3>
          <p>
            A project budget, a timeline, a clear need. Turn the details you already collect into a
            route your team can act on.
          </p>
          <div className="capture-rule">
            <ShieldCheck size={19} />
            <span>
              Your details are stored for authorized team members.
              <br />
              No account required to enquire.
            </span>
          </div>
          <div className="rule-example">
            <span>
              01 <i /> PROJECT FIT
            </span>
            <span>
              02 <i /> BUDGET SIGNAL
            </span>
            <span>
              03 <i /> TIMING &amp; INTENT
            </span>
          </div>
        </div>
        <div className="capture-panel">
          <div className="panel-top">
            <span>
              <i className="live-dot" /> SMART CAPTURE
            </span>
            <span>LEAD CAPTURE</span>
          </div>
          {done ? (
            <div className="lead-result" aria-live="polite">
              <span className="result-check">
                <Check />
              </span>
              <p className="kicker">ENQUIRY SAVED</p>
              <h3 ref={heading} tabIndex={-1}>
                Your enquiry has been received.
              </h3>
              <p>
                Authorized team members can now review your requirements. No AI score or automatic
                response is promised.
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setDone(false);
                  key.current = '';
                  lastBody.current = '';
                }}
              >
                <RotateCcw size={14} />
                Send another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="lead-form" aria-busy={busy}>
              <div className="form-grid">
                <label>
                  Name
                  <input
                    name="name"
                    placeholder="Alex Morgan"
                    autoComplete="name"
                    required
                    maxLength={80}
                  />
                </label>
                <label>
                  Company
                  <input
                    name="company"
                    placeholder="Northline Studio"
                    autoComplete="organization"
                    required
                    maxLength={100}
                  />
                </label>
                <label className="full">
                  Work email
                  <input
                    name="email"
                    type="email"
                    placeholder="alex@yourcompany.com"
                    autoComplete="email"
                    required
                    maxLength={160}
                  />
                </label>
                <label className="full">
                  What can we help with?
                  <select name="service" defaultValue="Website redesign">
                    <option>Website redesign</option>
                    <option>Lead generation</option>
                    <option>Marketing strategy</option>
                    <option>Sales automation</option>
                  </select>
                </label>
                <label>
                  Project budget
                  <select name="budget" defaultValue="£5,000–£10,000">
                    <option>Under £2,000</option>
                    <option>£2,000–£5,000</option>
                    <option>£5,000–£10,000</option>
                    <option>£10,000+</option>
                  </select>
                </label>
                <label>
                  Timeline
                  <select name="timeline" defaultValue="Within 30 days">
                    <option>Within 30 days</option>
                    <option>1–3 months</option>
                    <option>Just exploring</option>
                  </select>
                </label>
              </div>

              <div hidden aria-hidden="true">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              {form && (
                <>
                  <p className="micro">
                    {form.privacyNotice}
                    {form.retentionDays
                      ? ` Review scheduled after ${form.retentionDays} days.`
                      : ''}
                  </p>
                  <label>
                    <input type="checkbox" name="consent" required disabled={busy} /> I acknowledge
                    this use of my information.
                  </label>
                </>
              )}
              {error && <p role="alert">{error}</p>}
              <button className="button" type="submit" disabled={!form || busy}>
                {busy ? 'Sending enquiry…' : 'Send enquiry'} <ArrowUpRight size={16} />
              </button>
              <p className="micro">STORED SECURELY FOR TEAM REVIEW</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
