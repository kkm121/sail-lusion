import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = 'http://localhost:5180';
const OUT_DIR = 'C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3/v4_expanded_audit';

fs.mkdirSync(OUT_DIR, { recursive: true });

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto(`${BASE_URL}/v4/`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1800));

  const sections = [
    'hero',
    'philosophy',
    'domains',
    'playground',
    'projects',
    'initiatives',
    'research',
    'crew',
    'admissions',
    'terminal',
    'partners'
  ];

  for (const id of sections) {
    const el = await page.$(`#${id}`);
    if (el) {
      await el.screenshot({ path: path.join(OUT_DIR, `section_${id}.png`) });
      console.log(`Captured section #${id}`);
    }
  }

  // Full page desktop
  await page.screenshot({ path: path.join(OUT_DIR, 'desktop_full_showcase.png'), fullPage: true });

  // Mobile iPhone 14
  await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  await page.goto(`${BASE_URL}/v4/`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(OUT_DIR, 'mobile_iphone14_full.png'), fullPage: true });
  console.log('Captured mobile iPhone 14 full page');

  await browser.close();
}

capture().catch(console.error);
