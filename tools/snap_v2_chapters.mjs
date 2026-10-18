import puppeteer from 'puppeteer-core';
import path from 'node:path';

const outDir = 'C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools',
  args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

console.log('Navigating to v2...');
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.querySelector('.sl-preloader'), { timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

const totalH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

// 1. Chapter 1: Discover (Cyan Crystal)
console.log('Capturing Chapter 1: Discover...');
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: path.join(outDir, 'v2-discover-crystal.png') });

// 2. Chapter 2: Build (Golden lattice corridor)
console.log('Capturing Chapter 2: Build (Golden lattice corridor)...');
await page.evaluate((h) => window.scrollTo(0, h * 0.28), totalH);
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: path.join(outDir, 'v2-build-corridor.png') });

// 3. Chapter 3: Evolve (Floating 3D robot navigator)
console.log('Capturing Chapter 3: Evolve (Floating robot)...');
await page.evaluate((h) => window.scrollTo(0, h * 0.52), totalH);
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: path.join(outDir, 'v2-evolve-robot.png') });

// 4. Chapter 5: Join the club!
console.log('Capturing Chapter 5: Join the club...');
await page.evaluate((h) => window.scrollTo(0, h), totalH);
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: path.join(outDir, 'v2-join-club.png') });

await browser.close();
console.log('Done capturing v2 chapters!');
