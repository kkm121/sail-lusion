import puppeteer from 'puppeteer-core';
const sleep = (t) => new Promise((r) => setTimeout(r, t));
const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: process.env.PPDIR || 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const wait = async () => {
  for (let i = 0; i < 160; i++) { if (!(await page.evaluate(() => !!document.querySelector('.sl-pre')))) break; await sleep(250); }
  await sleep(1200);
};
for (const url of ['http://127.0.0.1:5180/', 'http://127.0.0.1:5180/about']) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await wait();
  await page.evaluate(() => window.scrollTo(0, 3500));
  await sleep(800);
  const before = await page.evaluate(() => scrollY);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(600);
  const loaderShown = await page.evaluate(() => !!document.querySelector('.sl-pre'));
  const during = await page.evaluate(() => scrollY);
  await wait();
  const after = await page.evaluate(() => scrollY);
  console.log(url, { before, loaderShown, during, after });
}
await browser.close();
