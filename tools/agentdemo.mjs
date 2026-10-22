import puppeteer from 'puppeteer-core';
// Clicks each stage of the FireFly Agent demo and screenshots the window (preview on 4300).
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:4300/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1500));
await page.evaluate(() => document.querySelector('.demo').scrollIntoView({ block: 'center' }));
await new Promise((r) => setTimeout(r, 1200));
for (let i = 1; i <= 4; i++) {
  await page.click(`.stages li:nth-child(${i + 1}) button`);
  await new Promise((r) => setTimeout(r, 2600));
  const el = await page.$('.win');
  await el.screenshot({ path: `shots/agd-${i}.png` });
}
await browser.close();
console.log('errors', errors);
