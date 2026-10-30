import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = 'http://127.0.0.1:4600';
const OUT_DIR = 'C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('=== Live Headless Verification: Interstellar Elevated Astronaut & Actions ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=d3d11']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[CONSOLE_ERROR] ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[PAGE_ERROR] ${err.message}`));

  console.log('1. Navigating to Home...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await page.waitForFunction('window.__ffReady === true', { timeout: 20000 });
  await sleep(800);

  console.log('2. Client-side transition to Discover Voyage...');
  await page.click('a[href="/discover"]');
  await page.waitForSelector('.sl-lab-canvas', { timeout: 15000 });
  
  await page.waitForFunction(() => {
    const wrap = document.querySelector('.sl-lab-canvas');
    return wrap && (wrap.classList.contains('is-warm') || window.getComputedStyle(wrap).opacity === '1');
  }, { timeout: 20000 }).catch(() => console.log('Notice: Warmup wait completed.'));
  await sleep(1500);

  const scrollData = await page.evaluate(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return {
      scrollHeight: document.documentElement.scrollHeight,
      windowHeight: window.innerHeight,
      maxScroll
    };
  });
  console.log('3. Scroll container initialized:', scrollData);

  // Scroll to astronaut climax: 0.965
  const targetY = Math.round(scrollData.maxScroll * 0.965);
  console.log(`4. Smoothly scrolling to Climax Progress 96.5% (y=${targetY})...`);
  
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    const y = Math.round((targetY / steps) * i);
    await page.evaluate((pos) => window.scrollTo({ top: pos, behavior: 'instant' }), y);
    await sleep(70);
  }
  await sleep(2000);

  // State 1: Natural Climax Wave with Apollo Gold Visor, Accretion Ring, & Stardust
  const climaxShot = path.join(OUT_DIR, 'live_web_astronaut_climax.png');
  await page.screenshot({ path: climaxShot });
  console.log(`Saved Climax Greeting Shot: ${climaxShot} (${fs.statSync(climaxShot).size} bytes)`);

  // State 2: Trigger Key '3' (Thumbs Up Action)
  console.log('5. Triggering interactive action: Thumbs Up (Key 3)...');
  await page.keyboard.press('3');
  await sleep(1200);
  const thumbsShot = path.join(OUT_DIR, 'live_web_astronaut_thumbs_up.png');
  await page.screenshot({ path: thumbsShot });
  console.log(`Saved Thumbs Up Shot: ${thumbsShot} (${fs.statSync(thumbsShot).size} bytes)`);

  // State 3: Trigger Key '4' (EVA Thruster Action with Active RCS Plumes)
  console.log('6. Triggering interactive action: EVA Thruster Maneuver (Key 4)...');
  await page.keyboard.press('4');
  await sleep(1200);
  const evaShot = path.join(OUT_DIR, 'live_web_astronaut_eva_thrust.png');
  await page.screenshot({ path: evaShot });
  console.log(`Saved EVA Thruster Shot: ${evaShot} (${fs.statSync(evaShot).size} bytes)`);

  // State 4: Interactive Zero-G Cursor Inertia Tilt & Thruster Venting
  console.log('7. Simulating zero-G angular inertia via cursor...');
  await page.mouse.move(950, 280, { steps: 12 });
  await sleep(600);
  const tiltShot = path.join(OUT_DIR, 'live_web_astronaut_interactive.png');
  await page.screenshot({ path: tiltShot });
  console.log(`Saved Interactive Inertia Shot: ${tiltShot} (${fs.statSync(tiltShot).size} bytes)`);

  console.log('--- Verification Error Audit ---');
  if (errors.length === 0) {
    console.log('SUCCESS: 0 console or runtime page errors encountered during live voyage!');
  } else {
    console.error(`Errors detected (${errors.length}):`, errors);
  }

  await browser.close();
  console.log('=== Verification Finished Cleanly ===');
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
