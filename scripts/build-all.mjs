import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const v1Dir = path.join(rootDir, 'v1');
const v3Dir = path.join(rootDir, 'v3');
const v3p2Dir = path.join(rootDir, 'v3p2');
const v4Dir = path.join(rootDir, 'v4');

console.log('[build-all] Cleaning root dist directory...');
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

// 0. Build the main site (v4) at the root. It empties dist, so it goes before the versioned builds.
console.log('\n========================================');
console.log('[build-all] 0/4: Building the main site (v4) at /...');
console.log('========================================');
execSync('npx vite build --base=/ --outDir=../dist', {
  cwd: v4Dir,
  stdio: 'inherit',
  env: { ...process.env, SITE_BASE: '/', OUT_DIR: '../dist' }
});

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
console.log('[build-all] 3/4: Building Version 3 (v3)...');
console.log('========================================');
execSync('npx vite build --base=/v3/ --outDir=../dist/v3', {
  cwd: v3Dir,
  stdio: 'inherit',
  env: { ...process.env, BASE: '/v3/', OUT_DIR: '../dist/v3' }
});

// 4. The previous main site (v3p2) stays available at /v3p2/
console.log('\n========================================');
console.log('[build-all] 4/5: Building the previous main site (v3p2) at /v3p2/...');
console.log('========================================');
execSync('npx vite build --base=/v3p2/ --outDir=../dist/v3p2', {
  cwd: v3p2Dir,
  stdio: 'inherit',
  env: { ...process.env, SITE_BASE: '/v3p2/', OUT_DIR: '../dist/v3p2' }
});

// 5. Version 4 also available directly at /v4/
console.log('\n========================================');
console.log('[build-all] 5/5: Building Version 4 (v4) at /v4/...');
console.log('========================================');
execSync('npx vite build --base=/v4/ --outDir=../dist/v4', {
  cwd: v4Dir,
  stdio: 'inherit',
  env: { ...process.env, SITE_BASE: '/v4/', OUT_DIR: '../dist/v4' }
});

// 6. The root index.html and /brand come from v4 (step 0); there is no gateway page any more.
const favSrc = path.join(rootDir, 'public', 'favicon.svg');
const favDest = path.join(distDir, 'favicon.svg');
if (fs.existsSync(favSrc) && !fs.existsSync(favDest)) {
  fs.copyFileSync(favSrc, favDest);
}

console.log('\n[build-all] Built into dist:');
console.log(' - dist/ (main site: v4, poster look with the Discover voyage)');
console.log(' - dist/v1/ (Classic SAIL Crystal)');
console.log(' - dist/v2/ (Immersive 3D Voyage)');
console.log(' - dist/v3/ (Editorial Club Site)');
console.log(' - dist/v3p2/ (previous main site)');
console.log(' - dist/v4/ (Version 4 dedicated route)');
