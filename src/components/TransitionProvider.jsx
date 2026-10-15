import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoaderScreen from './LoaderScreen';
import { assetProgress, assetsDone, expectRoute, subscribeAssets } from '../lib/assets';
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
  const ticker = useRef(0);

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
    const t0 = performance.now();
    let v = 0;
    let target = 0;
    let finished = false;
    const unsub = subscribeAssets(() => (target = assetProgress()));
    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(ticker.current);
      unsub();
      setValue(100);
      if (fill.current) fill.current.style.transform = 'scaleX(1)';
      setPhase('mark');
      later(() => {
        setCovered(false);
        setPhase('open');
      }, 520);
      later(() => {
        setPhase('idle');
        setValue(0);
        busy.current = false;
      }, 1500);
    };
    let last = t0;
    ticker.current = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(now - last, 400);
      last = now;
      const elapsed = now - t0;
      const ready = mounted.current && assetsDone() && elapsed >= MIN;
      const cap = ready ? 100 : Math.min(96, 8 + Math.min(1, elapsed / MIN) * 88, Math.max(10, target * 100 * 0.95 + 8));
      v = Math.min(cap, v + Math.max((dt / MIN) * 100 * 1.1, dt / 1800));
      if (fill.current) fill.current.style.transform = `scaleX(${v / 100})`;
      setValue(Math.round(v));
      if (v >= 99.9 || elapsed > MAX) finish();
    }, 30);
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
      clearInterval(ticker.current);
    },
    []
  );

  const value$ = useMemo(() => go, [go]);

  return (
    <Ctx.Provider value={value$}>
      {children}
      <LoaderScreen className="sl-tr" phase={phase} value={value} fill={fill} label={label} />
    </Ctx.Provider>
  );
}
