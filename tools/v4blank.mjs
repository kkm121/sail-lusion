import puppeteer from 'puppeteer-core';
// Phone: open /discover directly and via Home; report when the voyage becomes visible. BLOCK=hdr|glb simulates a failed file.
const base = process.env.BASE || 'http://127.0.0.1:4600';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-blank-' + Date.now(), args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const block = process.env.BLOCK;
if (block) { await page.setRequestInterception(true); page.on('request', (r) => (r.url().includes(block === 'hdr' ? 'studio.hdr' : 'navigator.glb') ? r.abort() : r.continue())); }
const errs = []; page.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
const watch = () => page.evaluate(() => new Promise((res) => { const t0 = performance.now(); const iv = setInterval(() => { const c = document.querySelector('.sl-lab-canvas.is-warm'); if (c) { clearInterval(iv); res(Math.round(performance.now() - t0)); } if (performance.now() - t0 > 20000) { clearInterval(iv); res('never (20 s)'); } }, 50); }));
await page.goto(base + '/discover', { waitUntil: 'domcontentloaded' });
await page.waitForFunction('window.__ffReady === true', { timeout: 60000 });
console.log(`${block ? 'blocked ' + block : 'normal'} | direct /discover: voyage visible ${await watch()} ms after the loader opened`);
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
await page.click('.v4-hero a[href="/discover"]');
console.log(`${block ? 'blocked ' + block : 'normal'} | via Home: voyage visible after ${await watch()} ms`);
await page.screenshot({ path: 'shots/blank-' + (block || 'ok') + '.png' });
console.log('errors', errs);
await browser.close();
