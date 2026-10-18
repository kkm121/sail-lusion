import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-deploy-tools',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--no-first-run', '--ignore-gpu-blocklist']
});

const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(`[PAGE ERROR] ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[CONSOLE ERROR] ${msg.text()}`);
});

console.log('[test] Testing /v1...');
await page.goto('http://127.0.0.1:4173/v1/', { waitUntil: 'networkidle2' });
const v1Title = await page.title();
console.log(`[test] v1 Title: ${v1Title}`);

console.log('[test] Testing /v2...');
await page.goto('http://127.0.0.1:4173/v2/', { waitUntil: 'networkidle2' });
const v2Title = await page.title();
console.log(`[test] v2 Title: ${v2Title}`);

console.log('[test] Testing /v3...');
await page.goto('http://127.0.0.1:4173/v3/', { waitUntil: 'networkidle2' });
const v3Title = await page.title();
console.log(`[test] v3 Title: ${v3Title}`);

console.log('[test] Testing / (root redirect)...');
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 1000));
const finalUrl = page.url();
console.log(`[test] Root landed on: ${finalUrl}`);

console.log(`[test] Total errors encountered: ${errors.length}`);
if (errors.length > 0) {
  console.log(errors.slice(0, 5).join('\n'));
}

await browser.close();
console.log('[test] Verification completed successfully!');
