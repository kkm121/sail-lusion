import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { MEDIA } from '../data/media';
import { START, chapterAt } from '../lib/journey';
import { ease, labState, lerp, seg } from './shared';

const HOLD = 'Dance';
const HOLD_T = 0.9;

const C = (hex) => new THREE.Color(hex);
const KEY_A = C('#fff1dc');
const KEY_B = C('#ffffff');
const FILL_A = C('#4e9bff');
const FILL_B = C('#8ff7e8');
const RIM_A = C('#ffffff');
const RIM_B = C('#ffe9b0');

export default function Navigator({ sp }) {
  const group = useRef();
  const holder = useRef();
  const key = useRef();
  const fill = useRef();
  const rim = useRef();
  const { scene, animations } = useGLTF(MEDIA.navigator);
  const model = useMemo(() => {
    const m = skeletonClone(scene);
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    const k = 1 / Math.max(size.y, 0.001);
    const c = box.getCenter(new THREE.Vector3());
    m.userData.fit = { k, c };
    const crease = THREE.MathUtils.degToRad(46);
    m.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      if (o.geometry) {
        try {
          o.geometry = toCreasedNormals(o.geometry, crease);
        } catch (e) {
          o.geometry.computeVertexNormals();
        }
      }
      const matName = (o.material?.name || '').toLowerCase();
      if (matName.includes('main')) {
        o.material = new THREE.MeshStandardMaterial({ color: C('#f6f8fd'), roughness: 0.22, metalness: 0.1, envMapIntensity: 2.4 });
      } else if (matName.includes('grey') || matName.includes('gray')) {
        o.material = new THREE.MeshStandardMaterial({ color: C('#1b212b'), roughness: 0.3, metalness: 0.9, envMapIntensity: 2.2 });
      } else if (matName.includes('black')) {
        o.material = new THREE.MeshStandardMaterial({ color: C('#04070b'), roughness: 0.12, metalness: 0.85, emissive: C('#00f5d4'), emissiveIntensity: 0.34, envMapIntensity: 3 });
      } else if (o.material) {
        o.material.envMapIntensity = 2.2;
        o.material.roughness = Math.min(o.material.roughness ?? 0.4, 0.3);
      }
    });
    return m;
  }, [scene]);
  const { actions } = useAnimations(animations, holder);
  const { camera } = useThree();

  const clip = useRef('');
  useEffect(() => {
    labState.nav = true;
    clip.current = '';
    return () => Object.values(actions).forEach((a) => a?.stop());
  }, [actions]);

  const rot = useRef({ x: 0, y: 0, z: 0 });
  const pos = useRef({ x: 0, y: 0.2, rel: 7.8, s: 2.3 });
  const lastP = useRef(0);
  const velP = useRef(0);

  useFrame((s, dt) => {
    const g = group.current;
    if (!g) return;
    const p = sp.current;
    const t = s.clock.elapsedTime;
    const inTunnel = p >= START;
    const ax = THREE.MathUtils.clamp(camera.aspect / 1.6, 0.34, 1);
    const d = Math.min(dt, 0.05);
    const intro = 1 - seg(p, 0.3, 0.56);

    const scrollVel = (p - lastP.current) / Math.max(d, 0.001);
    lastP.current = p;
    velP.current += (scrollVel - velP.current) * (1 - Math.exp(-6.0 * d));
    const inertiaPitch = THREE.MathUtils.clamp(velP.current * 0.35, -0.45, 0.45);
    const inertiaDragZ = THREE.MathUtils.clamp(-velP.current * 0.9, -1.6, 1.6);

    const hoverY = Math.sin(t * 1.25) * 0.12 + Math.sin(t * 2.5) * 0.03;
    const hoverX = Math.cos(t * 0.95) * 0.09 + Math.sin(t * 1.9) * 0.025;
    const px = s.pointer.x;
    const py = s.pointer.y;

    const zc = camera.position.z;
    const vortexK = seg(zc, -120, -190);
    const vortexBank = Math.sin(zc * 0.08) * 0.32 * vortexK;
    const ci = inTunnel ? chapterAt(p) : -1;
    const end = seg(p, 0.955, 0.985);

    // Rotation targets. Intro: a slow weightless sway with the arms held out; tunnel: banking and scroll inertia.
    let targetRx;
    let targetRy;
    let targetRz;
    if (!inTunnel) {
      targetRx = -0.05 + Math.sin(t * 0.5) * 0.06 - py * 0.22;
      targetRy = Math.sin(t * 0.33) * 0.55 + px * 0.5;
      targetRz = Math.sin(t * 0.42) * 0.09 - px * 0.1;
    } else {
      targetRx = -py * 0.32 + 0.04 + Math.cos(t * 1.05) * 0.025 + inertiaPitch * (1 - end);
      targetRy = lerp(px * 0.52 - 0.22, 0, end);
      targetRz = -px * 0.18 + Math.sin(t * 0.8) * 0.035 + vortexBank * (1 - end);
    }
    const R = rot.current;
    const kr = 1 - Math.exp(-4.5 * d);
    R.x += (targetRx - R.x) * kr;
    R.y += (targetRy - R.y) * kr;
    R.z += (targetRz - R.z) * kr;

    // Body language. Before the tunnel the T-pose clip is frozen and breathes; each chapter then cross-fades to its own clip.
    const hold = actions[HOLD];
    const want = inTunnel ? ['Idle', 'WalkJump', 'Dance', 'Yes', 'Wave'][ci] || 'Idle' : HOLD;
    if (clip.current !== want) {
      if (want === HOLD && hold) {
        hold.reset().setEffectiveWeight(1).play();
        hold.paused = true;
      } else if (actions[want]) {
        const next = actions[want];
        next.reset().setEffectiveWeight(1).fadeIn(0.8).play();
        next.timeScale = want === 'Dance' ? 0.35 : want === 'Idle' ? 0.45 : want === 'Wave' ? 0.85 : 0.4;
        if (clip.current) {
          const prev = actions[clip.current];
          prev?.fadeOut(0.8);
          if (prev) prev.paused = false;
        }
      }
      clip.current = want;
    }
    if (hold && clip.current === HOLD) hold.time = HOLD_T + Math.sin(t * 0.6) * 0.045;

    g.rotation.order = 'YXZ';
    g.rotation.set(R.x, R.y, R.z);

    let tx = 0;
    let ty = 0;
    let tr = 11.5;
    let ts = 1.35;
    if (!inTunnel) {
      // On the planet, then lifting off to the middle of the frame, then dwindling into the distance while the words fly past.
      const lift = ease(seg(p, 0.28, 0.42));
      const away = ease(seg(p, 0.43, 0.6));
      tx = 0;
      ty = lerp(lerp(0.12, 0.05, lift), 0.0, away);
      tr = lerp(zc - lerp(0.2, -0.4, lift), 11.5, away);
      ts = lerp(lerp(2.25, 1.9, lift), 1.45, away);
    } else {
      tx = camera.position.x + lerp(-0.7 * ax, 0, end);
      ty = camera.position.y + lerp(-0.2, 0.1, end);
      tr = lerp(11.5, 8.6, end);
      ts = lerp(1.45, 1.7, end);
    }
    const P = pos.current;
    const kp = 1 - Math.exp(-5.0 * d);
    P.x += (tx - P.x) * kp;
    P.y += (ty - P.y) * kp;
    P.rel += (tr - P.rel) * kp;
    P.s += (ts - P.s) * kp;

    g.position.set(P.x + hoverX, P.y + hoverY, zc - P.rel + inertiaDragZ);
    g.scale.setScalar(P.s * THREE.MathUtils.clamp(camera.aspect * 1.25, 0.45, 1));

    // Lighting moves from a sunrise set (warm key, blue fill, white rim) to the tunnel set (white, teal, gold).
    if (key.current) {
      key.current.color.copy(KEY_B).lerp(KEY_A, intro);
      key.current.intensity = lerp(3.2, 4.8, intro);
    }
    if (fill.current) {
      fill.current.color.copy(FILL_B).lerp(FILL_A, intro);
      fill.current.intensity = lerp(6, 7.5, intro);
    }
    if (rim.current) {
      rim.current.color.copy(RIM_B).lerp(RIM_A, intro);
      rim.current.intensity = lerp(8, 10, intro);
    }
  });

  return (
    <group ref={group}>
      <group scale={model.userData.fit.k}>
        <group position={[-model.userData.fit.c.x, -model.userData.fit.c.y, -model.userData.fit.c.z]}>
          <group ref={holder}>
            <primitive object={model} />
          </group>
        </group>
      </group>
      <directionalLight ref={key} position={[-3.5, 3.4, 4.2]} intensity={3.2} color="#ffffff" />
      <pointLight ref={fill} position={[2.4, -2.2, 2.6]} intensity={6} color="#8ff7e8" distance={10} decay={2} />
      <pointLight ref={rim} position={[-3.2, 2.4, -3.2]} intensity={8} color="#ffe9b0" distance={10} decay={2} />
      <pointLight position={[0, 0.1, 0.35]} intensity={1.1} color="#9ff8ec" distance={2.5} decay={2} />
    </group>
  );
}
