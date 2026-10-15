import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoaderScreen from './LoaderScreen';
import { assetProgress, assetsDone, expectRoute, pendingAssets, subscribeAssets } from '../lib/assets';
import { setReady } from '../lib/ready';
import '../styles/loader.css';

let seen = false;

// The first load: the loader stays up until the fonts, images, reel video, hero scene and the whole voyage scene
// (models, shaders, textures) are ready, so nothing compiles or decodes while the visitor scrolls.
export default function Preloader() {
  const { pathname } = useLocation();
  const [done, setDone] = useState(seen);
  const [phase, setPhase] = useState('load');
  const [value, setValue] = useState(0);
  const fill = useRef(null);

  useEffect(() => {
    if (seen) {
      setReady();
      return undefined;
    }
    document.documentElement.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    expectRoute(pathname);

    const timers = [];
    const later = (fn, ms) => timers.push(window.setTimeout(fn, ms));
    const MIN = 1900;
    const MAX = 11000;
    const t0 = performance.now();
    let last = t0;
    let v = 0;
    let finished = false;
    let target = 0;
    const unsub = subscribeAssets(() => (target = assetProgress()));

    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      unsub();
      later(() => setPhase('mark'), 100);
      later(() => {
        setPhase('open');
        document.documentElement.style.overflow = '';
        setReady();
      }, 780);
      later(() => {
        window.scrollTo(0, 0);
        seen = true;
        setDone(true);
      }, 1800);
    };

    const tick = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(now - last, 500);
      last = now;
      const elapsed = now - t0;
      const ready = assetsDone() && elapsed >= MIN;
      // Real progress drives the number, but it never races ahead of a calm, readable count.
      const timeCap = Math.min(1, elapsed / MIN);
      const cap = ready ? 100 : Math.min(97, Math.max(8, target * 100 * 0.94 + 6), 6 + timeCap * 91);
      const rate = (dt / MIN) * 100 * (0.55 + 0.9 * Math.sin((Math.min(v, 100) / 100) * Math.PI));
      v = Math.min(cap, v + Math.max(rate, dt / 2600));
      const p = Math.min(100, v);
      if (fill.current) fill.current.style.transform = `scaleX(${p / 100})`;
      setValue(Math.round(p));
      if (p >= 99.9 || elapsed > MAX) {
        if (elapsed > MAX && pendingAssets().length) console.warn('Loader continued without:', pendingAssets().join(', '));
        setValue(100);
        if (fill.current) fill.current.style.transform = 'scaleX(1)';
        finish();
      }
    }, 30);

    return () => {
      clearInterval(tick);
      unsub();
      timers.forEach(clearTimeout);
      document.documentElement.style.overflow = '';
    };
    // The loader runs once for the first route only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;
  return <LoaderScreen className="sl-preloader" phase={phase} value={value} fill={fill} blob />;
}
