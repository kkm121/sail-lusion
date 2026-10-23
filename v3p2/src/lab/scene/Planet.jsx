import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { glowQuad, makeGlowMaterial, seg, labState } from './shared';
import { asset } from '../media';

const R = 22;
const SUN = new THREE.Vector3(-0.86, 0.22, -0.46).normalize();

// v3p2: the real Earth. NASA Blue Marble imagery (public domain, via three.js's examples): a colour map and a packed map
// with the ocean mask (R), clouds (G) and city lights (B). Cheaper than the old per-pixel noise, and real continents.
const SURF_V = `varying vec2 vUv; varying vec3 vWN; varying vec3 vW;
void main(){ vUv = uv; vWN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SURF_F = `uniform sampler2D tDay; uniform sampler2D tData; uniform float uTime; uniform vec3 uSun; uniform float uFade;
varying vec2 vUv; varying vec3 vWN; varying vec3 vW;
void main(){
  vec3 N = normalize(vWN);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(N, uSun);
  float day = smoothstep(-0.14, 0.34, ndl);
  vec3 albedo = texture2D(tDay, vUv).rgb;
  vec4 d = texture2D(tData, vUv);
  float ocean = d.r;
  float cloud = texture2D(tData, vUv + vec2(uTime * 0.0004, 0.0)).g;
  vec3 base = mix(albedo * 1.2, vec3(0.86, 0.9, 0.96), cloud * 0.8);
  vec3 col = base * (0.015 + day * 1.0);
  // the thin blue rim of air around the limb, brighter on the day side
  float fr = pow(1.0 - max(dot(N, V), 0.0), 3.2);
  col += vec3(0.14, 0.45, 1.0) * fr * (0.08 + day * 0.55);
  // sunlight glinting off the oceans
  vec3 H = normalize(uSun + V);
  col += vec3(1.0, 0.9, 0.75) * pow(max(dot(N, H), 0.0), 90.0) * ocean * (1.0 - cloud) * day * 1.4;
  // cities on the night side, dimmed under cloud
  float night = 1.0 - smoothstep(-0.2, 0.12, ndl);
  col += vec3(1.0, 0.68, 0.32) * d.b * night * (1.0 - cloud * 0.75) * 0.9;
  gl_FragColor = vec4(col * uFade, 1.0);
}`;

// turn the globe so a given place faces the camera's line of sight (the camera looks down at the planet's top at ~60°)
function facing(latDeg, lonDeg) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const phi = ((lonDeg + 180) / 360) * Math.PI * 2;
  const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2 - phi);
  const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), lat - THREE.MathUtils.degToRad(60));
  return qx.multiply(qy);
}
// aimed south of Chennai: the camera grazes the planet, so the visible band is well north of the aimed point
const CHENNAI = facing(-14, 84);

const ATMO_V = `varying vec3 vN; varying vec3 vWN; void main(){ vN = normalize(normalMatrix * normal); vWN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const ATMO_F = `uniform vec3 uSun; uniform float uFade; varying vec3 vN; varying vec3 vWN;
void main(){
  float i = pow(max(0.62 - dot(vN, vec3(0.0, 0.0, 1.0)), 0.0), 2.7);
  float sunk = max(dot(normalize(vWN), uSun), 0.0);
  float day = smoothstep(-0.3, 0.55, dot(normalize(vWN), uSun));
  vec3 col = mix(vec3(0.03, 0.28, 1.0), vec3(0.45, 0.88, 1.0), clamp(i * 1.4, 0.0, 1.0));
  col = mix(col, vec3(1.0, 0.74, 0.42), pow(sunk, 7.0) * 0.65);
  gl_FragColor = vec4(col * i * (0.2 + day * 0.85) * uFade, 1.0);
}`;

const STREAK_V = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const STREAK_F = `uniform float uFade; varying vec2 vUv;
void main(){
  float x = abs(vUv.x - 0.5) * 2.0;
  float y = abs(vUv.y - 0.5) * 2.0;
  float a = pow(1.0 - x, 2.4) * exp(-y * 18.0);
  gl_FragColor = vec4(vec3(0.6, 0.85, 1.0) * a * 1.4 * uFade, 1.0);
}`;

const FLY_V = `uniform float uTime; uniform float uFade; attribute vec4 aS; varying float vA;
void main(){
  float t = uTime * (0.08 + aS.w * 0.12);
  vec3 p = position;
  p.x += sin(t * 2. + aS.x * 6.28) * 0.8 + cos(t + aS.y * 6.28) * 0.4;
  p.y += cos(t * 1.7 + aS.y * 6.28) * 0.5 + sin(t * 0.6 + aS.z * 6.28) * 0.3;
  p.z += sin(t * 1.2 + aS.z * 6.28) * 0.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (14. + aS.w * 26.) * (7. / max(-mv.z, 1.));
  float blink = pow(0.5 + 0.5 * sin(uTime * (0.7 + aS.x * 1.3) + aS.y * 40.), 3.);
  vA = (0.25 + 0.75 * blink) * uFade;
}`;
const FLY_F = `varying float vA; void main(){ float d = length(gl_PointCoord - .5) * 2.; float a = pow(max(1. - d, 0.), 2.4) * vA; gl_FragColor = vec4(vec3(1., .86, .45) * 1.5, a); }`;

function Fireflies({ fade }) {
  const { geo, mat } = useMemo(() => {
    const n = 70;
    const pos = new Float32Array(n * 3);
    const s = new Float32Array(n * 4);
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      pos.set([(r() - 0.5) * 16, -1.5 + r() * 6, -1 - r() * 11], i * 3);
      s.set([r(), r(), r(), r()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.BufferAttribute(s, 4));
    const m = new THREE.ShaderMaterial({ vertexShader: FLY_V, fragmentShader: FLY_F, uniforms: { uTime: { value: 0 }, uFade: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    return { geo: g, mat: m };
  }, []);
  useFrame((st) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime;
    mat.uniforms.uFade.value = fade.current;
  });
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={7} />;
}

export default function Planet({ sp, hi = true }) {
  const fly = useRef(1);
  const group = useRef();
  const body = useRef();
  const mats = useMemo(
    () => ({
      surf: (() => {
        const load = new THREE.TextureLoader();
        let n = 0;
        const done = () => ++n === 2 && (labState.earth = true);
        const size = hi ? 2048 : 1024;
        const tDay = load.load(asset(`/env/earth-day-${size}.jpg`), done, undefined, done);
        tDay.colorSpace = THREE.SRGBColorSpace;
        const tData = load.load(asset(`/env/earth-data-${size}.jpg`), done, undefined, done);
        for (const t of [tDay, tData]) {
          t.anisotropy = 8;
          t.wrapS = THREE.RepeatWrapping;
        }
        return new THREE.ShaderMaterial({ vertexShader: SURF_V, fragmentShader: SURF_F, uniforms: { tDay: { value: tDay }, tData: { value: tData }, uTime: { value: 0 }, uSun: { value: SUN }, uFade: { value: 1 } } });
      })(),
      atmo: new THREE.ShaderMaterial({ vertexShader: ATMO_V, fragmentShader: ATMO_F, uniforms: { uSun: { value: SUN }, uFade: { value: 1 } }, side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
      glowA: makeGlowMaterial(16, '#ffd9a6', 1.5, 3.1),
      glowB: makeGlowMaterial(5, '#ffffff', 1.4, 5),
      streak: new THREE.ShaderMaterial({ vertexShader: STREAK_V, fragmentShader: STREAK_F, uniforms: { uFade: { value: 1 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    }),
    [hi]
  );
  useEffect(
    () => () => {
      mats.surf.uniforms.tDay.value.dispose();
      mats.surf.uniforms.tData.value.dispose();
    },
    [mats]
  );
  useFrame((s, dt) => {
    const p = sp.current;
    const fade = 1 - seg(p, 0.3, 0.4);
    const drop = seg(p, 0.26, 0.4);
    fly.current = fade;
    if (group.current) group.current.visible = labState.warm || fade > 0.003;
    if (fade <= 0.003 && !labState.warm) return;
    mats.surf.uniforms.uTime.value = s.clock.elapsedTime;
    mats.surf.uniforms.uFade.value = fade;
    mats.atmo.uniforms.uFade.value = fade;
    mats.streak.uniforms.uFade.value = fade;
    mats.glowA.uniforms.uGain.value = 1.5 * fade;
    mats.glowB.uniforms.uGain.value = 1.4 * fade;
    if (body.current) body.current.rotation.y += Math.min(dt, 0.05) * 0.002; // the Earth turns, slowly enough to keep India in view
    group.current.position.x = s.pointer.x * 0.35;
    group.current.position.y = -R - 3.6 - drop * 9;
  });
  return (
    <>
      <Fireflies fade={fly} />
    <group ref={group} position={[0, -R - 3.6, -7]}>
      <group quaternion={CHENNAI}>
        <mesh ref={body} material={mats.surf}>
          <sphereGeometry args={[R, 128, 96]} />
        </mesh>
      </group>
      <mesh material={mats.atmo} scale={1.105}>
        <sphereGeometry args={[R, 96, 64]} />
      </mesh>
      <group position={[-9.6, R + 3.6 - 4.05, -5]}>
        <mesh geometry={glowQuad} material={mats.glowA} renderOrder={4} frustumCulled={false} />
        <mesh geometry={glowQuad} material={mats.glowB} position={[0, 0, 0.01]} renderOrder={5} frustumCulled={false} />
        <mesh material={mats.streak} position={[0, 0, 0.02]} renderOrder={6}>
          <planeGeometry args={[30, 1.1]} />
        </mesh>
      </group>
    </group>
    </>
  );
}
