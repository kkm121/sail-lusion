import { useEffect, useRef } from 'react';
import { hasWebGL, isTouch } from '../lib/device';

const VERT = `
uniform float uTime;
uniform float uK;
uniform float uBurst;
uniform vec2 uMouse;
uniform float uPixel;
uniform float uSizeMul;
varying float vH;
vec3 hash(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return fract(sin(p)*43758.5453)*2.-1.;}
float noise(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float r=0.;
  for(int x=0;x<2;x++)for(int y=0;y<2;y++)for(int z=0;z<2;z++){
    vec3 o=vec3(float(x),float(y),float(z));
    r+=dot(hash(i+o),f-o)*(1.-abs(f.x-o.x))*(1.-abs(f.y-o.y))*(1.-abs(f.z-o.z));
  }
  return r;
}
void main(){
  vec3 p=position;
  float d=noise(p*1.7+uTime*.35);
  vH=d;
  p*=(.55+.45*uK)+d*(.18+.62*uK);
  vec3 w=vec3(uMouse*2.4,0.);
  p+=normalize(p-w*.3+1e-4)*smoothstep(1.8,0.,distance(p,w))*.35;
  p*=1.+uBurst*3.2;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_PointSize=uPixel*uSizeMul*(2.4+1.6*uK)*(4.2/-mv.z);
  gl_Position=projectionMatrix*mv;
}`;

const FRAG = `
uniform float uBurst;
uniform float uAlpha;
varying float vH;
void main(){
  float d=length(gl_PointCoord-.5);
  if(d>.5) discard;
  vec3 blue=vec3(.55,.36,.96);
  vec3 cyan=vec3(0.,.96,.83);
  vec3 gold=vec3(.96,.78,.29);
  float t=clamp(vH*1.6+.5,0.,1.);
  vec3 col=t<.5?mix(blue,cyan,t*2.):mix(cyan,gold,(t-.5)*2.);
  float a=uAlpha*(1.-d*2.)*(1.-uBurst);
  gl_FragColor=vec4(col,a);
}`;

export default function PreloaderBlob({ progress, phase }) {
  const host = useRef(null);
  const state = useRef({ progress: 0, phase: 'load' });
  state.current.progress = progress;
  state.current.phase = phase;

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    if (!hasWebGL()) return undefined;
    (async () => {
      const THREE = await import('three');
      const el = host.current;
      if (disposed || !el) return;
      const touch = isTouch();
      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
      const pixel = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2);
      renderer.setPixelRatio(pixel);
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
      camera.position.z = 4.4;

      const count = touch ? 14000 : 38000;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.acos(2 * Math.random() - 1);
        const r = 0.82 + Math.random() * 0.18;
        positions.set([Math.sin(v) * Math.cos(u) * r, Math.sin(v) * Math.sin(u) * r, Math.cos(v) * r], i * 3);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const uniforms = {
        uTime: { value: 0 },
        uK: { value: 0 },
        uBurst: { value: 0 },
        uMouse: { value: new THREE.Vector2() },
        uPixel: { value: pixel },
        uSizeMul: { value: touch ? 1.3 : 1 },
        uAlpha: { value: touch ? 0.85 : 0.7 },
      };
      const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.position.z = w / h < 1 ? 6.4 : 4.4;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      const mouse = new THREE.Vector2();
      const onMove = (e) => mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      window.addEventListener('pointermove', onMove);

      const clock = new THREE.Clock();
      let raf = 0;
      let burst = 0;
      let alpha = uniforms.uAlpha.value;
      const base = uniforms.uAlpha.value;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const s = state.current;
        uniforms.uTime.value = clock.getElapsedTime();
        const target = s.phase === 'load' ? s.progress / 100 : s.phase === 'mark' ? 0.06 : 0.9;
        uniforms.uK.value += (target - uniforms.uK.value) * (s.phase === 'mark' ? 0.12 : 0.08);
        alpha += ((s.phase === 'mark' ? base * 0.22 : base) - alpha) * 0.1;
        uniforms.uAlpha.value = alpha;
        uniforms.uMouse.value.lerp(mouse, 0.08);
        burst += ((s.phase === 'open' ? 1 : 0) - burst) * 0.07;
        uniforms.uBurst.value = burst;
        points.rotation.y += 0.0035 + uniforms.uK.value * 0.004;
        points.rotation.x = Math.sin(uniforms.uTime.value * 0.3) * 0.2;
        renderer.render(scene, camera);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener('pointermove', onMove);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div className="sl-pre-blob" ref={host} aria-hidden="true" />;
}
