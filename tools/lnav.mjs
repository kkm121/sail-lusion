import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('shots', 'lusion-nav');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const target = process.argv[2] || '/about';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
page.setDefaultTimeout(180000);
await page.setViewport({ width: 1440, height: 900 });
await page.goto('https://lusion.co/', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 40; i++) {
  await sleep(1500);
  if (/is-ready/.test(await page.evaluate(() => document.documentElement.className))) break;
}
await sleep(3500);
const links = await page.evaluate(() => [...document.querySelectorAll('#header-menu-links a, #header a')].map((a) => a.getAttribute('href')));
console.log('links', JSON.stringify([...new Set(links)]));

await page.mouse.move(700, 400);
await page.click('#header-right-menu-btn');
await sleep(1400);
await page.screenshot({ path: path.join(out, 'menu.png') });

const cdp = await page.createCDPSession();
const frames = [];
cdp.on('Page.screencastFrame', async (e) => {
  frames.push({ t: e.metadata.timestamp, data: e.data });
  try { await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }); } catch (err) { /* ignore */ }
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 55, everyNthFrame: 1, maxWidth: 960, maxHeight: 600 });
const sel = `#header-menu-links a[href="${target}"]`;
await page.click(sel);
await sleep(1200);
console.log('url after click', await page.evaluate(() => location.pathname + ' | ' + document.querySelector('#page-container .page')?.id));
await sleep(9000);
console.log('url later', await page.evaluate(() => location.pathname + ' | ' + document.querySelector('#page-container .page')?.id));
await cdp.send('Page.stopScreencast');
frames.sort((a, b) => a.t - b.t);
const t0 = frames[0]?.t || 0;
frames.forEach((f, i) => fs.writeFileSync(path.join(out, `f${String(i).padStart(3, '0')}.jpg`), Buffer.from(f.data, 'base64')));
console.log('frames', frames.length, 'span', frames.length ? (frames[frames.length - 1].t - t0).toFixed(2) + 's' : 0);
fs.writeFileSync(path.join(out, 'times.json'), JSON.stringify(frames.map((f) => +(f.t - t0).toFixed(3))));
await browser.close();
