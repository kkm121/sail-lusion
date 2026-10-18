import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { clamp, finePointer, onFrame, project, reduced, rubberband, scroll, Spring } from '../lib/motion';

// ---------------------------------------------------------------------------
// Magnetic: the element leans toward the pointer while hovered and springs home (damping 1, no overshoot).
// Feedback is on pointer-down: a quick press-in, released on pointer-up.
// ---------------------------------------------------------------------------
export function Magnetic({ children, strength = 0.28 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current?.firstElementChild;
    if (!el || !finePointer() || reduced()) return undefined;
    const x = new Spring(0, { damping: 1, response: 0.35 });
    const y = new Spring(0, { damping: 1, response: 0.35 });
    const s = new Spring(1, { damping: 1, response: 0.2 });
    let stop = null;
    const run = () => {
      if (stop) return;
      stop = onFrame((dt) => {
        x.step(dt);
        y.step(dt);
        s.step(dt);
        el.style.transform = `translate3d(${x.x.toFixed(2)}px, ${y.x.toFixed(2)}px, 0) scale(${s.x.toFixed(4)})`;
        if (x.resting && y.resting && s.resting) {
          stop();
          stop = null;
        }
      });
    };
    const move = (e) => {
      const r = el.getBoundingClientRect();
      x.target = (e.clientX - r.left - r.width / 2) * strength;
      y.target = (e.clientY - r.top - r.height / 2) * strength;
      run();
    };
    const leave = () => {
      x.target = 0;
      y.target = 0;
      s.target = 1;
      run();
    };
    const down = () => {
      s.target = 0.96;
      run();
    };
    const up = () => {
      s.target = 1;
      run();
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    return () => {
      stop?.();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
    };
  }, [strength]);
  return (
    <span ref={ref} className="magnetic">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tilt: cards turn a few degrees toward the pointer and a light follows it across the surface.
// Applied to every element matching `selector` inside the container, with one listener each.
// ---------------------------------------------------------------------------
export function useTilt(rootRef, selector = '.card', max = 5) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !finePointer() || reduced()) return undefined;
    const cleanups = [];
    root.querySelectorAll(selector).forEach((el) => {
      const rx = new Spring(0, { damping: 1, response: 0.45 });
      const ry = new Spring(0, { damping: 1, response: 0.45 });
      let stop = null;
      const run = () => {
        if (stop) return;
        stop = onFrame((dt) => {
          rx.step(dt);
          ry.step(dt);
          el.style.transform = `perspective(900px) rotateX(${rx.x.toFixed(3)}deg) rotateY(${ry.x.toFixed(3)}deg)`;
          if (rx.resting && ry.resting) {
            stop();
            stop = null;
            if (!rx.target && !ry.target) el.style.transform = '';
          }
        });
      };
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
        ry.target = (px - 0.5) * 2 * max;
        rx.target = -(py - 0.5) * 2 * max;
        run();
      };
      const leave = () => {
        rx.target = 0;
        ry.target = 0;
        run();
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        stop?.();
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
      });
    });
    return () => cleanups.forEach((c) => c());
  });
}

// ---------------------------------------------------------------------------
// Split heading: each word rises out of its own mask, line by line, when it scrolls into view.
// ---------------------------------------------------------------------------
export function Split({ as: Tag = 'h2', className = '', children, delay = 0, immediate = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // line index per word so lines stagger even though the browser wraps them
    const words = [...el.querySelectorAll('.sw')];
    let line = -1;
    let top = -1e9;
    words.forEach((w) => {
      if (Math.abs(w.offsetTop - top) > 4) {
        line++;
        top = w.offsetTop;
      }
      w.style.setProperty('--l', line);
    });
    if (immediate) {
      requestAnimationFrame(() => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.classList.add('is-in');
      io.disconnect();
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);
  // Words of an .ember-text span carry the gradient themselves: background-clip text does not reach into
  // transformed children, so the class moves down to each word.
  const render = (node, key, cls = '') => {
    if (typeof node === 'string') {
      return node.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part) ? part : part ? (
          <span className="sw" key={`${key}-${i}`}>
            <span className={`swi ${cls}`.trim()}>{part}</span>
          </span>
        ) : null
      );
    }
    if (isValidElement(node)) {
      const c = node.props.className || '';
      if (c.includes('ember-text')) return Children.map(node.props.children, (ch, i) => render(ch, `${key}-${i}`, 'ember-text'));
      return cloneElement(node, { key }, Children.map(node.props.children, (ch, i) => render(ch, `${key}-${i}`, cls)));
    }
    return node;
  };
  return (
    <Tag ref={ref} className={`split ${className}`.trim()} style={{ '--sd': `${delay}ms` }}>
      {Children.map(children, (c, i) => render(c, i))}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Word cycle: one word in a headline rolls to the next every few seconds.
// ---------------------------------------------------------------------------
export function Cycle({ words, every = 2600 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced()) return undefined;
    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), every);
    return () => clearInterval(id);
  }, [words.length, every]);
  return (
    <span className="cycle" aria-live="off">
      <span className="cycle-sizer" aria-hidden="true">
        {words.reduce((a, b) => (b.length > a.length ? b : a), '')}
      </span>
      {words.map((w, n) => (
        <span key={w} className={`cycle-w ${n === i ? 'is-on' : n === (i + words.length - 1) % words.length ? 'is-out' : ''}`.trim()} aria-hidden={n !== i}>
          {w}
        </span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Marquee: a band that drifts sideways and speeds up with the scroll, in the scroll's direction.
// ---------------------------------------------------------------------------
export function Marquee({ items, speed = 40, className = '' }) {
  const track = useRef(null);
  useEffect(() => {
    const el = track.current;
    if (!el || reduced()) return undefined;
    let x = 0;
    let boost = 0;
    let w = el.firstElementChild.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => (w = el.firstElementChild.getBoundingClientRect().width));
    ro.observe(el.firstElementChild);
    let on = true;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    const stop = onFrame((dt) => {
      if (!on) return;
      boost += (clamp(scroll.v / 6, -400, 400) - boost) * 0.08;
      x -= (speed + Math.abs(boost)) * dt * (boost < -2 ? -1 : 1);
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      const skew = clamp(-scroll.v * 0.003, -4, 4);
      el.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
    });
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, [speed]);
  const group = (k) => (
    <div className="mq-g" key={k} aria-hidden={k > 0 ? 'true' : undefined}>
      {items.map((it, i) => (
        <span className={`mq-i ${i % 2 ? 'alt' : ''}`.trim()} key={i}>
          {it}
          <i aria-hidden="true" />
        </span>
      ))}
    </div>
  );
  return (
    <div className={`mq ${className}`.trim()}>
      <div className="mq-t" ref={track}>
        {[0, 1, 2].map(group)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag rail: a horizontal row you can grab and throw. It tracks the pointer 1:1 from where it was grabbed,
// projects momentum on release, rubber-bands at the ends, and settles with a spring that inherits the
// release velocity. Wheel and trackpad scroll it too; clicks still work after a small (8px) threshold.
// ---------------------------------------------------------------------------
export function DragRail({ children, className = '', label }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const api = useRef(null);
  useEffect(() => {
    const o = outer.current;
    const el = inner.current;
    if (!o || !el) return undefined;
    const pos = new Spring(0, { damping: 1, response: 0.55 });
    let min = 0;
    const measure = () => {
      min = Math.min(0, o.clientWidth - el.scrollWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(el);
    let drag = null;
    let stop = null;
    const paint = () => {
      el.style.transform = `translate3d(${pos.x.toFixed(2)}px,0,0)`;
      setAtStart(pos.x > -4);
      setAtEnd(pos.x < min + 4);
    };
    const settle = () => {
      if (stop) return;
      stop = onFrame((dt) => {
        if (drag) return;
        pos.step(dt);
        paint();
        if (pos.resting) {
          stop();
          stop = null;
        }
      });
    };
    const to = (target, velocity = 0) => {
      pos.target = clamp(target, min, 0);
      pos.v = velocity;
      settle();
    };
    api.current = { by: (dx) => to(pos.target + dx) };
    const down = (e) => {
      if (e.button !== 0) return;
      drag = { x0: e.clientX, p0: pos.x, hist: [[e.clientX, performance.now()]], moved: false, id: e.pointerId };
      pos.v = 0;
    };
    const move = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x0;
      if (!drag.moved && Math.abs(dx) > 8) {
        drag.moved = true;
        o.setPointerCapture(drag.id);
        o.classList.add('is-dragging');
      }
      if (!drag.moved) return;
      let x = drag.p0 + dx;
      if (x > 0) x = rubberband(x, o.clientWidth);
      if (x < min) x = min + rubberband(x - min, o.clientWidth);
      pos.x = x;
      pos.target = x;
      paint();
      drag.hist.push([e.clientX, performance.now()]);
      if (drag.hist.length > 6) drag.hist.shift();
    };
    const up = () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      o.classList.remove('is-dragging');
      if (!d.moved) return;
      const [a, b] = [d.hist[0], d.hist[d.hist.length - 1]];
      const v = ((b[0] - a[0]) / Math.max(b[1] - a[1], 1)) * 1000;
      to(pos.x + project(v, 0.995), v);
      // swallow the click that follows a drag
      const kill = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        window.removeEventListener('click', kill, true);
      };
      window.addEventListener('click', kill, true);
      setTimeout(() => window.removeEventListener('click', kill, true), 0);
    };
    const wheel = (e) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      to(pos.target - e.deltaX);
    };
    o.addEventListener('pointerdown', down);
    o.addEventListener('pointermove', move);
    o.addEventListener('pointerup', up);
    o.addEventListener('pointercancel', up);
    o.addEventListener('wheel', wheel, { passive: false });
    paint();
    return () => {
      stop?.();
      ro.disconnect();
      o.removeEventListener('pointerdown', down);
      o.removeEventListener('pointermove', move);
      o.removeEventListener('pointerup', up);
      o.removeEventListener('pointercancel', up);
      o.removeEventListener('wheel', wheel);
    };
  }, []);
  const step = (dir) => api.current?.by(-dir * (outer.current?.clientWidth || 600) * 0.8);
  return (
    <div className={`rail ${className}`.trim()}>
      <div className="rail-o" ref={outer} role="region" aria-label={label} tabIndex={-1}>
        <div className="rail-i" ref={inner}>
          {children}
        </div>
      </div>
      <div className="rail-nav">
        <button type="button" className="rail-btn" onClick={() => step(-1)} disabled={atStart} aria-label="Previous">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
        <button type="button" className="rail-btn" onClick={() => step(1)} disabled={atEnd} aria-label="Next">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parallax: an element drifts against the scroll by `amount` (fraction of its distance from the viewport centre).
// ---------------------------------------------------------------------------
export function useParallax(ref, amount = 0.12) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return undefined;
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: '20% 0px' });
    io.observe(el);
    const stop = onFrame(() => {
      if (!on) return;
      const r = el.parentElement.getBoundingClientRect();
      const off = (r.top + r.height / 2 - scroll.vh / 2) * -amount;
      el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    });
    return () => {
      stop();
      io.disconnect();
    };
  }, [ref, amount]);
}

// Scroll progress for a section: 0 when its top meets the viewport bottom, 1 when its bottom meets the top.
export function useSectionProgress(ref, cb) {
  const fn = useRef(cb);
  fn.current = cb;
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(el);
    const stop = onFrame(() => {
      if (!on) return;
      const r = el.getBoundingClientRect();
      fn.current(clamp((scroll.vh - r.top) / (scroll.vh + r.height)), r);
    });
    return () => {
      stop();
      io.disconnect();
    };
  }, [ref]);
}

// ---------------------------------------------------------------------------
// SidePop: images pop in from left or right linked to scroll progress.
// transform: translateX(±(1-k)*40vw) rotate(±(1-k)*8deg) scale(0.85+0.15k) and opacity
// ---------------------------------------------------------------------------
export function useSidePop(ref, side = 'left', { maxVw = 40, maxDeg = 8 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduced()) {
      el.style.transform = '';
      el.style.opacity = '1';
      return undefined;
    }
    let on = false;
    const io = new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: '20% 0px' });
    io.observe(el);

    const sign = side === 'left' ? -1 : 1;
    const stop = onFrame(() => {
      if (!on) return;
      if (reduced()) {
        el.style.transform = '';
        el.style.opacity = '1';
        return;
      }
      const r = el.getBoundingClientRect();
      const vh = scroll.vh || window.innerHeight;
      const k = clamp((vh - r.top) / (vh * 0.72), 0, 1);
      const tx = sign * (1 - k) * maxVw;
      const rot = sign * (1 - k) * maxDeg;
      const sc = 0.85 + 0.15 * k;
      const op = clamp(k * 1.4, 0, 1);
      const skew = clamp(-scroll.v * 0.002, -2.5, 2.5);

      el.style.transform = `translate3d(${tx.toFixed(2)}vw, 0, 0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)}) skewY(${skew.toFixed(2)}deg)`;
      el.style.opacity = op.toFixed(3);
    });

    return () => {
      stop();
      io.disconnect();
    };
  }, [ref, side, maxVw, maxDeg]);
}

export function PopImage({ src, alt = '', side = 'left', className = '', ...props }) {
  const ref = useRef(null);
  useSidePop(ref, side);
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const resolved = src && src.startsWith('/') && base && !src.startsWith(base + '/') ? `${base}${src}` : src;
  return (
    <div className={`pop-img-wrap ${side} ${className}`.trim()} ref={ref}>
      <img src={resolved} alt={alt} {...props} />
    </div>
  );
}

