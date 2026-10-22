import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
// Serves dist/ the way vercel.json does: real files first, then each version's index.html, then the main site's.
const root = path.resolve('dist');
const port = Number(process.argv[2] || 4600);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.mp4': 'video/mp4', '.json': 'application/json', '.webp': 'image/webp' };
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(root, url);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return send(file);
  const m = /^\/(v1|v2|v3)(\/|$)/.exec(url);
  if (m) return send(path.join(root, m[1], 'index.html'));
  if (/\.[\w]+$/.test(url)) { res.writeHead(404); return res.end('404'); }
  return send(path.join(root, 'index.html'));
  function send(f) {
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  }
}).listen(port, '127.0.0.1', () => console.log('serving dist on', port));
