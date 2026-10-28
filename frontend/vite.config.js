import { defineConfig } from 'vite';
export default defineConfig({ server: { proxy: {
  '/api/suggest-username': 'http://localhost:8000',
  '/api': 'http://localhost:3000',
} } });
