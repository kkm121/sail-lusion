import puppeteer from 'puppeteer-core';
import path from 'node:path';

const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS_DIR = 'C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3/v4_audit';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5180/v4/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1800));

  const sections = ['philosophy', 'domains', 'projects', 'crew', 'terminal'];
  for (const s of sections) {
    const el = await page.$('#' + s);
    if (el) {
      await el.scrollIntoView();
      await new Promise(r => setTimeout(r, 400));
      await el.screenshot({ path: path.join(SHOTS_DIR, `section_${s}.png`) });
      console.log(`Saved section_${s}.png`);
    }
  }

  await browser.close();
  console.log('All sections captured!');
})();
