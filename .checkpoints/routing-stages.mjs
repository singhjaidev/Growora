import fs from 'node:fs';let s=fs.readFileSync('src/components/marketing/homepage.tsx','utf8');
s=s.replace('  GitBranch,\n','');s=s.replace("  const [flow, setFlow]",'  const [flowStage, setFlowStage] = useState(0);\n  const [flow, setFlow]');
s=s.replace('  const industry = businesses[business];',`  const industry = businesses[business];
  const routingStep = [
    { label: 'CONTEXT, TOGETHER', title: 'A complete brief. From the first hello.', initials: 'NS', person: 'Northline Studio', role: 'Website enquiry', next: 'Review the project fit', detail: 'Project, budget and timing stay in one record. Start with the details that matter.' },
    { label: flow === 'priority' ? 'A MATCH FOR PRIORITY SALES' : 'A THOUGHTFUL NURTURE PATH', title: flow === 'priority' ? 'The right person. Already in the loop.' : 'Good ideas deserve room to grow.', initials: flow === 'priority' ? 'JL' : 'GT', person: flow === 'priority' ? 'Jamie Lee' : 'Growth team', role: 'Your opportunity owner', next: flow === 'priority' ? 'Route to priority sales' : 'Route to the growth team', detail: 'The context follows the enquiry. Give the right person everything they need to take it forward.' },
    { label: 'READY FOR THE NEXT STEP', title: flow === 'priority' ? 'A conversation, ready to begin.' : 'A helpful next step. At the right time.', initials: flow === 'priority' ? 'JL' : 'GT', person: flow === 'priority' ? 'Jamie Lee' : 'Growth team', role: 'Responsible for the follow-up', next: flow === 'priority' ? 'Arrange a discovery conversation' : 'Share a useful project guide', detail: flow === 'priority' ? 'The brief, budget and timing arrive together. Your team can start with the conversation.' : 'Keep the context, offer something useful, and reconnect when the timing is right.' },
  ][flowStage];`);
const a=s.indexOf('            <div key={flow} className={`${styles.routeDestination}');const b=s.indexOf('\n          <div className={styles.routingFooter}',a);
s=s.slice(0,a)+`            <div key={flow + flowStage} id="routing-stage-panel" role="tabpanel" aria-labelledby={\`routing-stage-\${flowStage}\`} className={\`\${styles.routeDestination} \${styles.swapMotion}\`}>
              <span className={styles.routeLabel}>{routingStep.label}</span>
              <h3>{routingStep.title}</h3>
              <div className={styles.routeOwner}><span>{routingStep.initials}</span><div><strong>{routingStep.person}</strong><small>{routingStep.role}</small></div></div>
              <div className={styles.routeNext}><span>NEXT STEP</span><strong>{routingStep.next}</strong><p>{routingStep.detail}</p></div>
            </div>
          </div>
          <div className={styles.routingStages} role="tablist" aria-label="Workflow stages" onKeyDown={tabKeyboard}>
            {['Capture context', 'Choose route', 'Prepare next step'].map((label, index) => <button key={label} id={\`routing-stage-\${index}\`} role="tab" aria-selected={flowStage === index} aria-controls="routing-stage-panel" tabIndex={flowStage === index ? 0 : -1} onClick={() => setFlowStage(index)}><span>0{index + 1}</span>{label}</button>)}
          </div>`+s.slice(b);
s=s.replace('            the very start.','            <em>the very start.</em>');
fs.writeFileSync('src/components/marketing/homepage.tsx',s);
