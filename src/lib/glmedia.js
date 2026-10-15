import * as THREE from 'three';
import { onTick } from './ticker';
import { scrollState } from './scroll';
import { hasWebGL, isTouch } from './device';

const VERT = `
uniform float uVel;
uniform float uBend;
uniform float uSkew;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  float v = uVel;
  p.x *= 1.0 + p.y * (v * 0.1 + uSkew);
  p.y += (0.25 - p.x * p.x) * (v * 0.24 + uBend);
  p.y += p.x * (v * 0.03 + uSkew * 0.35);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FRAG = `
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTexRatio;
uniform float uRadius;
uniform float uVel;
uniform float uPar;
uniform vec2 uPoint;
uniform float uHover;
uniform float uTint;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform float uBlur;
uniform float uDesat;
uniform float uLift;
varying vec2 vUv;
float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  float pr = uRes.x / uRes.y;
  vec2 s = pr > uTexRatio ? vec2(1.0, uTexRatio / pr) : vec2(pr / uTexRatio, 1.0);
  float zoom = 0.94 - uHover * 0.05;
  vec2 tuv = (vUv - 0.5) * s * zoom + 0.5;
  tuv.y += uPar * (1.0 - s.y * zoom) * 0.5;
  tuv += uPoint * 0.012;
  float ca = abs(uVel) * 0.007;
  vec3 col;
  if (uBlur > 0.002) {
    float rad = uBlur * 0.045;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 12; i++) {
      float a = float(i) * 0.5236;
      float k = 0.55 + 0.45 * fract(sin(float(i) * 12.9898) * 43758.5453);
      acc += texture2D(uTex, tuv + vec2(cos(a), sin(a)) * rad * k * vec2(1.0, pr)).rgb;
    }
    col = acc / 12.0;
  } else {
    col.r = texture2D(uTex, tuv + vec2(ca, 0.0)).r;
    col.g = texture2D(uTex, tuv).g;
    col.b = texture2D(uTex, tuv - vec2(ca, 0.0)).b;
  }
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(lum), uDesat);
  col = mix(col, vec3(0.93, 0.95, 0.98), uLift);
  vec3 duo = lum < 0.5 ? mix(uC0, uC1, lum * 2.0) : mix(uC1, uC2, (lum - 0.5) * 2.0);
  col = mix(col, duo, uTint);
  float d = sdRound((vUv - 0.5) * uRes, uRes * 0.5, uRadius);
  float a = 1.0 - smoothstep(-1.0, 1.0, d);
  gl_FragColor = vec4(col * a, a);
}`;

const stage = { sig: 0, canvas: null, renderer: null, scene: null, camera: null, geo: null, items: new Set(), stop: null, vel: 0, w: 1, h: 1 };
const NOGL = {};
const DUO = [new THREE.Color('#070425'), new THREE.Color('#6a3dff'), new THREE.Color('#00f5d4')];

export function glSupported() {
  return typeof window !== 'undefined' && !isTouch() && hasWebGL();
}

function resize() {
  const { renderer, camera } = stage;
  if (!renderer) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  stage.w = w;
  stage.h = h;
  stage.sig = 0;
  renderer.setSize(w, h, false);
  camera.left = -w / 2;
  camera.right = w / 2;
  camera.top = h / 2;
  camera.bottom = -h / 2;
  camera.updateProjectionMatrix();
}

function frame() {
  const { renderer, scene, camera } = stage;
  const target = Math.max(-1, Math.min(1, scrollState.velocity / 34));
  stage.vel += (target - stage.vel) * 0.12;
  const vh = stage.h;
  let any = false;
  let sig = stage.vel * 977;
  let live = false;
  stage.items.forEach((it) => {
    if (!it.ready) return;
    const r = it.box.getBoundingClientRect();
    const oy = (it.box.__gl && it.box.__gl.y) || 0;
    const on = r.bottom + oy > -140 && r.top + oy < vh + 140 && r.width > 2 && r.height > 2;
    it.mesh.visible = on;
    if (!on) return;
    any = true;
    const g = it.box.__gl || NOGL;
    if (it.video) live = true;
    sig += r.top * 1.01 + r.left * 1.3 + r.width * 0.7 + r.height * 0.9 + (g.x || 0) * 1.7 + (g.y || 0) * 1.9 + (g.rot || 0) * 311 + (g.scale || 0) * 257 + (g.skew || 0) * 199 + (g.bend || 0) * 173 + (g.blur || 0) * 131 + (g.desat || 0) * 113 + (g.lift || 0) * 97;
    const sc = g.scale === undefined ? 1 : g.scale;
    it.mesh.scale.set(r.width * sc, r.height * sc, 1);
    it.mesh.position.set(r.left + r.width / 2 - stage.w / 2 + (g.x || 0), -(r.top + r.height / 2 - vh / 2 + (g.y || 0)), 0);
    it.mesh.rotation.z = -(g.rot || 0);
    const u = it.mat.uniforms;
    u.uRes.value.set(r.width * sc, r.height * sc);
    u.uBend.value = g.bend || 0;
    u.uSkew.value = g.skew || 0;
    u.uBlur.value = g.blur || 0;
    u.uDesat.value = g.desat || 0;
    u.uLift.value = g.lift || 0;
    u.uVel.value = stage.vel;
    u.uPar.value = ((r.top + r.height / 2) / vh - 0.5) * 0.9;
    it.hover += ((it.hovering ? 1 : 0) - it.hover) * 0.1;
    u.uHover.value = it.hover;
    const mx = parseFloat(it.media.style.getPropertyValue('--mx')) || parseFloat(it.box.style.getPropertyValue('--mx')) || 0;
    const my = parseFloat(it.media.style.getPropertyValue('--my')) || parseFloat(it.box.style.getPropertyValue('--my')) || 0;
    u.uPoint.value.x += (mx - u.uPoint.value.x) * 0.1;
    u.uPoint.value.y += (my - u.uPoint.value.y) * 0.1;
    const want = (parseFloat(it.box.dataset.tint || '0') || 0) * (it.box.dataset.tintHover ? 1 - it.hover : 1);
    it.tint += (want - it.tint) * 0.12;
    u.uTint.value = it.tint;
    sig += it.tint * 53 + it.hover * 47 + u.uPoint.value.x * 31 + u.uPoint.value.y * 29;
  });
  if (any) {
    if (!live && Math.abs(sig - stage.sig) < 1e-6) return;
    stage.sig = sig;
    renderer.render(scene, camera);
    stage.cleared = false;
  } else if (!stage.cleared) {
    renderer.render(scene, camera);
    stage.cleared = true;
  }
}

export function attachStage(canvas) {
  if (!glSupported()) return () => {};
  if (stage.canvas === canvas) return () => {};
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  stage.canvas = canvas;
  stage.renderer = renderer;
  stage.scene = new THREE.Scene();
  stage.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  stage.geo = new THREE.PlaneGeometry(1, 1, 28, 28);
  resize();
  window.addEventListener('resize', resize);
  stage.items.forEach((it) => it.mount?.());
  stage.stop = onTick(frame, 20);
  return () => {
    window.removeEventListener('resize', resize);
    stage.stop?.();
    stage.items.forEach((it) => it.unmount?.());
    stage.geo?.dispose();
    renderer.dispose();
    stage.canvas = null;
    stage.renderer = null;
    stage.scene = null;
  };
}

export function registerMedia({ box, media, video = false }) {
  const item = { box, media, video, ready: false, hover: 0, tint: 0, hovering: false, mesh: null, mat: null, tex: null };

  const build = () => {
    if (!stage.renderer || item.mesh) return;
    const tex = video ? new THREE.VideoTexture(media) : new THREE.Texture(media);
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = video ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = !video;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    item.tex = tex;
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      premultipliedAlpha: true,
      uniforms: {
        uTex: { value: tex },
        uRes: { value: new THREE.Vector2(1, 1) },
        uTexRatio: { value: 1 },
        uRadius: { value: parseFloat(getComputedStyle(box).getPropertyValue('--r')) || 16 },
        uVel: { value: 0 },
        uPar: { value: 0 },
        uPoint: { value: new THREE.Vector2() },
        uHover: { value: 0 },
        uTint: { value: 0 },
        uC0: { value: DUO[0] },
        uC1: { value: DUO[1] },
        uC2: { value: DUO[2] },
        uBend: { value: 0 },
        uSkew: { value: 0 },
        uBlur: { value: 0 },
        uDesat: { value: 0 },
        uLift: { value: 0 },
      },
    });
    item.mat = mat;
    item.mesh = new THREE.Mesh(stage.geo, mat);
    item.mesh.visible = false;
    item.mesh.frustumCulled = false;
    stage.scene.add(item.mesh);
    sync();
  };

  const sync = () => {
    if (!item.mesh) return;
    const w = video ? media.videoWidth : media.naturalWidth;
    const h = video ? media.videoHeight : media.naturalHeight;
    if (!w || !h) return;
    item.mat.uniforms.uTexRatio.value = w / h;
    if (!video) item.tex.needsUpdate = true;
    item.ready = true;
    box.dataset.gl = '1';
    stage.cleared = false;
    stage.sig = 0;
  };

  const ready = () => (video ? media.readyState >= 2 : media.complete && media.naturalWidth > 0);
  const onLoad = () => {
    build();
    sync();
  };
  item.mount = () => {
    if (ready()) onLoad();
  };
  item.unmount = () => {
    item.ready = false;
    delete box.dataset.gl;
    if (item.mesh) {
      stage.scene?.remove(item.mesh);
      item.mat.dispose();
      item.tex.dispose();
      item.mesh = null;
    }
  };

  const loadEvent = video ? 'loadeddata' : 'load';
  media.addEventListener(loadEvent, onLoad);
  const enter = () => (item.hovering = true);
  const leave = () => (item.hovering = false);
  box.addEventListener('pointerenter', enter);
  box.addEventListener('pointerleave', leave);

  stage.items.add(item);
  if (stage.renderer) item.mount();

  return () => {
    media.removeEventListener(loadEvent, onLoad);
    box.removeEventListener('pointerenter', enter);
    box.removeEventListener('pointerleave', leave);
    item.unmount();
    stage.items.delete(item);
  };
}
