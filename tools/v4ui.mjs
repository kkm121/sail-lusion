import puppeteer from 'puppeteer-core';
// Exercises FireFly v4 (preview on 4500): page length, popups, crystal hold and release, weak-device tiers, toggles, mobile.
const base = process.env.BASE || 'http://127.0.0.1:4500';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
const log = [];
const watch = (page) => {
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 200)));
};
const boot = async (page, url = base + '/') => {
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.waitForFunction('window.__ffReady === true', { timeout: 20000 });
  await sleep(1800);
};

// ---------- desktop ----------
let page = await browser.newPage();
watch(page);
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => { try { localStorage.removeItem('ff4-lite'); localStorage.removeItem('ff4-motion'); sessionStorage.setItem('ff4-seen', '1'); } catch (e) {} });
await boot(page);
const dims = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight }));
log.push(`page length: ${dims.h}px = ${(dims.h / dims.vh).toFixed(2)} screens (about ${(dims.h / dims.vh - 1).toFixed(1)} scrolls)`);
log.push('tier: ' + (await page.evaluate(() => document.documentElement.dataset.tier)));

// crystal: hold and release changes the word
const w1 = await page.$eval('#word', (e) => e.textContent);
const box = await (await page.$('#stage')).boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await sleep(1500);
await page.screenshot({ path: 'shots/v4u-0-charge.png', clip: { x: box.x, y: 0, width: box.width, height: 900 } });
await page.mouse.up();
await sleep(1300);
const w2 = await page.$eval('#word', (e) => e.textContent);
log.push(`hold + release: word "${w1}" -> "${w2}" (changed: ${w1 !== w2})`);
log.push('hint hidden after first release: ' + (await page.$eval('#hint', (e) => e.classList.contains('done'))));

// popups
const shot = async (sel, name, extra = 900) => {
  await page.click(sel);
  await sleep(extra);
  await page.screenshot({ path: `shots/v4u-${name}.png` });
};
await page.evaluate(() => { const s = document.getElementById('journey'); scrollTo(0, s.getBoundingClientRect().top + scrollY + 0.44 * (s.offsetHeight - innerHeight)); });
await sleep(2200);
log.push('chapter showing: ' + (await page.$eval('.chap.on .chap-verb', (e) => e.getAttribute('aria-label'))));
await shot('.chap.on .chap-btn', '1-domain');
log.push('sheet open: ' + (await page.$eval('#sheet', (e) => !e.hidden && e.classList.contains('open'))));
await page.keyboard.press('Escape');
await sleep(700);
log.push('sheet closed by Escape: ' + (await page.$eval('#sheet', (e) => e.hidden)));
await page.evaluate(() => document.querySelector('#work').scrollIntoView());
await sleep(900);
await shot('[data-open="project:vision-core"]', '2-project');
await page.keyboard.press('Escape');
await sleep(700);
await page.evaluate(() => document.querySelector('#crew').scrollIntoView());
await sleep(900);
await shot('[data-open="crew"]', '3-crew');
await page.keyboard.press('Escape');
await sleep(700);
await page.evaluate(() => document.querySelector('#join').scrollIntoView());
await sleep(900);
await shot('[data-open="faq"]', '4-faq');
await page.click('.faq details:nth-child(1) summary');
await sleep(500);
log.push('faq answer opens: ' + (await page.$eval('.faq details:nth-child(1)', (e) => e.open)));
await page.keyboard.press('Escape');
await sleep(700);
await page.click('[data-open="soon:CLI"]');
await sleep(800);
log.push('CLI popup title: ' + (await page.$eval('#sheet-title', (e) => e.textContent)));
await page.keyboard.press('Escape');
await sleep(700);

// motion toggle -> static crystal
await page.click('#t-motion');
await sleep(900);
log.push('motion off -> tier ' + (await page.evaluate(() => document.documentElement.dataset.tier)) + ', canvas present: ' + !!(await page.$('.crystal-canvas')));
await page.click('#t-motion');
await sleep(1500);
log.push('motion on -> tier ' + (await page.evaluate(() => document.documentElement.dataset.tier)));
await page.close();

// ---------- weak device: lite mode forced, no 3D file should be requested ----------
page = await browser.newPage();
watch(page);
await page.setViewport({ width: 1440, height: 900 });
const reqs = [];
page.on('request', (r) => reqs.push(r.url()));
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('ff4-lite', 'on'); sessionStorage.setItem('ff4-seen', '1'); } catch (e) {} });
await boot(page);
const threeLoaded = reqs.some((u) => /crystal-/.test(u));
log.push(`lite mode on: tier ${await page.evaluate(() => document.documentElement.dataset.tier)}, 3D file requested: ${threeLoaded}, canvas: ${!!(await page.$('.crystal-canvas'))}`);
await page.screenshot({ path: 'shots/v4u-5-lite.png' });
const sb = await (await page.$('#stage')).boundingBox();
await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
await page.mouse.down();
await sleep(1400);
await page.mouse.up();
await sleep(1200);
log.push('lite: hold + release still cycles the word: ' + (await page.$eval('#word', (e) => e.textContent)));
await page.close();

// ---------- mobile ----------
page = await browser.newPage();
watch(page);
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => { try { localStorage.removeItem('ff4-lite'); sessionStorage.setItem('ff4-seen', '1'); } catch (e) {} });
await boot(page);
const md = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight, ov: document.documentElement.scrollWidth - innerWidth }));
log.push(`mobile page length: ${(md.h / md.vh).toFixed(2)} screens, horizontal overflow: ${md.ov}px`);
await page.screenshot({ path: 'shots/v4m-0-hero.png' });
const pos = ['#journey', '#work', '#crew', '#join'];
for (let i = 0; i < pos.length; i++) {
  await page.evaluate((s) => document.querySelector(s).scrollIntoView(), pos[i]);
  await sleep(1300);
  await page.screenshot({ path: `shots/v4m-${i + 1}-${pos[i].slice(1)}.png` });
}
await page.evaluate(() => scrollTo(0, 0));
await sleep(500);
await page.tap('.hd-burger');
await sleep(900);
await page.screenshot({ path: 'shots/v4m-5-menu.png' });
await page.tap('[data-menu-link]:nth-of-type(1)');
await sleep(1500);
log.push('menu link navigates: scrollY = ' + (await page.evaluate(() => Math.round(scrollY))));
await page.evaluate(() => { const s = document.getElementById('journey'); scrollTo(0, s.getBoundingClientRect().top + scrollY + 0.8 * (s.offsetHeight - innerHeight)); });
await sleep(2000);
await page.tap('.chap.on .chap-btn');
await sleep(1000);
await page.screenshot({ path: 'shots/v4m-6-sheet.png' });
await browser.close();
console.log(log.join('\n'));
console.log('errors', errors);
