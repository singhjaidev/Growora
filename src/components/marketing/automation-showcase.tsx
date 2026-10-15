'use client';
import { useState } from 'react';
import { ArrowRight, Check, Play } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { evaluateFlow, sampleEnquiry } from '@/lib/automation-flow';

export function AutomationShowcase() {
  const [threshold, setThreshold] = useState('2000');
  const [tested, setTested] = useState(false);
  const passes = evaluateFlow('high-value', threshold, sampleEnquiry);
  return (
    <section className="section container automation-showcase" id="automation">
      <div>
        <p className="kicker">05 / A PROCESS YOU CAN EXPLAIN</p>
        <h2>
          A little logic.
          <br />
          <span className="muted">A clear direction.</span>
        </h2>
        <p>
          Give routine decisions a repeatable path. Change the condition and see exactly where an
          enquiry goes.
        </p>
        <ButtonLink href="/app/automations" secondary>
          Build your workflow
        </ButtonLink>
      </div>
      <div className="execution-preview">
        <div className="execution-input">
          <span className="kicker">01 / CAPTURE</span>
          <strong>Website enquiry</strong>
          <span>budget · £7,500</span>
        </div>
        <ArrowRight className="execution-arrow" size={22} />
        <div className="execution-condition">
          <span className="kicker">02 / DECIDE</span>
          <label>
            Budget must exceed (£)
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
                setTested(false);
              }}
            />
          </label>
          <button className="button small" onClick={() => setTested(true)}>
            <Play size={14} />
            Test this condition
          </button>
        </div>
        <div className="execution-result" role="status">
          {tested ? (
            <>
              <Check size={20} />
              <div>
                <strong>{passes ? 'YES · Priority route' : 'NO · Nurture route'}</strong>
                <p>
                  {passes
                    ? 'Assign an owner → Prepare a response → Schedule a reminder.'
                    : 'Keep the enquiry in the nurture queue for a helpful resource.'}
                </p>
                <small>Test complete. No messages sent.</small>
              </div>
            </>
          ) : (
            <p>
              Run the sample to reveal its next step. Try a threshold of £10,000 to see the other
              route.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
