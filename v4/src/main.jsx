import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/sora';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/pages.css';
import './styles/apple.css';
import './styles/v4.css';
import App from './App';

// opening-screen hand-off (the screen itself lives in index.html): report progress, then let it finish once the fonts are in
const ld = window.__ld || { set() {}, done() {} };
ld.set(30);
// on Home the opening screen also waits until v2's voyage is downloaded, compiled and drawn once (Lab.jsx resolves this)
const path = location.pathname.replace(/\/$/, '') || '/';
const needsLab = /\/discover$/.test(path); // v4: the voyage lives on Discover
// fetch the voyage's 3D code straight away too (it is otherwise requested only once the page has built)
if (needsLab) import('./lab/LabScene').catch(() => {});
window.__labWarm = new Promise((r) => (window.__labWarmDone = r));
const t0 = performance.now();
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
ld.set(80);
const fonts = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
window.__labWarm.then(() => (window.__labWarmReady = true));
if (!needsLab) window.__labWarmDone();
// the count finishes as soon as the fonts are in; the voyage then warms up while the word is on screen
fonts.then(() => {
  ld.set(92);
  ld.done();
});
