import puppeteer from 'puppeteer-core';
const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=d3d11']
  });
  const page = await browser.newPage();
  
  for (const u of ['/', '/v2', '/v4', '/v4/discover']) {
    await page.goto(`http://127.0.0.1:4600${u}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const info = await page.evaluate(() => {
      const lab = document.querySelector('#lab');
      const canvas = document.querySelector('.sl-lab-canvas');
      return {
        url: window.location.pathname,
        hasLab: !!lab,
        labHeight: lab?.offsetHeight || 0,
        maxScroll: document.documentElement.scrollHeight - window.innerHeight,
        hasCanvas: !!canvas
      };
    });
    console.log(`Page [${u}]:`, info);
  }

  await browser.close();
}

test().catch(console.error);
