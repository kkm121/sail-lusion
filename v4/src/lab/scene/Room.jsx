import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded } from '../three-utils';
import { ROOM_END, ROOM_START } from '../journey';
import { fillMatrices, paintInstances, seg, labState } from './shared';

const H = 4.3;
const LEN = ROOM_START - ROOM_END + 6;
const CZ = ROOM_START - LEN / 2;
const DECAL = ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#eafcff', '#ff5a1f', '#ff7bbd', '#ffd66b'];

const HULL_V = `varying vec3 vP; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const HULL_F = `uniform vec3 uA; uniform vec3 uFog; varying vec3 vP;
void main(){
  float y = vP.y / ${H.toFixed(1)};
  vec3 base = mix(uA * 0.5, uA * 1.18, smoothstep(-1., 1., y));
  base += vec3(0.1, 0.14, 0.5) * smoothstep(0.2, 1., abs(vP.x) / ${H.toFixed(1)}) * 0.35;
  float d = length(vP - cameraPosition);
  base = mix(base, uFog, smoothstep(34., 84., d));
  gl_FragColor = vec4(base, 1.);
}`;

export default function Room({ touch }) {
  const circles = useRef();
  const rings = useRef();
  const frames = useRef();
  const fills = useRef();
  const bars = useRef();
  const bezel = useRef();
  const data = useMemo(() => {
    const rnd = seeded(505);
    const circ = [];
    const ring = [];
    const n = touch ? 46 : 84;
    for (let i = 0; i < n; i++) {
      const wall = Math.floor(rnd() * 4);
      const z = ROOM_START - 4 - rnd() * (LEN - 12);
      const big = rnd() < 0.2;
      const r = big ? 0.9 + rnd() * 0.9 : 0.3 + rnd() * 0.55;
      const u = (rnd() * 2 - 1) * (H - r * 1.2);
      const isRing = rnd() < 0.3;
      const c = DECAL[Math.floor(rnd() * DECAL.length)];
      const it = { s: [r, r, 1], c };
      if (wall === 0) Object.assign(it, { p: [u, -H + 0.02, z], r: [-Math.PI / 2, 0, 0] });
      else if (wall === 1) Object.assign(it, { p: [u, H - 0.02, z], r: [Math.PI / 2, 0, 0] });
      else if (wall === 2) Object.assign(it, { p: [-H + 0.02, u, z], r: [0, Math.PI / 2, 0] });
      else Object.assign(it, { p: [H - 0.02, u, z], r: [0, -Math.PI / 2, 0] });
      (isRing ? ring : circ).push(it);
    }
    const arch = [];
    for (let i = 0; ROOM_START - 14 - i * 11 > ROOM_END + 2; i++) {
      const z = ROOM_START - 9 - i * 11;
      arch.push({ p: [-H + 0.03, -H + 1.7, z], s: [1.7, 3.4, 1], r: [0, Math.PI / 2, 0], c: '#ffffff' });
      arch.push({ p: [H - 0.03, -H + 1.7, z - 5.5], s: [1.7, 3.4, 1], r: [0, -Math.PI / 2, 0], c: '#d9f6ff' });
    }
    const bar = [];
    for (let k = 0; k < 7; k++) {
      const z = ROOM_START - 3 - k * 9.5;
      bar.push({ p: [0, H - 0.05, z], s: [2.6, 0.04, 0.5], c: '#ffffff' });
      bar.push({ p: [0, -H + 0.05, z - 4.7], s: [2.6, 0.04, 0.5], c: '#cfe8ff' });
    }
    const zf = ROOM_END - 2;
    const o = H + 0.55;
    const bz = [
      { p: [0, o, zf], s: [o * 2 + 0.6, 0.9, 0.9], c: '#05060b' },
      { p: [0, -o, zf], s: [o * 2 + 0.6, 0.9, 0.9], c: '#05060b' },
      { p: [-o, 0, zf], s: [0.9, o * 2 + 0.6, 0.9], c: '#05060b' },
      { p: [o, 0, zf], s: [0.9, o * 2 + 0.6, 0.9], c: '#05060b' },
    ];
    return { circ, ring, arch, bar, bz };
  }, [touch]);
  const frameGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.5, -0.5);
    s.lineTo(0.5, -0.5);
    s.lineTo(0.5, 0.2);
    s.absarc(0, 0.2, 0.5, 0, Math.PI, false);
    s.lineTo(-0.5, -0.5);
    const hole = new THREE.Path();
    hole.moveTo(-0.43, -0.5);
    hole.lineTo(-0.43, 0.2);
    hole.absarc(0, 0.2, 0.43, Math.PI, 0, true);
    hole.lineTo(0.43, -0.5);
    hole.lineTo(-0.43, -0.5);
    s.holes.push(hole);
    return new THREE.ShapeGeometry(s, 20);
  }, []);
  const fillGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.43, -0.5);
    s.lineTo(0.43, -0.5);
    s.lineTo(0.43, 0.2);
    s.absarc(0, 0.2, 0.43, 0, Math.PI, false);
    s.lineTo(-0.43, -0.5);
    return new THREE.ShapeGeometry(s, 20);
  }, []);
  const hull = useMemo(() => {
    const g = new THREE.BoxGeometry(H * 2, H * 2, LEN);
    g.setIndex(Array.from(g.index.array).slice(0, 24));
    g.clearGroups();
    return g;
  }, []);
  const hullMat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: HULL_V, fragmentShader: HULL_F, uniforms: { uA: { value: new THREE.Color('#3a24ff') }, uFog: { value: new THREE.Color('#2a0a1e') } }, side: THREE.BackSide }), []);
  useLayoutEffect(() => {
    fillMatrices(circles.current, data.circ);
    paintInstances(circles.current, data.circ, 'c', 0.9);
    fillMatrices(rings.current, data.ring);
    paintInstances(rings.current, data.ring, 'c', 1);
    fillMatrices(frames.current, data.arch);
    paintInstances(frames.current, data.arch, 'c', 1.2);
    fillMatrices(fills.current, data.arch);
    paintInstances(fills.current, data.arch, 'c', 0.35);
    fillMatrices(bars.current, data.bar);
    paintInstances(bars.current, data.bar, 'c', 2.4);
    fillMatrices(bezel.current, data.bz);
    paintInstances(bezel.current, data.bz, 'c', 1);
  }, [data]);
  const shown = useRef();
  useFrame((s) => {
    if (shown.current) shown.current.visible = labState.warm || (s.camera.position.z < ROOM_START + 12 && s.camera.position.z > ROOM_END - 16);
    hullMat.uniforms.uA.value.set('#3a24ff').multiplyScalar(0.55 + 0.45 * seg(s.camera.position.z, ROOM_START + 4, ROOM_START - 16));
  });
  return (
    <group ref={shown}>
      <mesh position={[0, 0, CZ]} geometry={hull} material={hullMat} frustumCulled={false} />
      <instancedMesh ref={circles} args={[undefined, undefined, data.circ.length]} frustumCulled={false}>
        <circleGeometry args={[1, 36]} />
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={rings} args={[undefined, undefined, data.ring.length]} frustumCulled={false}>
        <ringGeometry args={[0.78, 1, 40]} />
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={fills} args={[fillGeo, undefined, data.arch.length]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={frames} args={[frameGeo, undefined, data.arch.length]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={bars} args={[undefined, undefined, data.bar.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={bezel} args={[undefined, undefined, data.bz.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
