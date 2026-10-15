// Entry animations start only when nothing is covering the page (loader or route transition).
export const flags = { ready: false, covered: false };

export function setReady() {
  if (flags.ready) return;
  flags.ready = true;
  document.documentElement.dataset.ready = '1';
  window.dispatchEvent(new Event('sl:ready'));
}

export function setCovered(v) {
  flags.covered = v;
  if (!v) window.dispatchEvent(new Event('sl:reveal'));
}

export function whenShown(fn, delay = 0) {
  const run = () => (delay ? window.setTimeout(fn, delay) : fn());
  if (flags.ready && !flags.covered) {
    run();
    return () => {};
  }
  const h = () => {
    if (!flags.ready || flags.covered) return;
    window.removeEventListener('sl:ready', h);
    window.removeEventListener('sl:reveal', h);
    run();
  };
  window.addEventListener('sl:ready', h);
  window.addEventListener('sl:reveal', h);
  return () => {
    window.removeEventListener('sl:ready', h);
    window.removeEventListener('sl:reveal', h);
  };
}
