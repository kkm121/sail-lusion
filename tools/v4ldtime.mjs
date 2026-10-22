import puppeteer from 'puppeteer-core';
// Logs when the opening screen's progress steps fire: node tools/v4ldtime.mjs [desktop|mobile] [slow]
const base = process.env.BASE || 'http://127.0.0.1:4500';
const mode = process.argv[2] || 'desktop';
const slow = process.argv[3] === 'slow';
const cpu = process.argv[3] === 'cpu'; // CPU 4x slower only: a weak laptop on a normal connection
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
if (cpu) {
  const c = await page.createCDPSession();
  await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}
if (slow) {
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}
await page.evaluateOnNewDocument(() => {
  try { sessionStorage.removeItem('ff4-seen'); sessionStorage.removeItem('ff3-seen'); } catch (e) {}
  window.__log = [];
  const t0 = performance.now();
  const wrap = () => {
    const l = window.__ld;
    if (!l || l.__w) return !!l;
    l.__w = 1;
    const s = l.set, d = l.done;
    l.set = (p) => { window.__log.push(['set ' + p, Math.round(performance.now() - t0)]); s(p); };
    l.done = () => { window.__log.push(['done', Math.round(performance.now() - t0)]); d(); };
    return true;
  };
  const iv = setInterval(() => wrap() && clearInterval(iv), 1);
  window.addEventListener('ff:ready', () => window.__log.push(['ff:ready', Math.round(performance.now() - t0)]));
  const tick = () => {
    const el = document.getElementById('l-fill');
    const ld = document.getElementById('ldr');
    if (el) {
      const m = /scaleX\(([\d.]+)\)/.exec(el.style.transform || '');
      const v = m ? Math.round(parseFloat(m[1]) * 10) * 10 : 0;
      const k = v + ' ' + (ld ? ld.className : 'gone');
      if (k !== window.__lastV) { window.__lastV = k; window.__log.push(['bar ' + k, Math.round(performance.now() - t0)]); }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
page.goto(base + '/').catch(() => {});
await new Promise((r) => setTimeout(r, slow || cpu ? 24000 : 12000));
const log = await page.evaluate(() => window.__log);
const marks = log;
console.log(marks.map((l) => l[1] + 'ms  ' + l[0]).join('\n'));
await browser.close();
