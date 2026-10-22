import puppeteer from 'puppeteer-core';
// Scrolls into v3p2's voyage with real mouse-wheel ticks (through Lenis) across the device-to-full-screen growth,
// and reports frame times and how evenly the device's scale moves from frame to frame.
// BASE=... node tools/v3grow.mjs [cpu]
const base = process.env.BASE || 'http://127.0.0.1:4190';
const cpu = process.argv[2] === 'cpu';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 40000 });
await new Promise((r) => setTimeout(r, 2500));
if (cpu) {
  const c = await page.createCDPSession();
  await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}
// sample, every frame: frame time and the world's on-screen scale (from its transform matrix)
await page.evaluate(() => {
  window.__g = [];
  const w = document.querySelector('.sl-lab-world');
  let last = performance.now();
  const tick = (n) => {
    const m = new DOMMatrix(getComputedStyle(w).transform);
    window.__g.push([n - last, Math.hypot(m.a, m.b)]);
    last = n;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await page.mouse.move(720, 450);
// mouse-wheel ticks of 100 px, ~12 per second, until the device fills the screen (about 30% into the voyage)
const target = await page.evaluate(() => { const s = document.getElementById('lab'); return s.getBoundingClientRect().top + scrollY + (s.offsetHeight - innerHeight) * 0.3; });
for (let i = 0; i < 400; i++) {
  await page.mouse.wheel({ deltaY: 100 });
  await new Promise((r) => setTimeout(r, 80));
  if ((await page.evaluate(() => scrollY)) > target) break;
}
await new Promise((r) => setTimeout(r, 1200));
const g = await page.evaluate(() => window.__g);
await browser.close();
// only the frames where the device was growing
const grow = g.filter((f, i) => i > 0 && Math.abs(f[1] - g[i - 1][1]) > 1e-5 || (f[1] > 1.0001 && f[1] < 2.15));
const ft = grow.map((f) => f[0]).slice(1).sort((a, b) => a - b);
const steps = [];
for (let i = 1; i < g.length; i++) steps.push(Math.abs(g[i][1] - g[i - 1][1]));
const moving = steps.filter((s) => s > 1e-5);
const mean = moving.reduce((a, b) => a + b, 0) / moving.length;
// "jerk": how often one frame's step is more than twice (or less than half) the previous one while moving
let jerks = 0, stalls = 0;
for (let i = 1; i < steps.length; i++) {
  const a = steps[i - 1], b = steps[i];
  if (a > 1e-5 && b > 1e-5 && (b > a * 2 || b < a / 2)) jerks++;
  if (a > 1e-5 && b <= 1e-5 && steps[i + 1] > 1e-5) stalls++;
}
const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
console.log(`${cpu ? 'CPU 4x slower' : 'normal'}: growth frames ${ft.length}, avg ${(1000 / avg).toFixed(0)} fps, p95 ${ft[Math.floor(ft.length * 0.95)]?.toFixed(0)} ms, worst ${ft[ft.length - 1]?.toFixed(0)} ms, >25 ms: ${ft.filter((x) => x > 25).length}`);
console.log(`motion: ${moving.length} moving frames, uneven steps ${jerks} (${((jerks / moving.length) * 100).toFixed(0)}%), mid-motion stalls ${stalls}, mean step ${mean.toFixed(4)}`);
