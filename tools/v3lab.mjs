import puppeteer from 'puppeteer-core';
// Captures v3p2's voyage (v2's Lab) at given progress points: BASE=... node tools/v3lab.mjs [desktop|mobile] p1,p2,... [prefix]
const base = process.env.BASE || 'http://127.0.0.1:4190';
const mode = process.argv[2] || 'desktop';
const ps = (process.argv[3] || '0.02,0.2,0.4,0.5,0.6,0.66,0.72,0.8,0.87,0.93,0.985').split(',').map(Number);
const prefix = process.argv[4] || 'lab';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
page.on('console', (m) => ['error', 'warn'].includes(m.type()) && errors.push(m.type() + ': ' + m.text().slice(0, 160)));
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
await page.goto(base + (process.env.ROUTE || '/'), { waitUntil: 'networkidle2' });
if (process.env.V2) await new Promise((r) => setTimeout(r, 11000));
else await page.waitForFunction('window.__ffReady === true', { timeout: 30000 });
const info = await page.evaluate(() => {
  const s = document.getElementById('lab');
  const r = s.getBoundingClientRect();
  return { top: r.top + scrollY, h: s.offsetHeight, vh: innerHeight };
});
console.log('voyage height', (info.h / info.vh).toFixed(1), 'screens');
// let it mount and warm up
await page.evaluate((v) => scrollTo(0, v), info.top);
await page.waitForFunction(() => !!document.querySelector('.sl-lab-canvas canvas'), { timeout: 20000 }).catch(() => console.log('no canvas'));
await new Promise((r) => setTimeout(r, 6000));
let i = 0;
for (const p of ps) {
  const y = info.top + p * (info.h - info.vh);
  await page.evaluate((v) => { window.__lenis ? window.__lenis.scrollTo(v, { immediate: true, force: true }) : scrollTo(0, v); }, y);
  await new Promise((r) => setTimeout(r, 1600));
  await page.screenshot({ path: `shots/${prefix}-${i++}.png` });
}
const mem = await page.evaluate(() => Math.round(performance.memory.usedJSHeapSize / 1048576));
console.log('heap', mem, 'MB; errors', JSON.stringify(errors.slice(0, 12), null, 1));
await browser.close();
