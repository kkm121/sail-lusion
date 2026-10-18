import { useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { seeded } from '../lib/three-utils';
import { CAGE_END, Z0 } from '../lib/journey';
import { fillMatrices, glowQuad, makeGlowMaterial, paintInstances, seg } from './shared';
import { asset } from '../data/media';

// Chapter I, Build: a golden corridor of thick, bevelled metal frames. Real brushed metal (ambientCG, CC0) lit by a
// studio HDRI (Poly Haven, CC0), a polished dark floor, soft light shafts, drifting dust and a warm light at the end.
const W = 6.2;
const END = CAGE_END + 10;
const STEP = 6.5;
const T = 0.34;
const GOLD = '#ffc964';
const BRASS = '#d9a24a';
const SILVER = '#e6d6b8';

function Frames() {
  const mesh = useRef();
  const tex = useTexture({
    map: asset('/env/metal-color.jpg'),
    normalMap: asset('/env/metal-normal.jpg'),
    roughnessMap: asset('/env/metal-rough.jpg')
  });
  const material = useMemo(() => {
    Object.values(tex).forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1, 3);
      t.anisotropy = 8;
    });
    tex.map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ ...tex, color: '#ffffff', metalness: 1, roughness: 0.34, envMapIntensity: 1.9, normalScale: new THREE.Vector2(0.5, 0.5) });
    // useTexture hands back a new object each render; the textures inside stay the same, so key on them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex.map, tex.normalMap, tex.roughnessMap]);
  const geo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 3, 0.12), []);
  const items = useMemo(() => {
    const out = [];
    let k = 0;
    for (let z = Z0 + 1; z > END; z -= STEP, k++) {
      const c = k % 3 === 0 ? SILVER : k % 2 ? GOLD : BRASS;
      out.push({ p: [0, W, z], s: [2 * W + T, T, T], c });
      out.push({ p: [0, -W, z], s: [2 * W + T, T, T], c });
      out.push({ p: [-W, 0, z], s: [T, 2 * W, T], c });
      out.push({ p: [W, 0, z], s: [T, 2 * W, T], c });
      if (k % 2 === 0) {
        // inner brackets in the corners give each frame some engineering detail
        const b = 1.3;
        out.push({ p: [-W + b / 2, W - b / 2, z], s: [b * 1.4, T * 0.5, T * 0.5], r: [0, 0, -Math.PI / 4], c });
        out.push({ p: [W - b / 2, W - b / 2, z], s: [b * 1.4, T * 0.5, T * 0.5], r: [0, 0, Math.PI / 4], c });
        out.push({ p: [-W + b / 2, -W + b / 2, z], s: [b * 1.4, T * 0.5, T * 0.5], r: [0, 0, Math.PI / 4], c });
        out.push({ p: [W - b / 2, -W + b / 2, z], s: [b * 1.4, T * 0.5, T * 0.5], r: [0, 0, -Math.PI / 4], c });
      }
    }
    const len = Z0 + 1 - END;
    const mid = (Z0 + 1 + END) / 2;
    [[-W, W], [W, W], [-W, -W], [W, -W]].forEach(([x, y]) => out.push({ p: [x, y, mid], s: [T * 0.8, T * 0.8, len], c: GOLD }));
    return out;
  }, []);
  useLayoutEffect(() => {
    fillMatrices(mesh.current, items);
    paintInstances(mesh.current, items);
    mesh.current.material.needsUpdate = true;
  }, [items, material, geo]);
  return <instancedMesh ref={mesh} args={[geo, material, items.length]} frustumCulled={false} />;
}

// Gold light strips inlaid just inside every frame. They glow through the bloom and a slow pulse runs down the corridor.
const STRIP_V = `uniform float uTime; varying float vK;
void main(){
  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
  float z = (modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.)).z;
  vK = .55 + .45 * pow(max(0., sin(z * .11 + uTime * 1.2)), 6.);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const STRIP_F = `varying float vK; void main(){ gl_FragColor = vec4(vec3(1., .74, .32) * 2.4 * vK, 1.); }`;

function Strips() {
  const mesh = useRef();
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: STRIP_V, fragmentShader: STRIP_F, uniforms: { uTime: { value: 0 } }, toneMapped: false }), []);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const items = useMemo(() => {
    const out = [];
    const i = W - T * 0.85;
    const t = 0.05;
    for (let z = Z0 + 1; z > END; z -= STEP) {
      const zz = z - T * 0.55;
      out.push({ p: [0, i, zz], s: [2 * i, t, t] });
      out.push({ p: [0, -i, zz], s: [2 * i, t, t] });
      out.push({ p: [-i, 0, zz], s: [t, 2 * i, t] });
      out.push({ p: [i, 0, zz], s: [t, 2 * i, t] });
    }
    return out;
  }, []);
  useLayoutEffect(() => fillMatrices(mesh.current, items), [items, mat, geo]);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return <instancedMesh ref={mesh} args={[geo, mat, items.length]} frustumCulled={false} />;
}

const WALL_V = 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = cameraPosition - w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
const WALL_F = `uniform float uTime; varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){
  vec3 V = normalize(vV);
  float fr = pow(1. - abs(dot(normalize(vN), V)), 3.);
  float d = length(vV);
  float glow = exp(-abs(vW.z - (${(END - 2).toFixed(1)})) * 0.025);
  float band = smoothstep(.97, 1., sin(vW.z * 0.48 + uTime * .4)) * .25;
  vec3 col = vec3(.006, .0045, .0025) + vec3(1., .74, .35) * (fr * .1 + glow * .035 + band * fr);
  float a = (.78 + .2 * fr) * smoothstep(1., 4., d);
  gl_FragColor = vec4(col, a);
}`;

// Smoked glass walls and ceiling: dark, with a gold sheen at grazing angles and toward the light at the end.
function Walls() {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: WALL_V, fragmentShader: WALL_F, uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide }), []);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  const len = Z0 + 1 - END;
  const mid = (Z0 + 1 + END) / 2;
  return (
    <>
      <mesh material={mat} position={[-W - 0.05, 0, mid]} rotation={[0, Math.PI / 2, 0]} renderOrder={1}>
        <planeGeometry args={[len, 2 * W]} />
      </mesh>
      <mesh material={mat} position={[W + 0.05, 0, mid]} rotation={[0, -Math.PI / 2, 0]} renderOrder={1}>
        <planeGeometry args={[len, 2 * W]} />
      </mesh>
      <mesh material={mat} position={[0, W + 0.05, mid]} rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[2 * W, len]} />
      </mesh>
    </>
  );
}

const FLOOR_F = `uniform float uTime; varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){
  vec3 V = normalize(vV);
  float fr = pow(1. - abs(dot(normalize(vN), V)), 4.);
  // a polished dark floor: a soft gold streak reflects the light at the end, and each frame leaves a faint line
  float streak = exp(-pow(vW.x / 1.6, 2.)) * exp(-abs(vW.z - (${(END - 2).toFixed(1)})) * 0.03);
  float lines = smoothstep(.985, 1., cos((vW.z - ${(Z0 + 1).toFixed(1)}) * 6.2831 / ${STEP.toFixed(1)})) * .35;
  vec3 col = vec3(.006, .005, .003) + vec3(1., .72, .32) * (streak * .55 + fr * .08 + lines * (.3 + streak));
  gl_FragColor = vec4(col, 1.);
}`;

function Floor() {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: WALL_V, fragmentShader: FLOOR_F, uniforms: { uTime: { value: 0 } } }), []);
  const len = Z0 + 1 - END;
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -W + 0.2, (Z0 + 1 + END) / 2]}>
      <planeGeometry args={[2 * W, len]} />
    </mesh>
  );
}

const SHAFT_V = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const SHAFT_F = `uniform float uTime; uniform float uGain; varying vec2 vUv;
void main(){
  float x = abs(vUv.x - .5) * 2.;
  float edge = pow(1. - x, 2.2);
  float fall = pow(vUv.y, 1.6);
  float flick = .85 + .15 * sin(uTime * .7 + vUv.y * 4.);
  gl_FragColor = vec4(vec3(1., .8, .45) * edge * fall * flick * uGain, 1.);
}`;

function Shafts() {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: SHAFT_V, fragmentShader: SHAFT_F, uniforms: { uTime: { value: 0 }, uGain: { value: 0.16 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), []);
  const shafts = useMemo(() => {
    const rnd = seeded(12);
    return Array.from({ length: 9 }, (_, i) => ({ x: (rnd() - 0.5) * W * 1.2, z: -6 - i * 12 - rnd() * 4, rz: (rnd() - 0.5) * 0.35, w: 1.2 + rnd() * 1.6 }));
  }, []);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return shafts.map((sh, i) => (
    <mesh key={i} material={mat} position={[sh.x, 0, sh.z]} rotation={[0, 0, sh.rz]} renderOrder={3}>
      <planeGeometry args={[sh.w, 2 * W]} />
    </mesh>
  ));
}

const DUST_V = `uniform float uTime; attribute vec4 aS; varying float vA;
void main(){
  float t = uTime * (0.15 + aS.w * 0.3);
  vec3 p = position;
  p.x += sin(t + aS.x * 6.28) * 0.6;
  p.y += cos(t * 0.8 + aS.y * 6.28) * 0.5 + sin(t * .3) * .3;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min((3. + aS.w * 5.) * (16. / max(-mv.z, 1.)), 18.);
  vA = (0.3 + 0.7 * sin(uTime * 1.1 + aS.x * 12.) * sin(uTime * 1.1 + aS.x * 12.)) * smoothstep(1.5, 7., -mv.z) * (1. - smoothstep(40., 80., -mv.z));
}`;
const DUST_F = `varying float vA; void main(){ float d = length(gl_PointCoord - .5) * 2.; float a = pow(max(1. - d, 0.), 2.5) * vA; gl_FragColor = vec4(vec3(1., .86, .55) * 1.3, a); }`;

function Dust({ touch }) {
  const geo = useMemo(() => {
    const rnd = seeded(77);
    const n = touch ? 70 : 160;
    const pos = new Float32Array(n * 3);
    const s = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos.set([(rnd() * 2 - 1) * W * 0.85, (rnd() * 2 - 1) * W * 0.85, 2 - rnd() * (Math.abs(END) + 4)], i * 3);
      s.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.BufferAttribute(s, 4));
    return g;
  }, [touch]);
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: DUST_V, fragmentShader: DUST_F, uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={4} />;
}

// A warm key light rides just ahead of the camera, so the frames catch a moving highlight as you pass them.
// Lights live at the scene root (portal) and fade by intensity. Hiding them with their chapter would change the
// number of lights, and three.js recompiles every lit shader whenever that number changes (the loader and scroll freezes).
function Lights() {
  const key = useRef();
  const fill = useRef();
  const end = useRef();
  const { scene } = useThree();
  useFrame((s) => {
    const z = s.camera.position.z;
    const k = seg(z, CAGE_END - 8, CAGE_END + 6);
    if (key.current) {
      key.current.position.set(Math.sin(z * 0.05) * 3, 3.5, z - 9);
      key.current.intensity = 34 * k;
    }
    if (fill.current) {
      fill.current.position.set(-Math.sin(z * 0.04) * 3, -3, z - 16);
      fill.current.intensity = 16 * k;
    }
    if (end.current) end.current.intensity = 180 * k;
  });
  return createPortal(
    <>
      <pointLight ref={key} intensity={34} distance={24} decay={2} color="#ffd38a" />
      <pointLight ref={fill} intensity={16} distance={20} decay={2} color="#ffb35c" />
      <pointLight ref={end} position={[0, 0, END - 2]} intensity={180} distance={70} decay={2} color="#ffc35a" />
    </>,
    scene
  );
}

export default function Cage({ touch }) {
  const glows = useMemo(() => [makeGlowMaterial(30, '#ffc35a', 1, 3.2), makeGlowMaterial(12, '#fff1c9', 1, 4.2)], []);
  // The end glow dims as the camera reaches it, so the corridor never washes out to white.
  useFrame((s) => {
    const k = seg(s.camera.position.z - (END - 2), 4, 40);
    glows[0].uniforms.uGain.value = 1.0 * k;
    glows[1].uniforms.uGain.value = 0.9 * k;
  });
  return (
    <>
      <Lights />
      <Frames />
      <Strips />
      <Floor />
      <Walls />
      <Shafts />
      <Dust touch={touch} />
      <mesh geometry={glowQuad} material={glows[0]} position={[0, 0, END - 2]} renderOrder={2} frustumCulled={false} />
      <mesh geometry={glowQuad} material={glows[1]} position={[0, 0, END - 1.9]} renderOrder={2} frustumCulled={false} />
    </>
  );
}
