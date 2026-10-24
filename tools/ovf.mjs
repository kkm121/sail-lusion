import puppeteer from 'puppeteer-core';
const routes = process.argv[2].split(',');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
for (const w of [320, 375, 414, 768, 1024]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: 800, isMobile: w < 900, hasTouch: w < 900 });
  await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
  for (const r of routes) {
    await p.goto('http://127.0.0.1:4600' + r, { waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise((s) => setTimeout(s, 1500));
    const o = await p.evaluate(() => { const W = document.documentElement.clientWidth; const bad = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > W + 1) && getComputedStyle(e).position !== 'fixed' && !e.closest('.v4-bird,.sl-lab,[aria-hidden=true]'); }).slice(0, 4).map((e) => e.tagName + '.' + (e.className + '').slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().right)); return { sw: document.documentElement.scrollWidth, W, bad }; });
    if (o.sw > o.W || o.bad.length) console.log(w, r, JSON.stringify(o));
    if (r === '/' ) await p.screenshot({ path: `shots/home-${w}.png` });
  }
  await p.close();
}
await b.close(); console.log('done');
