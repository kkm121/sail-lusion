import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';

const q = new URLSearchParams(window.location.search);
const clip = q.get('clip') || 'Idle';
const t = parseFloat(q.get('t') || '0');
const bones = (q.get('bones') || '').split(',').filter(Boolean);
const view = q.get('view') || 'front';

function Robot() {
  const { scene, animations } = useGLTF('/models/navigator.glb');
  const model = useMemo(() => skeletonClone(scene), [scene]);
  const { camera } = useThree();
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const mixer = new THREE.AnimationMixer(model);
    const c = animations.find((a) => a.name === clip);
    if (c) {
      const act = mixer.clipAction(c);
      act.play();
      mixer.setTime(t);
    }
    model.updateMatrixWorld(true);
    bones.forEach((spec) => {
      const [name, axis, ang] = spec.split(':');
      const b = model.getObjectByName(name);
      if (!b) return;
      const a = parseFloat(ang);
      if (axis === 'x') b.rotateX(a);
      else if (axis === 'y') b.rotateY(a);
      else b.rotateZ(a);
    });
    model.updateMatrixWorld(true);
    const bb = new THREE.Box3();
    const tmp = new THREE.Vector3();
    model.traverse((o) => o.isBone && bb.expandByPoint(o.getWorldPosition(tmp)));
    const ctr = bb.getCenter(new THREE.Vector3());
    const sz = bb.getSize(new THREE.Vector3());
    const d = Math.max(sz.x, sz.y) * 2.6;
    camera.position.set(view === 'side' ? ctr.x + d : ctr.x, ctr.y, view === 'side' ? ctr.z : ctr.z + d);
    camera.lookAt(ctr);
    window.__navInfo = { ctr: ctr.toArray(), sz: sz.toArray(), d, cam: camera.position.toArray() };
    window.__navReady = true;
    void size;
  }, [model, animations, camera]);
  return <primitive object={model} />;
}

export default function NavPose() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#10151c' }}>
      <Canvas camera={{ fov: 30, near: 0.1, far: 5000 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 4]} intensity={2.2} />
        <Suspense fallback={null}>
          <Environment resolution={64}>
            <Lightformer form="rect" intensity={2} position={[0, 4, 2]} scale={[6, 1, 1]} />
          </Environment>
          <Robot />
        </Suspense>
      </Canvas>
    </div>
  );
}
