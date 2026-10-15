import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded } from '../lib/three-utils';
import { CAGE_END } from '../lib/journey';
import { SoftGlow, fillMatrices, seg } from './shared';

const W = 6.2;
const END = CAGE_END + 10;

const BEAM_V = `varying vec3 vN; varying vec3 vP; varying float vZ;
void main(){
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.);
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vP = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vZ = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const BEAM_F = `uniform vec3 uTint; uniform vec3 uFog; uniform float uTime;
varying vec3 vN; varying vec3 vP; varying float vZ;
void main(){
  vec3 V = normalize(cameraPosition - vP);
  float fres = pow(1. - abs(dot(vN, V)), 2.4);
  float lit = 0.62 + max(vN.y, 0.) * 0.5 + abs(vN.x) * 0.2 + abs(vN.z) * 0.08;
  vec3 col = vec3(0.045, 0.055, 0.075) * lit + uTint * fres * 0.34;
  float streak = pow(max(sin(vP.z * 0.32 + uTime * 0.7 + vP.x * 0.8), 0.), 22.) * 0.35;
  col += uTint * streak * (0.25 + fres);
  col = mix(col, uFog, smoothstep(16., 92., vZ));
  gl_FragColor = vec4(col, 1.);
}`;

const GLITCH_V = `uniform float uTime; uniform vec3 uA; uniform vec3 uB;
attribute vec4 aGl; varying vec3 vC;
void main(){
  float v = sin(uTime * aGl.y + aGl.x);
  float on = smoothstep(0.5, 1., v);
  float k = 0.14 + on * aGl.z * 2.9;
  vC = mix(uA, uB, aGl.w) * k;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);
}`;
const GLITCH_F = `varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.); }`;

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

function Frame() {
  const beams = useRef();
  const items = useMemo(() => {
    const rnd = seeded(101);
    const out = [];
    for (let k = 0; k < 17; k++) {
      const z = -14 - k * 6;
      out.push({ p: [0, W, z], s: [W * 2 + 0.2, 0.2, 0.2] });
      out.push({ p: [0, -W, z], s: [W * 2 + 0.2, 0.2, 0.2] });
      out.push({ p: [-W, 0, z], s: [0.2, W * 2 + 0.2, 0.2] });
      out.push({ p: [W, 0, z], s: [0.2, W * 2 + 0.2, 0.2] });
    }
    const railLen = Math.abs(END) - 14;
    [[-W, -W], [W, -W], [-W, W], [W, W]].forEach(([x, y]) => out.push({ p: [x, y, -14 - railLen / 2], s: [0.26, 0.26, railLen] }));
    for (let i = 0; i < 80; i++) {
      const wall = Math.floor(rnd() * 4);
      const u = (rnd() * 2 - 1) * (W - 0.4);
      const inset = 0.05 + rnd() * 0.4;
      const len = 4 + rnd() * 14;
      const z = -14 - rnd() * (Math.abs(END) - 28);
      const th = 0.09 + rnd() * 0.1;
      const pos = wall === 0 ? [u, W - inset, z] : wall === 1 ? [u, -W + inset, z] : wall === 2 ? [-W + inset, u, z] : [W - inset, u, z];
      out.push({ p: pos, s: [th, th, len] });
    }
    for (let i = 0; i < 34; i++) {
      const wall = Math.floor(rnd() * 4);
      const z = -18 - rnd() * (Math.abs(END) - 34);
      const len = 4 + rnd() * 4;
      const ang = (rnd() < 0.5 ? 1 : -1) * (Math.PI / 4 + (rnd() - 0.5) * 0.35);
      const th = 0.09 + rnd() * 0.07;
      const u = (rnd() * 2 - 1) * (W - 1.8);
      if (wall === 0) out.push({ p: [u, W - 0.05, z], s: [th, th, len], r: [0, ang, 0] });
      else if (wall === 1) out.push({ p: [u, -W + 0.05, z], s: [th, th, len], r: [0, ang, 0] });
      else if (wall === 2) out.push({ p: [-W + 0.05, u, z], s: [th, th, len], r: [ang, 0, 0] });
      else out.push({ p: [W - 0.05, u, z], s: [th, th, len], r: [ang, 0, 0] });
    }
    return out;
  }, []);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: BEAM_V, fragmentShader: BEAM_F, uniforms: { uTint: { value: new THREE.Color('#ffc65a') }, uFog: { value: new THREE.Color('#050403') }, uTime: { value: 0 } } }),
    []
  );
  const tintA = useMemo(() => new THREE.Color('#ffc65a'), []);
  const tintB = useMemo(() => new THREE.Color('#3fe8ff'), []);
  useLayoutEffect(() => {
    fillMatrices(beams.current, items);
  }, [items]);
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uTint.value.copy(tintA).lerp(tintB, seg(s.camera.position.z, -70, END));
  });
  return (
    <instancedMesh ref={beams} args={[undefined, undefined, items.length]} material={mat} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

function Glitch({ touch }) {
  const ref = useRef();
  const data = useMemo(() => {
    const rnd = seeded(303);
    const items = [];
    const meta = [];
    const clusters = touch ? 26 : 44;
    for (let c = 0; c < clusters; c++) {
      const wall = Math.floor(rnd() * 4);
      const u = (rnd() * 2 - 1) * (W - 0.5);
      const z = -14 - rnd() * (Math.abs(END) - 24);
      const inset = 0.2 + rnd() * 1.2;
      const base = wall === 0 ? [u, W - inset, z] : wall === 1 ? [u, -W + inset, z] : wall === 2 ? [-W + inset, u, z] : [W - inset, u, z];
      const n = 6 + Math.floor(rnd() * 14);
      for (let i = 0; i < n; i++) {
        const sx = 0.08 + rnd() * 0.38;
        const sy = 0.04 + rnd() * 0.16;
        const flat = rnd() < 0.5;
        items.push({ p: [base[0] + (rnd() - 0.5) * 2.0, base[1] + (rnd() - 0.5) * 2.0, base[2] + (rnd() - 0.5) * 2.5], s: flat ? [sx, sy, 0.02] : [0.02, sy, sx] });
        meta.push(rnd() * 6.28, 0.8 + rnd() * 2.6, 0.5 + rnd() * 1.8, rnd());
      }
    }
    return { items, meta: new Float32Array(meta) };
  }, [touch]);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: GLITCH_V, fragmentShader: GLITCH_F, uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color('#fff1c2') }, uB: { value: new THREE.Color('#5ff6ff') } } }),
    []
  );
  useLayoutEffect(() => {
    fillMatrices(ref.current, data.items);
    ref.current.geometry.setAttribute('aGl', new THREE.InstancedBufferAttribute(data.meta, 4));
  }, [data]);
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.items.length]} material={mat} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
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
          <SoftGlow position={[W - 0.5, W - 0.5, z]} size={22} color="#ffc94d" gain={1.25} />
          <SoftGlow position={[-W + 0.5, -W + 0.5, z]} size={13} color="#ff9f1f" gain={0.6} />
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
      <Frame />
      <GoldCorner />
      <Glitch touch={touch} />
      <Bubbles touch={touch} />
      <Embers touch={touch} />
    </>
  );
}
