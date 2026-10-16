import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('shots', 'navpose');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const specs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PPDIR || 'C:/Users/muthu/AppData/Local/Temp/pp-' + process.pid, args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
await page.setViewport({ width: 520, height: 560 });
let i = 0;
for (const q of specs) {
  await page.goto('http://127.0.0.1:5180/__nav?' + q, { waitUntil: 'domcontentloaded' });
  for (let k = 0; k < 60; k++) {
    if (await page.evaluate(() => window.__navReady)) break;
    await sleep(200);
  }
  await sleep(500);
  await page.screenshot({ path: path.join(out, `f${String(i++).padStart(3, '0')}.png`) });
}
await browser.close();
console.log('done', i);
