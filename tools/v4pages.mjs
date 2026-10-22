import puppeteer from 'puppeteer-core';
// Regression test for FireFly v4 (preview on 4500): every page, header navigation, history, deep links, the crystal,
// lite mode (no 3D downloaded), the motion switch, the menu on phones, horizontal overflow, console errors.
const base = process.env.BASE || 'http://127.0.0.1:4500';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
const log = [];
const watch = (page) => {
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(m.type() + ': ' + m.text().slice(0, 200)));
};
const fresh = async (page, extra = () => {}) => {
  await page.evaluateOnNewDocument((fn) => {
    try { localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem('ff4-seen', '1'); eval('(' + fn + ')()'); } catch (e) {}
  }, extra.toString());
};
const ready = async (page) => { await page.waitForFunction('window.__ffReady === true', { timeout: 30000 }); await sleep(1500); };

// ---------- desktop ----------
let page = await browser.newPage();
watch(page);
await page.setViewport({ width: 1440, height: 900 });
await fresh(page);
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await ready(page);
log.push('home title: ' + (await page.title()));
log.push('home length: ' + (await page.evaluate(() => (document.documentElement.scrollHeight / innerHeight).toFixed(2))) + ' screens (' + (await page.evaluate(() => document.documentElement.scrollHeight)) + 'px)');
log.push('tier: ' + (await page.evaluate(() => document.documentElement.dataset.tier)));

// hold and release on the crystal
const w1 = await page.$eval('#word', (e) => e.textContent);
const box = await (await page.$('#stage')).boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await sleep(1500);
await page.mouse.up();
await sleep(1300);
log.push(`crystal hold + release: "${w1}" -> "${await page.$eval('#word', (e) => e.textContent)}"`);

// each header link
for (const [label, path] of [['About', '/about'], ['Domains', '/domains'], ['Events', '/events'], ['Projects', '/projects'], ['Team', '/team'], ['Partners', '/partners']]) {
  await page.click(`.hd-nav a[data-nav="${path}"]`);
  await sleep(1700);
  const got = await page.evaluate(() => ({ p: location.pathname, t: document.title, h: document.querySelector('h1')?.textContent.trim().slice(0, 40), cur: document.querySelector('.hd-nav a[aria-current]')?.textContent }));
  log.push(`${label}: url ${got.p}, h1 "${got.h}", active "${got.cur}", title "${got.t}"`);
}
// the team page: seventeen equal cards, one gold
log.push('team cards: ' + (await page.$$eval('.person', (l) => l.length)) + ', gold: ' + (await page.$$eval('.person.creator', (l) => l.map((x) => x.querySelector('h3').textContent))));
const sizes = await page.$$eval('.person', (l) => [...new Set(l.map((x) => Math.round(x.getBoundingClientRect().width) + 'x' + Math.round(x.getBoundingClientRect().height)))]);
log.push('team card sizes seen: ' + sizes.join(' | '));

// history
await page.goBack();
await sleep(1500);
log.push('back button -> ' + (await page.evaluate(() => location.pathname)));
await page.goForward();
await sleep(1500);
log.push('forward button -> ' + (await page.evaluate(() => location.pathname)));

// footer links, join, cli, sign in, sign up, unknown page
for (const path of ['/join', '/cli', '/signin', '/signup', '/does-not-exist']) {
  await page.evaluate((p) => { const a = document.createElement('a'); a.href = p; a.id = 'tmp'; document.body.appendChild(a); a.click(); a.remove(); }, path);
  await sleep(1700);
  log.push(`${path}: h1 "${await page.evaluate(() => document.querySelector('h1')?.textContent.trim())}", under construction notice: ${!!(await page.$('.uc'))}`);
}
await page.screenshot({ path: 'shots/v4p-404.png' });
// deep link
await page.goto(base + '/team', { waitUntil: 'networkidle2' });
await ready(page);
log.push('deep link /team loads: h1 "' + (await page.evaluate(() => document.querySelector('h1')?.textContent.trim())) + '"');
// motion switch re-renders in place
await page.evaluate(() => document.querySelector('#t-motion').scrollIntoView());
await page.click('#t-motion');
await sleep(600);
log.push('motion off: html.calm = ' + (await page.evaluate(() => document.documentElement.classList.contains('calm'))) + ', cards visible = ' + (await page.$$eval('.person', (l) => l.every((x) => getComputedStyle(x).opacity === '1'))));
await page.click('#t-motion');
await page.close();

// ---------- lite mode: the 3D files must never be requested ----------
page = await browser.newPage();
watch(page);
await page.setViewport({ width: 1440, height: 900 });
const reqs = [];
page.on('request', (r) => reqs.push(r.url()));
await fresh(page, () => localStorage.setItem('ff4-lite', 'on'));
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await ready(page);
log.push(`lite mode: tier ${await page.evaluate(() => document.documentElement.dataset.tier)}, three.js requested: ${reqs.some((u) => /three|crystal-|journey-scene/.test(u))}`);
const sb = await (await page.$('#stage')).boundingBox();
const wl = await page.$eval('#word', (e) => e.textContent);
await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
await page.mouse.down();
await sleep(1400);
await page.mouse.up();
await sleep(1200);
log.push(`lite: hold + release "${wl}" -> "${await page.$eval('#word', (e) => e.textContent)}"`);
await page.close();

// ---------- phone ----------
page = await browser.newPage();
watch(page);
await page.setUserAgent('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await fresh(page);
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await ready(page);
await page.screenshot({ path: 'shots/v4m-home.png' });
log.push('phone home length: ' + (await page.evaluate(() => (document.documentElement.scrollHeight / innerHeight).toFixed(2))) + ' screens');
await page.tap('.hd-burger');
await sleep(900);
await page.screenshot({ path: 'shots/v4m-menu.png' });
await page.tap('.menu-list li:nth-child(6) a');
await sleep(2200);
log.push('phone menu -> ' + (await page.evaluate(() => location.pathname)) + ', menu closed: ' + (await page.$eval('#sheet', (e) => e.hidden)));
const overflow = {};
for (const p of ['/', '/about', '/domains', '/events', '/projects', '/team', '/partners', '/join', '/cli', '/signin']) {
  await page.evaluate((x) => { const a = document.createElement('a'); a.href = x; document.body.appendChild(a); a.click(); a.remove(); }, p);
  await sleep(1600);
  const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (o !== 0) overflow[p] = o;
  if (p === '/team') await page.screenshot({ path: 'shots/v4m-team.png' });
  if (p === '/domains') await page.screenshot({ path: 'shots/v4m-domains.png' });
}
log.push('phone horizontal overflow (px) by page: ' + JSON.stringify(overflow));
await browser.close();
console.log(log.join('\n'));
console.log('errors', errors);
