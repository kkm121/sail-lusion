import puppeteer from 'puppeteer-core';
// Prints which GPU the headless browser renders WebGL with.
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'C:/Users/muthu/AppData/Local/Temp/pp-' + process.pid, args: ['--no-sandbox', '--no-first-run', '--ignore-gpu-blocklist', ...(process.argv.slice(2))] });
const page = await browser.newPage();
await page.goto('about:blank');
console.log(await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return [gl.getParameter(ext.UNMASKED_RENDERER_WEBGL), 'parallel compile: ' + !!gl.getExtension('KHR_parallel_shader_compile')].join(' | ');
}));
await browser.close();
