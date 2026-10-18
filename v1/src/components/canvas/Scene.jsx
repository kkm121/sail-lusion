import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import { AmieeCore } from './AmieeCore';
import { WebGLFallbackBlob } from './WebGLFallbackBlob';
import { ErrorBoundary } from './ErrorBoundary';
import { isTouchDevice } from '../../lib/device';

const PARAMS = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const LITE = PARAMS.has('lite');
const DEBUG = PARAMS.has('debug');
const FORCE_POST = PARAMS.has('post');
const NO_POST = PARAMS.has('nopost');
const NO_SPARKLES = PARAMS.has('nosparkles');
const PLAIN_GLASS = PARAMS.has('plainglass');

const TIERS = {
  high: { maxDpr: 1.25, pixelBudget: 3e6 },
  low: { maxDpr: 1.1, pixelBudget: 1.1e6 },
  mobile: { maxDpr: 1.25, pixelBudget: 1.6e6 },
  lite: { maxDpr: 1, pixelBudget: 0.8e6 },
};

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2'))
    );
  } catch {
    return false;
  }
}

function isCapableDevice() {
  const memory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 8;
  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 8;
  return memory >= 6 && cores >= 6;
}

function detectBaseTier() {
  if (isTouchDevice()) return 'lite';
  const limitedMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
  return window.innerWidth < 768 || limitedMemory ? 'low' : 'high';
}

function computeDpr(tier) {
  const { maxDpr, pixelBudget } = TIERS[tier];
  const area = Math.max(window.innerWidth * window.innerHeight, 1);
  const fit = Math.sqrt(pixelBudget / area);
  const floor = tier === 'high' ? 1 : 0.5;
  return Math.max(floor, Math.min(window.devicePixelRatio || 1, maxDpr, fit));
}

function debugStore() {
  if (!window.__sailDebug) window.__sailDebug = {};
  return window.__sailDebug;
}

function ReadySignal({ onReady }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current >= 3) {
      done.current = true;
      if (DEBUG) debugStore().readyAt = Math.round(performance.now());
      onReady?.();
    }
  });
  return null;
}

function EnvironmentTimer() {
  useEffect(() => {
    if (DEBUG) debugStore().envAt = Math.round(performance.now());
  }, []);
  return null;
}

function EnvironmentFade({ target }) {
  const scene = useThree((state) => state.scene);
  const progress = useRef(0);
  useFrame((state, delta) => {
    if (progress.current >= 1) return;
    progress.current = Math.min(progress.current + Math.min(delta, 0.05) / 1.4, 1);
    scene.environmentIntensity = target * progress.current * progress.current * (3 - 2 * progress.current);
  });
  return null;
}

function DebugProbe() {
  const gl = useThree((state) => state.gl);
  useFrame((state, delta) => {
    const store = debugStore();
    store.frames = (store.frames || 0) + 1;
    store.calls = gl.info.render.calls;
    store.maxGapMs = Math.max(store.maxGapMs || 0, Math.round(delta * 1000));
    if (gl.info.render.calls === 0) store.zeroDraw = (store.zeroDraw || 0) + 1;
    const size = `${gl.domElement.width}x${gl.domElement.height}`;
    store.sizes = store.sizes || [];
    if (store.sizes[store.sizes.length - 1] !== size) store.sizes.push(size);
  });
  return null;
}

export function Scene({ themeColor = '#00F5D4', onReady }) {
  const [hasWebGL] = useState(isWebGLAvailable);
  const [baseTier, setBaseTier] = useState(detectBaseTier);
  const [contextLosses, setContextLosses] = useState(0);
  const touch = useRef(isTouchDevice()).current;
  const capable = useRef(isCapableDevice()).current;

  let tier = LITE || contextLosses >= 2 ? 'lite' : baseTier;
  if (tier === 'high' && contextLosses >= 1) tier = 'low';

  const usePost = !LITE && !NO_POST && tier !== 'lite' && (touch ? FORCE_POST : true);
  const full = tier === 'high' || (tier === 'mobile' && capable);
  const [dpr, setDpr] = useState(() => computeDpr(tier));

  useEffect(() => {
    if (!isWebGLAvailable()) onReady?.();
  }, [onReady]);

  useEffect(() => {
    let timer = 0;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setBaseTier(detectBaseTier());
        setDpr(computeDpr(tier));
      }, 250);
    };
    setDpr(computeDpr(tier));
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', update);
    };
  }, [tier]);

  useEffect(() => {
    if (!DEBUG) return;
    const store = debugStore();
    store.tier = tier;
    store.dpr = dpr;
    store.losses = contextLosses;
    store.post = usePost;
    store.full = full;
  }, [tier, dpr, contextLosses, usePost, full]);

  const handleCreated = useCallback(({ gl }) => {
    const element = gl.domElement;
    element.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      setContextLosses((count) => count + 1);
    });
    element.addEventListener('webglcontextrestored', () => {
      if (DEBUG) debugStore().restores = (debugStore().restores || 0) + 1;
    });
  }, []);

  if (!hasWebGL) {
    return <WebGLFallbackBlob themeColor={themeColor} />;
  }

  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none" style={{ height: '100lvh' }}>
      <ErrorBoundary fallback={<WebGLFallbackBlob themeColor={themeColor} />}>
        <Canvas
          camera={{ position: [0, 0, 7.8], fov: 42 }}
          gl={{
            antialias: tier === 'high',
            alpha: false,
            powerPreference: 'high-performance',
          }}
          dpr={dpr}
          flat={!usePost}
          resize={{ scroll: false, debounce: { scroll: 0, resize: 250 } }}
          onCreated={handleCreated}
        >

          <color attach="background" args={['#030407']} />

          <ambientLight intensity={0.25} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />

          <Suspense fallback={null}>
            <Environment preset="city" environmentIntensity={0} />
            <EnvironmentFade target={0.7} />
            <EnvironmentTimer />
          </Suspense>

          <Suspense fallback={null}>
            <AmieeCore
              themeColor={themeColor}
              quality={tier}
              glow={!usePost}
              full={full}
              sparkles={tier !== 'lite' && !NO_SPARKLES}
              plainGlass={PLAIN_GLASS}
            />
            <ReadySignal onReady={onReady} />
          </Suspense>

          {DEBUG && <DebugProbe />}

          {usePost && (
            <EffectComposer disableNormalPass multisampling={0}>
              <Bloom
                luminanceThreshold={tier === 'high' ? 0.5 : 0.7}
                luminanceSmoothing={0.8}
                intensity={tier === 'high' ? 0.85 : 0.5}
                radius={tier === 'high' ? 0.65 : 0.55}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
