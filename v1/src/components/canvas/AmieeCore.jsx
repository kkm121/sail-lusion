import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float, Sparkles, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const DEFAULT_THEME = '#00F5D4';
const hsl = { h: 0, s: 0, l: 0 };

function shiftHue(source, target, offset, saturation = 0.9, lightness = 0.55) {
  source.getHSL(hsl);
  target.setHSL((hsl.h + offset + 1) % 1, Math.max(hsl.s, saturation), lightness);
}

const smoothing = (rate, delta) => 1 - Math.exp(-rate * delta);
const finiteOr = (value, fallback) => (Number.isFinite(value) ? value : fallback);

function createGlowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.22, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.14)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function AmieeCore({
  themeColor = DEFAULT_THEME,
  quality = 'high',
  glow = false,
  full = true,
  sparkles = true,
  plainGlass = false,
}) {
  const isDesktopTier = quality === 'high';

  const groupRef = useRef();
  const innerCoreRef = useRef();
  const glowRef = useRef();
  const glowMaterialRef = useRef();
  const coreMaterialRef = useRef();
  const rimLightRef = useRef();
  const topLightRef = useRef();
  const bottomLightRef = useRef();
  const orbitLightRef = useRef();

  const scaleProgress = useRef(0.2);
  const fitRef = useRef(1);
  const scrollRef = useRef(0);
  const scrollVelocity = useRef(0);
  const lastOffset = useRef(0);
  const pointerEnergy = useRef(0);
  const kick = useRef(0);
  const previousTheme = useRef(themeColor);

  const isTouch = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches,
    []
  );

  const colors = useMemo(
    () => ({
      base: new THREE.Color(DEFAULT_THEME),
      target: new THREE.Color(DEFAULT_THEME),
      secondary: new THREE.Color(),
      mixed: new THREE.Color(),
    }),
    []
  );

  const glowTexture = useMemo(() => (glow ? createGlowTexture() : null), [glow]);

  useEffect(() => () => glowTexture?.dispose(), [glowTexture]);

  useEffect(() => {
    let raf = 0;
    let maxScroll = 1;
    const measure = () => {
      maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    };
    const update = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        scrollRef.current = Math.min(Math.max((window.scrollY || 0) / maxScroll, 0), 1);
      });
    };
    const onResize = () => {
      measure();
      update();
    };
    measure();
    update();
    const observer = new ResizeObserver(onResize);
    observer.observe(document.body);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useFrame((state, rawDelta) => {
    const delta = Math.min(finiteOr(rawDelta, 0.016), 0.05);
    const time = state.clock.elapsedTime;
    const pointer = state.pointer;
    const offset = scrollRef.current;
    const motion = 1;

    if (!Number.isFinite(scaleProgress.current)) scaleProgress.current = 0.96;
    if (!Number.isFinite(fitRef.current)) fitRef.current = 1;

    if (previousTheme.current !== themeColor) {
      previousTheme.current = themeColor;
      kick.current = 1;
    }
    kick.current = THREE.MathUtils.damp(kick.current, 0, 2.2, delta);

    scrollVelocity.current = THREE.MathUtils.damp(
      scrollVelocity.current,
      Math.min(Math.abs(offset - lastOffset.current) / Math.max(delta, 0.001), 1.5),
      4,
      delta
    );
    lastOffset.current = offset;
    pointerEnergy.current = THREE.MathUtils.damp(
      pointerEnergy.current,
      Math.min(Math.hypot(pointer.x, pointer.y), 1),
      3,
      delta
    );
    const energy = isTouch
      ? Math.min(kick.current * 0.4, 1)
      : Math.min(scrollVelocity.current * 0.6 + pointerEnergy.current * 0.35 + kick.current * 0.6, 1);

    colors.target.set(themeColor);
    colors.base.lerp(colors.target, smoothing(3.2, delta));
    shiftHue(colors.base, colors.secondary, 0.1 + Math.sin(time * 0.35) * 0.04 * motion + offset * 0.08);
    const blend = 0.3 + 0.2 * Math.sin(time * 0.5) * motion + energy * 0.1;
    colors.mixed.copy(colors.base).lerp(colors.secondary, THREE.MathUtils.clamp(blend, 0, 0.6));

    scaleProgress.current = THREE.MathUtils.damp(scaleProgress.current, 0.96, 2.5, delta);
    fitRef.current = THREE.MathUtils.damp(
      fitRef.current,
      THREE.MathUtils.clamp(finiteOr(state.viewport.width, 5.4) / 5.4, 0.56, 1),
      4,
      delta
    );

    const breath = 1 + Math.sin(time * 1.2) * 0.014 * motion + kick.current * 0.05;
    const groupScale = scaleProgress.current * breath * fitRef.current;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(groupScale);

      const isDesktop = state.viewport.width > 7;
      const targetX = isDesktop ? THREE.MathUtils.lerp(0, 1.55, Math.min(offset * 4.0, 1)) : 0;
      const targetY = isDesktop ? THREE.MathUtils.lerp(0, -0.1, Math.min(offset * 3.0, 1)) : 0;

      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 2.8, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 2.8, delta);

      const targetRotY = 0.45 + offset * Math.PI * 3.5 + time * 0.15 * motion + pointer.x * 0.22;
      const targetRotX = 0.35 + offset * Math.PI * 1.8 + pointer.y * 0.14;
      const targetRotZ = 0.15 + Math.sin(time * 0.4) * 0.05 * motion;

      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 3.0, delta);
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 3.0, delta);
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRotZ, 3.0, delta);

      if (glowRef.current) {
        glowRef.current.position.set(groupRef.current.position.x, groupRef.current.position.y, -1.6);
        glowRef.current.scale.setScalar(Math.max(groupScale, 0.01));
      }
    }

    if (glowMaterialRef.current) {
      glowMaterialRef.current.color.copy(colors.mixed);
      glowMaterialRef.current.opacity = 0.5 + Math.sin(time * 1.1) * 0.04 * motion + kick.current * 0.15;
    }

    const core = coreMaterialRef.current;
    if (core) {
      core.color.copy(colors.mixed);
      core.emissive.copy(colors.mixed);
      core.emissiveIntensity = 2.0 + Math.sin(time * 1.3) * 0.15 * motion + energy * 0.35;
      core.distort = 0.06 + energy * 0.1;
    }

    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y -= delta * (0.4 + energy * 0.9) * motion;
      innerCoreRef.current.rotation.x += delta * (0.18 + energy * 0.4) * motion;
    }

    if (topLightRef.current) topLightRef.current.color.copy(colors.base);
    if (rimLightRef.current) rimLightRef.current.color.copy(colors.secondary);
    if (bottomLightRef.current) bottomLightRef.current.color.copy(colors.secondary);
    if (orbitLightRef.current) {
      const angle = time * 0.6 * motion;
      orbitLightRef.current.position.set(Math.cos(angle) * 4.2, Math.sin(angle * 0.7) * 2.2, Math.sin(angle) * 4.2);
      orbitLightRef.current.color.copy(colors.secondary);
      orbitLightRef.current.intensity = 5 + energy * 3;
    }
  });

  return (
    <>
      <directionalLight ref={rimLightRef} position={[-10, -10, -5]} intensity={0.8} color={themeColor} />
      <spotLight ref={topLightRef} position={[0, 10, 0]} intensity={1.5} angle={0.8} penumbra={1} color={themeColor} />
      <spotLight ref={bottomLightRef} position={[0, -10, 0]} intensity={0.9} angle={0.8} penumbra={1} color={themeColor} />
      {isDesktopTier && <pointLight ref={orbitLightRef} intensity={5} distance={14} decay={2} color={themeColor} />}

      {glow && glowTexture && (
        <mesh ref={glowRef} position={[0, 0, -1.6]} renderOrder={-1}>
          <planeGeometry args={[9, 9]} />
          <meshBasicMaterial
            ref={glowMaterialRef}
            map={glowTexture}
            color={themeColor}
            transparent
            opacity={0.5}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      )}

      <Float speed={1.8} rotationIntensity={0.22} floatIntensity={0.55}>
        <group ref={groupRef}>
          <mesh>
            <icosahedronGeometry args={[1.84, 0]} />
            {plainGlass ? (
              <meshPhysicalMaterial
                color="#ffffff"
                transparent
                opacity={0.35}
                roughness={0.05}
                metalness={0.1}
                ior={1.46}
                clearcoat={1}
                clearcoatRoughness={0.02}
              />
            ) : (
              <MeshTransmissionMaterial
                backside={full}
                samples={full ? 6 : 3}
                resolution={full ? 512 : 256}
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
                clearcoat={1.0}
                clearcoatRoughness={0.02}
                reflectivity={0.95}
              />
            )}
          </mesh>

          <group ref={innerCoreRef}>
            <mesh scale={0.99}>
              <icosahedronGeometry args={[1.83, 0]} />
              <MeshDistortMaterial
                ref={coreMaterialRef}
                color={themeColor}
                emissive={themeColor}
                emissiveIntensity={2.1}
                distort={0.06}
                speed={1.4}
                transparent
                opacity={0.88}
                roughness={0.08}
                metalness={0.1}
              />
            </mesh>

            <mesh position={[0, 0.4, 0]}>
              <sphereGeometry args={[0.85, full ? 24 : 16, full ? 24 : 16]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={2.2}
                transparent
                opacity={0.8}
              />
            </mesh>
          </group>

          {sparkles && (
            <>
              <Sparkles
                count={full ? 70 : 34}
                scale={5.2}
                size={1.6}
                speed={0.45}
                opacity={0.32}
                color={themeColor}
              />
              <Sparkles
                count={full ? 40 : 18}
                scale={5.0}
                size={1.5}
                speed={0.3}
                opacity={0.35}
                color="#ffffff"
              />
            </>
          )}
        </group>
      </Float>
    </>
  );
}
