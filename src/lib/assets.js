import { artUrl, projects } from '../data/projects';
import { MEDIA } from '../data/media';
import { isMobileWidth } from './device';

// What each route needs before its loader opens. Components resolve their own names when ready.
const BY_ROUTE = {
  '/': ['fonts', 'media', 'hero', 'labload', 'lab'],
  '/about': ['fonts', 'media', 'sub'],
  '/projects': ['fonts', 'media', 'sub'],
  '/domains': ['fonts', 'media', 'sub'],
};

const names = new Map();
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export function subscribeAssets(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function expectAsset(name) {
  if (!names.has(name)) names.set(name, false);
  notify();
}

export const isResolved = (name) => names.get(name) === true;

export function resolveAsset(name) {
  if (names.get(name) === true) return;
  names.set(name, true);
  notify();
}

export function resetAssets() {
  names.clear();
  notify();
}

// The voyage's shader warm-up ('lab') freezes the page for a moment on integrated GPUs, so it is left out of the count
// and started only once the number reaches 100, while the sail mark builds with a pure CSS animation.
export const warmGate = { open: false };
const counted = () => [...names.entries()].filter(([k]) => k !== 'lab');

export function assetProgress() {
  const list = counted();
  if (!list.length) return 0;
  return list.filter(([, v]) => v).length / list.length;
}

// Ready to open: the warm-up, if this page has one, has finished.
export const warmDone = () => !names.has('lab') || names.get('lab') === true;

export const assetsDone = () => names.size > 0 && counted().every(([, v]) => v);
export const pendingAssets = () => [...names.entries()].filter(([, v]) => !v).map(([k]) => k);

export function preloadImages(urls, timeout = 7000) {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          const t = window.setTimeout(resolve, timeout);
          img.onload = img.onerror = () => {
            clearTimeout(t);
            resolve();
          };
          img.src = src;
          if (img.decode) img.decode().then(() => (clearTimeout(t), resolve())).catch(() => {});
        })
    )
  );
}

export function preloadVideo(src, timeout = 5000) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    const done = () => {
      clearTimeout(t);
      v.removeAttribute('src');
      resolve();
    };
    const t = window.setTimeout(done, timeout);
    v.preload = 'auto';
    v.muted = true;
    v.oncanplaythrough = v.onloadeddata = done;
    v.onerror = done;
    v.src = src;
    v.load();
  });
}

const routeKey = (pathname) => (BY_ROUTE[pathname] ? pathname : pathname.startsWith('/domains/') || pathname.startsWith('/projects/') ? '/projects' : pathname);

function mediaFor(pathname) {
  const k = routeKey(pathname);
  if (k === '/') return [MEDIA.crew.src, MEDIA.build.src, MEDIA.reel.poster, ...projects.slice(0, 4).map(artUrl)];
  if (k === '/projects') return projects.slice(0, 6).map(artUrl);
  if (k === '/about') return [MEDIA.crew.src];
  return [];
}

// Start loading everything a route needs and register what it still has to resolve.
export function expectRoute(pathname) {
  resetAssets();
  warmGate.open = false;
  (BY_ROUTE[routeKey(pathname)] || ['fonts', 'media']).forEach(expectAsset);
  (document.fonts?.ready || Promise.resolve()).then(() => resolveAsset('fonts'));
  const jobs = [preloadImages(mediaFor(pathname))];
  if (routeKey(pathname) === '/') jobs.push(preloadVideo(isMobileWidth() ? MEDIA.reel.fallbackMobile : MEDIA.reel.fallbackDesktop));
  Promise.all(jobs).then(() => resolveAsset('media'));
}
