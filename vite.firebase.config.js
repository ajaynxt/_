import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: 'firebase-dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        site: resolve(process.cwd(), 'firebase/firebase-site.js'),
        admin: resolve(process.cwd(), 'admin/admin-app.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
