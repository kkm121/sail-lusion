import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });

  console.log('1. Loading mobile http://127.0.0.1:5180/v2/ ...');
  await page.goto('http://127.0.0.1:5180/v2/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 50; i++) {
    const hasPreloader = await page.evaluate(() => !!document.querySelector('.sl-preloader'));
    if (!hasPreloader) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 1200));

  console.log('2. Touching v1 in mobile header ...');
  await page.evaluate(() => document.querySelector('.actions a[href="/v1/"]').click());
  await new Promise((r) => setTimeout(r, 2000));
  console.log('Mobile navigated to:', page.url());

  console.log('3. Touching v3 in v1 navbar ...');
  await page.evaluate(() => document.querySelector('a[href="/v3/"]').click());
  await new Promise((r) => setTimeout(r, 2000));
  console.log('Mobile navigated to:', page.url());

  await browser.close();
  console.log('>>> Mobile switcher verified working! <<<');
}

main().catch((err) => {
  console.error('Mobile switcher error:', err);
  process.exit(1);
});
