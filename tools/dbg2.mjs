import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
p.on('console', (m) => ['error', 'warn'].includes(m.type()) && !/Clock|X4122|preload/.test(m.text()) && console.log(m.type(), m.text().slice(0, 300)));
p.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 300)));
await p.goto(process.argv[2], { waitUntil: 'networkidle2' });
await p.waitForSelector('#lab');
const top = await p.evaluate(() => { const s = document.getElementById('lab'); return s.getBoundingClientRect().top + scrollY + 0.87 * (s.offsetHeight - innerHeight); });
await p.evaluate((v) => scrollTo(0, v), top);
for (let i = 0; i < 6; i++) { await new Promise((r) => setTimeout(r, 3000)); console.log(await p.evaluate(() => JSON.stringify({ warming: window.__labWarming, st: window.__labState && { env: __labState.env, cage: __labState.cage, earth: __labState.earth, nav: __labState.nav, warm: __labState.warm }, canvas: !!document.querySelector('.sl-lab-canvas canvas'), warmCls: !!document.querySelector('.sl-lab-canvas.is-warm') }))); }
await b.close();
