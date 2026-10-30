import puppeteer from 'puppeteer-core';
// Is the scene animating while the page is not scrolled? Two shots 1.5 s apart at one progress: node tools/still.mjs <p>
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });
await pg.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
await pg.goto((process.env.BASE || 'http://127.0.0.1:4700') + '/discover', { waitUntil: 'networkidle2' });
await pg.waitForSelector('#lab');
await new Promise((r) => setTimeout(r, 4000));
const y = await pg.evaluate((p) => { const s = document.getElementById('lab'); return s.getBoundingClientRect().top + scrollY + p * (s.offsetHeight - innerHeight); }, Number(process.argv[2]));
await pg.evaluate((v) => (window.__lenis ? window.__lenis.scrollTo(v, { immediate: true, force: true }) : scrollTo(0, v)), y);
await pg.waitForFunction(() => document.querySelector('.sl-lab-canvas.is-warm') && !window.__labWarming, { timeout: 60000 });
await new Promise((r) => setTimeout(r, 3000));
await pg.screenshot({ path: 'shots/still-a.png' });
await new Promise((r) => setTimeout(r, 1500));
await pg.screenshot({ path: 'shots/still-b.png' });
await b.close();
