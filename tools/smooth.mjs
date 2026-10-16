import puppeteer from 'puppeteer-core';
// Generic smoothness check for any of the three sites: loads a URL, waits, scrolls the whole page over N seconds
// and reports frame gaps plus the long animation frames with the scripts behind them.
// usage: node tools/smooth.mjs <url> [seconds] [desktop|mobile]
const url = process.argv[2];
const secs = Number(process.argv[3] || 20);
const mode = process.argv[4] || 'desktop';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultTimeout(120000);
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateCPUThrottling(4);
} else await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
await page.evaluateOnNewDocument(() => {
  window.__f = [];
  window.__l = [];
  const loop = (t) => { window.__f.push(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => e.duration > 80 && window.__l.push(`${(e.startTime / 1000).toFixed(1)}s ${Math.round(e.duration)}ms ${e.scripts.map((x) => (x.sourceFunctionName || x.invoker || '?').slice(0, 30) + '@' + (x.sourceURL || '').split('/').pop().split('?')[0].slice(0, 26)).slice(0, 2).join(' | ')}`))).observe({ type: 'long-animation-frame', buffered: true });
  } catch (e) {}
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
await page.goto(url, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 9000));
const t0 = await page.evaluate(() => performance.now());
const h = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const s0 = Date.now();
while (Date.now() - s0 < secs * 1000) {
  await page.evaluate((y) => window.scrollTo(0, y), (h * (Date.now() - s0)) / (secs * 1000));
  await new Promise((r) => setTimeout(r, 33));
}
const f = (await page.evaluate(() => window.__f)).filter((t) => t > t0);
const gaps = f.slice(1).map((t, i) => t - f[i]).sort((a, b) => a - b);
const pct = (q) => gaps[Math.floor(gaps.length * q)].toFixed(0);
console.log(`${url} ${mode}: frames ${f.length} in ${secs}s (${(f.length / secs).toFixed(0)} fps), p50 ${pct(0.5)}ms p95 ${pct(0.95)}ms max ${gaps[gaps.length - 1].toFixed(0)}ms, >50ms: ${gaps.filter((g) => g > 50).length}`);
const late = (await page.evaluate(() => window.__l)).filter((x) => parseFloat(x) * 1000 > t0);
if (late.length) console.log('long frames while scrolling:\n  ' + late.slice(0, 10).join('\n  '));
if (errors.length) console.log('errors', JSON.stringify(errors));
await browser.close();
