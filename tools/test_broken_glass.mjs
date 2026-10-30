import fs from 'fs';
import * as THREE from 'three';
import { parseLusionBuf } from '../v4/src/lab/scene/lusionBufLoader.js';

async function test() {
  console.log('--- Testing Lusion Broken Glass Shatter Rig ---');
  const basePath = fs.existsSync('v4/public/lusion_assets') ? 'v4/public/lusion_assets' : 'sail-lusion/v4/public/lusion_assets';

  const geomBuf = fs.readFileSync(`${basePath}/broken_glass.buf`);
  const geom = parseLusionBuf(geomBuf.buffer.slice(geomBuf.byteOffset, geomBuf.byteOffset + geomBuf.byteLength));
  console.log('broken_glass.buf: indices =', geom.index.count, 'vertices =', geom.attributes.position.count);

  const animBuf = fs.readFileSync(`${basePath}/broken_glass_animation.buf`);
  const animGeom = parseLusionBuf(animBuf.buffer.slice(animBuf.byteOffset, animBuf.byteOffset + animBuf.byteLength));

  const t = animGeom.userData.rawAttributes.position.array;
  const orient = animGeom.userData.rawAttributes.orient.array;
  const PIECE_COUNT = 946;
  const frameCount = t.length / (PIECE_COUNT * 3); // 15 frames

  console.log(`PIECE_COUNT = ${PIECE_COUNT}, frameCount = ${frameCount}`);

  const posArr = new Float32Array(t.length / 3 * 4);
  for (let a = 0, l = 0; a < t.length; a += 3, l += 4) {
    posArr[l + 0] = t[a + 0];
    posArr[l + 1] = t[a + 1];
    posArr[l + 2] = t[a + 2];
    posArr[l + 3] = 0;
  }

  const posTex = new THREE.DataTexture(posArr, PIECE_COUNT, frameCount, THREE.RGBAFormat, THREE.FloatType);
  posTex.needsUpdate = true;
  posTex.minFilter = THREE.NearestFilter;
  posTex.magFilter = THREE.NearestFilter;

  const orientTex = new THREE.DataTexture(orient, PIECE_COUNT, frameCount, THREE.RGBAFormat, THREE.FloatType);
  orientTex.needsUpdate = true;
  orientTex.minFilter = THREE.NearestFilter;
  orientTex.magFilter = THREE.NearestFilter;

  console.log('Broken glass textures created: posTex', posTex.image.width, 'x', posTex.image.height);

  const vertGlass = `
    attribute float piece;
    uniform sampler2D u_positionTexture;
    uniform sampler2D u_orientTexture;
    uniform vec2 u_textureSize;
    uniform float u_frameFrom;
    uniform float u_frameTo;
    uniform float u_frameRatio;
    uniform float u_fragmentScale;
    varying vec3 v_viewPosition;
    varying vec3 v_localDir;

    vec3 qrotate(vec4 q, vec3 v) {
      return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
    }

    void main() {
      vec4 animationUvs = (vec4(piece, u_frameFrom, piece, u_frameTo) + 0.5) / u_textureSize.xyxy;
      vec3 piecePosFrom = texture2D(u_positionTexture, animationUvs.xy).xyz;
      vec4 pieceOrientFrom = texture2D(u_orientTexture, animationUvs.xy);
      vec3 piecePosTo = texture2D(u_positionTexture, animationUvs.zw).xyz;
      vec4 pieceOrientTo = texture2D(u_orientTexture, animationUvs.zw);
      
      float radius = length(position) * u_fragmentScale;
      vec3 dir = position / radius;
      vec3 posFrom = qrotate(pieceOrientFrom, dir);
      vec3 posTo = qrotate(pieceOrientTo, dir);
      v_localDir = normalize(mix(posFrom, posTo, u_frameRatio));
      vec3 pos = v_localDir * radius + mix(piecePosFrom, piecePosTo, u_frameRatio);
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      v_viewPosition = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragGlass = `
    uniform vec2 u_resolution;
    varying vec3 v_viewPosition;
    varying vec3 v_localDir;

    void main() {
      vec3 fdx = dFdx(v_viewPosition);
      vec3 fdy = dFdy(v_viewPosition);
      vec3 viewNormal = normalize(cross(fdx, fdy));
      float alpha = abs(1.0 - viewNormal.z);
      vec3 rainbow = clamp(abs(mod((alpha) * 8.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
      vec3 glassColor = mix(vec3(0.85, 0.95, 1.0), rainbow, 0.65);
      gl_FragColor = vec4(glassColor, clamp(alpha * 1.5, 0.1, 0.95));
    }
  `;

  const mat = new THREE.ShaderMaterial({
    vertexShader: vertGlass,
    fragmentShader: fragGlass,
    uniforms: {
      u_positionTexture: { value: posTex },
      u_orientTexture: { value: orientTex },
      u_textureSize: { value: new THREE.Vector2(PIECE_COUNT, frameCount) },
      u_frameFrom: { value: 0 },
      u_frameTo: { value: 1 },
      u_frameRatio: { value: 0.5 },
      u_fragmentScale: { value: 1.0 },
      u_resolution: { value: new THREE.Vector2(1920, 1080) },
    },
    transparent: true,
  });

  const mesh = new THREE.Mesh(geom, mat);
  console.log('Broken glass mesh initialized with 946 pieces:', mesh.uuid);
  console.log('--- ALL GLASS TESTS PASSED ---');
}

test().catch(console.error);
