import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const v1Dir = path.join(rootDir, 'v1');
const v3Dir = path.join(rootDir, 'v3');

console.log('[build-all] Cleaning root dist directory...');
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

// 1. Build v1 (Classical SAIL Cyan Crystal site)
console.log('\n========================================');
console.log('[build-all] 1/3: Building Version 1 (v1)...');
console.log('========================================');
execSync('npx vite build --base=/v1/ --outDir=../dist/v1', {
  cwd: v1Dir,
  stdio: 'inherit',
  env: { ...process.env, BASE: '/v1/', OUT_DIR: '../dist/v1' }
});

// 2. Build v2 (Immersive 3D Voyage site)
console.log('\n========================================');
console.log('[build-all] 2/3: Building Version 2 (v2)...');
console.log('========================================');
execSync('npx vite build --base=/v2/ --outDir=dist/v2', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, BASE: '/v2/', OUT_DIR: 'dist/v2' }
});

// 3. Build v3 (Editorial Club site with WebGL Fluid)
console.log('\n========================================');
console.log('[build-all] 3/3: Building Version 3 (v3)...');
console.log('========================================');
execSync('npx vite build --base=/v3/ --outDir=../dist/v3', {
  cwd: v3Dir,
  stdio: 'inherit',
  env: { ...process.env, BASE: '/v3/', OUT_DIR: '../dist/v3' }
});

// 4. Create root redirect and landing index.html
console.log('\n[build-all] Creating root redirect and gateway in dist/index.html...');
const rootHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FireFly // Student AI Club</title>
    <link rel="icon" type="image/png" href="/v2/brand/favicon.png" />
    <script>
      (function() {
        const p = window.location.pathname || '';
        const search = window.location.search || '';
        const hash = window.location.hash || '';
        if (p.startsWith('/v1')) {
          window.location.replace('/v1/' + search + hash);
        } else if (p.startsWith('/v3')) {
          window.location.replace('/v3/' + search + hash);
        } else {
          window.location.replace('/v2/' + search + hash);
        }
      })();
    </script>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        background: #0a0605;
        color: #fffaf5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        text-align: center;
        padding: 24px;
      }
      h1 { font-size: 28px; margin: 0 0 12px; font-weight: 700; }
      p { color: rgba(255, 255, 255, 0.6); margin: 0 0 24px; }
      .links { display: flex; gap: 12px; }
      .btn {
        padding: 10px 20px;
        border-radius: 999px;
        background: #ffb347;
        color: #000;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
      }
      .btn.sec {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
    </style>
  </head>
  <body>
    <h1>FireFly // Student AI Club</h1>
    <p>Opening <a href="/v2/" style="color:#ffb347;">FireFly</a>...</p>
    <div class="links">
      <a class="btn sec" href="/v1/">Launch v1</a>
      <a class="btn" href="/v2/">Launch v2</a>
      <a class="btn sec" href="/v3/">Launch v3</a>
    </div>
  </body>
</html>
`;
fs.writeFileSync(path.join(distDir, 'index.html'), rootHtml);

// 5. Copy brand assets & favicon to dist root for fallback asset safety
const brandSrc = path.join(rootDir, 'public', 'brand');
const brandDest = path.join(distDir, 'brand');
if (fs.existsSync(brandSrc)) {
  fs.cpSync(brandSrc, brandDest, { recursive: true });
}
const favSrc = path.join(rootDir, 'public', 'favicon.svg');
const favDest = path.join(distDir, 'favicon.svg');
if (fs.existsSync(favSrc)) {
  fs.copyFileSync(favSrc, favDest);
}

console.log('\n[build-all] All 3 versions built successfully into dist:');
console.log(' - dist/v1/ (Classic SAIL Crystal)');
console.log(' - dist/v2/ (Immersive 3D Voyage with Golden Lattice, Robot & 3D Particle Text)');
console.log(' - dist/v3/ (Editorial Club Site with Dynamic WebGL Fluid & Custom Cursor)');
console.log(' - dist/index.html (Gateway with fast redirect to /v2)');
