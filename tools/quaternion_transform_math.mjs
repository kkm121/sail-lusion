/**
 * Math Research Utility: 4D Hopf Fibration & Stereographic Matrix Transform
 * Analytical implementation of stereographic conformal mapping and quaternion rotation.
 */

export function qRotate(q, v) {
  const qx = q[0], qy = q[1], qz = q[2], qw = q[3];
  const vx = v[0], vy = v[1], vz = v[2];

  const ix = qw * vx + qy * vz - qz * vy;
  const iy = qw * vy + qz * vx - qx * vz;
  const iz = qw * vz + qx * vy - qy * vx;
  const iw = -qx * vx - qy * vy - qz * vz;

  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx
  ];
}

export function fromAxisAngle(axis, angle) {
  const half = angle * 0.5;
  const s = Math.sin(half);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(half)];
}

export function hopfStereographicTwist(pos, twistRatio, rad = 20.0) {
  const t = twistRatio * 2.0 * Math.PI;
  if (Math.abs(t) < 0.0001) return [...pos];

  let x = pos[0], y = pos[1], z = pos[2];
  const zWeight = z * 0.025;
  const angle = t * zWeight * zWeight * Math.sign(zWeight);
  const sa = Math.sin(angle);
  const ca = Math.cos(angle);

  const nx = ca * x - sa * y;
  const ny = sa * x + ca * y;
  x = nx;
  y = ny;
  z += t * 1.0;

  // Stereographic 4-sphere projection
  let p = [x / rad, z / rad, y / rad];
  const ada = p[0] * p[0] + p[1] * p[1] + p[2] * p[2];
  const denom = 1.0 + ada;
  const b = [2.0 * p[0] / denom, 2.0 * p[1] / denom, 2.0 * p[2] / denom, (ada - 1.0) / denom];

  const pq = [-t, 0.5 * t];
  const cosP = Math.cos(pq[0]), sinP = Math.sin(pq[0]);
  const cosQ = Math.cos(pq[1]), sinQ = Math.sin(pq[1]);

  const c0 = -b[0] * cosP + b[2] * sinP;
  const c1 = b[0] * sinP + b[2] * cosP;
  const c2 = b[1] * cosQ - b[3] * sinQ;
  const c3 = b[1] * sinQ + b[3] * cosQ;

  const wFactor = 1.0 - c3;
  return [
    (c0 / wFactor) * rad,
    (c2 / wFactor) * rad,
    (c1 / wFactor) * rad
  ];
}
