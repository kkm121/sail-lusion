import { useEffect, useRef } from 'react';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';
import { useDocRect } from '../lib/measure';
import { whenShown } from '../lib/ready';
import { artUrl } from '../data/projects';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// A band of pictures that slides sideways while the page scrolls past it.
export default function ScrollStrip({ items, label = 'Imagery' }) {
  const root = useRef(null);
  const track = useRef(null);
  const rect = useDocRect(root);
  const extra = useRef(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    let cancel = () => {};
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        cancel = whenShown(() => el.classList.add('is-in'), 40);
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancel();
    };
  }, []);

  useEffect(() => {
    const t = track.current;
    const r = root.current;
    if (!t || !r) return undefined;
    const measure = () => {
      extra.current = Math.max(0, t.scrollWidth - r.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    ro.observe(r);
    return () => ro.disconnect();
  }, [items]);

  useEffect(
    () =>
      onTick(() => {
        if (!rect.ready || !track.current) return;
        const top = rect.top - scrollState.y;
        const vh = scrollState.vh;
        if (top > vh * 1.05 || top + rect.height < -vh * 0.05) return;
        const p = clamp((vh - top) / (vh + rect.height));
        track.current.style.transform = `translate3d(${(-extra.current * p).toFixed(1)}px,0,0)`;
      }, 6),
    [rect]
  );

  return (
    <div className="sl-strip" ref={root} role="group" aria-label={label}>
      <div className="sl-strip-track" ref={track}>
        {items.map((p, i) => (
          <figure className="sl-strip-item" key={`${p.id}-${i}`} style={{ '--i': i }}>
            <img src={artUrl(p)} alt={i < 3 ? p.name : ''} loading="lazy" decoding="async" draggable="false" />
            <figcaption>{p.name}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
