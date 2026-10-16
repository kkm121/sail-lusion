import { useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { MeshDistortMaterial, MeshTransmissionMaterial, Sparkles, useFBO } from '@react-three/drei';
import * as THREE from 'three';
import { CAGE_END, ROOM_START } from '../lib/journey';
import { glowQuad, labState, makeGlowMaterial, seg } from './shared';

// Chapter II, Discover: the AmieeCore glass blob from the first version of the site (RP_Club, backup-pre-lusion),
// with the same materials, lights and colour logic, in its red theme (#E11D48). The camera circles it once
// (see the rig in LabScene) and then dives through it into the Create room.
export const BLOB_Z = -150;
export const BLOB_R = 10;
const SIZE = 1.3;
// White theme: a bright pearl core. Accent lights keep a faint warm and cool tint so the glass still has depth.
const THEME = '#ffffff';
const WARM = '#ffd9c2';
const COOL = '#cfe3ff';

export default function Vortex({ touch }) {
  const group = useRef();
  const spin = useRef();
  const glass = useRef();
  const core = useRef();
  const inner = useRef();
  const rim = useRef();
  const top = useRef();
  const bottom = useRef();
  const orbit = useRef();
  const key = useRef();
  const halo = useRef();
  const away = useMemo(() => new THREE.Vector3(), []);
  const { scene } = useThree();
  const target = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => ({ base: new THREE.Color(THEME), secondary: new THREE.Color(), mixed: new THREE.Color() }), []);
  const glow = useMemo(() => makeGlowMaterial(14, THEME, 0, 3), []);
  // The glass refracts this buffer. It is only redrawn while the blob is on screen, so the rest of the voyage pays nothing.
  const fbo = useFBO(touch ? 256 : 512, touch ? 256 : 512);

  useFrame((s, dt) => {
    const g = group.current;
    if (!g) return;
    const z = s.camera.position.z;
    const fade = seg(z, CAGE_END + 30, CAGE_END + 4) * (1 - seg(z, ROOM_START + 18, ROOM_START + 6));
    g.visible = labState.warm || fade > 0.001;
    // lights fade instead of hiding (see the note in Cage.jsx)
    const lk = labState.warm ? 1 : fade;
    if (key.current) key.current.intensity = 0.45 * lk;
    if (rim.current) rim.current.intensity = 0.8 * lk;
    if (top.current) top.current.intensity = 0.7 * lk;
    if (bottom.current) bottom.current.intensity = 0.9 * lk;
    if (orbit.current) orbit.current.intensity = 2.2 * lk;
    if (!g.visible) return;
    const t = s.clock.elapsedTime;
    const d = Math.min(dt, 0.05);

    // colour logic from the original: the theme drifts toward a neighbouring hue and back
    // exactly the original colour logic: the theme drifts toward a warmer neighbouring hue and back
    // white core that breathes between a faint warm and a faint cool white
    colors.secondary.set(Math.sin(t * 0.35) > 0 ? WARM : COOL);
    colors.mixed.copy(colors.base).lerp(colors.secondary, 0.18 + 0.12 * Math.abs(Math.sin(t * 0.35)));
    if (core.current) {
      // a touch below pure white, so the side facing the light keeps its shape instead of clipping
      core.current.color.copy(colors.mixed).multiplyScalar(0.78);
      core.current.emissive.copy(colors.mixed);
      core.current.emissiveIntensity = 0.32 + Math.sin(t * 1.3) * 0.06;
    }
    if (inner.current) {
      inner.current.rotation.y -= d * 0.4;
      inner.current.rotation.x += d * 0.18;
    }
    if (spin.current) {
      spin.current.rotation.y = 0.45 + t * 0.15;
      spin.current.rotation.x = 0.35;
      spin.current.rotation.z = 0.15 + Math.sin(t * 0.4) * 0.05;
      spin.current.position.y = Math.sin(t * 0.9) * 0.15;
      spin.current.scale.setScalar(SIZE * (0.7 + 0.3 * fade) * (1 + Math.sin(t * 1.2) * 0.014));
    }
    if (orbit.current) {
      const a = t * 0.6;
      orbit.current.position.set(Math.cos(a) * 4.2, Math.sin(a * 0.7) * 2.2, Math.sin(a) * 4.2);
    }
    // keep the glow on the far side of the blob from the camera, wherever the orbit is
    if (halo.current) {
      away.set(-s.camera.position.x, -s.camera.position.y, BLOB_Z - s.camera.position.z).normalize().multiplyScalar(2.4);
      halo.current.position.copy(away);
    }
    glow.uniforms.uColor.value.copy(colors.mixed);
    glow.uniforms.uGain.value = (touch ? 0.4 : 0.22) * fade;

    // refraction buffer, drawn without the glass itself (skipped while the warm-up keeps the chapter hidden)
    if (glass.current && g.parent?.visible) {
      glass.current.visible = false;
      // the halo stays out of the refraction, or the glass turns into a flat white disc
      if (halo.current) halo.current.visible = false;
      s.gl.setRenderTarget(fbo);
      s.gl.render(s.scene, s.camera);
      s.gl.setRenderTarget(null);
      glass.current.visible = true;
      if (halo.current) halo.current.visible = true;
    }
  });

  return (
    <group ref={group} position={[0, 0, BLOB_Z]}>
      {createPortal(
        <group position={[0, 0, BLOB_Z]}>
          <directionalLight ref={key} position={[10, 10, 5]} intensity={1.5} color="#ffffff" target={target} />
          <directionalLight ref={rim} position={[-10, -10, -5]} intensity={0.8} color={COOL} target={target} />
          <spotLight ref={top} position={[0, 10, 0]} intensity={1.5} angle={0.8} penumbra={1} color={THEME} target={target} />
          <spotLight ref={bottom} position={[0, -10, 0]} intensity={0.9} angle={0.8} penumbra={1} color={THEME} target={target} />
          <pointLight ref={orbit} intensity={5} distance={14} decay={2} color={WARM} />
          <primitive object={target} />
        </group>,
        scene
      )}
      <mesh ref={halo} geometry={glowQuad} material={glow} position={[0, 0, -2]} renderOrder={1} frustumCulled={false} />
      <group ref={spin}>
        <mesh ref={glass}>
          <icosahedronGeometry args={[1.84, 3]} />
          <MeshTransmissionMaterial
            buffer={fbo.texture}
            samples={touch ? 3 : 6}
            resolution={touch ? 256 : 512}
            thickness={2.0}
            chromaticAberration={0}
            anisotropy={0.2}
            distortion={0}
            temporalDistortion={0}
            iridescence={0}
            color="#ffffff"
            transmission={0.96}
            roughness={0.04}
            metalness={0.08}
            ior={1.46}
            clearcoat={1}
            clearcoatRoughness={0.02}
            reflectivity={0.5}
            envMapIntensity={0.35}
          />
        </mesh>
        <group ref={inner}>
          <mesh scale={0.99}>
            <icosahedronGeometry args={[1.83, 4]} />
            <MeshDistortMaterial ref={core} color={THEME} emissive={THEME} emissiveIntensity={0.32} distort={0.18} speed={1.4} roughness={0.22} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.85, 24, 24]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.45} transparent opacity={0.45} />
          </mesh>
        </group>
        <Sparkles count={touch ? 34 : 70} scale={5.2} size={1.6} speed={0.45} opacity={0.4} color={WARM} />
        <Sparkles count={touch ? 18 : 40} scale={5} size={1.5} speed={0.3} opacity={0.35} color="#ffffff" />
      </group>
    </group>
  );
}
