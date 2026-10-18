import puppeteer from 'puppeteer-core';
// Screenshot the footer credit row on a v2 page.
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:4173' + (process.argv[2] || '/about'), { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 4000));
await page.evaluate(() => document.querySelector('.sl-footer-bottom').scrollIntoView({ block: 'center' }));
await new Promise((r) => setTimeout(r, 1500));
const el = await page.$('.sl-footer-bottom');
await el.screenshot({ path: 'shots/nod.png' });
await browser.close();
console.log('ok');
