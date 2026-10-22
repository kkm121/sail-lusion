import puppeteer from 'puppeteer-core';
// FireFly v4 performance: crystal frame rate on the hero, plus bytes transferred and time to first paint / ready.
// node tools/v4perf.mjs [desktop|mobile] [slow]
const base = process.env.BASE || 'http://127.0.0.1:4500';
const mode = process.argv[2] || 'desktop';
const slow = process.argv[3] === 'slow';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
const cdp = await page.createCDPSession();
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
if (slow) {
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}
let bytes = 0;
const files = {};
cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; });
cdp.on('Network.responseReceived', (e) => { files[e.requestId] = e.response.url.split('/').pop().slice(0, 40); });
await page.evaluateOnNewDocument(() => { try { localStorage.removeItem('ff4-lite'); sessionStorage.clear(); } catch (e) {} });
const t0 = Date.now();
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
const tDom = Date.now() - t0;
await page.waitForFunction('window.__ffReady === true', { timeout: 60000 });
const tReady = Date.now() - t0;
await new Promise((r) => setTimeout(r, slow ? 6000 : 2500));
const fps = await page.evaluate(() => new Promise((resolve) => {
  let n = 0;
  let worst = 0;
  let last = performance.now();
  const t1 = last;
  const f = (now) => {
    n++;
    worst = Math.max(worst, now - last);
    last = now;
    if (now - t1 < 3000) requestAnimationFrame(f);
    else resolve({ fps: Math.round((n * 1000) / (now - t1)), worst: Math.round(worst) });
  };
  requestAnimationFrame(f);
}));
const tier = await page.evaluate(() => document.documentElement.dataset.tier);
console.log(`${mode}${slow ? ' (throttled: 1.6 Mbps, 300 ms, CPU x4)' : ''}: DOM ready ${tDom} ms, page opened ${tReady} ms (includes the opening-screen minimum), transferred ${(bytes / 1024).toFixed(0)} KB, tier ${tier}, hero ${fps.fps} fps (worst frame ${fps.worst} ms)`);
await browser.close();
