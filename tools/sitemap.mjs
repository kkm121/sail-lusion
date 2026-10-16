import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
// Renders pages in Chrome and prints their outline: nav links, headings, section count, and a screenshot.
// usage: node tools/sitemap.mjs <url> [<url> ...]
const urls = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run'] });
fs.mkdirSync('shots/research', { recursive: true });
for (const url of urls) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  } catch (e) {
    console.log('\n##', url, 'LOAD FAILED', e.message.slice(0, 80));
    await page.close();
    continue;
  }
  await new Promise((r) => setTimeout(r, 2500));
  const out = await page.evaluate(() => {
    const t = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const nav = [...document.querySelectorAll('nav a, header a')].map((a) => t(a.innerText)).filter(Boolean).slice(0, 24);
    const heads = [...document.querySelectorAll('h1,h2,h3')].map((h) => `${h.tagName}: ${t(h.innerText).slice(0, 90)}`).filter((x) => x.length > 4).slice(0, 60);
    const buttons = [...document.querySelectorAll('a,button')].map((a) => t(a.innerText)).filter((x) => x && x.length < 30 && /join|apply|register|sign|subscribe|member|contact|sponsor|event/i.test(x)).slice(0, 16);
    return { title: document.title, nav: [...new Set(nav)], heads, buttons: [...new Set(buttons)], h: document.documentElement.scrollHeight };
  });
  const name = url.replace(/https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
  await page.screenshot({ path: `shots/research/${name}.png` });
  console.log('\n##', url, '|', out.title, '| height', out.h);
  console.log('nav:', out.nav.join(' · '));
  console.log('cta:', out.buttons.join(' · '));
  out.heads.forEach((h) => console.log('  ' + h));
  await page.close();
}
await browser.close();
