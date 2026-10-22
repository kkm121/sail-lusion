import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
// Captures transparent PNGs of the store's real 3D models from /__shot/<id>, written into firefly-store/public/img.
const base = process.env.BASE || 'http://127.0.0.1:4400';
const out = 'C:/Users/muthu/Downloads/frontend/firefly-signal/public/img';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const errors = [];
for (const id of (process.argv[2] || 'ember,lumen').split(',')) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(id + ': ' + e.message.slice(0, 200)));
  page.on('console', (m) => m.type() === 'error' && errors.push(id + ' console: ' + m.text().slice(0, 200)));
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1 });
  await page.goto(`${base}/__shot/${id}`, { waitUntil: 'networkidle2' });
  await page.addStyleTag({ content: 'html,body{background:transparent!important}' });
  await page.waitForFunction('window.__stageReady === true', { timeout: 60000 }).catch(() => errors.push(id + ': stage never ready'));
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: `${out}/${id}.png`, omitBackground: true });
  await page.close();
}
await browser.close();
console.log('errors', errors);
