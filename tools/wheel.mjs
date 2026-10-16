import puppeteer from 'puppeteer-core';

const base = process.env.BASE || 'http://127.0.0.1:5180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 160; i++) {
  if (!(await page.evaluate(() => !!document.querySelector('.sl-pre')))) break;
  await sleep(250);
}
await sleep(2500);
await page.mouse.move(720, 450);
const rows = [];
let last = -1;
for (let i = 0; i < 70; i++) {
  await page.mouse.wheel({ deltaY: 120 });
  await sleep(420);
  const y = await page.evaluate(() => Math.round(scrollY));
  const info = await page.evaluate(() => {
    const r = document.querySelector('.sl-reel-track')?.getBoundingClientRect();
    return r ? Math.round(r.top) : null;
  });
  rows.push(`${String(i).padStart(2)} scrollY ${String(y).padStart(5)}  Δ ${String(y - last).padStart(4)}  reelTrackTop ${info}`);
  last = y;
}
console.log(rows.join('\n'));
await browser.close();
