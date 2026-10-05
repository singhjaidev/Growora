'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Check } from 'lucide-react';
import { ButtonLink, tabKeyboard } from '@/components/ui';
import { storyStages, storyChapters, chapterProgress, type SceneFrame } from '@/lib/lead-story';
import { LeadConsole } from '@/components/visual/lead-console';
import { JourneyTranscript } from '@/components/marketing/lead-journey';
const Engine = dynamic(() => import('@/components/three/lead-engine'), { ssr: false });
const TRAVEL = 2400;
const ENABLE_STORY = true;

export function Hero() {
  const host = useRef<HTMLElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const controls = useRef<{
    select: (index: number) => void;
    follow: () => void;
  }>({ select: () => {}, follow: () => {} });
  const [clock] = useState(() => {
    let frame: SceneFrame = {
      progress: 0,
      intro: 1,
      time: 0,
      story: false,
      pointerX: 0,
      pointerY: 0,
    };
    const listeners = new Set<(value: SceneFrame) => void>();
    return {
      getSnapshot: () => frame,
      subscribe: (listener: (value: SceneFrame) => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      publish: (value: SceneFrame) => {
        frame = value;
        listeners.forEach((listener) => listener(value));
      },
    };
  });
  const [show3d, setShow3d] = useState(false);
  const [ready, setReady] = useState(false);
  const [fallbackReady, setFallbackReady] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setFallbackReady(true), 2200);
    return () => window.clearTimeout(timeout);
  }, []);
  const [pinned, setPinned] = useState(false);
  const [story, setStory] = useState(false);
  const [manual, setManual] = useState(false);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const element = host.current;
    const panel = surface.current;
    if (!element || !panel) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 1024px) and (min-height: 700px)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    let visible = false,
      disposed = false,
      eligible = false,
      override = false,
      initialized = false;
    let raf = 0,
      previous = 0,
      elapsed = 2000,
      idleTime = 0,
      start = 0,
      target = 0,
      current = 0;
    let pointerX = 0,
      pointerY = 0,
      smoothX = 0,
      smoothY = 0;
    let isStory = false,
      stageNow = 0;
    const paint = (intro: number) => {
      const index = Math.min(5, Math.floor(chapterProgress(current) * 6));
      if (stageNow !== index) {
        stageNow = index;
        setStage(index);
      }
      panel.style.setProperty('--story-progress', String(current));
      panel.style.setProperty('--intro-progress', String(intro));
      panel.style.setProperty('--unfold', String(Math.max(0, Math.min(1, current / 0.22))));
      clock.publish({
        progress: current,
        intro,
        time: idleTime,
        story: isStory,
        pointerX: smoothX,
        pointerY: smoothY,
      });
    };
    const active = () => visible && !document.hidden && !reduced.matches;
    const schedule = () => {
      if (!raf && active()) raf = requestAnimationFrame(tick);
    };
    const tick = (now: number) => {
      raf = 0;
      if (!active()) return;
      const delta = previous ? Math.min(50, now - previous) : 16;
      previous = now;
      elapsed = Math.min(2000, elapsed + delta);
      idleTime += delta / 1000;
      // Time-based damping. Scroll remains entirely native.
      const damping = 1 - Math.exp(-delta / 110);
      current += (target - current) * damping;
      smoothX += (pointerX - smoothX) * damping;
      smoothY += (pointerY - smoothY) * damping;
      if (Math.abs(target - current) < 0.0002) current = target;
      paint(elapsed / 2000);
      if (
        elapsed < 2000 ||
        Math.abs(target - current) > 0.0002 ||
        Math.abs(pointerX - smoothX) > 0.001 ||
        Math.abs(pointerY - smoothY) > 0.001
      )
        schedule();
    };
    const readScroll = () => {
      if (!eligible || override) return;
      const next = Math.max(0, Math.min(1, (window.scrollY - start) / TRAVEL));
      target = next;
      const nextStory = next > 0.08;
      if (nextStory !== isStory) {
        isStory = nextStory;
        setStory(nextStory);
      }
      if (reduced.matches) {
        current = target;
        paint(1);
      } else schedule();
    };
    const measure = () => {
      eligible = ENABLE_STORY && desktop.matches && !reduced.matches;
      setPinned(eligible);
      start = element.getBoundingClientRect().top + window.scrollY - 80;
      readScroll();
      if (!initialized) {
        initialized = true;
        if (target > 0.08) {
          current = target;
          elapsed = 2000;
          paint(1);
        }
      }
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      previous = 0;
      if (reduced.matches) {
        elapsed = 2000;
        current = target;
        smoothX = smoothY = 0;
        paint(1);
      }
      setShow3d(
        (old) => desktop.matches && !reduced.matches && !connection?.saveData && (old || visible),
      );
      measure();
      schedule();
    };
    controls.current = {
      select: (index) => {
        override = true;
        setManual(true);
        isStory = true;
        setStory(true);
        target = 0.1 + ((index + 0.5) / 6) * 0.9;
        if (reduced.matches || !desktop.matches) {
          current = target;
          paint(1);
        } else schedule();
      },
      follow: () => {
        override = false;
        setManual(false);
        readScroll();
      },
    };
    const onPointer = (event: PointerEvent) => {
      if (!desktop.matches || reduced.matches) return;
      pointerX = (event.clientX / innerWidth - 0.5) * 2;
      pointerY = (event.clientY / innerHeight - 0.5) * 2;
      schedule();
    };
    const onLeave = () => {
      pointerX = 0;
      pointerY = 0;
      schedule();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (!visible && override && eligible) {
          override = false;
          setManual(false);
        }
        sync();
      },
      { threshold: 0.01 },
    );
    observer.observe(panel);
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', measure);
    panel.addEventListener('pointermove', onPointer);
    panel.addEventListener('pointerleave', onLeave);
    reduced.addEventListener('change', sync);
    desktop.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    void document.fonts.ready.then(() => {
      if (!disposed) measure();
    });
    paint(1);
    measure();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', measure);
      panel.removeEventListener('pointermove', onPointer);
      panel.removeEventListener('pointerleave', onLeave);
      reduced.removeEventListener('change', sync);
      desktop.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [clock]);
  return (
    <section
      ref={host}
      className={`spatial-experience${pinned ? ' is-pinned' : ''}`}
      id="workflow"
      aria-label="Follow one opportunity through Growora"
      style={{ '--scroll-travel': `${TRAVEL}px` } as React.CSSProperties}
    >
      <noscript>
        <style>{`section.spatial-experience .spatial-runway{height:auto}section.spatial-experience .spatial-stage{position:relative;top:auto}`}</style>
      </noscript>
      <div className="spatial-runway">
        <div
          ref={surface}
          className={`spatial-stage${story ? ' is-story' : ''}`}
          data-stage={stage}
          data-renderer={ready && show3d ? 'webgl' : fallbackReady ? 'fallback' : 'pending'}
        >
          <div
            className="spatial-content"
            role={story ? 'tabpanel' : undefined}
            id="spatial-panel"
            aria-labelledby={story ? `spatial-tab-${stage}` : undefined}
          >
            <div className="spatial-world" aria-hidden="true">
              <LeadConsole stage={stage} story={story} />
              {show3d && <Engine clock={clock} onReadyChange={setReady} />}
            </div>
            <div className="spatial-hero-copy" inert={story} aria-hidden={story}>
              <p className="spatial-eyebrow">
                <i /> From first interest to next opportunity
              </p>
              <h1>
                Better leads.
                <br />
                <span>Bigger opportunities.</span>
              </h1>
              <p className="spatial-subhead">
                Turn a first hello into your next great client. Capture the context, find the right
                fit, and give every opportunity a way forward.
              </p>
              <div className="spatial-hero-actions">
                <ButtonLink href="/contact">Get started</ButtonLink>
                <a
                  href={pinned ? '#story-start' : '#workflow'}
                  onClick={() => {
                    if (!pinned) controls.current.select(0);
                  }}
                >
                  See how it works <ArrowDown size={15} />
                </a>
              </div>
              <div className="hero-proof">
                <Check size={16} /> Built for better business conversations.
              </div>
            </div>
            <div className="spatial-story-copy" inert={!story} aria-hidden={!story}>
              <span className="story-chapter-number">
                0{stage + 1} <i>/ 06</i> <b>{storyStages[stage]}</b>
              </span>
              <h2 key={stage}>{storyChapters[stage].title}</h2>
              <p>{storyChapters[stage].description}</p>
              {stage === 2 && (
                <span className="sr-only">
                  Score breakdown: 30 base, 35 budget, 21 timing and 5 company points.
                </span>
              )}
              <div className="spatial-receipt">
                <i />
                {storyChapters[stage].receipt}
              </div>
              {stage === 5 && <ButtonLink href="#capture">Explore lead capture</ButtonLink>}
              <span className="spatial-example-note">The context. The owner. The next step.</span>
            </div>
          </div>
          <div className="spatial-bottom">
            <div
              className="spatial-stage-tabs"
              inert={!story}
              aria-hidden={!story}
              role="tablist"
              aria-label="Journey stages"
              onKeyDown={tabKeyboard}
            >
              {storyStages.map((name, index) => (
                <button
                  role="tab"
                  id={`spatial-tab-${index}`}
                  aria-controls="spatial-panel"
                  aria-selected={stage === index}
                  tabIndex={stage === index ? 0 : -1}
                  aria-label={`${index + 1}. ${name}`}
                  key={name}
                  onClick={() => controls.current.select(index)}
                >
                  <span>0{index + 1}</span>
                  {name}
                  <i />
                </button>
              ))}
            </div>
            <div className="spatial-controls">
              {manual && pinned && (
                <button onClick={() => controls.current.follow()}>
                  Follow scroll <ArrowDown size={14} />
                </button>
              )}
              {story && (
                <a className="spatial-skip" href="#platform">
                  Explore the platform
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      <div id="story-start" className="spatial-scroll-target" aria-hidden="true" />
      <JourneyTranscript />
    </section>
  );
}
