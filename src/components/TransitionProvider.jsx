import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoaderScreen from './LoaderScreen';
import { assetProgress, assetsDone, expectRoute, warmDone, warmGate } from '../lib/assets';
import { runCounter } from '../lib/counter';
import { scrollState } from '../lib/scroll';
import { setCovered } from '../lib/ready';

const Ctx = createContext(() => {});
export const useTransitionNavigate = () => useContext(Ctx);

const MIN = 850;
const MAX = 7000;

// Route changes use the same loader as the first visit: the page is covered, the number counts while the next
// page's images and scenes load behind it, the mark builds, then the cover splits open.
export default function TransitionProvider({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [phase, setPhase] = useState('idle');
  const [value, setValue] = useState(0);
  const [label, setLabel] = useState('');
  const fill = useRef(null);
  const busy = useRef(false);
  const pending = useRef(null);
  const mounted = useRef(false);
  const timers = useRef([]);
  const ticker = useRef(() => {});

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const toTop = () => {
    window.scrollTo(0, 0);
    scrollState.lenis?.scrollTo(0, { immediate: true, force: true });
  };

  const count = useCallback(() => {
    let last = -1;
    ticker.current = runCounter({
      min: MIN,
      max: MAX,
      progress: assetProgress,
      isReady: () => mounted.current && assetsDone(),
      onValue: (v) => {
        if (fill.current) fill.current.style.transform = `scaleX(${v / 100})`;
        const r = Math.round(v);
        if (r !== last) {
          last = r;
          setValue(r);
        }
      },
      onDone: () => {
        setPhase('mark');
        warmGate.open = true;
        const t0 = performance.now();
        const open = () => {
          if (performance.now() - t0 < 520 || (!warmDone() && performance.now() - t0 < 8500)) {
            later(open, 60);
            return;
          }
          setCovered(false);
          setPhase('open');
          later(() => {
            setPhase('idle');
            setValue(0);
            busy.current = false;
          }, 980);
        };
        later(open, 520);
      },
    });
  }, [later]);

  const go = useCallback(
    (href, opts = {}) => {
      if (busy.current) return;
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) {
        scrollState.lenis ? scrollState.lenis.scrollTo(0, { duration: 1.2 }) : window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      busy.current = true;
      mounted.current = false;
      setLabel(opts.label || '');
      setValue(0);
      if (fill.current) fill.current.style.transform = 'scaleX(0)';
      setCovered(true);
      setPhase('cover');
      later(() => {
        expectRoute(url.pathname);
        pending.current = url.pathname;
        navigate(url.pathname + url.search + url.hash);
        setPhase('count');
        count();
      }, 600);
    },
    [navigate, later, count]
  );

  useEffect(() => {
    if (pending.current === pathname) {
      pending.current = null;
      toTop();
      // Let the new page run its effects before it counts as mounted.
      later(() => (mounted.current = true), 120);
      return;
    }
    // Back/forward or a direct hash change: no loader, just start at the top.
    if (!busy.current) toTop();
  }, [pathname, later]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      ticker.current();
    },
    []
  );

  const value$ = useMemo(() => go, [go]);

  return (
    <Ctx.Provider value={value$}>
      {children}
      <LoaderScreen className="sl-tr" phase={phase} value={value} fill={fill} label={label} blob />
    </Ctx.Provider>
  );
}
