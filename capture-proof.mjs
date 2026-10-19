import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5180';
const OUT_DIR = path.join(process.cwd(), 'shots');

async function dismissLoader(page) {
  try {
    await page.evaluate(() => {
      const loader = document.querySelector('.v3-preloader');
      if (loader) loader.click();
    });
    await page.waitForFunction(() => !document.querySelector('.v3-preloader'), { timeout: 4000 }).catch(() => {});
  } catch {}
  await new Promise(r => setTimeout(r, 800));
}

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. v3 Home LifeSection
  await page.goto(`${BASE_URL}/v3/`, { waitUntil: 'networkidle0' });
  await dismissLoader(page);
  await page.evaluate(() => {
    const el = document.querySelector('.life-head');
    if (el) el.scrollIntoView({ block: 'start' });
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'v3-home-lifesection-verified.png') });

  // 2. v3 Projects spacing
  await page.goto(`${BASE_URL}/v3/projects`, { waitUntil: 'networkidle0' });
  await dismissLoader(page);
  await page.screenshot({ path: path.join(OUT_DIR, 'v3-projects-breathing-room-verified.png') });

  // 3. v3 Team tags and slogans marquee
  await page.goto(`${BASE_URL}/v3/team`, { waitUntil: 'networkidle0' });
  await dismissLoader(page);
  await page.evaluate(() => {
    const el = document.querySelector('.card.person');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT_DIR, 'v3-team-muthu-tags-verified.png') });

  // 4. v3 CLI with team output
  await page.goto(`${BASE_URL}/v3/cli`, { waitUntil: 'networkidle0' });
  await dismissLoader(page);
  await page.evaluate(() => {
    const win = document.querySelector('.cli-window');
    if (win) win.scrollIntoView({ block: 'center' });
    const input = document.querySelector('.cli-input');
    input.value = 'team';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(OUT_DIR, 'v3-cli-team-verified.png') });

  // 5. v2 Terminal with firefly@amiee
  await page.goto(`${BASE_URL}/v2/`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => {
    const btn = document.querySelector('button.btn.cli') || document.querySelector('button[aria-label*="CLI"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(OUT_DIR, 'v2-terminal-firefly-verified.png') });

  await browser.close();
  console.log('Proof screenshots captured successfully.');
}

capture();
