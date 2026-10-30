import fs from 'fs';

function parseBuf(buffer) {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const jsonLen = new Uint32Array(arrayBuffer, 0, 1)[0];
  const jsonStr = new TextDecoder().decode(new Uint8Array(arrayBuffer, 4, jsonLen));
  const header = JSON.parse(jsonStr);
  const vertexCount = header.vertexCount;
  const indexCount = header.indexCount;
  let offset = 4 + jsonLen;
  const attributes = header.attributes;
  const attrMap = {};

  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    const id = attr.id;
    const count = (id === "indices") ? indexCount : vertexCount;
    const componentSize = attr.componentSize;
    const TypedArray = globalThis[attr.storageType];
    const rawArray = new TypedArray(arrayBuffer, offset, count * componentSize);
    const bytesPerEl = TypedArray.BYTES_PER_ELEMENT;
    let finalArray;

    if (attr.needsPack) {
      const packed = attr.packedComponents;
      const k = packed.length;
      const isInt = attr.storageType.indexOf("Int") === 0;
      const D = 1 << (bytesPerEl * 8);
      const ne = isInt ? D * 0.5 : 0;
      const re = 1 / D;
      finalArray = new Float32Array(count * componentSize);
      for (let ce = 0, z = 0; ce < count; ce++) {
        for (let j = 0; j < k; j++) {
          const X = packed[j];
          finalArray[z] = (rawArray[z] + ne) * re * X.delta + X.from;
          z++;
        }
      }
    } else {
      finalArray = rawArray;
    }
    attrMap[id] = { array: finalArray, itemSize: componentSize };
    offset += count * componentSize * bytesPerEl;
  }
  return { header, attrMap };
}

const structure = parseBuf(fs.readFileSync('sail-lusion/v4/public/lusion_assets/grid_structure_hd.buf'));
const pos = structure.attrMap.position.array;
let minZ = Infinity, maxZ = -Infinity;
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
for (let i = 0; i < pos.length; i += 3) {
  minX = Math.min(minX, pos[i]); maxX = Math.max(maxX, pos[i]);
  minY = Math.min(minY, pos[i+1]); maxY = Math.max(maxY, pos[i+1]);
  minZ = Math.min(minZ, pos[i+2]); maxZ = Math.max(maxZ, pos[i+2]);
}
console.log('Instance Pos X:', minX, 'to', maxX);
console.log('Instance Pos Y:', minY, 'to', maxY);
console.log('Instance Pos Z:', minZ, 'to', maxZ);

const base = parseBuf(fs.readFileSync('sail-lusion/v4/public/lusion_assets/grid_base_hd.buf'));
const bpos = base.attrMap.position.array;
minZ = Infinity; maxZ = -Infinity;
minX = Infinity; maxX = -Infinity;
minY = Infinity; maxY = -Infinity;
for (let i = 0; i < bpos.length; i += 3) {
  minX = Math.min(minX, bpos[i]); maxX = Math.max(maxX, bpos[i]);
  minY = Math.min(minY, bpos[i+1]); maxY = Math.max(maxY, bpos[i+1]);
  minZ = Math.min(minZ, bpos[i+2]); maxZ = Math.max(maxZ, bpos[i+2]);
}
console.log('Base Mesh X:', minX, 'to', maxX);
console.log('Base Mesh Y:', minY, 'to', maxY);
console.log('Base Mesh Z:', minZ, 'to', maxZ);
