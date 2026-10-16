import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
// Cuts a tall full-page screenshot into viewport-height slices (sN.png) so each can be inspected at full size.
// usage: node tools/slice.mjs <png> <outDir> [sliceHeight]
const [src, outDir, hArg] = process.argv.slice(2);
const H = Number(hArg || 900);
fs.mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run'] });
const page = await browser.newPage();
const data = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
const parts = await page.evaluate(async (data, H) => {
  const img = new Image();
  img.src = data;
  await img.decode();
  const out = [];
  for (let y = 0; y < img.height; y += H) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = Math.min(H, img.height - y);
    c.getContext('2d').drawImage(img, 0, y, img.width, c.height, 0, 0, img.width, c.height);
    out.push(c.toDataURL('image/png'));
  }
  return out;
}, data, H);
parts.forEach((p, i) => fs.writeFileSync(path.join(outDir, `s${String(i).padStart(2, '0')}.png`), Buffer.from(p.split(',')[1], 'base64')));
console.log(parts.length, 'slices');
await browser.close();
