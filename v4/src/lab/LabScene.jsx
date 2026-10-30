import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PerformanceMonitor, Stars, useGLTF } from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing';
import { BlendFunction, Effect, EffectAttribute } from 'postprocessing';
import * as THREE from 'three';
import { compileAsync } from './three-utils';
import { ErrorBoundary } from './ErrorBoundary';
import Grid from './scene/Grid';
import Vortex, { BLOB_R, BLOB_Z } from './scene/Vortex';
import Room from './scene/Room';
import Finale from './scene/Finale';
import Planet from './scene/Planet';
import Navigator from './scene/Navigator';
import Pilot from './scene/Pilot';
import { ease, labState, lerp, seg } from './scene/shared';
import { asset, HAVE, MEDIA } from './media';
import { CAGE_END, ROOM_END, ROOM_START, START, Z0, ZTOT } from './journey';

// Lusion's corridor (with permission) carries Build, Discover and Create; ?corridor=own brings back our own scenes
const LUSION_TUNNEL = typeof location === 'undefined' || new URLSearchParams(location.search).get('corridor') !== 'own';

const BG = {
  cage: new THREE.Color('#040302'),
  vortex: new THREE.Color('#0a0206'),
  room: new THREE.Color('#2a0a1e'),
  space: new THREE.Color('#030407'),
};

function FollowStars({ count, sp }) {
  const g = useRef();
  useFrame((s) => {
    if (!g.current) return;
    g.current.position.z = s.camera.position.z;
    // phase one is pure black (no stars) from the robot close-up until the corridor hands over to the Discover core
    const p = sp.current;
    g.current.visible = labState.warm || p < 0.29 || s.camera.position.z < CAGE_END + 10;
  });
  return (
    <group ref={g}>
      <Stars radius={110} depth={60} count={count} factor={4.2} fade speed={0.35} />
    </group>
  );
}

// Radial motion blur, strongest at the edges of the screen and only while the camera is actually moving through the
// corridor (like a long exposure): each pixel averages a few samples taken toward the centre.
const BLUR_F = `uniform float uAmt;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  if (uAmt < 0.0005) { outputColor = inputColor; return; }
  vec2 d = (uv - 0.5) * uAmt;
  vec4 acc = inputColor;
  for (int i = 1; i < 8; i++) acc += texture2D(inputBuffer, uv - d * (float(i) / 7.0));
  outputColor = acc / 8.0;
}`;
class RadialBlurEffect extends Effect {
  constructor() {
    super('RadialBlur', BLUR_F, { attributes: EffectAttribute.CONVOLUTION, uniforms: new Map([['uAmt', new THREE.Uniform(0)]]) });
  }
}

function Rig({ progress, sp, bloomRef, blur }) {
  const lastZ = useRef(null);
  const speed = useRef(0);
  const smooth = useRef(0);
  const bg = useMemo(() => new THREE.Color(), []);
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    smooth.current += (progress.current - smooth.current) * (1 - Math.exp(-8.5 * d));
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
    // Discover: approach the core, circle it a full 360 degrees, then dive straight through it into the Create room.
    labState.dive = !LUSION_TUNNEL && (zc <= ROOM_START || (zc < CAGE_END && seg(zc, CAGE_END, ROOM_START) >= 0.72));
    if (!LUSION_TUNNEL && zc < CAGE_END && zc > ROOM_START) {
      const u = seg(zc, CAGE_END, ROOM_START);
      // portrait screens orbit further out so the core fits the frame
      const R = BLOB_R * THREE.MathUtils.clamp(1.25 / cam.aspect, 1, 1.9);
      const near = BLOB_Z + R;
      if (u < 0.14) {
        cam.position.z = lerp(CAGE_END, near, ease(u / 0.14));
      } else if (u < 0.72) {
        const a = ease((u - 0.14) / 0.58) * Math.PI * 2;
        cam.position.set(Math.sin(a) * R + px * 0.3, Math.sin(a) * 1.6 + py * 0.25, BLOB_Z + Math.cos(a) * R);
        cam.lookAt(0, 0, BLOB_Z);
        cam.rotation.z += Math.sin(a) * 0.08;
      } else {
        cam.position.z = lerp(near, ROOM_START, Math.pow((u - 0.72) / 0.28, 1.6));
      }
    }
    // a wide lens in the Build corridor (the far opening shrinks to a small square while the near frames sweep past the
    // edges), back to the normal lens before the Discover core
    const fov = 46 + (LUSION_TUNNEL && zc < Z0 && zc > ROOM_END - 4 ? labState.fovOffset || 0 : 0);
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    const vK = LUSION_TUNNEL ? 0 : seg(zc, CAGE_END + 8, CAGE_END - 14);
    const cine = seg(p, 0.54, 0.6) * (1 - vK);
    // motion blur follows the camera's speed through the Build corridor
    if (blur) {
      const z = cam.position.z;
      if (lastZ.current !== null) speed.current += (Math.abs(z - lastZ.current) / Math.max(d, 1e-3) - speed.current) * (1 - Math.exp(-10 * d));
      lastZ.current = z;
      const inGrid = seg(p, START, START + 0.02) * (1 - seg(zc, CAGE_END + 20, CAGE_END));
      blur.uniforms.get('uAmt').value = Math.min(speed.current * 0.0016, 0.07) * inGrid;
    }
    const rK = LUSION_TUNNEL ? 0 : seg(zc, ROOM_START + 4, ROOM_START - 12);
    const fK = seg(zc, ROOM_END + 2, ROOM_END - 6);
    bg.copy(BG.cage).lerp(BG.vortex, vK).lerp(BG.room, rK).lerp(BG.space, fK);
    if (LUSION_TUNNEL && labState.tunnelHaze) bg.lerp(labState.tunnelHaze, labState.tunnelHazeK || 0);
    state.scene.background.copy(bg);
    // Fog: the Build corridor fades to black a few cells ahead, as in the reference; pushed far away everywhere else.
    if (state.scene.fog) {
      state.scene.fog.color.copy(bg);
      state.scene.fog.far = lerp(40, 900, vK);
      state.scene.fog.near = lerp(5, 800, vK);
    }
    if (bloomRef.current) bloomRef.current.intensity = 0.9 * lerp(1, 0.62, rK) * lerp(1, 0.85, fK);
    // phase one is shot dark, like film: in the Build corridor the studio reflections (which light every metal face the
    // same grey) drop right down, so the metal reads only where the dim lights and the glints catch it
    if (bloomRef.current) bloomRef.current.intensity *= lerp(1, 1.5, cine);
    // around the Discover core: the original scene's lighting and bloom (city-like reflections at 0.7, bloom from 0.5)
    state.scene.environmentIntensity = lerp(lerp(0.85, 0.1, cine), 0.7, vK * (1 - rK));
    if (bloomRef.current?.luminanceMaterial) bloomRef.current.luminanceMaterial.threshold = lerp(lerp(0.86, 0.7, cine), 0.5, vK * (1 - rK));
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
    // (phase one: no curtain any more, the caption dive and the corridor's build happen in the open dark)
    const a = 0 * seg(p, 0.47, 0.54);
    mat.uniforms.uA.value = a * 0.9;
    if (mesh.current) mesh.current.visible = labState.warm || a > 0.002;
  });
  return (
    <mesh ref={mesh} material={mat} renderOrder={900} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

const FLASH_F = 'uniform float uA; uniform vec3 uC; void main(){ gl_FragColor = vec4(uC, uA); }';

function Flash() {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: CURTAIN_V, fragmentShader: FLASH_F, uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color('#ffffff') } }, transparent: true, depthTest: false, depthWrite: false }), []);
  const mesh = useRef();
  useFrame((s) => {
    const z = s.camera.position.z;
    // only while diving through the core; the back half of the orbit crosses the same depth
    const a = (labState.dive ? seg(z, BLOB_Z + 3, BLOB_Z - 2) : 0) * (1 - seg(z, ROOM_START + 14, ROOM_START + 2));
    mat.uniforms.uA.value = a * 0.92;
    // white as the camera passes through the pearl, turning to the violet of the Create room
    const fk = seg(z, BLOB_Z - 4, ROOM_START + 6);
    mat.uniforms.uC.value.setRGB(lerp(0.55, 0.45, fk), lerp(1, 0.38, fk), lerp(0.9, 1, fk));
    if (mesh.current) mesh.current.visible = labState.warm || a > 0.002;
  });
  return (
    <mesh ref={mesh} material={mat} renderOrder={901} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

// Compiles the scene on the driver threads for the way it will really be drawn: with post-processing on, the scene is
// rendered into an off-screen buffer (no tone mapping, linear colour), which needs different shader variants.
const compileTarget = new THREE.WebGLRenderTarget(1, 1);
function compileScene(gl, scene, camera) {
  const prev = gl.getRenderTarget();
  if (labState.post) gl.setRenderTarget(compileTarget);
  const job = compileAsync(gl, scene, camera);
  gl.setRenderTarget(prev);
  return job;
}

// Holds the canvas still until everything mounted so far is compiled on the driver's threads.
function CompileGate({ onDone }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let alive = true;
    const id = window.setTimeout(() => {
      const job = compileScene(gl, scene, camera);
      job.catch(() => {}).finally(() => alive && onDone());
    }, 0);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [gl, scene, camera, onDone]);
  return null;
}

// Marks the textures and lighting map as loaded, so the loader waits for them.
function Loaded({ name }) {
  useEffect(() => {
    labState[name] = true;
  }, [name]);
  return null;
}

function Tunnel({ touch, sp, onGate, onWarm }) {
  const cage = useRef();
  const vortex = useRef();
  const room = useRef();
  const finale = useRef();
  const frames = useRef(0);
  const step = useRef(0);
  const t0 = useRef(0);
  // Warm-up, all while the loader is on screen:
  // 1. once the textures, lighting map and robot have loaded, every chapter is switched on inside hidden groups;
  // 2. the next frame the whole scene is handed to compileAsync, which compiles the shaders on the GPU driver's own
  //    threads, and the groups are hidden again before the frame is drawn, so nothing waits on a compile;
  // 3. when that finishes, every chapter is drawn for a few frames (textures upload), then the loader may open.
  useFrame((state) => {
    const zc = state.camera.position.z;
    const groups = [cage, vortex, room, finale];
    if (!t0.current) t0.current = performance.now();
    const loaded = (labState.env && labState.cage && labState.matrix && labState.earth && (labState.nav || !HAVE.navigator)) || performance.now() - t0.current > 8000;
    if (step.current === 0) {
      if (loaded) {
        onGate?.();
        labState.warm = true;
        window.__labWarming = true;
        step.current = 1;
      }
    } else if (step.current === 1) {
      step.current = 2;
      groups.forEach((g) => g.current && (g.current.visible = true));
      const job = compileScene(state.gl, state.scene, state.camera);
      job.catch(() => {}).finally(() => (step.current = 3));
      groups.forEach((g) => g.current && (g.current.visible = false));
      return;
    } else if (step.current === 2) {
      groups.forEach((g) => g.current && (g.current.visible = false));
      return;
    }
    const warm = step.current === 3 && frames.current++ < 14;
    if (step.current === 3 && !warm) {
      step.current = 4;
      window.__labWarming = false;
      onWarm?.();
    }
    labState.warm = warm;
    if (step.current < 3) {
      groups.forEach((g) => g.current && (g.current.visible = false));
      return;
    }
    const p = sp.current;
    if (cage.current) cage.current.visible = warm || (p > 0.545 && zc <= Z0 + 4 && zc > (LUSION_TUNNEL ? ROOM_END - 4 : CAGE_END - 6));
    if (vortex.current) vortex.current.visible = warm || (zc <= CAGE_END + 42 && zc > ROOM_START - 8);
    if (room.current) room.current.visible = warm || (zc <= ROOM_START + 14 && zc > ROOM_END - 18);
    if (finale.current) finale.current.visible = warm || zc <= ROOM_END + 36;
  });
  return (
    <>
      <group ref={cage} visible={false}>
        <Suspense fallback={null}>
          <Grid touch={touch} sp={sp} />
          <Loaded name="cage" />
        </Suspense>
      </group>
      <group ref={vortex} visible={false}>
        {!LUSION_TUNNEL && <Vortex touch={touch} />}
      </group>
      <group ref={room} visible={false}>
        {!LUSION_TUNNEL && <Room touch={touch} />}
      </group>
      <group ref={finale} visible={false}>
        <Finale touch={touch} />
      </group>
    </>
  );
}

useGLTF.preload(MEDIA.navigator);

// safe: a retry after a file failed to load, without the optional extras (lighting map, robot)
export default function LabScene({ progress, active = true, tier = 'full', onWarm, safe = false }) {
  const touch = useRef(tier !== 'full' || matchMedia('(hover: none), (pointer: coarse)').matches).current;
  const sp = useRef(0);
  const bloomRef = useRef();
  // modest devices: one pixel per pixel, no post-processing, fewer stars (see tier in Lab.jsx)
  // full: 0.75x (the canvas is always full screen now, so it never resizes mid-growth; bloom hides the softness).
  // lite (v1's rule): at most 1x and within a 0.8-megapixel budget, so big tablets stay light too
  const dpr = useMemo(() => (tier === 'full' ? Math.min(window.devicePixelRatio || 1, 1) * 0.75 : Math.min(1, Math.sqrt(0.8e6 / (window.innerWidth * window.innerHeight)))), [tier]);
  const fx = touch || tier !== 'full' ? 0 : 2;
  const postOn = true;
  const startPost = useCallback(() => {}, []);
  labState.post = fx > 0 && postOn;
  const aberration = useMemo(() => new THREE.Vector2(0.0007, 0.0006), []);
  const blur = useMemo(() => new RadialBlurEffect(), []);
  const [gated, setGated] = useState(false);
  const [warmed, setWarmed] = useState(false);
  const warmDone = useCallback(() => {
    setWarmed(true);
    onWarm?.();
  }, [onWarm]);
  const openGate = useCallback(() => setGated(true), []);

  return (
    <Canvas
      // measure the layout size, not the on-screen box: the device is the full screen scaled down with a transform, so the
      // on-screen box changes on every scroll and the canvas was being re-created at new sizes (the "sudden" Earth resize)
      resize={{ scroll: false, offsetSize: true }}
      camera={{ position: [0, 0, 7.8], fov: 46, near: 0.1, far: 520 }}
      dpr={dpr}
      gl={{ antialias: touch, alpha: false, stencil: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      frameloop={gated && (active || !warmed) ? 'always' : 'never'}
    >
      <color attach="background" args={['#030407']} />
      <fog attach="fog" args={['#040302', 14, 95]} />
      <ambientLight intensity={0.4} />
      {safe ? (
        <Loaded name="env" />
      ) : (
        <ErrorBoundary fallback={<Loaded name="env" />}>
          <Suspense fallback={null}>
            <Environment files={asset('/env/studio.hdr')} environmentIntensity={0.85} />
            <Loaded name="env" />
          </Suspense>
        </ErrorBoundary>
      )}

      <FollowStars sp={sp} count={tier !== 'full' ? 700 : touch ? 1200 : 2600} />
      {safe && <Loaded name="nav" />}
      {HAVE.navigator && !safe && (
        <ErrorBoundary fallback={<Loaded name="nav" />}>
          <Suspense fallback={null}>
            <Navigator sp={sp} />
          </Suspense>
        </ErrorBoundary>
      )}
      {HAVE.navigator && !safe && (
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <Pilot sp={sp} />
          </Suspense>
        </ErrorBoundary>
      )}
      <Planet sp={sp} hi={tier === 'full'} />
      <Tunnel touch={touch} sp={sp} onGate={startPost} onWarm={warmDone} />
      <Curtain sp={sp} />
      <Flash />
      <CompileGate onDone={openGate} />
      <Rig progress={progress} sp={sp} bloomRef={bloomRef} blur={fx > 0 && postOn ? blur : null} />

      {fx > 0 && postOn && (
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom ref={bloomRef} luminanceThreshold={0.86} luminanceSmoothing={0.3} intensity={0.9} radius={0.65} mipmapBlur />
          <primitive object={blur} />
          <ChromaticAberration offset={aberration} radialModulation modulationOffset={0.35} />
          <Vignette offset={0.22} darkness={0.72} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
