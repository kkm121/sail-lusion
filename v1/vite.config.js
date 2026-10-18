import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE || '/v1/',
  server: { port: 5173 },
  build: {
    target: 'es2020',
    outDir: process.env.OUT_DIR || 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('three') || id.includes('@react-three')) return 'three';
          return undefined;
        },
      },
    },
  },
});
