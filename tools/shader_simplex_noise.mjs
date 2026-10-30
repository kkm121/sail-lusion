/**
 * Shader Noise Math Utility: Analytical Simplex & FBM Generators
 * Used for precomputing volumetric turbulence and micro-pad twinkle maps.
 */

function fract(x) {
  return x - Math.floor(x);
}

function hash22(p) {
  const p3x = fract(p[0] * 0.1031);
  const p3y = fract(p[1] * 0.1030);
  const p3z = fract(p[0] * 0.0973);
  const d = p3x * (p3y + 33.33) + p3y * (p3z + 33.33) + p3z * (p3x + 33.33);
  return [
    fract((p3x + p3y) * d),
    fract((p3x + p3z) * d)
  ];
}

export function valueNoise2D(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);

  const a = hash22([ix, iy])[0];
  const b = hash22([ix + 1, iy])[0];
  const c = hash22([ix, iy + 1])[0];
  const d = hash22([ix + 1, iy + 1])[0];

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

export function fbm2D(x, y, octaves = 4) {
  let v = 0.0;
  let a = 0.5;
  let px = x, py = y;
  for (let i = 0; i < octaves; i++) {
    v += a * valueNoise2D(px, py);
    px = px * 2.0 + 100.0;
    py = py * 2.0 + 100.0;
    a *= 0.5;
  }
  return v;
}
