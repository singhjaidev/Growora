'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, GitBranch, Mail, Timer, Zap } from 'lucide-react';
import { AutomationEditor } from '@/components/product/automation';
import { AppHeading } from './shell';
import { useLocalState } from '@/components/providers';
function FlowStatus({ id }: { id: string }) {
  const [enabled] = useLocalState(`growora-automation-enabled-${id}`, true);
  return <span className="flow-list-status">{enabled ? 'Enabled' : 'Paused'}</span>;
}
const flows = [
  {
    id: 'high-value',
    name: 'High-value lead routing',
    description: 'Prioritize qualified enquiries and give the right person a clear next step.',
    icon: GitBranch,
    type: 'ROUTING',
    steps: 7,
  },
  {
    id: 'instant-response',
    name: 'Instant enquiry response',
    description: 'Prepare a useful first reply when an enquiry reaches the workspace.',
    icon: Mail,
    type: 'RESPONSE',
    steps: 7,
  },
  {
    id: 'no-response',
    name: 'No-response follow-up',
    description: 'Make room for a reply. Then remind the owner to follow up.',
    icon: Timer,
    type: 'FOLLOW-UP',
    steps: 7,
  },
  {
    id: 'demo-request',
    name: 'Contact request workflow',
    description: 'Qualify a contact request and route it toward a discovery conversation.',
    icon: Zap,
    type: 'CAPTURE',
    steps: 7,
  },
  {
    id: 'nurture',
    name: 'Lead nurture workflow',
    description: 'Give early interest time to grow with a considered sequence.',
    icon: Mail,
    type: 'NURTURE',
    steps: 7,
  },
];
export function AutomationsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const current = flows.find((f) => f.id === selected);
  return (
    <>
      <AppHeading
        eyebrow="BUILD A BETTER REPEAT"
        title={current ? current.name : 'A little logic. A lot of momentum.'}
        description={
          current
            ? 'Configure each step and visualize the signal path. This local workspace sends no messages.'
            : 'Thoughtful workflows for the moments that matter. Select one to shape the process.'
        }
      />
      {current ? (
        <>
          <button className="text-button back-to-list" onClick={() => setSelected(null)}>
            <ArrowLeft size={14} />
            All automations
          </button>
          <AutomationEditor key={current.id} id={current.id} />
        </>
      ) : (
        <>
          <div className="automation-intro">
            <GitBranch size={37} />
            <div>
              <h2>Your process should be easy to explain.</h2>
              <p>
                A trigger starts the journey. Conditions choose the path. Actions give it momentum.
              </p>
            </div>
            <span className="status">FOLLOW-UP WORKFLOW</span>
          </div>
          <div className="automation-list">
            {flows.map((flow, i) => (
              <button className="automation-row" key={flow.id} onClick={() => setSelected(flow.id)}>
                <span className="automation-row-index">0{i + 1}</span>
                <span className="settings-icon">
                  <flow.icon size={20} />
                </span>
                <span>
                  <small>{flow.type}</small>
                  <strong>{flow.name}</strong>
                  <p>{flow.description}</p>
                </span>
                <span className="automation-step-count">
                  <FlowStatus id={flow.id} />
                  {flow.steps} steps
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
