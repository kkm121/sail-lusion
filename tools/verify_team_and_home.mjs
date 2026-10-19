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
    else if (u.startsWith('/v1')) p = path.join(root, 'v1', 'index.html');
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

server.listen(5197, '127.0.0.1', async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  // 1. Check v3 Home Header
  console.log('[test] Checking v3 Home Header...');
  await page.goto('http://127.0.0.1:5197/v3/', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 3200)); // wait for preloader to dismiss
  const navTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.hd-nav a')).map((a) => a.textContent.trim());
  });
  console.log('[test] v3 Nav texts:', navTexts);
  await page.screenshot({ path: 'shots/v3-nav-home-verified.png' });

  // 2. Check v3 CLI Team Command
  console.log('[test] Checking v3 CLI team command...');
  await page.goto('http://127.0.0.1:5197/v3/cli', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 3500)); // wait for preloader to dismiss

  // Click on 'team' command pill
  await page.evaluate(() => {
    const pills = Array.from(document.querySelectorAll('.cli-cmd-pill'));
    const teamPill = pills.find((p) => p.textContent.trim() === 'team');
    if (teamPill) teamPill.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: 'shots/v3-cli-team-verified.png' });

  const cliTeamOutput = await page.evaluate(() => {
    const outputs = Array.from(document.querySelectorAll('.cli-out'));
    return outputs[outputs.length - 1]?.textContent || '';
  });
  console.log('[test] v3 CLI team output snippet:', cliTeamOutput.substring(0, 160));

  // 3. Check v1 Team Page
  console.log('[test] Checking v1 Team Page...');
  await page.goto('http://127.0.0.1:5197/v1/#/team', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: 'shots/v1-team-page-verified.png' });

  const v1TeamCount = await page.evaluate(() => {
    return document.querySelectorAll('h3').length;
  });
  console.log('[test] v1 Team cards rendered count:', v1TeamCount);

  console.log('[test] Total page errors encountered:', errors.length);

  await browser.close();
  server.close();
  process.exit(errors.length === 0 ? 0 : 1);
});
