import puppeteer from 'puppeteer-core';
import { execSync } from 'node:child_process';
// Phone test for v3p2: 390x844 touch screen, CPU slowed (default 4x), real touch-swipe gestures through the whole home
// page. Reports frame times overall and inside the voyage's growth, plus whole-browser memory.
// BASE=... node tools/v3touch.mjs [cpuRate] [route]
const base = process.env.BASE || 'http://127.0.0.1:4190';
const rate = Number(process.argv[2] || 4);
const route = process.argv[3] || '/';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
const cdp = await page.createCDPSession();
const mb = () => {
  const ps = `Get-CimInstance Win32_Process -Filter \\"Name='chrome.exe'\\" | Where-Object { $_.CommandLine -like '*pp-tools*' } | Measure-Object -Property PrivatePageCount -Sum | ForEach-Object { [math]::Round($_.Sum / 1MB) }`;
  return Number(execSync(`powershell -NoProfile -Command "${ps}"`).toString().trim());
};
await page.goto(base + route, { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
await cdp.send('Emulation.setCPUThrottlingRate', { rate });
const top = mb();
const tier = await page.evaluate(() => document.querySelector('.sl-lab-canvas canvas') ? 'voyage mounted' : 'no voyage canvas');
await page.evaluate(() => {
  window.__f = [];
  const lab = document.getElementById('lab');
  let last = performance.now();
  const t = (n) => {
    let p = -1;
    if (lab) { const r = lab.getBoundingClientRect(); p = -r.top / Math.max(r.height - innerHeight, 1); }
    window.__f.push([n - last, p]);
    last = n;
    requestAnimationFrame(t);
  };
  requestAnimationFrame(t);
});
// swipe up the page like a thumb: 500 px drags (10 moves, one per frame) then a short pause, until the bottom
let peak = 0, inside = 0, lastY = -1, still = 0;
const swipe = async () => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
  for (let k = 1; k <= 10; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - k * 50 }] });
    await new Promise((r) => setTimeout(r, 16));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await new Promise((r) => setTimeout(r, 350));
};
for (let i = 0; i < 160; i++) {
  await swipe();
  const s = await page.evaluate(() => [scrollY, document.documentElement.scrollHeight - innerHeight]);
  if (route === '/' && !inside && s[0] > 9000) { inside = mb(); peak = Math.max(peak, inside); }
  if (s[0] >= s[1] - 2) break;
  if (Math.abs(s[0] - lastY) < 2 && ++still > 6) break; // stuck (should not happen)
  if (Math.abs(s[0] - lastY) >= 2) still = 0;
  lastY = s[0];
}
await new Promise((r) => setTimeout(r, 1500));
const f = await page.evaluate(() => window.__f);
const after = mb();
await browser.close();
const stat = (arr) => {
  const ft = arr.map((x) => x[0]).sort((a, b) => a - b);
  if (!ft.length) return 'n/a';
  const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
  return `avg ${(1000 / avg).toFixed(0)} fps, p95 ${ft[Math.floor(ft.length * 0.95)].toFixed(0)} ms, worst ${ft[ft.length - 1].toFixed(0)} ms, >50 ms ${ft.filter((x) => x > 50).length}/${ft.length}`;
};
console.log(`phone 390x844, CPU ${rate}x slower, ${route}: ${tier}`);
console.log('  whole page :', stat(f.slice(3)));
if (route === '/') {
  console.log('  growth     :', stat(f.filter((x) => x[1] > 0 && x[1] < 0.3)));
  console.log('  voyage rest:', stat(f.filter((x) => x[1] >= 0.3 && x[1] < 1)));
}
console.log(`  memory MB  : top ${top}, inside voyage ${inside || '-'}, peak ${peak}, at the end ${after}`);
console.log('  errors', errors);
