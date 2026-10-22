import puppeteer from 'puppeteer-core';
// Debug: during the loader's mark phase, report the bird image's state.
const base = process.env.BASE || 'http://127.0.0.1:4500';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.clear(); } catch (e) {} });
page.goto(base + '/').catch(() => {});
await page.waitForFunction("document.getElementById('ldr') && document.getElementById('ldr').className === 'is-mark'", { timeout: 20000, polling: 50 });
await new Promise((r) => setTimeout(r, 700));
console.log(JSON.stringify(await page.evaluate(() => {
  const b = document.querySelector('.l-bird');
  const c = getComputedStyle(b);
  const r = b.getBoundingClientRect();
  return { complete: b.complete, nat: b.naturalWidth, opacity: c.opacity, clip: c.clipPath, transform: c.transform, rect: [r.left, r.top, r.width, r.height], zi: c.zIndex, filter: c.filter };
})));
await page.screenshot({ path: 'shots/bird.png' });
await browser.close();
