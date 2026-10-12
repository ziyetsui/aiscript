import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import keygen from './resources/keygen-public.json';

// Workspace packages ship TypeScript sources, so they are bundled; real npm deps stay external.
const dataBuild = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const ws = { exclude: ['@scripter/core', '@scripter/agent', '@scripter/license'] };

export default defineConfig({
  main: {
    build: { externalizeDeps: ws },
    define: {
      __DATA_BUILD__: JSON.stringify(dataBuild),
      __AUTO_UPDATE__: process.env.SCRIPTER_AUTO_UPDATE === 'true',
      __KEYGEN_ACCOUNT__: JSON.stringify(process.env.KEYGEN_ACCOUNT_ID?.trim() || keygen.accountId),
      __KEYGEN_VERIFY_KEY__: JSON.stringify(process.env.KEYGEN_VERIFY_KEY?.trim() || keygen.verifyKeyHex),
    },
  },
  preload: { build: { externalizeDeps: ws, rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } } } },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: { rollupOptions: { input: resolve(__dirname, 'src/renderer/index.html') } },
    plugins: [react()],
  },
});
