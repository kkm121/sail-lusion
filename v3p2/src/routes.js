// Each page is its own small file, downloaded only when it is needed: when a visitor points at (or focuses) its link,
// or when they open it. Home is part of the main bundle because it is where most visits start.
export const pageLoaders = {
  '/domains': () => import('./pages/Domains'),
  '/events': () => import('./pages/Events'),
  '/projects': () => import('./pages/Projects'),
  '/team': () => import('./pages/Team'),
  '/partners': () => import('./pages/Partners'),
  '/join': () => import('./pages/Join'),
  '/signin': () => import('./pages/Auth'),
  '/signup': () => import('./pages/Auth'),
  '/cli': () => import('./pages/Cli'),
};

const started = new Set();
// fetch a page's file ahead of the click (cheap: a few KB of script, nothing is rendered)
export function prefetchPage(path) {
  const key = Object.keys(pageLoaders).find((k) => path === k || path.startsWith(k + '/'));
  if (!key || started.has(key)) return;
  started.add(key);
  pageLoaders[key]().catch(() => started.delete(key));
}
