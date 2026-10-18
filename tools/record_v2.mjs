import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const base = process.env.BASE || 'http://127.0.0.1:4173';
const ffmpegPath = 'C:/Users/muthu/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe';
const outDir = path.resolve('..', 'videos');
const tempDir = path.join(outDir, '.tmp_v2');
const finalMp4 = path.join(outDir, 'firefly-v2-showcase.mp4');

fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

console.log('[v2-recorder] Launching browser...');
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-v2-tools',
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
    // Smooth cosine easing
    const ease = 0.5 * (1 - Math.cos(Math.PI * k));
    const y = fromY + (toY - fromY) * ease;
    await page.evaluate((val) => {
      if (window.__lenis) {
        window.__lenis.scrollTo(val, { immediate: true });
      } else {
        window.scrollTo(0, val);
      }
    }, y);
    await sleep(16);
  }
  await page.evaluate((val) => {
    if (window.__lenis) window.__lenis.scrollTo(val, { immediate: true });
    else window.scrollTo(0, val);
  }, toY);
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
  // Acknowledge immediately so Chrome streams next frame with zero latency
  cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {});
  const fpath = path.join(tempDir, `f${String(cur).padStart(5, '0')}.jpg`);
  writePromises.push(fs.promises.writeFile(fpath, Buffer.from(e.data, 'base64')));
});

console.log('[v2-recorder] Navigating to v2 Home...');
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await cdp.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 90,
  everyNthFrame: 1,
  maxWidth: 1280,
  maxHeight: 720
});

// 1. Wait for preloader & compile gate
console.log('[v2-recorder] Step 1: Recording preloader...');
try {
  await page.waitForFunction(() => !document.querySelector('.sl-preloader'), { timeout: 60000 });
} catch (e) {}
await sleep(1500);

// 2. Chapter 1: Discover (Cyan crystal in warm dusk)
console.log('[v2-recorder] Step 2: Showcasing Chapter 1 Discover (Cyan crystal)...');
for (let a = 0; a < Math.PI * 2; a += 0.25) {
  const mx = 640 + Math.cos(a) * 220;
  const my = 360 + Math.sin(a) * 140;
  await page.mouse.move(mx, my);
  await sleep(40);
}
await sleep(1000);

// Total scrollable height
const totalH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

// 3. Scroll to Chapter 2: Build (Golden lattice corridor)
console.log('[v2-recorder] Step 3: Diving into Chapter 2 Build (Golden lattice corridor)...');
const ch2Y = totalH * 0.28;
await smoothScroll(0, ch2Y, 4000);
await sleep(1500);
// Subtle mouse move to highlight metallic reflections
await smoothMouseMove(640, 360, 480, 340, 800);
await sleep(400);
await smoothMouseMove(480, 340, 800, 380, 1000);
await sleep(1000);

// 4. Scroll to Chapter 3: Evolve (Floating 3D robot navigator in spatial room)
console.log('[v2-recorder] Step 4: Showcasing Chapter 3 Evolve (Floating 3D robot)...');
const ch3Y = totalH * 0.52;
await smoothScroll(ch2Y, ch3Y, 4500);
await sleep(2000);
// Move cursor to see floating robot react
for (let a = 0; a < Math.PI * 2; a += 0.35) {
  await page.mouse.move(640 + Math.cos(a) * 200, 360 + Math.sin(a) * 110);
  await sleep(45);
}
await sleep(1500);

// 5. Scroll to Chapter 4: Featured work (Mockup cards)
console.log('[v2-recorder] Step 5: Scrolling to Chapter 4 (Featured work mockups)...');
const ch4Y = totalH * 0.74;
await smoothScroll(ch3Y, ch4Y, 3500);
await sleep(1800);

// 6. Scroll to Chapter 5: Join the club! (Fluid simulation + giant bird + marquee + footer)
console.log('[v2-recorder] Step 6: Scrolling to End section (Join the club fluid simulation & footer)...');
await smoothScroll(ch4Y, totalH, 3500);
await sleep(1000);

// Swirl mouse across fluid backdrop behind Join the club!
for (let a = 0; a < Math.PI * 3; a += 0.25) {
  const mx = 640 + Math.cos(a) * 320;
  const my = 400 + Math.sin(a) * 160;
  await page.mouse.move(mx, my);
  await sleep(35);
}
await sleep(1500); // Highlight gold creator credit in footer

// 7. COMPREHENSIVE WALKTHROUGH OF /about (INCLUDING 3D PARTICLE TEXT TEAM STAGE)
console.log('[v2-recorder] Step 7: Navigating to About page (/about)...');
await page.goto(base + '/about', { waitUntil: 'networkidle2' });
await sleep(1500);

// 7a. About Hero & Statement
console.log('[v2-recorder] Showcasing About Hero and Statement...');
const abTotalH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

// Scroll down to the Statement section
await smoothScroll(0, 500, 2000);
await sleep(1000);

// 7b. Scroll to #core-team (3D Particle Text TeamStage)
console.log('[v2-recorder] Showcasing #core-team 3D Particle Text stage...');
const coreTeamY = await page.evaluate(() => {
  const el = document.getElementById('core-team');
  if (!el) return 1000;
  return el.getBoundingClientRect().top + window.scrollY;
});
await smoothScroll(500, coreTeamY + 50, 2500);
// Wait for TeamStage font & canvas to compile and fade in
await sleep(2200);

// Move mouse across Member 1: Aarya
console.log('[v2-recorder] Showing Member 01: Aarya (3D particle text repulsion)...');
await smoothMouseMove(450, 320, 820, 380, 1600);
await sleep(800);

// Click .sl-ts-next to advance to Member 2: Bedabrata Bhattacharjee
console.log('[v2-recorder] Advancing to Member 02: Bedabrata Bhattacharjee...');
await page.click('.sl-ts-next');
await sleep(1800);

// Click .sl-ts-next to advance to Member 3: Sai Srikanth
console.log('[v2-recorder] Advancing to Member 03: Sai Srikanth...');
await page.click('.sl-ts-next');
await sleep(1800);

// Click .sl-ts-next to advance to Member 4: M Muthu Kumaran (CREATOR in luminous GOLD particles!)
console.log('[v2-recorder] Advancing to Member 04: M Muthu Kumaran (Luminous Gold Particle Text)...');
await page.click('.sl-ts-next');
await sleep(2200);
// Move cursor through gold particle cloud
await smoothMouseMove(500, 300, 780, 400, 1500);
await sleep(1000);

// Click .sl-ts-next to advance to Member 5: Harshini
console.log('[v2-recorder] Advancing to Member 05: Harshini...');
await page.click('.sl-ts-next');
await sleep(1800);

// Click .sl-ts-next to advance to Member 6: THARUN (The requested view: [[ 06 ]] / 17, Technical Team Head)
console.log('[v2-recorder] Advancing to Member 06: THARUN (Exact view requested by user: [ 06 ] / 17)...');
await page.click('.sl-ts-next');
await sleep(2500);
// Dwell on THARUN and swirl cursor to demonstrate particle physics & falling rain
await smoothMouseMove(420, 330, 850, 370, 2000);
await sleep(1500);

// Click .sl-ts-next to advance to Member 7: Akash Priyan G
console.log('[v2-recorder] Advancing to Member 07: Akash Priyan G...');
await page.click('.sl-ts-next');
await sleep(1800);

// 7c. Scroll past #core-team into #crew (All 17 member cards grid)
console.log('[v2-recorder] Scrolling past 3D stage into Core Team card grid (#crew)...');
const crewY = await page.evaluate(() => {
  const el = document.getElementById('crew');
  return el ? el.getBoundingClientRect().top + window.scrollY - 80 : 3800;
});
await smoothScroll(coreTeamY + 50, crewY, 3000);
await sleep(2000);

// 7d. Scroll through Area of Expertise
console.log('[v2-recorder] Scrolling through Area of Expertise...');
const exY = await page.evaluate(() => {
  const el = document.querySelector('.sl-ex');
  return el ? el.getBoundingClientRect().top + window.scrollY - 80 : crewY + 1200;
});
await smoothScroll(crewY, exY, 2500);
await sleep(1500);

// 7e. Scroll through How to Join & FAQ accordion
console.log('[v2-recorder] Scrolling through Club Info & FAQ accordion...');
const ciY = await page.evaluate(() => {
  const el = document.querySelector('.sl-ci');
  return el ? el.getBoundingClientRect().top + window.scrollY - 80 : exY + 1200;
});
await smoothScroll(exY, ciY, 2500);
await sleep(1200);

// Toggle FAQ item
try {
  await page.click('.sl-ci-faq details summary');
  await sleep(1200);
} catch (e) {}

// 7f. Scroll to Marquee & Bottom Creator Credit
console.log('[v2-recorder] Scrolling to Tools dual-marquee & Bottom Creator Credit...');
await smoothScroll(ciY, abTotalH, 2500);
await sleep(2000);

// 8. Navigate to /domains
console.log('[v2-recorder] Step 8: Navigating to Domains page (/domains)...');
await page.goto(base + '/domains', { waitUntil: 'networkidle2' });
await sleep(1500);
const domH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(domH, 900), 2500);
await sleep(1200);

// 9. Navigate to /domains/vision (Domain detail)
console.log('[v2-recorder] Step 9: Navigating to Domain Detail (/domains/vision)...');
await page.goto(base + '/domains/vision', { waitUntil: 'networkidle2' });
await sleep(1500);
const domDetH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(domDetH, 700), 2200);
await sleep(1000);

// 10. Navigate to /projects
console.log('[v2-recorder] Step 10: Navigating to Projects page (/projects)...');
await page.goto(base + '/projects', { waitUntil: 'networkidle2' });
await sleep(1500);
const projH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(projH, 800), 2200);
await sleep(1200);

// 11. Navigate to /projects/vision-core (Project detail)
console.log('[v2-recorder] Step 11: Navigating to Project Detail (/projects/vision-core)...');
await page.goto(base + '/projects/vision-core', { waitUntil: 'networkidle2' });
await sleep(1500);
const projDetH = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
await smoothScroll(0, Math.min(projDetH, 700), 2000);
await sleep(1200);

// 12. Open Terminal (CLI)
console.log('[v2-recorder] Step 12: Opening CLI Terminal overlay...');
await page.evaluate(() => {
  const cliBtn = document.querySelector('.btn.cli');
  if (cliBtn) cliBtn.click();
});
await sleep(1500);
try {
  await page.keyboard.type('help', { delay: 90 });
  await page.keyboard.press('Enter');
  await sleep(1000);
  await page.keyboard.type('about', { delay: 90 });
  await page.keyboard.press('Enter');
  await sleep(1200);
} catch (e) {}
await page.keyboard.press('Escape');
await sleep(800);

// 13. Open Apply / Sign In modal
console.log('[v2-recorder] Step 13: Opening Apply / Sign In modal...');
await page.evaluate(() => {
  const appBtn = document.querySelector('.btn.apply');
  if (appBtn) appBtn.click();
});
await sleep(2000);
await page.keyboard.press('Escape');
await sleep(1000);

// 14. Return to Home
console.log('[v2-recorder] Step 14: Returning to Home...');
await page.goto(base + '/', { waitUntil: 'networkidle2' });
await sleep(2000);

console.log(`[v2-recorder] Stopping screencast. Total frames captured: ${frameCount}`);
await cdp.send('Page.stopScreencast');
await sleep(1000);
await browser.close();

// Wait for all disk writes to complete
console.log('[v2-recorder] Flushing all frames to disk...');
await Promise.all(writePromises);
console.log(`[v2-recorder] All ${frameCount} frames saved successfully.`);

// Compile with ffmpeg
console.log('[v2-recorder] Encoding MP4 video with FFmpeg (CRF 18 high quality)...');
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
console.log(`[v2-recorder] SUCCESS: ${finalMp4} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);

// Clean temp frames immediately to preserve disk space
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('[v2-recorder] Cleaned up temp frames.');
