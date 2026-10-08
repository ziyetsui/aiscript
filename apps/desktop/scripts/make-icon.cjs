// Renders the app icon (1024×1024 PNG) from the Ancher symbol with Electron's own renderer.
// Run: pnpm --filter @scripter/desktop icon   → buildres/icon.png (electron-builder makes .icns / .ico from it)
const { app, BrowserWindow } = require('electron');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const src = readFileSync(join(__dirname, '../src/renderer/src/lib/brand.ts'), 'utf8');
const SYMBOL = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
// macOS icon grid: 824px rounded square inside 1024, warm paper background, rust symbol (direction 01 tokens).
const html = `<!doctype html><html><body style="margin:0;background:transparent">
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fcf8f1"/><stop offset="1" stop-color="#f1e9dc"/></linearGradient>
  <filter id="s" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#3c2814" flood-opacity=".22"/></filter></defs>
  <rect x="100" y="100" width="824" height="824" rx="185" fill="url(#g)" filter="url(#s)"/>
  <svg x="262" y="262" width="500" height="500" viewBox="${SYMBOL.viewBox}"><path d="${SYMBOL.path}" fill="#b4542a"/></svg>
</svg></body></html>`;

app.whenReady().then(async () => {
  const w = new BrowserWindow({ width: 1024, height: 1024, show: false, transparent: true, frame: false, webPreferences: { offscreen: true } });
  await w.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await new Promise((r) => setTimeout(r, 300));
  const img = await w.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });
  writeFileSync(join(__dirname, '../buildres/icon.png'), img.resize({ width: 1024, height: 1024 }).toPNG());
  console.log('buildres/icon.png');
  app.quit();
});
