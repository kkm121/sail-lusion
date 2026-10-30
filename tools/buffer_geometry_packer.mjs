/**
 * In-House Geometry Research Utility: Packed Buffer Attribute Encoder
 * Encodes floating point arrays into normalized quantized integers and packed headers
 * for high-density instanced rendering in WebGL.
 */

export function packAttributes(floatArray, componentSize, storageType = 'Int16Array') {
  const count = floatArray.length / componentSize;
  let minVal = Infinity;
  let maxVal = -Infinity;

  for (let i = 0; i < floatArray.length; i++) {
    if (floatArray[i] < minVal) minVal = floatArray[i];
    if (floatArray[i] > maxVal) maxVal = floatArray[i];
  }

  const delta = (maxVal - minVal) || 1.0;
  const isInt = storageType.startsWith('Int');
  const bits = storageType.includes('8') ? 8 : storageType.includes('16') ? 16 : 32;
  const D = Math.pow(2, bits);
  const ne = isInt ? D * 0.5 : 0;
  const re = 1.0 / D;

  const TypedArray = storageType === 'Int16Array' ? Int16Array : Float32Array;
  const encoded = new TypedArray(floatArray.length);

  for (let i = 0; i < floatArray.length; i++) {
    const norm = (floatArray[i] - minVal) / delta;
    encoded[i] = Math.round(norm * D - ne);
  }

  return {
    encoded,
    count,
    componentSize,
    meta: {
      from: minVal,
      delta,
      storageType,
      needsPack: true
    }
  };
}
