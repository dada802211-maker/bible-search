import { defineConfig } from 'vite';

// /api.php をPHPへ転送し、ブラウザーからは同じ接続先として扱います。
const proxy = { '/api.php': 'http://127.0.0.1:8000' };
export default defineConfig({
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
});
