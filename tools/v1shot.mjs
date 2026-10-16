import puppeteer from 'puppeteer-core';
// Screenshots the first deployment's blob (dev route /__v1) for each theme colour given.
const base = process.env.BASE || 'http://127.0.0.1:5180';
const colors = (process.argv[2] || '00F5D4').split(',');
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultTimeout(120000);
await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
for (const c of colors) {
  await page.goto(`${base}/__v1?c=${c}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !document.querySelector('.sl-preloader'), { timeout: 120000 });
  await new Promise((r) => setTimeout(r, 6000));
  await page.screenshot({ path: `shots/v1-${c}.png` });
}
await browser.close();
console.log('ok');
