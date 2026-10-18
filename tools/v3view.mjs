import puppeteer from 'puppeteer-core';
// Viewport (not full-page) captures of v3 at a few scroll positions, so the fixed animated sky shows as it really does.
const base = process.env.BASE || 'http://127.0.0.1:5190';
const route = process.argv[2] || '/';
const ys = (process.argv[3] || '0').split(',');
const mode = process.argv[4] || 'desktop';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await page.goto(base + route, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2500));
let i = 0;
for (const raw of ys) {
  const y = isNaN(raw) ? await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY - 80, raw) : Number(raw);
  const cur = await page.evaluate(() => scrollY);
  for (let k = 1; k <= 10; k++) {
    await page.evaluate((v) => window.scrollTo(0, v), cur + ((y - cur) * k) / 10);
    await new Promise((r) => setTimeout(r, 50));
  }
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: `shots/v3view-${i++}.png` });
}
await browser.close();
console.log('ok');
