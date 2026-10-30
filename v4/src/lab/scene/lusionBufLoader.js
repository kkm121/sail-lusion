import * as THREE from 'three';

/**
 * High-performance binary geometry buffer parser.
 * Unpacks quantized integer vertex attributes, packed tangents, and instanced layouts.
 */
export function parseLusionBuf(arrayBuffer) {
  const jsonLen = new Uint32Array(arrayBuffer, 0, 1)[0];
  const jsonStr = new TextDecoder().decode(new Uint8Array(arrayBuffer, 4, jsonLen));
  const header = JSON.parse(jsonStr);
  const vertexCount = header.vertexCount;
  const indexCount = header.indexCount;
  let offset = 4 + jsonLen;
  const attributes = header.attributes;
  const geometry = new THREE.BufferGeometry();
  const rawAttributes = {};

  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    const id = attr.id;
    const count = id === 'indices' ? indexCount : vertexCount;
    const componentSize = attr.componentSize;
    const TypedArray = globalThis[attr.storageType] || Float32Array;
    const rawArray = new TypedArray(arrayBuffer, offset, count * componentSize);
    const bytesPerEl = TypedArray.BYTES_PER_ELEMENT;
    let finalArray;

    if (attr.needsPack) {
      const packed = attr.packedComponents;
      const k = packed.length;
      const isInt = attr.storageType.indexOf('Int') === 0;
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

    rawAttributes[id] = { array: finalArray, componentSize };

    if (id === 'indices') {
      geometry.setIndex(new THREE.BufferAttribute(finalArray, 1));
    } else {
      geometry.setAttribute(id, new THREE.BufferAttribute(finalArray, componentSize));
    }

    offset += count * componentSize * bytesPerEl;
  }

  geometry.userData.header = header;
  geometry.userData.rawAttributes = rawAttributes;
  return geometry;
}

export async function loadLusionBuf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.statusText}`);
  const ab = await res.arrayBuffer();
  return parseLusionBuf(ab);
}
