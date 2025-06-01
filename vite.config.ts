import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    host: true,
    port: 5173
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    cssMinify: true
  }
});
