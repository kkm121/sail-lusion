import { useEffect, useRef } from 'react';
import { isLite } from '../lib/lite';
import { reduced } from '../lib/motion';

// A light cursor: a dot that follows the pointer exactly and a ring that trails it (a CSS transition), growing over
// links and buttons. No canvas and no animation loop: it only moves when the pointer moves. Mouse and trackpad only.
export default function LiteCursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  useEffect(() => {
    if (isLite() || reduced() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const d = dot.current;
    const r = ring.current;
    document.documentElement.classList.add('has-cursor');
    let x = -100;
    let y = -100;
    let raf = 0;
    const paint = () => {
      raf = 0;
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      r.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const over = (e) => r.classList.toggle('is-link', !!e.target.closest?.('a, button, [role="button"], input, label'));
    const down = () => r.classList.add('is-down');
    const up = () => r.classList.remove('is-down');
    const leave = () => r.classList.add('is-gone');
    const enter = () => r.classList.remove('is-gone');
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('pointerenter', enter);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('pointerenter', enter);
    };
  }, []);
  return (
    <>
      <i className="lc-ring" ref={ring} aria-hidden="true" />
      <i className="lc-dot" ref={dot} aria-hidden="true" />
    </>
  );
}
