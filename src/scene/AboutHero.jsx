import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor, useAnimations, useGLTF } from '@react-three/drei';
import { Bloom, EffectComposer, SMAA, Vignette } from '@react-three/postprocessing';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { MEDIA } from '../data/media';
import { isTouch } from '../lib/device';
import { resolveAsset } from '../lib/assets';
import { whenShown } from '../lib/ready';
import { seeded } from '../lib/three-utils';
import { scrollState } from '../lib/scroll';

const BACK_V = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }';
const BACK_F = `
uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uIntro; uniform float uScroll;
varying vec2 vUv;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * noise(p); p = p * 2.03 + 11.7; a *= .5; } return s; }
float ridge(float x, float seed, float freq){ float n = fbm(vec2(x * freq + seed, seed * 1.7)); return 1. - abs(2. * n - 1.); }

void main(){
  vec2 uv = vUv;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - .5) * asp, uv.y - .5);
  float bx = uMouse.x * .06;
  float beamK = smoothstep(0., 1., uIntro);

  // sky and stars
  vec3 col = mix(vec3(.004, .007, .016), vec3(.028, .045, .075), pow(1. - uv.y, 1.6));
  vec2 sp = floor(uv * uRes / 2.6);
  float h = hash(sp);
  col += step(.9988, h) * (.35 + .65 * hash(sp + 1.7)) * smoothstep(.3, .9, uv.y) * (.7 + .3 * sin(uTime * 2. + h * 40.));

  // volumetric beam: narrow at the cloud, wide at the ground
  float dx = abs(p.x - bx);
  float spread = mix(.15, .012, smoothstep(.12, .62, uv.y));
  float core = exp(-pow(dx / spread, 2.));
  float dust = fbm(vec2(p.x * 7. + uTime * .03, uv.y * 3. - uTime * .06));
  float beamTop = smoothstep(.72, .58, uv.y) * smoothstep(.05, .22, uv.y + .06);
  float beam = core * (.22 + .78 * smoothstep(.62, .16, uv.y)) * (.7 + .5 * dust) * beamTop * beamK;
  vec3 beamCol = vec3(.72, .86, 1.) * beam * .8;

  // three mountain layers (back to front)
  float lit = exp(-pow(dx / .42, 2.));
  for (int k = 0; k < 3; k++){
    float fk = float(k);
    float base = .2 + fk * .043;
    float amp = .17 - fk * .03;
    float hh = base + amp * ridge(p.x * (.9 + fk * .45) + fk * 3.1 + uScroll * .02 * (1. + fk), 2. + fk * 5.3, 1.3 + fk * .55);
    float inside = smoothstep(.002, -.002, uv.y - hh);
    float depth = fk / 2.;
    vec3 rock = mix(vec3(.025, .032, .045), vec3(.005, .007, .011), depth);
    float shade = fbm(vec2(p.x * 9., uv.y * 11. + fk * 4.)) * .5 + .25;
    rock *= .6 + shade;
    float rim = smoothstep(.018, 0., abs(uv.y - hh)) * (.12 + lit * 1.4);
    col = mix(col, rock + vec3(.5, .72, 1.) * rim * (.5 + depth * .3), inside);
    col += vec3(.04, .06, .09) * smoothstep(.12, 0., uv.y - hh) * (1. - inside) * (1. - depth) * .5;
  }

  // snow plain in front, lit by the beam
  float ground = smoothstep(.215, .19, uv.y);
  float ripple = fbm(vec2(p.x * 5., uv.y * 22.));
  float pool = exp(-pow(dx / .34, 2.)) * smoothstep(.2, .05, uv.y);
  vec3 snow = vec3(.02, .028, .04) + vec3(.5, .62, .8) * pool * (.3 + .6 * ripple) * beamK * .55;
  col = mix(col, snow, ground);

  // haze at the horizon
  col += vec3(.03, .05, .08) * smoothstep(.26, .15, uv.y) * smoothstep(.05, .18, uv.y) * (.4 + .6 * lit);
  col += beamCol;
  col += vec3(.7, .85, 1.) * exp(-pow(length(vec2(dx, uv.y - .58)) / .05, 2.)) * .3 * beamK;

  float v = smoothstep(1.2, .25, length(p * vec2(.75, 1.05)));
  col *= .35 + .65 * v;
  gl_FragColor = vec4(col, 1.);
}`;

const CLOUD_V = `
uniform float uTime; uniform vec3 uPointer; uniform float uPx; uniform float uIntro; uniform float uSwirl;
attribute vec4 aSeed; varying float vA; varying float vH;
vec3 curl(vec3 p){
  float t = uTime * .22;
  return vec3(sin(p.y * 1.7 + t) + cos(p.z * 1.3 - t), sin(p.z * 1.6 + t * 1.2) + cos(p.x * 1.4), sin(p.x * 1.5 - t) + cos(p.y * 1.2 + t));
}
void main(){
  vec3 p = position;
  // one shared, slowly turning disc: inner parts turn faster, so the arms keep winding
  float r = length(p.xz);
  float ang = uTime * .22 / (.45 + r) * (1. + uSwirl);
  float c = cos(ang), s = sin(ang);
  p.xz = mat2(c, -s, s, c) * p.xz;
  p += curl(p * (.9 + aSeed.x * .3)) * (.03 + aSeed.y * .05);
  float pulse = 1. + .03 * sin(uTime * .8 + aSeed.z * 6.28);
  p *= pulse * mix(.2, 1., uIntro);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec3 away = wp.xyz - uPointer;
  float d = length(away.xy);
  wp.xyz += normalize(vec3(away.xy, .35) + 1e-4) * smoothstep(1.5, 0., d) * 1.0;
  vec4 mv = viewMatrix * wp;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (.55 + aSeed.w * 1.7) * (8. / -mv.z);
  vA = (.35 + .65 * aSeed.y) * (.7 + .3 * sin(uTime * 1.5 + aSeed.z * 30.)) * uIntro;
  vH = aSeed.x;
}`;
const CLOUD_F = `
varying float vA; varying float vH;
void main(){
  float d = length(gl_PointCoord - .5) * 2.;
  if (d > 1.) discard;
  float a = pow(1. - d, 1.6) * vA;
  vec3 c = mix(vec3(.74, .88, 1.), vec3(1., .92, .75), step(.9, vH));
  gl_FragColor = vec4(c * (.45 + a * .9), a * .5);
}`;

function Cloud({ touch }) {
  const { geo } = useMemo(() => {
    const rnd = seeded(31);
    const n = touch ? 2200 : 5600;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 4);
    const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.9;
    for (let i = 0; i < n; i++) {
      // three spiral arms around a dense bulge, thin like a disc
      if (rnd() < 0.2) {
        const u = rnd() * Math.PI * 2;
        const v = Math.acos(2 * rnd() - 1);
        const r = Math.pow(rnd(), 0.6) * 0.36;
        pos.set([Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r * 0.7, Math.sin(v) * Math.sin(u) * r], i * 3);
      } else {
        const arm = Math.floor(rnd() * 3);
        const r = Math.pow(rnd(), 0.75) * 1.3 + 0.05;
        const a = r * 2.3 + (arm * Math.PI * 2) / 3 + gauss() * (0.12 + r * 0.32);
        pos.set([Math.cos(a) * r, gauss() * 0.09 * (1.4 - r * 0.6), Math.sin(a) * r], i * 3);
      }
      seed.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    return { geo: g };
  }, [touch]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CLOUD_V,
        fragmentShader: CLOUD_F,
        uniforms: { uTime: { value: 0 }, uPointer: { value: new THREE.Vector3(9, 9, 0) }, uPx: { value: touch ? 4 : 6.5 }, uIntro: { value: 0 }, uSwirl: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [touch]
  );
  const uniforms = mat.uniforms;
  const intro = useRef(0);
  const ready = useRef(false);
  useEffect(() => whenShown(() => (ready.current = true)), []);
  useFrame((s, dt) => {
    uniforms.uTime.value = s.clock.elapsedTime;
    if (ready.current) intro.current = Math.min(1, intro.current + dt * 0.55);
    uniforms.uIntro.value = 1 - Math.pow(1 - intro.current, 3);
    uniforms.uSwirl.value = Math.min(Math.abs(scrollState.velocity) * 0.04, 2);
    uniforms.uPointer.value.set((s.pointer.x * s.viewport.width) / 2, (s.pointer.y * s.viewport.height) / 2, 0);
  });
  return (
    <points position={[0, 1.5, 0]} scale={0.86} rotation={[0.95, 0, 0.28]} geometry={geo} material={mat} frustumCulled={false} renderOrder={4} />
  );
}

const DEBRIS_V = `uniform float uTime; uniform float uPx; attribute vec4 aSeed; varying float vA;
void main(){
  vec3 p = position;
  float t = uTime * (.05 + aSeed.w * .08);
  p.x += sin(t + aSeed.x * 6.28) * .5;
  p.y += cos(t * 1.3 + aSeed.y * 6.28) * .35 - fract(uTime * .02 * (.5 + aSeed.z) + aSeed.x) * .8;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (.5 + aSeed.z * 2.) * (8. / -mv.z);
  vA = .35 + .65 * aSeed.y;
}`;
const DEBRIS_F = `varying float vA; void main(){ float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard; gl_FragColor = vec4(vec3(.62, .72, .86) * (1. - d * .5), vA * (1. - d * d)); }`;

function Debris({ touch }) {
  const { geo, mat } = useMemo(() => {
    const rnd = seeded(77);
    const n = touch ? 40 : 110;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos.set([(rnd() - 0.5) * 9, rnd() * 3.2 - 0.4, (rnd() - 0.5) * 3], i * 3);
      seed.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const m = new THREE.ShaderMaterial({ vertexShader: DEBRIS_V, fragmentShader: DEBRIS_F, uniforms: { uTime: { value: 0 }, uPx: { value: touch ? 6 : 8 } }, transparent: true, depthWrite: false });
    return { geo: g, mat: m };
  }, [touch]);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={3} />;
}

function Backdrop() {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: BACK_V, fragmentShader: BACK_F, uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2() }, uIntro: { value: 0 }, uScroll: { value: 0 } }, depthWrite: false, depthTest: false }),
    []
  );
  const intro = useRef(0);
  const ready = useRef(false);
  useEffect(() => whenShown(() => (ready.current = true)), []);
  const { size, gl } = useThree();
  useFrame((s, dt) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uRes.value.set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio());
    mat.uniforms.uMouse.value.lerp(s.pointer, 0.05);
    if (ready.current) intro.current = Math.min(1, intro.current + dt * 0.7);
    mat.uniforms.uIntro.value = intro.current;
    mat.uniforms.uScroll.value = scrollState.y / 80;
  });
  return (
    <mesh material={mat} renderOrder={-10} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

function Hero() {
  const group = useRef();
  const { scene, animations } = useGLTF(MEDIA.navigator);
  const model = useMemo(() => {
    const m = skeletonClone(scene);
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    const k = 1 / Math.max(size.y, 0.001);
    const c = box.getCenter(new THREE.Vector3());
    m.userData.fit = { k, c, h: size.y };
    m.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      const name = (o.material?.name || '').toLowerCase();
      if (name.includes('main')) o.material = new THREE.MeshStandardMaterial({ color: '#eef3fb', roughness: 0.3, metalness: 0.08, envMapIntensity: 1 });
      else if (name.includes('black')) o.material = new THREE.MeshStandardMaterial({ color: '#05080c', roughness: 0.15, metalness: 0.8, emissive: '#00f5d4', emissiveIntensity: 0.3 });
      else o.material = new THREE.MeshStandardMaterial({ color: '#232a35', roughness: 0.35, metalness: 0.8 });
    });
    return m;
  }, [scene]);
  const holder = useRef();
  const { actions } = useAnimations(animations, holder);
  useEffect(() => {
    const a = actions.Idle;
    if (a) a.reset().play();
    return () => a?.stop();
  }, [actions]);
  return (
    <group ref={group} position={[0.15, -0.98, 0.2]} scale={0.8}>
      <group scale={model.userData.fit.k}>
        <group position={[-model.userData.fit.c.x, -model.userData.fit.c.y, -model.userData.fit.c.z]}>
          <group ref={holder}>
            <primitive object={model} />
          </group>
        </group>
      </group>
    </group>
  );
}

function Frames({ onReady }) {
  const n = useRef(0);
  useFrame(() => {
    if (++n.current === 5) onReady();
  });
  return null;
}

export default function AboutHero() {
  const touch = useRef(isTouch()).current;
  const box = useRef(null);
  const [visible, setVisible] = useState(true);
  const [fx, setFx] = useState(!touch);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 1.75));

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="sl-ah-canvas" ref={box}>
      <Canvas camera={{ position: [0, 0.4, 9], fov: 34, near: 0.1, far: 60 }} dpr={dpr} gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }} frameloop={visible ? 'always' : 'never'}>
        <PerformanceMonitor
          flipflops={2}
          onDecline={() => {
            if (dpr > 1.1) setDpr(1);
            else setFx(false);
          }}
        />
        <Backdrop />
        <ambientLight intensity={0.5} />
        <spotLight position={[0.2, 6, 2.5]} angle={0.35} penumbra={0.8} intensity={90} color="#cfe6ff" distance={14} decay={2} />
        <Debris touch={touch} />
        <Cloud touch={touch} />
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <Hero />
          </Suspense>
        </ErrorBoundary>
        <Frames onReady={() => resolveAsset('about')} />
        {fx && (
          <EffectComposer disableNormalPass multisampling={0}>
            <Bloom luminanceThreshold={0.78} luminanceSmoothing={0.4} intensity={0.7} radius={0.65} mipmapBlur />
            <Vignette offset={0.25} darkness={0.55} />
            <SMAA />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
