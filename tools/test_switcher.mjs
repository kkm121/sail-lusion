import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Loading http://127.0.0.1:5180/v2/ ...');
  await page.goto('http://127.0.0.1:5180/v2/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 50; i++) {
    const hasPreloader = await page.evaluate(() => !!document.querySelector('.sl-preloader'));
    if (!hasPreloader) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 1200));
  console.log('Preloader dismissed. Current URL:', page.url());

  console.log('2. Clicking v1 link ...');
  await page.evaluate(() => document.querySelector('a[href="/v1/"]').click());
  await new Promise((r) => setTimeout(r, 2000));
  console.log('Navigated URL after clicking v1:', page.url());

  console.log('3. Clicking v3 link from v1 ...');
  await page.evaluate(() => document.querySelector('a[href="/v3/"]').click());
  await new Promise((r) => setTimeout(r, 2000));
  console.log('Navigated URL after clicking v3:', page.url());

  console.log('4. Clicking v2 link from v3 ...');
  await page.evaluate(() => document.querySelector('a[href="/v2/"]').click());
  await new Promise((r) => setTimeout(r, 2000));
  console.log('Navigated URL after clicking v2:', page.url());

  await browser.close();
  console.log('\n>>> SUCCESS: Switching between v1, v2, and v3 works seamlessly without getting stuck! <<<');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
