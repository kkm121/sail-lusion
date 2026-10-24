import puppeteer from 'puppeteer-core';
const [url, w, h, out] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h, isMobile: +w < 900 });
await p.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
await p.goto(url, { waitUntil: 'networkidle2' }); await new Promise((r) => setTimeout(r, +(process.env.WAIT || 3000)));
await p.screenshot({ path: out }); await b.close();
