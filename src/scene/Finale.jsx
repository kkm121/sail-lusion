import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { seeded } from '../lib/three-utils';
import { CONNECT_END, ROOM_END } from '../lib/journey';
import { fillMatrices, labState } from './shared';

const H = 4.3;
export const PANE_Z = ROOM_END - 2;

const GLASS_V = `uniform float uCamZ;
attribute vec3 aCenter; attribute vec4 aRnd; attribute vec3 aBary;
varying vec3 vBary; varying float vA; varying float vShade; varying vec2 vXY;
void main(){
  float ahead = uCamZ - aCenter.z;
  float t = clamp((15.0 - ahead * (0.8 + aRnd.w * 0.5)) / 13.0, 0., 1.);
  float s = t * t;
  vec3 rel = position - aCenter;
  vec3 ax = normalize(aRnd.xyz * 2. - 1. + vec3(0.001));
  float ang = s * (2.5 + aRnd.w * 9.);
  float c = cos(ang), sn = sin(ang);
  rel = (rel * c + cross(ax, rel) * sn + ax * dot(ax, rel) * (1. - c)) * (1. - s * 0.4);
  vec2 dir = normalize(aCenter.xy + (aRnd.xy - .5) * 3. + vec2(0.001));
  vec3 off = vec3(dir * s * (4. + aRnd.z * 12.), s * (2. + aRnd.w * 6.));
  off.y -= s * s * 5. * aRnd.z;
  vec3 p = aCenter + rel + off;
  vA = (1. - smoothstep(0.45, 0.9, t)) * smoothstep(-0.5, 2.5, ahead);
  vBary = aBary; vShade = aRnd.z; vXY = aCenter.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const GLASS_F = `uniform float uTime; varying vec3 vBary; varying float vA; varying float vShade; varying vec2 vXY;
void main(){
  float edge = min(min(vBary.x, vBary.y), vBary.z);
  float line = 1. - smoothstep(0., 0.035, edge);
  float soft = 1. - smoothstep(0., 0.22, edge);
  float band = pow(0.5 + 0.5 * sin(vXY.x * 0.5 + vXY.y * 0.34 + uTime * 0.6 + vShade * 6.), 3.);
  vec3 tint = mix(vec3(0.45, 0.7, 1.0), vec3(0.85, 0.95, 1.0), band);
  vec3 col = tint * 1.5 + vec3(1.) * soft * 0.25;
  col = mix(col, vec3(1.), line * 0.85);
  float a = (0.07 + band * 0.12 + vShade * 0.04 + soft * 0.06 + line * 0.6) * vA;
  gl_FragColor = vec4(col, a);
}`;

function GlassPane() {
  const mesh = useRef();
  const geo = useMemo(() => {
    const rnd = seeded(909);
    const G = 8;
    const S = H * 2 + 0.4;
    const step = S / G;
    const pos = [];
    const ctr = [];
    const rr = [];
    const bary = [];
    const grid = [];
    for (let j = 0; j <= G; j++) {
      grid[j] = [];
      for (let i = 0; i <= G; i++) {
        const rim = i === 0 || j === 0 || i === G || j === G;
        grid[j][i] = [-S / 2 + i * step + (rim ? 0 : (rnd() - 0.5) * step * 0.7), -S / 2 + j * step + (rim ? 0 : (rnd() - 0.5) * step * 0.7)];
      }
    }
    for (let j = 0; j < G; j++) {
      for (let i = 0; i < G; i++) {
        const a = grid[j][i];
        const b = grid[j][i + 1];
        const c = grid[j + 1][i + 1];
        const d = grid[j + 1][i];
        const tris = rnd() < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
        tris.forEach((t) => {
          const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
          const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
          const r = [rnd(), rnd(), rnd(), rnd()];
          t.forEach((v, vi) => {
            pos.push(v[0], v[1], PANE_Z);
            ctr.push(cx, cy, PANE_Z);
            rr.push(...r);
            bary.push(vi === 0 ? 1 : 0, vi === 1 ? 1 : 0, vi === 2 ? 1 : 0);
          });
        });
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aCenter', new THREE.Float32BufferAttribute(ctr, 3));
    g.setAttribute('aRnd', new THREE.Float32BufferAttribute(rr, 4));
    g.setAttribute('aBary', new THREE.Float32BufferAttribute(bary, 3));
    return g;
  }, []);
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: GLASS_V, fragmentShader: GLASS_F, uniforms: { uCamZ: { value: 99 }, uTime: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), []);
  useFrame((s) => {
    const z = s.camera.position.z;
    mat.uniforms.uCamZ.value = z;
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    if (mesh.current) mesh.current.visible = labState.warm || (z < PANE_Z + 34 && z > PANE_Z - 12);
  });
  return <mesh ref={mesh} geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />;
}

function paintAtlas() {
  const N = 4;
  const C = 256;
  const cv = document.createElement('canvas');
  cv.width = C * N;
  cv.height = C * N;
  const x = cv.getContext('2d');
  x.lineJoin = 'round';
  x.lineCap = 'round';
  const out = (fn, fill, stroke = '#ffffff') => {
    x.save();
    x.shadowColor = 'rgba(0,0,0,0.35)';
    x.shadowBlur = 10;
    x.shadowOffsetY = 4;
    x.beginPath();
    fn();
    x.lineWidth = 24;
    x.strokeStyle = stroke;
    x.stroke();
    x.restore();
    x.beginPath();
    fn();
    x.fillStyle = fill;
    x.fill();
  };
  const cell = (i, draw) => {
    x.save();
    x.translate((i % N) * C + C / 2, Math.floor(i / N) * C + C / 2);
    draw();
    x.restore();
  };
  const poly = (pts) => () => pts.forEach(([a, b], k) => (k ? x.lineTo(a, b) : x.moveTo(a, b)));
  const ell = (cx, cy, rx, ry, rot = 0) => () => x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  const dot = (cx, cy, r, col) => {
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.fillStyle = col;
    x.fill();
  };
  cell(0, () => {
    out(ell(0, 0, 80, 80), '#ffd84a');
    dot(-28, -18, 11, '#2a1b00');
    dot(28, -18, 11, '#2a1b00');
    x.beginPath();
    x.arc(0, 8, 40, 0.15 * Math.PI, 0.85 * Math.PI);
    x.lineWidth = 9;
    x.strokeStyle = '#2a1b00';
    x.stroke();
  });
  cell(1, () => out(() => { x.moveTo(0, 70); x.bezierCurveTo(-110, -10, -60, -90, 0, -34); x.bezierCurveTo(60, -90, 110, -10, 0, 70); }, '#ff4d8d'));
  cell(2, () => {
    const pts = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 36 : 88;
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    out(poly(pts), '#f5c84b');
  });
  cell(3, () => out(poly([[10, -92], [-52, 12], [-6, 12], [-18, 92], [52, -22], [4, -22]]), '#ffe14a'));
  cell(4, () => {
    out(() => { x.moveTo(-96, 0); x.quadraticCurveTo(0, -92, 96, 0); x.quadraticCurveTo(0, 92, -96, 0); }, '#ffffff');
    dot(0, 0, 40, '#ff5a1f');
    dot(0, 0, 18, '#06242b');
    dot(-12, -12, 8, '#ffffff');
  });
  cell(5, () => {
    out(ell(0, 0, 66, 66), '#b8336a');
    x.save();
    x.rotate(-0.4);
    x.beginPath();
    x.ellipse(0, 0, 112, 30, 0, 0, Math.PI * 2);
    x.lineWidth = 16;
    x.strokeStyle = '#ffffff';
    x.stroke();
    x.lineWidth = 8;
    x.strokeStyle = '#f5c84b';
    x.stroke();
    x.restore();
  });
  cell(6, () => {
    x.save();
    x.strokeStyle = '#ffffff';
    x.lineWidth = 12;
    for (let k = -2; k <= 2; k++) {
      x.beginPath();
      x.moveTo(k * 28, -104);
      x.lineTo(k * 28, 104);
      x.moveTo(-104, k * 28);
      x.lineTo(104, k * 28);
      x.stroke();
    }
    x.restore();
    out(() => x.roundRect(-72, -72, 144, 144, 22), '#00c9ae');
    out(() => x.roundRect(-34, -34, 68, 68, 10), '#06242b', '#06242b');
  });
  cell(7, () => {
    const pts = [];
    for (let k = 0; k < 24; k++) {
      const r = k % 3 === 0 ? 70 : k % 3 === 1 ? 96 : 96;
      const a = (k / 24) * Math.PI * 2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    out(poly(pts), '#ffb347');
    dot(0, 0, 32, '#06242b');
  });
  cell(8, () => {
    out(() => { x.arc(-34, -6, 54, 0, Math.PI * 2); x.moveTo(90, -6); x.arc(34, -6, 54, 0, Math.PI * 2); x.moveTo(30, 40); x.arc(0, 34, 46, 0, Math.PI * 2); }, '#e56bff');
    x.strokeStyle = '#7a1f9a';
    x.lineWidth = 8;
    x.beginPath();
    x.moveTo(0, -50);
    x.bezierCurveTo(20, -20, -20, 0, 0, 40);
    x.moveTo(-44, -20);
    x.quadraticCurveTo(-24, -8, -40, 12);
    x.moveTo(44, -20);
    x.quadraticCurveTo(24, -8, 40, 12);
    x.stroke();
  });
  cell(9, () => {
    out(() => x.roundRect(-96, -66, 192, 132, 34), '#6d4bff');
    x.fillStyle = '#ffffff';
    x.font = '700 92px "Space Grotesk", Inter, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('</>', 0, 6);
  });
  cell(10, () => {
    out(() => { x.roundRect(-92, -64, 184, 108, 36); x.moveTo(-40, 44); x.lineTo(-62, 92); x.lineTo(-4, 44); }, '#ffffff');
    dot(-42, -10, 12, '#16bfa8');
    dot(0, -10, 12, '#16bfa8');
    dot(42, -10, 12, '#16bfa8');
  });
  cell(11, () => {
    x.save();
    x.strokeStyle = '#ffffff';
    x.lineWidth = 14;
    x.beginPath();
    x.moveTo(0, -78);
    x.lineTo(0, -104);
    x.stroke();
    x.restore();
    dot(0, -108, 12, '#ff4d8d');
    out(() => x.roundRect(-84, -80, 168, 160, 40), '#f4f7ff');
    out(() => x.roundRect(-62, -46, 124, 68, 30), '#07131a', '#07131a');
    dot(-28, -12, 14, '#ff5a1f');
    dot(28, -12, 14, '#ff5a1f');
  });
  cell(12, () => out(() => { x.moveTo(0, -100); x.quadraticCurveTo(10, -10, 100, 0); x.quadraticCurveTo(10, 10, 0, 100); x.quadraticCurveTo(-10, 10, -100, 0); x.quadraticCurveTo(-10, -10, 0, -100); }, '#38e8ff'));
  cell(13, () => {
    out(poly([[0, -92], [80, -26], [48, 80], [-48, 80], [-80, -26]]), '#4aa3ff');
    x.strokeStyle = '#d6ebff';
    x.lineWidth = 8;
    x.beginPath();
    x.moveTo(-80, -26);
    x.lineTo(80, -26);
    x.moveTo(0, -92);
    x.lineTo(-26, -26);
    x.lineTo(0, 80);
    x.moveTo(0, -92);
    x.lineTo(26, -26);
    x.lineTo(0, 80);
    x.stroke();
  });
  cell(14, () => {
    x.save();
    x.rotate(0.6);
    out(() => { x.moveTo(0, -104); x.quadraticCurveTo(52, -50, 44, 40); x.lineTo(-44, 40); x.quadraticCurveTo(-52, -50, 0, -104); }, '#ffffff');
    out(poly([[-44, 20], [-84, 76], [-24, 52]]), '#ff4d4d');
    out(poly([[44, 20], [84, 76], [24, 52]]), '#ff4d4d');
    dot(0, -28, 20, '#ffb347');
    out(poly([[-22, 56], [0, 104], [22, 56]]), '#ffb02e');
    x.restore();
  });
  cell(15, () => {
    x.save();
    x.strokeStyle = '#ffffff';
    x.lineWidth = 44;
    x.beginPath();
    x.moveTo(36, 36);
    x.lineTo(94, 94);
    x.stroke();
    x.strokeStyle = '#0f6d62';
    x.lineWidth = 20;
    x.stroke();
    x.restore();
    out(ell(-18, -18, 62, 62), 'rgba(0,245,212,0.55)');
    x.beginPath();
    x.arc(-30, -30, 24, Math.PI, Math.PI * 1.6);
    x.lineWidth = 9;
    x.strokeStyle = '#ffffff';
    x.stroke();
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.generateMipmaps = true;
  return tex;
}

const STICK_V = `uniform float uTime; uniform float uCamZ; uniform float uPane; attribute vec4 aSt;
varying vec2 vUv; varying float vDepth;
void main(){
  vec3 c = (modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.)).xyz;
  c.y += sin(uTime * 0.7 + aSt.z * 6.28) * 0.4;
  c.x += cos(uTime * 0.5 + aSt.z * 9.) * 0.3;
  float pop = smoothstep(0., 1., (uPane - uCamZ - 1. - aSt.z * 18.) / 8.);
  vec4 mv = viewMatrix * vec4(c, 1.);
  float ang = (aSt.y - 0.5) * uTime * 0.6 + aSt.z * 6.28;
  float cs = cos(ang), sn = sin(ang);
  vec2 q = vec2(position.x * cs - position.y * sn, position.x * sn + position.y * cs) * aSt.w * pop;
  mv.xy += q;
  vDepth = -mv.z;
  float cell = aSt.x;
  vUv = (vec2(mod(cell, 4.), 3. - floor(cell / 4.)) + uv) / 4.;
  gl_Position = projectionMatrix * mv;
}`;
const STICK_F = `uniform sampler2D uMap; varying vec2 vUv; varying float vDepth;
void main(){
  vec4 t = texture2D(uMap, vUv);
  if (t.a < 0.4) discard;
  float f = smoothstep(46., 12., vDepth);
  gl_FragColor = vec4(t.rgb * (0.55 + 0.6 * f), 1.);
}`;

function Stickers({ touch }) {
  const mesh = useRef();
  const data = useMemo(() => {
    const rnd = seeded(2025);
    const n = touch ? 24 : 44;
    const items = [];
    const meta = [];
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 2.6 + rnd() * 5.4;
      const z = PANE_Z - 4 - rnd() * (Math.abs(CONNECT_END - PANE_Z) + 22);
      items.push({ p: [Math.cos(a) * r, Math.sin(a) * r * 0.72, z], s: [1, 1, 1] });
      meta.push(i % 16, rnd(), rnd(), 1.1 + rnd() * 0.9);
    }
    return { items, meta: new Float32Array(meta) };
  }, [touch]);
  const { gl } = useThree();
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: STICK_V, fragmentShader: STICK_F, uniforms: { uTime: { value: 0 }, uCamZ: { value: 99 }, uPane: { value: PANE_Z }, uMap: { value: null } }, side: THREE.DoubleSide, toneMapped: false }), []);
  useLayoutEffect(() => {
    fillMatrices(mesh.current, data.items);
    mesh.current.geometry.setAttribute('aSt', new THREE.InstancedBufferAttribute(data.meta, 4));
    const tex = paintAtlas();
    mat.uniforms.uMap.value = tex;
    gl.initTexture(tex);
    return () => tex.dispose();
  }, [data, mat, gl]);
  useFrame((s) => {
    const z = s.camera.position.z;
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uCamZ.value = z;
    if (mesh.current) mesh.current.visible = labState.warm || z < PANE_Z + 6;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, mat, data.items.length]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

export default function Finale({ touch }) {
  return (
    <>
      <GlassPane />
      <Stickers touch={touch} />
    </>
  );
}
