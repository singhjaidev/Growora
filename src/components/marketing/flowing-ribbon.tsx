'use client';

import { useEffect, useRef } from 'react';
import s from './premium-homepage.module.css';

export function FlowingRibbon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let visible = false;
    let last = 0;
    let time = 0;
    const resolution = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = 480 * resolution;
    canvas.height = 420 * resolution;
    ctx.scale(resolution, resolution);

    const mist = document.createElement('canvas');
    mist.width = canvas.width;
    mist.height = canvas.height;
    const glow = mist.getContext('2d');
    if (!glow) return;
    glow.scale(resolution, resolution);

    const tau = Math.PI * 2;
    const foldCount = 8;
    const samples = 240;

    // Two translucent sheets drift through each other, catching light at
    // different folds while keeping a single quiet, continuous silhouette.
    const draw = () => {
      glow.clearRect(0, 0, 480, 420);
      glow.globalCompositeOperation = 'source-over';
      for (let layer = 0; layer < 2; layer++) {
        const phase = layer * 0.8;
        for (let strand = 0; strand < 64; strand++) {
          const band = (strand / 63) * 2 - 1;
          const density = Math.pow(1 - Math.abs(band), 0.45);
          const lighting = time * 0.19 + phase;
          const lx = Math.cos(lighting) * 100;
          const ly = Math.sin(lighting) * 100;
          const light = glow.createLinearGradient(240 - lx, 210 - ly, 240 + lx, 210 + ly);
          const opacity = layer === 0 ? 1 : 0.55;
          light.addColorStop(0, `rgba(16, 75, 62, ${(0.05 + density * 0.04) * opacity})`);
          light.addColorStop(0.35, `rgba(20, 145, 125, ${(0.08 + density * 0.06) * opacity})`);
          light.addColorStop(0.55, `rgba(78, 226, 182, ${(0.1 + density * 0.06) * opacity})`);
          light.addColorStop(0.75, `rgba(25, 127, 130, ${(0.05 + density * 0.04) * opacity})`);
          light.addColorStop(1, `rgba(45, 180, 150, ${(0.08 + density * 0.05) * opacity})`);
          glow.beginPath();
          for (let j = 0; j <= samples; j++) {
            const a = (j / samples) * tau;
            const drift = time * 0.35 + phase;
            const contour =
              87 + 5 * Math.sin(3 * a + drift) + 3 * Math.sin(foldCount * a - time * 0.28);
            const twist = 2 * a + 0.55 * Math.sin(3 * a - drift) + time * 0.22 + phase;
            const width = (15 + 2 * Math.sin(3 * a - time * 0.3)) * Math.sin(twist);
            const radius =
              contour +
              band * width +
              3 * Math.sin(3 * a + band * 1.8 - drift) +
              layer * 4 * Math.sin(2 * a - time * 0.24);
            const angle = a + band * 0.045 * Math.cos(twist);
            const x = 240 + Math.cos(angle) * radius;
            const y = 210 + Math.sin(angle) * radius * 1.06 + band * 8 * Math.cos(twist);
            if (j === 0) glow.moveTo(x, y);
            else glow.lineTo(x, y);
          }
          glow.closePath();
          glow.strokeStyle = light;
          glow.lineWidth = 1.4;
          glow.stroke();
        }
      }
      ctx.clearRect(0, 0, 480, 420);
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'blur(6px)';
      ctx.globalAlpha = 0.22;
      ctx.drawImage(mist, 0, 0, 480, 420);
      ctx.filter = 'blur(1.2px)';
      ctx.globalAlpha = 0.9;
      ctx.drawImage(mist, 0, 0, 480, 420);
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
    };
    const animate = (now: number) => {
      if (now - last >= 1000 / 60) {
        time += last ? Math.min((now - last) / 1000, 0.05) * 2.5 : 0;
        last = now;
        draw();
      }
      frame = requestAnimationFrame(animate);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(animate);
      else draw();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(canvas);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    draw();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return (
    <div className={s.ribbonPanel} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
