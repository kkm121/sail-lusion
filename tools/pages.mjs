import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:5180';
const mode = process.argv[3] || 'desktop';
const out = path.resolve('shots', `pages-${mode}`);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
page.setDefaultTimeout(180000);
const problems = [];
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(m.type() + ': ' + m.text().slice(0, 160)); });
page.on('requestfailed', (r) => problems.push('failed: ' + r.url().slice(0, 100)));

if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
}

const shot = async (name) => {
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log(name, 'problems so far', problems.length);
};

await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 100; i++) {
  if (!(await page.evaluate(() => !!document.querySelector('.sl-pre')))) break;
  await sleep(250);
}
await sleep(2500);

await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^menu/i.test(b.textContent.trim()))?.click());
await sleep(900);
await shot('01-menu');
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^close/i.test(b.textContent.trim()))?.click());
await sleep(500);

await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /apply now/i.test(b.textContent))?.click());
await sleep(700);
await shot('02-building-modal');
await page.keyboard.press('Escape');
await sleep(400);

await page.keyboard.down('Control');
await page.keyboard.press('k');
await page.keyboard.up('Control');
await sleep(700);
for (const cmd of ['help', 'team', 'domains']) {
  await page.keyboard.type(cmd);
  await page.keyboard.press('Enter');
  await sleep(300);
}
await shot('03-cli');
await page.keyboard.press('Escape');
await sleep(300);

const pages = [['04-about', '/about'], ['06-domains', '/domains'], ['08-domain-tech', '/domains/technical'], ['10-domain-rd', '/domains/research-development'], ['12-domain-creatives', '/domains/creatives'], ['14-projects', '/projects'], ['16-detail', '/projects/project-chiron']];
for (const [name, url] of pages) {
  await page.goto(base + url, { waitUntil: 'domcontentloaded' });
  await sleep(2800);
  await shot(name);
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.42));
  await sleep(1700);
  await shot(name + 'b');
}
console.log('problems', JSON.stringify([...new Set(problems)].slice(0, 10)));
await browser.close();

