import puppeteer from 'puppeteer-core';
// Exercises FireFly Signal's interactive UI (preview on 4400): bag, matrix lab modes, drawing, newsletter, motion switch, mobile.
const base = process.env.BASE || 'http://127.0.0.1:4400';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
const log = [];
const page = await browser.newPage();
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 200)));
await page.setViewport({ width: 1440, height: 900 });
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await sleep(3000);

// bag
await page.click('.hd-bag');
await sleep(600);
log.push('bag open: ' + (await page.$eval('.bagpop', (e) => e.classList.contains('open'))));
await page.screenshot({ path: 'shots/sgu-0-bag.png', clip: { x: 900, y: 0, width: 540, height: 300 } });
await page.keyboard.press('Escape');

// ticker moves: compare two frames of the ticker canvas
const tick = async () => page.$eval('.hero-ticker canvas', (c) => c.toDataURL().length);
const t1 = await tick();
await sleep(900);
const t2 = await tick();
log.push('ticker canvas changing: ' + (t1 !== t2));

// lab
await page.evaluate(() => document.querySelector('#matrix').scrollIntoView({ block: 'start' }));
await sleep(1200);
await page.click('.lab-field input', { clickCount: 3 });
await page.keyboard.type('hi!');
await sleep(300);
for (const [i, name] of [[2, 'pulse'], [3, 'wave'], [4, 'draw']]) {
  await page.click(`.lab-modes button:nth-child(${i})`);
  await sleep(i === 4 ? 300 : 900);
  log.push(`mode ${name}: ${await page.$eval('.lab-modes button.on', (e) => e.textContent)}`);
}
// paint a diagonal on the grid
const box = await (await page.$('.lab-screen canvas')).boundingBox();
await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.8, { steps: 20 });
await page.mouse.up();
await sleep(400);
await page.click('.lab-tone button:nth-child(2)');
await sleep(400);
await page.screenshot({ path: 'shots/sgu-1-lab-draw.png' });
await page.click('.lab-modes button:nth-child(3)');
await sleep(1200);
await page.screenshot({ path: 'shots/sgu-2-lab-wave.png' });

// newsletter
await page.evaluate(() => document.querySelector('.ft-join').scrollIntoView({ block: 'center' }));
await sleep(700);
await page.click('.ft-field button');
await sleep(300);
log.push('bad email: ' + (await page.$eval('.ft-err', (e) => e.textContent)));
await page.type('.ft-field input', 'a@b.co');
await page.click('.ft-field button');
await sleep(500);
log.push('success: ' + (await page.$eval('.ft-ok', (e) => e.textContent)));

// motion switch
await page.click('.ft-base button');
log.push('calm on: ' + (await page.evaluate(() => document.documentElement.classList.contains('calm'))));
await page.click('.ft-base button');
await page.screenshot({ path: 'shots/sgu-3-footer.png' });

// 404
await page.goto(base + '/nope', { waitUntil: 'networkidle2' });
log.push('404 title: ' + (await page.$eval('.nf h1', (e) => e.textContent)));

// mobile
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await sleep(4000);
await page.screenshot({ path: 'shots/sgu-4-m-home.png' });
log.push('mobile home overflow px: ' + (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)));
await page.click('.hd-burger');
await sleep(800);
await page.screenshot({ path: 'shots/sgu-5-m-menu.png' });
await page.click('.drawer a:nth-child(2)');
await sleep(4000);
await page.screenshot({ path: 'shots/sgu-6-m-ember.png' });
log.push('mobile route: ' + (await page.evaluate(() => location.pathname)));
log.push('mobile ember overflow px: ' + (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)));
await page.evaluate(() => document.querySelector('#matrix') ? 0 : 0);
await page.goto(base + '/#matrix', { waitUntil: 'networkidle2' });
await sleep(2500);
await page.screenshot({ path: 'shots/sgu-7-m-lab.png' });
await browser.close();
console.log(log.join('\n'));
console.log('errors', errors);
