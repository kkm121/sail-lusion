import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = process.env.BASE || 'http://127.0.0.1:4173';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PPDIR || 'C:/Users/muthu/AppData/Local/Temp/pp-' + process.pid, args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 160; i++) {
  if (!(await page.evaluate(() => !!document.querySelector('.sl-pre')))) break;
  await sleep(250);
}
await sleep(2500);
const tree = await page.evaluate(() => {
  const out = [];
  const walk = (el, d) => {
    if (d > 6) return;
    const r = el.getBoundingClientRect();
    const cls = (el.getAttribute('class') || '').split(/\s+/).slice(0, 3).join('.');
    out.push(`${'  '.repeat(d)}${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${el.id ? '#' + el.id : ''} [${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.top + scrollY)}]`);
    for (const c of el.children) {
      if (['SCRIPT', 'STYLE', 'LINK', 'SVG', 'PATH', 'NOSCRIPT', 'CANVAS'].includes(c.tagName.toUpperCase())) continue;
      walk(c, d + 1);
    }
  };
  walk(document.querySelector('main.sail'), 0);
  return out;
});
fs.writeFileSync('shots/ours-tree.txt', tree.join('\n'));
console.log(tree.filter((l) => /section|sl-hero|sl-reel|sl-featured|sl-lab|sl-end|footer/.test(l) && l.search(/\S/) <= 4).join('\n'));
await browser.close();
