import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
// Full-page captures of every v3 route (served on 4190), desktop or mobile, plus console errors.
const base = process.env.BASE || 'http://127.0.0.1:4190';
const mode = process.argv[2] || 'desktop';
const routes = (process.argv[3] || '/,/about,/domains,/events,/projects,/projects/vision-core,/team,/partners,/join,/nope').split(',');
const out = `shots/v3-${mode}`;
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultTimeout(60000);
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 160)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let i = 0;
for (const r of routes) {
  await page.goto(base + r, { waitUntil: 'networkidle2' });
  await sleep(1400);
  // scroll through once so every reveal fires, then back to top
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(60);
  }
  await sleep(1300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  await page.screenshot({ path: `${out}/f${String(i).padStart(3, '0')}.png`, fullPage: true });
  console.log(i++, r, 'height', h);
}
console.log('errors', JSON.stringify([...new Set(errors)]));
await browser.close();
