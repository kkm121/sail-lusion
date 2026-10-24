import puppeteer from 'puppeteer-core';
const base = process.env.BASE || 'https://rp-club-ivory.vercel.app';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tr-' + Date.now(), args: ['--no-sandbox', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const t0 = Date.now();
page.on('requestfinished', (r) => { const u = r.url(); if (/\.(hdr|glb|jpg)$|LabScene/.test(u)) console.log(((Date.now() - t0) / 1000).toFixed(1) + 's done', u.split('/').pop().slice(0, 30), r.response()?.status()); });
page.on('requestfailed', (r) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's FAILED', r.url().split('/').pop(), r.failure()?.errorText));
page.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 120)));
page.goto(base + '/discover').catch(() => {});
for (let i = 0; i < 12; i++) { await new Promise((r) => setTimeout(r, 2500)); console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', JSON.stringify(await page.evaluate(() => ({ ready: !!window.__ffReady, phase: window.__ldPhase, s: window.__labState && Object.entries(window.__labState).filter(([k, v]) => v === true).map(([k]) => k).join(','), canvas: !!document.querySelector('.sl-lab-canvas canvas'), cls: document.querySelector('.sl-lab-canvas')?.className })).catch(() => 'nav'))); }
await browser.close();
