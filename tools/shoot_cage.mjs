import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('shots', 'transition-test');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:5180/', { waitUntil: 'domcontentloaded' });

for (let i = 0; i < 50; i++) {
  if (!(await page.evaluate(() => !!document.querySelector('.sl-preloader')))) break;
  await sleep(200);
}
await sleep(1500);
const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

for (const frac of [0.66, 0.68, 0.70, 0.72]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * frac));
  await sleep(1400);
  await page.screenshot({ path: path.join(out, `cage-${Math.round(frac * 100)}.png`) });
}
await browser.close();
console.log('Cage shots saved.');
