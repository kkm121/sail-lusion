import { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MEDIA } from '../media';
import { ROOM_END, START } from '../journey';
import { dressRobot } from './Navigator';
import { ease, labState, lerp, seg } from './shared';

// Phase one's lead: Nav floats close to the camera in the dark (seen inside the device first), turns away while the
// caption spreads, drifts off to a speck inside the halo, and then leads the way down the Build corridor.
const H = 2.4; // robot height in world units

// A faint smoky light behind the robot in the close-up (value noise, very dim, blue-grey).
const SMOKE_V = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
const SMOKE_F = `uniform float uTime; uniform float uGain; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * n(p); p = p * 2.03 + 7.1; a *= .5; } return s; }
void main(){
  vec2 q = vUv - .5;
  float r = length(q * vec2(1., 1.25));
  float m = fbm(q * 3.2 + vec2(uTime * .015, -uTime * .01)) ;
  float m2 = fbm(q * 6.5 - vec2(uTime * .02, 0.));
  float a = smoothstep(.5, .05, r) * pow(m * .7 + m2 * .4, 2.2);
  gl_FragColor = vec4(vec3(.55, .62, .78) * a * uGain, 1.);
}`;

export default function Pilot({ sp }) {
  const group = useRef();
  const body = useRef();
  const holder = useRef();
  const key = useRef();
  const rim = useRef();
  const fill = useRef();
  const { scene, animations } = useGLTF(MEDIA.navigator);
  const model = useMemo(() => dressRobot(scene), [scene]);
  const { actions } = useAnimations(animations, holder);
  const smoke = useMemo(() => new THREE.ShaderMaterial({ vertexShader: SMOKE_V, fragmentShader: SMOKE_F, uniforms: { uTime: { value: 0 }, uGain: { value: 0 } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  const root = useThree((st) => st.scene);
  const smooth = useRef(-1);

  useEffect(() => {
    const idle = actions.Idle;
    if (idle) {
      idle.reset().setLoop(THREE.LoopRepeat, Infinity).play();
      idle.timeScale = 0.45;
    }
    return () => idle?.stop();
  }, [actions]);

  useFrame((s, dt) => {
    const g = group.current;
    if (!g) return;
    const t = s.clock.elapsedTime;
    const p = sp.current;
    const cam = s.camera;
    // the camera's own height and sway are left out, so the robot stays framed the same way as you move the pointer
    const warm = labState.warm;
    // gone by the time the corridor turns into the Discover core
    const zc = cam.position.z;
    const life = p < START ? 1 : 1 - seg(zc, ROOM_END + 10, ROOM_END);
    g.visible = warm || life > 0.002;
    const lk = warm ? 1 : life;
    if (key.current) key.current.intensity = 95 * lk * (1 - 0.55 * seg(p, 0.5, 0.58));
    if (rim.current) rim.current.intensity = 9 * lk;
    if (fill.current) fill.current.intensity = 7 * lk;
    if (!g.visible) return;

    // distance ahead of the camera: close-up, then away to a speck, then a steady lead down the corridor
    const away = seg(p, 0.395, 0.55);
    // portrait screens frame the close-up from further back, so the robot is the same share of the width
    const fit = THREE.MathUtils.clamp(cam.aspect / 1.5, 0.52, 1);
    const dist = lerp(3.7 / fit, 46, Math.pow(away, 2.3)) - 33 * ease(seg(p, START - 0.01, START + 0.04)); // closes in to lead the way, about three cells ahead
    const yOff = lerp(-1.05 / Math.sqrt(fit), -0.05, ease(seg(p, 0.39, 0.5)));
    const swayX = Math.sin(t * 0.32) * 0.12 * (1 - away) + (p > START ? Math.sin(t * 0.21) * 0.3 : 0);
    const swayY = Math.sin(t * 0.47) * 0.08 + (p > START ? Math.cos(t * 0.17) * 0.2 : 0);
    g.position.set(swayX, yOff + swayY, zc - dist);
    if (smooth.current < 0) smooth.current = p;
    smooth.current += (p - smooth.current) * (1 - Math.exp(-6 * Math.min(dt, 0.05)));
    const q = smooth.current;
    if (body.current) {
      body.current.scale.setScalar(H * (warm ? 0.02 : 1));
      // facing the visitor in the close-up; turns its back and pitches forward to swim away, then tumbles slowly
      const turn = ease(seg(q, 0.37, 0.47));
      const tumble = p > START ? (p - START) * 22 : 0;
      body.current.rotation.set(lerp(0.08, 0.55, turn) + Math.sin(t * 0.4) * 0.04 + tumble * 0.18, lerp(-0.18, Math.PI * 0.92, turn) + Math.sin(t * 0.27) * 0.08 + tumble * 0.6, lerp(0.04, -0.22, turn) + Math.sin(t * 0.33) * 0.05);
    }
    smoke.uniforms.uTime.value = t;
    smoke.uniforms.uGain.value = (warm ? 0 : 1) * 0.24 * seg(p, 0.12, 0.27) * (1 - seg(p, 0.385, 0.43));
    // lights ride with the robot: a white key from above right, a cool rim from behind, a dim fill from below
    if (key.current) key.current.position.set(g.position.x + 3.2, g.position.y + 4, g.position.z + 4.5);
    if (rim.current) rim.current.position.set(g.position.x - 2.5, g.position.y + 2.2, g.position.z - 3);
    if (fill.current) fill.current.position.set(g.position.x, g.position.y - 3, g.position.z + 2);
  });

  return (
    <>
      {createPortal(
        <>
          <pointLight ref={key} intensity={2.6} distance={9} decay={2} color="#ffffff" />
          <pointLight ref={rim} intensity={5.5} distance={9} decay={1.4} color="#a8c6ff" />
          <pointLight ref={fill} intensity={0.5} distance={6} decay={2} color="#8a94a8" />
        </>,
        root
      )}
      <group ref={group} visible={false}>
        <mesh material={smoke} position={[0.3, 0.9, -2.2]} renderOrder={-1} frustumCulled={false}>
          <planeGeometry args={[11, 8]} />
        </mesh>
        <group ref={body}>
          <group scale={model.userData.fit.k}>
            <group position={[-model.userData.fit.c.x, -model.userData.fit.c.y, -model.userData.fit.c.z]}>
              <group ref={holder}>
                <primitive object={model} />
              </group>
            </group>
          </group>
        </group>
      </group>
    </>
  );
}
