import puppeteer from 'puppeteer-core';
const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=d3d11']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4600/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.click('a[href="/discover"]');
  await new Promise(r => setTimeout(r, 2000));

  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const y = Math.round(maxScroll * 0.64);
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y);
  await new Promise(r => setTimeout(r, 2500));

  const debugData = await page.evaluate(() => {
    const canvas = document.querySelector('.sl-lab-canvas canvas') || document.querySelector('canvas');
    if (!canvas) return { error: 'no canvas' };
    
    // Check if Three.js scenes or window objects exist
    const reactKey = Object.keys(canvas).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
    let fiber = canvas[reactKey];
    let r3fState = null;
    let curr = fiber;
    while (curr) {
      if (curr.stateNode && curr.stateNode.__r3f) {
        r3fState = curr.stateNode.__r3f.root?.store?.getState();
        if (r3fState) break;
      }
      curr = curr.return;
    }
    if (!r3fState) return { error: 'no r3f state' };

    const scene = r3fState.scene;
    const cam = r3fState.camera;
    const results = [];

    scene.traverse(o => {
      if (o.isMesh || o.isSkinnedMesh) {
        const wp = new o.constructor();
        // check world position
        const worldPos = { x: 0, y: 0, z: 0 };
        o.getWorldPosition(worldPos);
        const distToCam = Math.hypot(worldPos.x - cam.position.x, worldPos.y - cam.position.y, worldPos.z - cam.position.z);
        if (distToCam < 30) {
          results.push({
            name: o.name,
            type: o.type,
            parentName: o.parent?.name,
            visible: o.visible,
            worldPos,
            distToCam
          });
        }
      }
    });

    return {
      camPos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
      nearMeshesCount: results.length,
      sample: results.slice(0, 30)
    };
  });

  console.log('DEBUG DATA:', JSON.stringify(debugData, null, 2));
  await browser.close();
}

test().catch(console.error);
