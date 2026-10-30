/**
 * Shader Research & Development Utility: Half-Lambert Specular Chamfer Model
 * Computes diffuse Half-Lambert illumination and Blinn-Phong chamfer specular highlights
 * for slate-titanium structural lattice rails.
 */

export function halfLambertDiffuse(normal, lightDir) {
  const dot = normal[0] * lightDir[0] + normal[1] * lightDir[1] + normal[2] * lightDir[2];
  return dot * 0.5 + 0.5;
}

export function chamferSpecular(normal, lightDir, viewDir, shininess = 32.0) {
  const hx = lightDir[0] + viewDir[0];
  const hy = lightDir[1] + viewDir[1];
  const hz = lightDir[2] + viewDir[2];
  const len = Math.hypot(hx, hy, hz) || 1.0;
  const h = [hx / len, hy / len, hz / len];

  const nDotH = Math.max(0.0, normal[0] * h[0] + normal[1] * h[1] + normal[2] * h[2]);
  return Math.pow(nDotH, shininess);
}

export function evaluateTitaniumLatticeShading(albedo, ao, normal, lightDir, viewDir) {
  const diff = halfLambertDiffuse(normal, lightDir);
  const spec = chamferSpecular(normal, lightDir, viewDir, 32.0);

  const baseTitanium = [
    0.009 + 0.012 * albedo,
    0.011 + 0.015 * albedo,
    0.014 + 0.019 * albedo
  ];

  const diffuseOut = [
    baseTitanium[0] * ao * 0.65 * diff,
    baseTitanium[1] * ao * 0.65 * diff,
    baseTitanium[2] * ao * 0.65 * diff
  ];

  const glintOut = [
    0.5 * spec * 0.75,
    0.6 * spec * 0.75,
    0.7 * spec * 0.75
  ];

  return [
    diffuseOut[0] + glintOut[0],
    diffuseOut[1] + glintOut[1],
    diffuseOut[2] + glintOut[2]
  ];
}
