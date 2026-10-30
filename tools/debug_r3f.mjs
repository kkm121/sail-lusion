import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://127.0.0.1:4600/discover';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=d3d11']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', (msg) => console.log('PAGE_LOG:', msg.text()));
  page.on('pageerror', (err) => console.error('PAGE_ERR:', err.message));

  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.sl-lab-canvas canvas', { timeout: 15000 });
  await sleep(2000);

  // Scroll to p = 0.79
  const y = 12101;
  await page.evaluate((pos) => {
    if (window.__lenis) window.__lenis.scrollTo(pos, { immediate: true });
    else window.scrollTo({ top: pos, behavior: 'instant' });
  }, y);
  await sleep(3000);

  const debug = await page.evaluate(() => {
    // Find canvas and examine Three.js objects
    const canvas = document.querySelector('.sl-lab-canvas canvas');
    // Access R3F internal instance
    const key = Object.keys(canvas).find(k => k.startsWith('__reactFiber'));
    let fiber = canvas[key];
    let r3fState = null;
    while (fiber) {
      if (fiber.memoizedProps?.onCreated || fiber.stateNode?.scene) {
        r3fState = fiber.stateNode;
        break;
      }
      fiber = fiber.return;
    }

    return {
      hasCanvas: !!canvas,
      scrollY: window.scrollY,
      r3fFound: !!r3fState
    };
  });
  console.log('Debug result:', debug);
  await browser.close();
}

run().catch(console.error);
