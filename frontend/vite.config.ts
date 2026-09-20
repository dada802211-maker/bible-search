import { defineConfig } from 'vite';

// /api.php をPHPへ転送し、ブラウザーからは同じ接続先として扱います。
const proxy = { '/api.php': 'http://127.0.0.1:8000' };
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true, proxy },
  preview: {
    port: 4173,
    strictPort: true,
    proxy: {
      '/backend/public/api.php': {
        target: 'http://127.0.0.1:8000',
        rewrite: (path) => path.replace('/backend/public/api.php', '/api.php'),
      },
    },
  },
});
