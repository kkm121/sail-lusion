import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const mode = process.argv[2] || 'desktop';
const from = Number(process.argv[3] || 0.5);
const to = Number(process.argv[4] || 0.8);
const pxPerSec = Number(process.argv[5] || 3000);
const out = path.resolve('shots', `fast-${mode}`);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
}
await page.goto('http://127.0.0.1:5180/', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 160; i++) {
  if (!(await page.evaluate(() => !!document.querySelector('.sl-pre')))) break;
  await sleep(250);
}
await sleep(1500);
const geo = await page.evaluate(() => {
  const l = document.querySelector('#lab');
  return { top: l.getBoundingClientRect().top + scrollY, h: l.offsetHeight, vh: innerHeight };
});
const y0 = geo.top + from * (geo.h - geo.vh);
const y1 = geo.top + to * (geo.h - geo.vh);
await page.evaluate((y) => window.scrollTo(0, y), y0);
await sleep(3500);
await page.mouse.move(geo.vh * 0.9, geo.vh * 0.5);

let shot = 0;
const t0 = Date.now();
let y = y0;
let lastShot = 0;
while (y < y1) {
  const now = Date.now();
  const dt = Math.min(now - (globalThis.__t || now), 50);
  globalThis.__t = now;
  y = Math.min(y1, y + (pxPerSec * (dt || 16)) / 1000);
  await page.evaluate((v) => window.scrollTo(0, v), y);
  if (now - lastShot > 260) {
    lastShot = now;
    await page.screenshot({ path: path.join(out, `f${String(shot++).padStart(3, '0')}.png`) });
  }
  await sleep(14);
}
console.log('frames', shot, 'secs', ((Date.now() - t0) / 1000).toFixed(1));
await browser.close();
