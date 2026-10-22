import puppeteer from 'puppeteer-core';
// Scrolls the whole v3p2 home page and reports frame times, JS heap and live canvases/WebGL contexts.
// BASE=http://127.0.0.1:4190 node tools/v3p2perf.mjs [desktop|mobile] [route]
const base = process.env.BASE || 'http://127.0.0.1:4190';
const mode = process.argv[2] || 'desktop';
const route = process.argv[3] || '/';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 200)));
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
await page.goto(base + route, { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500));
const snap = () => page.evaluate(() => ({ heap: Math.round(performance.memory.usedJSHeapSize / 1048576), canvases: document.querySelectorAll('canvas').length, h: document.documentElement.scrollHeight, vh: innerHeight }));
const s0 = await snap();
await page.evaluate(() => {
  window.__ft = [];
  let last = performance.now();
  const tick = (n) => { window.__ft.push(n - last); last = n; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
const peak = { heap: 0, canvases: 0 };
for (let y = 0; y < s0.h - s0.vh; y += 260) {
  await page.evaluate((v) => scrollTo(0, v), y);
  await new Promise((r) => setTimeout(r, 90));
  const s = await snap();
  peak.heap = Math.max(peak.heap, s.heap);
  peak.canvases = Math.max(peak.canvases, s.canvases);
}
await new Promise((r) => setTimeout(r, 800));
const s1 = await snap();
const ft = (await page.evaluate(() => window.__ft)).slice(5).sort((a, b) => a - b);
const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
console.log(`${mode} ${route}: page ${(s0.h / s0.vh).toFixed(1)} screens | avg ${(1000 / avg).toFixed(0)} fps, p95 ${ft[Math.floor(ft.length * 0.95)].toFixed(0)} ms, worst ${ft[ft.length - 1].toFixed(0)} ms, >50ms ${ft.filter((x) => x > 50).length}/${ft.length}`);
console.log(`heap start ${s0.heap} MB, peak ${peak.heap} MB, end ${s1.heap} MB | canvases start ${s0.canvases}, peak ${peak.canvases}, end ${s1.canvases}`);
console.log('errors', errors);
await browser.close();
