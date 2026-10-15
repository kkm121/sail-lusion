import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.BASE || 'http://127.0.0.1:5180';
const from = process.argv[2] || '/';
const sel = process.argv[3] || '.sl-nav-bar .links a[href="/about"]';
const secs = Number(process.argv[4] || 6);
const mode = process.argv[5] || 'desktop';
const out = path.resolve('shots', 'otrans');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
page.setDefaultTimeout(180000);
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 900 });
}
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
await page.goto(base + from, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('main.sail', { timeout: 120000 });
for (let i = 0; i < 240; i++) {
  const st = await page.evaluate(() => ({ pre: !!document.querySelector('.sl-preloader'), ov: document.documentElement.style.overflow }));
  if (!st.pre && st.ov !== 'hidden') break;
  await sleep(250);
}
await sleep(1800);
const cdp = await page.createCDPSession();
const frames = [];
cdp.on('Page.screencastFrame', async (e) => {
  frames.push({ t: e.metadata.timestamp, data: e.data });
  try { await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }); } catch (err) { /* ignore */ }
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, everyNthFrame: 1, maxWidth: 960, maxHeight: 600 });
await page.mouse.move(400, 300);
await page.click(sel);
await sleep(secs * 1000);
await cdp.send('Page.stopScreencast');
frames.sort((a, b) => a.t - b.t);
const t0 = frames[0]?.t || 0;
frames.forEach((f, i) => fs.writeFileSync(path.join(out, `f${String(i).padStart(3, '0')}.jpg`), Buffer.from(f.data, 'base64')));
fs.writeFileSync(path.join(out, 'times.json'), JSON.stringify(frames.map((f) => +(f.t - t0).toFixed(3))));
console.log('frames', frames.length, 'span', frames.length ? (frames[frames.length - 1].t - t0).toFixed(2) : 0, 'url', await page.evaluate(() => location.pathname), 'errors', JSON.stringify(errors.slice(0, 3)));
await browser.close();
