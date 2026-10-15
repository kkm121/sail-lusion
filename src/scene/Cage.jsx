import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded } from '../lib/three-utils';
import { CAGE_END, Z0 } from '../lib/journey';
import { makeGlowMaterial, glowQuad, seg } from './shared';

// Chapter I, Build: a clean blueprint corridor. Thin light frames every few metres, long edges running into a warm glow,
// a floor grid, and bright pulses that travel down the lines. Everything is one line mesh and one shader.
const W = 6;
const END = CAGE_END + 10;
const STEP = 3.2;

const LINE_V = `attribute vec3 aC; varying vec3 vC; varying float vZ; varying float vW;
void main(){ vC = aC; vec4 mv = modelViewMatrix * vec4(position, 1.); vZ = -mv.z; vW = position.z; gl_Position = projectionMatrix * mv; }`;
const LINE_F = `uniform float uTime; varying vec3 vC; varying float vZ; varying float vW;
void main(){
  float near = smoothstep(0.4, 5., vZ);
  float far = exp(-vZ * 0.012);
  float pulse = pow(max(0., sin(vW * 0.085 - uTime * 0.9)), 16.);
  float a = near * (0.3 + 0.7 * far);
  gl_FragColor = vec4(vC * (0.6 + pulse * 2.4) * a, 1.);
}`;

function Corridor() {
  const { geo, mat } = useMemo(() => {
    const pos = [];
    const col = [];
    const seg = (a, b, c) => {
      pos.push(...a, ...b);
      col.push(...c, ...c);
    };
    const gold = [1, 0.78, 0.38];
    const white = [0.95, 0.95, 1];
    const teal = [0.2, 1, 0.85];
    let k = 0;
    for (let z = Z0 + 4; z > END; z -= STEP, k++) {
      const c = k % 6 === 0 ? teal : gold;
      const s = W;
      seg([-s, -s, z], [s, -s, z], c);
      seg([s, -s, z], [s, s, z], c);
      seg([s, s, z], [-s, s, z], c);
      seg([-s, s, z], [-s, -s, z], c);
      if (k % 2 === 0) {
        const i = W * 0.55;
        seg([-i, -i, z], [i, -i, z], white);
        seg([i, -i, z], [i, i, z], white);
        seg([i, i, z], [-i, i, z], white);
        seg([-i, i, z], [-i, -i, z], white);
      }
    }
    const zA = Z0 + 4;
    const long = [
      [-W, -W], [W, -W], [W, W], [-W, W], [0, -W], [0, W], [-W, 0], [W, 0],
    ];
    long.forEach(([x, y], i) => seg([x, y, zA], [x, y, END], i < 4 ? gold : white));
    for (let i = -3; i <= 3; i++) {
      seg([(i * W) / 3, -W, zA], [(i * W) / 3, -W, END], teal);
      seg([-W, (i * W) / 3, zA], [-W, (i * W) / 3, END], gold);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aC', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.ShaderMaterial({ vertexShader: LINE_V, fragmentShader: LINE_F, uniforms: { uTime: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    return { geo: g, mat: m };
  }, []);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} renderOrder={3} />;
}

const DUST_V = `uniform float uTime; uniform float uPx; attribute vec4 aS; varying float vA;
void main(){
  float t = uTime * (0.2 + aS.w * 0.4);
  vec3 p = position;
  p.x += sin(t + aS.x * 6.28) * 0.6;
  p.y += cos(t * 0.8 + aS.y * 6.28) * 0.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(uPx * (0.5 + aS.w) * (18. / max(-mv.z, 1.)), 20.);
  vA = (0.35 + 0.65 * sin(uTime * 1.2 + aS.x * 12.)) * smoothstep(1.5, 8., -mv.z);
}`;
const DUST_F = `varying float vA; void main(){ float d = length(gl_PointCoord - .5) * 2.; float a = pow(max(1. - d, 0.), 2.2) * vA; gl_FragColor = vec4(vec3(1., .85, .5) * 1.4, a); }`;

function Dust({ touch }) {
  const geo = useMemo(() => {
    const rnd = seeded(77);
    const n = touch ? 60 : 130;
    const pos = new Float32Array(n * 3);
    const s = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos.set([(rnd() * 2 - 1) * W * 0.9, (rnd() * 2 - 1) * W * 0.9, 2 - rnd() * (Math.abs(END) + 4)], i * 3);
      s.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.BufferAttribute(s, 4));
    return g;
  }, [touch]);
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: DUST_V, fragmentShader: DUST_F, uniforms: { uTime: { value: 0 }, uPx: { value: touch ? 4 : 5.5 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), [touch]);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

export default function Cage({ touch }) {
  const glows = useMemo(() => [makeGlowMaterial(30, '#ffc94d', 1.2, 3.2), makeGlowMaterial(14, '#fff1c9', 1.3, 4)], []);
  // The end glow fades out as the camera nears it, so the tunnel never whites out on the way through.
  useFrame((s) => {
    const d = s.camera.position.z - (END - 2);
    const k = seg(d, 4, 38);
    glows[0].uniforms.uGain.value = 0.9 * k;
    glows[1].uniforms.uGain.value = 0.9 * k;
  });
  return (
    <>
      <Corridor />
      <Dust touch={touch} />
      <mesh geometry={glowQuad} material={glows[0]} position={[0, 0, END - 2]} renderOrder={2} frustumCulled={false} />
      <mesh geometry={glowQuad} material={glows[1]} position={[0, 0, END - 1.9]} renderOrder={2} frustumCulled={false} />
    </>
  );
}
