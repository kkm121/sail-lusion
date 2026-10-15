import { useEffect, useRef } from 'react';
import { onTick } from '../lib/ticker';
import { whenShown } from '../lib/ready';

const ease = (k) => 1 - Math.pow(1 - k, 3);

// A number that rolls up to its value once it is on screen, and rolls from the old value when it changes.
export default function CountUp({ to, pad = 2, duration = 1300, delay = 0, className = '' }) {
  const ref = useRef(null);
  const shown = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let stop = () => {};
    let cancel = () => {};
    const run = () => {
      const from = shown.current;
      const t0 = performance.now() + (started.current ? 0 : delay);
      started.current = true;
      stop();
      stop = onTick((now) => {
        const k = Math.min(1, Math.max(0, (now - t0) / duration));
        const v = Math.round(from + (to - from) * ease(k));
        if (v !== shown.current || k === 1) {
          shown.current = v;
          el.textContent = String(v).padStart(pad, '0');
        }
        if (k >= 1) stop();
      }, 10);
    };
    let io = null;
    if (started.current) run();
    else {
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          cancel = whenShown(run);
        },
        { threshold: 0.4 }
      );
      io.observe(el);
    }
    return () => {
      io?.disconnect();
      cancel();
      stop();
    };
  }, [to, pad, duration, delay]);

  return (
    <span ref={ref} className={`sl-cu ${className}`.trim()}>
      {String(0).padStart(pad, '0')}
    </span>
  );
}
