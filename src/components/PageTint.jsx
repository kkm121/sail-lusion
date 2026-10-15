import { useEffect } from 'react';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';

const STOPS = [
  [0, [253, 243, 214]],
  [0.07, [232, 248, 241]],
  [0.3, [228, 240, 252]],
  [0.52, [238, 232, 252]],
  [1, [238, 232, 252]],
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
