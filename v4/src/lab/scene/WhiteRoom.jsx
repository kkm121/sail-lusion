import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { loadLusionBuf } from './lusionBufLoader';
import { CONNECT_END, ROOM_END } from '../journey';
import { asset } from '../media';
import { labState, seg } from './shared';

// Chapter IV, Connect: Lusion's blue room (used with permission). Sixteen wall blocks laid end to end, bent by their
// deform shader into a winding tube that straightens and opens as you scroll, patterned with moving voronoi rings.
// Their shaders, unchanged except that their Brownian-motion light wobble is a pair of slow sines.
const BLOCK_COUNT = 16;

const BLOCK_VERT = `
attribute float a_instanceId;uniform float u_time;uniform float u_ratio;uniform float u_ratioInverse;varying vec3 v_worldPosition;varying vec3 v_worldNormal;varying vec3 v_localPosition;varying vec2 v_uv;varying vec3 v_viewPosition;varying float v_lengthRatio;varying float v_fog;
vec3 deform(in vec3 pos){float origZ=pos.z;float blockCount=float(BLOCK_COUNT);float ratio=mix(.1,1.,u_ratioInverse);float lengthRatio=-pos.z/blockCount;float scalar=mix(0.25,ratio,lengthRatio);pos.x*=1.0+scalar*0.5*sin(lengthRatio*6.283184);pos.y*=1.0+scalar*0.5*cos(lengthRatio*6.283184+3.1415926);float angleRatio=smoothstep(0.25,1.,u_ratioInverse);float angle=(angleRatio+angleRatio*lengthRatio*lengthRatio*1.)*-6.283184;float s=sin(angle);float c=cos(angle);mat2 m=mat2(c,-s,s,c);pos.xy=m*pos.xy;pos.y+=ratio*sin(ratio*lengthRatio*3.141592*4.)*0.25;pos.z-=(cos(ratio*1.5+(1.0-ratio)*lengthRatio*3.141592*0.5)*0.5+0.5-1.0)*blockCount;pos.z*=1.0+16.0*(ratio*lengthRatio*lengthRatio)+2.0*ratio*(sin(8.0*lengthRatio)*0.5+0.5);pos.z*=(1.-ratio*ratio*ratio)*0.9+0.1;pos.z+=blockCount/4.;return pos*15.;}
vec3 inverseTransformDirection(in vec3 dir,in mat4 matrix){return normalize((vec4(dir,0.0)*matrix).xyz);}
void main(){float blockCount=float(BLOCK_COUNT);vec3 pos=position;pos.z-=a_instanceId;pos.z/=blockCount;float lengthRatio=-pos.z;pos.z*=blockCount;v_localPosition=pos;v_lengthRatio=lengthRatio;vec3 nor=deform(pos+normal*0.01);pos=deform(pos);nor=normalize(nor-pos);vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);v_viewPosition=mvPosition.xyz;v_fog=-0.005*mvPosition.z/mvPosition.w;gl_Position=projectionMatrix*mvPosition;v_worldPosition=(modelMatrix*vec4(pos,1.0)).xyz;v_worldNormal=inverseTransformDirection(normalMatrix*nor,viewMatrix);v_uv=uv;}`;

const BLOCK_FRAG = `
uniform sampler2D u_texture;uniform float u_ratioInverse;uniform vec3 u_fbm;varying vec3 v_localPosition;varying vec2 v_uv;varying vec3 v_worldPosition;varying vec3 v_worldNormal;varying vec3 v_viewPosition;varying float v_lengthRatio;varying float v_fog;uniform float u_time;uniform vec3 u_origin;
float sphOcclusion(in vec3 pos,in vec3 nor,in vec4 sph){vec3 di=sph.xyz-pos;float l=length(di);float nl=dot(nor,di/l);float h=l/sph.w;float h2=h*h;return max(0.0,nl)/h2;}
float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}
vec4 hash(vec4 p4){p4=fract(p4*vec4(.1031,.1030,.0973,.1099));p4+=dot(p4,p4.wzxy+33.33);return fract((p4.xxyz+p4.yzzw)*p4.zywx);}
vec3 voronoi(const in vec4 x){vec4 p=floor(x);vec4 f=fract(x);float id=0.0;vec2 res=vec2(100.0);for(int l=-1;l<=1;l++){for(int k=-1;k<=1;k++){for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){vec4 b=vec4(float(i),float(j),float(k),float(l));vec4 r=vec4(b)-f+hash(p+b);float d=dot(r,r);float cond=max(sign(res.x-d),0.0);float nCond=1.0-cond;float cond2=nCond*max(sign(res.y-d),0.0);float nCond2=1.0-cond2;id=(dot(p+b,vec4(1.0,57.0,113.0,421.))*cond)+(id*nCond);res=vec2(d,res.x)*cond+res*nCond;res.y=cond2*d+nCond2*res.y;}}}}return vec3(sqrt(res),abs(id));}
vec4 hash(float p){vec4 p4=fract(vec4(p)*vec4(.1031,.1030,.0973,.1099));p4+=dot(p4,p4.wzxy+33.33);return fract((p4.xxyz+p4.yzzw)*p4.zywx);}
void main(){vec4 sph=vec4(u_origin+vec3(u_fbm.x*2.,u_fbm.y*2.+1.,0.),2.5);vec3 worldNormal=normalize(v_worldNormal);float ao=1.-sphOcclusion(v_worldPosition,worldNormal,sph)*2.*smoothstep(0.8,0.5,u_ratioInverse);float shade=texture2D(u_texture,v_uv).r;float brightness=pow(v_lengthRatio,5.);float t=u_ratioInverse*-2.+u_time*0.2;vec3 vn=voronoi(vec4(v_localPosition*2.+vec3(0.,0.,-t*0.5),t*0.25));vec4 rnd=hash(vn.z);float threshold=0.05+rnd.x*0.1;float r=abs(vn.x-.5)*(1.75+rnd.y*0.5);float pattern=max(0.,1.-smoothstep(threshold-fwidth(r),threshold,r));vec3 color=mix(vec3(0.102,0.184,0.984),vec3(1.),pattern);color*=(.35+shade)*ao;color+=brightness;gl_FragColor=vec4(color,1.);gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(1.0),smoothstep(0.8,1.0,u_ratioInverse)*0.5);gl_FragColor.rgb+=linearStep(-10.,-11.,v_localPosition.z);}`;

// Connect runs their white-tunnel ratio 0 -> 1 (from the white flash, through the winding room, to it straightening out)
export const roomRatioAt = (zc) => seg(zc, ROOM_END, CONNECT_END + 4);

export default function WhiteRoom() {
  const group = useRef();
  const [geoms, setGeoms] = useState(null);
  const uniforms = useMemo(() => ({ u_time: { value: 0 }, u_ratio: { value: 0 }, u_ratioInverse: { value: 1 }, u_texture: { value: null }, u_fbm: { value: new THREE.Vector3() }, u_origin: { value: new THREE.Vector3() } }), []);
  useEffect(() => {
    let alive = true;
    const tex = new THREE.TextureLoader().load(asset('/lusion_assets/white_block.webp'));
    uniforms.u_texture.value = tex;
    Promise.all([loadLusionBuf(asset('/lusion_assets/tunnel_block_base.buf')), loadLusionBuf(asset('/lusion_assets/tunnel_block_wall.buf'))])
      .then((list) => {
        if (!alive) return;
        // each block is instanced sixteen times along the tube
        setGeoms(
          list.map((g) => {
            const ig = new THREE.InstancedBufferGeometry();
            for (const k in g.attributes) ig.setAttribute(k, g.attributes[k]);
            ig.setIndex(g.index);
            ig.setAttribute('a_instanceId', new THREE.InstancedBufferAttribute(Float32Array.from({ length: BLOCK_COUNT }, (_, i) => i), 1));
            ig.instanceCount = BLOCK_COUNT;
            return ig;
          })
        );
        labState.room = true;
      })
      .catch(() => (labState.room = true));
    return () => {
      alive = false;
      tex.dispose();
    };
  }, [uniforms]);
  const mat = useMemo(() => new THREE.ShaderMaterial({ uniforms, vertexShader: BLOCK_VERT, fragmentShader: BLOCK_FRAG, defines: { BLOCK_COUNT }, side: THREE.DoubleSide, toneMapped: false }), [uniforms]);

  useFrame((s) => {
    const g = group.current;
    if (!g) return;
    const cam = s.camera;
    const zc = cam.position.z;
    const r = roomRatioAt(zc);
    const live = zc <= ROOM_END + 1 && zc > CONNECT_END - 2;
    g.visible = labState.warm || live;
    labState.roomK = live ? 1 : 0;
    if (!g.visible) return;
    // the room travels with the camera (their camera stays put and the room changes shape around it)
    g.position.set(cam.position.x * 0.6, cam.position.y * 0.6, zc);
    const t = s.clock.elapsedTime;
    uniforms.u_time.value = t;
    uniforms.u_ratio.value = r;
    uniforms.u_ratioInverse.value = 1 - r;
    uniforms.u_fbm.value.set(Math.sin(t * 0.9) * 0.8, Math.sin(t * 0.7 + 1.3) * 0.8, 0);
    uniforms.u_origin.value.copy(g.position);
    // their lens: very wide as the room opens, settling to normal
    labState.fovOffset = 60 * (1 - r);
  });

  return (
    <group ref={group} visible={false}>
      {geoms && geoms.map((g, i) => <mesh key={i} geometry={g} material={mat} frustumCulled={false} />)}
    </group>
  );
}
