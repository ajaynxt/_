import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: 'build-motion',
    sourcemap: false,
    minify: 'esbuild',
    lib: {
      entry: 'motion/motion-effects.js',
      formats: ['es'],
      fileName: () => 'motion-bundle.js'
    }
  }
});
