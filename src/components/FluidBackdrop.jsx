import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { isTouch } from '../lib/device';

const VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}';
const SIM = `
uniform sampler2D t; uniform vec2 m; uniform vec2 pm; uniform vec2 m2; uniform vec2 pm2; uniform float asp; uniform float time;
varying vec2 vUv;
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;return length(pa-ba*clamp(dot(pa,ba)/max(dot(ba,ba),1e-5),0.,1.));}
void main(){
  vec2 u=vUv;
  vec2 swirl=vec2(sin(u.y*7.+time*.6),cos(u.x*6.-time*.5))*.0009;
  vec4 v=texture2D(t,u);
  vec4 c=texture2D(t,u-v.xy*.0075+swirl);
  c.xy*=.965; c.z*=.987;
  vec2 d1=m-pm; vec2 d2=m2-pm2;
  float f1=smoothstep(.085,0.,seg(u*vec2(asp,1.),pm*vec2(asp,1.),m*vec2(asp,1.)));
  float f2=smoothstep(.07,0.,seg(u*vec2(asp,1.),pm2*vec2(asp,1.),m2*vec2(asp,1.)));
  c.xy+=clamp(d1*45.,-1.,1.)*f1*.5+clamp(d2*45.,-1.,1.)*f2*.5;
  c.z+=f1*.2+f2*.15;
  c.w=clamp(c.w*.985+f2*.1-f1*.02,0.,1.);
  gl_FragColor=c;
}`;
const OUT = `
uniform sampler2D t; varying vec2 vUv;
void main(){
  vec4 c=texture2D(t,vUv);
  float k=1.-exp(-c.z*2.1);
  vec3 blue=vec3(.55,.36,.96), cyan=vec3(0.,.96,.83), pink=vec3(.96,.78,.29);
  float s=clamp(c.w*.6+vUv.x*.35+length(c.xy)*1.4,0.,1.);
  vec3 col=s<.5?mix(blue,cyan,s*2.):mix(cyan,pink,(s-.5)*2.);
  float core=smoothstep(.55,1.6,c.z);
  col=mix(col,vec3(1.),core*.1);
  gl_FragColor=vec4(col*k*0.95+vec3(.0118,.0157,.0275),1.);
}`;

export default function FluidBackdrop() {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    const touch = isTouch();
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(1);
    el.appendChild(renderer.domElement);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.PlaneGeometry(2, 2);
    const type = renderer.capabilities.isWebGL2 ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const makeTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, { type, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    let a = null;
    let b = null;
    const sim = new THREE.ShaderMaterial({
      vertexShader: VS,
      fragmentShader: SIM,
      uniforms: {
        t: { value: null },
        m: { value: new THREE.Vector2(-9, -9) },
        pm: { value: new THREE.Vector2(-9, -9) },
        m2: { value: new THREE.Vector2(-9, -9) },
        pm2: { value: new THREE.Vector2(-9, -9) },
        asp: { value: 1 },
        time: { value: 0 },
      },
    });
    const out = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: OUT, uniforms: { t: { value: null } } });
    const quad = new THREE.Mesh(geo, sim);
    const scene = new THREE.Scene();
    scene.add(quad);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      const div = touch ? 2.4 : 1.8;
      const sw = Math.max(64, Math.round(w / div));
      const sh = Math.max(64, Math.round(h / div));
      a?.dispose();
      b?.dispose();
      a = makeTarget(sw, sh);
      b = makeTarget(sw, sh);
      renderer.setClearColor(0x000000, 1);
      [a, b].forEach((rt) => {
        renderer.setRenderTarget(rt);
        renderer.clear();
      });
      renderer.setRenderTarget(null);
      sim.uniforms.asp.value = w / h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const target = new THREE.Vector2(0.5, 0.5);
    const target2 = new THREE.Vector2(0.5, 0.5);
    let real = false;
    let lastReal = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      if (e.clientY < r.top - 40 || e.clientY > r.bottom + 40) return;
      target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      real = true;
      lastReal = performance.now();
    };
    window.addEventListener('pointermove', onMove);

    let visible = false;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(el);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible || !a) return;
      const t = performance.now() / 1000;
      const idle = !real || performance.now() - lastReal > 2500;
      if (idle) {
        target.set(0.5 + Math.cos(t * 0.55) * 0.34 + Math.sin(t * 1.7) * 0.05, 0.5 + Math.sin(t * 0.8) * 0.24 + Math.cos(t * 1.2) * 0.04);
        target2.set(0.5 + Math.cos(t * 0.45 + 2.4) * 0.3 + Math.sin(t * 1.3) * 0.06, 0.5 + Math.sin(t * 0.7 + 1.1) * 0.26 + Math.cos(t * 1.6) * 0.04);
      } else {
        target2.set(1 - target.x, 1 - target.y);
      }
      if (sim.uniforms.m.value.x < -5) {
        sim.uniforms.m.value.copy(target);
        sim.uniforms.m2.value.copy(target2);
      }
      sim.uniforms.pm.value.copy(sim.uniforms.m.value);
      sim.uniforms.pm2.value.copy(sim.uniforms.m2.value);
      sim.uniforms.m.value.lerp(target, 0.12);
      sim.uniforms.m2.value.lerp(target2, 0.1);
      sim.uniforms.time.value = t;
      quad.material = sim;
      sim.uniforms.t.value = a.texture;
      renderer.setRenderTarget(b);
      renderer.render(scene, cam);
      [a, b] = [b, a];
      quad.material = out;
      out.uniforms.t.value = a.texture;
      renderer.setRenderTarget(null);
      renderer.render(scene, cam);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      a?.dispose();
      b?.dispose();
      geo.dispose();
      sim.dispose();
      out.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="sl-fluid" ref={host} aria-hidden="true" />;
}
