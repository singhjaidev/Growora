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

    // Overlapping soft filaments form a luminous, breathing smoke loop.
    // Each filament folds independently, so the silhouette never rotates as a rigid object.
    const draw = () => {
      glow.clearRect(0, 0, 480, 420);
      glow.globalCompositeOperation = 'lighter';
      for (let strand = 0; strand < 72; strand++) {
        const band = (strand / 71) * 2 - 1;
        const density = Math.pow(1 - Math.abs(band), 0.55);
        const light = glow.createLinearGradient(150, 105, 320, 315);
        light.addColorStop(0, 'rgba(0, 131, 89, ' + (0.025 + density * 0.018) + ')');
        light.addColorStop(0.35, 'rgba(0, 210, 144, ' + (0.035 + density * 0.045) + ')');
        light.addColorStop(0.65, 'rgba(0, 174, 116, ' + (0.025 + density * 0.03) + ')');
        light.addColorStop(1, 'rgba(0, 224, 153, ' + (0.035 + density * 0.045) + ')');
        glow.beginPath();
        for (let j = 0; j <= 180; j++) {
          const a = (j / 180) * Math.PI * 2;
          const drift = time * 0.52;
          const contour = 86 + 8 * Math.sin(3 * a + drift) + 5 * Math.sin(5 * a - time * 0.38);
          const plume = 9 + 9 * Math.sin(2 * a + time * 0.6);
          const curl = 7 * Math.sin(2 * a + band * 2.5 - time * 0.44);
          const radius = contour + band * plume + curl;
          const x = 240 + Math.cos(a) * radius + 4 * Math.sin(3 * a + drift + band);
          const y = 210 + Math.sin(a) * radius * 1.06 + 5 * Math.cos(2 * a - drift + band * 1.4);
          if (j === 0) glow.moveTo(x, y);
          else glow.lineTo(x, y);
        }
        glow.closePath();
        glow.strokeStyle = light;
        glow.lineWidth = 1.8 + density * 1.4;
        glow.stroke();
      }
      ctx.clearRect(0, 0, 480, 420);
      const halo = ctx.createRadialGradient(240, 210, 40, 240, 210, 160);
      halo.addColorStop(0, '#2a5a4510');
      halo.addColorStop(0.6, '#18765412');
      halo.addColorStop(1, '#18765400');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, 480, 420);
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = 'blur(7px)';
      ctx.globalAlpha = 0.45;
      ctx.drawImage(mist, 0, 0, 480, 420);
      ctx.filter = 'blur(1.6px)';
      ctx.globalAlpha = 0.95;
      ctx.drawImage(mist, 0, 0, 480, 420);
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };
    const animate = (now: number) => {
      if (now - last >= 1000 / 30) {
        time += last ? Math.min((now - last) / 1000, 0.06) : 0;
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
