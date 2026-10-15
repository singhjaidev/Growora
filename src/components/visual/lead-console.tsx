import { ArrowUpRight, Check, ArrowRight, Clock3 } from 'lucide-react';
import { storyLead } from '@/lib/lead-story';

/** Composed for small screens and devices without WebGL. No miniature routing diagram. */
export function LeadConsole({ stage, story }: { stage: number; story: boolean }) {
  const view = story ? stage : 5;
  return (
    <div className="console-fallback" data-view={view}>
      <div className="console-shadow" />
      <div className="console-assembly">
        <div className="console-underlay">
          <span>CONTEXT / INTENT / NEXT STEP</span>
        </div>
        <div className="console-glass">
          <i />
          <i />
          <i />
        </div>
        <div className="console-face">
          <div className="console-topline">
            <span>
              <i /> growora
            </span>
            <small>
              {story
                ? [
                    'New enquiry',
                    'Qualification',
                    'Intent score',
                    'Assigned owner',
                    'Next actions',
                    'Opportunity',
                  ][view]
                : 'Opportunity intelligence'}
            </small>
            <span>↗</span>
          </div>
          <div className="console-person">
            <div className="console-avatar">AM</div>
            <div>
              <strong>Alex Morgan</strong>
              <span>Northline Studio</span>
            </div>
            <span className="console-status">{view === 0 ? 'New lead' : 'Qualified'}</span>
          </div>
          {view === 0 && (
            <div className="console-message">
              <small>WEBSITE ENQUIRY</small>
              <p>“We’re ready for a website that moves our business forward.”</p>
              <span>
                Website redesign <ArrowUpRight size={14} />
              </span>
            </div>
          )}
          {view === 1 && (
            <div className="console-context">
              {[
                ['Project', 'Website redesign'],
                ['Budget', '£5,000–£10,000'],
                ['Timeline', 'Within 30 days'],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <Check size={15} />
                </div>
              ))}
            </div>
          )}
          {(view === 2 || view === 5) && (
            <div className="console-insight">
              <div className="console-gauge">
                <strong>{storyLead.score}</strong>
                <small>INTENT SCORE</small>
              </div>
              <div>
                {view === 5 ? (
                  <>
                    <small>QUALIFIED OPPORTUNITY</small>
                    <strong>
                      £7,500<span>Website redesign</span>
                    </strong>
                    <span className="console-owner">
                      <i>JL</i> Jamie Lee <ArrowUpRight size={13} />
                    </span>
                  </>
                ) : (
                  <>
                    <small>HIGH INTENT</small>
                    <div className="console-breakdown">
                      Budget <b>+35</b>
                      <br />
                      Timing <b>+21</b>
                      <br />
                      Company <b>+5</b>
                      <br />
                      Base <b>30</b>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {view === 3 && (
            <div className="console-assignment">
              <i>JL</i>
              <strong>Jamie Lee</strong>
              <span>Priority sales · Score ≥ 75</span>
              <div>
                <Check size={14} /> Owner assigned <ArrowRight size={14} />
              </div>
            </div>
          )}
          {view === 4 && (
            <div className="console-actions">
              <div>
                <Check />
                <span>
                  <strong>First response prepared</strong>
                  <small>Ready for the conversation</small>
                </span>
              </div>
              <div>
                <Clock3 />
                <span>
                  <strong>Follow up in 1 day</strong>
                  <small>Remind Jamie if no reply</small>
                </span>
              </div>
            </div>
          )}
          <div className="console-bottomline">
            <span>
              <i />{' '}
              {view === 0
                ? 'Context captured'
                : view === 4
                  ? 'Nothing sent'
                  : 'Ready for the next step'}
            </span>
            <small>G / 001</small>
          </div>
        </div>
      </div>
    </div>
  );
}
