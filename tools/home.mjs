import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
const start = Number(process.argv[3] || 0);
const step = Number(process.argv[4] || 300);
const count = Number(process.argv[5] || 24);
const mode = process.argv[6] || 'desktop';
const url = process.argv[7] || 'http://127.0.0.1:5180/';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PPDIR || 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
page.setDefaultTimeout(180000);
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
}
await page.goto(url, { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 160; i++) {
  if (!(await page.evaluate(() => !!document.querySelector('.sl-pre')))) break;
  await sleep(250);
}
await sleep(2500);
if (mode === 'desktop') await page.mouse.move(700, 460);
await page.screenshot({ path: path.join(out, 'f000.png') });
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
console.log('page height', total);
for (let i = 1; i <= count; i++) {
  const y = Math.min(total, start + (i - 1) * step);
  if (mode === 'desktop') {
    for (let k = 1; k <= 6; k++) {
      await page.evaluate((v) => window.scrollTo(0, v), Math.round((await page.evaluate(() => scrollY)) + (y - (await page.evaluate(() => scrollY))) * (k / 6)));
      await sleep(30);
    }
  } else {
    await page.evaluate((v) => window.scrollTo(0, v), y);
  }
  await sleep(900);
  await page.screenshot({ path: path.join(out, `f${String(i).padStart(3, '0')}.png`) });
}
console.log('errs', JSON.stringify([...new Set(errs)].slice(0, 5)));
await browser.close();
