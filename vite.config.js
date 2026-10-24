import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function multiVersionPreviewPlugin() {
  return {
    name: 'multi-version-preview',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/v1') {
          res.writeHead(302, { Location: '/v1/' });
          return res.end();
        }
        if (url === '/v2') {
          res.writeHead(302, { Location: '/v2/' });
          return res.end();
        }
        if (url === '/v3') {
          res.writeHead(302, { Location: '/v3/' });
          return res.end();
        }
        if (url === '/v4') {
          res.writeHead(302, { Location: '/v4/' });
          return res.end();
        }

        // Subroute SPA fallbacks for direct page refreshes on subpages
        if (url.startsWith('/v1/') && !path.extname(url)) {
          const v1Index = path.resolve('dist/v1/index.html');
          if (fs.existsSync(v1Index)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return fs.createReadStream(v1Index).pipe(res);
          }
        }
        if (url.startsWith('/v2/') && !path.extname(url)) {
          const v2Index = path.resolve('dist/v2/index.html');
          if (fs.existsSync(v2Index)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return fs.createReadStream(v2Index).pipe(res);
          }
        }
        if (url.startsWith('/v3/') && !path.extname(url)) {
          const v3Index = path.resolve('dist/v3/index.html');
          if (fs.existsSync(v3Index)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return fs.createReadStream(v3Index).pipe(res);
          }
        }
        if (url.startsWith('/v4/') && !path.extname(url)) {
          const v4Index = path.resolve('dist/v4/index.html');
          if (fs.existsSync(v4Index)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return fs.createReadStream(v4Index).pipe(res);
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), multiVersionPreviewPlugin()],
  server: { port: 5180, host: '127.0.0.1' },
  preview: { port: 5180, host: '127.0.0.1' },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined),
      },
    },
  },
});
