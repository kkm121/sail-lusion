import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

// Loads one of our routes (loader included), then scrolls through it in steps and saves a frame each time.
// usage: node tools/page.mjs /about about 700 30 desktop
const route = process.argv[2] || '/about';
const name = process.argv[3] || 'about';
const step = Number(process.argv[4] || 700);
const count = Number(process.argv[5] || 24);
const mode = process.argv[6] || 'desktop';
const wait = Number(process.argv[7] || 1300);
const start = Number(process.env.START || 0);
const base = process.env.BASE || 'http://127.0.0.1:5180';
const out = path.resolve('shots', `page-${name}-${mode}`);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PPDIR || 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
page.setDefaultTimeout(180000);
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 900 });
}
const problems = [];
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message.slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') problems.push('error: ' + m.text().slice(0, 200)); });
await page.goto(base + route, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('main.sail', { timeout: 120000 });
for (let i = 0; i < 300; i++) {
  const st = await page.evaluate(() => ({ pre: !!document.querySelector('.sl-preloader'), ov: document.documentElement.style.overflow }));
  if (!st.pre && st.ov !== 'hidden') break;
  await sleep(250);
}
await sleep(2200);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('page height', total);
for (let i = 0; i < count; i++) {
  const y = start + i * step;
  if (y > total) break;
  const cur = await page.evaluate(() => scrollY);
  for (let k = 1; k <= 6; k++) {
    await page.evaluate((v) => window.scrollTo(0, v), cur + ((y - cur) * k) / 6);
    await sleep(30);
  }
  await sleep(wait);
  await page.screenshot({ path: path.join(out, `f${String(i).padStart(3, '0')}.png`) });
}
console.log('problems', JSON.stringify([...new Set(problems)].slice(0, 6)));
await browser.close();
