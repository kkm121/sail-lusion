import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const stops = (process.argv[2] || '0,0.1,0.2,0.28,0.36,0.46,0.55,0.62,0.68').split(',').map(Number);
const mode = process.argv[3] || 'desktop';
const out = process.argv[4] || path.resolve('shots', `lab-${mode}`);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PPDIR || 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
page.setDefaultTimeout(180000);
const problems = [];
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
page.on('console', (m) => { if (['error'].includes(m.type())) problems.push(m.type() + ': ' + m.text().slice(0, 200)); });

if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: Number(process.env.DPR || 1) });
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
console.log('lab geo', JSON.stringify(geo));
await page.evaluate((y) => window.scrollTo(0, y), geo.top - geo.vh * 1.4);
await sleep(1200);
let i = 0;
for (const p of stops) {
  const target = geo.top + p * (geo.h - geo.vh);
  const cur = await page.evaluate(() => scrollY);
  for (let k = 1; k <= 8; k++) {
    await page.evaluate((y) => window.scrollTo(0, y), cur + ((target - cur) * k) / 8);
    await sleep(40);
  }
  await sleep(2300);
  await page.screenshot({ path: path.join(out, `f${String(i++).padStart(3, '0')}.png`) });
}
console.log('problems', JSON.stringify([...new Set(problems)].slice(0, 10)));
await browser.close();

