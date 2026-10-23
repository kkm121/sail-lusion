import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
// First visit (fresh profile: no HTTP cache, no GPU shader cache) vs repeat visit. Reports when the voyage finished
// warming relative to the opening screen, and frame times for the first 6 s after it opens, scrolling into the voyage.
const base = process.env.BASE || 'https://rp-club-ivory.vercel.app';
const dir = 'C:/Users/muthu/AppData/Local/Temp/pp-cold';
fs.rmSync(dir, { recursive: true, force: true });
const run = async (label) => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: dir, args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    window.__t = {}; const t0 = performance.now();
    addEventListener('ff:ready', () => (window.__t.open = Math.round(performance.now() - t0)));
    const iv = setInterval(() => { if (window.__labWarmReady && !window.__t.warm) { window.__t.warm = Math.round(performance.now() - t0); clearInterval(iv); } }, 20);
  });
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('window.__ffReady === true', { timeout: 60000 });
  await page.evaluate(() => { window.__ft = []; let l = performance.now(); const f = (n) => { window.__ft.push(n - l); l = n; requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await page.mouse.move(700, 450);
  for (let i = 0; i < 60; i++) { await page.mouse.wheel({ deltaY: 120 }); await new Promise((r) => setTimeout(r, 100)); }
  const t = await page.evaluate(() => window.__t);
  const ft = (await page.evaluate(() => window.__ft)).slice(2).sort((a, b) => a - b);
  console.log(`${label}: opened ${t.open} ms, voyage warm ${t.warm ?? 'NOT YET'} ms | first 6 s: worst ${ft.at(-1).toFixed(0)} ms, >50 ms ${ft.filter((x) => x > 50).length}, >100 ms ${ft.filter((x) => x > 100).length} of ${ft.length}`);
  await browser.close();
};
await run('first visit ');
await run('repeat visit');
