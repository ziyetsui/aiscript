declare const __AUTO_UPDATE__: boolean;
// Auto-update from the public releases repo (spec 0002 §8, §13). Packaged builds only; never in dev or E2E.
import { app, type BrowserWindow } from 'electron';
import electronUpdater from 'electron-updater';
import { log } from './archive.ts';

export type UpdateStatus = { state: 'idle' | 'checking' | 'none' | 'downloading' | 'ready' | 'error'; version?: string; percent?: number; message?: string };
let status: UpdateStatus = { state: 'idle' };
let win: BrowserWindow | null = null;

const send = (s: UpdateStatus) => { status = s; if (win && !win.isDestroyed()) win.webContents.send('update:status', s); };

export function initUpdater(w: BrowserWindow): void {
  win = w;
  if (!app.isPackaged) return;
  // Private source repository and beta builds use manual download until a signed public feed exists.
  if (!__AUTO_UPDATE__) { send({ state: 'none', message: '此版本使用手动更新，请向提供者获取新版安装包' }); return; }
  const { autoUpdater } = electronUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => send({ state: 'checking' }));
  autoUpdater.on('update-not-available', () => send({ state: 'none' }));
  autoUpdater.on('update-available', (i) => send({ state: 'downloading', version: i.version, percent: 0 }));
  autoUpdater.on('download-progress', (p) => send({ ...status, state: 'downloading', percent: Math.round(p.percent) }));
  autoUpdater.on('update-downloaded', (i) => send({ state: 'ready', version: i.version }));
  autoUpdater.on('error', (e) => { log('warn', `update: ${e.message}`); send({ state: 'error', message: '检查更新失败，稍后会自动重试' }); });
  const check = () => void autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 10_000);
  setInterval(check, 6 * 60 * 60 * 1000);
}

export const updateStatus = () => status;
export function checkNow(): void {
  if (!app.isPackaged) { send({ state: 'none', message: '开发版不检查更新' }); return; }
  if (!__AUTO_UPDATE__) { send({ state: 'none', message: '此版本使用手动更新，请向提供者获取新版安装包' }); return; }
  void electronUpdater.autoUpdater.checkForUpdates().catch(() => {});
}
export function installNow(): void {
  if (status.state === 'ready') electronUpdater.autoUpdater.quitAndInstall();
}
