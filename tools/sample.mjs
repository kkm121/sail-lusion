// Copies up to N evenly spaced frames from one folder to another so contact sheets stay readable.
import fs from 'node:fs';
import path from 'node:path';
const [src, dst, nArg, extArg] = process.argv.slice(2);
const n = Number(nArg || 24);
const ext = extArg || 'jpg';
fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(dst, { recursive: true });
const files = fs.readdirSync(src).filter((f) => /^f\d+\./.test(f) && f.endsWith('.' + ext)).sort();
const times = fs.existsSync(path.join(src, 'times.json')) ? JSON.parse(fs.readFileSync(path.join(src, 'times.json'), 'utf8')) : [];
const step = Math.max(1, Math.floor(files.length / n));
const picked = [];
for (let i = 0, k = 0; i < files.length && k < n; i += step, k++) {
  fs.copyFileSync(path.join(src, files[i]), path.join(dst, `f${String(k).padStart(3, '0')}.${ext}`));
  picked.push(times[i] !== undefined ? times[i] : i);
}
console.log(picked.length, 'frames; times:', picked.join(' '));
