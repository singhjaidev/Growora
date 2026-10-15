'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';

// Native scrolling is never intercepted. One scheduler eases product transforms,
// preserving wheel distance, touch, nested scrollers, keyboard and browser zoom.
export function useHomepageMotion(root: RefObject<HTMLDivElement | null>) {
  const [easing, setEasing] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [stage, setStage] = useState(0);
  const [workspaceStage, setWorkspaceStage] = useState(0);
  const manual = useRef({ story: 0, workspace: 0 });
  const refresh = useRef<() => void>(() => {});
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 1050px) and (min-height: 780px)');
    const steps = [...element.querySelectorAll<HTMLElement>('[data-story-step]')];
    const workspace = element.querySelector<HTMLElement>('[data-workspace-scroll]');
    const scene = element.querySelector<HTMLElement>('[data-product-scene]');
    const workspacePanel = element.querySelector<HTMLElement>('[data-workspace-sticky]');
    let frame = 0,
      previous = 0;
    let current = [
      Number(element.style.getPropertyValue('--journey')) || manual.current.story,
      Number(element.style.getPropertyValue('--pipeline')) || manual.current.workspace,
    ];
    let target = [...current];
    const tick = (time: number) => {
      frame = 0;
      const dt = previous ? Math.min(64, time - previous) : 16;
      previous = time;
      const amount = !easing || preference.matches ? 1 : 1 - Math.exp(-dt / 65);
      current = current.map((value, index) =>
        Math.abs(target[index] - value) < 0.003
          ? target[index]
          : value + (target[index] - value) * amount,
      );
      element.style.setProperty('--journey', String(current[0]));
      element.style.setProperty('--pipeline', String(current[1]));
      if (current.some((value, index) => value !== target[index]))
        frame = requestAnimationFrame(tick);
      else previous = 0;
    };
    const update = () => {
      const sceneStatic = !!scene && scene.offsetHeight > innerHeight - 110;
      const workspaceStatic = !!workspacePanel && workspacePanel.offsetHeight > innerHeight - 110;
      element.dataset.sceneStatic = String(sceneStatic);
      element.dataset.workspaceStatic = String(workspaceStatic);
      if (desktop.matches) {
        const readingLine = innerHeight * 0.55;
        const tops = steps.map((step) => step.getBoundingClientRect().top);
        let value = 0;
        for (let i = 0; i < tops.length - 1; i++)
          if (readingLine >= tops[i])
            value = i + Math.max(0, Math.min(1, (readingLine - tops[i]) / (tops[i + 1] - tops[i])));
        target[0] = sceneStatic ? manual.current.story : value;
        if (workspace && !workspaceStatic) {
          const box = workspace.getBoundingClientRect();
          target[1] = Math.max(
            0,
            Math.min(2, ((110 - box.top) / Math.max(1, box.height - innerHeight * 0.75)) * 2),
          );
        } else target[1] = manual.current.workspace;
      } else target = [manual.current.story, manual.current.workspace];
      setStage(Math.min(3, Math.round(target[0])));
      setWorkspaceStage(Math.min(2, Math.round(target[1])));
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const media = () => {
      setReduced(preference.matches);
      update();
    };
    refresh.current = update;
    media();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    preference.addEventListener('change', media);
    desktop.addEventListener('change', update);
    const sizes = new ResizeObserver(update);
    if (scene) sizes.observe(scene);
    if (workspacePanel) sizes.observe(workspacePanel);
    return () => {
      sizes.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      preference.removeEventListener('change', media);
      desktop.removeEventListener('change', update);
      refresh.current = () => {};
    };
  }, [easing, root]);
  const selectStory = (index: number) => {
    manual.current.story = index;
    if (
      matchMedia('(min-width: 1050px) and (min-height: 780px)').matches &&
      root.current?.dataset.sceneStatic !== 'true'
    ) {
      const step = root.current?.querySelector<HTMLElement>(`[data-story-step="${index}"]`);
      if (step)
        window.scrollTo({
          top: scrollY + step.getBoundingClientRect().top - innerHeight * 0.55 + 1,
          behavior: 'instant',
        });
    }
    refresh.current();
  };
  const selectWorkspace = (index: number) => {
    manual.current.workspace = index;
    if (
      matchMedia('(min-width: 1050px) and (min-height: 780px)').matches &&
      root.current?.dataset.workspaceStatic !== 'true'
    ) {
      const el = root.current?.querySelector<HTMLElement>('[data-workspace-scroll]');
      if (el)
        window.scrollTo({
          top:
            scrollY +
            el.getBoundingClientRect().top -
            110 +
            (index / 2) * (el.offsetHeight - innerHeight * 0.75),
          behavior: 'instant',
        });
    }
    refresh.current();
  };
  return { easing, reduced, setEasing, stage, workspaceStage, selectStory, selectWorkspace };
}
