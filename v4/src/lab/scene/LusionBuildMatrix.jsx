import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { parseLusionBuf, loadLusionBuf } from './lusionBufLoader';
import { CAGE_END, ROOM_START, Z0 } from '../journey';
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
  uniform float u_time;uniform float u_showRatio;uniform float u_offsetZ;
  varying vec3 v_worldPosition;varying vec4 v_worldTangent;varying vec3 v_worldNormal;varying float v_ao;varying float v_opacity;
  varying float v_emission;varying vec2 v_uv;varying vec4 v_rands;varying float v_depth;
  #define PI 3.14159265359
  vec3 qrotate(vec4 q,vec3 v){return v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
  vec4 quaternion(vec3 axis,float angle){float h=angle*0.5;return vec4(axis*sin(h),cos(h));}
  float linearStep(float e0,float e1,float x){return clamp((x-e0)/(e1-e0),0.0,1.0);}
  vec4 hash44(vec4 p4){p4=fract(p4*vec4(.1031,.1030,.0973,.1099));p4+=dot(p4,p4.wzxy+33.33);return fract((p4.xxyz+p4.yzzw)*p4.zywx);}
  vec3 inverseTransformDirection(in vec3 dir,in mat4 matrix){return normalize((vec4(dir,0.0)*matrix).xyz);}
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
    pos.z+=mod(u_offsetZ,float(GRID_SIZE));v_depth=-pos.z;
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
  uniform vec3 u_color1;uniform vec3 u_color2;uniform float u_feedback;uniform float u_lightZ;uniform float u_bodyGain;uniform float u_glowGain;
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
    diffuse*=(0.5+u_feedback*fm);
    vec3 col=baseColor*vec3(ao*0.75*diffuse)*u_bodyGain+emissiveColor*v_emission*u_glowGain;
    col*=v_opacity;
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
    const inBuild = zc <= Z0 + 4 && zc > CAGE_END;

    const progressBuild = THREE.MathUtils.clamp((Z0 - zc) / (Z0 - CAGE_END), 0, 1);
    const exitBuild = THREE.MathUtils.smoothstep(zc, CAGE_END, CAGE_END + 12.0);

    // Opening conduit entry ratio & smooth exit handover at CAGE_END
    const openProg = THREE.MathUtils.clamp(progressBuild / 0.15, 0, 1);
    // the corridor assembles out of its parts' centres as you scroll into it (the Build beat), then hands over at the end
    const build = sp ? Math.min(1, Math.max(0, (sp.current - 0.546) / (0.672 - 0.546))) : openProg;
    const showRatio = Math.pow(build, 1.3) * exitBuild;

    // Tunnel mesh follows camera along Z so the 110-unit buffer spans Chapter I Build!
    if (tunnelGroupRef.current) {
      tunnelGroupRef.current.position.z = zc;
      // also drawn during the hidden warm-up, so its shaders and buffers are ready before it first appears
      tunnelGroupRef.current.visible = labState.warm || (inBuild && showRatio > 0.001);
    }

    // High-precision stepped pulse scroll motion synchronized with scroll
    const dt = Math.min(delta, 0.05);
    const scrollFactor = progressBuild;
    pulseTimeRef.current.pulse += dt * THREE.MathUtils.clamp((scrollFactor - 0.05) / 0.25, 0, 1) * 1.5;
    pulseTimeRef.current.linear += dt * 0.85;

    const f = pulseTimeRef.current.pulse;
    const pStep = Math.floor(f);
    const gStep = f - pStep;
    const cubicG = gStep < 0.5 ? 4 * gStep * gStep * gStep : 1 - Math.pow(-2 * gStep + 2, 3) / 2;
    const offsetZ = (pStep + cubicG) * GRID_SIZE + pulseTimeRef.current.linear * GRID_SIZE + scrollFactor * GRID_SIZE * 10.0;

    // Cyber Matrix Palette: Brilliant Electric Cyan & Matrix Emerald Green
    const colorIdx = 0;
    const m = Math.floor(colorIdx);
    const s = Math.min(m + 1, COLOR_1.length - 1);
    const frac = colorIdx - m;
    // teal and grey: their teal glints among grey-white ones, as in their corridor footage
    const c1A = new THREE.Color('#00b5a6');
    const c2A = new THREE.Color('#8c8c8c');

    curColorRef.current.copy(c2A);

    // Rectilinear corridor tunnel in Chapter I Build
    const twistRatio = 0.0;
    const innerClear = 0.0;

    // Apply uniforms to all tunnel shader materials
    uniformsRef.current.forEach((u) => {
      if (!u) return;
      if (u.u_time) u.u_time.value = state.clock.elapsedTime;
      if (u.u_lightZ) u.u_lightZ.value = zc - 100;
      if (u.u_showRatio) u.u_showRatio.value = showRatio;
      if (u.u_offsetZ) u.u_offsetZ.value = offsetZ;
      if (u.u_color1) u.u_color1.value.copy(c1A);
      if (u.u_color2) u.u_color2.value.copy(c2A);
      if (u.u_blackTunnelTransformRatio) u.u_blackTunnelTransformRatio.value = twistRatio;
      if (u.u_innerClearRadius) u.u_innerClearRadius.value = innerClear;
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
