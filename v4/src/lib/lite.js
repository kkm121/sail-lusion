// Lite mode, as in v1: phones get a lighter site automatically (touch screen, narrow viewport), and anyone can force it
// with ?lite in the address or switch it in the footer. Lite keeps the opening screen and v2's voyage, but the voyage
// draws at one pixel per pixel within a pixel budget, with no post-processing and fewer particles, and the page drops
// its decorative animations.
const KEY = 'ff-lite'; // 'on' | 'off' | absent (auto)

export function litePref() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

const auto = () => typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches && window.innerWidth < 1024;

export function isLite() {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(location.search).has('lite')) return true;
  const p = litePref();
  if (p === 'on') return true;
  if (p === 'off') return false;
  return auto();
}

export function setLitePref(v) {
  try {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the choice still applies for this visit */
  }
  document.documentElement.classList.toggle('lite', isLite());
}

if (typeof document !== 'undefined') document.documentElement.classList.toggle('lite', isLite());
