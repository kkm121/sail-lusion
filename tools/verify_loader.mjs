import fs from 'fs';
import * as THREE from 'three';
import { parseLusionBuf } from '../v4/src/lab/scene/lusionBufLoader.js';

const bufData = fs.readFileSync('sail-lusion/v4/public/lusion_assets/grid_base_hd.buf');
const ab = bufData.buffer.slice(bufData.byteOffset, bufData.byteOffset + bufData.byteLength);
const geom = parseLusionBuf(ab);

console.log('Parsed geometry successfully!');
console.log('Index count:', geom.index ? geom.index.count : 0);
console.log('Attributes:', Object.keys(geom.attributes));
