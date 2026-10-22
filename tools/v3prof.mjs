import puppeteer from 'puppeteer-core';
// CPU profile of the voyage on a phone (CPU 4x slower): swipes from 30% to 95% of the voyage, prints the top functions by self time.
const base = process.env.BASE || 'http://127.0.0.1:4190';
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
await page.evaluate((y) => scrollTo(0, y), info.top + 0.3 * (info.h - info.vh));
await new Promise((r) => setTimeout(r, 3000));
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await cdp.send('Profiler.start');
const end = info.top + 0.95 * (info.h - info.vh);
for (let i = 0; i < 80; i++) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
  for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - k * 50 }] }); await new Promise((r) => setTimeout(r, 16)); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await new Promise((r) => setTimeout(r, 350));
  if ((await page.evaluate(() => scrollY)) > end) break;
}
const { profile } = await cdp.send('Profiler.stop');
await browser.close();
const self = new Map();
const total = profile.samples.length;
const counts = new Map();
profile.samples.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
for (const n of profile.nodes) {
  const c = counts.get(n.id) || 0;
  if (!c) continue;
  const f = n.callFrame;
  const file = (f.url || '').split('/').pop().replace(/-[A-Za-z0-9_]{6,}\.js$/, '.js');
  const key = `${f.functionName || '(anon)'}  [${file || f.url || 'native'}:${f.lineNumber}]`;
  self.set(key, (self.get(key) || 0) + c);
}
const rows = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22);
console.log('samples', total);
rows.forEach(([k, v]) => console.log(((v / total) * 100).toFixed(1).padStart(5) + '%  ' + k));
