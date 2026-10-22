import puppeteer from 'puppeteer-core';
// Debug: load v4 home, then try importing the crystal module directly and report any error.
const base = process.env.BASE || 'http://127.0.0.1:4500';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(m.type() + ': ' + m.text().slice(0, 300)));
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message.slice(0, 300)));
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem('ff4-seen', '1'); } catch (e) {} });
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 3500));
const info = await page.evaluate(async () => {
  const out = { tier: document.documentElement.dataset.tier, canvas: !!document.querySelector('.crystal-canvas'), is3d: document.getElementById('stage')?.classList.contains('is-3d') };
  try {
    const url = [...document.querySelectorAll('script[type=module]')].map((s) => s.src)[0] || '';
    out.entry = url;
  } catch (e) {}
  return out;
});
console.log(JSON.stringify(info));
const st = await page.$('#stage');
for (let i = 0; i < 4; i++) { await st.screenshot({ path: `shots/cr-${i}.png` }); await new Promise((r) => setTimeout(r, 2200)); }
console.log(logs.join('\n'));
await browser.close();
