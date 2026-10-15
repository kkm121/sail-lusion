import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { MEDIA } from '../data/media';
import { START, chapterAt } from '../lib/journey';
import { ease, lerp, seg } from './shared';

const REL = 7.2;

export default function Navigator({ sp }) {
  const group = useRef();
  const holder = useRef();
  const { scene, animations } = useGLTF(MEDIA.navigator);
  const model = useMemo(() => {
    const m = skeletonClone(scene);
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    const k = 1 / Math.max(size.y, 0.001);
    const c = box.getCenter(new THREE.Vector3());
    m.userData.fit = { k, c };
    m.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        if (o.geometry) {
          o.geometry.computeVertexNormals();
        }
        const matName = (o.material?.name || '').toLowerCase();
        if (matName.includes('main')) {
          o.material = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f5f7fc'), roughness: 0.2, metalness: 0.12, envMapIntensity: 2.6 });
        } else if (matName.includes('grey') || matName.includes('gray')) {
          o.material = new THREE.MeshStandardMaterial({ color: new THREE.Color('#141820'), roughness: 0.28, metalness: 0.92, envMapIntensity: 2.4 });
        } else if (matName.includes('black')) {
          o.material = new THREE.MeshStandardMaterial({ color: new THREE.Color('#030508'), roughness: 0.1, metalness: 0.9, emissive: new THREE.Color('#00f5d4'), emissiveIntensity: 0.3, envMapIntensity: 3.2 });
        } else if (o.material) {
          o.material.envMapIntensity = 2.2;
          o.material.roughness = Math.min(o.material.roughness ?? 0.4, 0.3);
        }
      }
    });
    return m;
  }, [scene]);
  const { actions } = useAnimations(animations, holder);
  const { camera } = useThree();

  const clip = useRef('');
  useEffect(() => {
    clip.current = '';
    return () => Object.values(actions).forEach((a) => a?.stop());
  }, [actions]);

  const rot = useRef({ x: 0, y: -0.22, z: 0 });
  const pos = useRef({ x: -2.2, y: -0.3, rel: 7.2, s: 1.35 });
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

    // Dynamic Scroll Momentum & Aerodynamic Inertia
    const scrollVel = (p - lastP.current) / Math.max(d, 0.001);
    lastP.current = p;
    velP.current += (scrollVel - velP.current) * (1 - Math.exp(-6.0 * d));
    const inertiaPitch = THREE.MathUtils.clamp(velP.current * 0.35, -0.45, 0.45);
    const inertiaDragZ = THREE.MathUtils.clamp(-velP.current * 0.9, -1.6, 1.6);

    // Organic Zero-G Harmonic Levitation (Lusion signature floating physics)
    const hoverY = Math.sin(t * 1.25) * 0.14 + Math.sin(t * 2.5) * 0.03;
    const hoverX = Math.cos(t * 0.95) * 0.10 + Math.sin(t * 1.9) * 0.025;
    const hoverRoll = Math.sin(t * 0.8) * 0.035;
    const hoverPitch = Math.cos(t * 1.05) * 0.025;

    // Interactive pointer spring parallax (poised forward orientation)
    const px = s.pointer.x;
    const py = s.pointer.y;
    const mouseTiltY = px * 0.52 - 0.22;
    const mouseTiltX = -py * 0.32 + 0.04;
    const mouseBankZ = -px * 0.18;

    // Vortex banking in Chapter II (Lattice)
    const zc = camera.position.z;
    const vortexK = seg(zc, -120, -190);
    const vortexBank = Math.sin(zc * 0.08) * 0.32 * vortexK;

    const ci = inTunnel ? chapterAt(p) : -1;
    const end = seg(p, 0.955, 0.985);

    // Target rotation: maintains confident hero forward pose with physical banking
    const targetRx = mouseTiltX + hoverPitch + inertiaPitch * (1 - end);
    const targetRy = lerp(mouseTiltY, 0, end);
    const targetRz = mouseBankZ + hoverRoll + vortexBank * (1 - end);

    const R = rot.current;
    const kr = 1 - Math.exp(-5.5 * d);
    R.x += (targetRx - R.x) * kr;
    R.y += (targetRy - R.y) * kr;
    R.z += (targetRz - R.z) * kr;

    // Per-chapter body language, smoothly cross-faded
    const want = ['Idle', 'WalkJump', 'Dance', 'Yes', 'Wave'][ci] || 'Idle';
    if (clip.current !== want && actions[want]) {
      const next = actions[want];
      next.reset().setEffectiveWeight(1).fadeIn(0.6).play();
      next.timeScale = want === 'Dance' ? 0.35 : want === 'Idle' ? 0.45 : want === 'Wave' ? 0.85 : 0.4;
      if (clip.current) actions[clip.current]?.fadeOut(0.6);
      clip.current = want;
    }

    g.rotation.order = 'YXZ';
    g.rotation.set(R.x, R.y, R.z);

    // Spatial positioning along scroll
    let tx = 0;
    let ty = 0;
    let tr = REL;
    let ts = 1.35;

    if (!inTunnel) {
      const burst = ease(seg(p, 0.26, 0.52));
      tx = lerp(-1.4 * ax, 0, burst);
      ty = lerp(-0.4, 0, burst);
      tr = lerp(camera.position.z - 0.6, REL, burst);
      ts = lerp(1.5, 1.1, burst);
    } else {
      tx = camera.position.x + lerp(-1.1 * ax, 0, end);
      ty = camera.position.y + lerp(-0.32, 0.12, end);
      ts = lerp(1.3, 1.55, end);
    }

    const P = pos.current;
    const kp = 1 - Math.exp(-5.0 * d);
    P.x += (tx - P.x) * kp;
    P.y += (ty - P.y) * kp;
    P.rel += (tr - P.rel) * kp;
    P.s += (ts - P.s) * kp;

    g.position.set(
      P.x + hoverX,
      P.y + hoverY,
      camera.position.z - P.rel + inertiaDragZ
    );
    g.scale.setScalar(P.s * THREE.MathUtils.clamp(camera.aspect * 1.25, 0.45, 1));
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
      {/* Dedicated High-End Character Studio Lighting */}
      <directionalLight position={[-3, 4, 5]} intensity={3.2} color="#ffffff" />
      <pointLight position={[3, 2, -2.5]} intensity={6} color="#8ff7e8" distance={9} decay={2} />
      <pointLight position={[-3, -1.5, 2]} intensity={8} color="#ffe9b0" distance={9} decay={2} />
      <pointLight position={[0, 0.1, 0.35]} intensity={1.2} color="#9ff8ec" distance={2.5} decay={2} />
    </group>
  );
}
