import puppeteer from 'puppeteer-core';

const base = process.env.BASE || 'http://127.0.0.1:4173';
const from = Number(process.argv[2] || 0);
const to = Number(process.argv[3] || 1200);
const secs = Number(process.argv[4] || 4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.25 });
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 160; i++) {
  if (!(await page.evaluate(() => !!document.querySelector('.sl-pre')))) break;
  await sleep(250);
}
await sleep(2500);
await page.evaluate((y) => window.scrollTo(0, y), from);
await sleep(800);

const cdp = await page.createCDPSession();
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
await cdp.send('Profiler.start');
const t0 = Date.now();
while (Date.now() - t0 < secs * 1000) {
  const k = (Date.now() - t0) / (secs * 1000);
  await page.evaluate((y) => window.scrollTo(0, y), from + (to - from) * k);
  await sleep(16);
}
const { profile } = await cdp.send('Profiler.stop');

const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
const dt = profile.timeDeltas;
profile.samples.forEach((id, i) => {
  const n = byId.get(id);
  const key = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').slice(-2).join('/')}:${n.callFrame.lineNumber}`;
  self.set(key, (self.get(key) || 0) + (dt[i] || 0) / 1000);
});
const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16);
console.log(top.map(([k, v]) => `${v.toFixed(0).padStart(6)}ms  ${k}`).join('\n'));
await browser.close();
