import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const src = process.argv[2];
const out = path.resolve('public', 'video');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
fs.mkdirSync(out, { recursive: true });

const SHOTS = [
  ['m31510', 2.0, 3.0],
  ['m46635', 1.0, 3.0],
  ['m21921', 2.0, 3.2],
  ['m20961', 3.0, 3.0],
  ['m47051', 1.0, 3.0],
  ['m47257', 3.0, 3.2],
  ['m49042', 5.0, 3.0],
  ['m48166', 2.0, 3.2],
  ['m23282', 3.0, 3.0],
  ['m31510', 8.0, 3.0],
];
const X = 0.5;
const grade = 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=25,format=yuv420p,eq=contrast=1.06:saturation=1.08,colorbalance=bs=0.07:bm=0.04:gm=0.02:rh=-0.02,setsar=1';

const inputs = SHOTS.flatMap(([name, ss, d]) => ['-ss', String(ss), '-t', String(d + X), '-i', path.join(src, `${name}.mp4`)]);
let filter = SHOTS.map((_, i) => `[${i}:v]${grade},setpts=PTS-STARTPTS[v${i}]`).join(';');
let last = '[v0]';
let acc = SHOTS[0][2];
SHOTS.slice(1).forEach((s, i) => {
  filter += `;${last}[v${i + 1}]xfade=transition=fade:duration=${X}:offset=${(acc - X + X).toFixed(2)}[x${i + 1}]`;
  acc += s[2];
  last = `[x${i + 1}]`;
});
filter += `;${last}fade=t=in:st=0:d=0.5,fade=t=out:st=${(acc - 0.5).toFixed(2)}:d=0.5[outv]`;

const desktop = path.join(out, 'reel-desktop.mp4');
const mobile = path.join(out, 'reel-mobile.mp4');
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[outv]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', desktop]);
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', desktop, '-vf', 'scale=640:360', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '31', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mobile]);
for (const f of [desktop, mobile]) console.log(path.basename(f), Math.round(fs.statSync(f).size / 1024), 'KB');
