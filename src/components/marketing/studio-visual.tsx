'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import s from './premium-homepage.module.css';
const Scene = dynamic(() => import('../three/studio-scene'), { ssr: false });
export function StudioVisual({ kind }: { kind: 'cube' | 'fluid' }) {
  const host = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={host}
      className={`${s.studio} ${kind === 'fluid' ? s.fluidStudio : ''}`}
      role="group"
      aria-label={
        kind === 'cube'
          ? 'An original dark segmented cube, with softly lit bevels and rotating layers.'
          : 'A translucent cyan ribbon, slowly folding and flowing in three dimensions.'
      }
    >
      <div
        className={s.studioFallback}
        style={{ backgroundImage: `url(/images/growora-${kind}-still.svg)` }}
      />
      {load && <Scene kind={kind} paused={paused} onReady={onReady} />}
      <button
        className={s.sceneControl}
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
        disabled={!ready}
      >
        {paused ? 'Play motion' : 'Pause motion'}
      </button>
    </div>
  );
}
