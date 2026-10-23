import puppeteer from 'puppeteer-core';
// Frame times on the opening screen, split into the animated part (dots, counter) and the word part. [desktop|mobile]
const base = process.env.BASE || 'http://127.0.0.1:4190';
const mode = process.argv[2] || 'desktop';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
if (mode === 'mobile') { await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); }
else await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => {
  try { sessionStorage.removeItem('ff3-seen'); } catch (e) {}
  window.__lf = []; let l = performance.now();
  const t = (n) => { window.__lf.push([n - l, window.__ldPhase || 'load']); l = n; if (!window.__ffReady) requestAnimationFrame(t); };
  requestAnimationFrame(t);
});
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction('window.__ffReady === true', { timeout: 40000 });
const f = await page.evaluate(() => window.__lf);
await browser.close();
const st = (a) => { const ft = a.map((x) => x[0]).slice(2).sort((x, y) => x - y); if (!ft.length) return 'n/a'; return `${ft.length} frames, worst ${ft[ft.length - 1].toFixed(0)} ms, >50 ms: ${ft.filter((x) => x > 50).length}, >100 ms: ${ft.filter((x) => x > 100).length}`; };
console.log(mode, '| dots + counter:', st(f.filter((x) => x[1] === 'load' || x[1] === 'form')));
console.log(mode, '| solid word    :', st(f.filter((x) => x[1] === 'word')));
