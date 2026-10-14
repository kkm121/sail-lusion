let on = false;
let ctx = null;
const listeners = new Set();

try {
  on = localStorage.getItem('sail-sound') === '1';
} catch {
  on = false;
}

export const isSoundOn = () => on;
export const subscribeSound = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function setSound(value) {
  on = value;
  try {
    localStorage.setItem('sail-sound', value ? '1' : '0');
  } catch {
    on = value;
  }
  listeners.forEach((fn) => fn());
}

function blip(freq, duration, gain, type = 'sine', slide = 0) {
  if (!on) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, now + duration);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch {
    on = false;
  }
}

export function playSound(name) {
  if (name === 'hover') blip(1240, 0.07, 0.03, 'sine', 1.25);
  if (name === 'click') {
    blip(520, 0.12, 0.06, 'triangle', 1.6);
    blip(1040, 0.09, 0.03, 'sine', 1.2);
  }
}