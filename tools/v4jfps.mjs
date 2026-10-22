import puppeteer from 'puppeteer-core';
// Scrolls straight through FireFly v4's "Inside FireFly" journey and reports frame times.
// node tools/v4jfps.mjs [desktop|mobile] [cpu=1|4] [lite]
const base = process.env.BASE || 'http://127.0.0.1:4500';
const mode = process.argv[2] || 'desktop';
const cpu = Number(process.argv[3] || 1);
const lite = process.argv[4] === 'lite';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument((lt) => { try { localStorage.removeItem('ff4-motion'); sessionStorage.clear(); sessionStorage.setItem('ff4-seen', '1'); if (lt) localStorage.setItem('ff4-lite', 'on'); else localStorage.removeItem('ff4-lite'); } catch (e) {} }, lite);
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 2000));
// warm up: bring the journey near so its 3D scene mounts before measuring
await page.evaluate(() => { const s = document.getElementById('journey'); scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * 0.6); });
await new Promise((r) => setTimeout(r, 3500));
if (cpu > 1) {
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
}
const res = await page.evaluate(() => new Promise((resolve) => {
  const s = document.getElementById('journey');
  const start = s.getBoundingClientRect().top + scrollY;
  const dist = s.offsetHeight - innerHeight;
  const dur = 7000;
  const gaps = [];
  let last = performance.now();
  const t0 = last;
  const tick = (now) => {
    gaps.push(now - last);
    last = now;
    const k = Math.min(1, (now - t0) / dur);
    scrollTo(0, start + k * dist);
    if (k < 1) requestAnimationFrame(tick);
    else {
      const sorted = gaps.slice(1).sort((a, b) => a - b);
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
      resolve({ frames: sorted.length, fps: Math.round(1000 / avg), p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]), max: Math.round(sorted[sorted.length - 1]), over50: sorted.filter((g) => g > 50).length });
    }
  };
  requestAnimationFrame(tick);
}));
const stage = await page.evaluate(() => ({ tier: document.getElementById('j-stage').dataset.tier, is3d: document.getElementById('j-stage').classList.contains('is-3d') }));
console.log(`${mode}${cpu > 1 ? ' CPU x' + cpu : ''}${lite ? ' lite' : ''}: ${res.fps} fps, p95 ${res.p95} ms, worst ${res.max} ms, frames over 50 ms: ${res.over50}/${res.frames}; journey tier ${stage.tier}, 3D showing: ${stage.is3d}`);
await browser.close();
