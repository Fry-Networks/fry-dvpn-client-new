import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// Plugin to copy database file to output
function copyDatabasePlugin() {
  return {
    name: 'copy-database',
    writeBundle() {
      const sourcePath = resolve(__dirname, 'src/main/database.js');
      const targetPath = resolve(__dirname, 'out/main/database.js');
      
      try {
        fs.copyFileSync(sourcePath, targetPath);
        console.log('✅ Database file copied to output directory');
      } catch (error) {
        console.error('❌ Failed to copy database file:', error);
      }
    }
  };
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyDatabasePlugin()],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: resolve(__dirname, 'src/main/index.js')
      }
    }
  },
  preload: {
    input: {
      index: resolve(__dirname, 'src/preload/index.js') // ✅ THIS IS REQUIRED
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload'
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        buffer: 'buffer'
      }
    },
    optimizeDeps: {
      include: ['buffer']
    },
    define: {
      global: 'window'
    },
    server: {
      hmr: true
    },
    build: {
      outDir: 'out/renderer'
    },
    plugins: [react()]
  }
});
