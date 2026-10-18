import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const base = process.env.BASE || 'http://127.0.0.1:4174';
const ffmpegPath = 'C:/Users/muthu/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe';
const outDir = path.resolve('..', 'videos');
const tempDir = path.join(outDir, '.tmp_v1');
const finalMp4 = path.join(outDir, 'firefly-v1-showcase.mp4');

fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

console.log('[v1-recorder] Launching browser...');
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-v1-tools',
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

console.log('[v1-recorder] Navigating to v1...');
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await cdp.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 90,
  everyNthFrame: 1,
  maxWidth: 1280,
  maxHeight: 720
});

// 1. Record Loader (takes ~3s to reach 100%)
console.log('[v1-recorder] Step 1: Recording loader sequence...');
await sleep(3500);

// 2. Hero: 3D Cyan crystal rotating in interactive 3D space
console.log('[v1-recorder] Step 2: Showcasing 3D cyan crystal interaction...');
await sleep(1500);
// Orbit mouse smoothly in circle to trigger 3D crystal rotation and transmission
const cx = 640;
const cy = 360;
for (let a = 0; a < Math.PI * 3; a += 0.22) {
  const mx = cx + Math.cos(a) * 260;
  const my = cy + Math.sin(a) * 160;
  await page.mouse.move(mx, my);
  await sleep(35);
}
await sleep(1000);

// 3. Scroll through Home page sections
console.log('[v1-recorder] Step 3: Scrolling through Home page sections...');
const totalH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

// Scroll to Pillars
await smoothScroll(0, Math.min(totalH, 900), 2500);
await sleep(1500);

// Scroll to Domains & Numbers
await smoothScroll(900, Math.min(totalH, 1900), 2500);
await sleep(1500);

// Scroll to Life in Lab & Footer
await smoothScroll(1900, totalH, 2500);
await sleep(1500); // Highlight gold creator credit in footer

// Scroll smoothly back to top
await smoothScroll(totalH, 0, 2200);
await sleep(1000);

// 4. Domains page
console.log('[v1-recorder] Step 4: Navigating to Domains page...');
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('nav button'));
  const d = btns.find((b) => b.textContent.includes('Domains'));
  if (d) d.click();
});
await sleep(1800);
const domH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(domH, 800), 2200);
await sleep(1200);
await smoothScroll(Math.min(domH, 800), 0, 1500);
await sleep(800);

// 5. Work (Projects) page
console.log('[v1-recorder] Step 5: Navigating to Projects page...');
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('nav button'));
  const p = btns.find((b) => b.textContent.includes('Work'));
  if (p) p.click();
});
await sleep(1800);
// Hover on cards and show mockup badges
await smoothMouseMove(300, 350, 600, 350, 800);
await sleep(600);
await smoothMouseMove(600, 350, 900, 350, 800);
await sleep(600);
const projH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(projH, 700), 2200);
await sleep(1200);
await smoothScroll(Math.min(projH, 700), 0, 1500);
await sleep(800);

// 6. Interactive Terminal / CLI portal
console.log('[v1-recorder] Step 6: Opening CLI Terminal portal...');
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('nav button'));
  const cli = btns.find((b) => b.textContent.includes('CLI'));
  if (cli) cli.click();
});
await sleep(1800);
// Type commands in terminal
try {
  await page.keyboard.type('help', { delay: 90 });
  await page.keyboard.press('Enter');
  await sleep(1200);
  await page.keyboard.type('about', { delay: 90 });
  await page.keyboard.press('Enter');
  await sleep(1500);
} catch (e) {}
// Close terminal
await page.keyboard.press('Escape');
await sleep(600);
await page.evaluate(() => {
  const closeBtn = document.querySelector('[aria-label="Close terminal"]') || document.querySelector('.terminal-close');
  if (closeBtn) closeBtn.click();
});
await sleep(1000);

// 7. Apply / Sign in Under Construction modal
console.log('[v1-recorder] Step 7: Opening Apply Now & Sign In modals...');
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('nav button'));
  const apply = btns.find((b) => b.textContent.includes('Apply Now'));
  if (apply) apply.click();
});
await sleep(2000);
// Close modal
await page.evaluate(() => {
  const mClose = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Understood') || b.textContent.includes('Close') || b.getAttribute('aria-label') === 'Close');
  if (mClose) mClose.click();
});
await sleep(1000);

// 8. Team (Fellows) page
console.log('[v1-recorder] Step 8: Navigating to Team (Fellows) page...');
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('nav button'));
  const t = btns.find((b) => b.textContent.includes('Fellows'));
  if (t) t.click();
});
await sleep(1800);
const teamH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(teamH, 900), 2500);
await sleep(1200);
await smoothScroll(Math.min(teamH, 900), 0, 1800);
await sleep(800);

// 9. Return Home
console.log('[v1-recorder] Step 9: Returning to Home (Vision)...');
await page.evaluate(() => {
  const brand = document.querySelector('nav button');
  if (brand) brand.click();
});
await sleep(2000);

// Stop screencast
console.log(`[v1-recorder] Stopping screencast. Total frames captured: ${frameCount}`);
await cdp.send('Page.stopScreencast');
await sleep(1000);
await browser.close();

// Wait for all disk writes to complete
console.log('[v1-recorder] Flushing all frames to disk...');
await Promise.all(writePromises);
console.log(`[v1-recorder] All ${frameCount} frames saved successfully.`);

// Compile with ffmpeg
console.log('[v1-recorder] Encoding MP4 video with FFmpeg (CRF 18)...');
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
console.log(`[v1-recorder] SUCCESS: ${finalMp4} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);

// Clean temp frames immediately
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('[v1-recorder] Cleaned up temp frames.');
