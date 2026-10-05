import fs from 'node:fs';
const file = 'src/components/marketing/sections.tsx';
let s = fs.readFileSync(file,'utf8');
const tail = s.slice(s.indexOf('const industries ='));
s = `'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, GitBranch } from 'lucide-react';
import { ButtonLink, SectionTitle, tabKeyboard, ScoreMeter } from '@/components/ui';
import { useLeads } from '@/components/providers';
import { money, stages, type Stage } from '@/lib/domain';
import { storyStages, storyChapters, storyLead } from '@/lib/lead-story';
import { percentage } from '@/lib/reporting';
import { integrations } from '@/data/demo';

export function Problem() {
  const [organized, setOrganized] = useState(false);
  return <section className="section container problem-section">
    <div className="problem-text"><p className="kicker">01 / CLOSE THE GAP</p><h2>Interest moves fast.<br/><span className="muted">Give it a direction.</span></h2><p>The enquiry is only the beginning. Keep its context, its owner and its next step together.</p><button className="text-button" aria-pressed={organized} onClick={() => setOrganized(!organized)}>{organized ? 'See the inbox view' : 'Bring some order'}<ArrowRight size={16}/></button></div>
    <div className="intake-ledger"><div className="ledger-heading"><span>{organized ? 'AN OPPORTUNITY DESK' : 'AN ORDINARY INBOX'}</span><span>3 enquiries · illustrative</span></div>{[['Website redesign','Budget confirmed','Jamie · Discovery call'],['Project proposal','Scope ready','Sam · Review proposal'],['New consultation','Exploring options','Team · Share a guide']].map(([name,context,action],i)=><div className="ledger-row" key={name}><span>0{i+1}</span><div><strong>{name}</strong><small>{organized ? context : ['2 hours ago','Follow-up missed','Unassigned'][i]}</small></div><span className={organized ? 'ledger-assigned' : ''}>{organized ? action : 'Awaiting a next step'}</span></div>)}<p role="status">{organized ? 'Every enquiry has context and a clear owner.' : 'Three conversations waiting for someone to take the lead.'}</p></div>
  </section>;
}
export function Workflow() {
 const [active,setActive]=useState(0);
 return <section className="section container product-journey" id="workflow"><SectionTitle number="01" kicker="ONE CONNECTED JOURNEY" title="Six steps. One clear next move." description="Explore the same enquiry from capture to a qualified opportunity."/><div className="journey-tabs" role="tablist" aria-label="Lead journey" onKeyDown={tabKeyboard}>{storyStages.map((stage,i)=><button key={stage} id={\`product-stage-\${i}\`} role="tab" aria-selected={active===i} aria-controls="product-stage-panel" tabIndex={active===i?0:-1} onClick={()=>setActive(i)}><span>0{i+1}</span>{stage}</button>)}</div><div className="product-stage-panel" id="product-stage-panel" role="tabpanel" aria-labelledby={\`product-stage-\${active}\`}><div><p className="kicker">{storyStages[active]}</p><h3>{storyChapters[active].title}</h3><p>{storyChapters[active].description}</p></div><div className="product-specimen"><span className="micro">ILLUSTRATIVE OPPORTUNITY</span><h3>{storyLead.name}</h3><p>{storyLead.company} · {storyLead.service}</p><ScoreMeter score={storyLead.score}/><strong>{storyChapters[active].receipt}</strong></div></div></section>;
}
export function PipelineSection() {
 const {leads, activeLeadId, updateLead, ready}=useLeads();
 const lead=leads.find(l=>l.id===activeLeadId)??leads[0];
 const [message,setMessage]=useState('');
 function move(status:Stage) { if (!lead || lead.status===status) return; updateLead(lead.id,{status, activity:[...lead.activity,\`Moved to \${status}\`]}); setMessage(\`\${lead.name} moved to \${status}. Saved to this workspace.\`); }
 return <section className="section container pipeline-section"><SectionTitle number="06" kicker="PROGRESS YOU CAN SEE" title="A next step, at every stage." description="Follow one opportunity. Move it when the conversation moves."/>{!ready?<p role="status">Loading your workspace…</p>:lead?<div className="opportunity-rail"><div className="rail-identity"><div><span className="kicker">{activeLeadId===lead.id?'YOUR CAPTURED LEAD':'LATEST WORKSPACE RECORD'}</span><h3>{lead.name}</h3><p>{lead.company} · {lead.owner}</p></div><strong>{money(lead.value)}</strong></div><ol>{stages.map((stage,i)=><li key={stage} aria-current={lead.status===stage?'step':undefined} className={lead.status===stage?'current':''}><span>0{i+1}</span><strong>{stage}</strong><small>{['Review the context','Confirm the fit','Start a conversation','Make an offer','Plan the handover'][i]}</small></li>)}</ol><div className="rail-controls"><label>Move this opportunity<select value={lead.status} onChange={e=>move(e.target.value as Stage)}>{stages.map(stage=><option key={stage}>{stage}</option>)}</select></label><ButtonLink secondary href={\`/app/leads?highlight=\${lead.id}\`}>Open opportunity</ButtonLink></div><p role="status">{message||'Only your explicit stage changes update this record.'}</p></div>:<p>Capture a lead to start your pipeline.</p>}<div className="under-window"><span>Your changes stay connected across the demo.</span><Link href="/app/pipeline">See the full pipeline <ArrowUpRight size={15}/></Link></div></section>;
}
export function AnalyticsSection() {
 const {leads}=useLeads();
 const waiting=leads.filter(l=>l.score>=75 && ['New','Qualified'].includes(l.status)).length;
 return <section className="section container analytics-marketing"><div><p className="kicker">07 / SIGNAL, NOT NOISE</p><h2>Know where you stand.<br/><span className="muted">See where to go.</span></h2><p>{waiting} high-intent {waiting===1?'opportunity needs':'opportunities need'} a first conversation. Turn a useful signal into a useful action.</p><ButtonLink href="/app/analytics" secondary>Explore your insights</ButtonLink></div><div className="stage-distribution"><div className="panel-heading"><h4>Your pipeline, right now</h4><span>{leads.length} records</span></div>{stages.map(stage=>{const count=leads.filter(l=>l.status===stage).length;return <div key={stage}><span>{stage}<strong>{count}</strong></span><div><i style={{width:\`\${percentage(count,leads.length)}%\`}}/></div></div>})}<p className="micro">SHARE OF WORKSPACE RECORDS · LIVE LOCAL DATA</p></div></section>;
}
` + tail;
s=s.replace('<Sparkles size={17} />','<GitBranch size={17} />');
const a=s.indexOf('      <div className="integration-orbit">'); const b=s.indexOf('\n    </section>',a);
s=s.slice(0,a)+`      <div className="connection-register">{integrations.slice(0,6).map(item=><Link href="/integrations" key={item.name}><span className="connection-symbol">{item.symbol}</span><strong>{item.name}</strong><span>Explore concept</span><ArrowUpRight size={17}/></Link>)}</div>`+s.slice(b);
fs.writeFileSync(file,s);
