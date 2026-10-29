import { useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { seeded } from '../three-utils';
import { CAGE_END, Z0 } from '../journey';
import { asset } from '../media';
import { labState, seg } from './shared';

// Chapter I, Build: a dark machine corridor that assembles itself out of the black. A cubic lattice of thin metal beams
// surrounds an open square core; dense greeble (Blender-made parts with baked occlusion) crowds the core's four edges, and
// small cyan-white lights glitter among it. It builds in three beats as you scroll: points along every beam, then the
// beams themselves grow out from their middles, then the parts pop in and their lights flicker on.
const C = 3.2; // lattice cell
const A = 3.2; // half-size of the open core
const N = 3; // cells out from the core on each side
const Z_A = Z0 + 3;
const Z_B = CAGE_END + 6;
const T = 0.13; // beam thickness
const KIT = asset('/models/greeble.glb');

// the build: 0 before, 1 once everything is in place
export const buildAt = (p) => seg(p, 0.546, 0.672);

// Grows each instance in from nothing as uB passes its own delay. Beams grow along their length (local x),
// parts scale up whole. Injected into the standard material so it keeps the real lighting and reflections.
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
        ${mode === 'beam' ? 'transformed.x *= max(bk, 0.0001);' : 'transformed *= max(bk * (1. + 0.25 * sin(bk * 3.14159)), 0.0001);'}`
      );
  };
  m.customProgramCacheKey = () => 'build-' + mode;
  return m;
}

// The corridor is three nested shells with open space between them, so it reads as depth on depth rather than one tube:
// the core frame (crowded with parts), a middle shell of heavier bars, and huge outer frames that sweep past at the sides.
// Each shell is a rectangular grid of joints with its middle left open; bars join neighbouring joints.
const SHELLS = [
  { x0: A, y0: A, x1: A + C, y1: A + C, cell: C, dz: C, th: 1, keep: 0.24, keepZ: 0.2 },
  { x0: 2 * A + C, y0: 2 * A, x1: 2 * A + 3 * C, y1: 2 * A + C, cell: C, dz: C, th: 1.9, keep: 0.26, keepZ: 0.22 },
  { x0: 5.6 * A, y0: 4 * A, x1: 5.6 * A + 2 * C, y1: 4 * A + 2 * C, cell: 2 * C, dz: 2 * C, th: 3.6, keep: 0.62, keepZ: 0.5 },
];

function lattice(rnd) {
  const beams = [];
  SHELLS.forEach((sh, li) => {
    const xs = [];
    const ys = [];
    for (let x = -sh.x1; x <= sh.x1 + 0.01; x += sh.cell) xs.push(+x.toFixed(3));
    for (let y = -sh.y1; y <= sh.y1 + 0.01; y += sh.cell) ys.push(+y.toFixed(3));
    // only joints in the shell itself, not in its open middle
    const open = (x, y) => Math.abs(x) < sh.x0 - 0.01 && Math.abs(y) < sh.y0 - 0.01;
    // the core's frame: its four corner rails always, its cross bars on every other ring
    const corner = (x, y) => li === 0 && Math.abs(Math.abs(x) - A) < 0.01 && Math.abs(Math.abs(y) - A) < 0.01;
    let ringK = 0;
    const frame = (x, y) => li === 0 && ringK % 2 === 0 && Math.abs(x) <= A + 0.01 && Math.abs(y) <= A + 0.01;
    for (let z = Z_A; z > Z_B; z -= sh.dz, ringK++) {
      for (const y of ys)
        for (let i = 0; i < xs.length - 1; i++) {
          const x = (xs[i] + xs[i + 1]) / 2;
          if (open(xs[i], y) && open(xs[i + 1], y)) continue;
          if (open(x, y)) continue;
          if (frame(x, y) || rnd() < sh.keep) beams.push({ p: [x, y, z], len: sh.cell, r: [0, 0, 0], th: sh.th, layer: li });
        }
      for (const x of xs)
        for (let i = 0; i < ys.length - 1; i++) {
          const y = (ys[i] + ys[i + 1]) / 2;
          if (open(x, ys[i]) && open(x, ys[i + 1])) continue;
          if (open(x, y)) continue;
          if (frame(x, y) || rnd() < sh.keep) beams.push({ p: [x, y, z], len: sh.cell, r: [0, 0, Math.PI / 2], th: sh.th, layer: li });
        }
      for (const x of xs)
        for (const y of ys) {
          if (open(x, y)) continue;
          if (corner(x, y) || rnd() < sh.keepZ) beams.push({ p: [x, y, z - sh.dz / 2], len: sh.dz, r: [0, Math.PI / 2, 0], th: sh.th, layer: li });
        }
    }
  });
  return beams;
}

// A bar between two joints is never one clean piece: it is broken into a few segments with gaps between them, each nudged
// slightly off the line, and now and then a short loose chunk floats in a gap.
function breakUp(beams, rnd) {
  const out = [];
  for (const b of beams) {
    const n = 1 + Math.floor(rnd() * 3.2);
    const cuts = Array.from({ length: n - 1 }, () => rnd()).sort();
    const edges = [0, ...cuts, 1];
    for (let i = 0; i < n; i++) {
      let a = edges[i];
      let c = edges[i + 1];
      // gaps: trim each piece, more in the middle of the bar than at the joints
      const gap = 0.04 + rnd() * 0.12;
      if (i > 0) a += gap / 2;
      if (i < n - 1) c -= gap / 2;
      if (i === 0 && rnd() < 0.35) a += 0.05 + rnd() * 0.15;
      if (i === n - 1 && rnd() < 0.35) c -= 0.05 + rnd() * 0.15;
      if (c - a < 0.06) continue;
      out.push({ ...b, t: [a, c], off: [(rnd() - 0.5) * 0.09 * b.th, (rnd() - 0.5) * 0.09 * b.th], th: b.th * (0.8 + rnd() * 0.5) });
    }
    if (rnd() < 0.18) {
      const m = 0.25 + rnd() * 0.5;
      out.push({ ...b, t: [m, m + 0.04 + rnd() * 0.08], off: [(rnd() - 0.5) * 0.5 * b.th, (rnd() - 0.5) * 0.5 * b.th], th: b.th * (1.2 + rnd() * 1.4) });
    }
  }
  return out;
}

function Beams({ beams, mat }) {
  const mesh = useRef();
  const geo = useMemo(() => {
    // bevelled, so every edge catches a highlight; the cross-section is the bar's thickness, its length comes from the matrix
    const g = new RoundedBoxGeometry(1, T, T, 2, T * 0.18);
    return g;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const d = new Float32Array(beams.length);
    const rnd = seeded(31);
    const v = new THREE.Vector3();
    beams.forEach((b, i) => {
      q.setFromEuler(e.set(...b.r));
      // the segment's middle along the bar, plus its small sideways drift (in the bar's own frame)
      v.set(((b.t[0] + b.t[1]) / 2 - 0.5) * b.len, b.off[0], b.off[1]).applyQuaternion(q);
      m.compose(new THREE.Vector3(b.p[0] + v.x, b.p[1] + v.y, b.p[2] + v.z), q, new THREE.Vector3((b.t[1] - b.t[0]) * b.len, b.th, b.th));
      mesh.current.setMatrixAt(i, m);
      // the core's frame comes first, outer beams later
      // the core's frame comes first, the outer shells after it
      d[i] = 0.12 + rnd() * 0.4 + b.layer * 0.12;
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.geometry.setAttribute('aD', new THREE.InstancedBufferAttribute(d, 1));
  }, [beams]);
  return <instancedMesh ref={mesh} args={[geo, mat, beams.length]} frustumCulled={false} />;
}

// Points along every beam: the first thing you see, a faint dotted drawing of the lattice.
const DOT_V = `uniform float uB; attribute float aR; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(34. / max(-mv.z, 1.), 1.2, 3.6);
  float on = smoothstep(aR * .25, aR * .25 + .12, uB) * (1. - smoothstep(.45, .8, uB));
  vA = on * (.35 + .65 * aR) * smoothstep(90., 20., -mv.z);
}`;
const DOT_F = 'varying float vA; void main(){ float d = length(gl_PointCoord - .5) * 2.; gl_FragColor = vec4(vec3(.75, .95, 1.) * 1.4, vA * (1. - d)); }';

function Dots({ beams, touch, u }) {
  const geo = useMemo(() => {
    const rnd = seeded(5);
    const pos = [];
    const r = [];
    const step = touch ? 0.9 : 0.55;
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    for (const b of beams) {
      if (rnd() > 0.55) continue;
      q.setFromEuler(e.set(...b.r));
      for (let s = -b.len / 2; s <= b.len / 2; s += step) {
        v.set(s, 0, 0).applyQuaternion(q);
        pos.push(b.p[0] + v.x, b.p[1] + v.y, b.p[2] + v.z);
        r.push(rnd());
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aR', new THREE.Float32BufferAttribute(r, 1));
    return g;
  }, [beams, touch]);
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: DOT_V, fragmentShader: DOT_F, uniforms: { uB: u }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), [u]);
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={3} />;
}

// Where the parts go: crowded along the core's four inner walls, densest at its corners, sparser on the outer lattice.
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const Q_YAW = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

function placeParts(rnd, n, opts = { corner: 0.45, reach: 1.6 }) {
  const W = opts.w || A;
  const Hh = opts.h || A;
  const out = [];
  const zLen = Z_A - Z_B;
  for (let i = 0; i < n; i++) {
    const z = Z_A - rnd() * zLen;
    const side = Math.floor(rnd() * 4);
    // along the wall, pushed toward its corners
    let t = rnd() * 2 - 1;
    t = Math.sign(t) * Math.pow(Math.abs(t), opts.corner);
    const along = t * (side < 2 ? W : Hh); // floor and ceiling run the width, the side walls the height
    const wall = side < 2 ? Hh : W;
    const depth = wall + 0.05 + Math.pow(rnd(), 1.8) * C * opts.reach; // a little into the lattice, mostly at the wall
    const sx = 0.12 + Math.pow(rnd(), 2.4) * 0.75;
    const sy = 0.08 + Math.pow(rnd(), 2.2) * 0.55;
    const sz = 0.14 + Math.pow(rnd(), 2) * 1.1;
    const o = depth - wall + sy / 2;
    const p = side === 0 ? [along, wall + o, z] : side === 1 ? [along, -wall - o, z] : side === 2 ? [wall + o, along, z] : [-wall - o, along, z];
    // the kit is y-up: s is [width, height, length]; q turns its top toward the core, then a quarter-turn about its own up
    const q = new THREE.Quaternion().setFromAxisAngle(Z_AXIS, side === 0 ? Math.PI : side === 2 ? Math.PI / 2 : side === 3 ? -Math.PI / 2 : 0);
    if (rnd() < 0.5) q.multiply(Q_YAW);
    out.push({ p, q, side, s: [sx, sy, sz], kind: Math.floor(rnd() * 7), d: 0.35 + rnd() * 0.45 });
  }
  return out;
}

function Parts({ touch, mat }) {
  const { nodes } = useGLTF(KIT);
  // one geometry per kit part, made once: a new geometry would make react-three-fiber rebuild the mesh (and lose its matrices)
  const kit = useMemo(() => Object.values(nodes).filter((o) => o.isMesh).sort((a, b) => a.name.localeCompare(b.name)).map((o) => o.geometry.clone()), [nodes]);
  const parts = useMemo(() => {
    const core = placeParts(seeded(9), touch ? 800 : 2000, { corner: 0.12, reach: 0.9 });
    const mid = placeParts(seeded(19), touch ? 120 : 320, { corner: 0.2, reach: 0.6, w: SHELLS[1].x0, h: SHELLS[1].y0 });
    return core.concat(mid.map((m) => ({ ...m, s: m.s.map((v) => v * 1.6) })));
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

// The glitter: tiny emissive blocks among the parts. Each one flickers on once the build reaches it, then twinkles.
const LIGHT_V = `uniform float uB; uniform float uTime; attribute float aD; attribute vec3 aC; varying vec3 vC;
void main(){
  float on = step(aD, uB * 1.7 - .55);
  float flick = on * mix(step(.5, fract(sin(aD * 91.7 + floor(uTime * 18.)) * 43758.5)), 1., smoothstep(aD + .55, aD + .8, uB * 1.7));
  float tw = .55 + .45 * pow(.5 + .5 * sin(uTime * (1.3 + aD * 4.) + aD * 60.), 3.);
  vC = aC * flick * tw;
  vec3 pos = position * max(on, 0.0001);
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.);
}`;
const LIGHT_F = 'varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.); }';

function Lights({ touch, u, bars }) {
  const mesh = useRef();
  const items = useMemo(() => {
    const rnd = seeded(23);
    const cols = [[3.4, 4.0, 4.0], [1.8, 4.2, 3.8], [3.0, 4.4, 4.4], [1.2, 3.4, 4.2], [4.2, 2.8, 1.4]];
    // most glints sit at the joints where bars meet, in little clusters, densest on the frame round the core
    const joints = new Map();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    for (const b of bars) {
      q.setFromEuler(e.set(...b.r));
      for (const sgn of [-1, 1]) {
        v.set((sgn * b.len) / 2, 0, 0).applyQuaternion(q);
        const j = [b.p[0] + v.x, b.p[1] + v.y, b.p[2] + v.z].map((x) => Math.round(x * 10) / 10);
        joints.set(j.join(','), j);
      }
    }
    const atJoints = [];
    for (const j of joints.values()) {
      const ring = Math.max(Math.abs(j[0]), Math.abs(j[1]));
      const atCorner = Math.abs(Math.abs(j[0]) - A) < 0.05 && Math.abs(Math.abs(j[1]) - A) < 0.05;
      const chance = atCorner ? 0.95 : ring <= A + 0.01 ? 0.08 : ring <= A + C + 0.01 ? 0.22 : ring <= SHELLS[1].x1 + 0.01 ? 0.12 : 0.04;
      if (rnd() > chance * (touch ? 0.45 : 1)) continue;
      const n = 1 + Math.floor(rnd() * (atCorner ? 8 : 3));
      const d = 0.4 + rnd() * 0.4;
      for (let k = 0; k < n; k++) {
        const s = 0.02 + Math.pow(rnd(), 3) * 0.1;
        const sp = 0.08 + rnd() * 0.32;
        atJoints.push({ p: [j[0] + (rnd() - 0.5) * sp, j[1] + (rnd() - 0.5) * sp, j[2] + (rnd() - 0.5) * sp * 1.6], s: [s * (1 + rnd() * 2.5), s, s * (1 + rnd() * 2)], c: cols[rnd() < 0.08 ? 4 : Math.floor(rnd() * 4)], d: d + rnd() * 0.08 });
      }
    }
    const base = placeParts(rnd, touch ? 140 : 360, { corner: 0.1, reach: 0.45 });
    return atJoints.concat(base.map((b, i) => {
      const s = 0.022 + Math.pow(rnd(), 3.5) * 0.11;
      // on the face of its part that looks into the core, so it is never buried
      const p = b.p.slice();
      const j = b.side < 2 ? 1 : 0;
      p[j] -= Math.sign(p[j]) * (b.s[1] / 2 + 0.015);
      return { p, s: [s * (1 + rnd() * 3), s, s * (1 + rnd() * 2)], c: cols[i % 11 === 0 ? 4 : Math.floor(rnd() * 4)], d: b.d + 0.05 };
    }));
  }, [touch, bars]);
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

// Cool white lights ride ahead of the camera so the beams catch moving highlights (three lights, always mounted: changing
// the number of lights would recompile every lit shader).
function RideLights({ build }) {
  const a = useRef();
  const b = useRef();
  const c = useRef();
  const { scene } = useThree();
  useFrame((s) => {
    const z = s.camera.position.z;
    const k = seg(z, CAGE_END - 8, CAGE_END + 6) * build.current;
    if (a.current) {
      a.current.position.set(Math.sin(z * 0.05) * 2.4, 2.6, z - 10);
      a.current.intensity = 22 * k;
    }
    if (b.current) {
      b.current.position.set(-Math.sin(z * 0.04) * 2.4, -2.4, z - 18);
      b.current.intensity = 12 * k;
    }
    if (c.current) {
      c.current.position.set(0, 0, z - 34);
      c.current.intensity = 70 * k;
    }
  });
  return createPortal(
    <>
      <pointLight ref={a} intensity={60} distance={30} decay={2} color="#c9f4ff" />
      <pointLight ref={b} intensity={40} distance={26} decay={2} color="#7fe6ff" />
      <pointLight ref={c} intensity={90} distance={40} decay={2} color="#e8fbff" />
    </>,
    scene
  );
}

export default function Grid({ touch, sp }) {
  const bars = useMemo(() => lattice(seeded(3)), []);
  const beams = useMemo(() => breakUp(bars, seeded(4)), [bars]);
  const beamMat = useMemo(() => buildMaterial({ color: '#3b424b', metalness: 1, roughness: 0.28, envMapIntensity: 0.32 }, 'beam'), []);
  const partMat = useMemo(() => buildMaterial({ color: '#4a525c', metalness: 0.85, roughness: 0.36, vertexColors: true, envMapIntensity: 0.28 }, 'part'), []);
  const u = useMemo(() => ({ uB: { value: 0 }, uTime: { value: 0 } }), []);
  const build = useRef(0);
  useFrame((s) => {
    const b = labState.warm ? 1 : buildAt(sp.current);
    build.current = b;
    u.uB.value = b;
    u.uTime.value = s.clock.elapsedTime;
    beamMat.userData.u.uB.value = b;
    partMat.userData.u.uB.value = b;
  });
  return (
    <>
      <RideLights build={build} />
      <Dots beams={bars} touch={touch} u={u.uB} />
      <Beams beams={beams} mat={beamMat} />
      <Parts touch={touch} mat={partMat} />
      <Lights touch={touch} u={u} bars={bars} />
    </>
  );
}

useGLTF.preload(KIT);
