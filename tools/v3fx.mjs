import puppeteer from 'puppeteer-core';
import { execSync } from 'node:child_process';
// Cost of pointer effects: open a page, go to its bottom (join band + footer), move the pointer for 6 s.
// Reports whole-browser memory, JS heap, canvases and frame times. node tools/v3fx.mjs [route] [desktop|mobile]
const base = process.env.BASE || 'http://127.0.0.1:4190';
const route = process.argv[2] || '/team';
const mode = process.argv[3] || 'desktop';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
const page = await browser.newPage();
if (mode === 'mobile') { await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'); await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); }
else await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
const mb = () => Number(execSync(`powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='chrome.exe'\\" | Where-Object { $_.CommandLine -like '*pp-tools*' } | Measure-Object -Property PrivatePageCount -Sum | ForEach-Object { [math]::Round($_.Sum / 1MB) }"`).toString().trim());
await page.goto(base + route, { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 40000 });
await new Promise((r) => setTimeout(r, 2000));
const top = mb();
await page.evaluate(() => { window.__lenis?.resize(); (window.__lenis ? window.__lenis.scrollTo(1e7, { immediate: true, force: true }) : scrollTo(0, 1e7)); });
await new Promise((r) => setTimeout(r, 2500));
await page.evaluate(() => { window.__ft = []; let l = performance.now(); const t = (n) => { window.__ft.push(n - l); l = n; requestAnimationFrame(t); }; requestAnimationFrame(t); });
const t0 = Date.now(); let k = 0;
while (Date.now() - t0 < 6000) { const a = k++ / 12; await page.mouse.move(720 + Math.cos(a) * 500, 450 + Math.sin(a * 1.3) * 300); await new Promise((r) => setTimeout(r, 16)); }
const ft = (await page.evaluate(() => window.__ft)).slice(3).sort((a, b) => a - b);
const r = await page.evaluate(() => ({ heap: Math.round(performance.memory.usedJSHeapSize / 1048576), canvases: document.querySelectorAll('canvas').length }));
const bottom = mb();
await browser.close();
const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
console.log(`${mode} ${route}: browser ${top} MB at top, ${bottom} MB at the bottom while moving the pointer | heap ${r.heap} MB | canvases ${r.canvases} | ${(1000 / avg).toFixed(0)} fps, worst ${ft[ft.length - 1].toFixed(0)} ms, >50 ms ${ft.filter((x) => x > 50).length}`);
