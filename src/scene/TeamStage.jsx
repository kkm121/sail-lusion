import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { seeded } from '../lib/three-utils';
import { isTouch } from '../lib/device';

const W = 5.1;
const H = 2.2;

function splitLines(name) {
  const words = name.toUpperCase().split(' ').filter(Boolean);
  if (words.length < 2) return [words[0] || ''];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ').length;
    const b = words.slice(i).join(' ').length;
    if (Math.abs(a - b) < bestDiff) {
      bestDiff = Math.abs(a - b);
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

// Dots sampled from the member's name, set in the site font: one unique cloud per person.
function nameShape(name, count, seed) {
  const w = 1400;
  const h = 560;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const lines = splitLines(name);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const family = '"Space Grotesk Variable", "Space Grotesk", sans-serif';
  let size = 320;
  ctx.font = `700 ${size}px ${family}`;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  size = Math.min((size * w * 0.94) / widest, (h * 0.96) / (lines.length * 1.0));
  ctx.font = `700 ${size}px ${family}`;
  lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.0 + size * 0.04));
  const data = ctx.getImageData(0, 0, w, h).data;
  const cand = [];
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (data[(y * w + x) * 4 + 3] > 128) cand.push(x, y);
    }
  }
  const rnd = seeded(seed);
  const out = new Float32Array(count * 3);
  const n = cand.length / 2;
  for (let i = 0; i < count; i++) {
    const k = n ? Math.floor(rnd() * n) * 2 : 0;
    const x = (cand[k] ?? w / 2) + (rnd() - 0.5) * 3;
    const y = (cand[k + 1] ?? h / 2) + (rnd() - 0.5) * 3;
    out[i * 3] = ((x - w / 2) / (w / 2)) * W;
    out[i * 3 + 1] = -((y - h / 2) / (h / 2)) * H;
    out[i * 3 + 2] = (rnd() - 0.5) * 0.18;
  }
  return out;
}

const DOT_V = `
uniform float uT; uniform float uTime; uniform vec3 uPointer; uniform float uPx; uniform float uHue; uniform float uIn;
attribute vec3 aTo; attribute vec4 aSeed; varying float vA; varying vec3 vCol;
void main(){
  float e = smoothstep(aSeed.x * .5, aSeed.x * .5 + .5, uT);
  vec3 p = mix(position, aTo, e);
  float mid = sin(e * 3.14159);
  p += vec3(sin(aSeed.y * 6.28 + uTime), cos(aSeed.z * 6.28 + uTime * 1.1), sin(aSeed.w * 6.28 + uTime * .7)) * mid * 1.5;
  p += vec3(sin(uTime * .8 + aSeed.y * 30.), cos(uTime * .9 + aSeed.z * 30.), sin(uTime * .6 + aSeed.w * 20.)) * .014;
  p *= mix(.86, 1., uIn);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec3 away = wp.xyz - uPointer;
  float d = length(away.xy);
  wp.xyz += normalize(vec3(away.xy, .35) + 1e-4) * smoothstep(1.1, 0., d) * .5;
  vec4 mv = viewMatrix * wp;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (.62 + aSeed.w * .9) * (7. / -mv.z);
  vA = (.5 + .5 * aSeed.y) * (.75 + .25 * sin(uTime * 2. + aSeed.z * 40.)) * uIn;
  vCol = mix(vec3(.66, .86, 1.), vec3(1., .86, .45), uHue);
}`;
const DOT_F = `varying float vA; varying vec3 vCol; void main(){ float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard; float a = (1. - d * d) * vA; gl_FragColor = vec4(vCol * (.8 + a * 1.4), a); }`;

const RAIN_V = `uniform float uTime; uniform float uPx; attribute vec4 aSeed; varying float vA;
void main(){
  vec3 p = position;
  float sp = .25 + aSeed.y * .7;
  p.y = 3.2 - mod(aSeed.x * 6.4 + uTime * sp, 6.4);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (.5 + aSeed.z) * (7. / -mv.z);
  float head = aSeed.w;
  vA = (.1 + .5 * pow(max(sin(uTime * 1.3 + aSeed.x * 20.), 0.), 3.)) * (.4 + head);
}`;
const RAIN_F = `varying float vA; void main(){ float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard; gl_FragColor = vec4(vec3(.6, .8, 1.) * 1.2, vA * (1. - d)); }`;

function Dots({ shapes, idxRef, touch, active }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = shapes[0].length / 3;
    const rnd = seeded(5);
    const seed = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) seed.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(shapes[0]), 3));
    g.setAttribute('aTo', new THREE.BufferAttribute(new Float32Array(shapes[1] || shapes[0]), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    return g;
  }, [shapes]);
  // The material is built here and handed over as an object: passing a uniforms prop would give the material its own copy.
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DOT_V,
        fragmentShader: DOT_F,
        uniforms: { uT: { value: 0 }, uTime: { value: 0 }, uPointer: { value: new THREE.Vector3(9, 9, 0) }, uPx: { value: touch ? 4.4 : 5.6 }, uHue: { value: 0 }, uIn: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [touch]
  );
  const uniforms = mat.uniforms;
  const cur = useRef(-1);
  const inK = useRef(0);
  const pts = useRef();
  useFrame((s, dt) => {
    const { idx, frac, creatorIdx } = idxRef.current;
    uniforms.uTime.value = s.clock.elapsedTime;
    // Fit the name to the screen: about four fifths of the width, never larger than the design size.
    const fit = Math.min(1, (s.viewport.width * 0.8) / (2 * W * 0.94));
    if (pts.current) {
      pts.current.scale.setScalar(fit);
      pts.current.position.set(-0.05 * s.viewport.width * 0.1, s.viewport.height * 0.06, 0);
    }
    uniforms.uPointer.value.set(((s.pointer.x * s.viewport.width) / 2 - (pts.current ? pts.current.position.x : 0)) / fit, ((s.pointer.y * s.viewport.height) / 2 - (pts.current ? pts.current.position.y : 0)) / fit, 0);
    if (idx !== cur.current) {
      cur.current = idx;
      const a = geo.getAttribute('position');
      const b = geo.getAttribute('aTo');
      a.array.set(shapes[idx]);
      b.array.set(shapes[Math.min(idx + 1, shapes.length - 1)]);
      a.needsUpdate = true;
      b.needsUpdate = true;
    }
    uniforms.uT.value = THREE.MathUtils.smoothstep(frac, 0.5, 1);
    inK.current = Math.min(1, inK.current + dt * (active.current ? 0.8 : -0.8));
    inK.current = Math.max(0, inK.current);
    uniforms.uIn.value = inK.current * inK.current * (3 - 2 * inK.current);
    const hueA = idx === creatorIdx ? 1 : 0;
    const hueB = idx + 1 === creatorIdx ? 1 : 0;
    uniforms.uHue.value = THREE.MathUtils.lerp(hueA, hueB, uniforms.uT.value);
    s.camera.position.x += (s.pointer.x * 0.25 - s.camera.position.x) * 0.04;
    s.camera.position.y += (s.pointer.y * 0.15 - s.camera.position.y) * 0.04;
    s.camera.lookAt(0, 0, 0);
  });
  return (
    <points ref={pts} geometry={geo} material={mat} frustumCulled={false} />
  );
}

function Rain({ touch }) {
  const { geo, mat } = useMemo(() => {
    const rnd = seeded(11);
    const cols = touch ? 20 : 46;
    const per = touch ? 6 : 12;
    const n = cols * per;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 4);
    for (let c = 0; c < cols; c++) {
      const x = (rnd() * 2 - 1) * 6.8;
      const z = -rnd() * 4;
      const phase = rnd();
      const speed = rnd();
      for (let k = 0; k < per; k++) {
        const i = c * per + k;
        pos.set([x + (rnd() - 0.5) * 0.02, 0, z], i * 3);
        // trailing dots share the column's speed and are offset along y
        seed.set([phase + k * 0.014, speed, rnd(), 1 - k / per], i * 4);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const m = new THREE.ShaderMaterial({ vertexShader: RAIN_V, fragmentShader: RAIN_F, uniforms: { uTime: { value: 0 }, uPx: { value: touch ? 5 : 7 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    return { geo: g, mat: m };
  }, [touch]);
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime));
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

export default function TeamStage({ names, idxRef, creatorIdx, active }) {
  const touch = useRef(isTouch()).current;
  const [shapes, setShapes] = useState(null);
  const [fx, setFx] = useState(!touch);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.25));
  const [visible, setVisible] = useState(true);
  const box = useRef(null);

  useEffect(() => {
    let dead = false;
    const build = () => {
      const count = touch ? 5000 : 10000;
      const list = names.map((n, i) => nameShape(n, count, 100 + i * 7));
      if (!dead) setShapes(list);
    };
    // The shapes are drawn with the site font, so wait for it.
    Promise.race([document.fonts.load('700 120px "Space Grotesk Variable"'), new Promise((r) => setTimeout(r, 1500))]).then(build);
    return () => {
      dead = true;
    };
  }, [names, touch]);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  idxRef.current.creatorIdx = creatorIdx;
  return (
    <div className="sl-ts-canvas" ref={box}>
      {shapes && (
        <Canvas camera={{ position: [0, 0, 7], fov: 30, near: 0.1, far: 40 }} dpr={dpr} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }} frameloop={visible ? 'always' : 'never'}>
          <PerformanceMonitor
            flipflops={2}
            onDecline={() => {
              if (dpr > 1.1) setDpr(1);
              else setFx(false);
            }}
          />
          <Rain touch={touch} />
          <Dots shapes={shapes} idxRef={idxRef} touch={touch} active={active} />
          {fx && (
            <EffectComposer disableNormalPass multisampling={0}>
              <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.5} intensity={0.9} radius={0.6} mipmapBlur />
              <Vignette offset={0.25} darkness={0.5} />
            </EffectComposer>
          )}
        </Canvas>
      )}
    </div>
  );
}
