import puppeteer from 'puppeteer-core';
import { execSync } from 'node:child_process';
// Whole-browser memory on Home, after moving to Team through the header, and back: BASE=... node tools/v3nav.mjs
const base = process.env.BASE || 'http://127.0.0.1:4190';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
const mb = () => {
  const ps = `Get-CimInstance Win32_Process -Filter \\"Name='chrome.exe'\\" | Where-Object { $_.CommandLine -like '*pp-tools*' } | Measure-Object -Property PrivatePageCount -Sum | ForEach-Object { [math]::Round($_.Sum / 1MB) }`;
  return Number(execSync(`powershell -NoProfile -Command "${ps}"`).toString().trim());
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = () => page.evaluate(() => location.pathname + ' (3D canvas: ' + document.querySelectorAll('.sl-lab-canvas canvas').length + ')');
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 40000 });
await sleep(3000);
console.log('Home          ', mb(), 'MB', await state());
await page.hover('.hd-nav a[href="/team"]');
await sleep(300);
await page.click('.hd-nav a[href="/team"]');
await sleep(4000);
console.log('-> Team        ', mb(), 'MB', await state());
await page.click('.hd-nav a[href="/"]');
await sleep(6000);
console.log('-> Home again  ', mb(), 'MB', await state());
await browser.close();
