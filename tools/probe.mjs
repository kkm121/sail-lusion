import puppeteer from 'puppeteer-core';
const sleep = (t) => new Promise((r) => setTimeout(r, t));
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PPDIR || 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:5180/', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 160; i++) { if (!(await page.evaluate(() => !!document.querySelector('.sl-pre')))) break; await sleep(250); }
await sleep(3500);
for (let k = 0; k < 44; k++) {
  const a = (k / 44) * Math.PI * 2;
  await page.mouse.move(720 + Math.cos(a) * 340, 520 + Math.sin(a * 1.3) * 160);
  await sleep(16);
}
await page.screenshot({ path: 'probe-liquid.png' });
const y = await page.evaluate(() => document.querySelector('#lab').getBoundingClientRect().top + scrollY);
await page.evaluate((v) => window.scrollTo(0, v - 500), y);
await sleep(1500);
const hit = await page.evaluate(() => {
  const out = [];
  for (const [x, yy] of [[700, 850], [200, 800]]) out.push(document.elementsFromPoint(x, yy).slice(0, 5).map((e) => e.tagName + '.' + String(e.className).slice(0, 30) + ' bg=' + getComputedStyle(e).backgroundImage.slice(0, 60)));
  return out;
});
console.log(JSON.stringify(hit, null, 1));
await page.screenshot({ path: 'probe-gray.png' });
await browser.close();
