import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const base = process.env.BASE || 'http://127.0.0.1:4190';
const ffmpegPath = 'C:/Users/muthu/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe';
const outDir = path.resolve('..', 'videos');
const tempDir = path.join(outDir, '.tmp_v3');
const finalMp4 = path.join(outDir, 'firefly-v3-showcase.mp4');

fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

console.log('[v3-recorder] Launching browser...');
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-v3-tools',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--ignore-gpu-blocklist',
    '--enable-gpu-rasterization',
    '--enable-zero-copy',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ]
});

const page = await browser.newPage();
page.setDefaultTimeout(180000);
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(fromY, toY, durationMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < durationMs) {
    const k = Math.min(1, (Date.now() - t0) / durationMs);
    const ease = 0.5 * (1 - Math.cos(Math.PI * k));
    const y = fromY + (toY - fromY) * ease;
    await page.evaluate((val) => window.scrollTo(0, val), y);
    await sleep(16);
  }
  await page.evaluate((val) => window.scrollTo(0, val), toY);
  await sleep(120);
}

async function smoothMouseMove(x1, y1, x2, y2, durationMs) {
  const steps = Math.max(12, Math.floor(durationMs / 25));
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const ease = 0.5 * (1 - Math.cos(Math.PI * k));
    const x = x1 + (x2 - x1) * ease;
    const y = y1 + (y2 - y1) * ease;
    await page.mouse.move(x, y);
    await sleep(durationMs / steps);
  }
}

const cdp = await page.createCDPSession();
let frameCount = 0;
const writePromises = [];

cdp.on('Page.screencastFrame', (e) => {
  const cur = frameCount++;
  cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {});
  const fpath = path.join(tempDir, `f${String(cur).padStart(5, '0')}.jpg`);
  writePromises.push(fs.promises.writeFile(fpath, Buffer.from(e.data, 'base64')));
});

console.log('[v3-recorder] Navigating to v3...');
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await cdp.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 90,
  everyNthFrame: 1,
  maxWidth: 1280,
  maxHeight: 720
});

await sleep(1800);

// 1. Dynamic Hero: living sky, WebGL fluid simulation swirls, cursor ember trail, text scramble & char rise
console.log('[v3-recorder] Step 1: Showcasing Dynamic Hero, Fluid Simulation & Cursor Ember Trail...');
// Swirl mouse across hero to trigger WebGL fluid splats and demonstrate custom cursor with ember spark trail
for (let a = 0; a < Math.PI * 3; a += 0.22) {
  const mx = 640 + Math.cos(a) * 280;
  const my = 340 + Math.sin(a) * 160;
  await page.mouse.move(mx, my);
  await sleep(35);
}
await sleep(1000);

// Hover over navbar links to show spring sliding pill and bird flap
console.log('[v3-recorder] Step 2: Showcasing Header spring sliding pill & brand bird hover...');
const navLinks = ['a[href="/about"]', 'a[href="/domains"]', 'a[href="/events"]', 'a[href="/projects"]', 'a[href="/signin"]', 'a[href="/cli"]'];
for (const sel of navLinks) {
  const el = await page.$(sel);
  if (el) {
    const box = await el.boundingBox();
    if (box) {
      await smoothMouseMove(640, 360, box.x + box.width / 2, box.y + box.height / 2, 400);
      await sleep(300);
    }
  }
}
await sleep(800);

// Total scrollable height
const totalH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

// 2. Scroll to Pillars & Ambient Watercolor Background
console.log('[v3-recorder] Step 3: Scrolling through Pillars & Page-wide WebGL Ambient background...');
await smoothScroll(0, Math.min(totalH, 1200), 3000);
await sleep(1500);
// Move cursor to showcase dot-grid lens and firefly repulsion in Ambient layer
for (let a = 0; a < Math.PI * 2; a += 0.3) {
  await page.mouse.move(640 + Math.cos(a) * 200, 360 + Math.sin(a) * 120);
  await sleep(40);
}
await sleep(800);

// 3. Scroll to "Life in the club": scroll-scrubbed text & side-popping image gallery
console.log('[v3-recorder] Step 4: Showcasing "Life in the club" scroll-scrubbed reveal and side-pop images...');
const lifeY = await page.evaluate(() => {
  const el = document.querySelector('.life-sec');
  return el ? el.offsetTop - 100 : 2200;
});
await smoothScroll(1200, Math.min(totalH, lifeY), 2500);
await sleep(1200);

// Slowly scrub through the side-pop gallery so the flying images pop in from left & right
await smoothScroll(lifeY, Math.min(totalH, lifeY + 1400), 4500);
await sleep(1800);

// 4. Scroll to Domain Deck & DragRail
console.log('[v3-recorder] Step 5: Showcasing Domain Deck & DragRail carousel...');
const deckY = await page.evaluate(() => {
  const el = document.querySelector('.deck-sticky') || document.querySelector('.rail-track');
  return el ? el.getBoundingClientRect().top + window.scrollY - 100 : 4500;
});
await smoothScroll(lifeY + 1400, Math.min(totalH, deckY), 3000);
await sleep(1500);

// Drag the DragRail horizontally to show momentum and rubber-band physics
console.log('[v3-recorder] Demonstrating DragRail horizontal drag with momentum...');
await page.mouse.move(800, 420);
await page.mouse.down();
await sleep(100);
for (let x = 800; x >= 400; x -= 20) {
  await page.mouse.move(x, 420);
  await sleep(20);
}
await page.mouse.up();
await sleep(1500);

// 5. Scroll through Timeline, Achievements, and Dynamic JoinBand
console.log('[v3-recorder] Step 6: Scrolling to Timeline, Crew, and Dynamic JoinBand...');
const joinY = await page.evaluate(() => {
  const el = document.querySelector('.join-band');
  return el ? el.offsetTop - 80 : totalH - 800;
});
await smoothScroll(deckY, Math.min(totalH, joinY), 3500);
await sleep(1500);

// Swirl cursor over JoinBand fluid backdrop
for (let a = 0; a < Math.PI * 2; a += 0.25) {
  await page.mouse.move(640 + Math.cos(a) * 250, 420 + Math.sin(a) * 120);
  await sleep(35);
}
await sleep(1000);

// 6. Scroll to Footer & Motion switch toggle
console.log('[v3-recorder] Step 7: Scrolling to Footer and demonstrating Motion Toggle & Gold credit...');
await smoothScroll(joinY, totalH, 2200);
await sleep(1200);

// Click Motion switch to show toggling
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('footer button')).find((b) => b.textContent.includes('MOTION'));
  if (btn) btn.click();
});
await sleep(1500);
// Click back on
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('footer button')).find((b) => b.textContent.includes('MOTION'));
  if (btn) btn.click();
});
await sleep(1200);

// 7. Inner Pages Walkthrough
// /about
console.log('[v3-recorder] Step 8: Navigating to About page...');
await page.goto(base + '/about', { waitUntil: 'networkidle2' });
await sleep(1500);
const abH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(abH, 900), 2200);
await sleep(1000);

// /domains
console.log('[v3-recorder] Step 9: Navigating to Domains page...');
await page.goto(base + '/domains', { waitUntil: 'networkidle2' });
await sleep(1500);
const domH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(domH, 800), 2200);
await sleep(1000);

// /projects & /projects/vision-core
console.log('[v3-recorder] Step 10: Navigating to Projects page...');
await page.goto(base + '/projects', { waitUntil: 'networkidle2' });
await sleep(1500);
const projH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(projH, 800), 2200);
await sleep(1000);

console.log('[v3-recorder] Navigating to Project Detail (/projects/vision-core)...');
await page.goto(base + '/projects/vision-core', { waitUntil: 'networkidle2' });
await sleep(1500);
const projDetH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(projDetH, 600), 1800);
await sleep(1000);

// /events
console.log('[v3-recorder] Step 11: Navigating to Events page...');
await page.goto(base + '/events', { waitUntil: 'networkidle2' });
await sleep(1500);
const evH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(evH, 700), 2000);
await sleep(1000);

// /team & /partners & /join
console.log('[v3-recorder] Step 12: Navigating to Team, Partners, and Join...');
await page.goto(base + '/team', { waitUntil: 'networkidle2' });
await sleep(1500);
await page.goto(base + '/partners', { waitUntil: 'networkidle2' });
await sleep(1500);
await page.goto(base + '/join', { waitUntil: 'networkidle2' });
await sleep(1500);

// /signin (Under Construction)
console.log('[v3-recorder] Step 13: Navigating to Sign In under-construction portal...');
await page.goto(base + '/signin', { waitUntil: 'networkidle2' });
await sleep(2000);
await page.mouse.move(640, 380);
await sleep(1200);

// /signup (Under Construction)
console.log('[v3-recorder] Step 14: Navigating to Sign Up under-construction portal...');
await page.goto(base + '/signup', { waitUntil: 'networkidle2' });
await sleep(2000);
await page.mouse.move(640, 400);
await sleep(1200);

// /cli (Interactive CRT Terminal)
console.log('[v3-recorder] Step 15: Navigating to Interactive CLI workstation terminal...');
await page.goto(base + '/cli', { waitUntil: 'networkidle2' });
await sleep(2500); // let auto-typing firefly --help finish
try {
  await page.keyboard.type('about', { delay: 90 });
  await page.keyboard.press('Enter');
  await sleep(1200);
  await page.keyboard.type('domains', { delay: 90 });
  await page.keyboard.press('Enter');
  await sleep(1200);
  await page.keyboard.type('projects', { delay: 90 });
  await page.keyboard.press('Enter');
  await sleep(1500);
} catch (e) {}

// Return to Home
console.log('[v3-recorder] Step 16: Returning to Home...');
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await sleep(2000);

console.log(`[v3-recorder] Stopping screencast. Total frames captured: ${frameCount}`);
await cdp.send('Page.stopScreencast');
await sleep(1000);
await browser.close();

// Wait for all disk writes to complete
console.log('[v3-recorder] Flushing all frames to disk...');
await Promise.all(writePromises);
console.log(`[v3-recorder] All ${frameCount} frames saved successfully.`);

// Compile with ffmpeg
console.log('[v3-recorder] Encoding MP4 video with FFmpeg (CRF 18)...');
execFileSync(ffmpegPath, [
  '-y',
  '-framerate', '30',
  '-i', path.join(tempDir, 'f%05d.jpg'),
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-preset', 'medium',
  '-crf', '18',
  '-movflags', '+faststart',
  finalMp4
]);

const stat = fs.statSync(finalMp4);
console.log(`[v3-recorder] SUCCESS: ${finalMp4} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);

// Clean temp frames immediately
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('[v3-recorder] Cleaned up temp frames.');
