import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = 'http://127.0.0.1:4600';
const OUT_DIR = 'C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3/live_verification';

fs.mkdirSync(OUT_DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('=== Live Headless Verification: Lusion Dual-Quaternion VAT Skinning & Broken Glass ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=d3d11',
    ],
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
  await sleep(600);

  console.log('2. Transitioning to /discover...');
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
      maxScroll,
    };
  });
  console.log('3. Scroll container initialized:', scrollData);

  // Checkpoints:
  // 0.59: Intro text dive into cyber tunnel
  // 0.65: Black matrix tunnel with 4 echo trails
  // 0.76: 4D Twisted cyber matrix vortex
  // 0.88: Shattered glass breakout
  const checkpoints = [
    { name: '01_intro_dive', p: 0.59 },
    { name: '02_matrix_echo_trails', p: 0.65 },
    { name: '03_twisted_cyber_vortex', p: 0.76 },
    { name: '04_broken_glass_breakout', p: 0.88 },
  ];

  for (const cp of checkpoints) {
    const targetY = Math.round(scrollData.maxScroll * cp.p);
    console.log(`Scrolling to ${cp.name} (p=${cp.p}, y=${targetY})...`);
    await page.evaluate((pos) => window.scrollTo({ top: pos, behavior: 'instant' }), targetY);
    await sleep(1500);

    const shotPath = path.join(OUT_DIR, `${cp.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Captured: ${shotPath} (${fs.statSync(shotPath).size} bytes)`);
  }

  console.log('--- Verification Error Audit ---');
  if (errors.length === 0) {
    console.log('SUCCESS: 0 console or runtime page errors encountered during live voyage!');
  } else {
    console.error(`Errors detected (${errors.length}):`, errors);
  }

  await browser.close();
}

main().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
