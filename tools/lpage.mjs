import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const route = process.argv[2] || '/about';
const name = process.argv[3] || 'about';
const step = Number(process.argv[4] || 360);
const count = Number(process.argv[5] || 40);
const out = path.resolve('shots', `lusion-${name}`);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
page.setDefaultTimeout(180000);
await page.setViewport({ width: 1440, height: 900 });
await page.goto('https://lusion.co' + route, { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 40; i++) {
  await sleep(1500);
  if (/is-ready/.test(await page.evaluate(() => document.documentElement.className))) break;
}
await sleep(4000);
await page.mouse.move(720, 450);

const tree = await page.evaluate(() => {
  const outl = [];
  const walk = (el, d) => {
    if (d > 9) return;
    const r = el.getBoundingClientRect();
    const cls = (el.getAttribute('class') || '').split(/\s+/).slice(0, 3).join('.');
    outl.push(`${'  '.repeat(d)}${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${el.id ? '#' + el.id : ''} [${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.top)}]`);
    for (const c of el.children) {
      if (['SCRIPT', 'STYLE', 'LINK', 'SVG', 'PATH', 'NOSCRIPT'].includes(c.tagName.toUpperCase())) continue;
      walk(c, d + 1);
    }
  };
  const root = document.querySelector('#page-container') || document.body;
  walk(root, 0);
  return outl;
});
fs.writeFileSync(path.join(out, 'tree.txt'), tree.join('\n'));
console.log('tree nodes', tree.length);

for (let i = 0; i < count; i++) {
  for (let m = 0; m < step; m += 90) {
    await page.mouse.wheel({ deltaY: Math.min(90, step - m) });
    await sleep(14);
  }
  await sleep(700);
  await page.screenshot({ path: path.join(out, `f${String(i).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 70 });
}
await browser.close();
console.log('done', out);
