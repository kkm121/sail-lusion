import puppeteer from 'puppeteer-core';
// Screenshots the first-load loader part way through, for a look at its colours.
const base = process.env.BASE || 'http://127.0.0.1:5180';
const mode = process.argv[2] || 'desktop';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PPDIR || 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
if (mode === 'mobile') await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
else await page.setViewport({ width: 1440, height: 900 });
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.sl-preloader .fill', { timeout: 120000 });
await page.waitForFunction(() => /scaleX\(0\.[4-9]/.test(document.querySelector('.sl-preloader .fill').style.transform), { timeout: 120000, polling: 50 });
await page.screenshot({ path: `shots/loader-${mode}.png` });
await browser.close();
console.log('ok');
