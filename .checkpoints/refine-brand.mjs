import fs from 'node:fs';
const hp='src/components/marketing/hero.tsx';
let h=fs.readFileSync(hp,'utf8');
h=h.replace('ArrowDown, Pause, Play, RotateCcw, Check','ArrowDown, Check');
h=h.replace('  const [paused, setPaused] = useState(false);','  const [fallbackReady, setFallbackReady] = useState(false);\n  useEffect(() => {\n    const timeout = window.setTimeout(() => setFallbackReady(true), 2200);\n    return () => window.clearTimeout(timeout);\n  }, []);');
h=h.replace('elapsed = 0,','elapsed = 2000,');
h=h.replace(/      else if \(desktop.matches\) \{[\s\S]*?      \}\n    \};/, '    };');
h=h.replace('paint(reduced.matches ? 1 : 0);','paint(1);');
h=h.replace("data-renderer={ready && show3d ? 'webgl' : 'svg'}","data-renderer={ready && show3d ? 'webgl' : fallbackReady ? 'fallback' : 'pending'}");
h=h.replace(/              <button\n                aria-label=\{paused[\s\S]*?<RotateCcw size=\{14\} \/>\n              <\/button>/,'');
fs.writeFileSync(hp,h);
const en='src/components/three/lead-engine.tsx'; let e=fs.readFileSync(en,'utf8');
e=e.replace('const breathing = Math.sin(frame.time * 0.65) * 0.015;','const breathing = 0;');
e=e.replace('0.25 + breathing, 0);','0.25 + unfold * 0.9 + breathing, 0);');
fs.writeFileSync(en,e);
const p='src/components/marketing/homepage.tsx';let s=fs.readFileSync(p,'utf8');
s=s.replace("import { useState } from 'react';","import { useEffect, useRef, useState } from 'react';\nimport Image from 'next/image';");
s=s.replace('  MoveUpRight,\n','');
s=s.replace('  const lead = examples[example];',`  const sections = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = sections.current;
    if (!root) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (reduced.matches) return;
        const animation = entry.target.animate(
          [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)' },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });
    root.querySelectorAll('section > div, section > h2, section > p, section > span, [data-reveal]').forEach((element) => {
      if (element.getBoundingClientRect().top > innerHeight) observer.observe(element);
    });
    const stop = () => { if (reduced.matches) animations.forEach(animation => animation.cancel()); };
    reduced.addEventListener('change', stop);
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); reduced.removeEventListener('change', stop); };
  }, []);
  const lead = examples[example];`);
s=s.replace('    <>\n      <div className={styles.businessStrip}>','    <div ref={sections} className={styles.sections}>\n      <div className={styles.businessStrip}>');
s=s.replace('    </>\n  );\n}', '    </div>\n  );\n}');
s=s.replace(/        <div className=\{styles.finalOrbit\}[\s\S]*?<\/div>\n        <div>/,`        <Image className={styles.finalImage} src="/images/growora-blue-architecture.png" alt="" fill sizes="100vw" />
        <div className={styles.finalCopy}>`);
s=s.replace(/        <span className=\{styles.finalWord\}[\s\S]*?<\/span>/,'');
s=s.replace("color: '#df7949'","color: '#3454d1'").replace("color: '#208578'","color: '#3454d1'").replace("color: '#465ee8'","color: '#3454d1'");
fs.writeFileSync(p,s);
const css='src/components/marketing/homepage.module.css'; let c=fs.readFileSync(css,'utf8');
const palette={'#465ee8':'#3454d1','#435cda':'#3454d1','#435bdd':'#3454d1','#5067d8':'#3454d1','#fff0e7':'#eaf0ff','#e7f3ee':'#e5edfc','#e08a57':'#3454d1','#f4d9c8':'#d8e2ff','#edd3bf':'#bbc9ef','#fff8f0':'#f5f8ff','#9c775e':'#435581','#fffaf4':'#f5f8ff','#c3ddd0':'#c4d3fb','#f2c694':'#d9e5ff','#d8df99':'#b9d0ff'};
for(const [a,b] of Object.entries(palette)) c=c.replaceAll(a,b);
c=c.replace(/font-size: (\d+)px/g,(all,n)=> Number(n)<14?'font-size: 14px':all);
fs.writeFileSync(css,c);
