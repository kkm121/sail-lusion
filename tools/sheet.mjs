import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const from = Number(process.argv[3] || 0);
const to = Number(process.argv[4] || 11);
const cols = Number(process.argv[5] || 3);
const outFile = process.argv[6] || path.join(dir, `sheet-${from}-${to}.png`);
const files = fs.readdirSync(dir).filter((f) => new RegExp('^' + (process.env.PREFIX || 'f') + '\\d+\\.' + (process.env.EXT || 'png') + '$').test(f)).sort().slice(from, to + 1);
const cell = Math.floor(1800 / cols);
const h = Math.round(cell * Number(process.env.ASPECT || 0.625));
const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:4px">${files
  .map((f) => `<div style="position:relative"><img src="file:///${path.join(dir, f).replace(/\\/g, '/')}" style="width:${cell}px;height:${h}px;display:block"><span style="position:absolute;left:6px;top:4px;color:#0f0;font:bold 16px monospace;background:#000a;padding:1px 4px">${f.replace(/.[a-z]+$/, "")}</span></div>`)
  .join('')}</body>`;
const tmp = path.join(dir, '_sheet.html');
fs.writeFileSync(tmp, html);
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1808, height: (h + 4) * Math.ceil(files.length / cols) + 4 });
await page.goto('file:///' + tmp.replace(/\\/g, '/'));
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: outFile });
await browser.close();
console.log(outFile);


