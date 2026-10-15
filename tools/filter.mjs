import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

// Opens /projects, scrolls to the filter bar, picks the Nth domain filter and saves frames of the result.
// usage: node tools/filter.mjs 2 desktop
const nth = Number(process.argv[2] || 2);
const mode = process.argv[3] || 'desktop';
const base = process.env.BASE || 'http://127.0.0.1:5180';
const out = path.resolve('shots', `filter-${mode}`);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
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
await page.goto(base + '/projects', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.sl-filter', { timeout: 120000 });
for (let i = 0; i < 300; i++) {
  const st = await page.evaluate(() => ({ pre: !!document.querySelector('.sl-preloader'), ov: document.documentElement.style.overflow }));
  if (!st.pre && st.ov !== 'hidden') break;
  await sleep(250);
}
await sleep(2200);
const top = await page.evaluate(() => document.querySelector('.sl-filter').getBoundingClientRect().top + scrollY);
await page.evaluate((y) => window.scrollTo(0, y - 140), top);
await sleep(1800);
await page.screenshot({ path: path.join(out, 'f000.png') });
const btn = await page.$(`.sl-filter button:nth-of-type(${nth + 1})`);
await btn.click();
await sleep(350);
await page.screenshot({ path: path.join(out, 'f001.png') });
await sleep(1800);
await page.screenshot({ path: path.join(out, 'f002.png') });
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(1800);
await page.screenshot({ path: path.join(out, 'f003.png') });
console.log('problems', JSON.stringify([...new Set(problems)].slice(0, 6)));
await browser.close();
