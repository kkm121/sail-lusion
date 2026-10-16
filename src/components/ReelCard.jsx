import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { precompile } from '../lib/three-utils';
import { onTick } from '../lib/ticker';
import { canGL } from '../lib/device';

const VERT = `
uniform vec2 uCanvas;
uniform vec2 uCard;
uniform float uScale;
uniform float uRot;
uniform float uBend;
uniform float uSkew;
uniform vec2 uOff;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec2 p = position.xy;
  p.x *= 1.0 + p.y * uSkew;
  p.y += (0.25 - p.x * p.x) * uBend;
  p.y += p.x * uSkew * 0.35;
  vec2 px = p * uCard * uScale;
  float c = cos(uRot);
  float s = sin(uRot);
  px = vec2(c * px.x - s * px.y, s * px.x + c * px.y) + uOff;
  gl_Position = vec4(px / (0.5 * uCanvas), 0.0, 1.0);
}`;

const FRAG = `
uniform sampler2D uTex;
uniform vec2 uCard;
uniform float uTexRatio;
uniform float uRadius;
uniform float uTint;
uniform float uLum;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
varying vec2 vUv;
float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  float pr = uCard.x / uCard.y;
  vec2 s = pr > uTexRatio ? vec2(1.0, uTexRatio / pr) : vec2(pr / uTexRatio, 1.0);
  vec2 tuv = (vUv - 0.5) * s * 0.97 + 0.5;
  vec3 col = texture2D(uTex, tuv).rgb;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 duo = lum < 0.5 ? mix(uC0, uC1, lum * 2.0) : mix(uC1, uC2, (lum - 0.5) * 2.0);
  col = mix(col, duo, uTint);
  col *= uLum;
  float d = sdRound((vUv - 0.5) * uCard, uCard * 0.5, uRadius);
  float a = 1.0 - smoothstep(-1.0, 1.0, d);
  gl_FragColor = vec4(col * a, a);
}`;

const DUO = [new THREE.Color('#070425'), new THREE.Color('#6a3dff'), new THREE.Color('#00f5d4')];

// The reel card draws its own video so the warp is a shader on a canvas that scrolls with the page.
export default function ReelCard({ src, fallback, poster, warp, className = '', children, ...rest }) {
  const box = useRef(null);
  const video = useRef(null);

  useEffect(() => {
    const el = box.current;
    const vid = video.current;
    if (!el || !vid || !canGL()) return undefined;

    // A fresh canvas per mount: a canvas whose context was released cannot be reused.
    const cv = document.createElement('canvas');
    cv.className = 'sl-reel-gl';
    cv.setAttribute('aria-hidden', 'true');
    el.prepend(cv);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      cv.remove();
      vid.style.opacity = '1';
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    const geo = new THREE.PlaneGeometry(1, 1, 36, 36);
    const tex = new THREE.VideoTexture(vid);
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      premultipliedAlpha: true,
      uniforms: {
        uTex: { value: tex },
        uCanvas: { value: new THREE.Vector2(1, 1) },
        uCard: { value: new THREE.Vector2(1, 1) },
        uTexRatio: { value: 16 / 9 },
        uRadius: { value: 22 },
        uScale: { value: 1 },
        uRot: { value: 0 },
        uBend: { value: 0 },
        uSkew: { value: 0 },
        uOff: { value: new THREE.Vector2() },
        uTint: { value: 1 },
        uLum: { value: 1 },
        uC0: { value: DUO[0] },
        uC1: { value: DUO[1] },
        uC2: { value: DUO[2] },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);

    let ready = false;
    const setReady = () => {
      if (!vid.videoWidth) return;
      mat.uniforms.uTexRatio.value = vid.videoWidth / vid.videoHeight;
      ready = true;
      el.dataset.gl = '1';
    };
    vid.addEventListener('loadeddata', setReady);
    if (vid.readyState >= 2) setReady();

    const size = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const cw = Math.round(w * 1.16);
      const ch = Math.round(h * 1.4);
      renderer.setSize(cw, ch, false);
      mat.uniforms.uCanvas.value.set(cw, ch);
      mat.uniforms.uCard.value.set(w, h);
      mat.uniforms.uRadius.value = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 22;
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    let near = true;
    const io = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near) vid.play().catch(() => {});
        else vid.pause();
      },
      { rootMargin: '25% 0px' }
    );
    io.observe(el);

    const u = mat.uniforms;
    let compiled = false;
    precompile(renderer, scene, cam).then(() => (compiled = true));
    const stop = onTick(() => {
      if (!ready || !near || !compiled) return;
      const w = warp.current;
      u.uScale.value = w.scale;
      u.uRot.value = -w.rot;
      u.uBend.value = w.bend;
      u.uSkew.value = w.skew;
      u.uOff.value.set(w.x, -w.y);
      u.uTint.value = w.tint;
      u.uLum.value = w.lum;
      renderer.render(scene, cam);
    }, 22);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      vid.removeEventListener('loadeddata', setReady);
      tex.dispose();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      cv.remove();
      delete el.dataset.gl;
    };
  }, [warp]);

  return (
    <div ref={box} className={`sl-reel-card ${className}`} {...rest}>
      <video ref={video} className="sl-reel-vid" src={src} poster={poster} muted loop autoPlay playsInline preload="auto" onError={(e) => fallback && e.currentTarget.src !== fallback && (e.currentTarget.src = fallback)} />
      {children}
    </div>
  );
}
