import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.SITE_BASE || '/', // SITE_BASE=/v3/ for the multi-version site
  server: { port: 5190, host: '127.0.0.1' },
  preview: { port: 4190, host: '127.0.0.1' },
  build: {
    outDir: process.env.OUT_DIR || 'dist',
    emptyOutDir: true,
  },
});
