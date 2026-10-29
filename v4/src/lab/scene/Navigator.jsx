import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { MEDIA } from '../media';
import { ease, glowQuad, labState, makeGlowMaterial, seg } from './shared';

// Nav appears only once, at the very end of the voyage: a cloud of light gathers into the robot, which turns to face
// the visitor and waves goodbye. Scrolling back up dissolves it again.
const SPAWN_A = 0.945;
const SPAWN_B = 0.982;

const C = (hex) => new THREE.Color(hex);

const SPARK_V = `uniform float uK; uniform float uTime; attribute vec4 aS; varying float vA;
void main(){
  vec3 p = position * mix(4.2, 0.35, uK);
  float a = uTime * (0.6 + aS.w) + aS.x * 6.28;
  p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (3. + aS.y * 5.) * (9. / max(-mv.z, 1.));
  vA = sin(uK * 3.14159) * (0.5 + 0.5 * aS.z);
}`;
const SPARK_F = `varying float vA; void main(){ float d = length(gl_PointCoord - .5) * 2.; float a = pow(max(1. - d, 0.), 2.) * vA; gl_FragColor = vec4(vec3(.62, 1., .93) * 1.6, a); }`;

// The finished look shared by every copy of the robot: glossy white ceramic shell, satin silver joints, a dark visor.
export function dressRobot(scene) {
  const m = skeletonClone(scene);
  m.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(m);
  const size = box.getSize(new THREE.Vector3());
  m.userData.fit = { k: 1 / Math.max(size.y, 0.001), c: box.getCenter(new THREE.Vector3()) };
  const crease = THREE.MathUtils.degToRad(46);
  m.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    if (o.geometry) {
      try {
        o.geometry = toCreasedNormals(o.geometry, crease);
      } catch {
        o.geometry.computeVertexNormals();
      }
    }
    const name = (o.material?.name || '').toLowerCase();
    // Finished look: glossy white ceramic shell, satin silver joints, a dark glass visor with glowing eyes.
    if (name.includes('main')) o.material = new THREE.MeshPhysicalMaterial({ color: C('#e4e7ec'), roughness: 0.36, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.3, sheenColor: C('#ffffff'), envMapIntensity: 1.3 });
    else if (name.includes('grey') || name.includes('gray')) o.material = new THREE.MeshPhysicalMaterial({ color: C('#dfe3ea'), roughness: 0.28, metalness: 0.75, clearcoat: 0.6, clearcoatRoughness: 0.1, envMapIntensity: 1.4 });
    else if (name.includes('black')) o.material = new THREE.MeshPhysicalMaterial({ color: C('#0c1117'), roughness: 0.06, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02, emissive: C('#ff5a1f'), emissiveIntensity: 0.04, envMapIntensity: 1.8 });
    else if (o.material) o.material = new THREE.MeshPhysicalMaterial({ color: C('#16191e'), roughness: 0.12, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, emissive: C('#ff5a1f'), emissiveIntensity: 0.22, envMapIntensity: 1.6 });
  });
  return m;
}

export default function Navigator({ sp }) {
  const group = useRef();
  const body = useRef();
  const holder = useRef();
  const { scene, animations } = useGLTF(MEDIA.navigator);
  const model = useMemo(() => dressRobot(scene), [scene]);
  const { actions } = useAnimations(animations, holder);

  const spark = useMemo(() => {
    const n = 360;
    const pos = new Float32Array(n * 3);
    const s = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      const r = 0.4 + Math.random() * 0.6;
      pos.set([Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r * 1.2, Math.sin(v) * Math.sin(u) * r], i * 3);
      s.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.BufferAttribute(s, 4));
    const m = new THREE.ShaderMaterial({ vertexShader: SPARK_V, fragmentShader: SPARK_F, uniforms: { uK: { value: 0 }, uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    return { g, m };
  }, []);
  const halo = useMemo(() => makeGlowMaterial(3.6, '#8ff7e8', 0, 3.4), []);

  useEffect(() => {
    labState.nav = true;
  }, []);

  const frames = useRef(0);
  const rig = useRef();
  const l1 = useRef();
  const l2 = useRef();
  const l3 = useRef();
  const root = useThree((st) => st.scene);
  const waving = useRef(false);
  const smoothK = useRef(0);

  useFrame((s, dt) => {
    const g = group.current;
    if (!g) return;
    const t = s.clock.elapsedTime;
    // drawn once during the shared warm-up under the loader, never on its own first frames
    const warm = labState.warm;
    const target = ease(seg(sp.current, SPAWN_A, SPAWN_B));
    smoothK.current += (target - smoothK.current) * (1 - Math.exp(-5 * Math.min(dt, 0.05)));
    const k = smoothK.current;
    g.visible = warm || k > 0.002;
    // lights follow the robot and fade with it instead of hiding (see the note in Cage.jsx)
    const lk = warm ? 1 : Math.min(1, k * 1.5);
    if (l1.current) l1.current.intensity = 3.4 * lk;
    if (l2.current) l2.current.intensity = 6 * lk;
    if (l3.current) l3.current.intensity = 8 * lk;
    if (!g.visible) return;

    const cam = s.camera;
    const ax = THREE.MathUtils.clamp(cam.aspect / 1.6, 0.5, 1);
    g.position.set(cam.position.x, cam.position.y - 0.25 + Math.sin(t * 1.1) * 0.05, cam.position.z - 8.2);
    if (rig.current) rig.current.position.copy(g.position);
    if (l1.current && l1.current.target !== g) l1.current.target = g;
    const pop = Math.pow(THREE.MathUtils.clamp((k - 0.25) / 0.75, 0, 1), 0.7);
    if (body.current) {
      body.current.scale.setScalar((warm ? 0.02 : Math.max(pop, 0.0001)) * 1.9 * ax);
      body.current.rotation.set(-0.04 - s.pointer.y * 0.15, (1 - pop) * Math.PI * 1.4 + Math.sin(t * 0.6) * 0.12 + s.pointer.x * 0.3, 0);
    }
    spark.m.uniforms.uK.value = k;
    spark.m.uniforms.uTime.value = t;
    halo.uniforms.uGain.value = (Math.sin(k * Math.PI) * 1.4 + k * 0.35) * (warm ? 0 : 1);

    const wave = actions.Wave;
    if (wave && pop > 0.45 && !waving.current) {
      wave.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.25).play();
      wave.timeScale = 0.85;
      waving.current = true;
    } else if (wave && pop < 0.25 && waving.current) {
      wave.fadeOut(0.4);
      waving.current = false;
    }
  });

  return (
    <>
      {createPortal(
        <group ref={rig}>
          <directionalLight ref={l1} position={[-3.5, 3.4, 4.2]} intensity={3.4} color="#ffffff" target={group.current || undefined} />
          <pointLight ref={l2} position={[2.4, -2.2, 2.6]} intensity={6} color="#8ff7e8" distance={10} decay={2} />
          <pointLight ref={l3} position={[-3.2, 2.4, -3.2]} intensity={8} color="#ffe9b0" distance={10} decay={2} />
        </group>,
        root
      )}
    <group ref={group} visible={false}>
      <mesh geometry={glowQuad} material={halo} renderOrder={6} frustumCulled={false} />
      <points geometry={spark.g} material={spark.m} frustumCulled={false} renderOrder={7} />
      <group ref={body}>
        <group scale={model.userData.fit.k}>
          <group position={[-model.userData.fit.c.x, -model.userData.fit.c.y, -model.userData.fit.c.z]}>
            <group ref={holder}>
              <primitive object={model} />
            </group>
          </group>
        </group>
      </group>
    </group>
    </>
  );
}
