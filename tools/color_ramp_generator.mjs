/**
 * Shader Research & Development Utility: Multi-Hue Palette & Wave Pulse Modulator
 * Computes the spectral color ramps and data wave pulse emission factors for cyber matrix voxels.
 */

export const CYBER_PALETTES = {
  build: [
    [0.05, 1.80, 2.60], // Electric Cyan
    [0.05, 2.40, 1.40], // Mint Phosphor
    [0.12, 2.40, 0.45], // Matrix Emerald
    [2.60, 1.60, 0.18], // Amber Filament
    [2.50, 0.30, 0.18]  // Ruby Pulse
  ],
  discover: [
    [0.00, 0.90, 1.00], // Hyperspace Cyan
    [0.00, 1.00, 0.53], // Neon Emerald
    [1.00, 0.00, 0.67], // Vivid Magenta
    [1.00, 0.84, 0.00]  // Solar Gold
  ]
};

export function lerpColor(c1, c2, t) {
  const clampT = Math.max(0, Math.min(1, t));
  return [
    c1[0] + (c2[0] - c1[0]) * clampT,
    c1[1] + (c2[1] - c1[1]) * clampT,
    c1[2] + (c2[2] - c1[2]) * clampT
  ];
}

export function samplePalette(palette, u) {
  const normU = Math.max(0, Math.min(1, u));
  const count = palette.length - 1;
  const idx = normU * count;
  const i0 = Math.floor(idx);
  const i1 = Math.min(i0 + 1, count);
  const frac = idx - i0;
  return lerpColor(palette[i0], palette[i1], frac);
}

export function computeTravelingPulse(posZ, time, freq = 0.25, speed = 2.5) {
  const wave = Math.sin(posZ * freq - time * speed) * 0.5 + 0.5;
  const pulse = Math.pow(Math.max(0.0, Math.sin(posZ * (freq * 1.25) - time * (speed * 1.28))), 4.0);
  return 0.42 + 0.58 * wave + 1.20 * pulse;
}
