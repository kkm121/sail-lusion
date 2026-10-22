import puppeteer from 'puppeteer-core';
// Generic viewport capture: BASE=http://127.0.0.1:4300 node tools/sitev.mjs /route 0,sel:.demo,1800 [desktop|mobile] [prefix] [waitMs]
// Positions are scroll offsets in px, or "sel:<css>" to bring an element to the top. Prints console errors.
const base = process.env.BASE;
if (!base) throw new Error('Set BASE, e.g. BASE=http://127.0.0.1:4300');
const route = process.argv[2] || '/';
const ys = (process.argv[3] || '0').split(',');
const mode = process.argv[4] || 'desktop';
const prefix = process.argv[5] || 'site';
const wait = Number(process.argv[6] || 3500);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 200)));
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
await page.goto(base + route, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, wait));
let i = 0;
for (const raw of ys) {
  const y = raw.startsWith('sel:') ? await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY - 90, raw.slice(4)) : Number(raw);
  const cur = await page.evaluate(() => scrollY);
  for (let k = 1; k <= 8; k++) {
    await page.evaluate((v) => window.scrollTo(0, v), cur + ((y - cur) * k) / 8);
    await new Promise((r) => setTimeout(r, 40));
  }
  await new Promise((r) => setTimeout(r, 1500));
  // a page may hold the scroll for a moment (v2's voyage pauses for its goodbye): if so, go again
  if (Math.abs((await page.evaluate(() => scrollY)) - y) > 4) {
    await page.evaluate((v) => (window.__lenis ? (window.__lenis.resize(), window.__lenis.scrollTo(v, { immediate: true, force: true })) : window.scrollTo(0, v)), y);
    await new Promise((r) => setTimeout(r, 1500));
  }
  await page.screenshot({ path: `shots/${prefix}-${i++}.png` });
}
await browser.close();
console.log('errors', errors);
