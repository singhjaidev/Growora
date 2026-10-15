'use client';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Check, CornerDownRight } from 'lucide-react';
import { storyInput } from '@/lib/lead-story';
import s from './opportunity-hero.module.css';
const chapters = [
  {
    name: 'Capture',
    title: 'The details make the difference.',
    copy: 'A website project. A £5,000–£10,000 budget. A start within 30 days. Turn an enquiry into context your team can actually use.',
  },
  {
    name: 'Qualify',
    title: 'A clear priority. A visible reason.',
    copy: 'The service fits, the budget is in range and the timing is right. See the signals behind the decision, with criteria that reflect your business.',
  },
  {
    name: 'Connect',
    title: 'The right person. The next step.',
    copy: 'Jamie owns the opportunity and the follow-up: arrange a discovery call. No searching for the brief. No wondering who will reply.',
  },
  {
    name: 'Complete',
    title: 'One enquiry. Everything connected.',
    copy: 'The brief, the decision and the owner settle into one opportunity record. Ready to move into the workspace, with nothing left behind.',
  },
];
export function OpportunityHero({
  stage,
  select,
}: {
  stage: number;
  select: (index: number) => void;
}) {
  return (
    <section className={s.hero} aria-labelledby="hero-heading">
      <div className={s.composition}>
        <div className={s.intro}>
          <span className={s.eyebrow}>
            <i /> FROM FIRST INTEREST TO WHAT’S NEXT
          </span>
          <h1 id="hero-heading">
            One enquiry.
            <br />A world of
            <br />
            opportunity.
          </h1>
          <p>
            Capture the context. Recognise the fit. Give every promising enquiry an owner and a
            clear next step.
          </p>
          <div className={s.actions}>
            <Link href="/contact" className={s.primary}>
              Build your pipeline <ArrowUpRight size={18} />
            </Link>
            <a href="#enquiry-story">
              See it come together <ArrowDown size={16} />
            </a>
          </div>
          <span className={s.introNote}>
            Lead qualification & opportunity management
            <br />
            for businesses built on conversations.
          </span>
          <div className={s.introRule}>
            <span>LESS CHASING. MORE CONTEXT.</span>
            <span>01 — 04</span>
          </div>
        </div>
        <div className={s.sceneColumn}>
          <div className={s.scene} data-product-scene>
            <div className={s.sceneLabel}>
              <span>THE OPPORTUNITY FILE</span>
              <span>LEAD RECORD</span>
            </div>
            <div className={s.object} data-active-stage={stage}>
              <div className={s.objectBar}>
                <span>
                  <b>g.</b> growora / opportunities
                </span>
                <span>G / 001</span>
              </div>
              <div className={s.recordTitle}>
                <span>WEBSITE ENQUIRY</span>
                <h2>{storyInput.company}</h2>
                <p>{storyInput.name} · New project</p>
              </div>
              <div className={`${s.layer} ${s.capture}`}>
                <div className={s.layerHeader}>
                  <span>01 / CAPTURE</span>
                  <Check size={15} />
                </div>
                <dl>
                  {[
                    ['Project', storyInput.service],
                    ['Budget', storyInput.budget],
                    ['Timeline', storyInput.timeline],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className={`${s.layer} ${s.qualify}`}>
                <div className={s.layerHeader}>
                  <span>02 / QUALIFY</span>
                  <span className={s.badge}>Priority review</span>
                </div>
                <div className={s.signals}>
                  {['Service fits', 'Budget in range', 'Starts soon'].map((signal) => (
                    <span key={signal}>
                      <Check size={13} />
                      {signal}
                    </span>
                  ))}
                </div>
                <p>Example criteria: website project · £5k+ · within 30 days</p>
              </div>
              <div className={`${s.layer} ${s.connect}`}>
                <div className={s.layerHeader}>
                  <span>03 / CONNECT</span>
                  <CornerDownRight size={15} />
                </div>
                <div className={s.owner}>
                  <span>JL</span>
                  <div>
                    <strong>Jamie Lee</strong>
                    <small>Opportunity owner</small>
                  </div>
                  <small>Assigned</small>
                </div>
                <div className={s.next}>
                  <span>NEXT ACTION</span>
                  <strong>
                    Arrange a discovery call <ArrowUpRight size={15} />
                  </strong>
                </div>
              </div>
              <div className={s.objectFoot}>
                <i /> One record. All the context.
              </div>
            </div>
            <div className={s.stageControls} role="group" aria-label="Enquiry story stages">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.name}
                  aria-pressed={stage === index}
                  onClick={() => select(index)}
                >
                  <span>0{index + 1}</span>
                  {chapter.name}
                </button>
              ))}
            </div>
            <p className={s.sceneNote}>Same enquiry. Every detail stays connected.</p>
          </div>
        </div>
        <div className={s.story} id="enquiry-story">
          <span className={s.eyebrow}>FOLLOW ONE ENQUIRY</span>
          {chapters.map((chapter, index) => (
            <article
              key={chapter.name}
              data-story-step={index}
              className={stage === index ? s.active : ''}
            >
              <span className={s.number}>0{index + 1}</span>
              <div>
                <span className={s.chapterName}>{chapter.name}</span>
                <h2>{chapter.title}</h2>
                <p>{chapter.copy}</p>
              </div>
            </article>
          ))}
          <a className={s.storyEnd} href="#platform">
            The next chapter is your workspace <ArrowDown size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
