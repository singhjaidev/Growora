'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { chapterProgress, type SceneClock, type SceneFrame } from '@/lib/lead-story';
import { consoleTexture } from './console-texture';

const ease = (a: number, b: number, t: number) => THREE.MathUtils.smoothstep(t, a, b);
/** One physical console. Its layers unfold; the renderer never changes between chapters. */
export default function LeadEngine({
  clock,
  onReadyChange,
}: {
  clock: SceneClock;
  onReadyChange: (ready: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const readyCallback = useRef(onReadyChange);
  useEffect(() => {
    readyCallback.current = onReadyChange;
  }, [onReadyChange]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      readyCallback.current(false);
      return;
    }
    let dpr = Math.min(devicePixelRatio, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0xf8f9fc, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    element.appendChild(renderer.domElement);
    element!.dataset.sceneId = crypto.randomUUID();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 20);
    const pmrem = new THREE.PMREMGenerator(renderer),
      room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.8;
    room.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9da4c3, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(-5, 8, 12);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc1c9fa, 2);
    rim.position.set(9, -3, 3);
    scene.add(rim);
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const geo = <T extends THREE.BufferGeometry>(g: T) => {
      geometries.push(g);
      return g;
    };
    const mat = <T extends THREE.Material>(m: T) => {
      materials.push(m);
      return m;
    };
    const metal = mat(
      new THREE.MeshStandardMaterial({ color: 0xaeb5c6, metalness: 0.92, roughness: 0.22 }),
    );
    const graphite = mat(
      new THREE.MeshStandardMaterial({ color: 0x272c3f, metalness: 0.6, roughness: 0.3 }),
    );
    const pearl = mat(
      new THREE.MeshStandardMaterial({ color: 0xf2f3fa, metalness: 0.32, roughness: 0.26 }),
    );
    const glass = mat(
      new THREE.MeshPhysicalMaterial({
        color: 0xc6cce5,
        metalness: 0.15,
        roughness: 0.16,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    const accent = mat(
      new THREE.MeshStandardMaterial({ color: 0x455795, metalness: 0.6, roughness: 0.27 }),
    );
    const led = mat(
      new THREE.MeshStandardMaterial({
        color: 0xaebded,
        emissive: 0x697cb4,
        emissiveIntensity: 0.6,
        roughness: 0.4,
      }),
    );
    function shape(w: number, h: number, r: number) {
      const s = new THREE.Shape(),
        x = -w / 2,
        y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }
    function plate(
      w: number,
      h: number,
      d: number,
      r: number,
      material: THREE.Material,
      parent: THREE.Object3D,
    ) {
      const g = geo(
        new THREE.ExtrudeGeometry(shape(w, h, r), {
          depth: d,
          bevelEnabled: true,
          bevelSegments: 3,
          steps: 1,
          bevelSize: 0.035,
          bevelThickness: 0.035,
          curveSegments: 12,
        }),
      );
      g.translate(0, 0, -d / 2);
      const m = new THREE.Mesh(g, material);
      parent.add(m);
      return m;
    }
    const assembly = new THREE.Group();
    scene.add(assembly);
    const base = new THREE.Group(),
      middle = new THREE.Group(),
      front = new THREE.Group();
    assembly.add(base, middle, front);
    plate(10.5, 6.8, 0.19, 0.43, metal, base);
    const back = plate(10.35, 6.65, 0.14, 0.39, graphite, base);
    back.position.z = 0.14;
    const inset = plate(9.92, 6.21, 0.05, 0.26, accent, base);
    inset.position.z = 0.25;
    // Fine milled lines become visible only when the interface opens.
    const traceGeo = geo(new THREE.BoxGeometry(7.9, 0.012, 0.01));
    for (let i = 0; i < 19; i++) {
      const m = new THREE.Mesh(traceGeo, metal);
      m.position.set(0, -2.4 + i * 0.27, 0.292);
      base.add(m);
    }
    const core = plate(1.5, 1.5, 0.06, 0.24, metal, base);
    core.position.z = 0.34;
    const coreTop = plate(1.34, 1.34, 0.03, 0.19, graphite, base);
    coreTop.position.z = 0.395;
    const mark = new THREE.Mesh(geo(new THREE.TorusGeometry(0.34, 0.035, 8, 48)), led);
    mark.position.z = 0.435;
    base.add(mark);
    plate(10.28, 6.55, 0.05, 0.4, glass, middle);
    const rimPlate = plate(10.12, 6.38, 0.13, 0.36, metal, front);
    rimPlate.position.z = -0.09;
    plate(9.99, 6.25, 0.08, 0.33, pearl, front);
    const textures = Array.from({ length: 6 }, (_, i) => consoleTexture(i));
    const screenMat = mat(new THREE.MeshBasicMaterial({ map: textures[5], toneMapped: false }));
    const screenGeo = geo(new THREE.ShapeGeometry(shape(9.7, 6.04, 0.24), 16));
    const pos = screenGeo.attributes.position,
      uv = screenGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++)
      uv.setXY(i, (pos.getX(i) + 4.85) / 9.7, (pos.getY(i) + 3.02) / 6.04);
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.084;
    front.add(screen);
    const scoreRing = new THREE.Mesh(
      geo(new THREE.TorusGeometry(1.085, 0.043, 10, 96, Math.PI * 1.82)),
      accent,
    );
    scoreRing.position.set(-2.655, -0.574, 0.16);
    scoreRing.rotation.z = Math.PI / 2 + Math.PI * 0.18;
    front.add(scoreRing);
    // Machined edge details, all contained on the single object.
    const slot = plate(0.64, 0.035, 0.014, 0.016, graphite, front);
    slot.position.set(3.9, -3.17, -0.08);
    const status = new THREE.Mesh(geo(new THREE.SphereGeometry(0.026, 12, 8)), led);
    status.position.set(4.37, -3.17, -0.07);
    front.add(status);
    // A soft studio contact shadow, avoiding expensive dynamic shadow maps.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 3, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(35,41,65,.2)');
    gradient.addColorStop(0.45, 'rgba(35,41,65,.1)');
    gradient.addColorStop(1, 'rgba(35,41,65,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadow = new THREE.Mesh(
      geo(new THREE.PlaneGeometry(15, 4)),
      mat(
        new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }),
      ),
    );
    shadow.position.set(0, -4.2, -2);
    scene.add(shadow);
    let frame = clock.getSnapshot(),
      width = 1,
      height = 1,
      visible = true,
      lost = false,
      disposed = false,
      loaded = false,
      lastRender = 0,
      drawCount = 0,
      cost = 0,
      samples = 0;
    const ready = (value: boolean) => {
      element!.dataset.loaded = String(value);
      if (loaded !== value) {
        loaded = value;
        readyCallback.current(value);
      }
    };
    function draw(force = false) {
      if (disposed || lost || !visible || document.hidden) return;
      const now = performance.now();
      if (!force && now - lastRender < 16) return;
      const started = performance.now(),
        p = frame.progress,
        t = chapterProgress(p),
        unfold = ease(0.015, 0.18, p);
      const chapter = Math.min(5, Math.floor(t * 6));
      const opening = 1 - ease(0, 1, frame.intro);
      const scoreFocus = ease(0.36, 0.43, p) * (1 - ease(0.51, 0.58, p));
      const handover = ease(0.56, 0.68, p) * (1 - ease(0.79, 0.86, p));
      const separation = ease(0.08, 0.28, p) * (1 - ease(0.81, 0.98, p));
      const breathing = 0;
      // The same product stays beside the headline and opens into the story.
      const openingX = Math.max(3.6, Math.min(5.15, (width / height) * 2.45));
      assembly.position.set(
        openingX + unfold * (3.65 - openingX),
        0.25 + unfold * 0.9 + breathing,
        0,
      );
      const openingScale = width > 1200 ? 1.02 : 0.96;
      assembly.scale.setScalar(openingScale + unfold * (1 - openingScale));
      assembly.rotation.set(
        -0.35 + unfold * 0.13 + scoreFocus * 0.18 + frame.pointerY * 0.018,
        -0.22 - unfold * 0.17 + scoreFocus * 0.27 + handover * 0.35 + frame.pointerX * 0.025,
        -0.055 + Math.sin(t * Math.PI * 2) * 0.035,
      );
      camera.position.z = 20 - unfold * 0.8 + Math.max(0, 1.65 - width / height) * 10;
      camera.updateMatrixWorld();
      base.position.set(
        -separation * 1.05,
        -separation * 0.95,
        -0.32 - separation * 0.85 - opening * 0.6,
      );
      middle.position.set(-separation * 0.24, -separation * 0.35, 0.04 + separation * 0.22);
      middle.rotation.y = separation * -0.035;
      front.position.set(
        separation * 0.2,
        separation * 0.25,
        0.28 + separation * 1.15 + opening * 1.7,
      );
      front.rotation.y = -opening * 0.08;
      screenMat.map = textures[frame.story ? chapter : 5];
      scoreRing.visible = !frame.story || chapter === 2 || chapter === 5;
      scoreRing.position.z = 0.16 + scoreFocus * 0.42;
      led.emissiveIntensity = 0.4 + (1 - opening) * 0.55 + breathing;
      shadow.position.set(assembly.position.x, -3.95, -2);
      shadow.scale.x = 1 + separation * 0.15;
      try {
        renderer.render(scene, camera);
        ready(true);
      } catch {
        lost = true;
        ready(false);
      }
      element!.dataset.frames = String(++drawCount);
      element!.dataset.progress = p.toFixed(3);
      element!.dataset.drawCalls = String(renderer.info.render.calls);
      element!.dataset.triangles = String(renderer.info.render.triangles);
      element!.dataset.dpr = String(dpr);
      cost += performance.now() - started;
      samples++;
      if (samples === 120) {
        element!.dataset.cpuMs = (cost / samples).toFixed(2);
        if (cost / samples > 18 && dpr > 1) {
          dpr = 1;
          renderer.setPixelRatio(dpr);
          renderer.setSize(width, height, false);
        }
        cost = 0;
        samples = 0;
      }
      lastRender = now;
    }
    function resize() {
      const rect = element!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw(true);
    }
    const unsubscribe = clock.subscribe((next: SceneFrame) => {
      frame = next;
      draw();
    });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(element);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) draw(true);
    });
    observer.observe(element);
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      ready(false);
    };
    const contextRestored = () => {
      lost = false;
      draw(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
    void document.fonts.ready.then(() => {
      if (disposed) return;
      textures.forEach((texture, i) => {
        const replacement = consoleTexture(i);
        texture.image = replacement.image;
        texture.needsUpdate = true;
        replacement.dispose();
      });
      draw(true);
    });
    resize();
    return () => {
      disposed = true;
      unsubscribe();
      resizeObserver.disconnect();
      observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      ready(false);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      shadowTexture.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [clock]);
  return <div className="spatial-webgl" ref={host} aria-hidden="true" />;
}
