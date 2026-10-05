'use client';
import { useLeads } from '@/components/providers';
import { ButtonLink, ScoreMeter, SectionTitle } from '@/components/ui';
import { qualify, nextAction } from '@/lib/domain';

export function OpportunityPreview() {
  const { leads, activeLeadId, ready } = useLeads();
  const lead = leads.find((record) => record.id === activeLeadId) ?? leads[0];
  return (
    <section className="section container opportunity-preview">
      <SectionTitle
        number="04"
        kicker="FROM CAPTURE TO CONVERSATION"
        title="The context comes with it."
        description="One record, from your website to your team's next conversation."
      />
      {!ready ? (
        <div className="workspace-loading" role="status">
          Loading your workspace…
          <div />
          <div />
        </div>
      ) : lead ? (
        <div className="opportunity-desk">
          <div className="desk-caption">
            <span>
              {activeLeadId === lead.id ? 'YOUR CAPTURED LEAD' : 'LATEST WORKSPACE RECORD'}
            </span>
            <span>{leads.length} records in this browser</span>
          </div>
          <div className="desk-record">
            <ScoreMeter score={lead.score} />
            <div>
              <h3>{lead.name}</h3>
              <p>{lead.company}</p>
              <span>
                {lead.status} · {lead.owner}
              </span>
            </div>
          </div>
          <dl>
            <div>
              <dt>Selected route</dt>
              <dd>{qualify(lead).route}</dd>
            </div>
            <div>
              <dt>Next action</dt>
              <dd>{nextAction(lead)}</dd>
            </div>
          </dl>
          <ButtonLink href={`/app/leads?highlight=${lead.id}`}>Open this opportunity</ButtonLink>
        </div>
      ) : (
        <p>No leads yet. Capture your first enquiry above.</p>
      )}
    </section>
  );
}
