import puppeteer from 'puppeteer-core';

const BASE_URL = 'https://rp-club-ivory.vercel.app';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-live-verify',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--no-first-run', '--ignore-gpu-blocklist']
});

const page = await browser.newPage();
const pageErrors = [];

page.on('pageerror', (err) => {
  pageErrors.push(`[PAGE ERROR] ${err.message}`);
});

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    pageErrors.push(`[CONSOLE ERROR] ${msg.text()}`);
  }
});

console.log('[live-verify] 1. Testing Root URL redirect to /v2...');
await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 2000));
const rootLandedUrl = page.url();
console.log(`[live-verify] Root landed URL: ${rootLandedUrl}`);

console.log('[live-verify] 2. Testing /v1 (Classic Cyan Crystal)...');
await page.goto(`${BASE_URL}/v1`, { waitUntil: 'networkidle2' });
const v1Title = await page.title();
const v1Switch = await page.$eval('.ff-ver-switch, [aria-label="Version Switcher"]', (el) => el.innerText.replace(/\s+/g, ' ')).catch(() => 'none');
await page.screenshot({ path: 'shots/live-v1.png' });
console.log(`[live-verify] v1 Title: "${v1Title}", Version Switcher: "${v1Switch}"`);

console.log('[live-verify] 3. Testing /v2 (Immersive 3D Voyage)...');
await page.goto(`${BASE_URL}/v2`, { waitUntil: 'networkidle2' });
const v2Title = await page.title();
const v2Switch = await page.$eval('.ff-ver-switch, [aria-label="Version Switcher"]', (el) => el.innerText.replace(/\s+/g, ' ')).catch(() => 'none');
await page.screenshot({ path: 'shots/live-v2.png' });
console.log(`[live-verify] v2 Title: "${v2Title}", Version Switcher: "${v2Switch}"`);

console.log('[live-verify] 4. Testing /v3 (Editorial Club Site)...');
await page.goto(`${BASE_URL}/v3`, { waitUntil: 'networkidle2' });
const v3Title = await page.title();
const v3Switch = await page.$eval('.ff-ver-switch, [aria-label="Version Switcher"]', (el) => el.innerText.replace(/\s+/g, ' ')).catch(() => 'none');
await page.screenshot({ path: 'shots/live-v3.png' });
console.log(`[live-verify] v3 Title: "${v3Title}", Version Switcher: "${v3Switch}"`);

console.log(`[live-verify] Total errors encountered: ${pageErrors.length}`);
if (pageErrors.length > 0) {
  console.log(pageErrors.join('\n'));
}

await browser.close();
if (pageErrors.length > 0) {
  console.error('[live-verify] FAILED with runtime errors!');
  process.exit(1);
} else {
  console.log('[live-verify] ALL LIVE CHECKS PASSED WITH 0 ERRORS!');
  process.exit(0);
}
