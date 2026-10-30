// One animation clock for the whole site, plus the small physics used by every interaction.
// Springs follow Apple's two-parameter model: damping ratio (1 = no overshoot) and response (seconds).

const subs = new Set();
let raf = 0;
let last = 0;

function frame(now) {
  const dt = Math.min((now - (last || now)) / 1000, 1 / 20);
  last = now;
  subs.forEach((fn) => fn(dt, now));
  raf = subs.size ? requestAnimationFrame(frame) : 0;
  if (!raf) last = 0;
}

// Runs fn(dt, now) every frame until the returned function is called.
export function onFrame(fn) {
  subs.add(fn);
  if (!raf) raf = requestAnimationFrame(frame);
  return () => subs.delete(fn);
}

// ---------- scroll state, shared ----------
export const scroll = { y: 0, v: 0, vh: 800, vw: 1280, dir: 1, progress: 0 };
if (typeof window !== 'undefined') {
  let prev = window.scrollY;
  // the page height is cached and refreshed only when the page resizes: reading it every frame forced the browser
  // to redo layout every frame (the biggest cost on slow phones)
  let docH = document.documentElement.scrollHeight;
  const size = () => {
    scroll.vh = window.innerHeight;
    scroll.vw = window.innerWidth;
    docH = document.documentElement.scrollHeight;
  };
  size();
  window.addEventListener('resize', size, { passive: true });
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => (docH = document.documentElement.scrollHeight));
    const watch = () => ro.observe(document.body || document.documentElement);
    if (document.body) watch();
    else window.addEventListener('DOMContentLoaded', watch, { once: true });
  }
  onFrame((dt) => {
    const y = window.scrollY;
    const raw = (y - prev) / Math.max(dt, 1 / 120);
    prev = y;
    scroll.v += (raw - scroll.v) * 0.2;
    if (Math.abs(scroll.v) < 1) scroll.v = 0;
    if (raw) scroll.dir = raw > 0 ? 1 : -1;
    scroll.y = y;
    const max = Math.max(docH - scroll.vh, 1);
    scroll.progress = Math.min(1, Math.max(0, y / max));
  });
}

// Motion is on by default. The OS reduce-motion setting is often switched off system-wide for speed, which
// froze this site, so the site keeps its own switch instead (footer: Motion on/off), remembered per browser.
const MOTION_KEY = 'ff-motion';
const readCalm = () => {
  try {
    return localStorage.getItem(MOTION_KEY) === 'off';
  } catch {
    return false;
  }
};
let calm = typeof window !== 'undefined' && readCalm();
if (typeof document !== 'undefined') document.documentElement.classList.toggle('calm', calm);
export const reduced = () => calm;
export function setCalm(on) {
  calm = on;
  document.documentElement.classList.toggle('calm', on);
  try {
    localStorage.setItem(MOTION_KEY, on ? 'off' : 'on');
  } catch {
    /* storage blocked: the switch still works for this visit */
  }
}
export const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- spring ----------
// A critically damped (or slightly bouncy) spring that always starts from its current value and velocity,
// so it can be re-targeted mid-flight without a jump.
export class Spring {
  constructor(value = 0, { damping = 1, response = 0.4 } = {}) {
    this.x = value;
    this.v = 0;
    this.target = value;
    this.set({ damping, response });
  }
  set({ damping = this.damping, response = this.response }) {
    this.damping = damping;
    this.response = response;
    this.k = Math.pow((2 * Math.PI) / response, 2);
    this.c = (4 * Math.PI * damping) / response;
  }
  step(dt) {
    // semi-implicit Euler in small sub-steps keeps stiff springs stable
    const n = Math.ceil(dt / (1 / 240));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = -this.k * (this.x - this.target) - this.c * this.v;
      this.v += a * h;
      this.x += this.v * h;
    }
    return this.x;
  }
  get resting() {
    return Math.abs(this.x - this.target) < 0.001 && Math.abs(this.v) < 0.001;
  }
}

// Apple's momentum projection: where a flick would come to rest.
export const project = (velocity, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);

// Soft boundary: the further past the edge, the less the element follows.
export const rubberband = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
