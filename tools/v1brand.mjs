import puppeteer from 'puppeteer-core';
// Screenshots v1 (served on 4174): the loader, the home hero, and the footer, on desktop or mobile.
const base = process.env.BASE || 'http://127.0.0.1:4174';
const mode = process.argv[2] || 'desktop';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultTimeout(120000);
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await sleep(1600);
await page.screenshot({ path: `shots/v1-loader-${mode}.png` });
await sleep(9000);
await page.screenshot({ path: `shots/v1-home-${mode}.png` });
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await sleep(2500);
await page.screenshot({ path: `shots/v1-foot-${mode}.png` });
console.log('errors', JSON.stringify(errors));
await browser.close();
