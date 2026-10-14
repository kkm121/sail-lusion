import { useEffect, useRef } from 'react';
import { scrollState } from '../lib/scroll';

const WORDS = ['Computer Vision', 'Language', 'Robotics', 'Data', 'Web & Design', 'Edge AI'];

export default function Marquee() {
  const track = useRef(null);

  useEffect(() => {
    let x = 0;
    let raf = 0;
    let dir = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = track.current;
      if (!el) return;
      const v = scrollState.velocity;
      if (Math.abs(v) > 0.2) dir = v > 0 ? -1 : 1;
      x += dir * (0.8 + Math.min(Math.abs(v), 40) * 0.35);
      const half = el.scrollWidth / 2;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      el.style.transform = `translate3d(${x}px, 0, 0)`;
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  const items = [...WORDS, ...WORDS, ...WORDS, ...WORDS];
  return (
    <div className="sl-marquee" aria-hidden="true">
      <div className="sl-marquee-track" ref={track}>
        {items.map((w, i) => (
          <span key={i} className={i % 2 ? 'alt' : ''}>
            {w}
            <i />
          </span>
        ))}
      </div>
    </div>
  );
}