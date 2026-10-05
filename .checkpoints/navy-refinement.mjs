import fs from 'node:fs';
const hp='src/components/marketing/homepage.tsx'; let s=fs.readFileSync(hp,'utf8');
s=s.replace('  Clock3,','  Clock3,\n  BriefcaseBusiness,\n  Building2,\n  Compass,\n  Wrench,');
s=s.replace("  const [annual, setAnnual] = useState(false);","  const [annual, setAnnual] = useState(false);\n  const [pipeline, setPipeline] = useState(1);");
s=s.replace('          <div\n            className={styles.exampleTabs}', '          <span className={styles.selectionHint}>SELECT AN ENQUIRY TO EXPLORE</span>\n          <div\n            className={styles.exampleTabs}');
s=s.replace('                {item.label}\n                <ChevronRight size={18} />','                <span className={styles.optionNumber}>0{i + 1}</span>\n                <span className={styles.optionCopy}><strong>{item.label}</strong><small>{[\'A clear brief. Ready for a conversation.\', \'Explore the scope and find the right fit.\', \'An early idea with room to grow.\'][i]}</small></span>\n                <span className={styles.optionIndicator}>{example === i ? <Check size={18} /> : <ChevronRight size={18} />}</span>');
s=s.replace('          className={styles.captureScene}','          key={`enquiry-${example}`}\n          className={`${styles.captureScene} ${styles.swapMotion}`}');
s=s.replace('          <div className={styles.flowPath}>','          <div key={flow} className={`${styles.flowPath} ${styles.swapMotion}`}>');
s=s.replace('      <section className={styles.pipelineSection}>','      <section className={styles.pipelineSection} id="opportunity-view">');
s=s.replace('          <div className={styles.pipelineColumns}>',`          <div className={styles.pipelineTabs} role="tablist" aria-label="Opportunity stages" onKeyDown={tabKeyboard}>
            {['Qualified', 'In conversation', 'Proposal'].map((label, i) => (
              <button key={label} id={\`pipeline-tab-\${i}\`} role="tab" aria-selected={pipeline === i} aria-controls="pipeline-preview" tabIndex={pipeline === i ? 0 : -1} onClick={() => setPipeline(i)}>{label}</button>
            ))}
          </div>
          <div key={pipeline} id="pipeline-preview" role="tabpanel" aria-labelledby={\`pipeline-tab-\${pipeline}\`} className={\`\${styles.pipelineColumns} \${styles.swapMotion}\`}>`);
s=s.replace('<div key={stage}>','<div key={stage} data-active={pipeline === i}>');
s=s.replace("i === 1 ? styles.mainDeal : ''","i === pipeline ? styles.mainDeal : ''");
s=s.replace('{i === 1 ? (','{i === pipeline ? (');
s=s.replace('          {businesses.map((item, i) => (','          {businesses.map((item, i) => {\n            const BusinessIcon = [BriefcaseBusiness, Compass, Building2, Wrench][i];\n            return (');
s=s.replace('              {item.name}\n            </button>\n          ))}','              <BusinessIcon size={23} />\n              <span>{item.name}</span>\n              <span className={styles.businessCheck}>{business === i ? <Check size={16} /> : <ArrowUpRight size={16} />}</span>\n            </button>\n          );})}');
s=s.replace('          className={styles.businessPanel}','          key={`business-${business}`}\n          className={`${styles.businessPanel} ${styles.swapMotion}`}');
s=s.replace('className={styles.planPrice}', 'key={String(annual)} className={`${styles.planPrice} ${styles.swapMotion}`}');
s=s.replaceAll("'#3454d1'","'#10263f'");
fs.writeFileSync(hp,s);
const cp='src/components/marketing/homepage.module.css'; let c=fs.readFileSync(cp,'utf8');
for(const [a,b] of Object.entries({'#3454d1':'#10263f','#3454a0':'#26435e','#243f9f':'#10263f','#24449e':'#26435e','#23449c':'#26435e','#3149d1':'#203e5e','#3348b1':'#10263f','#435cda':'#10263f','#222d56':'#10263f','#14264b':'#10263f'}))c=c.replaceAll(a,b);
fs.writeFileSync(cp,c);
const sh='src/components/marketing/shell.tsx'; let t=fs.readFileSync(sh,'utf8');t=t.replace('${homeStyles.header} ${scrolled', "${homeStyles.header} ${pathname === '/' ? homeStyles.navyHeader : ''} ${scrolled");fs.writeFileSync(sh,t);
const en='src/components/three/lead-engine.tsx';let e=fs.readFileSync(en,'utf8');e=e.replace('Math.min(5.4, (width / height) * 2.6)','Math.min(5.15, (width / height) * 2.45)');e=e.replace('assembly.scale.setScalar(0.94 + unfold * 0.06);','const openingScale = width > 1200 ? 1.02 : 0.96;\n      assembly.scale.setScalar(openingScale + unfold * (1 - openingScale));');fs.writeFileSync(en,e);
