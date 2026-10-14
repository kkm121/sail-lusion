import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Stars, useAnimations, useGLTF } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ErrorBoundary } from './blob/ErrorBoundary';
import CageClassic from './CageClassic';
import { isTouch } from '../lib/device';
import { HAVE, MEDIA } from '../data/media';
import { glowTexture, seeded } from '../lib/three-utils';
import { CAGE_END, CONNECT_END, LAT_RINGS, LAT_STEP, ROOM_END, ROOM_START, START, Z0, ZTOT, chapterAt } from '../lib/journey';

const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const W = 6.2;
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpC = new THREE.Vector3();
const tmpD = new THREE.Vector3();

function fillMatrices(mesh, items) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  items.forEach((it, i) => {
    if (it.q) q.copy(it.q);
    else q.setFromEuler(e.set(it.r?.[0] || 0, it.r?.[1] || 0, it.r?.[2] || 0));
    m.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...it.s));
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

function FollowStars({ count }) {
  const g = useRef();
  useFrame((s) => {
    if (g.current) g.current.position.z = s.camera.position.z;
  });
  return (
    <group ref={g}>
      <Stars radius={110} depth={60} count={count} factor={4.2} fade speed={0.35} />
    </group>
  );
}

const LAT_LEN = LAT_RINGS * LAT_STEP;
const vR = (u) => 5.5 - 3.2 * Math.pow(u, 1.15) + Math.sin(u * 16) * 0.22;
const vZ = (u) => CAGE_END - u * LAT_LEN;
const VSTOPS = ['#00f5d4', '#38bdf8', '#7c5cff', '#d04bff', '#f5c84b'].map((c) => new THREE.Color(c));
const vColor = (f, out) => {
  const x = Math.max(0, Math.min(VSTOPS.length - 1.001, f * (VSTOPS.length - 1)));
  const i = Math.floor(x);
  return out.copy(VSTOPS[i]).lerp(VSTOPS[i + 1], x - i);
};

const PAL = `
vec3 pal(float t){
  vec3 a = vec3(0.0, 0.96, 0.83), b = vec3(0.22, 0.74, 0.97), c = vec3(0.49, 0.36, 1.0), d = vec3(0.82, 0.29, 1.0), e = vec3(0.96, 0.78, 0.29);
  t = clamp(t, 0., 1.) * 4.;
  return t < 1. ? mix(a, b, t) : t < 2. ? mix(b, c, t - 1.) : t < 3. ? mix(c, d, t - 2.) : mix(d, e, t - 3.);
}`;

const SILK_V = `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const SILK_F = `uniform float uTime; uniform float uAlpha; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
${PAL}
void main(){
  float u = vUv.x, v = vUv.y;
  float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 1.5);
  float g1 = pow(abs(sin(v * 6.2831 * 9. + u * 28. - uTime * 0.25)), 16.);
  float g2 = pow(abs(sin(v * 6.2831 * 23. - u * 60. + uTime * 0.18)), 26.);
  float flow = 0.5 + 0.5 * sin(u * 18. - uTime * 0.6 + v * 6.2831 * 3.);
  vec3 col = pal(u + (flow - .5) * 0.18);
  float body = 0.025 + f * 0.13;
  float a = (body + g1 * 0.2 + g2 * 0.13) * smoothstep(0., .05, u) * (1. - smoothstep(.93, 1., u));
  gl_FragColor = vec4(col * (0.7 + f * 1.1 + g1 * 1.5 + g2 * 1.1), a * uAlpha);
}`;

const MOTE_V = `uniform float uTime; uniform float uZ0; uniform float uLen; uniform float uScale;
attribute vec4 aSeed; varying vec3 vC; varying float vA;
${PAL}
float fr(float u){ return 5.5 - 3.2 * pow(u, 1.15) + sin(u * 16.) * 0.22; }
void main(){
  float u = fract(aSeed.x + uTime * aSeed.w * 0.018);
  float th = aSeed.y + u * 6.2831 * aSeed.z * 1.4;
  float r = fr(u) * (0.35 + 0.62 * fract(aSeed.y * 7.31));
  vec3 p = vec3(cos(th) * r, sin(th) * r, uZ0 - u * uLen);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uScale * (0.6 + aSeed.w) * (26. / max(-mv.z, 1.));
  vC = pal(u);
  vA = smoothstep(0., .06, u) * (1. - smoothstep(.9, 1., u));
}
`;
const MOTE_F = `uniform float uAlpha; varying vec3 vC; varying float vA;
void main(){
  float d = length(gl_PointCoord - .5) * 2.;
  float a = pow(max(1. - d, 0.), 2.2) * vA * uAlpha;
  gl_FragColor = vec4(mix(vC, vec3(1.), 0.45) * 1.6, a);
}`;

function Lattice({ sp, touch }) {
  const silkMat = useRef();
  const moteMat = useRef();
  const { objs, mats, silk, motes } = useMemo(() => {
    const rnd = seeded(404);
    const SEG = 180;
    const build = (list, lw, gain) => {
      const pos = [];
      const col = [];
      const c = new THREE.Color();
      list.forEach(({ rf, dir, turns, ph, hueShift, br }) => {
        let prev = null;
        for (let i = 0; i <= SEG; i++) {
          const u = i / SEG;
          const th = ph + dir * turns * Math.PI * 2 * u + Math.sin(u * 9 + ph) * 0.03;
          const R = vR(u) * rf;
          const cur = [Math.cos(th) * R, Math.sin(th) * R, vZ(u)];
          const fade = Math.min(1, u / 0.05) * (0.45 + 0.55 * (1 - Math.min(1, Math.max(0, (u - 0.7) / 0.3))));
          vColor(Math.max(0, Math.min(1, u + hueShift)), c);
          const cc = [c.r * br * gain * fade, c.g * br * gain * fade, c.b * br * gain * fade];
          if (prev) {
            pos.push(...prev.p, ...cur);
            col.push(...prev.c, ...cc);
          }
          prev = { p: cur, c: cc };
        }
      });
      const g = new LineSegmentsGeometry();
      g.setPositions(pos);
      g.setColors(col);
      return { g, lw };
    };
    const shells = touch ? [[1.0, 30], [0.76, 22]] : [[1.0, 46], [0.8, 36], [0.6, 26]];
    const fineList = [];
    shells.forEach(([rf, n], si) => {
      for (let i = 0; i < n; i++) {
        const base = (i / n) * Math.PI * 2 + si * 0.21;
        fineList.push({ rf, dir: 1, turns: 1.35, ph: base, hueShift: 0, br: 1 - si * 0.16 });
        fineList.push({ rf, dir: -1, turns: 1.35, ph: base + Math.PI / n, hueShift: 0.1, br: 1 - si * 0.16 });
      }
    });
    const heroList = [];
    const hn = touch ? 6 : 12;
    for (let i = 0; i < hn; i++) heroList.push({ rf: 1.0, dir: i % 2 ? -1 : 1, turns: 1.35, ph: (i / hn) * Math.PI * 2 + 0.07, hueShift: 0.04, br: 1.7 });
    const fine = build(fineList, touch ? 0.03 : 0.024, 1.25);
    const hero = build(heroList, touch ? 0.1 : 0.075, 1.5);
    const mats = [fine, hero].map((o) => {
      const m = new LineMaterial({ linewidth: o.lw, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
      m.worldUnits = true;
      return m;
    });

    // smooth silk skin on the funnel wall
    const U = 150;
    const V = 96;
    const sp3 = [];
    const uv = [];
    for (let i = 0; i <= U; i++) {
      const u = i / U;
      for (let j = 0; j <= V; j++) {
        const v = j / V;
        const a = v * Math.PI * 2 + u * 3.2;
        const R = vR(u) * 1.0;
        sp3.push(Math.cos(a) * R, Math.sin(a) * R, vZ(u));
        uv.push(u, v);
      }
    }
    const idx = [];
    for (let i = 0; i < U; i++) {
      for (let j = 0; j < V; j++) {
        const a = i * (V + 1) + j;
        const b = a + V + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const silk = new THREE.BufferGeometry();
    silk.setAttribute('position', new THREE.Float32BufferAttribute(sp3, 3));
    silk.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    silk.setIndex(idx);
    silk.computeVertexNormals();

    const n = touch ? 260 : 700;
    const seeds = [];
    for (let i = 0; i < n; i++) seeds.push(rnd(), rnd() * Math.PI * 2, rnd() < 0.5 ? 1 : -1, 0.4 + rnd() * 0.9);
    const motes = new THREE.BufferGeometry();
    motes.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    motes.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 4));
    const objs = [new LineSegments2(fine.g, mats[0]), new LineSegments2(hero.g, mats[1])];
    objs.forEach((l, i) => {
      l.frustumCulled = false;
      l.renderOrder = 3 + i;
    });
    return { objs, mats, silk, motes };
  }, [touch]);
  const silkU = useMemo(() => ({ uTime: { value: 0 }, uAlpha: { value: 0 } }), []);
  const moteU = useMemo(() => ({ uTime: { value: 0 }, uZ0: { value: CAGE_END }, uLen: { value: LAT_LEN }, uScale: { value: touch ? 5 : 7 }, uAlpha: { value: 0 } }), [touch]);
  useFrame((s) => {
    const zc = s.camera.position.z;
    if (zc > -85 || zc < ROOM_START - 20) return;
    const t = s.clock.elapsedTime;
    const enterFade = seg(zc, -88, -114);
    const exitFade = 1 - seg(zc, ROOM_START + 10, ROOM_START - 5);
    const alpha = enterFade * exitFade;

    if (silkMat.current) {
      silkMat.current.uniforms.uTime.value = t;
      silkMat.current.uniforms.uAlpha.value = alpha;
    }
    if (moteMat.current) {
      moteMat.current.uniforms.uTime.value = t;
      moteMat.current.uniforms.uAlpha.value = alpha;
    }
    mats.forEach((m) => {
      m.resolution.set(s.size.width, s.size.height);
      m.opacity = alpha;
    });
  });
  return (
    <>
      <mesh geometry={silk} frustumCulled={false} renderOrder={2}>
        <shaderMaterial ref={silkMat} vertexShader={SILK_V} fragmentShader={SILK_F} uniforms={silkU} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <primitive object={objs[0]} />
      <primitive object={objs[1]} />
      <points geometry={motes} frustumCulled={false} renderOrder={5}>
        <shaderMaterial ref={moteMat} vertexShader={MOTE_V} fragmentShader={MOTE_F} uniforms={moteU} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </points>
    </>
  );
}

const ROOM_COLS = ['#00f5d4', '#8b5cf6', '#ff4d8d', '#f5c84b', '#38bdf8'];

function paint(mesh, items, gain) {
  const c = new THREE.Color();
  items.forEach((it, i) => mesh.setColorAt(i, c.set(it.c).multiplyScalar(gain)));
  mesh.instanceColor.needsUpdate = true;
}

function Room() {
  const rings = useRef();
  const discs = useRef();
  const frames = useRef();
  const fills = useRef();
  const strips = useRef();
  const len = ROOM_START - ROOM_END;
  const cz = (ROOM_START + ROOM_END) / 2;
  const H = 4.3;
  const data = useMemo(() => {
    const rnd = seeded(505);
    const ringItems = [];
    const discItems = [];
    for (let i = 0; i < 110; i++) {
      const wall = Math.floor(rnd() * 4);
      const z = ROOM_START - 4 - rnd() * (len - 8);
      const big = rnd() < 0.18;
      const r = big ? 0.9 + rnd() * 0.5 : 0.28 + rnd() * 0.55;
      const u = (rnd() * 2 - 1) * (H - r * 1.2);
      const ring = rnd() < 0.7;
      const tgt = ring ? ringItems : discItems;
      const s = ring ? [r, r, 1] : [r * 0.7, r * 0.7, 1];
      const c = ROOM_COLS[Math.floor(rnd() * ROOM_COLS.length)];
      const it = { s, c };
      if (wall === 0) Object.assign(it, { p: [u, -H + 0.02, z], r: [-Math.PI / 2, 0, 0] });
      else if (wall === 1) Object.assign(it, { p: [u, H - 0.02, z], r: [Math.PI / 2, 0, 0] });
      else if (wall === 2) Object.assign(it, { p: [-H + 0.02, u, z], r: [0, Math.PI / 2, 0] });
      else Object.assign(it, { p: [H - 0.02, u, z], r: [0, -Math.PI / 2, 0] });
      tgt.push(it);
    }
    const arch = [];
    for (let i = 0; ROOM_START - 14 - i * 10.5 > ROOM_END + 3; i++) {
      const z = ROOM_START - 9 - i * 10.5;
      arch.push({ p: [-H + 0.03, -H + 1.7, z], s: [1.7, 3.4, 1], r: [0, Math.PI / 2, 0], c: ROOM_COLS[(i * 2) % 5] });
      arch.push({ p: [H - 0.03, -H + 1.7, z - 5], s: [1.7, 3.4, 1], r: [0, -Math.PI / 2, 0], c: ROOM_COLS[(i * 2 + 1) % 5] });
    }
    const tube = [];
    const seg = 7;
    const sl = (len - 2) / seg;
    for (let k = 0; k < seg; k++) {
      const z = ROOM_START - 1 - sl * (k + 0.5);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], j) => {
        tube.push({ p: [sx * (H - 0.14), sy * (H - 0.14), z], s: [0.16, 0.16, sl - 0.5], r: [0, 0, 0], c: ROOM_COLS[(k + j) % 5] });
      });
    }
    return { ringItems, discItems, arch, tube };
  }, [len]);
  const frameGeo = useMemo(() => {
    const outer = (sh, d) => {
      sh.moveTo(-0.5 + d, -0.5);
      sh.lineTo(0.5 - d, -0.5);
      sh.lineTo(0.5 - d, 0.2);
      sh.absarc(0, 0.2, 0.5 - d, 0, Math.PI, false);
      sh.lineTo(-0.5 + d, -0.5);
    };
    const s = new THREE.Shape();
    outer(s, 0);
    const hole = new THREE.Path();
    hole.moveTo(-0.5 + 0.07, -0.5);
    hole.lineTo(-0.5 + 0.07, 0.2);
    hole.absarc(0, 0.2, 0.5 - 0.07, Math.PI, 0, true);
    hole.lineTo(0.5 - 0.07, -0.5);
    hole.lineTo(-0.5 + 0.07, -0.5);
    s.holes.push(hole);
    return new THREE.ShapeGeometry(s, 24);
  }, []);
  const fillGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.43, -0.5);
    s.lineTo(0.43, -0.5);
    s.lineTo(0.43, 0.2);
    s.absarc(0, 0.2, 0.43, 0, Math.PI, false);
    s.lineTo(-0.43, -0.5);
    return new THREE.ShapeGeometry(s, 24);
  }, []);
  const hull = useMemo(() => {
    const g = new THREE.BoxGeometry(H * 2, H * 2, len);
    g.setIndex(Array.from(g.index.array).slice(0, 24));
    g.clearGroups();
    return g;
  }, [len]);
  useLayoutEffect(() => {
    fillMatrices(rings.current, data.ringItems);
    paint(rings.current, data.ringItems, 1.5);
    fillMatrices(discs.current, data.discItems);
    paint(discs.current, data.discItems, 0.16);
    fillMatrices(frames.current, data.arch);
    paint(frames.current, data.arch, 1.8);
    fillMatrices(fills.current, data.arch);
    paint(fills.current, data.arch, 0.5);
    fillMatrices(strips.current, data.tube);
    paint(strips.current, data.tube, 2.2);
  }, [data]);
  return (
    <group>
      <mesh position={[0, 0, cz]} geometry={hull}>
        <meshStandardMaterial color="#071318" emissive="#031c22" emissiveIntensity={0.3} roughness={0.32} metalness={0.8} side={THREE.BackSide} />
      </mesh>
      <instancedMesh ref={rings} args={[undefined, undefined, data.ringItems.length]} frustumCulled={false}>
        <ringGeometry args={[0.8, 1, 6]} />
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={discs} args={[undefined, undefined, data.discItems.length]} frustumCulled={false}>
        <circleGeometry args={[1, 40]} />
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={fills} args={[fillGeo, undefined, data.arch.length]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={frames} args={[frameGeo, undefined, data.arch.length]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={strips} args={[undefined, undefined, data.tube.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

const ORB_V = `varying vec2 vUv; uniform float uSize;
void main(){
  vUv = uv;
  vec4 c = modelViewMatrix * vec4(0., 0., 0., 1.);
  c.xy += position.xy * uSize;
  gl_Position = projectionMatrix * c;
}`;
const ORB_F = `varying vec2 vUv; uniform vec3 uColor; uniform float uPulse;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  float r = length(vUv - .5) * 2.;
  float rim = 1. - smoothstep(0.82, 1., r);
  float glow = exp(-r * 4.6) * rim;
  float body = (1. - smoothstep(0.1, 0.17, r));
  vec3 white = mix(uColor, vec3(1.), 0.78);
  vec3 col = uColor * glow * 1.35 * uPulse + white * body * 1.15;
  col += (hash(gl_FragCoord.xy) - .5) * 0.012 * step(0.002, glow);
  gl_FragColor = vec4(max(col, 0.), 1.);
}`;

function Orb({ position, size, color, speed, phase }) {
  const mesh = useRef();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ORB_V,
        fragmentShader: ORB_F,
        uniforms: { uSize: { value: size * 4.4 }, uColor: { value: new THREE.Color(color) }, uPulse: { value: 1 } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [size, color]
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime * speed + phase;
    if (!mesh.current) return;
    mesh.current.position.set(position[0] + Math.sin(t * 0.7) * 0.45, position[1] + Math.cos(t * 0.9) * 0.4, position[2] + Math.sin(t * 0.5) * 0.7);
    mat.uniforms.uPulse.value = 0.92 + Math.sin(t * 1.5) * 0.1;
  });
  return (
    <mesh ref={mesh} material={mat} position={position} frustumCulled={false} renderOrder={6}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

function Worlds({ touch }) {
  const items = useMemo(() => {
    const rnd = seeded(808);
    const cols = ['#00f5d4', '#8b5cf6', '#38bdf8', '#ff4d8d', '#f5c84b'];
    const z0 = ROOM_END - 8;
    const z1 = CONNECT_END - 2;
    const n = touch ? 8 : 13;
    return Array.from({ length: n }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const big = i % 3 === 0;
      return {
        p: [side * (4.6 + rnd() * 4.2), (rnd() - 0.5) * 4.6, z0 + ((z1 - z0) * (i + 0.4)) / n],
        size: big ? 1.3 + rnd() * 0.4 : 0.8 + rnd() * 0.4,
        c: cols[i % cols.length],
        speed: 0.5 + rnd() * 0.5,
        ph: rnd() * 6,
      };
    });
  }, [touch]);
  return (
    <>
      {items.map((it, i) => (
        <Orb key={i} position={it.p} size={it.size} color={it.c} speed={it.speed} phase={it.ph} />
      ))}
    </>
  );
}

const REL = 7.2;

function Navigator({ sp }) {
  const group = useRef();
  const holder = useRef();
  const { scene, animations } = useGLTF(MEDIA.navigator);
  const model = useMemo(() => {
    const m = skeletonClone(scene);
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    const k = 1 / Math.max(size.y, 0.001);
    const c = box.getCenter(new THREE.Vector3());
    m.userData.fit = { k, c };
    m.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.geometry) {
          o.geometry.computeVertexNormals();
        }
        const matName = (o.material?.name || '').toLowerCase();
        if (matName.includes('main')) {
          // Ultra-luxurious nano-ceramic armor plating
          o.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#f5f7fc'),
            roughness: 0.12,
            metalness: 0.14,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            ior: 1.52,
            reflectivity: 0.88,
            sheen: 0.75,
            sheenColor: new THREE.Color('#9beaff'),
            sheenRoughness: 0.25,
            envMapIntensity: 3.2,
          });
        } else if (matName.includes('grey') || matName.includes('gray')) {
          // Brushed aerospace titanium skeleton and joints
          o.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#141820'),
            roughness: 0.2,
            metalness: 0.95,
            clearcoat: 0.6,
            clearcoatRoughness: 0.1,
            envMapIntensity: 2.8,
          });
        } else if (matName.includes('black')) {
          // Deep obsidian mirror visor with cybernetic optical glow
          o.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#030508'),
            roughness: 0.08,
            metalness: 0.88,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            emissive: new THREE.Color('#00f5d4'),
            emissiveIntensity: 0.35,
            envMapIntensity: 3.8,
          });
        } else if (o.material) {
          o.material.envMapIntensity = 2.4;
          o.material.roughness = Math.min(o.material.roughness ?? 0.4, 0.25);
        }
      }
    });
    return m;
  }, [scene]);
  const { actions } = useAnimations(animations, holder);
  const { camera } = useThree();

  const clip = useRef('');
  useEffect(() => {
    clip.current = '';
    return () => Object.values(actions).forEach((a) => a?.stop());
  }, [actions]);

  const rot = useRef({ x: 0, y: -0.22, z: 0 });
  const pos = useRef({ x: -2.2, y: -0.3, rel: 7.2, s: 1.35 });
  const lastP = useRef(0);
  const velP = useRef(0);

  useFrame((s, dt) => {
    const g = group.current;
    if (!g) return;
    const p = sp.current;
    const t = s.clock.elapsedTime;
    const inTunnel = p >= START;
    const ax = THREE.MathUtils.clamp(camera.aspect / 1.6, 0.34, 1);
    const d = Math.min(dt, 0.05);

    // Dynamic Scroll Momentum & Aerodynamic Inertia
    const scrollVel = (p - lastP.current) / Math.max(d, 0.001);
    lastP.current = p;
    velP.current += (scrollVel - velP.current) * (1 - Math.exp(-6.0 * d));
    const inertiaPitch = THREE.MathUtils.clamp(velP.current * 0.35, -0.45, 0.45);
    const inertiaDragZ = THREE.MathUtils.clamp(-velP.current * 0.9, -1.6, 1.6);

    // Organic Zero-G Harmonic Levitation (Lusion signature floating physics)
    const hoverY = Math.sin(t * 1.25) * 0.14 + Math.sin(t * 2.5) * 0.03;
    const hoverX = Math.cos(t * 0.95) * 0.10 + Math.sin(t * 1.9) * 0.025;
    const hoverRoll = Math.sin(t * 0.8) * 0.035;
    const hoverPitch = Math.cos(t * 1.05) * 0.025;

    // Interactive pointer spring parallax (poised forward orientation)
    const px = s.pointer.x;
    const py = s.pointer.y;
    const mouseTiltY = px * 0.52 - 0.22;
    const mouseTiltX = -py * 0.32 + 0.04;
    const mouseBankZ = -px * 0.18;

    // Vortex banking in Chapter II (Lattice)
    const zc = camera.position.z;
    const vortexK = seg(zc, -120, -190);
    const vortexBank = Math.sin(zc * 0.08) * 0.32 * vortexK;

    const ci = inTunnel ? chapterAt(p) : -1;
    const end = seg(p, 0.955, 0.985);

    // Target rotation: maintains confident hero forward pose with physical banking
    const targetRx = mouseTiltX + hoverPitch + inertiaPitch * (1 - end);
    const targetRy = lerp(mouseTiltY, 0, end);
    const targetRz = mouseBankZ + hoverRoll + vortexBank * (1 - end);

    const R = rot.current;
    const kr = 1 - Math.exp(-5.5 * d);
    R.x += (targetRx - R.x) * kr;
    R.y += (targetRy - R.y) * kr;
    R.z += (targetRz - R.z) * kr;

    // Per-chapter body language, smoothly cross-faded
    const want = ['Idle', 'WalkJump', 'Dance', 'Yes', 'Wave'][ci] || 'Idle';
    if (clip.current !== want && actions[want]) {
      const next = actions[want];
      next.reset().setEffectiveWeight(1).fadeIn(0.6).play();
      next.timeScale = want === 'Dance' ? 0.35 : want === 'Idle' ? 0.45 : want === 'Wave' ? 0.85 : 0.4;
      if (clip.current) actions[clip.current]?.fadeOut(0.6);
      clip.current = want;
    }

    g.rotation.order = 'YXZ';
    g.rotation.set(R.x, R.y, R.z);

    // Spatial positioning along scroll
    let tx = 0;
    let ty = 0;
    let tr = REL;
    let ts = 1.35;

    if (!inTunnel) {
      const burst = ease(seg(p, 0.26, 0.52));
      tx = lerp(-1.4 * ax, 0, burst);
      ty = lerp(-0.4, 0, burst);
      tr = lerp(camera.position.z - 0.6, REL, burst);
      ts = lerp(1.5, 1.1, burst);
    } else {
      tx = camera.position.x + lerp(-1.1 * ax, 0, end);
      ty = camera.position.y + lerp(-0.32, 0.12, end);
      ts = lerp(1.3, 1.55, end);
    }

    const P = pos.current;
    const kp = 1 - Math.exp(-5.0 * d);
    P.x += (tx - P.x) * kp;
    P.y += (ty - P.y) * kp;
    P.rel += (tr - P.rel) * kp;
    P.s += (ts - P.s) * kp;

    g.position.set(
      P.x + hoverX,
      P.y + hoverY,
      camera.position.z - P.rel + inertiaDragZ
    );
    g.scale.setScalar(P.s * THREE.MathUtils.clamp(camera.aspect * 1.25, 0.45, 1));
  });

  return (
    <group ref={group}>
      <group scale={model.userData.fit.k}>
        <group position={[-model.userData.fit.c.x, -model.userData.fit.c.y, -model.userData.fit.c.z]}>
          <group ref={holder}>
            <primitive object={model} />
          </group>
        </group>
      </group>
      {/* Dedicated High-End Character Studio Lighting */}
      <directionalLight position={[-3, 4, 5]} intensity={2.0} color="#ffffff" />
      <pointLight position={[3, 2, -2.5]} intensity={14} color="#00f5d4" distance={9} decay={2} />
      <pointLight position={[-3, -1.5, 2]} intensity={10} color="#ffdf88" distance={9} decay={2} />
      <pointLight position={[0, 0.1, 0.35]} intensity={2.2} color="#00f5d4" distance={2.5} decay={2} />
    </group>
  );
}

const TONES = {
  cage: { a: '#ffeaa0', b: '#ffc13b', key: '#ffe070', fog: '#070502' },
  lattice: { a: '#7c5cff', b: '#00f5d4', key: '#a98bff', fog: '#05030a' },
  room: { a: '#ffffff', b: '#bffcf3', key: '#7fe8ff', fog: '#030a0d' },
};

function Rig({ progress, sp, ca, bloomRef, tone, lights, fogRef }) {
  const smooth = useRef(0);
  const prev = useRef(0);
  const colA = useMemo(() => new THREE.Color(), []);
  const colB = useMemo(() => new THREE.Color(), []);
  const colC = useMemo(() => new THREE.Color(), []);
  const scratch = useMemo(() => new THREE.Color(), []);
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    smooth.current += (progress.current - smooth.current) * (1 - Math.exp(-3.5 * d));
    const p = smooth.current;
    sp.current = p;
    const speed = Math.abs(p - prev.current) / Math.max(d, 0.001);
    prev.current = p;

    const tp = seg(p, START, 1);
    const zc = Z0 - ZTOT * tp;
    const cam = state.camera;
    const px = state.pointer.x;
    const py = state.pointer.y;
    const dolly = lerp(7.8, 6.7, seg(p, 0.27, 0.44));
    const inTunnel = tp > 0;
    const z = inTunnel ? zc : dolly;
    const cageK = 1 - seg(zc, CAGE_END + 40, CAGE_END - 20);
    const latK = seg(zc, CAGE_END + 20, CAGE_END - 20) * (1 - seg(zc, ROOM_START + 10, ROOM_START - 10));
    const roll = inTunnel ? Math.sin(zc * 0.035) * 0.06 * cageK : 0;
    cam.position.set(px * 0.35 + (inTunnel ? Math.sin(zc * 0.04) * 0.2 : 0), py * 0.24 + (inTunnel ? Math.cos(zc * 0.035) * 0.16 : 0), z);
    cam.rotation.set(py * 0.035, -px * 0.045, roll);
    cam.fov = 46;
    cam.updateProjectionMatrix();
    ca.set(0.0004 + Math.min(speed * 0.003, 0.002), 0.0003 + Math.min(speed * 0.002, 0.0015));

    const roomK = seg(zc, ROOM_START + 8, ROOM_START - 14);
    colA.set(TONES.cage.a).lerp(scratch.set(TONES.lattice.a), latK + roomK).lerp(scratch.set(TONES.room.a), roomK);
    colB.set(TONES.cage.b).lerp(scratch.set(TONES.lattice.b), latK + roomK).lerp(scratch.set(TONES.room.b), roomK);
    tone.current.a = `#${colA.getHexString()}`;
    tone.current.b = `#${colB.getHexString()}`;
    colC.set(TONES.cage.fog).lerp(scratch.set(TONES.room.fog), roomK);
    if (fogRef.current) {
      fogRef.current.color.copy(colC);
      state.scene.background.copy(colC);
    }
    const exitK = seg(zc, ROOM_END + 6, ROOM_END - 18);
    if (fogRef.current) {
      fogRef.current.far = lerp(150, 60, roomK) + exitK * 500;
      if (exitK > 0) {
        colC.set('#030407');
        fogRef.current.color.lerp(colC, exitK);
        state.scene.background.lerp(colC, exitK);
      }
    }
    if (lights.current) {
      lights.current.position.set(0, 0.4, z - 3);
      const [kA, kB, kC] = lights.current.children;
      kA.color.set(TONES.cage.key).lerp(scratch.set(TONES.lattice.key), latK + roomK).lerp(scratch.set('#ffffff'), roomK);
      kB.color.set('#ffb833').lerp(scratch.set('#00f5d4'), latK + roomK);
      kC.color.set('#f5c84b').lerp(scratch.set('#8b5cf6'), latK).lerp(scratch.set('#ffffff'), roomK);
      kA.intensity = lerp(52, 28, latK) * (1 - roomK * 0.1) + lerp(0, 36, roomK);
    }
    if (bloomRef.current) bloomRef.current.intensity = lerp(1.02, 1.18, latK) * (1 - roomK * 0.2);
  }, -1);
  return null;
}

function Tunnel({ sp, tone, touch }) {
  const cageGroup = useRef();
  const latticeGroup = useRef();
  const roomGroup = useRef();
  const worldsGroup = useRef();

  useFrame((state) => {
    const p = sp.current;
    const zc = state.camera.position.z;

    // Chapter I: CageClassic - active from tunnel entry until camera passes CAGE_END
    if (cageGroup.current) {
      cageGroup.current.visible = zc <= Z0 + 4 && zc > CAGE_END - 5;
    }

    // Chapter II: Lattice - emerges ONLY when approaching end of Cage (zc <= -88)
    // Strictly hidden during earlier parts of Chapter I to avoid premature visibility
    if (latticeGroup.current) {
      const nearEndOfCage = zc <= -88;
      const beforeRoom = zc > ROOM_START - 5;
      latticeGroup.current.visible = nearEndOfCage && beforeRoom;
    }

    // Chapter III: Room - emerges when approaching ROOM_START (-190)
    if (roomGroup.current) {
      roomGroup.current.visible = zc <= -165 && zc > ROOM_END - 5;
    }

    // Chapter IV: Worlds - emerges when approaching ROOM_END (-252)
    if (worldsGroup.current) {
      worldsGroup.current.visible = zc <= -235;
    }
  });

  return (
    <group>
      <group ref={cageGroup}>
        <CageClassic tone={tone} touch={touch} />
      </group>
      <group ref={latticeGroup}>
        <Lattice sp={sp} touch={touch} />
      </group>
      <group ref={roomGroup}>
        <Room />
      </group>
      <group ref={worldsGroup}>
        <Worlds touch={touch} />
      </group>
    </group>
  );
}

[MEDIA.navigator].forEach((u) => useGLTF.preload(u));

export default function LabScene({ progress, visible = true }) {
  const touch = useRef(isTouch()).current;
  const sp = useRef(0);
  const ca = useMemo(() => new THREE.Vector2(0.00008, 0.00006), []);
  const bloomRef = useRef();
  const lights = useRef();
  const fogRef = useRef();
  const tone = useRef({ a: '#ffd875', b: '#f5c84b' });

  return (
    <Canvas
      camera={{ position: [0, 0, 7.8], fov: 46, near: 0.1, far: 520 }}
      dpr={touch ? [1.5, 2] : [1.5, 2]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      frameloop={visible ? 'always' : 'never'}
    >
      <color attach="background" args={['#030407']} />
      <fog ref={fogRef} attach="fog" args={['#030407', 14, 150]} />
      <ambientLight intensity={0.32} />
      <group ref={lights}>
        <pointLight intensity={34} distance={28} decay={2} position={[0, 1, 0]} />
        <pointLight intensity={30} distance={26} decay={2} position={[2, -1, 4]} />
        <pointLight intensity={28} distance={26} decay={2} position={[-2.5, 1, -2]} />
      </group>
      <directionalLight position={[8, 10, 6]} intensity={1.3} />

      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <Environment resolution={256} environmentIntensity={0.65}>
            <Lightformer form="rect" intensity={2.6} color="#ffe599" position={[0, 6, -6]} scale={[14, 1.2, 1]} />
            <Lightformer form="rect" intensity={1.8} color="#f5c84b" position={[-7, 0, -4]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
            <Lightformer form="rect" intensity={1.6} color="#00f5d4" position={[7, 0, -4]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
            <Lightformer form="ring" intensity={2.2} color="#ffffff" position={[0, 0, 8]} scale={5} />
          </Environment>
        </Suspense>
      </ErrorBoundary>

      <FollowStars count={touch ? 1400 : 3200} />
      {HAVE.navigator && (
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <Navigator sp={sp} />
          </Suspense>
        </ErrorBoundary>
      )}
      <Tunnel sp={sp} tone={tone} touch={touch} />
      <Rig progress={progress} sp={sp} ca={ca} bloomRef={bloomRef} tone={tone} lights={lights} fogRef={fogRef} />

      {!touch && (
        <EffectComposer disableNormalPass multisampling={4}>
          <Bloom ref={bloomRef} luminanceThreshold={0.84} luminanceSmoothing={0.35} intensity={0.78} radius={0.68} mipmapBlur />
          <ChromaticAberration offset={ca} radialModulation={false} modulationOffset={0} />
          <Vignette offset={0.32} darkness={0.48} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
