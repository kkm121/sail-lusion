import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('shots', 'transition-test');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const PORT = process.env.TEST_PORT || process.env.PORT || '4600';
await page.goto(`http://127.0.0.1:${PORT}/v2/`, { waitUntil: 'domcontentloaded' });

for (let i = 0; i < 50; i++) {
  const hasLoader = await page.evaluate(() => !!document.querySelector('.sl-preloader'));
  if (!hasLoader) break;
  await sleep(200);
}
await sleep(1500);

const testPoints = [
  { name: 'chap1-gold-mid', p: 0.68 },
  { name: 'chap1-handover-exit', p: 0.74 },
  { name: 'chap2-lattice-mid', p: 0.80 },
  { name: 'chap3-room-mid', p: 0.87 }
];

for (const tp of testPoints) {
  await page.evaluate((targetP) => {
    const lab = document.querySelector('#lab');
    const rect = lab.getBoundingClientRect();
    const labTop = rect.top + window.scrollY;
    const scrollTarget = labTop + targetP * (lab.offsetHeight - window.innerHeight);
    window.scrollTo(0, scrollTarget);
  }, tp.p);
  await sleep(2000);
  await page.screenshot({ path: path.join(out, `${tp.name}.png`) });
  console.log('Saved', tp.name);
}

console.log('=== MOBILE TESTS ===');
const mPage = await browser.newPage();
await mPage.setUserAgent('Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
await mPage.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await mPage.goto(`http://127.0.0.1:${PORT}/v2/`, { waitUntil: 'domcontentloaded' });

for (let i = 0; i < 50; i++) {
  const hasLoader = await mPage.evaluate(() => !!document.querySelector('.sl-preloader'));
  if (!hasLoader) break;
  await sleep(200);
}
await sleep(1500);

for (const tp of testPoints) {
  await mPage.evaluate((targetP) => {
    const lab = document.querySelector('#lab');
    const rect = lab.getBoundingClientRect();
    const labTop = rect.top + window.scrollY;
    const scrollTarget = labTop + targetP * (lab.offsetHeight - window.innerHeight);
    window.scrollTo(0, scrollTarget);
  }, tp.p);
  await sleep(2000);
  await mPage.screenshot({ path: path.join(out, `mobile-${tp.name}.png`) });
  console.log('Saved mobile', tp.name);
}
await mPage.close();

await browser.close();
console.log('Done test points.');
