import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-perf-audit',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--enable-gpu-rasterization',
    '--enable-zero-copy',
    '--ignore-gpu-blocklist'
  ]
});

async function measurePagePerf(url, name) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Collect long tasks and frame timings
  await page.evaluateOnNewDocument(() => {
    window.__perfData = {
      longTasks: [],
      frameTimes: [],
      lastRaf: performance.now()
    };

    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perfData.longTasks.push({
          duration: Math.round(entry.duration),
          startTime: Math.round(entry.startTime)
        });
      }
    });
    try {
      obs.observe({ entryTypes: ['longtask'] });
    } catch (e) {}

    function loop(t) {
      const dt = t - window.__perfData.lastRaf;
      window.__perfData.lastRaf = t;
      if (dt > 0 && dt < 200) {
        window.__perfData.frameTimes.push(dt);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });

  console.log(`\n========================================`);
  console.log(`[audit] Auditing ${name} (${url})...`);
  console.log(`========================================`);

  const targetUrl = url.endsWith('/') ? url : `${url}/`;
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  // Wait for initial preloader to finish
  await new Promise((r) => setTimeout(r, 2500));

  // Perform smooth scroll across page
  const scrollSteps = 20;
  for (let i = 0; i < scrollSteps; i++) {
    await page.evaluate((step, total) => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      window.scrollTo(0, (maxScroll * (step + 1)) / total);
    }, i, scrollSteps);
    await new Promise((r) => setTimeout(r, 150));
  }

  // Settle for 1 second
  await new Promise((r) => setTimeout(r, 1000));

  const stats = await page.evaluate(() => {
    const ft = window.__perfData.frameTimes;
    if (!ft.length) return { avgFps: 0, minFps: 0, drops: 0, longTasks: [] };
    const avgDt = ft.reduce((a, b) => a + b, 0) / ft.length;
    ft.sort((a, b) => b - a); // slowest frames first
    const worst1PercentCount = Math.max(1, Math.floor(ft.length * 0.01));
    const worst1PercentAvg = ft.slice(0, worst1PercentCount).reduce((a, b) => a + b, 0) / worst1PercentCount;
    const drops = ft.filter((dt) => dt > 33.3).length; // dropped below 30 FPS
    const janks = ft.filter((dt) => dt > 50).length; // severe jank (> 50ms = < 20 FPS)

    return {
      totalFrames: ft.length,
      avgFps: (1000 / avgDt).toFixed(1),
      p1Fps: (1000 / worst1PercentAvg).toFixed(1),
      minFps: (1000 / ft[0]).toFixed(1),
      droppedFrames: drops,
      severeJanks: janks,
      dropRate: ((drops / ft.length) * 100).toFixed(1) + '%',
      longTasks: window.__perfData.longTasks.slice(-5)
    };
  });

  console.log(`[audit] Total frames sampled: ${stats.totalFrames}`);
  console.log(`[audit] Average FPS: ${stats.avgFps}`);
  console.log(`[audit] 1% Low FPS: ${stats.p1Fps}`);
  console.log(`[audit] Worst Frame FPS: ${stats.minFps}`);
  console.log(`[audit] Frames dropped below 30fps: ${stats.droppedFrames} (${stats.dropRate})`);
  console.log(`[audit] Severe janks (>50ms): ${stats.severeJanks}`);
  if (stats.longTasks.length) {
    console.log(`[audit] Recent long tasks:`, stats.longTasks);
  }

  await page.close();
  return stats;
}

const BASE = process.env.AUDIT_URL || 'http://127.0.0.1:4173';
await measurePagePerf(`${BASE}/v1`, 'v1');
await measurePagePerf(`${BASE}/v2`, 'v2');
await measurePagePerf(`${BASE}/v3`, 'v3');

await browser.close();
console.log('\n[audit] Performance audit finished.');
