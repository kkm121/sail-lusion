import puppeteer from 'puppeteer-core';
// Header states on v3: scroll down past the hero, then scroll up a little so the paper bar shows.
const base = process.env.BASE || 'http://127.0.0.1:5190';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(base + (process.argv[2] || '/'), { waitUntil: 'networkidle2' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(1500);
for (let y = 0; y <= 3200; y += 160) { await page.evaluate((v) => scrollTo(0, v), y); await sleep(40); }
await sleep(600);
for (let y = 3200; y >= 2900; y -= 30) { await page.evaluate((v) => scrollTo(0, v), y); await sleep(40); }
await sleep(900);
const sy = await page.evaluate(() => scrollY);
await page.screenshot({ path: 'shots/v3hdr.png', clip: { x: 0, y: sy, width: 1440, height: 420 } });
await browser.close();
console.log('ok');
