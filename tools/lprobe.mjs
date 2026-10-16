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
await page.mouse.move(720, 450);

const TARGETS = [
  '#home-hero-title',
  '#home-reel-title-line-1',
  '#home-reel-title-line-2',
  '#home-reel-desc',
  '#home-reel-cta',
  '#home-reel-thumb',
  '#home-reel-video-title',
  '#home-featured-title',
  '#home-featured-disclaimer',
  '.project-item:nth-of-type(1)',
  '.project-item:nth-of-type(1) .project-item-image',
  '.project-item:nth-of-type(1) .project-item-line-1',
  '.project-item:nth-of-type(1) .project-item-line-2',
  '.project-item:nth-of-type(2)',
  '.project-item:nth-of-type(3)',
  '.project-item:nth-of-type(3) .project-item-image',
  '#home-goal-title',
  '.home-goal-texts-paragraph',
  '#home-goal-image-in-outer',
  '#home-goal-image-in-inner',
];

const sample = () =>
  page.evaluate((T) => {
    const vh = innerHeight;
    return T.map((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const kid = el.querySelector('span, div') || null;
      const kcs = kid ? getComputedStyle(kid) : null;
      return {
        sel,
        top: +(r.top / vh).toFixed(3),
        h: Math.round(r.height),
        op: cs.opacity,
        tf: cs.transform === 'none' ? '' : cs.transform.replace('matrix(', '').replace(')', ''),
        clip: cs.clipPath === 'none' ? '' : cs.clipPath,
        filter: cs.filter === 'none' ? '' : cs.filter,
        ktf: kcs && kcs.transform !== 'none' ? kcs.transform.replace('matrix(', '').replace(')', '') : '',
        kop: kcs ? kcs.opacity : '',
      };
    });
  }, TARGETS);

const log = [];
let y = 0;
for (let i = 0; i < 125; i++) {
  await page.mouse.wheel({ deltaY: 80 });
  await sleep(260);
  y += 80;
  const s = await sample();
  const sy = await page.evaluate(() => Math.round(scrollY));
  log.push({ i, sy, s });
}
fs.writeFileSync('shots/lusion-probe.json', JSON.stringify(log));
console.log('steps', log.length, 'last scrollY', log[log.length - 1].sy);
await browser.close();
