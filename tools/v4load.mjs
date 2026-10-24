import puppeteer from 'puppeteer-core';
// Captures FireFly v4's opening screen over time: node tools/v4load.mjs [desktop|mobile] [slow]
// "slow" throttles the network (about 1.6 Mbps, 300 ms latency) and the CPU (4x) to mimic a weak phone.
const base = process.env.BASE || 'http://127.0.0.1:4500';
const mode = process.argv[2] || 'desktop';
const slow = process.argv[3] === 'slow';
const times = (process.env.TIMES || '250,800,1400,2000,2700,3300,4200,5600').split(',').map(Number);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 200)));
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
if (slow) {
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}
await page.evaluateOnNewDocument(() => {
  try { sessionStorage.removeItem('ff4-seen'); sessionStorage.removeItem('ff3-seen'); } catch (e) {}
});
const t0 = Date.now();
page.goto(base + (process.env.ROUTE || '/')).catch(() => {});
let i = 0;
for (const t of times) {
  const wait = t - (Date.now() - t0);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  await page.screenshot({ path: `shots/ld-${mode}${slow ? '-slow' : ''}-${i++}.png` });
}
const gone = await page.evaluate(() => !document.getElementById('ldr'));
console.log('loader removed by last capture:', gone, 'errors', errors);
await browser.close();
