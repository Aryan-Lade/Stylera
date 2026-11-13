import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Custom plugin to copy manifest.json and content styles into dist
function copyExtensionAssetsPlugin() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist', { recursive: true });
      }
      if (fs.existsSync('manifest.json')) {
        fs.copyFileSync('manifest.json', 'dist/manifest.json');
      }
      if (fs.existsSync('src/content/styles.css')) {
        fs.mkdirSync('dist/src/content', { recursive: true });
        fs.copyFileSync('src/content/styles.css', 'dist/src/content/styles.css');
      }
      if (fs.existsSync('public/icons')) {
        fs.mkdirSync('dist/icons', { recursive: true });
        const iconFiles = fs.readdirSync('public/icons');
        for (const file of iconFiles) {
          fs.copyFileSync(`public/icons/${file}`, `dist/icons/${file}`);
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionAssetsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        tryon: resolve(__dirname, 'src/tryon-app/index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'src/background/index.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            if (assetInfo.name.includes('content') || assetInfo.name === 'styles.css') {
              return 'src/content/styles.css';
            }
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    }
  }
});
