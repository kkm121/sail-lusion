import puppeteer from 'puppeteer-core';
const base = process.env.BASE || 'http://127.0.0.1:4190';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run'] });
const page = await browser.newPage();
page.on('console', (m) => console.log('console:', m.text().slice(0, 200)));
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 800));
console.log(await page.evaluate(async () => {
  const out = [];
  document.fonts.forEach((f) => out.push(f.family + ' ' + f.weight + ' ' + f.status));
  let loaded = 'n/a';
  try { loaded = (await document.fonts.load('600 40px "FF Word"', 'FireFly')).length; } catch (e) { loaded = 'ERR ' + e.message; }
  return JSON.stringify({ faces: out.slice(0, 6), loaded, check: document.fonts.check('600 40px "FF Word"', 'FireFly') });
}));
await browser.close();
