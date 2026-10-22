import puppeteer from 'puppeteer-core';
// Screenshots a local HTML file: node tools/specimen.mjs <abs-path-to-html> <out.png> [width] [height]
const [file, out, w = '1500', h = '720'] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-tools', args: ['--no-sandbox', '--no-first-run', '--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: Number(w), height: Number(h) });
await page.goto('file:///' + file.split('\\').join('/'), { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: out });
await browser.close();
console.log('ok');
