import puppeteer from 'puppeteer-core';

// CPU-profiles the first load (until the loader opens) and prints the functions with the most self time.
// usage: BASE=http://127.0.0.1:5180 node tools/cpuprof.mjs
const base = process.env.BASE || 'http://127.0.0.1:5180';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-' + process.pid, args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.setDefaultTimeout(180000);
await page.setViewport({ width: 1440, height: 900 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
const cdp = await page.createCDPSession();
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
await cdp.send('Profiler.start');
await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !document.querySelector('.sl-preloader'), { timeout: 180000 });
const { profile } = await cdp.send('Profiler.stop');
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
const dt = profile.timeDeltas;
profile.samples.forEach((id, i) => {
  const n = byId.get(id);
  const f = n.callFrame;
  const key = `${f.functionName || '(anon)'} ${f.url.split('/').pop().split('?')[0]}:${f.lineNumber + 1}`;
  self.set(key, (self.get(key) || 0) + (dt[i] || 0) / 1000);
});
const parent = new Map();
profile.nodes.forEach((n) => (n.children || []).forEach((c) => parent.set(c, n.id)));
const chains = new Map();
profile.samples.forEach((id, i) => {
  const n = byId.get(id);
  if (n.callFrame.functionName !== 'onFirstUse') return;
  const names = [];
  let p = parent.get(id);
  while (p && names.length < 14) { const f = byId.get(p).callFrame; names.push(f.functionName || '(anon)'); p = parent.get(p); }
  const key = names.filter((x) => !/^(setProgram|getProgram|renderBufferDirect|renderObject|renderObjects|renderScene|projectObject|(anon))$/.test(x)).slice(0, 11).join(' < ');
  chains.set(key, (chains.get(key) || 0) + (dt[i] || 0) / 1000);
});
[...chains.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, v]) => console.log('onFirstUse', v.toFixed(0), 'ms via', k));
[...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(v.toFixed(0).padStart(6), 'ms', k));
await browser.close();
