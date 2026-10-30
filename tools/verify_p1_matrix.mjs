import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = 'http://127.0.0.1:4900';
const OUT_DIR = 'C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3/live_verification';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('=== Live Headless Verification: p1 with Authentic Lusion Rods & Lighting ===');
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=d3d11']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[CONSOLE_ERROR] ${msg.text()}`);
      console.error(`[CONSOLE_ERROR] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`[PAGE_ERROR] ${err.message}`);
    console.error(`[PAGE_ERROR] ${err.message}`);
  });

  console.log('1. Navigating to Discover Voyage...');
  await page.goto(`${BASE_URL}/discover`, { waitUntil: 'networkidle2' });
  await sleep(2500);

  const scrollData = await page.evaluate(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return {
      scrollHeight: document.documentElement.scrollHeight,
      windowHeight: window.innerHeight,
      maxScroll
    };
  });
  console.log('Page scroll data:', scrollData);

  const capturePoints = [
    { name: 'p1_01_matrix_entry', p: 0.585, desc: 'Entry into authentic Lusion rods matrix with Half-Lambert lighting' },
    { name: 'p1_02_matrix_rods_lighting', p: 0.62, desc: 'Slate-titanium rails with chamfer glints & pulsing micro-pads' },
    { name: 'p1_03_deep_matrix_perspective', p: 0.66, desc: 'Deep cyber matrix perspective with emerald/cyan multi-hue glow' }
  ];

  for (const pt of capturePoints) {
    const targetY = scrollData.maxScroll * pt.p;
    console.log(`Scrolling to p=${pt.p} (y=${Math.round(targetY)}) - ${pt.desc}...`);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), targetY);
    await sleep(1500);

    const outPath = path.join(OUT_DIR, `${pt.name}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Saved screenshot: ${outPath}`);
  }

  await browser.close();
  console.log('Verification run completed with', errors.length, 'errors.');
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
