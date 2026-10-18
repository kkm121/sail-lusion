import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { precompile } from '../lib/three-utils';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';
import { canGL } from '../lib/device';
import { labState } from '../scene/shared';

const VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}';

const SIM = `
uniform sampler2D t;
uniform vec2 m; uniform vec2 pm;
uniform vec2 texel;
uniform float asp; uniform float rad;
varying vec2 vUv;
void main(){
  vec2 u = vUv;
  vec4 c = texture2D(t, u);
  vec4 a = texture2D(t, u - c.gb * 0.012);
  float n = texture2D(t, u + vec2(texel.x, 0.)).r + texture2D(t, u - vec2(texel.x, 0.)).r
          + texture2D(t, u + vec2(0., texel.y)).r + texture2D(t, u - vec2(0., texel.y)).r;
  float h = mix(a.r, n * 0.25, 0.5) * 0.962;
  vec2 f = a.gb * 0.93;
  vec2 P = u * vec2(asp, 1.), A = pm * vec2(asp, 1.), B = m * vec2(asp, 1.);
  vec2 pa = P - A, ba = B - A;
  float bl = length(ba);
  float s = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0., 1.);
  float d = length(pa - ba * s);
  float k = smoothstep(rad, 0., d);
  float mv = min(bl * 45., 1.);
  h += k * 0.36 * mv;
  vec2 dir = ba / max(bl, 1e-4);
  f += dir * k * mv * 0.5;
  h = h > 0. ? min(h, 3.) : 0.;
  f = clamp(f, vec2(-2.), vec2(2.));
  if (!(f.x == f.x) || !(f.y == f.y)) f = vec2(0.);
  gl_FragColor = vec4(h, f, 1.);
}`;

const OUT = `
uniform sampler2D t;
uniform vec2 texel;
uniform float time;
varying vec2 vUv;
void main(){
  vec2 u = vUv;
  float h = texture2D(t, u).r;
  if (h < 0.045) { gl_FragColor = vec4(0.); return; }
  vec2 e = texel * 1.7;
  float hx = texture2D(t, u + vec2(e.x, 0.)).r - texture2D(t, u - vec2(e.x, 0.)).r;
  float hy = texture2D(t, u + vec2(0., e.y)).r - texture2D(t, u - vec2(0., e.y)).r;
  float cov = smoothstep(0.045, 0.2, h);
  vec3 n = normalize(vec3(-hx * 2.4, -hy * 2.4, 0.4));
  float fr = clamp(1.0 - n.z, 0.0, 1.0);
  float fres = fr * sqrt(fr);
  vec3 film = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + fres * 1.1 + n.x * 0.8 + n.y * 0.35 + time * 0.03));
  vec3 base = mix(vec3(0.0, 0.96, 0.83), vec3(0.55, 0.36, 0.96), smoothstep(-0.55, 0.55, n.x + n.y * 0.4 + 0.1));
  float ny = max(n.y, 0.0);
  vec3 gold = vec3(0.96, 0.78, 0.29) * ny * ny * ny;
  vec3 col = mix(base, film, 0.5) + gold * 0.7;
  vec3 L = vec3(-0.4, 0.62, 0.68);
  float dl = max(dot(n, L), 0.0);
  float d2 = dl * dl;
  float d4 = d2 * d2;
  float d8 = d4 * d4;
  float d16 = d8 * d8;
  float d32 = d16 * d16;
  float spec = d32 * d16 * d8 * d4 * 0.95;
  float a = clamp(cov * (0.24 + fres * 1.15) + spec * cov, 0.0, 0.9) * 0.78;
  vec3 rgb = (col * a + vec3(1.0) * spec * cov * 0.6) * 0.78;
  gl_FragColor = vec4(rgb, a);
}`;

export default function LiquidOverlay() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canGL() || window.matchMedia('(max-width: 767px)').matches) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.PlaneGeometry(2, 2);
    const type = renderer.capabilities.isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const mk = (w, h) => new THREE.WebGLRenderTarget(w, h, { type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
    let a = null;
    let b = null;

    const sim = new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: SIM,
      depthTest: false,
      uniforms: {
        t: { value: null },
        m: { value: new THREE.Vector2(0.5, 0.5) },
        pm: { value: new THREE.Vector2(0.5, 0.5) },
        texel: { value: new THREE.Vector2(1, 1) },
        asp: { value: 1 },
        rad: { value: 0.075 },
      },
    });
    const out = new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: OUT,
      depthTest: false,
      blending: THREE.NoBlending,
      uniforms: { t: { value: null }, texel: { value: new THREE.Vector2(1, 1) }, time: { value: 0 } },
    });
    const quad = new THREE.Mesh(geo, sim);
    const scene = new THREE.Scene();
    scene.add(quad);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      const sw = Math.max(96, Math.round(w / 2));
      const sh = Math.max(64, Math.round(h / 2));
      a?.dispose();
      b?.dispose();
      a = mk(sw, sh);
      b = mk(sw, sh);
      renderer.setClearColor(0x000000, 0);
      [a, b].forEach((rt) => {
        renderer.setRenderTarget(rt);
        renderer.clear();
      });
      renderer.setRenderTarget(null);
      sim.uniforms.texel.value.set(1 / sw, 1 / sh);
      out.uniforms.texel.value.set(1 / sw, 1 / sh);
      sim.uniforms.asp.value = w / h;
    };
    resize();
    window.addEventListener('resize', resize);

    const target = new THREE.Vector2(0.5, 0.5);
    const head = sim.uniforms.m.value;
    const prev = sim.uniforms.pm.value;
    let activeUntil = 0;
    let started = false;
    const t0 = performance.now();

    const onMove = (e) => {
      target.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
      activeUntil = performance.now() + 4200;
      if (!started) {
        head.copy(target);
        prev.copy(target);
        started = true;
      }
    };
    window.addEventListener('pointermove', onMove);

    let compiled = false;
    precompile(renderer, scene, cam, quad, [sim, out]).then(() => (compiled = true));
    let cleared = false;
    const stop = onTick((now) => {
      if (!compiled) return;
      // Skip overlay fluid simulation entirely while inside 3D voyage section
      if (labState.active || (scrollState.y > window.innerHeight * 1.5 && scrollState.y < window.innerHeight * 14)) {
        if (!cleared) {
          renderer.setRenderTarget(null);
          renderer.clear();
          cleared = true;
        }
        return;
      }
      if (now > activeUntil || !started) {
        if (!cleared) {
          renderer.setRenderTarget(null);
          renderer.clear();
          cleared = true;
        }
        return;
      }
      cleared = false;
      prev.copy(head);
      head.lerp(target, 0.2);
      sim.uniforms.rad.value = 0.07;
      quad.material = sim;
      sim.uniforms.t.value = a.texture;
      renderer.setRenderTarget(b);
      renderer.render(scene, cam);
      [a, b] = [b, a];
      quad.material = out;
      out.uniforms.t.value = a.texture;
      out.uniforms.time.value = (now - t0) / 1000;
      renderer.setRenderTarget(null);
      renderer.render(scene, cam);
    }, 21);

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      a?.dispose();
      b?.dispose();
      geo.dispose();
      sim.dispose();
      out.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas className="sl-liquid" ref={ref} aria-hidden="true" />;
}
