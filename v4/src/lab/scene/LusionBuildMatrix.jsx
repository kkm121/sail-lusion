import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { parseLusionBuf, loadLusionBuf } from './lusionBufLoader';
import { CAGE_END, ROOM_END, ROOM_START, Z0 } from '../journey';
import { labState, seg } from './shared';

// =============================================================================
// Chapter I: "Build" & Chapter II: "Discover" Cyber Data Matrix
// =============================================================================
// Cyber matrix procedural lattice and shader architecture:
// - Modular instanced geometry: grid_structure_hd, grid_base_hd, grid_structure_ld, grid_base_ld
// - Multi-channel PBR textures: base color, normal relief, occlusion/roughness/metallic
// - Structural steel rails: rich slate-titanium body with Half-Lambert diffuse illumination
//   and sharp chamfer bevel edge glints
// - Color palette: Electric Cyan -> Mint Phosphor -> Matrix Emerald Green (Build)
//   and Hyperspace Cyan -> Emerald -> Neon Magenta -> Sun Gold (Discover)
// - Hero astronaut: 4-part PBR mesh + obsidian cyan glass visor + glowing Fresnel rim
//   + 4 trailing holographic ghost echo clones with additive blending
// - Optical dispersion lens halo: continuous chromatic RGB split & radial starburst glints
// - Chapter II (Discover): 4D Hopf stereographic TWISTED matrix tunnel leading to the crystal blob
// - Dead-center corridor alignment
// =============================================================================

const COLOR_1 = ['#0d2b27', '#ba0000', '#00b5a6', '#0099ff'];
const COLOR_2 = ['#8c8c8c', '#008e6b', '#7e7f05', '#ff0000'];
const TUNNEL_HAZE = [new THREE.Color('#000000'), new THREE.Color('#1c0605'), new THREE.Color('#06200f'), new THREE.Color('#1a0820')];
const STAGE0 = [new THREE.Color('#00b5a6'), new THREE.Color('#8c8c8c')];

const COLOR_DISCOVER_1 = ['#00e5ff', '#00ff88', '#ff00aa', '#ffd700'];
const COLOR_DISCOVER_2 = ['#008e6b', '#00b5a6', '#7928ca', '#ff5a1f'];

const GRID_SIZE = 20.0;

// -----------------------------------------------------------------------------
// Cyber Matrix Shaders: Volumetric Lattice, Chamfer Specular & Micro-Pad Emission
// -----------------------------------------------------------------------------
// Lusion's own corridor shaders (lusion.co, used with permission). Two adaptations: the "black tunnel" twist at the end of
// their page is left out (it is the identity at the start), and their screen-feedback lighting term is a constant.
const TUNNEL_VERT = `
  attribute float ao;attribute float areaRatio;attribute float cluster;attribute float height;attribute vec3 center;
  attribute vec3 instancePos;attribute vec3 instanceGridIds;attribute vec3 instanceAxis;attribute vec4 tangent;
  uniform float u_time;uniform float u_showRatio;uniform float u_offsetZ;uniform float u_blackTunnelTransformRatio;
  varying vec3 v_worldPosition;varying vec4 v_worldTangent;varying vec3 v_worldNormal;varying float v_ao;varying float v_opacity;
  varying float v_emission;varying vec2 v_uv;varying vec4 v_rands;varying float v_depth;
  #define PI 3.14159265359
  vec3 qrotate(vec4 q,vec3 v){return v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
  vec4 quaternion(vec3 axis,float angle){float h=angle*0.5;return vec4(axis*sin(h),cos(h));}
  float linearStep(float e0,float e1,float x){return clamp((x-e0)/(e1-e0),0.0,1.0);}
  vec4 hash44(vec4 p4){p4=fract(p4*vec4(.1031,.1030,.0973,.1099));p4+=dot(p4,p4.wzxy+33.33);return fract((p4.xxyz+p4.yzzw)*p4.zywx);}
  vec3 inverseTransformDirection(in vec3 dir,in mat4 matrix){return normalize((vec4(dir,0.0)*matrix).xyz);}
  vec3 goalBlackTunnelTransform(vec3 pos){float t=u_blackTunnelTransformRatio*6.2831853;float zWeight=pos.z*0.025;float angle=t*zWeight*zWeight*sign(zWeight);float sa=sin(angle);float ca=cos(angle);mat2 m2=mat2(ca,-sa,sa,ca);pos.xy=m2*pos.xy;pos.z+=t*1.;pos=pos.xzy;float rad=20.;pos/=rad;vec3 a=pos;vec2 pq=vec2(-1.,.5)*t;float ada=dot(a,a);vec4 b=vec4(2.*a,ada-1.)/(1.+ada);vec4 pq_cs=vec4(cos(pq),sin(pq)).xzyw;vec2 np1=vec2(-1.,1.);vec4 c=(b.xxyy*np1.yxyy*pq_cs+b.zzww*np1.yyxy*pq_cs.yxwz).xzyw;pos=c.xyz/(1.-c.w);pos=pos.xzy;return pos*rad;}
  void main(){
    vec3 pos=position;vec3 nor=normal;vec3 tang=tangent.xyz;
    #ifdef IS_HD
    float blockId=floor(pos.x+0.5);
    #else
    float blockId=0.;
    #endif
    vec4 q;vec3 g=instanceGridIds;g.z-=floor(u_offsetZ/float(GRID_SIZE))*2.;
    vec4 r1=hash44(floor(vec4(g+.5,blockId+cluster)));v_rands=hash44(floor(vec4(g+.5,100.0)));
    float showRatio=u_showRatio;showRatio*=1.-step(10.5,instanceGridIds.z)*mod(u_offsetZ/float(GRID_SIZE),1.);
    #ifdef IS_HD
    pos=mix(center,pos,showRatio);
    pos.x-=blockId;float blockOffset=sin(u_time*2.+cos(u_time*4.+0.2+g.z))*0.15*r1.y;
    pos.y=pos.y*height+(0.025+blockOffset);float variation=floor(r1.x*8.);
    q=quaternion(vec3(0.,0.,variation>3.5?-1.:1.),(mod(blockId,4.)+mod(variation,4.))*PI*0.5);
    pos=qrotate(q,pos);nor=qrotate(q,nor);tang=qrotate(q,tang);
    #else
    pos.xy*=showRatio*showRatio;pos.z*=showRatio;
    #endif
    q=quaternion(instanceAxis,PI*0.5);pos=qrotate(q,pos)*float(GRID_SIZE)+instancePos;nor=qrotate(q,nor);tang=qrotate(q,tang);
    pos.z+=mod(u_offsetZ,float(GRID_SIZE));v_depth=-pos.z;pos=goalBlackTunnelTransform(pos);
    #ifdef IS_HD
    v_ao=ao;v_emission=areaRatio<0.25?sin(pos.z*0.25-u_time)*0.5+0.5:0.;
    #else
    v_ao=1.;v_emission=0.;
    #endif
    vec4 wp=modelMatrix*vec4(pos,1.0);
    v_opacity=linearStep(57.,30.,length(pos.xy))*linearStep(105.,85.,cameraPosition.z-wp.z);
    v_worldPosition=wp.xyz;
    v_worldTangent=vec4(inverseTransformDirection(normalMatrix*tang,viewMatrix),tangent.w);
    v_worldNormal=inverseTransformDirection(normalMatrix*nor,viewMatrix);
    v_uv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);
  }
`;

const TUNNEL_FRAG = `
  uniform sampler2D u_greebleArmTexture;uniform sampler2D u_greebleBaseTexture;uniform sampler2D u_greebleNormalTexture;
  uniform vec3 u_color1;uniform vec3 u_color2;uniform float u_feedback;uniform float u_lightZ;uniform float u_bodyGain;uniform float u_glowGain;uniform vec3 u_outBloomFromToStrength;uniform float u_contrast;uniform float u_specGain;uniform float u_glowSharp;uniform float u_depthFade;
  varying vec3 v_worldPosition;varying vec4 v_worldTangent;varying vec3 v_worldNormal;varying vec4 v_rands;
  varying float v_ao;varying float v_opacity;varying float v_emission;varying float v_depth;varying vec2 v_uv;
  void main(){
    float fd=gl_FrontFacing?1.0:-1.0;
    vec3 N=normalize(v_worldNormal)*fd;vec3 T=normalize(v_worldTangent.xyz)*fd;
    vec3 B=normalize(cross(N,T))*-v_worldTangent.w;T=normalize(cross(B,N));
    vec3 tn=normalize(texture2D(u_greebleNormalTexture,v_uv).xyz-.5);N=normalize(tn.x*T+tn.y*B+tn.z*N);
    vec4 arm=texture2D(u_greebleArmTexture,v_uv);
    float ao=v_ao*arm.r;
    vec3 lightPos=vec3(0.0,0.0,u_lightZ);
    float diffuse=dot(N,normalize(lightPos-v_worldPosition))*0.5+0.5;
    #ifdef IS_HD
    float fm=2.5;
    #else
    float fm=2.0;
    #endif
    vec3 baseColor=0.5+mix(u_color1,u_color2,v_rands.x)*1.2;
    vec3 emissiveColor=mix(u_color1,u_color2,v_rands.y)*3.5;
    // contrast: faces turned away from the far light fall into shadow (flat half-Lambert reads as cardboard)
    diffuse=pow(diffuse,u_contrast);
    diffuse*=(0.5+u_feedback*fm);
    vec3 col=baseColor*vec3(ao*0.75*diffuse)*u_bodyGain+emissiveColor*pow(v_emission,u_glowSharp)*u_glowGain;
    // glossy metal: a sharp highlight from the bright core at the far end, tinted by the stage's colours
    vec3 V=normalize(cameraPosition-v_worldPosition);vec3 L=normalize(lightPos-v_worldPosition);
    float spec=pow(max(dot(N,normalize(L+V)),0.),48.)*(1.-arm.g*0.6);
    col+=spec*u_specGain*ao*(0.6+mix(u_color1,u_color2,v_rands.x));
    col*=v_opacity;
    // the far end sinks into the dark, so the near rings read clearly instead of one dense tangle
    col*=mix(1.,exp(-max(v_depth-8.,0.)*0.03),u_depthFade);
    float endBloom=clamp((v_depth-u_outBloomFromToStrength.x)/(u_outBloomFromToStrength.y-u_outBloomFromToStrength.x),0.,1.)*u_outBloomFromToStrength.z;
    col+=endBloom*(0.35+col*0.65);
    if(v_opacity<0.002)discard;
    gl_FragColor=vec4(col,1.0);
  }
`;

// -----------------------------------------------------------------------------
// Cyber Matrix Instanced Mesh Component
// -----------------------------------------------------------------------------
function GenuineTunnelMesh({ isHd, baseGeom, structGeom, textures, uniformsRef }) {
  const meshRef = useRef();

  const instancedGeom = useMemo(() => {
    if (!baseGeom || !structGeom) return null;

    const ig = new THREE.InstancedBufferGeometry();
    for (const attrName in baseGeom.attributes) {
      ig.setAttribute(attrName, baseGeom.attributes[attrName]);
    }
    ig.index = baseGeom.index;

    const raw = structGeom.userData.rawAttributes;
    ig.setAttribute('instancePos', new THREE.InstancedBufferAttribute(raw.position.array, 3));
    ig.setAttribute('instanceGridIds', new THREE.InstancedBufferAttribute(raw.gridIds.array, 3));
    ig.setAttribute('instanceAxis', new THREE.InstancedBufferAttribute(raw.rotAxis.array, 3));
    ig.instanceCount = raw.position.array.length / 3;

    return ig;
  }, [baseGeom, structGeom]);

  const material = useMemo(() => {
    if (!textures.base) return null;

    const defines = { GRID_SIZE: '20' };
    if (isHd) defines.IS_HD = '1';

    const mat = new THREE.ShaderMaterial({
      vertexShader: TUNNEL_VERT,
      fragmentShader: TUNNEL_FRAG,
      uniforms: {
        u_time: { value: 0 },
        u_showRatio: { value: 1.0 },
        u_offsetZ: { value: 0 },
        u_blackTunnelTransformRatio: { value: 0 },
        u_innerClearRadius: { value: 0 },
        u_feedback: { value: 0.0 },
        u_contrast: { value: 1 },
        u_glowSharp: { value: 1 },
        u_depthFade: { value: 0 },
        u_specGain: { value: 0 },
        u_outBloomFromToStrength: { value: new THREE.Vector3(20, 70, 0) },
        u_bodyGain: { value: 0.42 },
        u_glowGain: { value: 2.6 },
        u_lightZ: { value: -100 },
        u_color1: { value: new THREE.Color(COLOR_1[0]) },
        u_color2: { value: new THREE.Color(COLOR_2[0]) },
        u_greebleBaseTexture: { value: textures.base },
        u_greebleNormalTexture: { value: textures.nor },
        u_greebleArmTexture: { value: textures.arm },
      },
      defines,
      side: THREE.DoubleSide,
      frustumCulled: false,
    });

    uniformsRef.current.push(mat.uniforms);
    return mat;
  }, [isHd, textures, uniformsRef]);

  if (!instancedGeom || !material) return null;

  return <mesh ref={meshRef} geometry={instancedGeom} material={material} frustumCulled={false} />;
}



// =============================================================================
// Main Component: LusionBuildMatrix
// =============================================================================
export default function LusionBuildMatrix({ sp }) {
  const [loaded, setLoaded] = useState(false);
  const geomsRef = useRef({});
  const texturesRef = useRef({});
  const uniformsRef = useRef([]);
  const curColorRef = useRef(new THREE.Color(COLOR_1[0]));
  const tunnelGroupRef = useRef();
  const pulseTimeRef = useRef({ pulse: 0, linear: 0 });

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const texLoader = new THREE.TextureLoader();
        const loadTex = (url) =>
          new Promise((resolve) => {
            texLoader.load(url, (t) => {
              t.wrapS = t.wrapT = THREE.RepeatWrapping;
              resolve(t);
            });
          });

        const [
          structHd,
          baseHd,
          structLd,
          baseLd,
          greebleBase,
          greebleNor,
          greebleArm,
        ] = await Promise.all([
          loadLusionBuf('/lusion_assets/grid_structure_hd.buf'),
          loadLusionBuf('/lusion_assets/grid_base_hd.buf'),
          loadLusionBuf('/lusion_assets/grid_structure_ld.buf'),
          loadLusionBuf('/lusion_assets/grid_base_ld.buf'),
          loadTex('/lusion_assets/greeble_base.webp'),
          loadTex('/lusion_assets/greeble_nor.webp'),
          loadTex('/lusion_assets/greeble_arm.webp'),
        ]);

        if (cancelled) return;

        geomsRef.current = {
          structHd,
          baseHd,
          structLd,
          baseLd,
        };

        texturesRef.current = {
          tunnel: {
            base: greebleBase,
            nor: greebleNor,
            arm: greebleArm,
          },
        };

        setLoaded(true);
        labState.matrix = true; // lets the warm-up wait for the corridor's files
      } catch (err) {
        console.error('Failed to load matrix binary assets:', err);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // Update tunnel motion, color transition, and camera tracking
  useFrame((state, delta) => {
    if (!loaded) return;
    if (labState.warm) {
      uniformsRef.current.forEach((u) => u?.u_showRatio && (u.u_showRatio.value = 1));
      if (tunnelGroupRef.current) tunnelGroupRef.current.visible = true;
    }

    const zc = state.camera.position.z;
    // R: Lusion's "black tunnel ratio". Build runs it 0-0.3 (dark teal), Discover 0.3-0.68 (red then green stages) and
    // Create 0.68-1 (blue-red stage, bent into the crystal lattice); the corridor hands over to a white flash at the end.
    const R = zc > CAGE_END ? 0.3 * seg(zc, Z0, CAGE_END) : zc > ROOM_START ? 0.3 + 0.38 * seg(zc, CAGE_END, ROOM_START) : 0.68 + 0.32 * seg(zc, ROOM_START, ROOM_END);
    labState.tunnelR = R;
    const live = zc <= Z0 + 4 && zc > ROOM_END - 2;
    const build = sp ? seg(sp.current, 0.546, 0.672) : 1;
    // the corridor folds away for the blob interlude in the middle of Discover, and comes back after the dive
    const showRatio = Math.pow(build, 1.3) * (1 - seg(zc, ROOM_END + 6, ROOM_END - 2)) * (1 - (labState.blobK || 0));
    if (tunnelGroupRef.current) {
      tunnelGroupRef.current.position.z = zc;
      // also drawn during the hidden warm-up, so its shaders and buffers are ready before it first appears
      tunnelGroupRef.current.visible = labState.warm || (live && showRatio > 0.001);
    }
    if (labState.warm) return;

    const sineIn = (t) => 1 - Math.cos((t * Math.PI) / 2);
    const fit = (v, a0, a1, b0, b1) => b0 + (b1 - b0) * seg(v, a0, a1);
    const twist = sineIn(seg(R, 0.6, 1));
    // their pulse and drift, run by scroll
    const dt = Math.min(delta, 0.05);
    pulseTimeRef.current.pulse += dt * seg(R, 0.02, 0.12) * fit(twist, 0, 0.25, 1, 0.5) * 1.5;
    pulseTimeRef.current.linear += dt * fit(twist, 0, 0.25, 1.5, 1) * 0.6;
    if (tunnelGroupRef.current) tunnelGroupRef.current.rotation.z += dt * 0.14 * twist;
    const f = pulseTimeRef.current.pulse;
    const pStep = Math.floor(f);
    const g = f - pStep;
    const offsetZ = (pStep + (g < 0.5 ? 4 * g * g * g : 1 - Math.pow(-2 * g + 2, 3) / 2)) * GRID_SIZE + pulseTimeRef.current.linear * GRID_SIZE + R * GRID_SIZE * 30;

    // colour stages, snapping as theirs do; stage 0 is our teal and grey
    const T = COLOR_1.length * seg(R, 0.2, 1);
    const st = Math.min(COLOR_1.length - 1, Math.floor(T) + (T - Math.floor(T) > 0.5 ? 1 : 0));
    const c1A = st === 0 ? STAGE0[0] : new THREE.Color(COLOR_1[st]);
    const c2A = st === 0 ? STAGE0[1] : new THREE.Color(COLOR_2[st]);
    curColorRef.current.copy(c2A);
    // the haze each stage sits in (their background layer): none in Build, then dark red, green and violet
    const haze = TUNNEL_HAZE[st];
    labState.tunnelHaze = labState.tunnelHaze || new THREE.Color();
    labState.tunnelHaze.lerp(haze, 1 - Math.exp(-4 * Math.min(delta, 0.05)));
    labState.tunnelHazeK = THREE.MathUtils.smoothstep(R, 0.28, 0.4) * (1 - seg(zc, ROOM_END + 8, ROOM_END));

    // their far-end glow, and the lens breathing (a dolly-zoom wobble) once the stages start
    const ob = new THREE.Vector3(fit(R, 0.75, 0.85, 20, 60), 70, 0);
    ob.z = R < 0.75 ? fit(R, 0.65, 0.75, 0, 0.2) : fit(R, 0.75, 0.85, 0.2, 0.15);
    if (R > 0.9) ob.x = fit(R, 0.9, 1, 60, 30);
    labState.fovOffset = Math.sin(R * 10 + state.clock.elapsedTime) * 7.5 * THREE.MathUtils.smoothstep(R, 0.3, 0.5);

    uniformsRef.current.forEach((u) => {
      if (!u) return;
      u.u_time.value = state.clock.elapsedTime;
      u.u_lightZ.value = zc - 100;
      u.u_showRatio.value = showRatio;
      u.u_offsetZ.value = offsetZ;
      u.u_color1.value.copy(c1A);
      u.u_color2.value.copy(c2A);
      u.u_blackTunnelTransformRatio.value = twist;
      u.u_outBloomFromToStrength.value.copy(ob);
      // the dark Build look gives way to their brightly lit coloured stages
      const lit = THREE.MathUtils.smoothstep(R, 0.3, 0.5);
      const tw = THREE.MathUtils.smoothstep(R, 0.66, 0.8);
      u.u_bodyGain.value = (0.42 + 0.68 * lit) * (1 - 0.5 * tw);
      u.u_contrast.value = 1 + 1.6 * tw;
      u.u_specGain.value = 1.4 * tw;
      // fewer, sharper glints in the crystal tunnel (a travelling band rather than every pad lit)
      u.u_glowSharp.value = 1 + 3 * tw;
      u.u_glowGain.value *= 1 - 0.25 * tw;
      u.u_depthFade.value = tw;
      u.u_feedback.value = 0.25 * lit;
      u.u_glowGain.value = 2.6 + 1.2 * lit;
    });
  });

  if (!loaded) return null;

  return (
    <>
      {/* Infinite Tunnel Conduit (Synchronized with camera Z) */}
      <group ref={tunnelGroupRef}>
        {/* 1. Structural Scaffolding Lattice (Low-Density Rails, ZERO EMISSION) */}
        <GenuineTunnelMesh
          isHd={false}
          baseGeom={geomsRef.current.baseLd}
          structGeom={geomsRef.current.structLd}
          textures={texturesRef.current.tunnel}
          uniformsRef={uniformsRef}
        />

        {/* 2. High-Density Stepped Voxel Clusters (Rods NEVER emit glow) */}
        <GenuineTunnelMesh
          isHd={true}
          baseGeom={geomsRef.current.baseHd}
          structGeom={geomsRef.current.structHd}
          textures={texturesRef.current.tunnel}
          uniformsRef={uniformsRef}
        />
      </group>
    </>
  );
}
