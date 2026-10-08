import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import { resolve } from 'node:path';

// Workspace packages ship TypeScript sources, so they are bundled; real npm deps stay external.
const ws = { exclude: ['@scripter/core', '@scripter/agent', '@scripter/license'] };

export default defineConfig({
  main: {
    build: { externalizeDeps: ws },
    define: {
      __KEYGEN_ACCOUNT__: JSON.stringify(process.env.KEYGEN_ACCOUNT_ID ?? ''),
      __KEYGEN_VERIFY_KEY__: JSON.stringify(process.env.KEYGEN_VERIFY_KEY ?? ''),
    },
  },
  preload: { build: { externalizeDeps: ws, rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } } } },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: { rollupOptions: { input: resolve(__dirname, 'src/renderer/index.html') } },
    plugins: [react()],
  },
});
