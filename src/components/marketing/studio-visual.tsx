'use client';
import { useEffect, useRef } from 'react';
import s from './premium-homepage.module.css';

/** Six compositor-transformed faces: no WebGL context, texture upload or render loop. */
export function StudioVisual({ kind }: { kind: 'cube' | 'fluid' }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let visible = false;
    const sync = () => el.setAttribute('data-running', String(visible && !document.hidden));
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return (
    <div
      ref={host}
      className={s.dimensionStudio}
      data-running="false"
      role="group"
      aria-label={`Rotating three-dimensional ${kind === 'cube' ? 'connected workspace cube' : 'workspace sculpture'}`}
    >
      <div className={s.cubeShadow} />
      <div className={s.cubeFloat}>
        <div className={s.dimensionCube} aria-hidden="true">
          {['front', 'back', 'right', 'left', 'top', 'bottom'].map((face, i) => (
            <div key={face} className={s.cubeFace} data-face={face}>
              {Array.from({ length: 9 }, (_, j) => (
                <span key={j} className={j === 4 ? s.cubeTileCenter : undefined}>
                  {j === 4 ? ['G', 'G', '↗', '+', 'G', 'G'][i] : ''}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
