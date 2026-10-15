// A loader count that moves smoothly from 0 to 100 on every frame.
// Real progress (assets) and a minimum duration set a ceiling; the number glides toward it at a steady, readable speed,
// so a slow asset makes it wait calmly instead of jumping.
export function runCounter({ min, max, progress, isReady, onValue, onDone }) {
  let raf = 0;
  let stopped = false;
  const t0 = performance.now();
  let last = t0;
  let v = 0;
  const loop = (now) => {
    if (stopped) return;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const elapsed = now - t0;
    const ready = isReady() && elapsed >= min;
    const timeCap = Math.min(1, elapsed / min);
    const cap = ready ? 100 : Math.min(95, 3 + progress() * 90, 3 + timeCap * 92);
    const speed = Math.max(ready ? 30 : 5, (cap - v) * 2.4);
    v = Math.min(cap, v + Math.min(speed * dt, 2.2));
    onValue(v);
    if (v >= 99.6 || elapsed > max) {
      stopped = true;
      onValue(100);
      onDone(elapsed > max && !ready);
      return;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}
