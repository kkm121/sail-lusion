import puppeteer from 'puppeteer-core';
// Scrolls the featured tiles into view in small steps and prints each tile's transform, then scrolls back up.
const base = process.env.BASE || 'http://127.0.0.1:5180';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PPDIR || 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run'] });
const page = await browser.newPage();
page.setDefaultTimeout(180000);
await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.querySelector('.sl-preloader'), { timeout: 180000 });
await new Promise((r) => setTimeout(r, 1500));
console.log(await page.evaluate(() => [document.querySelectorAll('.sl-grid-row > .sl-project').length, matchMedia('(prefers-reduced-motion: reduce)').matches, document.querySelectorAll('.sl-grid-row').length]));
const top = await page.evaluate(() => document.querySelector('.sl-grid-row').getBoundingClientRect().top + scrollY);
const read = () => page.evaluate(() => [...document.querySelectorAll('.sl-grid-row')[0].children].map((t) => `${t.style.transform.replace(/translate3d\(|\)|vw|vh|deg|scale\(|rotate\(/g, '').slice(0, 44)} o${t.style.opacity}`).join('  |  '));
for (const k of [1.1, 0.95, 0.8, 0.6, 0.4, 0.8, 1.1]) {
  await page.evaluate((y) => window.scrollTo(0, y), top - 900 * k);
  await new Promise((r) => setTimeout(r, 900));
  console.log(`row top at ${k}vh:`, await read());
}
await browser.close();
