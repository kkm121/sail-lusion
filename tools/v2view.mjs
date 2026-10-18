import puppeteer from 'puppeteer-core';
// Viewport capture of a v2 route with a given element scrolled to the top: node tools/v2view.mjs /route ".selector" out-name
const [route = '/', sel = 'body', name = 'v2view'] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:4173' + route, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 4500));
await page.evaluate((s) => {
  const el = document.querySelector(s);
  if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 120);
}, sel);
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: `shots/${name}.png` });
await browser.close();
console.log('errors', errors);
