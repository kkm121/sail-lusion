import { useEffect } from 'react';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';

const STOPS = [
  [0, [246, 234, 216]],
  [0.07, [245, 215, 184]],
  [0.3, [241, 201, 188]],
  [0.52, [228, 199, 207]],
  [1, [228, 199, 207]],
];

function sample(p) {
  for (let i = 1; i < STOPS.length; i++) {
    const [b, cb] = STOPS[i];
    const [a, ca] = STOPS[i - 1];
    if (p <= b) {
      const t = (p - a) / Math.max(b - a, 1e-6);
      return ca.map((v, k) => Math.round(v + (cb[k] - v) * t));
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export default function PageTint() {
  useEffect(() => {
    const root = document.querySelector('.sail');
    if (!root) return undefined;
    let last = '';
    return onTick(() => {
      const css = `rgb(${sample(scrollState.progress).join(',')})`;
      if (css !== last) {
        last = css;
        root.style.setProperty('--bg', css);
      }
    }, 6);
  }, []);
  return null;
}
