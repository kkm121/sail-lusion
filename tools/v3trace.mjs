import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
// Timeline trace of the voyage on a phone (CPU 4x slower) while swiping from START to END of the voyage;
// prints where the page's main thread spends its time, by kind of work. node tools/v3trace.mjs [start] [end]
const base = process.env.BASE || 'http://127.0.0.1:4190';
const a = Number(process.argv[2] || 0), b = Number(process.argv[3] || 0.3);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
const cdp = await page.createCDPSession();
const info = await page.evaluate(() => { const s = document.getElementById('lab'); return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight, vh: innerHeight }; });
await page.evaluate((y) => scrollTo(0, y), Math.max(0, info.top + a * (info.h - info.vh) - 200));
await new Promise((r) => setTimeout(r, 3000));
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const file = 'shots/_trace.json';
await page.tracing.start({ path: file, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'v8', 'gpu'] });
const end = info.top + b * (info.h - info.vh);
for (let i = 0; i < 60; i++) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
  for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - k * 50 }] }); await new Promise((r) => setTimeout(r, 16)); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await new Promise((r) => setTimeout(r, 350));
  if ((await page.evaluate(() => scrollY)) > end) break;
}
await page.tracing.stop();
await browser.close();
const ev = JSON.parse(fs.readFileSync(file, 'utf8')).traceEvents;
// the renderer's main thread
const names = ev.filter((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain');
const tids = new Set(names.map((e) => e.pid + ':' + e.tid));
const sum = new Map();
let span = [Infinity, 0];
for (const e of ev) {
  if (e.ph !== 'X' || !tids.has(e.pid + ':' + e.tid) || !e.dur) continue;
  span = [Math.min(span[0], e.ts), Math.max(span[1], e.ts + e.dur)];
  if (!['FunctionCall', 'UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'Commit', 'UpdateLayer', 'CompositeLayers', 'RecalculateStyles', 'ParseHTML', 'MajorGC', 'MinorGC', 'V8.GC_SCAVENGER', 'FireAnimationFrame', 'HitTest', 'IntersectionObserverController::computeIntersections', 'ScheduleStyleRecalculation', 'PaintImage', 'Decode Image', 'EventDispatch', 'GPUTask', 'UpdateLayerTree', 'RasterTask', 'BeginMainThreadFrame', 'ProxyMain::BeginMainFrame', 'LocalFrameView::RunPostLifecycleSteps'].includes(e.name)) continue;
  sum.set(e.name, (sum.get(e.name) || 0) + e.dur);
}
const total = (span[1] - span[0]) / 1000;
console.log(`voyage ${a}-${b}, ${total.toFixed(0)} ms traced on the main thread`);
[...sum.entries()].sort((x, y) => y[1] - x[1]).slice(0, 14).forEach(([k, v]) => console.log(`${((v / 1000 / total) * 100).toFixed(1).padStart(5)}%  ${(v / 1000).toFixed(0).padStart(6)} ms  ${k}`));
const fc = new Map();
for (const e of ev) {
  if (e.ph !== 'X' || !tids.has(e.pid + ':' + e.tid) || !e.dur) continue;
  if (e.name !== 'FunctionCall' && e.name !== 'EventDispatch' && e.name !== 'TimerFire') continue;
  const d = e.args?.data || {};
  const k = e.name + ' ' + (d.type || '') + ' ' + (d.functionName || '') + ' ' + String(d.url || '').split('/').pop() + ':' + (d.lineNumber ?? '');
  fc.set(k, (fc.get(k) || 0) + e.dur);
}
console.log('-- calls');
[...fc.entries()].sort((x, y) => y[1] - x[1]).slice(0, 10).forEach(([k, v]) => console.log(`${(v / 1000).toFixed(0).padStart(6)} ms  ${k}`));
fs.unlinkSync(file);
