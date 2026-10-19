import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('shots', 'mobile-verify');
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist']
});

const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() === 'error') problems.push('console error: ' + m.text());
});

// Emulate iPhone 14 Pro
await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

console.log('Navigating to http://127.0.0.1:5180/ ...');
await page.goto('http://127.0.0.1:5180/', { waitUntil: 'domcontentloaded' });
await sleep(1500);

// Dismiss preloader if present
for (let i = 0; i < 40; i++) {
  const hasPreloader = await page.evaluate(() => !!document.querySelector('.sl-preloader'));
  if (!hasPreloader) break;
  await sleep(200);
}
await sleep(1500);

console.log('--- TEST 1: Checking Mobile Lab Intro Overlap ---');
const labMetrics = await page.evaluate(() => {
  const lab = document.querySelector('#lab');
  const box = lab ? lab.getBoundingClientRect() : null;
  return {
    top: box ? box.top + window.scrollY : 0,
    height: box ? box.height : 0
  };
});

// Scroll to Lab intro entry
await page.evaluate((y) => window.scrollTo(0, y), Math.round(labMetrics.top + 50));
await sleep(800);

const overlapCheck = await page.evaluate(() => {
  const h2 = document.querySelector('.sl-lab-intro h2');
  const copy = document.querySelector('.sl-lab-intro .copy');
  const dev = document.querySelector('.sl-lab-device');
  const h2Box = h2 ? h2.getBoundingClientRect() : null;
  const copyBox = copy ? copy.getBoundingClientRect() : null;
  const devBox = dev ? dev.getBoundingClientRect() : null;
  return {
    h2Bottom: h2Box ? h2Box.bottom : 0,
    copyBottom: copyBox ? copyBox.bottom : 0,
    deviceTop: devBox ? devBox.top : 0,
    clearance: devBox && copyBox ? devBox.top - copyBox.bottom : null
  };
});
console.log('Overlap check metrics:', overlapCheck);
await page.screenshot({ path: path.join(outDir, '01-lab-intro-clearance.png') });

console.log('--- TEST 2: Checking Chapter III Corridor (No White Strip at Bottom) ---');
// Scroll to Chapter 3 (Spatial Design / Create room, around progress ~ 0.8)
const totalScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await page.evaluate((y) => window.scrollTo(0, y), Math.round(labMetrics.top + labMetrics.height * 0.78));
await sleep(1200);
await page.screenshot({ path: path.join(outDir, '02-chapter3-create-corridor.png') });

const bottomColor = await page.evaluate(() => {
  const stage = document.querySelector('.sl-lab-stage');
  const stageBox = stage ? stage.getBoundingClientRect() : null;
  const lab = document.querySelector('#lab');
  return {
    stageHeight: stageBox ? stageBox.height : 0,
    windowHeight: window.innerHeight,
    stageBottom: stageBox ? stageBox.bottom : 0,
    labBg: lab ? getComputedStyle(lab).backgroundColor : null,
    stageBg: stage ? getComputedStyle(stage).backgroundColor : null
  };
});
console.log('Bottom / Stage metrics:', bottomColor);

console.log('--- TEST 3: Checking 1-Second Bye Wave Stop ---');
// Scroll to wave position (~ 0.970)
const yWave = Math.round(labMetrics.top + labMetrics.height * 0.970);
await page.evaluate((y) => window.scrollTo(0, y), yWave);
await sleep(300);

const lockStatus1 = await page.evaluate((yW) => {
  const currentY = window.scrollY;
  // Try to force scroll past yWave immediately
  window.scrollTo(0, yW + 500);
  return {
    initialY: currentY,
    afterAttemptY: window.scrollY
  };
}, yWave);
console.log('Lock status during 1s pause window:', lockStatus1);

// Capture robot waving screenshot
await sleep(400);
await page.screenshot({ path: path.join(outDir, '03-robot-waving.png') });

// Wait for the 1.0 second pause to elapse
console.log('Waiting for 1s pause to finish...');
await sleep(1100);

const lockStatus2 = await page.evaluate((yW) => {
  // Try scrolling down again after 1.1s
  window.scrollTo(0, yW + 500);
  return {
    afterElapsedY: window.scrollY
  };
}, yWave);
console.log('Lock status after 1.1s (should unlock):', lockStatus2);
await sleep(600);
await page.screenshot({ path: path.join(outDir, '04-unlocked-after-bye.png') });

console.log('All tests finished. Problems:', JSON.stringify(problems));
await browser.close();
