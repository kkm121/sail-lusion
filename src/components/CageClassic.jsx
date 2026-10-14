import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { glowTexture, seeded } from '../lib/three-utils';
import { CAGE_END } from '../lib/journey';

const W = 6.2;
const CAGE_LIMIT = CAGE_END + 10; // -110: strictly terminates before Chapter II (Lattice) begins

const GHOST_V = `varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const GHOST_F = `uniform vec3 uA; uniform vec3 uB; uniform float uO; varying vec3 vN; varying vec3 vV;
void main(){ float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 1.8); vec3 col = mix(uA, uB, f); gl_FragColor = vec4(col * (0.35 + f * 1.4), (0.06 + f * 0.7) * uO); }`;

function fillMatrices(mesh, items) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  items.forEach((it, i) => {
    q.setFromEuler(e.set(it.r?.[0] || 0, it.r?.[1] || 0, it.r?.[2] || 0));
    m.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...it.s));
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

function Frame() {
  const beams = useRef();
  const diag = useRef();
  const items = useMemo(() => {
    const rnd = seeded(101);
    const out = [];

    // Perimeter rectangular framing rings (stops cleanly before CAGE_END)
    for (let k = 0; k < 17; k++) {
      const z = -14 - k * 6; // from -14 to -110
      out.push({ p: [0, W, z], s: [W * 2 + 0.2, 0.2, 0.2] });
      out.push({ p: [0, -W, z], s: [W * 2 + 0.2, 0.2, 0.2] });
      out.push({ p: [-W, 0, z], s: [0.2, W * 2 + 0.2, 0.2] });
      out.push({ p: [W, 0, z], s: [0.2, W * 2 + 0.2, 0.2] });
    }

    // 4 Longitudinal corner rails spanning the cage corridor
    const railLen = Math.abs(CAGE_LIMIT) - 10; // ~100 units
    const railCenterZ = -14 - railLen / 2;
    [[-W, -W], [W, -W], [-W, W], [W, W]].forEach(([x, y]) => {
      out.push({ p: [x, y, railCenterZ], s: [0.26, 0.26, railLen] });
    });

    // Outer wall stringers (flush along exterior walls, never floating across the central flight path)
    for (let i = 0; i < 90; i++) {
      const wall = Math.floor(rnd() * 4);
      const u = (rnd() * 2 - 1) * (W - 0.4);
      const inset = 0.05 + rnd() * 0.4;
      const len = 4 + rnd() * 16;
      const z = -12 - rnd() * (Math.abs(CAGE_LIMIT) - 26); // strictly within cage
      const th = 0.09 + rnd() * 0.1;
      const pos =
        wall === 0
          ? [u, W - inset, z]
          : wall === 1
          ? [u, -W + inset, z]
          : wall === 2
          ? [-W + inset, u, z]
          : [W - inset, u, z];
      out.push({ p: pos, s: [th, th, len] });
    }

    return out;
  }, []);

  const braces = useMemo(() => {
    const rnd = seeded(202);
    const out = [];
    for (let i = 0; i < 38; i++) {
      const wall = Math.floor(rnd() * 4);
      const z = -16 - rnd() * (Math.abs(CAGE_LIMIT) - 30);
      const len = 4 + rnd() * 4.5;
      const ang = (rnd() < 0.5 ? 1 : -1) * (Math.PI / 4 + (rnd() - 0.5) * 0.35);
      const th = 0.09 + rnd() * 0.07;
      const u = (rnd() * 2 - 1) * (W - 1.8);
      if (wall === 0) out.push({ p: [u, W - 0.05, z], s: [th, th, len], r: [0, ang, 0] });
      else if (wall === 1) out.push({ p: [u, -W + 0.05, z], s: [th, th, len], r: [0, ang, 0] });
      else if (wall === 2) out.push({ p: [-W + 0.05, u, z], s: [th, th, len], r: [ang, 0, 0] });
      else out.push({ p: [W - 0.05, u, z], s: [th, th, len], r: [ang, 0, 0] });
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    fillMatrices(beams.current, items);
    fillMatrices(diag.current, braces);
  }, [items, braces]);

  return (
    <>
      <instancedMesh ref={beams} args={[undefined, undefined, items.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#262218" metalness={0.92} roughness={0.22} envMapIntensity={1.8} />
      </instancedMesh>
      <instancedMesh ref={diag} args={[undefined, undefined, braces.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2c271e" metalness={0.88} roughness={0.28} envMapIntensity={1.6} />
      </instancedMesh>
    </>
  );
}

const PANE_V = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const PANE_F = `uniform float uTime; uniform vec2 uCorner; varying vec2 vUv;
void main(){
  float edge = min(min(vUv.x, 1. - vUv.x), min(vUv.y, 1. - vUv.y));
  float line = 1. - smoothstep(0., 0.028, edge);
  float g = clamp(dot(vUv - .5, uCorner) + .5, 0., 1.);
  float sheen = smoothstep(0.42, 1., sin((vUv.x + vUv.y) * 5.2 - uTime * 0.45));
  vec3 gold = vec3(1.0, 0.88, 0.42); // 24k radiant gold
  float a = 0.03 + g * g * 0.22 + sheen * 0.16 * g + line * 0.65 * (0.45 + g);
  gl_FragColor = vec4(gold * 3.4, a);
}`;

function GoldCorner() {
  const group = useRef();
  const tex = useMemo(() => glowTexture(), []);
  const mats = useMemo(
    () => [new THREE.Vector2(0, 1), new THREE.Vector2(1, 0)].map((c) =>
      new THREE.ShaderMaterial({
        vertexShader: PANE_V,
        fragmentShader: PANE_F,
        uniforms: { uTime: { value: 0 }, uCorner: { value: c } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    ),
    []
  );

  const zs = useMemo(() => Array.from({ length: 6 }, (_, k) => -18 - k * 18), []);

  useFrame((s) => {
    mats.forEach((m) => (m.uniforms.uTime.value = s.clock.elapsedTime));
    if (group.current) group.current.visible = s.camera.position.z > CAGE_END - 5;
  });

  return (
    <group ref={group}>
      {zs.map((z) => (
        <group key={z}>
          <mesh material={mats[0]} position={[W - 0.08, W - 1.25, z]} rotation={[0, -Math.PI / 2, 0]} frustumCulled={false}>
            <planeGeometry args={[11, 3.0]} />
          </mesh>
          <mesh material={mats[1]} position={[W - 1.25, W - 0.08, z]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <planeGeometry args={[3.0, 11]} />
          </mesh>
          <sprite position={[W - 0.5, W - 0.5, z]} scale={14}>
            <spriteMaterial map={tex} color="#ffd469" transparent opacity={0.72} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        </group>
      ))}
    </group>
  );
}

function Glitch({ tone }) {
  const ref = useRef();
  const data = useMemo(() => {
    const rnd = seeded(303);
    const items = [];
    const meta = [];
    for (let c = 0; c < 46; c++) {
      const wall = Math.floor(rnd() * 4);
      const u = (rnd() * 2 - 1) * (W - 0.5);
      const z = -14 - rnd() * (Math.abs(CAGE_LIMIT) - 24);
      const inset = 0.2 + rnd() * 1.2;
      const base = wall === 0 ? [u, W - inset, z] : wall === 1 ? [u, -W + inset, z] : wall === 2 ? [-W + inset, u, z] : [W - inset, u, z];
      const n = 6 + Math.floor(rnd() * 16);
      for (let i = 0; i < n; i++) {
        const sx = 0.08 + rnd() * 0.38;
        const sy = 0.04 + rnd() * 0.16;
        const flat = rnd() < 0.5;
        items.push({
          p: [base[0] + (rnd() - 0.5) * 2.0, base[1] + (rnd() - 0.5) * 2.0, base[2] + (rnd() - 0.5) * 2.5],
          s: flat ? [sx, sy, 0.02] : [0.02, sy, sx],
        });
        meta.push({ ph: rnd() * 6.28, sp: 0.8 + rnd() * 2.6, amp: 0.5 + rnd() * 1.8, hue: rnd() });
      }
    }
    return { items, meta };
  }, []);

  const colors = useMemo(() => new Float32Array(data.items.length * 3), [data]);
  useLayoutEffect(() => {
    fillMatrices(ref.current, data.items);
    ref.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
  }, [data, colors]);

  const cGoldA = useMemo(() => new THREE.Color('#ffe699'), []);
  const cGoldB = useMemo(() => new THREE.Color('#f5c84b'), []);
  const tick = useRef(0);

  useFrame((s) => {
    if (++tick.current % 2) return;
    const t = s.clock.elapsedTime;
    const m = data.meta;
    for (let i = 0; i < m.length; i++) {
      const v = Math.sin(t * m[i].sp + m[i].ph);
      const on = v > 0.5 ? (v - 0.5) / 0.5 : 0;
      const k = 0.15 + on * m[i].amp * 2.8;
      const mix = m[i].hue;
      colors[i * 3] = (cGoldA.r * (1 - mix) + cGoldB.r * mix) * k;
      colors[i * 3 + 1] = (cGoldA.g * (1 - mix) + cGoldB.g * mix) * k;
      colors[i * 3 + 2] = (cGoldA.b * (1 - mix) + cGoldB.b * mix) * k;
    }
    ref.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.items.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function Bubbles() {
  const refs = useRef([]);
  const spots = useMemo(() => {
    const rnd = seeded(606);
    const out = [];
    for (let i = 0; i < 6; i++) {
      out.push({ p: [(rnd() - 0.5) * 6, (rnd() - 0.5) * 5, -24 - i * 14 - rnd() * 4], s: 0.55 + rnd() * 0.5, sp: 0.15 + rnd() * 0.3, ph: rnd() * 6 });
    }
    return out;
  }, []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const sp = spots[i];
      m.position.y = sp.p[1] + Math.sin(t * 0.6 + sp.ph) * 0.35;
    });
  });

  return (
    <>
      {spots.map((sp, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={sp.p} scale={sp.s}>
          <sphereGeometry args={[1.2, 64, 48]} />
          <shaderMaterial vertexShader={GHOST_V} fragmentShader={GHOST_F} transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={{ uA: { value: new THREE.Color('#6a4e0a') }, uB: { value: new THREE.Color('#ffeaa8') }, uO: { value: 1 } }} />
        </mesh>
      ))}
    </>
  );
}

export default function CageClassic({ tone, touch }) {
  const group = useRef();

  useFrame((s) => {
    if (group.current) {
      // Clean cutoff: strictly hidden once camera enters Chapter II
      group.current.visible = s.camera.position.z > CAGE_END - 5;
    }
  });

  return (
    <group ref={group}>
      <Frame />
      <GoldCorner />
      <Glitch tone={tone} />
      <Bubbles />
      <Sparkles
        count={touch ? 160 : 420}
        scale={[W * 1.8, W * 1.8, 105]}
        position={[0, 0, -55]}
        color="#ffd56b"
        size={touch ? 3.5 : 5.5}
        speed={0.45}
        opacity={0.88}
      />
    </group>
  );
}
