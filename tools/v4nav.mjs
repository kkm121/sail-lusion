import puppeteer from 'puppeteer-core';
// Click "Discover" in the header from Home (no loading screen), capture the device frame over time and time the frames.
const base = process.env.BASE || 'http://127.0.0.1:4600';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PROFILE || 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const mobile = process.argv[2] === 'mobile';
if (mobile) { await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); }
else await page.setViewport({ width: 1440, height: 900 });
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
await page.evaluate(() => { window.__ft = []; let l = performance.now(); const t = (n) => { window.__ft.push([n - l, Math.round(n)]); l = n; requestAnimationFrame(t); }; requestAnimationFrame(t); });
const t0 = await page.evaluate(() => performance.now());
if (process.env.CPU) { const c = await page.createCDPSession(); await c.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU) }); }
await page.click(mobile ? '.v4-hero a[href="/discover"]' : '.hd-nav a[href="/discover"]');
for (let i = 0; i < 6; i++) { await new Promise((r) => setTimeout(r, i ? 500 : 150)); await page.screenshot({ path: `shots/nav-${i}.png`, clip: mobile ? { x: 0, y: 0, width: 390, height: 844 } : { x: 0, y: 380, width: 1100, height: 520 } }); }
await new Promise((r) => setTimeout(r, 3000));
const ft = (await page.evaluate(() => window.__ft)).filter((f) => f[1] > t0).map((f) => f[0]).sort((a, b) => a - b);
console.log(`after clicking Discover (6 s): worst ${ft.at(-1).toFixed(0)} ms, >50 ms ${ft.filter((x) => x > 50).length}, >100 ms ${ft.filter((x) => x > 100).length}, >250 ms ${ft.filter((x) => x > 250).length} of ${ft.length}`);
await browser.close();
