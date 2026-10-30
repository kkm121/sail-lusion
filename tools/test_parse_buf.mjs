import fs from 'fs';

function parseBuf(buffer) {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const jsonLen = new Uint32Array(arrayBuffer, 0, 1)[0];
  const jsonStr = new TextDecoder().decode(new Uint8Array(arrayBuffer, 4, jsonLen));
  const header = JSON.parse(jsonStr);
  return header;
}

try {
  const astro = parseBuf(fs.readFileSync('sail-lusion/v4/public/lusion_assets/astronaut_animations.buf'));
  console.log('Astronaut Animations Header:', astro);
} catch (e) {
  console.error('Error parsing astronaut_animations.buf:', e);
}
