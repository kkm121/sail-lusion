import { useEffect, useRef } from 'react';
import { onFrame, reduced, scroll } from '../lib/motion';

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';

const FRAG = `precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
uniform float uStir;
uniform vec2 uTrail[10];
uniform float uTrailAge[10];

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){
  float a = .5, s = 0.;
  for (int i = 0; i < 4; i++){
    s += a * noise(p);
    p = p * 2.03 + 7.1;
    a *= .5;
  }
  return s;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / max(uRes.y, 1.0);
  vec2 p = vec2(uv.x * asp, uv.y);

  float t = uTime * 0.04;

  // Base warm paper background (#f7f2ea)
  vec3 paper = vec3(0.969, 0.949, 0.918);
  vec3 peach = vec3(1.0, 0.851, 0.722); // #ffd9b8
  vec3 rose  = vec3(0.965, 0.780, 0.753); // #f6c7c0
  vec3 amber = vec3(1.0, 0.886, 0.659); // #ffe2a8

  // Gentle watercolor wash domain-warped FBM drifting slowly
  vec2 q = vec2(
    fbm(p * 1.4 + vec2(0.0, t * 0.8 + uScroll * 0.2)),
    fbm(p * 1.4 + vec2(4.3, 1.7 - t * 0.6))
  );
  vec2 r = vec2(
    fbm(p * 1.6 + 2.5 * q + vec2(1.7, 9.2) + uStir * 0.4),
    fbm(p * 1.6 + 2.5 * q + vec2(8.3, 2.8))
  );
  float f = fbm(p * 1.8 + 2.2 * r);

  vec3 col = paper;
  // Very soft blend so editorial text remains perfectly readable
  col = mix(col, mix(peach, rose, smoothstep(0.2, 0.8, f)), 0.16 * smoothstep(0.15, 0.85, f));
  col = mix(col, amber, 0.11 * smoothstep(0.25, 0.75, q.x));

  // Faint dot grid that lenses and subtly brightens near cursor
  vec2 gridUv = gl_FragCoord.xy / 28.0;
  vec2 gridFract = fract(gridUv) - 0.5;
  float dotDist = length(gridFract);
  float dotBase = smoothstep(0.08, 0.02, dotDist);
  float mDist = length(gl_FragCoord.xy - uMouse);
  float mHover = exp(-mDist * mDist / (240.0 * 240.0));
  float gridAlpha = (0.035 + 0.14 * mHover) * dotBase;
  col = mix(col, vec3(0.72, 0.56, 0.42), gridAlpha);

  // Golden fireflies drifting and gently floating away from pointer
  for (int k = 0; k < 8; k++) {
    float fk = float(k);
    vec2 pos = vec2(
      sin(t * 0.45 + fk * 1.61) * 0.42 + 0.5,
      cos(t * 0.38 + fk * 2.37) * 0.42 + 0.5
    );
    // Soft cursor repulsion
    vec2 mNorm = uMouse / uRes;
    vec2 toM = pos - mNorm;
    float dM = length(toM);
    if (dM < 0.20 && dM > 0.001) {
      pos += (toM / dM) * (0.20 - dM) * 0.55;
    }
    vec2 diff = (uv - pos) * vec2(asp, 1.0);
    float d = length(diff);
    float glow = exp(-d * 55.0) * (0.6 + 0.4 * sin(uTime * 2.2 + fk * 3.5));
    float core = exp(-d * 210.0);
    col += vec3(1.0, 0.72, 0.25) * (glow * 0.18 + core * 0.45);
  }

  // Fading ember ink trail behind the cursor
  for (int i = 0; i < 10; i++) {
    float age = uTrailAge[i];
    if (age >= 0.0 && age < 1.0) {
      float d = length(gl_FragCoord.xy - uTrail[i]);
      float rPix = 24.0 + (1.0 - age) * 12.0;
      float intensity = exp(-d * d / (2.0 * rPix * rPix)) * (1.0 - age) * 0.22;
      col = mix(col, vec3(0.95, 0.38, 0.12), intensity);
    }
  }

  gl_FragColor = vec4(col, 1.0);
}`;

export default function Ambient() {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;

    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      powerPreference: 'low-power',
    });

    if (!gl) return () => canvas.remove();

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
      canvas.remove();
      return undefined;
    }

    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = (n) => gl.getUniformLocation(prog, n);
    const uRes = U('uRes');
    const uTime = U('uTime');
    const uMouse = U('uMouse');
    const uScroll = U('uScroll');
    const uStir = U('uStir');
    const uTrail = U('uTrail');
    const uTrailAge = U('uTrailAge');

    // Scale resolution ~0.45 for high performance 60fps rendering
    const scale = window.innerWidth < 768 ? 0.35 : 0.45;
    const resize = () => {
      canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
      canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Track mouse coordinates and last 10 trail points
    const mouse = [window.innerWidth * 0.5 * scale, window.innerHeight * 0.5 * scale];
    const m = [mouse[0], mouse[1]];

    const trailCount = 10;
    const trailFlat = new Float32Array(trailCount * 2);
    const trailAge = new Float32Array(trailCount).fill(-1.0);
    let trailHead = 0;
    let lastDropX = 0;
    let lastDropY = 0;

    const onMove = (e) => {
      const x = e.clientX * scale;
      const y = (window.innerHeight - e.clientY) * scale;
      mouse[0] = x;
      mouse[1] = y;

      const dx = x - lastDropX;
      const dy = y - lastDropY;
      if (dx * dx + dy * dy > 144) {
        lastDropX = x;
        lastDropY = y;
        trailFlat[trailHead * 2] = x;
        trailFlat[trailHead * 2 + 1] = y;
        trailAge[trailHead] = 0.0;
        trailHead = (trailHead + 1) % trailCount;
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let time = 0;
    let stir = 0;
    let hidden = document.hidden;
    const onVis = () => (hidden = document.hidden);
    document.addEventListener('visibilitychange', onVis);

    const stop = onFrame((dt) => {
      if (hidden) return;
      const isCalm = reduced();
      time += dt * (isCalm ? 0.2 : 1.0);

      stir += (Math.min(Math.abs(scroll.v) / 2500, 1) - stir) * 0.06;
      m[0] += (mouse[0] - m[0]) * 0.08;
      m[1] += (mouse[1] - m[1]) * 0.08;

      // Age trail points
      for (let i = 0; i < trailCount; i++) {
        if (trailAge[i] >= 0.0) {
          trailAge[i] += dt * 1.4;
          if (trailAge[i] >= 1.0) trailAge[i] = -1.0;
        }
      }

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, m[0], m[1]);
      gl.uniform1f(uScroll, (scroll.y / Math.max(scroll.vh, 1)) * 0.25);
      gl.uniform1f(uStir, stir);
      gl.uniform2fv(uTrail, trailFlat);
      gl.uniform1fv(uTrailAge, trailAge);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div className="ambient" ref={host} aria-hidden="true" />;
}
