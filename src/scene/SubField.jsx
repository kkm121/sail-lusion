import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { resolveAsset } from '../lib/assets';
import { whenShown } from '../lib/ready';

// A slow domain-warped field of light filaments for the top of the inner pages: one full-screen quad,
// no post-processing, drawn at reduced resolution because it is all soft gradients.
const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }';
const FRAG = `
precision highp float;
uniform float uTime; uniform float uIntro; uniform vec2 uRes; uniform vec2 uPointer; uniform vec3 uA; uniform vec3 uB;
varying vec2 vUv;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm3(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 3; i++){ s += a * noise(p); p = p * 2.03 + 7.3; a *= .5; } return s; }
float fbm4(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * noise(p); p = p * 2.03 + 7.3; a *= .5; } return s; }

void main(){
  vec2 uv = vUv;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - .5) * vec2(asp, 1.) * mix(2.5, 1.75, uIntro);
  p += uPointer * .1;
  float t = uTime * .05;
  vec2 q = vec2(fbm3(p + t), fbm3(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm3(p * 1.1 + 2.6 * q + vec2(1.7, 9.2) + t * 1.3), fbm3(p * 1.1 + 2.6 * q + vec2(8.3, 2.8) - t));
  float f = fbm4(p + 2.8 * r);

  // contour lines of the flowing field, bright where the field is high, like silk threads
  float cl = f * 12. + uTime * .06;
  float d = abs(fract(cl) - .5);
  float line = 1. - smoothstep(0., .07, d);
  float fine = 1. - smoothstep(0., .035, abs(fract(cl * 3.) - .5));
  float mask = smoothstep(.16, .66, f) * (.6 + .4 * q.y) * (.42 + .58 * smoothstep(.12, .78, uv.x));
  vec3 tint = mix(uA, uB, clamp(uv.x * .9 + (q.x - .5) * .8, 0., 1.));
  vec3 col = vec3(.008, .012, .03);
  col += tint * (line * 1.05 + fine * .3) * mask;
  col += tint * pow(f, 3.4) * .3;
  col += uB * (1. - smoothstep(0., .12, abs(f - .6))) * .16;
  // a wide soft glow on the right, away from the text
  float g = exp(-pow(length((uv - vec2(.8, .42)) * vec2(1., .85)) / .46, 2.));
  col += mix(uA, uB, .55) * g * .2;

  // a pool of light that follows the pointer
  vec2 m = uv - (uPointer * .5 + .5);
  col += mix(uA, uB, .4) * exp(-dot(m, m) * 11.) * .12;

  // a few stars
  vec2 cell = uv * uRes / 3.2;
  float h = hash(floor(cell));
  float star = step(.9984, h) * smoothstep(.5, .05, length(fract(cell) - .5));
  col += vec3(.8, .9, 1.) * star * (.35 + .65 * hash(floor(cell) + 3.1)) * (.7 + .3 * sin(uTime * 1.6 + h * 60.)) * (1. - smoothstep(.6, 1., uv.y) * .4);

  // blend into the page colour at the bottom and darken the top under the header
  vec3 page = vec3(.012, .02, .047);
  col = mix(page, col, smoothstep(0., .34, uv.y));
  col *= mix(.55, 1., smoothstep(1., .72, uv.y));
  float v = smoothstep(1.25, .35, length((uv - .5) * vec2(.8, 1.1)));
  col *= .3 + .7 * v;
  gl_FragColor = vec4(mix(page, col, uIntro), 1.);
}`;

function Field({ accent, accent2 }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uIntro: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
          uPointer: { value: new THREE.Vector2() },
          uA: { value: new THREE.Color(accent) },
          uB: { value: new THREE.Color(accent2 || accent) },
        },
        depthWrite: false,
        depthTest: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const u = mat.uniforms;
  const target = useMemo(() => {
    const a = new THREE.Color(accent);
    // The second colour sits a step away on the colour wheel; reds and pinks turn toward purple so they never drift into gold.
    const hsl = { h: 0, s: 0, l: 0 };
    a.getHSL(hsl);
    const b = accent2 ? new THREE.Color(accent2) : new THREE.Color(accent).offsetHSL(hsl.h > 0.8 || hsl.h < 0.12 ? -0.13 : 0.13, -0.05, -0.06);
    return { a, b };
  }, [accent, accent2]);
  const intro = useRef(0);
  const ready = useRef(false);
  useEffect(() => whenShown(() => (ready.current = true)), []);
  const { size, gl } = useThree();
  useFrame((s, dt) => {
    u.uTime.value = s.clock.elapsedTime;
    u.uRes.value.set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio());
    u.uPointer.value.lerp(s.pointer, 0.04);
    if (ready.current) intro.current = Math.min(1, intro.current + dt * 0.55);
    u.uIntro.value = 1 - Math.pow(1 - intro.current, 3);
    const k = 1 - Math.exp(-dt * 3.2);
    u.uA.value.lerp(target.a, k);
    u.uB.value.lerp(target.b, k);
  });
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <mesh material={mat} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

function Frames({ onReady }) {
  const n = useRef(0);
  useFrame(() => {
    if (++n.current === 4) onReady();
  });
  return null;
}

export default function SubField({ accent = '#00f5d4', accent2 }) {
  const box = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '5% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="sl-sh-canvas" ref={box}>
      <Canvas
        camera={{ position: [0, 0, 1], fov: 30 }}
        dpr={0.8}
        gl={{ antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' }}
        frameloop={visible ? 'always' : 'never'}
      >
        <Field accent={accent} accent2={accent2} />
        <Frames onReady={() => resolveAsset('sub')} />
      </Canvas>
    </div>
  );
}
