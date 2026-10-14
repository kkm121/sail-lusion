import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Ctx = createContext(() => {});
export const useTransitionNavigate = () => useContext(Ctx);

export default function TransitionProvider({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const panel = useRef(null);
  const label = useRef(null);
  const busy = useRef(false);
  const pending = useRef(null);
  const timers = useRef([]);

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const reveal = useCallback(() => {
    const el = panel.current;
    if (!el) return;
    el.dataset.state = 'reveal';
    later(() => {
      el.dataset.state = 'idle';
      busy.current = false;
    }, 900);
  }, [later]);

  const go = useCallback(
    (href, opts = {}) => {
      const el = panel.current;
      if (!el || busy.current) return;
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      busy.current = true;
      el.style.setProperty('--tc', opts.color || '#05060b');
      el.style.setProperty('--tt', opts.text || '#ffffff');
      if (label.current) label.current.textContent = opts.label || '';
      el.dataset.state = 'cover';
      later(() => {
        pending.current = url.pathname;
        navigate(url.pathname + url.search + url.hash);
        later(reveal, 5000);
      }, 750);
    },
    [navigate, reveal, later]
  );

  useEffect(() => {
    if (pending.current !== pathname) return;
    pending.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    window.scrollTo(0, 0);
    later(reveal, 200);
  }, [pathname, reveal, later]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const value = useMemo(() => go, [go]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="sl-trans" data-state="idle" ref={panel} aria-hidden="true">
        <span className="sl-trans-label" ref={label} />
      </div>
    </Ctx.Provider>
  );
}