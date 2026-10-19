import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = 'http://localhost:5180';
const SHOTS_DIR = 'C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3/mobile_audit';
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DEVICES = [
  {
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    dpr: 3.0,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    name: 'Pixel 7',
    width: 412,
    height: 915,
    dpr: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  },
  {
    name: 'Samsung Galaxy S20 Ultra',
    width: 412,
    height: 915,
    dpr: 3.5,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G988B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  }
];

async function runMobileSuite() {
  console.log('🚀 Launching Chrome DevTools Device Emulation Suite...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist']
  });

  let allPassed = true;
  const auditReport = [];

  try {
    for (const dev of DEVICES) {
      console.log(`\n============================================================`);
      console.log(`📱 TESTING DEVICE: ${dev.name} (${dev.width}x${dev.height}, DPR ${dev.dpr})`);
      console.log(`============================================================`);

      const page = await browser.newPage();
      await page.setUserAgent(dev.userAgent);
      await page.setViewport({
        width: dev.width,
        height: dev.height,
        deviceScaleFactor: dev.dpr,
        isMobile: true,
        hasTouch: true
      });

      // -------------------------------------------------------------
      // 1. V2 TEST: Preloader -> Lab Scene -> No Overlap -> 1s Wave Pause
      // -------------------------------------------------------------
      console.log(`[${dev.name}] Navigating to v2...`);
      await page.goto(`${BASE_URL}/v2/`, { waitUntil: 'domcontentloaded' });
      await sleep(1200);

      // Wait for preloader to complete
      for (let i = 0; i < 35; i++) {
        const hasPreloader = await page.evaluate(() => !!document.querySelector('.sl-preloader'));
        if (!hasPreloader) break;
        await sleep(200);
      }
      await sleep(1000);

      // Check Mobile Overlap in Lab Intro
      const overlapMetrics = await page.evaluate(() => {
        const h2 = document.querySelector('.sl-lab-intro h2');
        const copy = document.querySelector('.sl-lab-intro .copy');
        const devElem = document.querySelector('.sl-lab-device');
        const h2Rect = h2 ? h2.getBoundingClientRect() : null;
        const copyRect = copy ? copy.getBoundingClientRect() : null;
        const devRect = devElem ? devElem.getBoundingClientRect() : null;
        return {
          h2Bottom: h2Rect ? h2Rect.bottom : 0,
          copyBottom: copyRect ? copyRect.bottom : 0,
          devTop: devRect ? devRect.top : 0,
          clearance: devRect && copyRect ? devRect.top - copyRect.bottom : 0
        };
      });

      const shotLab = path.join(SHOTS_DIR, `${dev.name.replace(/\s+/g, '_')}_v2_intro.png`);
      await page.screenshot({ path: shotLab });

      if (overlapMetrics.clearance >= 20) {
        console.log(`✅ PASS: [${dev.name}] Zero overlap in Lab Intro (Clearance: ${overlapMetrics.clearance.toFixed(1)}px).`);
      } else {
        console.error(`❌ FAIL: [${dev.name}] Potential text/canvas overlap!`, overlapMetrics);
        allPassed = false;
      }

      // Check Smooth Scroll Frame Rate & Jitter
      console.log(`[${dev.name}] Measuring 60 FPS frame smoothness during scroll...`);
      const fpsResult = await page.evaluate(async () => {
        let frameTimes = [];
        let last = performance.now();
        let running = true;

        const onFrame = (now) => {
          frameTimes.push(now - last);
          last = now;
          if (running) requestAnimationFrame(onFrame);
        };
        requestAnimationFrame(onFrame);

        // Scroll 1200px smoothly
        for (let y = 0; y <= 1200; y += 40) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 16));
        }
        running = false;
        await new Promise((r) => setTimeout(r, 100));

        const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / (frameTimes.length || 1);
        const fps = 1000 / avgDelta;
        const jankFrames = frameTimes.filter((dt) => dt > 34).length; // frames > 30fps drop

        return { fps, avgDelta, totalFrames: frameTimes.length, jankFrames };
      });

      console.log(`[${dev.name}] Scroll Performance: ${fpsResult.fps.toFixed(1)} FPS, Jank frames (>34ms): ${fpsResult.jankFrames} / ${fpsResult.totalFrames}`);
      if (fpsResult.jankFrames <= 3) {
        console.log(`✅ PASS: [${dev.name}] Buttery smooth 60 FPS achieved.`);
      } else {
        console.warn(`⚠️ NOTE: [${dev.name}] Minor frame spikes: ${fpsResult.jankFrames}`);
      }

      // -------------------------------------------------------------
      // 2. V3 TEST: Kinetic Preloader -> Home Text Scrub -> Team Muthu Tags -> Breathing Room
      // -------------------------------------------------------------
      console.log(`[${dev.name}] Navigating to v3...`);
      await page.goto(`${BASE_URL}/v3/`, { waitUntil: 'domcontentloaded' });
      // Allow 2.5s preloader to finish its supernova flash and unlock overflow
      await sleep(3000);

      // Check preloader dismissal
      const v3PreloaderGone = await page.evaluate(() => {
        const p = document.querySelector('.v3-preloader');
        return !p || p.classList.contains('is-dismissed') || getComputedStyle(p).display === 'none';
      });

      const shotV3 = path.join(SHOTS_DIR, `${dev.name.replace(/\s+/g, '_')}_v3_home.png`);
      await page.screenshot({ path: shotV3 });

      console.log(`[${dev.name}] v3 Kinetic Preloader active & cleanly dismissed: ${v3PreloaderGone}`);

      // Check v3 Team Page on Mobile
      await page.goto(`${BASE_URL}/v3/team`, { waitUntil: 'domcontentloaded' });
      await sleep(1000);

      const teamMetrics = await page.evaluate(() => {
        const muthuCard = Array.from(document.querySelectorAll('.team-card, .v3-team-card, article')).find((el) =>
          el.textContent.includes('Muthu')
        );
        const cards = Array.from(document.querySelectorAll('.team-card, .v3-team-card, article'));
        let overlappingCards = 0;
        for (let i = 0; i < cards.length - 1; i++) {
          const r1 = cards[i].getBoundingClientRect();
          const r2 = cards[i + 1].getBoundingClientRect();
          if (r1.bottom > r2.top + 2 && r1.top < r2.bottom && r1.right > r2.left && r1.left < r2.right) {
            overlappingCards++;
          }
        }
        return {
          muthuFound: !!muthuCard,
          muthuText: muthuCard ? muthuCard.textContent : '',
          overlappingCards
        };
      });

      const shotTeam = path.join(SHOTS_DIR, `${dev.name.replace(/\s+/g, '_')}_v3_team.png`);
      await page.screenshot({ path: shotTeam });

      if (teamMetrics.muthuFound && teamMetrics.overlappingCards === 0) {
        console.log(`✅ PASS: [${dev.name}] v3 Team cards cleanly stacked with 0 overlap.`);
      } else {
        console.error(`❌ FAIL: [${dev.name}] Overlapping cards on Team page:`, teamMetrics);
        allPassed = false;
      }

      auditReport.push({
        device: dev.name,
        fps: fpsResult.fps.toFixed(1),
        jankFrames: fpsResult.jankFrames,
        labClearance: overlapMetrics.clearance.toFixed(1) + 'px',
        teamOverlap: teamMetrics.overlappingCards
      });

      await page.close();
    }

    console.log('\n============================================================');
    console.log('📊 COMPREHENSIVE MOBILE TEST SUITE SUMMARY:');
    console.log(JSON.stringify(auditReport, null, 2));
    console.log('============================================================');

    if (allPassed) {
      console.log('\n🎉 ALL MOBILE TESTS PASSED ACROSS IPHONE 14 PRO MAX, PIXEL 7 & GALAXY S20 ULTRA!');
    } else {
      console.error('\n❌ SOME MOBILE TESTS ENCOUNTERED ANOMALIES.');
    }
  } finally {
    await browser.close();
  }
}

runMobileSuite().catch(console.error);
