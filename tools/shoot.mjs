import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2] || 'http://127.0.0.1:5180/';
const mode = process.argv[3] || 'desktop';
const out = path.resolve('shots', mode);
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text().slice(0, 200)); });
page.on('requestfailed', (r) => problems.push('failed: ' + r.url().slice(0, 100)));

if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
}

await page.goto(url, { waitUntil: 'domcontentloaded' });
await sleep(1300);
await page.screenshot({ path: path.join(out, '00-preloader-a.png') });
await sleep(1500);
await page.screenshot({ path: path.join(out, '01-preloader-b.png') });
for (let i = 0; i < 100; i++) {
  if (!(await page.evaluate(() => !!document.querySelector('.sl-preloader')))) break;
  await sleep(250);
}
await sleep(2200);
await page.screenshot({ path: path.join(out, '02-hero.png') });

const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
console.log('page height', total, 'problems so far', JSON.stringify(problems.slice(0, 4)));
const stops = (process.argv[4] || '0.1,0.17,0.25,0.4,0.55,0.65,0.78,0.9,1').split(',').map(Number);
let n = 3;
for (const f of stops) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * f));
  await sleep(1700);
  await page.screenshot({ path: path.join(out, `${String(n++).padStart(2, '0')}-scroll-${Math.round(f * 100)}.png`) });
}
console.log('problems', JSON.stringify([...new Set(problems)].slice(0, 8)));
await browser.close();
