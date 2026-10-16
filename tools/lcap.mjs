import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
const [out, start, step, count] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4]), Number(process.argv[5])];
fs.mkdirSync(out, { recursive: true });
const sleep = (t) => new Promise((r) => setTimeout(r, t));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PPDIR || 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('https://lusion.co/', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 40; i++) { await sleep(1500); if (/is-ready/.test(await page.evaluate(() => document.documentElement.className))) break; }
await sleep(3000);
await page.mouse.move(720, 450);
for (let d = 0; d < start; d += 200) { await page.mouse.wheel({ deltaY: 200 }); await sleep(12); }
await sleep(1500);
for (let i = 0; i < count; i++) {
  for (let m = 0; m < step; m += 100) { await page.mouse.wheel({ deltaY: 100 }); await sleep(14); }
  await sleep(650);
  await page.screenshot({ path: path.join(out, `f${String(i).padStart(3, '0')}.png`) });
}
await browser.close();
