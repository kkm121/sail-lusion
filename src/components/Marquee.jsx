import { useEffect, useRef, useState } from 'react';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';

export default function Marquee({ items, speed = 55, dir = 1, variant = 'solid', className = '', reactive = true, label }) {
  const track = useRef(null);
  const group = useRef(null);
  const [copies, setCopies] = useState(3);
  const st = useRef({ x: 0, w: 1, on: true, boost: 0 }).current;

  useEffect(() => {
    const g = group.current;
    const root = track.current?.parentElement;
    if (!g || !root) return undefined;
    const measure = () => {
      st.w = g.getBoundingClientRect().width || 1;
      setCopies(Math.max(3, Math.ceil((window.innerWidth * 2) / st.w) + 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(g);
    document.fonts?.ready.then(measure);
    const io = new IntersectionObserver(([e]) => (st.on = e.isIntersecting), { rootMargin: '120px' });
    io.observe(root);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [items, st]);

  useEffect(
    () =>
      onTick((t, dt) => {
        if (!st.on || !track.current) return;
        const v = reactive ? Math.min(Math.abs(scrollState.velocity), 60) : 0;
        st.boost += (v - st.boost) * 0.08;
        st.x -= (speed + st.boost * 16) * dt * dir;
        if (st.x <= -st.w) st.x += st.w;
        if (st.x > 0) st.x -= st.w;
        track.current.style.transform = `translate3d(${st.x.toFixed(2)}px,0,0)`;
      }, 10),
    [speed, dir, reactive, st]
  );

  return (
    <div className={`sl-mq sl-mq--${variant} ${className}`} role="marquee" aria-label={label || items.join(', ')}>
      <div className="sl-mq-track" ref={track}>
        {Array.from({ length: copies }, (_, c) => (
          <div className="sl-mq-group" ref={c === 0 ? group : undefined} aria-hidden={c > 0 ? 'true' : undefined} key={c}>
            {items.map((it, i) => (
              <span className={`sl-mq-item ${i % 3 === 1 ? 'alt' : ''}`} key={i}>
                {it}
                <i className="sl-mq-sep" aria-hidden="true" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
