import fs from 'fs';
import * as THREE from 'three';
import { parseLusionBuf } from '../v4/src/lab/scene/lusionBufLoader.js';

const parts = ['helmet', 'helmet_glass', 'wearpack', 'glove_shoes'];
const bbox = new THREE.Box3();
for (const p of parts) {
  const bufData = fs.readFileSync(`sail-lusion/v4/public/lusion_assets/astronaut_${p}.buf`);
  const ab = bufData.buffer.slice(bufData.byteOffset, bufData.byteOffset + bufData.byteLength);
  const geom = parseLusionBuf(ab);
  geom.computeBoundingBox();
  console.log(`Part [${p}] box:`, geom.boundingBox.min, 'to', geom.boundingBox.max);
  bbox.union(geom.boundingBox);
}
console.log('Total astronaut box:', bbox.min, 'to', bbox.max);
