import fs from 'node:fs';
let h=fs.readFileSync('src/components/marketing/hero.tsx','utf8');
h=h.replace(/\{manual && pinned \? \(/,'{manual && pinned && (').replace(/              \) : \(\n                <span className="spatial-scroll-cue">[\s\S]*?<\/span>\n              \)\}/,'              )}');
fs.writeFileSync('src/components/marketing/hero.tsx',h);
let s=fs.readFileSync('src/components/marketing/homepage.tsx','utf8');
s=s.replace('  const [annual, setAnnual]', '  const [openFaq, setOpenFaq] = useState<number | null>(null);\n  const [annual, setAnnual]');
s=s.replace(/              icon: (Target|Zap|Layers3),\n/g,'');
s=s.replace(/                <span className=\{styles.planIcon\}>[\s\S]*?<\/span>\n/,'');
s=s.replace('<span className={styles.planIndex}>0{i + 1}</span>','<span className={styles.planTag}>{plan.tag}</span>');
s=s.replace('              <span className={styles.planTag}>{plan.tag}</span>\n              <h3>','              <h3>');
s=s.replace(/              <span className=\{styles.planBottom\}>[\s\S]*?<\/span>\n/,'');
s=s.replace('].map(([question, answer]) => (',' ].map(([question, answer], index) => (');
s=s.replace(/            <details key=\{question\}>[\s\S]*?<\/details>/,`            <div key={question} className={styles.faqItem}>
              <h3><button id={\`faq-question-\${index}\`} aria-expanded={openFaq === index} aria-controls={\`faq-answer-\${index}\`} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                {question}<Plus size={21} />
              </button></h3>
              <div id={\`faq-answer-\${index}\`} className={styles.faqAnswer} data-open={openFaq === index} aria-hidden={openFaq !== index} inert={openFaq !== index} role="region" aria-labelledby={\`faq-question-\${index}\`}>
                <div><p>{answer}</p></div>
              </div>
            </div>`);
fs.writeFileSync('src/components/marketing/homepage.tsx',s);
