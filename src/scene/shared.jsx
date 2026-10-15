import { useMemo } from 'react';
import * as THREE from 'three';

export const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const m4 = new THREE.Matrix4();
const q4 = new THREE.Quaternion();
const e4 = new THREE.Euler();
const v3p = new THREE.Vector3();
const v3s = new THREE.Vector3();

export function fillMatrices(mesh, items) {
  items.forEach((it, i) => {
    if (it.q) q4.copy(it.q);
    else q4.setFromEuler(e4.set(it.r?.[0] || 0, it.r?.[1] || 0, it.r?.[2] || 0));
    m4.compose(v3p.set(...it.p), q4, v3s.set(...it.s));
    mesh.setMatrixAt(i, m4);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

export function paintInstances(mesh, items, key = 'c', gain = 1) {
  const c = new THREE.Color();
  items.forEach((it, i) => mesh.setColorAt(i, c.set(it[key]).multiplyScalar(gain)));
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

const GLOW_V = `varying vec2 vUv; uniform float uSize;
void main(){
  vUv = uv;
  vec4 c = modelViewMatrix * vec4(0., 0., 0., 1.);
  c.xy += position.xy * uSize;
  gl_Position = projectionMatrix * c;
}`;

const GLOW_F = `varying vec2 vUv; uniform vec3 uColor; uniform float uGain; uniform float uFall;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  float r = length(vUv - .5) * 2.;
  float g = exp(-r * uFall) * (1. - smoothstep(0.78, 1., r));
  vec3 col = uColor * g * uGain;
  col += (hash(gl_FragCoord.xy) - .5) * 0.03 * step(0.002, g);
  gl_FragColor = vec4(max(col, 0.), 1.);
}`;

export function makeGlowMaterial(size, color, gain, fall = 3.4) {
  return new THREE.ShaderMaterial({
    vertexShader: GLOW_V,
    fragmentShader: GLOW_F,
    uniforms: { uSize: { value: size }, uColor: { value: new THREE.Color(color) }, uGain: { value: gain }, uFall: { value: fall } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

const quad = new THREE.PlaneGeometry(1, 1);

export function SoftGlow({ position, size, color, gain = 1, fall = 3.4, order = 2 }) {
  const mat = useMemo(() => makeGlowMaterial(size, color, gain, fall), [size, color, gain, fall]);
  return <mesh geometry={quad} material={mat} position={position} frustumCulled={false} renderOrder={order} />;
}

export const PAL_GLSL = `
vec3 pal(float t){
  vec3 a = vec3(0.0, 0.96, 0.83), b = vec3(0.22, 0.74, 0.97), c = vec3(0.49, 0.36, 1.0), d = vec3(0.86, 0.3, 0.95), e = vec3(0.98, 0.78, 0.3);
  t = clamp(t, 0., 1.) * 4.;
  return t < 1. ? mix(a, b, t) : t < 2. ? mix(b, c, t - 1.) : t < 3. ? mix(c, d, t - 2.) : mix(d, e, t - 3.);
}`;
