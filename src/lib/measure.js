import { useEffect, useRef } from 'react';

const live = new Set();
let queued = 0;

function run() {
  queued = 0;
  live.forEach((m) => m.measure());
}

// Layout is read here, a few times, instead of every frame inside scroll handlers.
export function remeasure() {
  if (queued) return;
  queued = window.setTimeout(run, 60);
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure);
  document.fonts?.ready.then(remeasure);
  window.addEventListener('sl:layout', remeasure);
}

// Tracks several elements chosen by selector; their page positions refresh with the layout.
export function trackAll(getEls) {
  const rects = [];
  const item = {
    measure() {
      const els = getEls();
      const y = window.scrollY || 0;
      rects.length = els.length;
      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        rects[i] = { top: r.top + y, bottom: r.bottom + y, height: r.height, el };
      });
    },
  };
  item.measure();
  live.add(item);
  return { rects, stop: () => live.delete(item) };
}

export function useDocRect(ref) {
  const rect = useRef({ top: 0, left: 0, width: 0, height: 0, ready: false }).current;
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const item = {
      measure() {
        const r = el.getBoundingClientRect();
        rect.top = r.top + (window.scrollY || 0);
        rect.left = r.left;
        rect.width = r.width;
        rect.height = r.height;
        rect.ready = true;
      },
    };
    item.measure();
    live.add(item);
    const ro = new ResizeObserver(remeasure);
    ro.observe(el);
    return () => {
      live.delete(item);
      ro.disconnect();
    };
  }, [ref, rect]);
  return rect;
}
