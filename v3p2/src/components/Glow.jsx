import { useEffect, useRef } from 'react';
import { isLite } from '../lib/lite';

// The ember light behind the Join band and the footer (the look of v3's fluid, without WebGL): soft blurred blobs that
// drift on their own, and one that leans toward the pointer while it is over the section. CSS only, one tiny listener.
export default function Glow() {
  const root = useRef(null);
  useEffect(() => {
    const el = root.current?.parentElement;
    if (!el || isLite() || !window.matchMedia('(hover: hover)').matches) return undefined;
    let raf = 0;
    let px = 0.5;
    let py = 0.5;
    const set = () => {
      raf = 0;
      root.current?.style.setProperty('--gx', px.toFixed(3));
      root.current?.style.setProperty('--gy', py.toFixed(3));
    };
    const move = (e) => {
      const r = el.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width;
      py = (e.clientY - r.top) / r.height;
      if (!raf) raf = requestAnimationFrame(set);
    };
    el.addEventListener('pointermove', move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', move);
    };
  }, []);
  return (
    <div className="glow" ref={root} aria-hidden="true">
      <i className="g-a" />
      <i className="g-b" />
      <i className="g-p" />
    </div>
  );
}
