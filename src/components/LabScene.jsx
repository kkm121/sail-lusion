import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor, Stars, useGLTF } from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, Noise, SMAA, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { ErrorBoundary } from './ErrorBoundary';
import Cage from '../scene/Cage';
import Vortex from '../scene/Vortex';
import Room from '../scene/Room';
import Finale from '../scene/Finale';
import Navigator from '../scene/Navigator';
import Planet from '../scene/Planet';
import { labState, lerp, seg } from '../scene/shared';
import { hasWebGL, isTouch } from '../lib/device';
import { resolveAsset } from '../lib/assets';
import { HAVE, MEDIA } from '../data/media';
import { CAGE_END, ROOM_END, ROOM_START, START, Z0, ZTOT } from '../lib/journey';

const BG = {
  cage: new THREE.Color('#040302'),
  vortex: new THREE.Color('#05030a'),
  room: new THREE.Color('#0d0640'),
  space: new THREE.Color('#030407'),
};

function FollowStars({ count }) {
  const g = useRef();
  useFrame((s) => {
    if (g.current) g.current.position.z = s.camera.position.z;
  });
  return (
    <group ref={g}>
      <Stars radius={110} depth={60} count={count} factor={4.2} fade speed={0.35} />
    </group>
  );
}

function Rig({ progress, sp, bloomRef }) {
  const smooth = useRef(0);
  const bg = useMemo(() => new THREE.Color(), []);
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    smooth.current += (progress.current - smooth.current) * (1 - Math.exp(-3.5 * d));
    const p = smooth.current;
    sp.current = p;

    const tp = seg(p, START, 1);
    const zc = Z0 - ZTOT * tp;
    const cam = state.camera;
    const px = state.pointer.x;
    const py = state.pointer.y;
    const inTunnel = tp > 0;
    const z = inTunnel ? zc : lerp(7.8, 6.7, seg(p, 0.27, 0.44));
    const cageK = 1 - seg(zc, CAGE_END + 40, CAGE_END - 20);
    const roll = inTunnel ? Math.sin(zc * 0.035) * 0.06 * cageK : 0;
    cam.position.set(px * 0.35 + (inTunnel ? Math.sin(zc * 0.04) * 0.2 : 0), py * 0.24 + (inTunnel ? Math.cos(zc * 0.035) * 0.16 : 0), z);
    cam.rotation.set(py * 0.035, -px * 0.045, roll);
    if (cam.fov !== 46) {
      cam.fov = 46;
      cam.updateProjectionMatrix();
    }

    const vK = seg(zc, CAGE_END + 8, CAGE_END - 14);
    const rK = seg(zc, ROOM_START + 4, ROOM_START - 12);
    const fK = seg(zc, ROOM_END + 2, ROOM_END - 6);
    bg.copy(BG.cage).lerp(BG.vortex, vK).lerp(BG.room, rK).lerp(BG.space, fK);
    state.scene.background.copy(bg);
    if (bloomRef.current) bloomRef.current.intensity = lerp(0.9, 1.25, vK) * lerp(1, 0.62, rK) * lerp(1, 0.85, fK);
  }, -1);
  return null;
}

const CURTAIN_V = 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }';
const CURTAIN_F = 'uniform float uA; void main(){ gl_FragColor = vec4(0.012, 0.016, 0.027, uA); }';

function Curtain({ sp }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: CURTAIN_V, fragmentShader: CURTAIN_F, uniforms: { uA: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false }), []);
  const mesh = useRef();
  useFrame(() => {
    const p = sp.current;
    // Black while the words clear, then the tunnel fades up out of it.
    const a = seg(p, 0.47, 0.54) * (1 - seg(p, 0.585, 0.66));
    mat.uniforms.uA.value = a * 0.9;
    if (mesh.current) mesh.current.visible = a > 0.002;
  });
  return (
    <mesh ref={mesh} material={mat} renderOrder={900} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

function Tunnel({ touch, sp }) {
  const cage = useRef();
  const vortex = useRef();
  const room = useRef();
  const finale = useRef();
  const frames = useRef(0);
  // The first frames draw every chapter once so each shader and texture is compiled
  // while the loader is still on screen, not when the visitor first scrolls to it.
  useFrame((state) => {
    const zc = state.camera.position.z;
    const warm = frames.current++ < 16;
    if (frames.current >= 18 && (labState.nav || !HAVE.navigator)) resolveAsset('lab');
    const p = sp.current;
    if (cage.current) cage.current.visible = warm || (p > 0.545 && zc <= Z0 + 4 && zc > CAGE_END - 6);
    if (vortex.current) vortex.current.visible = warm || (zc <= CAGE_END + 42 && zc > ROOM_START - 8);
    if (room.current) room.current.visible = warm || (zc <= ROOM_START + 14 && zc > ROOM_END - 18);
    if (finale.current) finale.current.visible = warm || zc <= ROOM_END + 36;
  });
  return (
    <>
      <group ref={cage}>
        <Cage touch={touch} />
      </group>
      <group ref={vortex}>
        <Vortex touch={touch} />
      </group>
      <group ref={room}>
        <Room touch={touch} />
      </group>
      <group ref={finale}>
        <Finale touch={touch} />
      </group>
    </>
  );
}

useGLTF.preload(MEDIA.navigator);

export default function LabScene({ progress, visible = true }) {
  const touch = useRef(isTouch()).current;
  const sp = useRef(0);
  const bloomRef = useRef();
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, touch ? 1.75 : 1.75));
  const [fx, setFx] = useState(touch ? 0 : 2);
  const aberration = useMemo(() => new THREE.Vector2(0.0007, 0.0006), []);
  const [warm, setWarm] = useState(true);
  useEffect(() => {
    if (!hasWebGL()) resolveAsset('lab');
    const id = window.setTimeout(() => setWarm(false), 4500);
    return () => clearTimeout(id);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 7.8], fov: 46, near: 0.1, far: 520 }}
      dpr={dpr}
      gl={{ antialias: touch, alpha: false, stencil: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      frameloop={visible || warm ? 'always' : 'never'}
    >
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => {
          if (fx >= 2) setFx(1);
          else if (dpr > 1.1) setDpr(1);
          else setFx(0);
        }}
      />
      <color attach="background" args={['#030407']} />
      <ambientLight intensity={0.4} />
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <Environment resolution={128} environmentIntensity={0.7}>
            <Lightformer form="rect" intensity={2.6} color="#ffe9b0" position={[0, 6, -6]} scale={[14, 1.2, 1]} />
            <Lightformer form="rect" intensity={1.8} color="#8b5cf6" position={[-7, 0, -4]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
            <Lightformer form="rect" intensity={1.6} color="#00f5d4" position={[7, 0, -4]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
            <Lightformer form="ring" intensity={2.2} color="#ffffff" position={[0, 0, 8]} scale={5} />
          </Environment>
        </Suspense>
      </ErrorBoundary>

      <FollowStars count={touch ? 1200 : 2600} />
      {HAVE.navigator && (
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <Navigator sp={sp} />
          </Suspense>
        </ErrorBoundary>
      )}
      <Planet sp={sp} />
      <Tunnel touch={touch} sp={sp} />
      <Curtain sp={sp} />
      <Rig progress={progress} sp={sp} bloomRef={bloomRef} />

      {fx > 0 && (
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom ref={bloomRef} luminanceThreshold={0.86} luminanceSmoothing={0.3} intensity={0.9} radius={0.65} mipmapBlur />
          <ChromaticAberration offset={aberration} radialModulation modulationOffset={0.35} />
          <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.07} />
          <Vignette offset={0.3} darkness={0.5} />
          {fx >= 2 ? <SMAA /> : <></>}
        </EffectComposer>
      )}
    </Canvas>
  );
}
