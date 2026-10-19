import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const root = path.resolve('dist');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  let u = req.url.split('?')[0];
  let p = path.join(root, u);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
    p = path.join(p, 'index.html');
  }
  if (!fs.existsSync(p)) {
    if (u.startsWith('/v3')) p = path.join(root, 'v3', 'index.html');
    else if (u.startsWith('/v2')) p = path.join(root, 'v2', 'index.html');
    else p = path.join(root, 'index.html');
  }
  if (fs.existsSync(p) && !fs.statSync(p).isDirectory()) {
    const ext = path.extname(p);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(5195, '127.0.0.1', async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', (msg) => console.log('PAGE:', msg.text()));
  page.on('pageerror', (err) => console.log('ERROR:', err.message));

  await page.goto('http://127.0.0.1:5195/v3/', { waitUntil: 'domcontentloaded' });

  // Sample at 400ms, 1000ms, 1800ms
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: 'shots/sample-400ms.png' });
  console.log('400ms screenshot saved');

  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: 'shots/sample-1200ms.png' });
  console.log('1200ms screenshot saved');

  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: 'shots/sample-2000ms.png' });
  console.log('2000ms screenshot saved');

  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: 'shots/sample-3500ms.png' });
  console.log('3500ms screenshot saved');

  const preloaderCount = await page.evaluate(() => document.querySelectorAll('.v3-preloader').length);
  console.log('Preloader element count at 3500ms:', preloaderCount);

  await browser.close();
  server.close();
});
