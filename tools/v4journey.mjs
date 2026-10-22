import puppeteer from 'puppeteer-core';
// Screenshots FireFly v4's "Inside FireFly" journey at given progress values: node tools/v4journey.mjs [desktop|mobile] 0,0.2,0.5 [prefix]
const base = process.env.BASE || 'http://127.0.0.1:4500';
const mode = process.argv[2] || 'desktop';
const ps = (process.argv[3] || '0,0.15,0.3,0.45,0.6,0.75,0.9,1').split(',').map(Number);
const prefix = process.argv[4] || 'vj';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
page.on('console', (m) => ['error', 'warning', 'warn'].includes(m.type()) && errors.push(m.type() + ': ' + m.text().slice(0, 200)));
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
const lite = process.env.LITE === '1';
await page.evaluateOnNewDocument((lt) => { try { if (lt) localStorage.setItem('ff4-lite', 'on'); else localStorage.removeItem('ff4-lite'); localStorage.removeItem('ff4-motion'); sessionStorage.clear(); sessionStorage.setItem('ff4-seen', '1'); } catch (e) {} }, lite);
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));
const info = await page.evaluate(() => {
  const s = document.getElementById('journey');
  const r = s.getBoundingClientRect();
  return { top: r.top + scrollY, h: s.offsetHeight, vh: innerHeight };
});
console.log('journey height', (info.h / info.vh).toFixed(2), 'screens');
let i = 0;
for (const p of ps) {
  const y = info.top + p * (info.h - info.vh);
  await page.evaluate((v) => scrollTo(0, v), y);
  await new Promise((r) => setTimeout(r, p === ps[0] ? 3200 : 1700));
  await page.screenshot({ path: `shots/${prefix}-${i++}.png` });
}
const state = await page.evaluate(() => ({ tier: document.getElementById('j-stage').dataset.tier, is3d: document.getElementById('j-stage').classList.contains('is-3d'), canvas: !!document.querySelector('#j-scene canvas') }));
console.log(JSON.stringify(state), 'errors', errors);
await browser.close();
