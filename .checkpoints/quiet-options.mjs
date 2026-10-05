import fs from 'node:fs';
const p='src/components/marketing/homepage.tsx';let s=fs.readFileSync(p,'utf8');
s=s.replace('                <span className={styles.optionNumber}>0{i + 1}</span>\n','');
s=s.replace(/                <span className=\{styles.optionIndicator\}>[\s\S]*?<\/span>/,'                <span className={styles.optionIndicator} aria-hidden="true" />');
s=s.replace(/              <span className=\{styles.flowIcon\}>\n                <Mail size=\{25\} \/>\n              <\/span>/,'              <span className={styles.flowNumber} aria-hidden="true">01</span>');
s=s.replace(/              <span className=\{styles.flowIcon\}>\n                <GitBranch size=\{25\} \/>\n              <\/span>/,'              <span className={styles.flowNumber} aria-hidden="true">02</span>');
s=s.replace(/              <span className=\{styles.flowIcon\}>\n                \{flow === 'priority'[\s\S]*?<\/span>/,'              <span className={styles.flowNumber} aria-hidden="true">03</span>');
s=s.replace('01 / ARRIVAL','ARRIVAL').replace('02 / DECISION','DECISION').replace('03 / NEXT STEP','NEXT STEP');
fs.writeFileSync(p,s);
