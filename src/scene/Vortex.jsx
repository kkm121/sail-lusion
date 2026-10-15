import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded } from '../lib/three-utils';
import { CAGE_END, ROOM_START } from '../lib/journey';
import { makeGlowMaterial, glowQuad, seg } from './shared';

// Chapter II, Discover: a twisting wire tunnel. Rings narrow toward the far end while long strands spiral around them,
// colour runs from violet to magenta to teal, and light pulses race along the strands.
const LEN = CAGE_END - ROOM_START;
const RINGS = 30;
const STRANDS = 28;
const radius = (u) => 5.6 - 2.6 * u + Math.sin(u * 14) * 0.25;
const zAt = (u) => CAGE_END - u * LEN;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const palette = (u) => (u < 0.5 ? mix([0.55, 0.35, 1], [1, 0.3, 0.75], u * 2) : mix([1, 0.3, 0.75], [0.2, 1, 0.9], (u - 0.5) * 2));

const V = `uniform float uTime; attribute vec3 aC; varying vec3 vC; varying float vZ; varying float vW;
void main(){
  vC = aC;
  vec3 p = position;
  float a = uTime * 0.08 + p.z * 0.014;
  float c = cos(a), s = sin(a);
  p.xy = mat2(c, -s, s, c) * p.xy;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  vZ = -mv.z; vW = position.z;
  gl_Position = projectionMatrix * mv;
}`;
const F = `uniform float uTime; uniform float uFade; varying vec3 vC; varying float vZ; varying float vW;
void main(){
  float near = smoothstep(0.4, 5., vZ);
  float far = exp(-vZ * 0.01);
  float pulse = pow(max(0., sin(vW * 0.12 - uTime * 1.1)), 18.);
  float a = near * (0.2 + 0.5 * far) * uFade * 0.55;
  gl_FragColor = vec4(vC * (0.65 + pulse * 2.6) * a, 1.);
}`;

export default function Vortex({ touch }) {
  const group = useRef();
  const { geo, mat, glows } = useMemo(() => {
    const pos = [];
    const col = [];
    const line = (a, b, c1, c2) => {
      pos.push(...a, ...b);
      col.push(...c1, ...c2);
    };
    const seq = 96;
    for (let r = 0; r <= RINGS; r++) {
      const u = r / RINGS;
      const R = radius(u);
      const c = palette(u);
      for (let i = 0; i < seq; i++) {
        const a0 = (i / seq) * Math.PI * 2;
        const a1 = ((i + 1) / seq) * Math.PI * 2;
        line([Math.cos(a0) * R, Math.sin(a0) * R, zAt(u)], [Math.cos(a1) * R, Math.sin(a1) * R, zAt(u)], c, c);
      }
    }
    const steps = 60;
    const n = touch ? 18 : STRANDS;
    for (let s = 0; s < n; s++) {
      const a0 = (s / n) * Math.PI * 2;
      for (let k = 0; k < steps; k++) {
        const u0 = k / steps;
        const u1 = (k + 1) / steps;
        const t0 = a0 + u0 * 2.4;
        const t1 = a0 + u1 * 2.4;
        line([Math.cos(t0) * radius(u0), Math.sin(t0) * radius(u0), zAt(u0)], [Math.cos(t1) * radius(u1), Math.sin(t1) * radius(u1), zAt(u1)], palette(u0), palette(u1));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aC', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.ShaderMaterial({ vertexShader: V, fragmentShader: F, uniforms: { uTime: { value: 0 }, uFade: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    return { geo: g, mat: m, glows: [makeGlowMaterial(20, '#b48cff', 1, 3.2), makeGlowMaterial(9, '#ffffff', 1, 4.4)] };
  }, [touch]);

  useFrame((s) => {
    const z = s.camera.position.z;
    const fade = seg(z, CAGE_END + 40, CAGE_END + 12) * (1 - seg(z, ROOM_START + 10, ROOM_START - 2));
    if (group.current) group.current.visible = fade > 0.001;
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uFade.value = fade;
    glows[0].uniforms.uGain.value = 0.3 * fade;
    glows[1].uniforms.uGain.value = 0.18 * fade;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={geo} material={mat} frustumCulled={false} renderOrder={3} />
      <mesh geometry={glowQuad} material={glows[0]} position={[0, 0, ROOM_START + 2]} frustumCulled={false} renderOrder={8} />
      <mesh geometry={glowQuad} material={glows[1]} position={[0, 0, ROOM_START + 2]} frustumCulled={false} renderOrder={9} />
    </group>
  );
}
