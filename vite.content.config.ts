import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'StyleraContent',
      formats: ['iife'],
      fileName: () => 'src/content/index.js',
    },
  },
});
