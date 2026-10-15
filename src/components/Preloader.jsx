import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoaderScreen from './LoaderScreen';
import { assetProgress, assetsDone, expectRoute, pendingAssets } from '../lib/assets';
import { runCounter } from '../lib/counter';
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
    let last = -1;
    const stop = runCounter({
      min: 2200,
      max: 12000,
      progress: assetProgress,
      isReady: assetsDone,
      onValue: (v) => {
        if (fill.current) fill.current.style.transform = `scaleX(${v / 100})`;
        const r = Math.round(v);
        if (r !== last) {
          last = r;
          setValue(r);
        }
      },
      onDone: (gaveUp) => {
        if (gaveUp && pendingAssets().length) console.warn('Loader continued without:', pendingAssets().join(', '));
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
      },
    });

    return () => {
      stop();
      timers.forEach(clearTimeout);
      document.documentElement.style.overflow = '';
    };
    // The loader runs once for the first route only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;
  return <LoaderScreen className="sl-preloader" phase={phase} value={value} fill={fill} />;
}
