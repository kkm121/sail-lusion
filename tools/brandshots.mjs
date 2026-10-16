import puppeteer from 'puppeteer-core';
// Screenshots of the places the logo appears: loader mark, header, footer, join section, About hero.
const base = process.env.BASE || 'http://127.0.0.1:5180';
const mode = process.argv[2] || 'desktop';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-' + process.pid, args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultTimeout(180000);
if (mode === 'mobile') await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
else await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.sl-preloader.is-mark', { timeout: 120000 });
await sleep(900);
await page.screenshot({ path: `shots/brand-loader-${mode}.png` });
await page.waitForFunction(() => !document.querySelector('.sl-preloader'));
await sleep(1500);
await page.screenshot({ path: `shots/brand-home-${mode}.png` });
for (const [sel, name] of [['.sl-end', 'end'], ['.sl-footer', 'footer']]) {
  await page.evaluate((s) => window.scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY - 40), sel);
  await sleep(1800);
  await page.screenshot({ path: `shots/brand-${name}-${mode}.png` });
}
await page.goto(base + '/about', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.querySelector('.sl-preloader'));
await sleep(3500);
await page.screenshot({ path: `shots/brand-about-${mode}.png` });
await browser.close();
console.log('ok');
