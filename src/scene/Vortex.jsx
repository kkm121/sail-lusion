import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded } from '../lib/three-utils';
import { CAGE_END, ROOM_START } from '../lib/journey';
import { PAL_GLSL, fillMatrices, makeGlowMaterial, seg } from './shared';

const quad = new THREE.PlaneGeometry(1, 1);

const LEN = CAGE_END - ROOM_START;
const radius = (u) => 5.5 - 3.2 * Math.pow(u, 1.15) + Math.sin(u * 16) * 0.22;
const zAt = (u) => CAGE_END - u * LEN;

const SHELL_V = `uniform float uScale; varying vec2 vUv; varying float vZ;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position.xy * uScale, position.z, 1.);
  vZ = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const SHELL_F = `uniform float uTime; uniform float uN1; uniform float uN2; uniform float uT1; uniform float uT2; uniform float uW; uniform float uGain; uniform float uSpd; uniform float uFade;
varying vec2 vUv; varying float vZ;
${PAL_GLSL}
float ln(float x, float w){ float f = fract(x); float d = min(f, 1. - f); float aa = fwidth(x) * 1.3; return 1. - smoothstep(w, w + aa, d); }
void main(){
  float u = vUv.x, v = vUv.y;
  float x1 = v * uN1 + u * uT1 - uTime * uSpd;
  float x2 = v * uN2 - u * uT2 + uTime * uSpd * 0.7;
  float x3 = u * 64. - uTime * 0.9;
  float a = ln(x1, uW);
  float b = ln(x2, uW);
  float r = ln(x3, uW * 1.6);
  vec2 cell = floor(vec2(x1, x3));
  float h = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  float facet = 0.035 + 0.16 * smoothstep(0.55, 1., h);
  float flick = 0.78 + 0.22 * sin(u * 52. - uTime * 2.2 + v * 18.);
  float I = ((a + b) * 0.8 + r * 0.55 + a * b * 1.6 + (a + b) * r * 0.8) * flick + facet;
  float edge = smoothstep(0., 0.05, u) * (1. - smoothstep(0.93, 1., u));
  float near = smoothstep(1.5, 6., vZ);
  gl_FragColor = vec4(pal(u + (flick - 0.78) * 0.2) * I * uGain * edge * near * uFade, 1.);
}`;

const SHARD_V = `varying vec3 vB; varying float vU; varying float vId; attribute vec3 aBary;
void main(){
  vB = aBary;
  vId = float(gl_InstanceID);
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.);
  vU = (${CAGE_END.toFixed(1)} - wp.z) / ${LEN.toFixed(1)};
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SHARD_F = `uniform float uTime; uniform float uFade; varying vec3 vB; varying float vU; varying float vId;
${PAL_GLSL}
void main(){
  float e = min(min(vB.x, vB.y), vB.z);
  float line = 1. - smoothstep(0., 0.07, e);
  float tw = 0.55 + 0.45 * sin(uTime * 1.6 + vId * 2.3);
  vec3 col = mix(pal(vU), vec3(1.), 0.35 + line * 0.5);
  float a = (0.1 + line * 0.9) * tw * uFade;
  gl_FragColor = vec4(col * 1.6, a);
}`;

const MOTE_V = `uniform float uTime; uniform float uPx; attribute vec4 aSeed; varying vec3 vC; varying float vA;
${PAL_GLSL}
float rad(float u){ return 5.5 - 3.2 * pow(u, 1.15) + sin(u * 16.) * 0.22; }
void main(){
  float u = fract(aSeed.x + uTime * aSeed.w * 0.018);
  float th = aSeed.y + u * 6.2831 * aSeed.z * 1.4;
  float r = rad(u) * (0.35 + 0.62 * fract(aSeed.y * 7.31));
  vec3 p = vec3(cos(th) * r, sin(th) * r, ${CAGE_END.toFixed(1)} - u * ${LEN.toFixed(1)});
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(uPx * (0.6 + aSeed.w) * (26. / max(-mv.z, 1.)), 30.);
  vC = pal(u);
  vA = smoothstep(0., .06, u) * (1. - smoothstep(.9, 1., u)) * smoothstep(2.5, 11., -mv.z);
}`;
const MOTE_F = `uniform float uFade; varying vec3 vC; varying float vA;
void main(){ float d = length(gl_PointCoord - .5) * 2.; float a = pow(max(1. - d, 0.), 2.2) * vA * uFade; gl_FragColor = vec4(mix(vC, vec3(1.), 0.45) * 1.7, a); }`;

function tubeGeometry(U, V) {
  const pos = [];
  const uv = [];
  for (let i = 0; i <= U; i++) {
    const u = i / U;
    const r = radius(u);
    for (let j = 0; j <= V; j++) {
      const v = j / V;
      const a = v * Math.PI * 2;
      pos.push(Math.cos(a) * r, Math.sin(a) * r, zAt(u));
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
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export default function Vortex({ touch }) {
  const shards = useRef();
  const group = useRef();
  const { shellGeo, shells, shardGeo, shardItems, shardMat, moteGeo, moteMat, glows } = useMemo(() => {
    const glows = [makeGlowMaterial(16, '#ff9fe6', 0, 3.4), makeGlowMaterial(5, '#ffffff', 0, 4.6)];
    const rnd = seeded(404);
    const mk = (scale, n1, n2, t1, t2, w, gain, spd) =>
      new THREE.ShaderMaterial({
        vertexShader: SHELL_V,
        fragmentShader: SHELL_F,
        uniforms: { uScale: { value: scale }, uTime: { value: 0 }, uN1: { value: n1 }, uN2: { value: n2 }, uT1: { value: t1 }, uT2: { value: t2 }, uW: { value: w }, uGain: { value: gain }, uSpd: { value: spd }, uFade: { value: 0 } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
    const shells = touch
      ? [mk(1.0, 20, 24, 7, 5, 0.02, 1.2, 0.05), mk(0.7, 14, 18, 5, 8, 0.024, 1.25, 0.07)]
      : [mk(1.0, 24, 28, 7, 5, 0.014, 1.15, 0.05), mk(0.78, 18, 22, 5, 8, 0.016, 1.25, 0.07), mk(0.56, 12, 15, 9, 4, 0.02, 1.3, 0.09)];
    const shellGeo = tubeGeometry(touch ? 70 : 110, touch ? 56 : 84);

    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.62, 0, -0.5, -0.31, 0, 0.5, -0.31, 0], 3));
    tri.setAttribute('aBary', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3));
    const n = touch ? 90 : 230;
    const items = [];
    const q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) {
      const u = rnd();
      const a = rnd() * Math.PI * 2;
      const r = radius(u) * (0.5 + rnd() * 0.46);
      const s = 0.28 + rnd() * 0.6;
      q.setFromEuler(new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28));
      items.push({ p: [Math.cos(a) * r, Math.sin(a) * r, zAt(u)], s: [s, s, s], q: q.clone() });
    }
    const shardMat = new THREE.ShaderMaterial({ vertexShader: SHARD_V, fragmentShader: SHARD_F, uniforms: { uTime: { value: 0 }, uFade: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

    const mn = touch ? 200 : 520;
    const seeds = [];
    for (let i = 0; i < mn; i++) seeds.push(rnd(), rnd() * Math.PI * 2, rnd() < 0.5 ? 1 : -1, 0.4 + rnd() * 0.9);
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(mn * 3), 3));
    moteGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 4));
    const moteMat = new THREE.ShaderMaterial({ vertexShader: MOTE_V, fragmentShader: MOTE_F, uniforms: { uTime: { value: 0 }, uPx: { value: touch ? 5 : 7 }, uFade: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    return { shellGeo, shells, shardGeo: tri, shardItems: items, shardMat, moteGeo, moteMat, glows };
  }, [touch]);

  useLayoutEffect(() => {
    fillMatrices(shards.current, shardItems);
  }, [shardItems]);

  useFrame((s) => {
    const z = s.camera.position.z;
    const fade = seg(z, CAGE_END + 40, CAGE_END + 12) * (1 - seg(z, ROOM_START + 10, ROOM_START - 2));
    const t = s.clock.elapsedTime;
    if (group.current) group.current.visible = fade > 0.001;
    shells.forEach((m) => {
      m.uniforms.uTime.value = t;
      m.uniforms.uFade.value = fade;
    });
    shardMat.uniforms.uTime.value = t;
    shardMat.uniforms.uFade.value = fade;
    moteMat.uniforms.uTime.value = t;
    moteMat.uniforms.uFade.value = fade;
    glows[0].uniforms.uGain.value = 0.9 * fade;
    glows[1].uniforms.uGain.value = 0.8 * fade;
  });

  return (
    <group ref={group}>
      {shells.map((m, i) => (
        <mesh key={i} geometry={shellGeo} material={m} frustumCulled={false} renderOrder={2 + i} />
      ))}
      <instancedMesh ref={shards} args={[shardGeo, shardMat, shardItems.length]} frustumCulled={false} renderOrder={6} />
      <points geometry={moteGeo} material={moteMat} frustumCulled={false} renderOrder={7} />
      <mesh geometry={quad} material={glows[0]} position={[0, 0, ROOM_START + 2]} frustumCulled={false} renderOrder={8} />
      <mesh geometry={quad} material={glows[1]} position={[0, 0, ROOM_START + 2]} frustumCulled={false} renderOrder={9} />
    </group>
  );
}
