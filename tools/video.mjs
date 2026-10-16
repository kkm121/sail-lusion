import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

// Records the first load and a slow scroll through the home page as a video (CDP screencast frames),
// while the page logs every animation frame and every long animation frame with the scripts behind it.
// usage: BASE=http://127.0.0.1:4173 node tools/video.mjs desktop|mobile [scrollSeconds]
const mode = process.argv[2] || 'desktop';
const secs = Number(process.argv[3] || 40);
const base = process.env.BASE || 'http://127.0.0.1:4173';
const out = path.resolve('shots', `video-${mode}`);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
const page = await browser.newPage();
page.setDefaultTimeout(180000);
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await page.evaluateOnNewDocument(() => {
  window.__f = [];
  window.__loaf = [];
  const loop = (t) => {
    const f = document.querySelector('.sl-preloader .fill');
    const m = f && /scaleX\(([\d.]+)\)/.exec(f.style.transform || '');
    window.__f.push([Math.round(t), m ? +(+m[1] * 100).toFixed(1) : -1, Math.round(scrollY)]);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => {
      if (e.duration < 80) return;
      window.__loaf.push({ at: Math.round(e.startTime), dur: Math.round(e.duration), style: Math.round(e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0), scripts: e.scripts.map((x) => `${(x.sourceFunctionName || x.invoker || '?').slice(0, 40)}@${(x.sourceURL || '').split('/').pop().split('?')[0].slice(0, 30)}#${x.sourceCharPosition}:${Math.round(x.duration)}`).slice(0, 4) });
    })).observe({ type: 'long-animation-frame', buffered: true });
  } catch (e) {}
});

const cdp = await page.createCDPSession();
let n = 0;
const times = [];
cdp.on('Page.screencastFrame', async (e) => {
  if (n % 3 === 0) fs.writeFileSync(path.join(out, `f${String(n / 3).padStart(4, '0')}.jpg`), Buffer.from(e.data, 'base64'));
  times.push(e.metadata.timestamp);
  n++;
  try { await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }); } catch (err) { /* closed */ }
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 55, everyNthFrame: 1, maxWidth: 720, maxHeight: 720 });
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.querySelector('.sl-preloader'), { timeout: 180000 });
const loadEnd = await page.evaluate(() => performance.now());
await sleep(1500);
const h = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const t0 = Date.now();
while (Date.now() - t0 < secs * 1000) {
  const k = (Date.now() - t0) / (secs * 1000);
  await page.evaluate((y) => window.scrollTo(0, y), h * k);
  await sleep(33);
}
await sleep(800);
await cdp.send('Page.stopScreencast');
const f = await page.evaluate(() => window.__f);
const loaf = await page.evaluate(() => window.__loaf);

const gaps = (arr) => {
  let max = 0;
  let bad = 0;
  for (let i = 1; i < arr.length; i++) {
    const g = arr[i][0] - arr[i - 1][0];
    max = Math.max(max, g);
    if (g > 50) bad++;
  }
  return { frames: arr.length, max, over50: bad };
};
const load = f.filter((x) => x[0] <= loadEnd);
const scroll = f.filter((x) => x[0] > loadEnd + 1500);
console.log(`${mode} load (0-${(loadEnd / 1000).toFixed(1)}s):`, JSON.stringify(gaps(load)));
console.log(`${mode} scroll:`, JSON.stringify(gaps(scroll)));
console.log('first painted loader frame at', ((load.find((x) => x[1] >= 0) || [0])[0] / 1000).toFixed(2), 's');
console.log('loader stalls (gap ms @ time, bar %):', load.map((x, i) => (i ? [x[0] - load[i - 1][0], x[0], load[i - 1][1]] : null)).filter((x) => x && x[0] > 120).map((x) => x[0] + 'ms@' + (x[1] / 1000).toFixed(1) + 's bar' + x[2]).join(' | '));
console.log('long frames >80ms:');
loaf.forEach((l) => console.log(`  ${(l.at / 1000).toFixed(2)}s ${l.dur}ms ${l.at <= loadEnd ? '[loader]' : '[scroll]'} ${l.scripts.join(' | ')}`));
console.log('screencast frames', n, 'saved', Math.ceil(n / 3));
await browser.close();
