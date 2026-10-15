'use client';
import { useEffect, useState } from 'react';
import { Check, GitBranch, Mail, Play, Timer, UserRound, Zap, Bell, Save } from 'lucide-react';
import { useLocalState } from '@/components/providers';
import { SectionTitle } from '@/components/ui';
import { evaluateFlow, executionPath, sampleEnquiry } from '@/lib/automation-flow';
const baseNodes = [
  {
    name: 'New lead captured',
    type: 'Trigger',
    icon: Zap,
    detail: 'Website enquiry form',
    value: 'Website enquiry',
  },
  {
    name: 'Budget above threshold?',
    type: 'Condition',
    icon: GitBranch,
    detail: 'Budget is greater than £2,000',
    value: '2000',
  },
  {
    name: 'Mark as high priority',
    type: 'Action',
    icon: Check,
    detail: 'Set priority to High',
    value: 'High',
  },
  {
    name: 'Assign sales owner',
    type: 'Action',
    icon: UserRound,
    detail: 'Route to Jamie Lee',
    value: 'Jamie Lee',
  },
  {
    name: 'Send first response',
    type: 'Action',
    icon: Mail,
    detail: 'Template: Welcome & next steps',
    value: 'Welcome & next steps',
  },
  {
    name: 'Wait before follow-up',
    type: 'Delay',
    icon: Timer,
    detail: 'Wait 1 day, then check for reply',
    value: '1',
  },
  {
    name: 'Notify if no reply',
    type: 'Notification',
    icon: Bell,
    detail: 'Notify the assigned owner',
    value: 'Assigned owner',
  },
];
export function AutomationEditor({ id = 'high-value' }: { id?: string }) {
  const nodes = baseNodes.map((node, index) => {
    const variants: Record<string, Record<number, Partial<typeof node>>> = {
      'instant-response': {
        0: { name: 'Enquiry received', detail: 'Any capture form', value: 'All forms' },
        1: {
          name: 'Has a valid email?',
          detail: 'Email address is present',
          value: 'Email is present',
        },
        2: {
          name: 'Prepare acknowledgement',
          detail: 'Use the enquiry context',
          value: 'Acknowledgement',
        },
        4: {
          name: 'Send first response',
          detail: 'Template: Thanks for reaching out',
          value: 'Thanks for reaching out',
        },
      },
      'no-response': {
        0: { name: 'Conversation started', detail: 'Lead moved to Contacted', value: 'Contacted' },
        1: {
          name: 'Reply still outstanding?',
          detail: 'No reply after first contact',
          value: 'No reply',
        },
        2: {
          name: 'Flag for follow-up',
          detail: 'Set follow-up status',
          value: 'Follow-up needed',
        },
        4: {
          name: 'Prepare useful follow-up',
          detail: 'Template: Your next step',
          value: 'Your next step',
        },
        5: { name: 'Wait before reminder', detail: 'Wait 3 days', value: '3' },
      },
      'demo-request': {
        0: { name: 'Contact request captured', detail: 'Product enquiry form', value: 'Contact request' },
        1: {
          name: 'Team needs a walkthrough?',
          detail: 'Lead volume above 50',
          value: 'Lead volume above 50',
        },
        2: {
          name: 'Qualify contact request',
          detail: 'Set type to Product enquiry',
          value: 'Product enquiry',
        },
        4: {
          name: 'Prepare booking invitation',
          detail: 'Template: Choose your time',
          value: 'Choose your time',
        },
      },
      nurture: {
        0: {
          name: 'Early-interest lead captured',
          detail: 'Lead marked for nurturing',
          value: 'Nurture lead',
        },
        1: {
          name: 'Still exploring?',
          detail: 'Timeline is Just exploring',
          value: 'Just exploring',
        },
        2: {
          name: 'Add to nurture journey',
          detail: 'Sequence: Project planning',
          value: 'Project planning',
        },
        4: {
          name: 'Prepare a helpful resource',
          detail: 'Template: Planning your project',
          value: 'Planning your project',
        },
        5: { name: 'Give the idea room', detail: 'Wait 7 days', value: '7' },
      },
    };
    return { ...node, ...variants[id]?.[index] };
  });
  const alternative = {
    name: id === 'high-value' ? 'Nurture sequence' : 'Alternative route',
    type: 'Action',
    icon: Mail,
    detail: 'Keep the lead in the nurture queue',
    value: 'Nurture queue',
  };
  const [selected, setSelected] = useState(1);
  const [values, setValues] = useLocalState<Record<string, string>>(`growora-automation-${id}`, {});
  const [enabled, setEnabled] = useLocalState(`growora-automation-enabled-${id}`, true);
  const [running, setRunning] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const [complete, setComplete] = useState(false);
  const [testBudget, setTestBudget] = useState('7500');
  const [testPass, setTestPass] = useState(true);
  const [saved, setSaved] = useState(false);
  const node = selected === 7 ? alternative : nodes[selected];
  const numericCondition = id === 'high-value' && selected === 1;
  const passes = evaluateFlow(id, values[1] ?? '2000', {
    ...sampleEnquiry,
    budget: Number(testBudget),
    email: testPass ? sampleEnquiry.email : '',
    replied: !testPass,
    volume: testPass ? 100 : 20,
    timeline: testPass ? 'Just exploring' : 'Within 30 days',
  });
  const path = executionPath(passes);
  useEffect(() => {
    if (!running) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => {
      setCursor(path.length - 1);
      setRunning(false);
      setComplete(true);
    };
    if (motion.matches) {
      finish();
      return;
    }
    const change = () => {
      if (motion.matches) finish();
    };
    motion.addEventListener('change', change);
    const timer = setTimeout(() => {
      if (cursor >= path.length - 1) finish();
      else setCursor(cursor + 1);
    }, 600);
    return () => {
      clearTimeout(timer);
      motion.removeEventListener('change', change);
    };
  }, [running, cursor, path.length]);
  function clearRun() {
    setRunning(false);
    setCursor(-1);
    setComplete(false);
  }
  return (
    <div className={`automation-editor ${running ? 'simulating' : ''}`}>
      <div className="automation-toolbar">
        <span>
          <i className={enabled ? 'live-dot' : 'neutral-dot'} />{' '}
          {enabled ? 'Enabled in workspace' : 'Paused'}
        </span>
        <div>
          <button
            className="text-button"
            onClick={() => {
              setEnabled(!enabled);
              clearRun();
            }}
          >
            {enabled ? 'Pause' : 'Enable'} flow
          </button>
          <button
            className="button small secondary"
            disabled={!enabled}
            onClick={() => {
              if (running) clearRun();
              else {
                setCursor(0);
                setComplete(false);
                setRunning(true);
              }
            }}
          >
            <Play size={12} />
            {running ? 'Stop test' : complete ? 'Replay test' : 'Test flow'}
          </button>
        </div>
      </div>
      <div className="automation-test-input">
        {id === 'high-value' ? (
          <label>
            Test enquiry budget (£)
            <input
              type="number"
              min="0"
              value={testBudget}
              onChange={(e) => {
                setTestBudget(e.target.value);
                clearRun();
              }}
            />
          </label>
        ) : (
          <label>
            Test enquiry
            <select
              value={testPass ? 'yes' : 'no'}
              onChange={(e) => {
                setTestPass(e.target.value === 'yes');
                clearRun();
              }}
            >
              <option value="yes">Meets this condition</option>
              <option value="no">Does not meet this condition</option>
            </select>
          </label>
        )}
        <p role="status">
          {complete
            ? `Test complete · ${passes ? 'YES — primary route' : 'NO — alternative route'}. No messages sent.`
            : running
              ? `Step ${cursor + 1} of ${path.length} · ${path[cursor] === 7 ? alternative.name : nodes[path[cursor]].name}`
              : 'A test run. Delays are shortened for the preview.'}
        </p>
      </div>
      <div className="automation-layout">
        <div className="node-canvas">
          <span className="canvas-caption">{id.replaceAll('-', ' ').toUpperCase()} / WORKFLOW</span>
          <div className="node-chain">
            {nodes.map((n, i) => (
              <div className="node-step" key={n.name}>
                {i > 0 && (
                  <div className={`connector ${running && path[cursor] === i ? 'flow' : ''}`}>
                    <span />
                    {i === 2 && <em>YES</em>}
                  </div>
                )}
                <button
                  className={`flow-node ${selected === i ? 'selected' : ''} ${running && path[cursor] === i ? 'running' : ''} ${cursor >= 0 && path.slice(0, cursor + 1).includes(i) ? 'executed' : ''}`}
                  style={{ '--delay': `${i * 0.35}s` } as React.CSSProperties}
                  onClick={() => {
                    setSelected(i);
                    setSaved(false);
                  }}
                >
                  <span className={`node-symbol type-${n.type.toLowerCase()}`}>
                    {n.type === 'Condition' ? (
                      <b>IF</b>
                    ) : n.type === 'Trigger' ? (
                      <b>IN</b>
                    ) : (
                      <n.icon size={16} />
                    )}
                  </span>
                  <span>
                    <small>{n.type.toUpperCase()}</small>
                    <strong>{n.name}</strong>
                    <em>{values[i] || n.detail}</em>
                  </span>
                  <span className="node-menu">···</span>
                </button>
                {i === 1 && (
                  <div
                    className={`branch-nurture ${cursor >= 2 && !passes ? 'alternative-active' : ''}`}
                  >
                    <span>NO</span>
                    <button
                      onClick={() => {
                        setSelected(7);
                        setSaved(false);
                      }}
                    >
                      <Mail size={14} /> {alternative.name}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="canvas-legend">
            <i className="live-dot" />
            {running
              ? `Test enquiry → ${passes ? 'primary route' : 'alternative route'} · no messages sent`
              : 'Select a node to configure its behaviour'}
          </div>
        </div>
        <aside className="node-settings">
          <p className="kicker">NODE SETTINGS</p>
          <span className="settings-icon">
            <node.icon size={25} />
          </span>
          <h3>{node.name}</h3>
          <p>
            {numericCondition
              ? 'Separate urgent opportunities from leads that need more time.'
              : 'Keep this step specific, so every lead has a clear next action.'}
          </p>
          <label>
            {selected === 1
              ? numericCondition
                ? 'Budget must exceed (£)'
                : 'Condition (fixed for this template)'
              : selected === 5
                ? 'Delay (days)'
                : 'Configuration'}
            <input
              type={numericCondition || selected === 5 ? 'number' : 'text'}
              min={0}
              readOnly={selected === 1 && !numericCondition}
              value={values[selected] ?? node.value}
              onChange={(e) => {
                setValues({ ...values, [selected]: e.target.value });
                clearRun();
                setSaved(false);
              }}
            />
          </label>
          <button className="button small" onClick={() => setSaved(true)}>
            <Save size={14} />
            {saved ? 'Saved locally' : 'Confirm settings'}
          </button>
          <div className="settings-note">
            <Check size={15} />
            <span>
              Changes stay in this browser. Test flow visualizes the route without sending emails or
              notifications.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
export function AutomationSection() {
  return (
    <section id="automation" className="section container">
      <SectionTitle
        number="05"
        kicker="MOMENTUM, BUILT IN"
        title="Your best process. On repeat."
        description="Give every lead a path forward. Set the conditions, connect the steps, and let the routine work follow."
      />
      <AutomationEditor />
    </section>
  );
}
