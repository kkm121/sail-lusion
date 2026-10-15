import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { seeded } from '../lib/three-utils';
import { CAGE_END } from '../lib/journey';
import { fillMatrices, seg, makeGlowMaterial, glowQuad } from './shared';

const W = 6.2;
const END = CAGE_END + 10;

// ---------- metal beams: bevelled boxes lit by an analytic studio (no textures needed) ----------
const BEAM_V = `varying vec3 vN; varying vec3 vP; varying float vZ; varying float vSeed;
void main(){
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.);
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vP = wp.xyz;
  vSeed = fract(sin(dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  vec4 mv = viewMatrix * wp;
  vZ = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const BEAM_F = `uniform vec3 uTint; uniform vec3 uFog; uniform float uTime;
varying vec3 vN; varying vec3 vP; varying float vZ; varying float vSeed;
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vP);
  vec3 R = reflect(-V, N);
  float fres = pow(1. - abs(dot(N, V)), 2.2);
  // three softboxes: warm key above-left, cool fill right, white kicker behind
  float k1 = pow(max(dot(R, normalize(vec3(-0.45, 0.85, 0.3))), 0.), 26.) * 1.5;
  float k2 = pow(max(dot(R, normalize(vec3(0.7, 0.25, 0.55))), 0.), 34.) * 1.0;
  float k3 = pow(max(dot(R, normalize(vec3(0.0, -0.3, -1.0))), 0.), 14.) * 0.8;
  vec3 base = mix(vec3(0.035, 0.042, 0.055), vec3(0.075, 0.09, 0.115), 0.5 + 0.5 * N.y);
  vec3 col = base + uTint * (k1 + fres * 0.55) + vec3(0.62, 0.86, 1.0) * k2 + vec3(1.0, 0.9, 0.7) * k3;
  float streak = pow(max(sin(vP.z * 0.42 + uTime * 0.9 + vSeed * 40.), 0.), 28.);
  col += uTint * streak * (0.35 + fres * 1.1);
  col = mix(col, uFog, smoothstep(18., 104., vZ));
  gl_FragColor = vec4(col, 1.);
}`;

// ---------- data glitches: small bright slabs that flicker ----------
const GLITCH_V = `uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
attribute vec4 aGl; varying vec3 vC;
void main(){
  float v = sin(uTime * aGl.y + aGl.x);
  float on = smoothstep(0.45, 1., v);
  float k = 0.12 + on * aGl.z * 3.2;
  vec3 hue = aGl.w < 0.5 ? mix(uA, uB, aGl.w * 2.) : mix(uB, uC, (aGl.w - 0.5) * 2.);
  vC = hue * k;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);
}`;
const GLITCH_F = `varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.); }`;

// ---------- light pulses travelling along the rails ----------
const PULSE_V = `uniform float uTime; attribute vec4 aP; attribute vec3 aRail; varying float vL; varying vec3 vCol;
void main(){
  float len = ${(Math.abs(END) - 14).toFixed(1)};
  float t = fract(aP.x + uTime * aP.y * 0.06);
  vec3 pos = vec3(aRail.x, aRail.y, -14. - t * len);
  vec3 p = position;
  p.z *= aP.z;
  vL = 0.5 - p.z / aP.z * 0.5;
  vCol = mix(vec3(1.0, 0.82, 0.45), vec3(0.55, 0.95, 1.0), aRail.z);
  gl_Position = projectionMatrix * viewMatrix * vec4(pos + p * vec3(0.12, 0.12, 1.), 1.);
}`;
const PULSE_F = `varying float vL; varying vec3 vCol; void main(){ float a = pow(1. - abs(vL * 2. - 1.), 1.6); gl_FragColor = vec4(vCol * (0.4 + a * 3.2), a); }`;

// ---------- glass wall panels ----------
const GLASS_V = `varying vec2 vUv; varying float vSeed; void main(){ vUv = uv; vSeed = fract(sin(dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453); gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }`;
const GLASS_F = `uniform float uTime; varying vec2 vUv; varying float vSeed;
void main(){
  vec2 e = min(vUv, 1. - vUv);
  float edge = 1. - smoothstep(0., 0.022, min(e.x, e.y));
  float sweep = smoothstep(0.35, 1., sin((vUv.x * 1.2 + vUv.y) * 5. - uTime * 0.7 + vSeed * 20.));
  float body = 0.035 + 0.05 * (1. - vUv.y) + sweep * 0.07;
  vec3 col = mix(vec3(1.0, 0.72, 0.28), vec3(0.45, 0.9, 1.0), step(0.55, vSeed));
  gl_FragColor = vec4(col * (1.6 + sweep * 1.8 + edge * 1.2), body + edge * 0.28);
}`;

// ---------- 4-point star glints ----------
const STAR_V = `uniform float uTime; uniform float uPx; attribute vec4 aS; varying float vA; varying float vH;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  float tw = pow(0.5 + 0.5 * sin(uTime * (0.7 + aS.y * 2.2) + aS.x * 40.), 3.);
  gl_PointSize = min(uPx * (0.6 + aS.z) * (26. / max(-mv.z, 1.)) * (0.4 + tw), 46.);
  vA = tw * smoothstep(2., 8., -mv.z);
  vH = aS.w;
}`;
const STAR_F = `varying float vA; varying float vH;
void main(){
  vec2 p = gl_PointCoord - .5;
  float d = length(p) * 2.;
  float cross = exp(-abs(p.x) * 38.) * exp(-abs(p.y) * 6.) + exp(-abs(p.y) * 38.) * exp(-abs(p.x) * 6.);
  float core = exp(-d * 7.);
  float a = (cross * 0.9 + core) * vA;
  vec3 c = mix(vec3(1.0, 0.86, 0.55), vec3(0.7, 0.95, 1.0), step(0.5, vH));
  gl_FragColor = vec4(c * a * 2., a);
}`;

const EMBER_V = `uniform float uTime; uniform float uPx; attribute vec4 aS; varying float vA;
void main(){
  float t = uTime * (0.25 + aS.w * 0.5);
  vec3 p = position;
  p.x += sin(t + aS.x * 6.28) * 0.5;
  p.y += cos(t * 0.8 + aS.y * 6.28) * 0.5 + fract(t * 0.05 + aS.z) * 1.2;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(uPx * (0.5 + aS.w) * (20. / max(-mv.z, 1.)), 22.);
  vA = (0.4 + 0.6 * sin(uTime * 1.4 + aS.x * 12.)) * smoothstep(1.5, 8., -mv.z);
}`;
const EMBER_F = `varying float vA; void main(){ float d = length(gl_PointCoord - .5) * 2.; float a = pow(max(1. - d, 0.), 2.) * vA; gl_FragColor = vec4(vec3(1., .82, .42) * 1.6, a); }`;

const PANE_V = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const PANE_F = `uniform float uTime; uniform vec2 uCorner; varying vec2 vUv;
void main(){
  float edge = min(min(vUv.x, 1. - vUv.x), min(vUv.y, 1. - vUv.y));
  float line = 1. - smoothstep(0., 0.03, edge);
  float g = clamp(dot(vUv - .5, uCorner) + .5, 0., 1.);
  float sheen = smoothstep(0.4, 1., sin((vUv.x + vUv.y) * 5.6 - uTime * 0.5));
  vec3 col = mix(vec3(1.0, 0.7, 0.18), vec3(1.0, 0.92, 0.6), g);
  col = mix(col, vec3(1.0, 0.98, 0.84), line * 0.7 + sheen * 0.35);
  float a = 0.03 + g * g * 0.22 + sheen * 0.16 * g + line * 0.7 * (0.45 + g);
  gl_FragColor = vec4(col * 2.6, a);
}`;

function Beams() {
  const beams = useRef();
  const geo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.16), []);
  const items = useMemo(() => {
    const rnd = seeded(101);
    const out = [];
    for (let k = 0; k < 17; k++) {
      const z = -14 - k * 6;
      out.push({ p: [0, W, z], s: [W * 2 + 0.2, 0.2, 0.2] });
      out.push({ p: [0, -W, z], s: [W * 2 + 0.2, 0.2, 0.2] });
      out.push({ p: [-W, 0, z], s: [0.2, W * 2 + 0.2, 0.2] });
      out.push({ p: [W, 0, z], s: [0.2, W * 2 + 0.2, 0.2] });
      // an inner, thinner frame every other ring gives the corridor depth
      if (k % 2 === 0) {
        const i = W - 1.5;
        out.push({ p: [0, i, z - 3], s: [i * 2, 0.07, 0.07] });
        out.push({ p: [0, -i, z - 3], s: [i * 2, 0.07, 0.07] });
        out.push({ p: [-i, 0, z - 3], s: [0.07, i * 2, 0.07] });
        out.push({ p: [i, 0, z - 3], s: [0.07, i * 2, 0.07] });
      }
    }
    const railLen = Math.abs(END) - 14;
    [[-W, -W], [W, -W], [-W, W], [W, W]].forEach(([x, y]) => out.push({ p: [x, y, -14 - railLen / 2], s: [0.3, 0.3, railLen] }));
    for (let i = 0; i < 110; i++) {
      const wall = Math.floor(rnd() * 4);
      const u = (rnd() * 2 - 1) * (W - 0.4);
      const inset = 0.05 + rnd() * 0.5;
      const len = 4 + rnd() * 14;
      const z = -14 - rnd() * (Math.abs(END) - 28);
      const th = 0.07 + rnd() * 0.12;
      const pos = wall === 0 ? [u, W - inset, z] : wall === 1 ? [u, -W + inset, z] : wall === 2 ? [-W + inset, u, z] : [W - inset, u, z];
      out.push({ p: pos, s: [th, th, len] });
    }
    for (let i = 0; i < 46; i++) {
      const wall = Math.floor(rnd() * 4);
      const z = -18 - rnd() * (Math.abs(END) - 34);
      const len = 4 + rnd() * 4;
      const ang = (rnd() < 0.5 ? 1 : -1) * (Math.PI / 4 + (rnd() - 0.5) * 0.35);
      const th = 0.08 + rnd() * 0.07;
      const u = (rnd() * 2 - 1) * (W - 1.8);
      if (wall === 0) out.push({ p: [u, W - 0.05, z], s: [th, th, len], r: [0, ang, 0] });
      else if (wall === 1) out.push({ p: [u, -W + 0.05, z], s: [th, th, len], r: [0, ang, 0] });
      else if (wall === 2) out.push({ p: [-W + 0.05, u, z], s: [th, th, len], r: [ang, 0, 0] });
      else out.push({ p: [W - 0.05, u, z], s: [th, th, len], r: [ang, 0, 0] });
    }
    return out;
  }, []);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: BEAM_V, fragmentShader: BEAM_F, uniforms: { uTint: { value: new THREE.Color('#ffc65a') }, uFog: { value: new THREE.Color('#2a1a05') }, uTime: { value: 0 } } }),
    []
  );
  const tintA = useMemo(() => new THREE.Color('#ffc65a'), []);
  const tintB = useMemo(() => new THREE.Color('#7fe8ff'), []);
  useLayoutEffect(() => {
    fillMatrices(beams.current, items);
  }, [items]);
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uTint.value.copy(tintA).lerp(tintB, seg(s.camera.position.z, -60, END));
  });
  return <instancedMesh ref={beams} args={[geo, mat, items.length]} frustumCulled={false} />;
}

function Pulses({ touch }) {
  const { geo, mat } = useMemo(() => {
    const rnd = seeded(808);
    const n = touch ? 28 : 64;
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    const aP = new Float32Array(n * 4);
    const aRail = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const edge = Math.floor(rnd() * 4);
      const u = (rnd() * 2 - 1) * (W - 0.2);
      const x = edge === 0 ? u : edge === 1 ? u : edge === 2 ? -W + 0.15 : W - 0.15;
      const y = edge === 0 ? W - 0.15 : edge === 1 ? -W + 0.15 : u;
      aP.set([rnd(), 0.6 + rnd() * 1.4, 1.4 + rnd() * 3.2, 0], i * 4);
      aRail.set([x, y, rnd() < 0.5 ? 0 : 1], i * 3);
    }
    g.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4));
    g.setAttribute('aRail', new THREE.InstancedBufferAttribute(aRail, 3));
    g.instanceCount = n;
    const m = new THREE.ShaderMaterial({ vertexShader: PULSE_V, fragmentShader: PULSE_F, uniforms: { uTime: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    return { geo: g, mat: m };
  }, [touch]);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={4} />;
}

function Glitch({ touch }) {
  const ref = useRef();
  const data = useMemo(() => {
    const rnd = seeded(303);
    const items = [];
    const meta = [];
    const clusters = touch ? 28 : 52;
    for (let c = 0; c < clusters; c++) {
      const wall = Math.floor(rnd() * 4);
      const u = (rnd() * 2 - 1) * (W - 0.5);
      const z = -14 - rnd() * (Math.abs(END) - 24);
      const inset = 0.2 + rnd() * 1.2;
      const base = wall === 0 ? [u, W - inset, z] : wall === 1 ? [u, -W + inset, z] : wall === 2 ? [-W + inset, u, z] : [W - inset, u, z];
      const n = 6 + Math.floor(rnd() * 16);
      for (let i = 0; i < n; i++) {
        const sx = 0.08 + rnd() * 0.4;
        const sy = 0.04 + rnd() * 0.17;
        const flat = rnd() < 0.5;
        items.push({ p: [base[0] + (rnd() - 0.5) * 2.0, base[1] + (rnd() - 0.5) * 2.0, base[2] + (rnd() - 0.5) * 2.5], s: flat ? [sx, sy, 0.02] : [0.02, sy, sx] });
        meta.push(rnd() * 6.28, 0.8 + rnd() * 2.6, 0.5 + rnd() * 1.8, rnd());
      }
    }
    return { items, meta: new Float32Array(meta) };
  }, [touch]);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: GLITCH_V, fragmentShader: GLITCH_F, uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color('#fff1c2') }, uB: { value: new THREE.Color('#ffc65a') }, uC: { value: new THREE.Color('#7fe8ff') } } }),
    []
  );
  useLayoutEffect(() => {
    fillMatrices(ref.current, data.items);
    ref.current.geometry.setAttribute('aGl', new THREE.InstancedBufferAttribute(data.meta, 4));
  }, [data]);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return (
    <instancedMesh ref={ref} args={[undefined, mat, data.items.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

function GlassPanels({ touch }) {
  const ref = useRef();
  const items = useMemo(() => {
    const rnd = seeded(55);
    const out = [];
    const n = touch ? 10 : 22;
    for (let i = 0; i < n; i++) {
      const wall = i % 4;
      const z = -20 - (i / n) * (Math.abs(END) - 36) - rnd() * 3;
      const w = 3.2 + rnd() * 3.2;
      const h = 2.2 + rnd() * 2.6;
      const u = (rnd() * 2 - 1) * (W - w * 0.5 - 0.6);
      const gap = 0.12;
      if (wall === 0) out.push({ p: [u, W - gap, z], s: [w, h, 1], r: [Math.PI / 2, 0, 0] });
      else if (wall === 1) out.push({ p: [u, -W + gap, z], s: [w, h, 1], r: [-Math.PI / 2, 0, 0] });
      else if (wall === 2) out.push({ p: [-W + gap, u, z], s: [h, w, 1], r: [0, Math.PI / 2, 0] });
      else out.push({ p: [W - gap, u, z], s: [h, w, 1], r: [0, -Math.PI / 2, 0] });
    }
    return out;
  }, [touch]);
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: GLASS_V, fragmentShader: GLASS_F, uniforms: { uTime: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), []);
  useLayoutEffect(() => fillMatrices(ref.current, items), [items]);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return (
    <instancedMesh ref={ref} args={[undefined, mat, items.length]} frustumCulled={false} renderOrder={3}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

function Stars4({ touch }) {
  const { geo, mat } = useMemo(() => {
    const rnd = seeded(404);
    const n = touch ? 40 : 90;
    const pos = new Float32Array(n * 3);
    const s = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const wall = Math.floor(rnd() * 4);
      const u = (rnd() * 2 - 1) * (W - 0.4);
      const z = -16 - rnd() * (Math.abs(END) - 26);
      const inset = 0.2 + rnd() * 1.6;
      const p = wall === 0 ? [u, W - inset, z] : wall === 1 ? [u, -W + inset, z] : wall === 2 ? [-W + inset, u, z] : [W - inset, u, z];
      pos.set(p, i * 3);
      s.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.BufferAttribute(s, 4));
    const m = new THREE.ShaderMaterial({ vertexShader: STAR_V, fragmentShader: STAR_F, uniforms: { uTime: { value: 0 }, uPx: { value: touch ? 22 : 30 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    return { geo: g, mat: m };
  }, [touch]);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />;
}

function Bubbles({ touch }) {
  const refs = useRef([]);
  const spots = useMemo(() => {
    const rnd = seeded(606);
    return Array.from({ length: touch ? 4 : 6 }, (_, i) => ({ p: [(rnd() - 0.5) * 6, (rnd() - 0.5) * 5, -24 - i * 15 - rnd() * 4], s: 0.55 + rnd() * 0.5, ph: rnd() * 6 }));
  }, [touch]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 1.8); gl_FragColor = vec4(mix(vec3(0.42, 0.3, 0.05), vec3(1., 0.92, 0.66), f) * (0.35 + f * 1.4), 0.06 + f * 0.7); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((m, i) => m && (m.position.y = spots[i].p[1] + Math.sin(t * 0.6 + spots[i].ph) * 0.35));
  });
  return (
    <>
      {spots.map((sp, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={sp.p} scale={sp.s} material={mat}>
          <sphereGeometry args={[1.2, 32, 24]} />
        </mesh>
      ))}
    </>
  );
}

function GoldCorner() {
  const mats = useMemo(
    () =>
      [new THREE.Vector2(0, 1), new THREE.Vector2(1, 0)].map(
        (c) => new THREE.ShaderMaterial({ vertexShader: PANE_V, fragmentShader: PANE_F, uniforms: { uTime: { value: 0 }, uCorner: { value: c } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      ),
    []
  );
  const glows = useMemo(() => [makeGlowMaterial(22, '#ffc94d', 1.25, 3.4), makeGlowMaterial(13, '#ff9f1f', 0.6, 3.4)], []);
  const zs = useMemo(() => Array.from({ length: 6 }, (_, k) => -18 - k * 17), []);
  useFrame((s) => mats.forEach((m) => (m.uniforms.uTime.value = s.clock.elapsedTime)));
  return (
    <>
      {zs.map((z) => (
        <group key={z}>
          <mesh material={mats[0]} position={[W - 0.08, W - 1.25, z]} rotation={[0, -Math.PI / 2, 0]} frustumCulled={false}>
            <planeGeometry args={[11, 3]} />
          </mesh>
          <mesh material={mats[1]} position={[W - 1.25, W - 0.08, z]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <planeGeometry args={[3, 11]} />
          </mesh>
          <mesh geometry={glowQuad} material={glows[0]} position={[W - 0.5, W - 0.5, z]} renderOrder={2} frustumCulled={false} />
          <mesh geometry={glowQuad} material={glows[1]} position={[-W + 0.5, -W + 0.5, z]} renderOrder={2} frustumCulled={false} />
        </group>
      ))}
    </>
  );
}

function Embers({ touch }) {
  const geo = useMemo(() => {
    const rnd = seeded(77);
    const n = touch ? 140 : 340;
    const pos = new Float32Array(n * 3);
    const s = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos.set([(rnd() * 2 - 1) * W * 0.95, (rnd() * 2 - 1) * W * 0.95, -8 - rnd() * (Math.abs(END) - 10)], i * 3);
      s.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.BufferAttribute(s, 4));
    return g;
  }, [touch]);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: EMBER_V, fragmentShader: EMBER_F, uniforms: { uTime: { value: 0 }, uPx: { value: touch ? 5 : 7 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    [touch]
  );
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

export default function Cage({ touch }) {
  return (
    <>
      <Beams />
      <GlassPanels touch={touch} />
      <GoldCorner />
      <Pulses touch={touch} />
      <Glitch touch={touch} />
      <Stars4 touch={touch} />
      <Bubbles touch={touch} />
      <Embers touch={touch} />
    </>
  );
}
