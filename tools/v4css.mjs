import puppeteer from 'puppeteer-core';
// Debug: print computed layout properties of an element on a v4 route: node tools/v4css.mjs /team ".person"
const base = process.env.BASE || 'http://127.0.0.1:4500';
const [route = '/', sel = 'body'] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff4-seen', '1'); } catch (e) {} });
await page.goto(base + route, { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));
const out = await page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return 'not found';
  const c = getComputedStyle(el);
  return { display: c.display, flow: c.gridAutoFlow, cols: c.gridTemplateColumns, rows: c.gridTemplateRows, width: el.clientWidth, children: [...el.children].map((k) => k.className + ':' + getComputedStyle(k).position + ':' + k.getBoundingClientRect().width) };
}, sel);
console.log(JSON.stringify(out, null, 1));
await browser.close();
