'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Imported only when the corresponding scene approaches the viewport.
export default function StudioScene({
  kind,
  paused,
  onReady,
}: {
  kind: 'cube' | 'fluid';
  paused: boolean;
  onReady: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.25 : 1.75),
    );
    renderer.setClearColor(kind === 'cube' ? 0x080c0b : 0x0b211b, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = kind === 'cube' ? 0.95 : 1.1;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, kind === 'cube' ? 9.4 : 8.4);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = kind === 'cube' ? 0.65 : 1.35;
    room.dispose();
    pmrem.dispose();
    const root = new THREE.Group();
    scene.add(root);
    const key = new THREE.DirectionalLight(0xe7f0ff, kind === 'cube' ? 3 : 3);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6fbed1, 2.5);
    rim.position.set(4, 1, -2);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 1.5);
    fill.position.set(0, -3, 3);
    scene.add(fill);
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const layers: THREE.Group[] = [];
    let fluidGeometry: THREE.BufferGeometry | undefined;
    let fluidPositions: Float32Array | undefined;
    if (kind === 'cube') {
      const geo = new RoundedBoxGeometry(0.93, 0.93, 0.93, 4, 0.055);
      geometries.push(geo);
      const finishes = [0.22, 0.29, 0.36].map(
        (roughness) =>
          new THREE.MeshPhysicalMaterial({
            color: 0x0b100e,
            metalness: 0.91,
            roughness,
            clearcoat: 0.55,
            clearcoatRoughness: 0.22,
          }),
      );
      materials.push(...finishes);
      for (let y = -1; y <= 1; y++) {
        const layer = new THREE.Group();
        layer.position.y = y;
        root.add(layer);
        layers.push(layer);
        for (let x = -1; x <= 1; x++)
          for (let z = -1; z <= 1; z++) {
            const block = new THREE.Mesh(geo, finishes[(x + z + 6) % 3]);
            block.position.set(x, 0, z);
            layer.add(block);
          }
      }
      root.rotation.set(0.43, -0.6, 0.1);
      const seamGeo = new THREE.BoxGeometry(0.55, 0.013, 0.008);
      geometries.push(seamGeo);
      const seamMat = new THREE.MeshStandardMaterial({
        color: 0x397874,
        emissive: 0x164441,
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.4,
      });
      materials.push(seamMat);
      const seam = new THREE.Mesh(seamGeo, seamMat);
      seam.position.set(0, -0.27, 1.469);
      layers[1].add(seam);
    } else {
      const around = window.innerWidth < 700 ? 120 : 180;
      const across = 18;
      const vertices = new Float32Array((around + 1) * (across + 1) * 3);
      const indices = [];
      for (let i = 0; i < around; i++)
        for (let j = 0; j < across; j++) {
          const a = i * (across + 1) + j,
            b = a + across + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      fluidGeometry = new THREE.BufferGeometry();
      fluidGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      fluidGeometry.setIndex(indices);
      fluidPositions = vertices;
      geometries.push(fluidGeometry);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x5cbcd7,
        metalness: 0.18,
        roughness: 0.15,
        transmission: 0.72,
        thickness: 1.1,
        ior: 1.32,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide,
        iridescence: 0.28,
        iridescenceIOR: 1.3,
        attenuationColor: new THREE.Color(0x2189a0),
        attenuationDistance: 2.5,
      });
      materials.push(mat);
      root.add(new THREE.Mesh(fluidGeometry, mat));
      root.rotation.set(0.3, -0.25, -0.45);
      root.userData = { around, across };
    }
    function deform(t: number) {
      if (!fluidGeometry || !fluidPositions) return;
      const { around, across } = root.userData;
      let k = 0;
      for (let i = 0; i <= around; i++) {
        const u = (i / around) * Math.PI * 2;
        for (let j = 0; j <= across; j++) {
          const v = (j / across - 0.5) * 1.05;
          const twist = u * 1.5 + t * 0.16;
          const r = 1.36 + 0.14 * Math.sin(u * 3 + t * 0.42) + v * Math.cos(twist);
          fluidPositions[k++] = r * Math.cos(u);
          fluidPositions[k++] = r * Math.sin(u);
          fluidPositions[k++] = 0.38 * Math.sin(u * 2 + t * 0.3) + v * Math.sin(twist);
        }
      }
      fluidGeometry.attributes.position.needsUpdate = true;
      fluidGeometry.computeVertexNormals();
    }
    let visible = false,
      frame = 0,
      time = 0,
      last = 0,
      ready = false;
    const pointer = { x: 0, y: 0 };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    function draw(now: number) {
      frame = 0;
      if (!visible || document.hidden) return;
      const dt = last ? Math.min((now - last) / 1000, 0.04) : 0;
      last = now;
      if (!pausedRef.current && !reduced.matches) time += dt;
      if (kind === 'cube') {
        root.rotation.y = -0.6 + time * 0.07 + (reduced.matches ? 0 : pointer.x * 0.1);
        root.rotation.x = 0.43 + (reduced.matches ? 0 : pointer.y * 0.07);
        const cycle = time % 12;
        const ease = (x: number) => x * x * (3 - 2 * x);
        const phase = Math.max(0, Math.min(1, (cycle - 2) / 3));
        layers[2].rotation.y = (ease(phase) * Math.PI) / 2;
        const back = Math.max(0, Math.min(1, (cycle - 8) / 3));
        layers[2].rotation.y -= (ease(back) * Math.PI) / 2;
        layers[0].rotation.y = -Math.sin(time * 0.32) * 0.14;
        root.position.y = Math.sin(time * 0.35) * 0.055;
      } else {
        deform(time);
        root.rotation.y =
          -0.25 + Math.sin(time * 0.2) * 0.2 + (reduced.matches ? 0 : pointer.x * 0.12);
        root.rotation.x = 0.3 + (reduced.matches ? 0 : pointer.y * 0.1);
      }
      renderer.render(scene, camera);
      if (!ready) {
        ready = true;
        onReady();
      }
      if (!reduced.matches && !pausedRef.current) frame = requestAnimationFrame(draw);
    }
    function wake() {
      if (!frame && visible && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    }
    const size = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      wake();
    };
    const resize = new ResizeObserver(size);
    resize.observe(el);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
        else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { threshold: 0.01 },
    );
    observer.observe(el);
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width - 0.5;
      pointer.y = (e.clientY - r.top) / r.height - 0.5;
      wake();
    };
    const leave = () => {
      pointer.x = pointer.y = 0;
      wake();
    };
    const lost = (e: Event) => {
      e.preventDefault();
      renderer.domElement.style.opacity = '0';
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const restored = () => {
      renderer.domElement.style.opacity = '1';
      wake();
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    renderer.domElement.addEventListener('webglcontextrestored', restored);
    document.addEventListener('visibilitychange', wake);
    reduced.addEventListener('change', wake);
    // An event permits a paused scene to restart without recreating its WebGL context.
    el.addEventListener('studio-resume', wake);
    size();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', wake);
      reduced.removeEventListener('change', wake);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('studio-resume', wake);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      renderer.domElement.removeEventListener('webglcontextrestored', restored);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      env.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [kind, onReady]);
  useEffect(() => {
    if (!paused) host.current?.dispatchEvent(new Event('studio-resume'));
  }, [paused]);
  return <div ref={host} style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />;
}
