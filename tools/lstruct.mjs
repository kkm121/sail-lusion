import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('https://lusion.co/', { waitUntil: 'domcontentloaded', timeout: 90000 });
for (let i = 0; i < 40; i++) {
  await sleep(1500);
  if (/is-ready/.test(await page.evaluate(() => document.documentElement.className))) break;
}
await sleep(3000);
const tree = await page.evaluate(() => {
  const out = [];
  const walk = (el, d) => {
    if (d > 11) return;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const cls = (el.getAttribute('class') || '').split(/\s+/).slice(0, 4).join('.');
    const tf = cs.transform !== 'none' ? ' tf' : '';
    const pos = cs.position !== 'static' ? ' ' + cs.position : '';
    out.push(`${'  '.repeat(d)}${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${el.id ? '#' + el.id : ''} [${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.top + scrollY)}]${pos}${tf}`);
    for (const c of el.children) {
      if (['SCRIPT', 'STYLE', 'LINK', 'SVG', 'PATH', 'NOSCRIPT'].includes(c.tagName.toUpperCase())) continue;
      walk(c, d + 1);
    }
  };
  walk(document.body, 0);
  return out;
});
fs.writeFileSync('shots/lusion-tree.txt', tree.join('\n'));
console.log(tree.length, 'nodes');
console.log(tree.slice(0, 160).join('\n'));
await browser.close();
