import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';
import { loadLusionBuf } from './lusionBufLoader';
import { CONNECT_END } from '../journey';
import { asset } from '../media';
import { labState, seg } from './shared';

// Chapter V opens with Lusion's glass shatter (used with permission): the screen is a pane of 946 glass pieces two units
// in front of the camera; a recorded animation (15 frames, positions and orientations per piece) breaks it apart, and
// each piece refracts the scene behind it with a rainbow edge. Their shaders, unchanged.
const PIECES = 946;
const DEPTH = 2;

const GLASS_VERT = `
attribute float piece;uniform sampler2D u_positionTexture;uniform sampler2D u_orientTexture;uniform vec2 u_textureSize;uniform float u_frameFrom;uniform float u_frameTo;uniform float u_frameRatio;uniform float u_fragmentScale;varying vec3 v_viewPosition;varying vec3 v_localDir;
vec3 qrotate(vec4 q,vec3 v){return v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
void main(){vec4 animationUvs=(vec4(piece,u_frameFrom,piece,u_frameTo)+.5)/u_textureSize.xyxy;vec3 piecePosFrom=texture2D(u_positionTexture,animationUvs.xy).xyz;vec4 pieceOrientFrom=texture2D(u_orientTexture,animationUvs.xy);vec3 piecePosTo=texture2D(u_positionTexture,animationUvs.zw).xyz;vec4 pieceOrientTo=texture2D(u_orientTexture,animationUvs.zw);float radius=length(position)*u_fragmentScale;vec3 dir=position/radius;vec3 posFrom=qrotate(pieceOrientFrom,dir);vec3 posTo=qrotate(pieceOrientTo,dir);v_localDir=normalize(mix(posFrom,posTo,u_frameRatio));vec3 pos=v_localDir*radius+mix(piecePosFrom,piecePosTo,u_frameRatio);vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);v_viewPosition=mvPosition.xyz;gl_Position=projectionMatrix*mvPosition;}`;

const GLASS_FRAG = `
uniform sampler2D u_backgroundTexture;uniform vec2 u_resolution;varying vec3 v_viewPosition;varying vec3 v_localDir;
void main(){vec3 fdx=dFdx(v_viewPosition);vec3 fdy=dFdy(v_viewPosition);vec3 viewNormal=normalize(cross(fdx,fdy));float alpha=abs(1.-viewNormal.z);vec2 uv=gl_FragCoord.xy/u_resolution.xy;vec3 bgColor=texture2D(u_backgroundTexture,uv).rgb;vec2 refl=reflect(normalize(v_viewPosition),viewNormal).xy;vec2 uvOffset=refl.xy*0.2*vec2(u_resolution.x/u_resolution.y,1.);vec3 color=texture2D(u_backgroundTexture,uv+uvOffset).rgb;color+=clamp(abs(mod((alpha)*8.+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0)*(1.-alpha)*(1.-bgColor);gl_FragColor=vec4(color,alpha);}`;

// the shatter plays over the first stretch of Record
export const glassAt = (zc) => seg(zc, CONNECT_END, CONNECT_END - 11);

function dataTexture(data, w, h) {
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

export default function Glass() {
  const mesh = useRef();
  const { gl, scene } = useThree();
  const fbo = useFBO({ samples: 0 });
  const [geom, setGeom] = useState(null);
  const frames = useRef(1);
  const uniforms = useMemo(
    () => ({
      u_backgroundTexture: { value: null },
      u_resolution: { value: new THREE.Vector2() },
      u_positionTexture: { value: null },
      u_orientTexture: { value: null },
      u_textureSize: { value: new THREE.Vector2(PIECES, 1) },
      u_frameFrom: { value: 0 },
      u_frameTo: { value: 0 },
      u_frameRatio: { value: 0 },
      u_fragmentScale: { value: 1 },
    }),
    []
  );
  useEffect(() => {
    let alive = true;
    Promise.all([loadLusionBuf(asset('/lusion_assets/broken_glass.buf')), loadLusionBuf(asset('/lusion_assets/broken_glass_animation.buf'))])
      .then(([g, anim]) => {
        if (!alive) return;
        const p = anim.attributes.position.array;
        const n = (frames.current = p.length / (PIECES * 3));
        const pos4 = new Float32Array((p.length / 3) * 4);
        for (let a = 0, b = 0; a < p.length; a += 3, b += 4) pos4.set([p[a], p[a + 1], p[a + 2], 0], b);
        uniforms.u_textureSize.value.set(PIECES, n);
        uniforms.u_positionTexture.value = dataTexture(pos4, PIECES, n);
        uniforms.u_orientTexture.value = dataTexture(new Float32Array(anim.attributes.orient.array), PIECES, n);
        setGeom(g);
        labState.glass = true;
      })
      .catch(() => (labState.glass = true));
    return () => {
      alive = false;
    };
  }, [uniforms]);
  const mat = useMemo(() => new THREE.ShaderMaterial({ uniforms, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }), [uniforms]);

  useFrame((s) => {
    const m = mesh.current;
    if (!m) return;
    const cam = s.camera;
    const r = labState.warm ? 0.5 : glassAt(cam.position.z);
    const on = labState.warm || (r > 0 && r < 1);
    m.visible = false;
    if (!on) return;
    // what is behind the glass: the scene drawn once more, without it, into a texture the pieces refract
    gl.setRenderTarget(fbo);
    gl.render(scene, cam);
    gl.setRenderTarget(null);
    uniforms.u_backgroundTexture.value = fbo.texture;
    gl.getDrawingBufferSize(uniforms.u_resolution.value);
    // the pane fills the screen, two units in front of the camera
    m.position.copy(cam.position);
    m.quaternion.copy(cam.quaternion);
    m.translateZ(-DEPTH);
    m.scale.setScalar(Math.tan((cam.fov * Math.PI) / 360) * DEPTH * 2);
    const a = r * (frames.current - 1);
    const f0 = Math.floor(a);
    uniforms.u_frameFrom.value = f0;
    uniforms.u_frameTo.value = Math.min(f0 + 1, frames.current - 1);
    uniforms.u_frameRatio.value = a - f0;
    m.visible = true;
  }, -0.5);

  if (!geom) return null;
  return <mesh ref={mesh} geometry={geom} material={mat} frustumCulled={false} renderOrder={1000} visible={false} />;
}
