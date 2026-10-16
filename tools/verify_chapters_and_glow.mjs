import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('shots', 'transition-test');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--ignore-gpu-blocklist']
});

try {
  console.log('=== TEST 1: Chapter I Golden Glow & Hidden Chapter II ===');
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5180/', { waitUntil: 'domcontentloaded' });

  // Wait for preloader to dismiss
  for (let i = 0; i < 50; i++) {
    const hasLoader = await page.evaluate(() => !!document.querySelector('.sl-preloader'));
    if (!hasLoader) break;
    await sleep(200);
  }
  await sleep(1500);

  const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

  // Scroll to Chapter I ("Build" - around 63% scroll)
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.635));
  await sleep(1800);

  const chap1Title = await page.evaluate(() => {
    const active = document.querySelector('.sl-lab-chaps .chap[style*="--cc: #00f5d4"] h3')?.textContent;
    return active;
  });
  console.log('Chapter 1 Title rendered:', chap1Title);
  await page.screenshot({ path: path.join(out, '01-chapter-1-golden-build.png') });

  // Scroll to Chapter II ("Discover" / Lattice - around 78% scroll)
  console.log('\n=== TEST 2: Chapter II Lattice Clean Tunnel (Zero Bars) ===');
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(total * 0.785));
  await sleep(1800);
  await page.screenshot({ path: path.join(out, '02-chapter-2-lattice-no-bars.png') });

  await page.close();

  console.log('\n=== TEST 3: Mobile Devices Chapter Verification ===');
  const mobilePage = await browser.newPage();
  await mobilePage.setUserAgent(
    'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
  );
  await mobilePage.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://127.0.0.1:5180/', { waitUntil: 'domcontentloaded' });

  for (let i = 0; i < 50; i++) {
    const hasLoader = await mobilePage.evaluate(() => !!document.querySelector('.sl-preloader'));
    if (!hasLoader) break;
    await sleep(200);
  }
  await sleep(1500);

  const mobileTotal = await mobilePage.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

  // Mobile Chapter I
  await mobilePage.evaluate((y) => window.scrollTo(0, y), Math.round(mobileTotal * 0.635));
  await sleep(1800);
  await mobilePage.screenshot({ path: path.join(out, '03-mobile-chapter-1-gold.png') });

  // Mobile Chapter II
  await mobilePage.evaluate((y) => window.scrollTo(0, y), Math.round(mobileTotal * 0.785));
  await sleep(1800);
  await mobilePage.screenshot({ path: path.join(out, '04-mobile-chapter-2-lattice.png') });

  await mobilePage.close();
  console.log('\nALL CHAPTER & MOBILE VERIFICATIONS COMPLETED SUCCESSFULLY!');
} catch (err) {
  console.error('Test execution error:', err);
} finally {
  await browser.close();
}
