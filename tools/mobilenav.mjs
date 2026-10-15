import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

// Mobile: open the menu, go to every page through the loader, and save a frame of each.
const base = process.env.BASE || 'http://127.0.0.1:4173';
const out = path.resolve('shots', 'mobilenav');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultTimeout(120000);
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.querySelector('.sl-preloader'), { timeout: 120000 });
await sleep(1500);
const pages = ['/about', '/domains', '/projects', '/'];
let i = 0;
for (const href of pages) {
  await page.tap('button.menu');
  await sleep(500);
  await page.tap(`.sl-menu-links a[href="${href}"]`);
  await page.waitForFunction((h) => location.pathname === h, {}, href);
  await page.waitForFunction(() => !document.querySelector('.sl-pre.sl-tr.is-count, .sl-pre.sl-tr.is-mark, .sl-pre.sl-tr.is-open, .sl-pre.sl-tr.is-cover'), { timeout: 60000 });
  await sleep(2000);
  await page.screenshot({ path: path.join(out, `f${i++}.png`) });
}
console.log('visited', pages.join(' '), 'errors', JSON.stringify(errors));
await browser.close();
