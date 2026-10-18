import { useEffect, useRef } from 'react';
import { onFrame, reduced, scroll } from '../lib/motion';

// The whole site sits on one living night sky: warm smoke, slow aurora ribbons and rising embers,
// drawn by a single WebGL fragment shader at reduced resolution. Scrolling stirs it; the pointer warms it.
// The canvas is created inside the effect (never reused), so React's dev double-mount can't leave a dead context.
const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
const FRAG = `precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll; uniform float uStir;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * noise(p); p = p * 2.03 + 7.1; a *= .5; } return s; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - .5) * asp, uv.y - .5);
  float t = uTime * .05;
  vec3 col = vec3(.035, .024, .02);
  // smoke drifting up, its pattern scrolling with the page so the sky feels attached to the content
  vec2 q = p * 1.5 + vec2(uMouse.x * .12, -t * 2. + uScroll * .35);
  float s = fbm(q + fbm(q * 1.3 + t + uStir * .3));
  float low = smoothstep(.95, -.35, uv.y);
  col += mix(vec3(.42, .06, .04), vec3(1., .42, .12), s) * pow(s, 2.2) * (.4 + .6 * low) * 1.25;
  // two slow aurora ribbons, ember and violet
  for (int k = 0; k < 2; k++){
    float fk = float(k);
    float y = -.12 + fk * .34 + .08 * sin(p.x * (1.6 + fk) + uTime * (.1 + fk * .05) + uScroll * (.6 - fk * .3));
    float d = abs(p.y - y);
    float band = exp(-d * d * 140.) * (.5 + .5 * fbm(vec2(p.x * 2. + t * 3., fk * 4.)));
    col += mix(vec3(1., .42, .14), vec3(.52, .32, .95), fk) * band * .22;
  }
  // warm light under the pointer
  vec2 m = vec2((uMouse.x * .5) * asp, uMouse.y * .5);
  col += vec3(1., .45, .16) * exp(-dot(p - m, p - m) * 6.) * .07;
  // embers
  for (int k = 0; k < 3; k++){
    float fk = float(k);
    vec2 e = vec2(uv.x * asp, uv.y) * (10. + fk * 8.);
    e.y -= uTime * (.16 + fk * .08) + uScroll * (2. + fk);
    e.x += sin(e.y * .6 + fk * 3.) * .4;
    vec2 cell = floor(e); vec2 f = fract(e) - .5;
    float h = hash(cell + fk * 17.);
    float d = length(f - (vec2(hash(cell + 3.1), hash(cell + 7.7)) - .5) * .6);
    float tw = .5 + .5 * sin(uTime * 2.2 + h * 40.);
    col += vec3(1., .6, .24) * step(.91, h) * smoothstep(.08 - fk * .018, 0., d) * tw * (.75 + uStir * .7);
  }
  col *= .6 + .4 * smoothstep(1.35, .2, length(p * vec2(.75, 1.)));
  gl_FragColor = vec4(col, 1.);
}`;

export default function Backdrop() {
  const host = useRef(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' });
    const fail = () => el.classList.add('is-fallback');
    if (!gl) {
      fail();
      return () => canvas.remove();
    }
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      fail();
      return () => canvas.remove();
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(prog, n);
    const uRes = U('uRes'), uTime = U('uTime'), uMouse = U('uMouse'), uScroll = U('uScroll'), uStir = U('uStir');

    // soft gradients need few pixels: render at ~half size and let the browser scale it up
    const scale = window.innerWidth < 768 ? 0.45 : 0.55;
    const resize = () => {
      canvas.width = Math.max(1, Math.round(el.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(el.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const mouse = [0, 0];
    const m = [0, 0];
    const onMove = (e) => {
      mouse[0] = (e.clientX / window.innerWidth) * 2 - 1;
      const r = el.getBoundingClientRect();
      mouse[1] = -((e.clientY - r.top) / Math.max(r.height, 1)) * 2 + 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    const still = reduced();
    let time = 4;
    let stir = 0;
    let hidden = document.hidden;
    let inView = true;
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting));
    io.observe(el);
    const onVis = () => (hidden = document.hidden);
    document.addEventListener('visibilitychange', onVis);
    let n = 0;
    const stop = onFrame((dt) => {
      if (hidden || !inView) return;
      if (!still) time += dt;
      stir += (Math.min(Math.abs(scroll.v) / 2500, 1) - stir) * 0.06;
      m[0] += (mouse[0] - m[0]) * 0.05;
      m[1] += (mouse[1] - m[1]) * 0.05;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, m[0], m[1]);
      gl.uniform1f(uScroll, (scroll.y / Math.max(scroll.vh, 1)) * 0.25);
      gl.uniform1f(uStir, stir);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (++n === 2) el.classList.add('is-on');
    });
    return () => {
      stop();
      window.removeEventListener('resize', resize);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      io.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, []);
  return <div className="sky" ref={host} aria-hidden="true" />;
}
