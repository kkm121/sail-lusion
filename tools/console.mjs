import puppeteer from 'puppeteer-core';

const sleep = (t) => new Promise((r) => setTimeout(r, t));
const mode = process.argv[2] || 'desktop';
const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.setDefaultNavigationTimeout(180000);
page.setDefaultTimeout(180000);
if (mode === 'mobile') {
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; 2201122C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: 412, height: 860, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 900 });
}
const seen = new Map();
page.on('console', (m) => {
  if (!['warning', 'error'].includes(m.type())) return;
  const k = `${m.type()}: ${m.text().slice(0, 220)}`;
  seen.set(k, (seen.get(k) || 0) + 1);
});
page.on('pageerror', (e) => seen.set(`pageerror: ${e.message.slice(0, 220)}`, 1));
page.on('requestfailed', (r) => seen.set(`requestfailed: ${r.url().slice(0, 160)}`, 1));
page.on('response', (r) => {
  if (r.status() >= 400) seen.set(`http ${r.status()}: ${r.url().slice(0, 160)}`, 1);
});

for (const url of ['/', '/about', '/domains', '/domains/technical', '/projects', '/projects/sail-vision-core']) {
  await page.goto(`${process.env.BASE || 'http://127.0.0.1:5180'}${url}`, { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 120; i++) {
    if (!(await page.evaluate(() => !!document.querySelector('.sl-pre')))) break;
    await sleep(250);
  }
  await sleep(1500);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < Math.min(h, 16000); y += 900) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(120);
  }
  await sleep(500);
}
console.log(seen.size ? [...seen].map(([k, n]) => `${n}x ${k}`).join('\n') : 'no warnings, errors or failed requests');
await browser.close();
