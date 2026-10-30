import { useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as THREE from 'three';
import { seeded } from '../three-utils';
import { CAGE_END, Z0 } from '../journey';
import { asset } from '../media';
import { labState, seg } from './shared';
import LusionBuildMatrix from './LusionBuildMatrix';

// Chapter I, Build: a dark machine lattice that assembles itself out of the black. One even cubic lattice of thin metal
// bars; the camera flies down its middle column. Machinery (Blender-made parts with baked occlusion) and teal-white glints
// are packed along the four corner edges of that column, and thin dark slivers hang in the cells further out. It builds
// in beats as you scroll: a dashed drawing of the lattice with sparkle along the corner edges, then the bars, then the
// machinery, then its lights flicker on.
const C = 4; // lattice cell
const A = C / 2; // half-width of the middle column
const NX = 3; // columns out from the middle on each side
const NY = 2; // rows out from the middle, up and down
const Z_A = Z0 + 3;
const Z_B = CAGE_END + 6;
const T = 0.14; // bar thickness: thin lattice bars, which only look heavy as they pass close to the camera
const KIT = asset('/models/greeble.glb');

// the build: 0 before, 1 once everything is in place
export const buildAt = (p) => seg(p, 0.546, 0.672);

// Grows each instance in from nothing as uB passes its own delay. Bars grow along their length (local x), parts scale up
// whole. Injected into the standard material so it keeps the real lighting and reflections.
function buildMaterial(params, mode) {
  const m = new THREE.MeshStandardMaterial(params);
  m.userData.u = { uB: { value: 0 } };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uB = m.userData.u.uB;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aD; uniform float uB;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float bk = clamp((uB * 1.7 - aD) / 0.55, 0., 1.);
        bk = bk * bk * (3. - 2. * bk);
        ${mode === 'beam' ? 'transformed.x *= max(bk, 0.0001);' : 'transformed *= max(bk, 0.0001);'}`
      );
  };
  m.customProgramCacheKey = () => 'build-' + mode;
  return m;
}

const JX = Array.from({ length: 2 * NX + 2 }, (_, i) => -A - NX * C + i * C);
const JY = Array.from({ length: 2 * NY + 2 }, (_, i) => -A - NY * C + i * C);

// Every edge of the lattice; a few are missing, more so further from the middle.
function lattice(rnd) {
  const bars = [];
  const ringOf = (x, y) => Math.max(Math.abs(x) - A, Math.abs(y) - A, 0) / C;
  // bars lying across the middle column's own walls are sparse, so the column reads as open; its four corner rails stay
  const onWall = (x, y) => (Math.abs(x) < A - 0.01 && Math.abs(Math.abs(y) - A) < 0.01) || (Math.abs(y) < A - 0.01 && Math.abs(Math.abs(x) - A) < 0.01);
  const keep = (x, y) => rnd() < (onWall(x, y) ? 0.3 : 0.94 - ringOf(x, y) * 0.07);
  for (let z = Z_A; z > Z_B; z -= C) {
    for (const y of JY)
      for (let i = 0; i < JX.length - 1; i++) {
        const x = (JX[i] + JX[i + 1]) / 2;
        if (keep(x, y)) bars.push({ p: [x, y, z], len: C, r: [0, 0, 0], ring: ringOf(x, y) });
      }
    for (const x of JX)
      for (let i = 0; i < JY.length - 1; i++) {
        const y = (JY[i] + JY[i + 1]) / 2;
        if (keep(x, y)) bars.push({ p: [x, y, z], len: C, r: [0, 0, Math.PI / 2], ring: ringOf(x, y) });
      }
    for (const x of JX)
      for (const y of JY) if (keep(x, y)) bars.push({ p: [x, y, z - C / 2], len: C, r: [0, Math.PI / 2, 0], ring: ringOf(x, y) });
  }
  return bars;
}

// Most bars are whole; some are broken once or twice with a small gap, and a few lose a piece at one end.
function breakUp(bars, rnd) {
  const out = [];
  for (const b of bars) {
    // frames away from the middle column are whole; round the column, where the machinery sits, some are broken
    const n = b.ring > 0.01 || rnd() < 0.6 ? 1 : rnd() < 0.75 ? 2 : 3;
    const cuts = Array.from({ length: n - 1 }, () => 0.15 + rnd() * 0.7).sort();
    const edges = [0, ...cuts, 1];
    for (let i = 0; i < n; i++) {
      let a = edges[i];
      let c = edges[i + 1];
      const gap = 0.02 + rnd() * 0.06;
      if (i > 0) a += gap / 2;
      if (i < n - 1) c -= gap / 2;
      if (b.ring < 0.01 && i === n - 1 && rnd() < 0.08) c -= 0.1 + rnd() * 0.3;
      if (c - a < 0.05) continue;
      out.push({ ...b, t: [a, c], off: b.ring > 0.01 ? [0, 0] : [(rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.03], th: b.ring > 0.01 ? 1 : 0.85 + rnd() * 0.35 });
    }
  }
  return out;
}

function Beams({ beams, mat }) {
  const mesh = useRef();
  // a square tube with softly chamfered edges, so every edge carries a thin highlight
  const geo = useMemo(() => new RoundedBoxGeometry(1, T, T, 2, T * 0.11), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const d = new Float32Array(beams.length);
    const rnd = seeded(31);
    const v = new THREE.Vector3();
    beams.forEach((b, i) => {
      q.setFromEuler(e.set(...b.r));
      // the piece's middle along the bar, plus its tiny sideways drift (in the bar's own frame)
      v.set(((b.t[0] + b.t[1]) / 2 - 0.5) * b.len, b.off[0], b.off[1]).applyQuaternion(q);
      m.compose(new THREE.Vector3(b.p[0] + v.x, b.p[1] + v.y, b.p[2] + v.z), q, new THREE.Vector3((b.t[1] - b.t[0]) * b.len, b.th, b.th));
      mesh.current.setMatrixAt(i, m);
      // the middle column's frame comes first, the outer cells after it
      d[i] = 0.18 + rnd() * 0.3 + b.ring * 0.08;
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.geometry.setAttribute('aD', new THREE.InstancedBufferAttribute(d, 1));
  }, [beams]);
  return <instancedMesh ref={mesh} args={[geo, mat, beams.length]} frustumCulled={false} />;
}

// The first beat: a dashed drawing of the lattice, and sparkle crowding the four corner edges of the middle column.
const DOT_V = `uniform float uB; uniform float uTime; attribute float aR; attribute float aK; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp((aK > .5 ? 44. : 30.) / max(-mv.z, 1.), 1., 3.4);
  float on = smoothstep(aR * .22, aR * .22 + .1, uB) * (1. - smoothstep(.42, .75, uB));
  float tw = aK > .5 ? .5 + .5 * sin(uTime * (3. + aR * 6.) + aR * 40.) : 1.;
  vA = on * tw * (aK > .5 ? 1. : .55 + .45 * aR) * smoothstep(95., 18., -mv.z);
}`;
const DOT_F = 'varying float vA; void main(){ float d = length(gl_PointCoord - .5) * 2.; gl_FragColor = vec4(vec3(.8, 1., .96) * 1.5, vA * (1. - d)); }';

function Dots({ bars, touch, u }) {
  const geo = useMemo(() => {
    const rnd = seeded(5);
    const pos = [];
    const r = [];
    const k = [];
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    // dashes: short runs of points with gaps between them along the bars
    for (const b of bars) {
      if (b.ring > 1.6 || rnd() > (touch ? 0.35 : 0.7)) continue;
      q.setFromEuler(e.set(...b.r));
      let s = -b.len / 2;
      while (s < b.len / 2) {
        const run = 0.3 + rnd() * 0.7;
        for (let t = 0; t < run && s + t < b.len / 2; t += 0.16) {
          v.set(s + t, 0, 0).applyQuaternion(q);
          pos.push(b.p[0] + v.x, b.p[1] + v.y, b.p[2] + v.z);
          r.push(rnd());
          k.push(0);
        }
        s += run + 0.2 + rnd() * 0.6;
      }
    }
    // sparkle round the corner edges
    const n = touch ? 1400 : 3600;
    for (let i = 0; i < n; i++) {
      const sx = rnd() < 0.5 ? -1 : 1;
      const sy = rnd() < 0.5 ? -1 : 1;
      const rr = Math.pow(rnd(), 1.6) * 1.1;
      const a = rnd() * Math.PI * 2;
      pos.push(sx * A + Math.cos(a) * rr, sy * A + Math.sin(a) * rr, Z_A - rnd() * (Z_A - Z_B));
      r.push(rnd());
      k.push(1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aR', new THREE.Float32BufferAttribute(r, 1));
    g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 1));
    return g;
  }, [bars, touch]);
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: DOT_V, fragmentShader: DOT_F, uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), [u]);
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={3} />;
}

// A point near one of the four corner edges of the middle column: mostly out in the cells behind that edge, a little
// way into the column itself, never in the open middle.
function nearCorner(rnd, spread) {
  const sx = rnd() < 0.5 ? -1 : 1;
  const sy = rnd() < 0.5 ? -1 : 1;
  let dx = (rnd() < 0.78 ? 1 : -0.35) * Math.pow(rnd(), 1.7) * spread;
  let dy = (rnd() < 0.78 ? 1 : -0.35) * Math.pow(rnd(), 1.7) * spread;
  if (rnd() < 0.5) dx *= 0.35;
  else dy *= 0.35;
  return [sx * (A + dx), sy * (A + dy)];
}

const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
function squareTurn(rnd) {
  // a random axis-aligned orientation (quarter turns only), so the parts sit square in the lattice
  const q = new THREE.Quaternion();
  for (let i = 0; i < 3; i++) q.multiply(new THREE.Quaternion().setFromAxisAngle(AXES[i], Math.floor(rnd() * 4) * (Math.PI / 2)));
  return q;
}

function Parts({ touch, mat }) {
  const { nodes } = useGLTF(KIT);
  // one geometry per kit part, made once: a new geometry would make react-three-fiber rebuild the mesh (and lose its matrices)
  const kit = useMemo(() => Object.values(nodes).filter((o) => o.isMesh).sort((a, b) => a.name.localeCompare(b.name)).map((o) => o.geometry.clone()), [nodes]);
  const parts = useMemo(() => {
    const rnd = seeded(9);
    const n = touch ? 800 : 2000;
    return Array.from({ length: n }, () => {
      const [x, y] = nearCorner(rnd, 2.4);
      const s = 0.08 + Math.pow(rnd(), 2.6) * 0.55;
      return { p: [x, y, Z_A - rnd() * (Z_A - Z_B)], q: squareTurn(rnd), s: [s * (0.6 + rnd() * 1.4), s * (0.5 + rnd()), s * (0.6 + rnd() * 2.2)], kind: Math.floor(rnd() * 7), d: 0.32 + rnd() * 0.42 };
    });
  }, [touch]);
  const groups = useMemo(() => kit.map((_, k) => parts.filter((pt) => pt.kind % kit.length === k)), [kit, parts]);
  const refs = useRef([]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    groups.forEach((list, k) => {
      const mesh = refs.current[k];
      if (!mesh) return;
      const d = new Float32Array(list.length);
      list.forEach((pt, i) => {
        m.compose(new THREE.Vector3(...pt.p), pt.q, new THREE.Vector3(...pt.s));
        mesh.setMatrixAt(i, m);
        d[i] = pt.d;
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.geometry.setAttribute('aD', new THREE.InstancedBufferAttribute(d, 1));
    });
  }, [groups]);
  return groups.map((list, k) => list.length > 0 && (
    <instancedMesh key={k} ref={(el) => { refs.current[k] = el; }} args={[kit[k], mat, list.length]} frustumCulled={false} />
  ));
}

// Thin dark slivers hanging in the outer cells (mostly upright), the "rain" you see between the bars.
function Slivers({ touch, mat }) {
  const mesh = useRef();
  const items = useMemo(() => {
    const rnd = seeded(41);
    const n = touch ? 140 : 340;
    const lx = A + NX * C;
    const ly = A + NY * C;
    const out = [];
    while (out.length < n) {
      const x = (rnd() * 2 - 1) * lx;
      const y = (rnd() * 2 - 1) * ly;
      if (Math.abs(x) < A + 0.3 && Math.abs(y) < A + 0.3) continue;
      const up = rnd() < 0.78;
      const len = 0.4 + Math.pow(rnd(), 1.5) * 2.6;
      out.push({ p: [x, y, Z_A - rnd() * (Z_A - Z_B)], s: up ? [0.03 + rnd() * 0.05, len, 0.1 + rnd() * 0.5] : [len, 0.03 + rnd() * 0.05, 0.1 + rnd() * 0.5], d: 0.3 + rnd() * 0.5 });
    }
    return out;
  }, [touch]);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const d = new Float32Array(items.length);
    items.forEach((it, i) => {
      m.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...it.s));
      mesh.current.setMatrixAt(i, m);
      d[i] = it.d;
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.geometry.setAttribute('aD', new THREE.InstancedBufferAttribute(d, 1));
  }, [items]);
  return <instancedMesh ref={mesh} args={[geo, mat, items.length]} frustumCulled={false} />;
}

// The glitter: tiny emissive blocks packed along the corner edges. Each flickers on once the build reaches it, then twinkles.
const LIGHT_V = `uniform float uB; uniform float uTime; attribute float aD; attribute vec3 aC; varying vec3 vC;
void main(){
  float on = step(aD, uB * 1.7 - .5);
  float flick = on * mix(step(.5, fract(sin(aD * 91.7 + floor(uTime * 18.)) * 43758.5)), 1., smoothstep(aD + .5, aD + .75, uB * 1.7));
  float tw = .6 + .4 * pow(.5 + .5 * sin(uTime * (1.3 + aD * 4.) + aD * 60.), 3.);
  vC = aC * flick * tw;
  vec3 pos = position * max(on, 0.0001);
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.);
}`;
const LIGHT_F = 'varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.); }';

function Lights({ touch, u }) {
  const mesh = useRef();
  const items = useMemo(() => {
    const rnd = seeded(23);
    // teal, pale teal, white, a deeper sea green; a rare warm one
    const cols = [[1.2, 5.6, 4.2], [3.2, 6.4, 5.4], [6.0, 6.6, 6.4], [0.6, 4.0, 2.8], [6.4, 4.2, 2.0]];
    const n = touch ? 900 : 2800;
    return Array.from({ length: n }, () => {
      const [x, y] = nearCorner(rnd, 1.15);
      const s = (0.014 + Math.pow(rnd(), 3.4) * 0.075) * (touch ? 1.7 : 1);
      const c = cols[rnd() < 0.03 ? 4 : rnd() < 0.42 ? 0 : rnd() < 0.5 ? 1 : rnd() < 0.6 ? 2 : 3];
      return { p: [x, y, Z_A - rnd() * (Z_A - Z_B)], s: [s * (1 + rnd() * 2.5), s * (1 + rnd() * 1.5), s * (1 + rnd() * 3)], c, d: 0.36 + rnd() * 0.42 };
    });
  }, [touch]);
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: LIGHT_V, fragmentShader: LIGHT_F, uniforms: u, toneMapped: false }), [u]);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const d = new Float32Array(items.length);
    const c = new Float32Array(items.length * 3);
    items.forEach((it, i) => {
      m.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...it.s));
      mesh.current.setMatrixAt(i, m);
      d[i] = it.d;
      c.set(it.c, i * 3);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.geometry.setAttribute('aD', new THREE.InstancedBufferAttribute(d, 1));
    mesh.current.geometry.setAttribute('aC', new THREE.InstancedBufferAttribute(c, 3));
  }, [items]);
  return <instancedMesh ref={mesh} args={[geo, mat, items.length]} frustumCulled={false} renderOrder={2} />;
}

// Dim cool lights ride ahead of the camera so the metal catches faint moving highlights (three lights, always mounted:
// changing the number of lights would recompile every lit shader).
function RideLights({ build }) {
  const a = useRef();
  const b = useRef();
  const c = useRef();
  const { scene } = useThree();
  useFrame((s) => {
    const z = s.camera.position.z;
    const k = seg(z, CAGE_END - 8, CAGE_END + 6) * build.current;
    if (a.current) {
      a.current.position.set(A * 0.9, A * 0.9, z - 9);
      a.current.intensity = 16 * k;
    }
    if (b.current) {
      b.current.position.set(-A * 0.9, -A * 0.9, z - 15);
      b.current.intensity = 12 * k;
    }
    if (c.current) {
      c.current.position.set(0, 0, z - 30);
      c.current.intensity = 34 * k;
    }
  });
  return createPortal(
    <>
      <pointLight ref={a} intensity={16} distance={24} decay={2} color="#bff7ea" />
      <pointLight ref={b} intensity={12} distance={22} decay={2} color="#8ff0d8" />
      <pointLight ref={c} intensity={34} distance={40} decay={2} color="#e6fff8" />
    </>,
    scene
  );
}

function OwnGrid({ touch, sp }) {
  const bars = useMemo(() => lattice(seeded(3)), []);
  const beams = useMemo(() => breakUp(bars, seeded(4)), [bars]);
  // brushed steel (ambientCG, CC0): real colour, normal and roughness maps, with reflections of its own (the scene's
  // shared reflections are turned right down in here for the darkness, so the bars carry their own)
  const tex = useTexture({ map: asset('/env/metal-color.jpg'), normalMap: asset('/env/metal-normal.jpg'), roughnessMap: asset('/env/metal-rough.jpg') });
  const beamMat = useMemo(() => {
    Object.values(tex).forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
    });
    tex.map.colorSpace = THREE.SRGBColorSpace;
    // dark polished steel: almost black body, and the faces carry sharp streaks of reflected light (no grey colour map)
    return buildMaterial({ normalMap: tex.normalMap, roughnessMap: tex.roughnessMap, color: '#2a2e33', metalness: 1, roughness: 0.2, normalScale: new THREE.Vector2(0.25, 0.25), envMapIntensity: touch ? 0.6 : 1.15 }, 'beam');
    // useTexture hands back a new object each render; the textures inside stay the same
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex.map, tex.normalMap, tex.roughnessMap, touch]);
  const scene = useThree((st) => st.scene);
  const partMat = useMemo(() => buildMaterial({ color: '#6a727b', metalness: 0.35, roughness: 0.45, vertexColors: true, envMapIntensity: 0.08 }, 'part'), []);
  const sliverMat = useMemo(() => buildMaterial({ color: '#33373c', metalness: 0.3, roughness: 0.55, envMapIntensity: 0.05 }, 'part'), []);
  const u = useMemo(() => ({ uB: { value: 0 }, uTime: { value: 0 } }), []);
  const build = useRef(0);
  useFrame((s) => {
    if (!beamMat.envMap && scene.environment) {
      beamMat.envMap = scene.environment;
      beamMat.needsUpdate = true;
    }
    const b = labState.warm ? 1 : buildAt(sp.current);
    build.current = b;
    u.uB.value = b;
    u.uTime.value = s.clock.elapsedTime;
    beamMat.userData.u.uB.value = b;
    partMat.userData.u.uB.value = b;
    sliverMat.userData.u.uB.value = b;
  });
  return (
    <>
      <RideLights build={build} />
      <Dots bars={bars} touch={touch} u={u} />
      <Beams beams={beams} mat={beamMat} />
      <Parts touch={touch} mat={partMat} />
      <Slivers touch={touch} mat={sliverMat} />
      <Lights touch={touch} u={u} />
    </>
  );
}

useGLTF.preload(KIT);

// The Build corridor: Lusion's own corridor (used with their permission), or ?corridor=own for our recreation.
export default function Grid(props) {
  const own = typeof location !== 'undefined' && new URLSearchParams(location.search).get('corridor') === 'own';
  return own ? <OwnGrid {...props} /> : <LusionBuildMatrix {...props} />;
}
