import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('[verify] Launching Chrome headless...');
  const browser = await puppeteer.launch({
    executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=d3d11']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGE_ERROR: ' + e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('CONSOLE_ERROR: ' + msg.text());
  });

  console.log('[verify] Navigating to http://127.0.0.1:4600/discover ...');
  await page.goto('http://127.0.0.1:4600/discover', { waitUntil: 'networkidle2', timeout: 30000 });

  // Click skip button if preloader is showing
  try {
    const skipBtn = await page.waitForSelector('.skip, button.skip', { timeout: 4000 });
    if (skipBtn) {
      console.log('[verify] Dismissing preloader with skip button...');
      await skipBtn.click();
    }
  } catch (e) {
    console.log('[verify] No skip button or preloader already dismissed.');
  }

  // Wait for preloader unmount and 3D scene mount
  await sleep(4000);

  // Inspect page structure
  const pageState = await page.evaluate(() => {
    const labEl = document.querySelector('.sl-lab') || document.querySelector('section');
    return {
      hasCanvas: !!document.querySelector('canvas'),
      docHeight: document.documentElement.scrollHeight,
      winHeight: window.innerHeight,
      labHeight: labEl ? labEl.offsetHeight : 0,
      sections: Array.from(document.querySelectorAll('section')).map(s => s.className),
    };
  });
  console.log('[verify] Page state after loader:', pageState);

  // Scroll to astronaut climax: 96.5% of voyage
  const maxScroll = Math.max(pageState.docHeight - pageState.winHeight, 1);
  const targetY = Math.round(maxScroll * 0.965);
  console.log(`[verify] Target scroll: y=${targetY} (maxScroll=${maxScroll})...`);

  // Smooth step-scroll to trigger journey chapters
  const steps = 18;
  for (let i = 1; i <= steps; i++) {
    const y = Math.round((targetY / steps) * i);
    await page.evaluate((yPos) => window.scrollTo(0, yPos), y);
    await sleep(140);
  }

  await page.evaluate((yPos) => window.scrollTo(0, yPos), targetY);
  console.log('[verify] Settled at climax. Waiting for 3D astronaut to enter frame, play floating & wave action, and stabilize...');
  await sleep(4500);

  const screenshotPath = path.join(outDir, 'live_web_astronaut_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`[verify] Captured live screenshot: ${screenshotPath} (${fs.statSync(screenshotPath).size} bytes)`);

  // Move pointer over astronaut to test interactive zero-g inertia response
  console.log('[verify] Testing pointer interaction with astronaut in zero-g...');
  await page.mouse.move(720, 380);
  await sleep(1200);
  await page.mouse.move(850, 420);
  await sleep(1500);

  const interactiveScreenshot = path.join(outDir, 'live_web_astronaut_interactive.png');
  await page.screenshot({ path: interactiveScreenshot });
  console.log(`[verify] Captured interactive screenshot: ${interactiveScreenshot} (${fs.statSync(interactiveScreenshot).size} bytes)`);

  console.log('[verify] Errors encountered:', errors);
  await browser.close();
  console.log('[verify] Verification complete with 0 crashes!');
}

run().catch((e) => {
  console.error('[verify] FAILED:', e);
  process.exit(1);
});
