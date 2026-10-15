import puppeteer from 'puppeteer-core';

const mode = process.argv[2] || 'desktop';
const base = process.env.BASE || 'http://127.0.0.1:5180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'],
});
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
page.setDefaultTimeout(180000);
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true });
  await page.emulateCPUThrottling(Number(process.env.THROTTLE || 4));
} else {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: Number(process.env.DPR || 1.25) });
  if (process.env.THROTTLE) await page.emulateCPUThrottling(Number(process.env.THROTTLE));
}
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 160; i++) {
  if (!(await page.evaluate(() => !!document.querySelector('.sl-pre')))) break;
  await sleep(250);
}
await sleep(2500);

await page.evaluate(() => {
  window.__lt = [];
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([Math.round(e.startTime), Math.round(e.duration), Math.round(scrollY)]))).observe({ type: 'longtask', buffered: false }); } catch (e) {}
  window.__loaf = [];
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (e.duration > 150) window.__loaf.push({ at: Math.round(e.startTime), dur: Math.round(e.duration), block: Math.round(e.blockingDuration), render: Math.round(e.startTime + e.duration - e.renderStart), style: Math.round(e.startTime + e.duration - e.styleAndLayoutStart), scripts: e.scripts.map((x) => `${x.invoker || x.sourceFunctionName}:${Math.round(x.duration)}`).slice(0, 4), y: Math.round(scrollY) }); })).observe({ type: 'long-animation-frame', buffered: false }); } catch (e) {}
  window.__ft = [];
  let last = performance.now();
  const loop = (t) => {
    window.__ft.push(t - last);
    last = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});

const stats = async (label) => {
  const ft = await page.evaluate(() => {
    const a = window.__ft.slice(3);
    window.__ft = [];
    return a;
  });
  if (!ft.length) return console.log(label, 'no frames');
  const s = [...ft].sort((a, b) => a - b);
  const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
  const p95 = s[Math.floor(s.length * 0.95)];
  const p99 = s[Math.floor(s.length * 0.99)];
  const slow = ft.filter((v) => v > 33.4).length;
  console.log(`${label.padEnd(26)} frames ${String(ft.length).padStart(4)}  avg ${avg.toFixed(1)}ms (${(1000 / avg).toFixed(0)}fps)  p95 ${p95.toFixed(1)}  p99 ${p99.toFixed(1)}  max ${s[s.length - 1].toFixed(0)}  >33ms: ${slow}`);
};

const scrollRun = async (label, y0, y1, secs) => {
  await page.evaluate((y) => window.scrollTo(0, y), y0);
  await sleep(1200);
  await page.evaluate(() => (window.__ft = []));
  const t0 = Date.now();
  while (Date.now() - t0 < secs * 1000) {
    const k = (Date.now() - t0) / (secs * 1000);
    await page.evaluate((y) => window.scrollTo(0, y), y0 + (y1 - y0) * k);
    await sleep(16);
  }
  await stats(label);
};

const geo = await page.evaluate(() => {
  const l = document.querySelector('#lab');
  const r = document.querySelector('#reel');
  return { labTop: l.getBoundingClientRect().top + scrollY, labH: l.offsetHeight, reelTop: r.getBoundingClientRect().top + scrollY, vh: innerHeight, h: document.documentElement.scrollHeight };
});
for (const pass of [1, 2]) {
  console.log('--- pass', pass);
await stats('idle (hero)');
  await sleep(3000);
  await stats('idle 3s');
  await scrollRun('hero -> reel', 0, geo.reelTop, 4);
  await scrollRun('reel -> lab', geo.reelTop, geo.labTop - geo.vh, 6);
  const L = (p) => geo.labTop + p * (geo.labH - geo.vh);
  await scrollRun('lab intro -> tunnel', L(0), L(0.6), 6);
  await scrollRun('lab cage -> vortex', L(0.6), L(0.8), 6);
  await scrollRun('lab room -> end', L(0.8), L(1), 6);
  await scrollRun('after lab', geo.labTop + geo.labH, geo.h - geo.vh, 6);
  
}
const lt = await page.evaluate(() => window.__lt);
console.log('long tasks:', lt.filter((e) => e[1] > 120).length);
const loaf = await page.evaluate(() => window.__loaf);
console.log('LoAF >150ms:', loaf.length);
loaf.slice(0, 14).forEach((e) => console.log(JSON.stringify(e)));
await browser.close();
