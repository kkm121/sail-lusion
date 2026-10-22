import puppeteer from 'puppeteer-core';
import { execSync } from 'node:child_process';
// Whole-browser memory (all Chrome processes of the test profile, GPU included) and frame times through v3p2's home page.
// BASE=... node tools/v3mem.mjs [desktop|mobile]
const base = process.env.BASE || 'http://127.0.0.1:4190';
const mode = process.argv[2] || 'desktop';
const PROFILE = 'C:/Users/muthu/AppData/Local/Temp/pp-tools';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: PROFILE, args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument((calm) => { try { sessionStorage.setItem('ff3-seen', '1'); if (calm) localStorage.setItem('ff-motion', 'off'); else localStorage.removeItem('ff-motion'); } catch (e) {} }, !!process.env.CALM);

const procMB = () => {
  const ps = `Get-CimInstance Win32_Process -Filter \\"Name='chrome.exe'\\" | Where-Object { $_.CommandLine -like '*pp-tools*' } | Measure-Object -Property PrivatePageCount -Sum | ForEach-Object { [math]::Round($_.Sum / 1MB) }`;
  try { return Number(execSync(`powershell -NoProfile -Command "${ps}"`).toString().trim()); } catch { return -1; }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const go = (y) => page.evaluate((v) => { if (window.__lenis) { window.__lenis.resize(); window.__lenis.scrollTo(v, { immediate: true, force: true }); } else scrollTo(0, v); }, y);
const heap = () => page.evaluate(() => Math.round(performance.memory.usedJSHeapSize / 1048576));
const canvases = () => page.evaluate(() => document.querySelectorAll('.sl-lab-canvas canvas').length + '/' + document.querySelectorAll('canvas').length + (document.getElementById('ldr') ? ' LDR' : '') + ' @' + Math.round(scrollY) + '/' + (document.documentElement.scrollHeight - innerHeight));

await page.goto(base + (process.env.ROUTE || '/'), { waitUntil: 'networkidle2' });
if (process.env.V2) await sleep(11000);
else await page.waitForFunction('window.__ffReady === true', { timeout: 30000 });
await sleep(2500);
const info = process.env.ONLYTOP ? {} : await page.evaluate(() => { const s = document.getElementById('lab'); const r = s.getBoundingClientRect(); return { top: r.top + scrollY, h: s.offsetHeight, vh: innerHeight, total: document.documentElement.scrollHeight }; });
const rows = [];
rows.push(['hero (top of page)', procMB(), await heap(), await canvases()]);
if (process.env.ONLYTOP) { console.log(rows); await browser.close(); process.exit(0); }

// walk through the voyage at a steady pace and time the frames
await page.evaluate(() => { window.__ft = []; let l = performance.now(); const t = (n) => { window.__ft.push(n - l); l = n; requestAnimationFrame(t); }; requestAnimationFrame(t); });
await go(info.top);
await sleep(Number(process.env.WARM || 7000)); // mount + warm-up
await page.evaluate(() => (window.__ft = []));
const steps = 120;
for (let i = 0; i <= steps; i++) {
  await go(info.top + (i / steps) * (info.h - info.vh) * 0.97);
  await sleep(70);
  if (i === Math.round(steps * 0.7)) rows.push(['inside the voyage (70%)', procMB(), await heap(), await canvases()]);
}
const ft = (await page.evaluate(() => window.__ft)).slice(3).sort((a, b) => a - b);
const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
await go(1e7);
await sleep(1500); // v2's one-second goodbye pause at the end of the voyage holds the scroll; then carry on
await go(1e7);
await sleep(4000);
rows.push(['bottom of page (voyage released)', procMB(), await heap(), await canvases()]);
await go(0);
await sleep(3000);
rows.push(['back at the top', procMB(), await heap(), await canvases()]);
console.log(`${mode}: voyage frames avg ${(1000 / avg).toFixed(0)} fps, p95 ${ft[Math.floor(ft.length * 0.95)].toFixed(0)} ms, worst ${ft[ft.length - 1].toFixed(0)} ms, >50 ms: ${ft.filter((x) => x > 50).length}/${ft.length}`);
console.log('where                              browser MB  JS heap MB  3D canvas');
rows.forEach((r) => console.log(r[0].padEnd(36) + String(r[1]).padStart(8) + String(r[2]).padStart(11) + '   ' + r[3]));
console.log('errors', errors);
await browser.close();
