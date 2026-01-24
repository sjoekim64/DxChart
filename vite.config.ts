import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: ['.replit.dev', 'localhost', '127.0.0.1'],
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
  }
});
