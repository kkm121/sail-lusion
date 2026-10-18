import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-trace',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist']
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const target = (process.env.AUDIT_URL || 'http://127.0.0.1:5181') + '/v2/';
console.log(`[trace] Loading ${target}...`);
await page.goto(target, { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 2500));

console.log('[trace] Starting trace during scroll...');
await page.tracing.start({ path: 'shots/trace.json', categories: ['devtools.timeline', 'v8', 'blink.user_timing'] });

for (let i = 0; i < 15; i++) {
  await page.evaluate((step, total) => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    window.scrollTo(0, (maxScroll * (step + 1)) / total);
  }, i, 15);
  await new Promise(r => setTimeout(r, 100));
}

await page.tracing.stop();
console.log('[trace] Trace stopped. Analyzing trace.json...');

const trace = JSON.parse(fs.readFileSync('shots/trace.json', 'utf8'));
const events = trace.traceEvents || [];

// Look for Top Long Tasks and FunctionCall events > 20ms
const longEvents = events
  .filter(e => (e.name === 'RunTask' || e.name === 'FunctionCall' || e.name === 'EvaluateScript') && e.dur && e.dur > 20000)
  .sort((a, b) => b.dur - a.dur)
  .slice(0, 15);

console.log('\nTop Long Tasks in v2:');
for (const ev of longEvents) {
  const durMs = (ev.dur / 1000).toFixed(1);
  const fnName = ev.args?.data?.functionName || ev.name;
  const url = ev.args?.data?.url || '';
  console.log(` - ${fnName}: ${durMs}ms [${url.split('/').pop()}]`);
}

await browser.close();
