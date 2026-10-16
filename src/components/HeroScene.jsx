import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createEnvironment, precompile, seeded } from '../lib/three-utils';
import { hasWebGL, isTouch } from '../lib/device';
import { resolveAsset } from '../lib/assets';
import { whenShown } from '../lib/ready';

function gyroGeometry() {
  const parts = [new THREE.SphereGeometry(0.42, 32, 24)];
  for (let i = 0; i < 3; i++) {
    const t = new THREE.TorusGeometry(1, 0.15, 24, 80);
    if (i === 1) t.rotateX(Math.PI / 2);
    if (i === 2) t.rotateY(Math.PI / 2);
    parts.push(t);
  }
  return mergeGeometries(parts);
}

function atomGeometry() {
  const core = new THREE.SphereGeometry(0.62, 40, 28);
  const ring = new THREE.TorusGeometry(1.02, 0.16, 24, 80);
  ring.rotateX(Math.PI / 2.6);
  ring.rotateZ(0.5);
  const dot = new THREE.SphereGeometry(0.22, 24, 16);
  dot.translate(1.02, 0, 0);
  dot.rotateX(Math.PI / 2.6);
  dot.rotateZ(0.5);
  return mergeGeometries([core, ring, dot]);
}

const MATS = {
  white: () => new THREE.MeshPhysicalMaterial({ color: 0xf2f5f7, roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12 }),
  black: () => new THREE.MeshPhysicalMaterial({ color: 0x0b0e12, roughness: 0.2, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }),
  violet: () => new THREE.MeshPhysicalMaterial({ color: 0x5b2fe0, roughness: 0.52, metalness: 0.0, sheen: 0.6, sheenColor: new THREE.Color(0x9a80ff), sheenRoughness: 0.55 }),
  teal: () => new THREE.MeshPhysicalMaterial({ color: 0x00c9ae, roughness: 0.36, metalness: 0.0, clearcoat: 0.6, emissive: 0x003b33, emissiveIntensity: 0.5 }),
  gold: () => new THREE.MeshPhysicalMaterial({ color: 0xe3b64a, roughness: 0.24, metalness: 1, clearcoat: 0.4 }),
};

const PLAN = [['white', 0.28], ['violet', 0.27], ['black', 0.23], ['teal', 0.18], ['gold', 0.04]];

export default function HeroScene() {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    if (!el || !hasWebGL()) {
      resolveAsset('hero');
      return undefined;
    }
    const touch = isTouch();
    let disposed = false;
    let envHandle = null;

    const renderer = new THREE.WebGLRenderer({ antialias: !touch, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.25 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.setClearColor(0x0c1015);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 21);

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(-5, 7, 9);
    scene.add(key);
    const rimT = new THREE.PointLight(0x00f5d4, 55, 40, 2);
    rimT.position.set(9, 2, 5);
    const rimV = new THREE.PointLight(0x8b5cf6, 60, 40, 2);
    rimV.position.set(-9, -4, 4);
    scene.add(rimT, rimV);

    createEnvironment(renderer).then((h) => {
      if (disposed) return h.dispose();
      envHandle = h;
      scene.environment = h.env;
      scene.environmentIntensity = 0.85;
      return undefined;
    });

    const rnd = seeded(17);
    const N = touch ? 9 : 17;
    const bodies = [];
    const groups = new Map();
    const geoms = { gyro: gyroGeometry(), atom: atomGeometry() };
    const mats = {};
    const disposables = [geoms.gyro, geoms.atom];

    const pickColor = () => {
      let r = rnd();
      for (const [name, w] of PLAN) {
        if ((r -= w) <= 0) return name;
      }
      return 'white';
    };

    for (let i = 0; i < N; i++) {
      const shape = rnd() < 0.4 ? 'gyro' : 'atom';
      const color = pickColor();
      const s = 1.15 + rnd() * 0.6;
      const key2 = `${shape}-${color}`;
      if (!groups.has(key2)) groups.set(key2, { shape, color, items: [] });
      const body = {
        group: key2,
        s,
        r: (shape === 'gyro' ? 1.08 : 1.02) * s * 1.02,
        p: new THREE.Vector3((rnd() - 0.5) * 23, (rnd() - 0.5) * 10, (rnd() - 0.5) * 4),
        v: new THREE.Vector3(),
        q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28)),
        w: new THREE.Vector3((rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.7),
        delay: rnd() * 0.7,
        idx: 0,
      };
      groups.get(key2).items.push(body);
      bodies.push(body);
    }

    const meshes = [];
    groups.forEach((g) => {
      if (!mats[g.color]) {
        mats[g.color] = MATS[g.color]();
        disposables.push(mats[g.color]);
      }
      const mesh = new THREE.InstancedMesh(geoms[g.shape], mats[g.color], g.items.length);
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      g.items.forEach((b, i) => (b.idx = i));
      g.mesh = mesh;
      scene.add(mesh);
      meshes.push(mesh);
    });

    const bounds = { x: 8.6, y: 3.9, z: 3.4 };
    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = camera.aspect < 1 ? 27 : 21;
      camera.updateProjectionMatrix();
      const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      bounds.y = hh * 0.86;
      bounds.x = hh * camera.aspect * 0.92;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const ndc = new THREE.Vector2(9, 9);
    const pointer = new THREE.Vector3(0, 0, 0);
    const prevPointer = new THREE.Vector3();
    let real = false;
    let lastMove = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      if (e.clientY < r.top - 120 || e.clientY > r.bottom + 120) return;
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      real = true;
      lastMove = performance.now();
    };
    window.addEventListener('pointermove', onMove);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(el);

    const ray = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const tmp = new THREE.Vector3();
    const pv = new THREE.Vector3();
    const dq = new THREE.Quaternion();
    const m4 = new THREE.Matrix4();
    const sc = new THREE.Vector3();

    // The cluster pops in when the loader opens, not while it is still covered.
    let t0 = performance.now() + 60000;
    const unready = whenShown(() => (t0 = performance.now()));
    let frames = 0;
    let prev = performance.now();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) {
        prev = performance.now();
        return;
      }
      const now = performance.now();
      const dt = Math.max(0.0001, Math.min((now - prev) / 1000, 1 / 30));
      prev = now;
      const t = Math.max((now - t0) / 1000, -1);
      if (frames < 4 && ++frames === 4) resolveAsset('hero');

      if (!real || now - lastMove > 3500) {
        ndc.set(Math.cos(t * 0.37) * 0.55, Math.sin(t * 0.53) * 0.4);
      }
      ray.setFromCamera(ndc, camera);
      ray.ray.intersectPlane(plane, tmp);
      prevPointer.copy(pointer);
      pointer.lerp(tmp, 0.22);
      pv.set(pointer.x - prevPointer.x, pointer.y - prevPointer.y, 0).divideScalar(Math.max(dt, 0.001));
      const pspeed = Math.min(pv.length(), 60);
      const strength = real && now - lastMove < 3500 ? 1 : 0.45;

      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        a.v.x += -a.p.x * 0.2 * dt;
        a.v.y += -a.p.y * 0.34 * dt;
        a.v.z += -a.p.z * 1.6 * dt;
        a.v.x += Math.sin(t * 0.4 + a.idx * 1.7 + i) * 0.28 * dt;
        a.v.y += Math.cos(t * 0.33 + i * 0.9) * 0.28 * dt;

        const dx = a.p.x - pointer.x;
        const dy = a.p.y - pointer.y;
        const dz = a.p.z - pointer.z;
        const d = Math.hypot(dx, dy, dz * 0.6) || 0.001;
        const R = 5.2;
        if (d < R) {
          const k = (1 - d / R) ** 2;
          const f = (26 + pspeed * 0.7) * k * strength;
          a.v.x += (dx / d) * f * dt;
          a.v.y += (dy / d) * f * dt;
          a.v.z += (dz / d) * f * dt * 0.5;
          a.w.x += -dy * k * strength * dt * 1.4;
          a.w.y += dx * k * strength * dt * 1.4;
          a.v.x += pv.x * 0.05 * k * strength;
          a.v.y += pv.y * 0.05 * k * strength;
        }

        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          const ex = b.p.x - a.p.x;
          const ey = b.p.y - a.p.y;
          const ez = b.p.z - a.p.z;
          const minD = a.r + b.r;
          const d2 = ex * ex + ey * ey + ez * ez;
          if (d2 < minD * minD && d2 > 1e-6) {
            const dd = Math.sqrt(d2);
            const o = (minD - dd) / dd;
            const px = ex * o * 0.5;
            const py = ey * o * 0.5;
            const pz = ez * o * 0.5;
            a.p.x -= px;
            a.p.y -= py;
            a.p.z -= pz;
            b.p.x += px;
            b.p.y += py;
            b.p.z += pz;
            const nx = ex / dd;
            const ny = ey / dd;
            const nz = ez / dd;
            const rel = (b.v.x - a.v.x) * nx + (b.v.y - a.v.y) * ny + (b.v.z - a.v.z) * nz;
            if (rel < 0) {
              const imp = -rel * 0.85;
              a.v.x -= nx * imp;
              a.v.y -= ny * imp;
              a.v.z -= nz * imp;
              b.v.x += nx * imp;
              b.v.y += ny * imp;
              b.v.z += nz * imp;
              a.w.x += ny * imp * 0.5;
              a.w.y -= nx * imp * 0.5;
              b.w.x -= ny * imp * 0.5;
              b.w.y += nx * imp * 0.5;
            }
          }
        }

        const ox = Math.abs(a.p.x) - bounds.x;
        const oy = Math.abs(a.p.y) - bounds.y;
        if (ox > 0) a.v.x -= Math.sign(a.p.x) * ox * 7 * dt;
        if (oy > 0) a.v.y -= Math.sign(a.p.y) * oy * 7 * dt;

        const damp = Math.exp(-1.7 * dt);
        a.v.multiplyScalar(damp);
        a.w.multiplyScalar(Math.exp(-0.9 * dt));
        a.p.addScaledVector(a.v, dt);
        const wl = a.w.length();
        if (wl > 1e-4) {
          dq.setFromAxisAngle(tmp.copy(a.w).divideScalar(wl), wl * dt);
          a.q.premultiply(dq).normalize();
        }
        a.w.x += Math.sin(t * 0.5 + i) * 0.03 * dt;
      }

      const intro = THREE.MathUtils.clamp((t - 0.1) / 1.4, 0, 1);
      groups.forEach((g) => {
        for (let k = 0; k < g.items.length; k++) {
          const b = g.items[k];
          const e = THREE.MathUtils.clamp((intro * 1.7 - b.delay) / 1, 0, 1);
          const eased = 1 - Math.pow(1 - e, 3);
          sc.setScalar(b.s * eased);
          m4.compose(b.p, b.q, sc);
          g.mesh.setMatrixAt(b.idx, m4);
        }
        g.mesh.instanceMatrix.needsUpdate = true;
      });

      rimT.position.x = 9 + Math.sin(t * 0.3) * 2;
      rimV.position.y = -4 + Math.cos(t * 0.27) * 2;
      renderer.render(scene, camera);
    };
    // Compile shaders on parallel threads before the first frame instead of freezing the loader.
    precompile(renderer, scene, camera)
      .catch(() => {})
      .then(() => {
        if (!disposed) tick();
      });

    return () => {
      disposed = true;
      unready();
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      disposables.forEach((d) => d.dispose?.());
      meshes.forEach((m) => m.dispose?.());
      envHandle?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="sl-hero-canvas" aria-hidden="true" />;
}
