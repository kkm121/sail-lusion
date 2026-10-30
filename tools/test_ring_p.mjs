import puppeteer from 'puppeteer-core';

const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--ignore-gpu-blocklist']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4600/discover', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));

  const pData = await page.evaluate(() => {
    window.scrollTo({ top: 7000, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1000));

  const info = await page.evaluate(() => {
    return {
      scrollY: window.scrollY,
      lenis: !!window.__lenis
    };
  });
  console.log('Info at 7000:', info);

  await browser.close();
}

test().catch(console.error);
