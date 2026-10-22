import puppeteer from 'puppeteer-core';
// Viewport captures of the FireFly Store (preview on 4200): node tools/storeview.mjs /route 0,1200,sel:.stats [desktop|mobile] [prefix]
// Positions are scroll offsets in px, or "sel:<css>" to scroll an element to the top.
const base = process.env.BASE || 'http://127.0.0.1:4200';
const route = process.argv[2] || '/';
const ys = (process.argv[3] || '0').split(',');
const mode = process.argv[4] || 'desktop';
const prefix = process.argv[5] || 'store';
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
await new Promise((r) => setTimeout(r, 3500));
let i = 0;
for (const raw of ys) {
  const y = raw.startsWith('sel:') ? await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY - 60, raw.slice(4)) : Number(raw);
  const cur = await page.evaluate(() => scrollY);
  for (let k = 1; k <= 8; k++) {
    await page.evaluate((v) => window.scrollTo(0, v), cur + ((y - cur) * k) / 8);
    await new Promise((r) => setTimeout(r, 40));
  }
  await new Promise((r) => setTimeout(r, 1400));
  await page.screenshot({ path: `shots/${prefix}-${i++}.png` });
}
await browser.close();
console.log('errors', errors);
