import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://127.0.0.1:4600/discover';
const OUT_DIR = 'C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log('=== Verifying Lusion Phases on /discover (v4 Production) ===');
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
  page.on('response', (res) => {
    if (res.status() >= 400) errors.push(`[HTTP_${res.status()}] ${res.url()}`);
  });

  console.log('1. Navigating to /discover...');
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await sleep(2000);

  // Wait for lab canvas
  console.log('2. Waiting for canvas...');
  await page.waitForSelector('.sl-lab-canvas canvas', { timeout: 15000 }).catch(() => console.log('Canvas selector timeout'));
  
  // Wait for warm-up compilation to fully complete (5 seconds)
  console.log('3. Waiting for warm-up & compile to settle...');
  await sleep(6000);



  const scrollData = await page.evaluate(() => {
    const lab = document.querySelector('#lab');
    const vh = window.innerHeight;
    const labBox = lab ? lab.getBoundingClientRect() : { top: 0, height: 10000 };
    const labTop = labBox.top + window.scrollY;
    const labHeight = labBox.height;
    const maxScroll = Math.max(labHeight - vh, 1);
    const totalMaxScroll = document.documentElement.scrollHeight - vh;
    return { labTop, labHeight, maxScroll, totalMaxScroll };
  });
  console.log('Scroll Bounds on /discover:', scrollData);

  const phases = [
    {
      name: 'lusion_intro_blackhole_ring_centered',
      p: 0.44,
      desc: 'Intro: Typography Centered Inside Black Hole Accretion Ring (Image 2)',
    },
    {
      name: 'lusion_intro_blackhole_ring',
      p: 0.48,
      desc: 'Intro: Black Hole Accretion Ring Diver Entrance (Image 2)',
    },
    {
      name: 'lusion_phase1_build_titanium_matrix',
      p: 0.68,
      desc: 'Phase 1: Build - Pure Vertex/Intersection Glow & Dark Slate Titanium (Image 5)',
    },
    {
      name: 'lusion_phase2_twisted_discover_matrix',
      p: 0.82,
      desc: 'Phase 2: Discover - 4D Twisted Cyber Matrix Tunnel in Hyperspace (Image 3)',
    },
    {
      name: 'lusion_phase2_crystal_blob_at_end_of_discover',
      p: 0.852,
      desc: 'Phase 2: Discover Terminus - Iconic Glowing Cyan Crystal Blob with Glass Refraction',
    },
    {
      name: 'lusion_phase3_create_screen_breakout',
      p: 0.91,
      desc: 'Phase 3: Create - Neoclassical Gallery & Screen Breakout',
    },
  ];

  for (const ph of phases) {
    const y = Math.round(scrollData.labTop + scrollData.maxScroll * ph.p);
    console.log(`Scrolling to ${ph.desc} (p=${ph.p}, y=${y})...`);

    for (let attempt = 0; attempt < 5; attempt++) {
      await page.evaluate((pos) => {
        if (window.__lenis) {
          window.__lenis.scrollTo(pos, { immediate: true });
        } else {
          window.scrollTo({ top: pos, behavior: 'instant' });
        }
      }, y);
      await sleep(1200);
      const curY = await page.evaluate(() => window.scrollY);
      if (Math.abs(curY - y) < 80) break;
      await sleep(800);
    }
    await sleep(2500);

    const activeInfo = await page.evaluate(() => {
      const activeChap = document.querySelector('.sl-lab-chaps .chap[style*="opacity: 1"], .sl-lab-chaps .chap[style*="visibility: visible"]') ||
                         Array.from(document.querySelectorAll('.sl-lab-chaps .chap')).find(c => window.getComputedStyle(c).visibility === 'visible' || window.getComputedStyle(c).opacity > '0.1');
      return {
        chapText: activeChap ? activeChap.innerText.replace(/\s+/g, ' ') : 'none',
        scrollY: window.scrollY
      };
    });
    console.log(`Active DOM Info at p=${ph.p}:`, activeInfo);

    const shotPath = path.join(OUT_DIR, `${ph.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`-> Saved [${ph.name}.png]: ${fs.statSync(shotPath).size} bytes`);
  }

  console.log('--- Error Audit ---');
  if (errors.length === 0) {
    console.log('SUCCESS: 0 console or runtime page errors!');
  } else {
    console.log(`Errors logged (${errors.length}):`, errors.slice(0, 10));
  }

  await browser.close();
  console.log('=== Verification Completed on /discover ===');
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
