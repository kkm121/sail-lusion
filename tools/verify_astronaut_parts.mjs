import fs from 'fs';
import * as THREE from 'three';
import { parseLusionBuf } from '../v4/src/lab/scene/lusionBufLoader.js';

const parts = ['helmet', 'helmet_glass', 'wearpack', 'glove_shoes'];
for (const p of parts) {
  const bufData = fs.readFileSync(`sail-lusion/v4/public/lusion_assets/astronaut_${p}.buf`);
  const ab = bufData.buffer.slice(bufData.byteOffset, bufData.byteOffset + bufData.byteLength);
  const geom = parseLusionBuf(ab);
  console.log(`Astronaut Part [${p}]:`);
  console.log('  Indices:', geom.index ? geom.index.count : 0);
  console.log('  Vertices:', geom.attributes.position ? geom.attributes.position.count : 0);
  console.log('  Attributes:', Object.keys(geom.attributes));
}
