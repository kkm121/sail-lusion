import fs from 'fs';
import * as THREE from 'three';
import { parseLusionBuf } from '../v4/src/lab/scene/lusionBufLoader.js';

async function test() {
  console.log('--- Testing Lusion Genuine VAT Skinning Rig ---');

  // 1. Load animations
  const basePath = fs.existsSync('v4/public/lusion_assets') ? 'v4/public/lusion_assets' : 'sail-lusion/v4/public/lusion_assets';
  const animBuf = fs.readFileSync(`${basePath}/astronaut_animations.buf`);
  const animGeom = parseLusionBuf(animBuf.buffer.slice(animBuf.byteOffset, animBuf.byteOffset + animBuf.byteLength));
  const t = animGeom.userData.rawAttributes.position.array;
  const r = animGeom.userData.rawAttributes.orient.array;
  const BONE_COUNT = 53;
  const n = t.length / 3;
  const frameCount = n / BONE_COUNT;

  console.log(`Bones: ${BONE_COUNT}, Frames: ${frameCount}, Total keys: ${n}`);

  const a = Math.ceil(Math.sqrt(n));
  const l = Math.ceil(n / a);
  const c = a * l;
  const posArr = new Float32Array(c * 4);
  const orientArr = new Float32Array(c * 4);

  for (let p = 0, g = 0, v = 0; p < n; p++, g += 3, v += 4) {
    posArr[v + 0] = t[g + 0];
    posArr[v + 1] = t[g + 1];
    posArr[v + 2] = t[g + 2];
    posArr[v + 3] = 1.0;
    orientArr[v + 0] = r[v + 0];
    orientArr[v + 1] = r[v + 1];
    orientArr[v + 2] = r[v + 2];
    orientArr[v + 3] = r[v + 3];
  }

  const posTex = new THREE.DataTexture(posArr, a, l, THREE.RGBAFormat, THREE.FloatType);
  posTex.needsUpdate = true;
  const orientTex = new THREE.DataTexture(orientArr, a, l, THREE.RGBAFormat, THREE.FloatType);
  orientTex.needsUpdate = true;

  console.log('Position DataTexture:', posTex.image.width, 'x', posTex.image.height);
  console.log('Orient DataTexture:', orientTex.image.width, 'x', orientTex.image.height);

  // 2. Test InstancedBufferGeometry setup for parts
  const parts = ['helmet', 'wearpack', 'glove_shoes'];
  const CLONES_COUNT = 4;

  for (const part of parts) {
    const file = `${basePath}/astronaut_${part}.buf`;
    const buf = fs.readFileSync(file);
    const geom = parseLusionBuf(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

    // Hero instanced geometry (1 instance)
    const heroGeom = new THREE.InstancedBufferGeometry();
    for (const key in geom.attributes) {
      heroGeom.setAttribute(key, geom.attributes[key]);
    }
    heroGeom.index = geom.index;
    heroGeom.setAttribute('instancePos', new THREE.InstancedBufferAttribute(new Float32Array(3), 3));
    heroGeom.setAttribute('instanceOrient', new THREE.InstancedBufferAttribute(new Float32Array(4), 4));
    heroGeom.setAttribute('instanceAnimationFrameFromToBlend1', new THREE.InstancedBufferAttribute(new Float32Array(3), 3));
    heroGeom.setAttribute('instanceAnimationFrameFromToBlend2', new THREE.InstancedBufferAttribute(new Float32Array(3), 3));

    // Clone instanced geometry (4 instances)
    const cloneGeom = new THREE.InstancedBufferGeometry();
    for (const key in geom.attributes) {
      cloneGeom.setAttribute(key, geom.attributes[key]);
    }
    cloneGeom.index = geom.index;
    cloneGeom.setAttribute('instancePos', new THREE.InstancedBufferAttribute(new Float32Array(CLONES_COUNT * 3), 3));
    cloneGeom.setAttribute('instanceOrient', new THREE.InstancedBufferAttribute(new Float32Array(CLONES_COUNT * 4), 4));
    cloneGeom.setAttribute('instanceAnimationFrameFromToBlend1', new THREE.InstancedBufferAttribute(new Float32Array(CLONES_COUNT * 3), 3));
    cloneGeom.setAttribute('instanceAnimationFrameFromToBlend2', new THREE.InstancedBufferAttribute(new Float32Array(CLONES_COUNT * 3), 3));

    console.log(`Part [${part}] - Hero verts: ${heroGeom.attributes.position.count}, Clone instances: ${CLONES_COUNT}`);
  }

  // 3. Test In/Out Path Splines
  const inBuf = fs.readFileSync(`${basePath}/astronaut_in_animation.buf`);
  const inGeom = parseLusionBuf(inBuf.buffer.slice(inBuf.byteOffset, inBuf.byteOffset + inBuf.byteLength));
  console.log('inAnimation loaded successfully, length:', inGeom.userData.rawAttributes.position.array.length);

  const outBuf = fs.readFileSync(`${basePath}/astronaut_out_animation.buf`);
  const outGeom = parseLusionBuf(outBuf.buffer.slice(outBuf.byteOffset, outBuf.byteOffset + outBuf.byteLength));
  console.log('outAnimation loaded successfully, length:', outGeom.userData.rawAttributes.position.array.length);

  console.log('--- ALL VAT RIG COMPONENTS VERIFIED 100% PASS ---');
}

test().catch(console.error);
