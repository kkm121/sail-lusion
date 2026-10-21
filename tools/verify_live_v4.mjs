import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = 'C:\\Users\\muthu\\.gemini\\antigravity\\brain\\0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3\\v4_live_audit';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function verifyLive() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Test 1: Desktop Live Root Redirect & Preloader
  console.log('Testing live desktop at https://rp-club-ivory.vercel.app/ ...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://rp-club-ivory.vercel.app/', { waitUntil: 'networkidle2' });
  console.log('Current URL after redirect:', page.url());

  // Wait 1.8s for preloader animation to finish cleanly
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(outDir, '01_live_desktop_hero.png'), fullPage: false });

  // Test 2: Mobile Live (iPhone 14 Pro Max)
  console.log('Testing live mobile (iPhone 14 Pro Max)...');
  await page.setViewport({
    width: 430,
    height: 932,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  await page.goto('https://rp-club-ivory.vercel.app/v4/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1800));
  await page.screenshot({ path: path.join(outDir, '02_live_mobile_hero.png'), fullPage: false });

  // Scroll to crew section
  await page.evaluate(() => {
    const el = document.getElementById('crew');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '03_live_mobile_crew.png'), fullPage: false });

  // Scroll to terminal section
  await page.evaluate(() => {
    const el = document.getElementById('terminal');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '04_live_mobile_terminal.png'), fullPage: false });

  // Check version switcher
  const versions = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.v4-ver-btn')).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href'),
      active: a.classList.contains('is-active')
    }));
  });
  console.log('Live Version Switcher Links:', versions);

  // Check crew count and tags
  const crewData = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.v4-member-card'));
    const muthu = cards.find(c => c.textContent.includes('Muthu Kumaran'));
    return {
      count: cards.length,
      hasMuthu: !!muthu,
      muthuTags: muthu ? Array.from(muthu.querySelectorAll('.v4-role-tag')).map(t => t.textContent.trim()) : []
    };
  });
  console.log('Live Crew Data:', crewData);

  // Check 4-6 scroll ratio on live
  const scrollRatio = await page.evaluate(() => {
    return (document.documentElement.scrollHeight / window.innerHeight).toFixed(2);
  });
  console.log('Live Total Page Scroll Ratio (Viewports):', scrollRatio);

  await browser.close();
  console.log('Live audit complete. Screenshots saved to:', outDir);
}

verifyLive().catch(err => {
  console.error('Live audit error:', err);
  process.exit(1);
});
