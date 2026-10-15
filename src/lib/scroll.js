export const scrollState = {
  velocity: 0,
  y: 0,
  vh: 800,
  vw: 1280,
  progress: 0,
  dir: 1,
  scrolling: false,
  lenis: null,
};

export function scrollTo(target, opts = {}) {
  const { lenis } = scrollState;
  if (lenis) lenis.scrollTo(target, { duration: opts.duration ?? 1.2, immediate: opts.immediate ?? false });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: opts.immediate ? 'auto' : 'smooth' });
  else target?.scrollIntoView?.({ behavior: opts.immediate ? 'auto' : 'smooth' });
}
