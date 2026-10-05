import fs from 'node:fs';
const p='src/components/marketing/hero.tsx';let s=fs.readFileSync(p,'utf8');
s=s.replace('    pause: () => void;\n    resume: () => void;\n    replay: () => void;\n','').replace('}>({ pause: () => {}, resume: () => {}, replay: () => {}, select: () => {}, follow: () => {} });','}>({ select: () => {}, follow: () => {} });');
s=s.replace(/      pause: \(\) => \{[\s\S]*?      select: \(index\) => \{/,'      select: (index) => {');
s=s.replace('      stopped = false,\n','').replace('      timer = 0,\n','').replace(' && !stopped','').replaceAll('reduced.matches || stopped','reduced.matches').replaceAll('      window.clearTimeout(timer);\n','').replaceAll('      timer = 0;\n','').replaceAll('      clearTimeout(timer);\n','');
fs.writeFileSync(p,s);
const cp='src/components/marketing/homepage.module.css';let c=fs.readFileSync(cp,'utf8');c=c.replace('.featuredPlan:hover','.growthPlan:hover');
for(const [a,b] of Object.entries({'#427760':'#3454a0','#b4d5c6':'#b9caef','#438269':'#3454a0','#bcd6ca':'#c3d2ef','#477c62':'#3454a0','#eab98c':'#c4d7ff','#c5e0b8':'#c4d7ff'}))c=c.replaceAll(a,b);
fs.writeFileSync(cp,c);
