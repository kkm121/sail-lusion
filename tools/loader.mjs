import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
const url = process.argv[3] || 'http://127.0.0.1:5180/';
const ms = Number(process.argv[4] || 9000);
const gap = Number(process.argv[5] || 80);
const mode = process.argv[6] || 'desktop';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (t) => new Promise((r) => setTimeout(r, t));
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
}
await page.goto(url, { waitUntil: 'domcontentloaded' });
let n = 0;
const t0 = Date.now();
while (Date.now() - t0 < ms) {
  await page.screenshot({ path: path.join(out, `f${String(n++).padStart(3, '0')}.png`) });
  await sleep(gap);
}
console.log('frames', n);
await browser.close();
