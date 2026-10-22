import puppeteer from 'puppeteer-core';
// Lists each top-level section of a page with its height in screens: BASE=... node tools/secs.mjs /route
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem('ff3-seen', '1'); } catch (e) {} });
await page.goto(process.env.BASE + (process.argv[2] || '/'), { waitUntil: 'networkidle2' });
await page.waitForFunction('window.__ffReady === true', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));
console.log(await page.evaluate(() => [...document.querySelector('main').firstElementChild.children].map((c) => (c.className || c.tagName).toString().slice(0, 28).padEnd(30) + (c.getBoundingClientRect().height / innerHeight).toFixed(2)).join('\n')));
await browser.close();
