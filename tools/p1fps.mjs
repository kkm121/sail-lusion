import puppeteer from 'puppeteer-core';
// Frame times while scrolling smoothly through phase one (p 0.28 -> 0.72) at a steady pace: BASE=... node tools/p1fps.mjs [desktop|mobile] [seconds]
const base = process.env.BASE;
const mode = process.argv[2] || 'desktop';
const secs = Number(process.argv[3] || 10);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });
const p = await b.newPage();
if (mode === 'mobile') { await p.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); }
else await p.setViewport({ width: 1440, height: 900 });
await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
await p.goto(base + '/discover', { waitUntil: 'networkidle2' });
await p.waitForSelector('#lab');
await new Promise((r) => setTimeout(r, 4000));
const info = await p.evaluate(() => { const s = document.getElementById('lab'); const r = s.getBoundingClientRect(); return { top: r.top + scrollY, h: s.offsetHeight, vh: innerHeight }; });
const y = (q) => info.top + q * (info.h - info.vh);
await p.evaluate((v) => (window.__lenis ? window.__lenis.scrollTo(v, { immediate: true, force: true }) : scrollTo(0, v)), y(0.28));
await p.waitForFunction(() => document.querySelector('.sl-lab-canvas.is-warm'), { timeout: 30000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 3000));
const res = await p.evaluate(async (a, bb, secs) => {
  const ft = [];
  let last = performance.now();
  const t0 = last;
  await new Promise((done) => {
    const step = (n) => {
      ft.push(n - last); if (n - last > 45) (window.__long = window.__long || []).push([Math.round(n - last), +(0.28 + 0.44 * Math.min(1, (n - t0) / (secs * 1000))).toFixed(3)]); last = n;
      const k = Math.min(1, (n - t0) / (secs * 1000));
      window.__lenis ? window.__lenis.scrollTo(a + (bb - a) * k, { immediate: true, force: true }) : scrollTo(0, a + (bb - a) * k);
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
  return { ft, heap: Math.round(performance.memory.usedJSHeapSize / 1048576), long: window.__long || [] };
}, y(0.28), y(0.72), secs);
const ft = res.ft.slice(3).sort((a, b) => a - b);
const pc = (q) => ft[Math.floor(q * (ft.length - 1))].toFixed(1);
console.log(mode, `${ft.length} frames, avg ${(ft.reduce((a, b) => a + b, 0) / ft.length).toFixed(1)} ms, p50 ${pc(0.5)}, p95 ${pc(0.95)}, worst ${pc(1)}, >50ms ${ft.filter((x) => x > 50).length}, heap ${res.heap} MB`, JSON.stringify(res.long));
await b.close();
