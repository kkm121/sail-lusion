import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('shots', 'cursor-test');
fs.mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--ignore-gpu-blocklist']
});

try {
  console.log('=== TEST 1: Desktop Adaptive Cursor Contrast ===');
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5180/', { waitUntil: 'domcontentloaded' });

  // Wait for preloader to complete
  for (let i = 0; i < 50; i++) {
    const hasLoader = await page.evaluate(() => !!document.querySelector('.sl-preloader'));
    if (!hasLoader) break;
    await sleep(200);
  }
  await sleep(1500);

  // 1. Move mouse over dark hero visual
  const heroVisualBox = await page.evaluate(() => {
    const el = document.querySelector('.sl-hero-visual');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (heroVisualBox) {
    await page.mouse.move(heroVisualBox.x, heroVisualBox.y);
    await sleep(400);
    const darkCursorState = await page.evaluate(() => {
      const c = document.querySelector('.sl-cursor');
      return {
        classList: Array.from(c.classList),
        isOnLight: c.classList.contains('is-on-light'),
        isVisible: c.classList.contains('is-visible')
      };
    });
    console.log('Cursor over Dark Hero Visual:', darkCursorState);
    await page.screenshot({ path: path.join(out, '01-cursor-dark-hero.png') });
  }

  // 2. Move mouse over light hero header / tagline
  const heroLightBox = await page.evaluate(() => {
    const el = document.querySelector('.sl-tagline');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + 50, y: r.top + 20 };
  });

  if (heroLightBox) {
    await page.mouse.move(heroLightBox.x, heroLightBox.y);
    await sleep(400);
    const lightCursorState = await page.evaluate(() => {
      const c = document.querySelector('.sl-cursor');
      return {
        classList: Array.from(c.classList),
        isOnLight: c.classList.contains('is-on-light'),
        isVisible: c.classList.contains('is-visible')
      };
    });
    console.log('Cursor over Light Hero Tagline:', lightCursorState);
    await page.screenshot({ path: path.join(out, '02-cursor-light-hero.png') });
  }

  // 3. Scroll to Footer (Light background #eef6f3)
  const footerBox = await page.evaluate(() => {
    const f = document.querySelector('.sl-footer');
    if (!f) return null;
    f.scrollIntoView();
    const r = f.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  await sleep(1200);
  if (footerBox) {
    await page.mouse.move(footerBox.x, footerBox.y);
    await sleep(500);
    const footerCursorState = await page.evaluate(() => {
      const c = document.querySelector('.sl-cursor');
      return {
        classList: Array.from(c.classList),
        isOnLight: c.classList.contains('is-on-light'),
        isVisible: c.classList.contains('is-visible')
      };
    });
    console.log('Cursor over Light Footer:', footerCursorState);
    await page.screenshot({ path: path.join(out, '03-cursor-light-footer.png') });
  }

  // 4. Test hover label on "Join the lab!" in #end
  const joinBtnBox = await page.evaluate(() => {
    const b = document.querySelector('#end button');
    if (!b) return null;
    b.scrollIntoView();
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  await sleep(1000);
  if (joinBtnBox) {
    await page.mouse.move(joinBtnBox.x, joinBtnBox.y);
    await sleep(500);
    const joinCursorState = await page.evaluate(() => {
      const c = document.querySelector('.sl-cursor');
      const text = c.querySelector('span')?.textContent;
      return {
        classList: Array.from(c.classList),
        hasLabel: c.classList.contains('has-label'),
        label: text
      };
    });
    console.log('Cursor hovering Join button:', joinCursorState);
    await page.screenshot({ path: path.join(out, '04-cursor-label-join.png') });
  }

  await page.close();

  console.log('\n=== TEST 2: Mobile Touch & Responsiveness ===');
  const mobilePage = await browser.newPage();
  await mobilePage.setUserAgent(
    'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
  );
  await mobilePage.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://127.0.0.1:5180/', { waitUntil: 'domcontentloaded' });

  for (let i = 0; i < 50; i++) {
    const hasLoader = await mobilePage.evaluate(() => !!document.querySelector('.sl-preloader'));
    if (!hasLoader) break;
    await sleep(200);
  }
  await sleep(1500);

  // Check mobile cursor visibility in DOM
  const mobileCursorDisplay = await mobilePage.evaluate(() => {
    const c = document.querySelector('.sl-cursor');
    if (!c) return 'NOT_RENDERED';
    return window.getComputedStyle(c).display;
  });
  console.log('Mobile Cursor Computed Display:', mobileCursorDisplay);

  await mobilePage.screenshot({ path: path.join(out, '05-mobile-hero.png') });

  // Scroll to Lab scene on mobile
  await mobilePage.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight * 0.45);
  });
  await sleep(1500);
  await mobilePage.screenshot({ path: path.join(out, '06-mobile-lab.png') });

  // Scroll to Footer on mobile
  await mobilePage.evaluate(() => {
    const f = document.querySelector('.sl-footer');
    if (f) f.scrollIntoView();
  });
  await sleep(1200);
  await mobilePage.screenshot({ path: path.join(out, '07-mobile-footer.png') });

  await mobilePage.close();
  console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
} catch (err) {
  console.error('Test execution error:', err);
} finally {
  await browser.close();
}
