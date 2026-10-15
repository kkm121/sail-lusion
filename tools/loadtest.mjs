import puppeteer from 'puppeteer-core';

// Records every frame while the first-load counter runs: how smooth the number is and how long the page stalls.
// usage: BASE=http://127.0.0.1:4173 node tools/loadtest.mjs desktop|mobile
const mode = process.argv[2] || 'desktop';
const base = process.env.BASE || 'http://127.0.0.1:4173';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new', args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateCPUThrottling(4);
} else await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => {
  window.__f = [];
  const loop = (t) => {
    const f = document.querySelector('.sl-preloader .fill');
    const m = f && /scaleX\(([\d.]+)\)/.exec(f.style.transform || '');
    window.__f.push([Math.round(t), m ? +(+m[1] * 100).toFixed(1) : null, !!document.querySelector('.sl-preloader')]);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__f.length > 5 && !document.querySelector('.sl-preloader'), { timeout: 180000 });
await new Promise((r) => setTimeout(r, 500));
const f = await page.evaluate(() => window.__f);
const live = f.filter((x) => x[2] && x[1] !== null);
let maxGap = 0;
let maxJump = 0;
let stalls = 0;
for (let i = 1; i < live.length; i++) {
  const gap = live[i][0] - live[i - 1][0];
  maxGap = Math.max(maxGap, gap);
  if (gap > 100) stalls++;
  maxJump = Math.max(maxJump, Math.abs(live[i][1] - live[i - 1][1]));
}
console.log(`${mode}: loader ${(live[live.length - 1][0] - live[0][0]) / 1000}s, frames ${live.length}, max frame gap ${maxGap}ms, stalls>100ms ${stalls}, biggest single-frame jump ${maxJump.toFixed(1)}%`);
console.log('stalls at', live.map((x,i)=>i? [x[0]-live[i-1][0], x[0], x[1]]:null).filter(x=>x&&x[0]>100).map(x=>x[0]+'ms@'+(x[1]/1000).toFixed(1)+'s val'+x[2]).join(' | '));
console.log('samples', live.filter((_, i) => i % Math.ceil(live.length / 14) === 0).map((x) => `${(x[0] / 1000).toFixed(1)}s=${x[1]}`).join('  '));
await browser.close();
