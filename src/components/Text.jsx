import { useEffect, useMemo, useRef } from 'react';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';
import { whenShown } from '../lib/ready';

const GLYPHS = '!<>-_/[]{}=+*^?#%&01';
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function scramble(el, text, delay = 0, duration = 950) {
  const len = text.length;
  const start = performance.now() + delay;
  const seeds = Array.from({ length: len }, (_, i) => 0.12 + (i / Math.max(len, 1)) * 0.62 + Math.random() * 0.26);
  let last = '';
  const stop = onTick((now) => {
    const t = (now - start) / duration;
    if (t < 0) return;
    let out = '';
    for (let i = 0; i < len; i++) {
      const c = text[i];
      if (c === ' ' || t >= seeds[i]) out += c;
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    if (out !== last) {
      el.textContent = out;
      last = out;
    }
    if (t >= 1) {
      el.textContent = text;
      stop();
    }
  }, 10);
  return stop;
}

// type: lines | chars | words | scrub | scramble | wipe
export default function Text({ as: Tag = 'span', type = 'lines', text, children, delay = 0, className = '', threshold = 0.18, trigger = 'view', ...rest }) {
  const str = text ?? (typeof children === 'string' ? children : '');
  const ref = useRef(null);
  const words = useMemo(() => str.split(' ').filter(Boolean), [str]);

  useEffect(() => {
    const el = ref.current;
    if (!el || type === 'scrub') return undefined;
    let stopScramble = null;
    let cancel = () => {};
    const show = () => {
      el.classList.add('is-in');
      if (type === 'scramble') {
        const target = el.querySelector('.sl-t-s');
        if (target) stopScramble = scramble(target, str, delay);
      }
    };
    let io = null;
    if (trigger === 'ready') {
      cancel = whenShown(show, 60);
    } else {
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io.disconnect();
          cancel = whenShown(show);
        },
        { rootMargin: '0px 0px -8% 0px', threshold: type === 'scramble' ? 0.4 : threshold }
      );
      io.observe(el);
    }
    return () => {
      io?.disconnect();
      cancel();
      stopScramble?.();
    };
  }, [type, str, delay, threshold, trigger]);

  // Line index per word so lines can stagger even though the browser wraps them.
  useEffect(() => {
    const el = ref.current;
    if (!el || (type !== 'lines' && type !== 'wipe')) return undefined;
    const assign = () => {
      const ws = el.querySelectorAll('.w');
      let line = -1;
      let top = -999;
      ws.forEach((w) => {
        const t = w.offsetTop;
        if (Math.abs(t - top) > 6) {
          line += 1;
          top = t;
        }
        w.firstElementChild?.style.setProperty('--l', String(line));
      });
    };
    assign();
    const ro = new ResizeObserver(assign);
    ro.observe(el);
    document.fonts?.ready.then(assign);
    return () => ro.disconnect();
  }, [type, str]);

  useEffect(() => {
    const el = ref.current;
    if (!el || type !== 'scrub') return undefined;
    const ws = el.querySelectorAll('.wi');
    const n = ws.length;
    const cache = new Float32Array(n).fill(-1);
    const stop = onTick(() => {
      if (!rect.ready) return;
      const top = rect.top - scrollState.y;
      const vh = scrollState.vh;
      if (top > vh * 1.05 || top + rect.height < -vh * 0.2) return;
      const p = clamp((vh * 0.88 - top) / (vh * 0.5 + rect.height * 0.9));
      for (let i = 0; i < n; i++) {
        const o = clamp(p * (n + 5) - i, 0, 4) / 4;
        const v = 0.14 + 0.86 * o;
        if (Math.abs(v - cache[i]) > 0.012) {
          cache[i] = v;
          ws[i].style.opacity = v.toFixed(3);
        }
      }
    }, 5);
    return stop;
  }, [type, str, rect]);

  let body;
  if (type === 'chars') {
    let i = 0;
    body = words.map((word, wi) => (
      <span key={wi}>
        <span className="wd">
          {[...word].map((c, ci) => (
            <span className="c" key={ci}>
              <span className="ci" style={{ '--i': i++ }}>
                {c}
              </span>
            </span>
          ))}
        </span>
        {wi < words.length - 1 ? ' ' : null}
      </span>
    ));
  } else if (type === 'scramble') {
    body = (
      <span className="sl-t-s" aria-hidden="true" style={{ opacity: 1 }}>
        {str.replace(/[^ ]/g, ' ')}
      </span>
    );
  } else {
    body = words.map((word, wi) => (
      <span key={wi}>
        <span className="w">
          <span className="wi" style={{ '--i': wi }}>
            {word}
          </span>
        </span>
        {wi < words.length - 1 ? ' ' : null}
      </span>
    ));
  }

  return (
    <Tag ref={ref} className={`sl-t sl-t--${type} ${className}`} aria-label={str} style={{ '--d': `${delay}ms` }} {...rest}>
      <span aria-hidden="true">{body}</span>
    </Tag>
  );
}
