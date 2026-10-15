import fs from 'node:fs';
const p='src/components/marketing/hero.tsx';let h=fs.readFileSync(p,'utf8');h=h.replace("import dynamic from 'next/dynamic';","import dynamic from 'next/dynamic';\nimport Image from 'next/image';");
h=h.replace('          <div\n            className="spatial-content"',`          <div className="hero-atmosphere" aria-hidden="true">
            <Image src="/images/growora-hero-light.png" alt="" fill sizes="100vw" preload />
          </div>
          <div
            className="spatial-content"`);fs.writeFileSync(p,h);
let s=fs.readFileSync('src/components/marketing/homepage.tsx','utf8');
s=s.replace('<span>01 / THE OPPORTUNITY</span>','<span className={styles.eyebrow}>01 / THE OPPORTUNITY</span>');
const start=s.indexOf('        <div className={styles.flowBoard}>'); const end=s.indexOf('\n      </section>',start);
s=s.slice(0,start)+`        <div className={styles.routingStudio}>
          <div className={styles.routingToolbar}>
            <span>THE ROUTING STUDIO</span>
            <div role="group" aria-label="Explore workflow routes">
              <button aria-pressed={flow === 'priority'} onClick={() => setFlow('priority')}>Ready to talk</button>
              <button aria-pressed={flow === 'nurture'} onClick={() => setFlow('nurture')}>Still exploring</button>
            </div>
          </div>
          <div className={styles.routingCanvas}>
            <div className={styles.incomingRecord}>
              <span className={styles.routeLabel}>INCOMING / WEBSITE ENQUIRY</span>
              <h3>A little context.<br />A clear direction.</h3>
              <p>Let the details guide the next step.</p>
              <dl key={flow} className={styles.swapMotion}>
                <div><dt>Project</dt><dd>Website redesign</dd></div>
                <div><dt>Budget</dt><dd>{flow === 'priority' ? '£5,000–£10,000' : 'Under £2,000'}</dd></div>
                <div><dt>Timing</dt><dd>{flow === 'priority' ? 'Ready this month' : 'Exploring an idea'}</dd></div>
              </dl>
            </div>
            <div className={styles.routeBridge} aria-hidden="true"><span /><ArrowRight /></div>
            <div key={flow} className={\`\${styles.routeDestination} \${styles.swapMotion}\`}>
              <span className={styles.routeLabel}>{flow === 'priority' ? 'A MATCH FOR PRIORITY SALES' : 'A THOUGHTFUL NURTURE PATH'}</span>
              <h3>{flow === 'priority' ? 'The right person. Already in the loop.' : 'Good ideas deserve room to grow.'}</h3>
              <div className={styles.routeOwner}><span>{flow === 'priority' ? 'JL' : 'GT'}</span><div><strong>{flow === 'priority' ? 'Jamie Lee' : 'Growth team'}</strong><small>{flow === 'priority' ? 'Your opportunity owner' : 'Keeping the conversation open'}</small></div></div>
              <div className={styles.routeNext}><span>NEXT STEP</span><strong>{flow === 'priority' ? 'Arrange a discovery conversation' : 'Share a useful project guide'}</strong><p>{flow === 'priority' ? 'The brief, budget and timing arrive together. Your team can start with the conversation.' : 'Keep the context, offer something useful, and reconnect when the timing is right.'}</p></div>
            </div>
          </div>
          <div className={styles.routingFooter} role="status"><span>{flow === 'priority' ? 'Context → Priority sales → Personal conversation' : 'Context → Growth team → Useful follow-up'}</span><Link href="/product#automation">Explore workflows <ArrowUpRight size={18} /></Link></div>
        </div>`+s.slice(end);
fs.writeFileSync('src/components/marketing/homepage.tsx',s);
let e=fs.readFileSync('src/components/three/lead-engine.tsx','utf8');e=e.replace('0.25 + unfold * 0.9 + breathing','0.65 + unfold * 0.5 + breathing');fs.writeFileSync('src/components/three/lead-engine.tsx',e);
