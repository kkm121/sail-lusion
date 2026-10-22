import puppeteer from 'puppeteer-core';
// Exercises the store's interactive UI and screenshots each state: menu, search, bag, mobile menu, viewer toggle, carousel.
const base = process.env.BASE || 'http://127.0.0.1:4200';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
const log = [];
const page = await browser.newPage();
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 200)));
await page.setViewport({ width: 1440, height: 900 });
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await sleep(2500);

// mega menu
await page.hover('.gn-links li:nth-child(2) a');
await sleep(900);
await page.screenshot({ path: 'shots/ui-0-menu.png', clip: { x: 0, y: 0, width: 1440, height: 420 } });
log.push('menu open: ' + (await page.$eval('.gn-panel', (e) => e.classList.contains('open'))));
await page.mouse.move(700, 700);
await sleep(700);
log.push('menu closed after leave: ' + !(await page.$eval('.gn-panel', (e) => e.classList.contains('open'))));

// search
await page.click('button[aria-label="Search"]');
await sleep(500);
await page.type('.gs-field input', 'aur');
await sleep(400);
await page.screenshot({ path: 'shots/ui-1-search.png' });
log.push('search results: ' + (await page.$$eval('.gs-body li', (l) => l.map((x) => x.textContent.trim()))).join(' | '));
await page.keyboard.press('Enter');
await sleep(1500);
log.push('after search enter: ' + (await page.evaluate(() => location.pathname)));

// bag
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await sleep(1500);
await page.click('button[aria-label="Bag"]');
await sleep(700);
await page.screenshot({ path: 'shots/ui-2-bag.png', clip: { x: 700, y: 0, width: 740, height: 360 } });
await page.keyboard.press('Escape');

// carousel
await page.evaluate(() => document.querySelector('.carousel').scrollIntoView({ block: 'center' }));
await sleep(600);
await page.click('.carousel-ctl button:last-child');
await sleep(900);
log.push('carousel scrollLeft after next: ' + Math.round(await page.$eval('.rail', (e) => e.scrollLeft)));

// viewer toggle on aura (opaque canvas) and drag
await page.goto(base + '/aura', { waitUntil: 'networkidle2' });
await sleep(2000);
await page.evaluate(() => document.querySelector('.viewer').scrollIntoView({ block: 'start' }));
await sleep(1500);
await page.screenshot({ path: 'shots/ui-3-viewer-day.png' });
await page.click('.seg button:last-child');
await sleep(900);
const box = await (await page.$('.viewer-stage')).boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.width / 2 + 260, box.y + box.height / 2, { steps: 12 });
await page.mouse.up();
await sleep(700);
await page.screenshot({ path: 'shots/ui-4-viewer-night.png' });

// mobile menu
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await sleep(2500);
await page.screenshot({ path: 'shots/ui-5-mobile-home.png' });
await page.click('.gn-burger');
await sleep(700);
await page.screenshot({ path: 'shots/ui-6-mobile-menu.png' });
await page.click('.gm li:nth-child(2) a');
await sleep(2500);
await page.screenshot({ path: 'shots/ui-7-mobile-pulse.png' });
log.push('mobile route: ' + (await page.evaluate(() => location.pathname)));

await browser.close();
console.log(log.join('\n'));
console.log('errors', errors);
