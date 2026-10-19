import { useEffect, useRef } from 'react';
import { finePointer, onFrame, reduced } from '../lib/motion';

const VS = 'attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0., 1.); }';

const SIM_FS = `precision mediump float;
uniform sampler2D t;
uniform vec2 m;
uniform vec2 pm;
uniform float asp;
uniform float time;
varying vec2 vUv;

float seg(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0));
}

void main(){
  vec2 u = vUv;
  vec2 swirl = vec2(sin(u.y * 6.0 + time * 0.5), cos(u.x * 5.0 - time * 0.4)) * 0.001;
  vec4 v = texture2D(t, u);
  vec4 c = texture2D(t, u - v.xy * 0.008 + swirl);

  // Velocity and density decay
  c.xy *= 0.962;
  c.z *= 0.982;

  // Pointer splat
  vec2 d = m - pm;
  float f = smoothstep(0.08, 0.0, seg(u * vec2(asp, 1.0), pm * vec2(asp, 1.0), m * vec2(asp, 1.0)));
  c.xy += clamp(d * 42.0, -1.0, 1.0) * f * 0.6;
  c.z += f * 0.28;
  c.w = clamp(c.w * 0.985 + f * 0.1, 0.0, 1.0);

  gl_FragColor = c;
}`;

const OUT_FS = `precision mediump float;
uniform sampler2D t;
varying vec2 vUv;

void main(){
  vec4 c = texture2D(t, vUv);
  float k = 1.0 - exp(-c.z * 2.2);

  // FireFly glowing palette: Amber (#ffb347), Ember (#ff5a1f), Rose (#e8192c)
  vec3 amber = vec3(1.0, 0.70, 0.28);
  vec3 ember = vec3(1.0, 0.35, 0.12);
  vec3 rose  = vec3(0.91, 0.10, 0.17);

  float s = clamp(c.w * 0.7 + length(c.xy) * 1.5, 0.0, 1.0);
  vec3 col = mix(amber, ember, s);
  col = mix(col, rose, clamp(c.z * 0.35, 0.0, 1.0));

  // Add subtle core brilliance
  float core = smoothstep(0.4, 1.4, c.z);
  col = mix(col, vec3(1.0, 0.95, 0.85), core * 0.25);

  gl_FragColor = vec4(col * k * 1.3, 1.0);
}`;

export default function Fluid({ className = '' }) {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    if (!el || reduced()) return undefined;

    const canvas = document.createElement('canvas');
    el.appendChild(canvas);

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      powerPreference: 'low-power',
    });

    if (!gl) {
      canvas.remove();
      return undefined;
    }

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const link = (vs, fs) => {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      return p;
    };

    const simProg = link(VS, SIM_FS);
    const outProg = link(VS, OUT_FS);

    if (!gl.getProgramParameter(simProg, gl.LINK_STATUS) || !gl.getProgramParameter(outProg, gl.LINK_STATUS)) {
      canvas.remove();
      return undefined;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const setupQuad = (prog) => {
      gl.useProgram(prog);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    setupQuad(simProg);
    setupQuad(outProg);

    const simU = {
      t: gl.getUniformLocation(simProg, 't'),
      m: gl.getUniformLocation(simProg, 'm'),
      pm: gl.getUniformLocation(simProg, 'pm'),
      asp: gl.getUniformLocation(simProg, 'asp'),
      time: gl.getUniformLocation(simProg, 'time'),
    };
    const outU = {
      t: gl.getUniformLocation(outProg, 't'),
    };

    let simW = 128;
    let simH = 128;
    let texA = null;
    let texB = null;
    let fbA = null;
    let fbB = null;

    const makeTexture = (w, h) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      return tex;
    };

    const makeFB = (tex) => {
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return fb;
    };

    const scale = window.innerWidth < 768 ? 0.35 : 0.5;
    const resize = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));

      simW = Math.max(64, Math.round(w * 0.28));
      simH = Math.max(64, Math.round(h * 0.28));

      if (texA) gl.deleteTexture(texA);
      if (texB) gl.deleteTexture(texB);
      if (fbA) gl.deleteFramebuffer(fbA);
      if (fbB) gl.deleteFramebuffer(fbB);

      texA = makeTexture(simW, simH);
      texB = makeTexture(simW, simH);
      fbA = makeFB(texA);
      fbB = makeFB(texB);

      currentFB = fbA;
      currentTex = texA;
      nextFB = fbB;
      nextTex = texB;

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbA);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbB);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    let currentFB = null;
    let currentTex = null;
    let nextFB = null;
    let nextTex = null;

    resize();
    window.addEventListener('resize', resize, { passive: true });
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let elRect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const updateRect = () => {
      const r = el.getBoundingClientRect();
      elRect = { left: r.left, top: r.top, width: r.width, height: r.height };
    };
    updateRect();
    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });

    const m = [-9, -9];
    const pm = [-9, -9];
    let hasMoved = false;

    const onMove = (e) => {
      const x = (e.clientX - elRect.left) / Math.max(elRect.width, 1);
      const y = 1.0 - (e.clientY - elRect.top) / Math.max(elRect.height, 1);
      if (!hasMoved) {
        pm[0] = x;
        pm[1] = y;
        hasMoved = true;
      } else {
        pm[0] = m[0];
        pm[1] = m[1];
      }
      m[0] = x;
      m[1] = y;
    };

    window.addEventListener('pointermove', onMove, { passive: true });

    let time = 0;
    let inView = true;
    let hidden = document.hidden;
    const io = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
    io.observe(el);
    const onVis = () => (hidden = document.hidden);
    document.addEventListener('visibilitychange', onVis);

    const stop = onFrame((dt) => {
      if (hidden || !inView || reduced()) return;
      time += dt;

      // 1. Sim pass (render into nextFB)
      gl.useProgram(simProg);
      gl.bindFramebuffer(gl.FRAMEBUFFER, nextFB);
      gl.viewport(0, 0, simW, simH);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentTex);
      gl.uniform1i(simU.t, 0);

      gl.uniform2f(simU.m, m[0], m[1]);
      gl.uniform2f(simU.pm, pm[0], pm[1]);
      gl.uniform1f(simU.asp, canvas.width / Math.max(canvas.height, 1));
      gl.uniform1f(simU.time, time);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Advance previous pointer toward current
      pm[0] += (m[0] - pm[0]) * 0.35;
      pm[1] += (m[1] - pm[1]) * 0.35;

      // Swap ping-pong buffers
      const tmpFB = currentFB;
      currentFB = nextFB;
      nextFB = tmpFB;

      const tmpTex = currentTex;
      currentTex = nextTex;
      nextTex = tmpTex;

      // 2. Output pass (render into canvas)
      gl.useProgram(outProg);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentTex);
      gl.uniform1i(outU.t, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      io.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div className={`fluid ${className}`.trim()} ref={host} aria-hidden="true" />;
}
