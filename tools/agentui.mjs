import puppeteer from 'puppeteer-core';
// Exercises FireFly Agent's interactive UI (preview on 4300) and screenshots key states.
const base = process.env.BASE || 'http://127.0.0.1:4300';
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

// typing headline changes over time
const t1 = await page.$eval('.hero-title span', (e) => e.textContent);
await sleep(1500);
const t2 = await page.$eval('.hero-title span', (e) => e.textContent);
log.push(`headline typing: "${t1}" -> "${t2}" (changed: ${t1 !== t2})`);

// menu
await page.click('.hd-menu');
await sleep(900);
await page.screenshot({ path: 'shots/agu-0-menu.png' });
log.push('menu open: ' + (await page.$eval('#menu', (e) => e.classList.contains('open'))));
await page.click('.menu li:nth-child(2) a');
await sleep(1200);
log.push('menu link scrolled to demo: ' + (await page.evaluate(() => Math.round(document.getElementById('demo').getBoundingClientRect().top))));

// modal
await page.evaluate(() => scrollTo(0, 0));
await sleep(600);
await page.click('.hd-dl');
await sleep(600);
await page.screenshot({ path: 'shots/agu-1-modal.png' });
await page.keyboard.press('Escape');
await sleep(500);
log.push('modal closed by Escape: ' + !(await page.$eval('.modal', (e) => e.classList.contains('open'))));

// tabs
await page.evaluate(() => document.querySelector('.surfaces').scrollIntoView({ block: 'start' }));
await sleep(800);
for (const [i, name] of [[3, 'cli'], [4, 'ide'], [5, 'sdk']]) {
  await page.click(`.tabs button:nth-child(${i})`);
  await sleep(i === 3 ? 5200 : 1200);
  const el = await page.$('.surf');
  await el.screenshot({ path: `shots/agu-2-${name}.png` });
  log.push(`tab ${name}: ${await page.$eval('.tabs button.on', (e) => e.textContent)}`);
}

// newsletter
await page.evaluate(() => document.querySelector('#sync').scrollIntoView({ block: 'center' }));
await sleep(900);
await page.click('.field button');
await sleep(300);
log.push('empty submit: ' + (await page.$eval('.err', (e) => e.textContent)));
await page.type('.field input', 'a@b.co');
await page.click('.field button');
await sleep(300);
log.push('no terms: ' + (await page.$eval('.err', (e) => e.textContent)));
await page.click('.agree input');
await page.click('.field button');
await sleep(600);
log.push('success: ' + (await page.$eval('.sync-ok', (e) => e.textContent)));

// motion toggle
await page.click('.ft-motion');
log.push('motion toggled, html.calm: ' + (await page.evaluate(() => document.documentElement.classList.contains('calm'))));
await page.click('.ft-motion');

// mobile
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await sleep(3500);
await page.screenshot({ path: 'shots/agu-3-m-hero.png' });
await page.evaluate(() => document.querySelector('.demo').scrollIntoView({ block: 'start' }));
await sleep(5000);
await page.screenshot({ path: 'shots/agu-4-m-demo.png' });
await page.evaluate(() => scrollTo(0, 0));
await sleep(400);
await page.click('.hd-menu');
await sleep(800);
await page.screenshot({ path: 'shots/agu-5-m-menu.png' });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
log.push('mobile horizontal overflow px: ' + overflow);
await browser.close();
console.log(log.join('\n'));
console.log('errors', errors);
