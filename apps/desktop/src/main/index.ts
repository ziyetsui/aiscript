import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { checkGeminiKey } from '@scripter/agent';
import type { BibleKind } from '@scripter/core';
import type { AiWriteRequest, Edit, ExportFormat, KeyResult, ProjectMeta } from '../shared/ipc.ts';
import * as ai from './ai.ts';
import { save as exportSave } from './exporter.ts';
import { activateKeygen, activateOffline, deactivateLocal, licenseStatus } from './license.ts';
import * as files from './files.ts';
import * as projects from './projects.ts';
import { encryptionAvailable, getSecret, setSecret } from './secrets.ts';
import { readJson, writeJson } from './store.ts';

// Dev/test-only overrides (never honoured in a packaged build): isolated data dir for E2E runs.
if (!app.isPackaged && process.env.SCRIPTER_USER_DATA) app.setPath('userData', process.env.SCRIPTER_USER_DATA);

if (!app.requestSingleInstanceLock()) app.quit();

let win: BrowserWindow | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 980, minHeight: 640, show: false,
    title: 'Ancher Scripter', backgroundColor: '#fbf9f4',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: { preload: join(import.meta.dirname, '../preload/index.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  win.once('ready-to-show', () => win?.show());
  // Links open in the system browser; the app window never navigates away.
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) void shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('http://localhost') && !url.startsWith('file://')) e.preventDefault(); });
  if (process.env.ELECTRON_RENDERER_URL) void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  else void win.loadFile(join(import.meta.dirname, '../renderer/index.html'));
}

/** Everything except license/app info refuses to run until the machine is activated. */
function gated<A extends unknown[], R>(fn: (...a: A) => R) {
  return (_e: Electron.IpcMainInvokeEvent, ...a: A): R => {
    if (licenseStatus().state !== 'active') throw new Error('未激活');
    return fn(...a);
  };
}

function registerIpc(): void {
  ipcMain.handle('app:info', () => ({ version: app.getVersion(), platform: process.platform }));
  ipcMain.handle('license:status', () => licenseStatus());
  ipcMain.handle('license:activateKeygen', (_e, key: string) => activateKeygen(key));
  ipcMain.handle('license:activateOffline', (_e, code: string) => activateOffline(code));
  ipcMain.handle('license:deactivate', () => deactivateLocal());

  ipcMain.handle('keys:status', gated(() => {
    const acct = readJson<{ ancherAccount?: string }>('settings.json', {}).ancherAccount;
    return { ancher: !!getSecret('ancher'), gemini: !!getSecret('gemini'), ancherAccount: acct, encryption: encryptionAvailable() };
  }));
  ipcMain.handle('keys:setAncher', gated(async (key: string): Promise<KeyResult> => {
    const r = await ai.checkAncherKey(ai.ancher(key.trim()));
    if (!r.ok) return { ok: false, message: r.message };
    setSecret('ancher', key.trim());
    writeJson('settings.json', { ...readJson('settings.json', {}), ancherAccount: r.email });
    return { ok: true, account: r.email };
  }));
  ipcMain.handle('keys:setGemini', gated(async (key: string): Promise<KeyResult> => {
    const r = await checkGeminiKey(key.trim());
    if (!r.ok) return { ok: false, message: r.message };
    setSecret('gemini', key.trim());
    return { ok: true };
  }));
  ipcMain.handle('keys:clear', gated((which: 'ancher' | 'gemini') => setSecret(which, null)));

  ipcMain.handle('projects:list', gated(() => projects.list()));
  ipcMain.handle('projects:create', gated((title: string, kind: ProjectMeta['kind']) => projects.create(title, kind)));
  ipcMain.handle('projects:open', gated((id: string) => projects.state(projects.get(id))));
  ipcMain.handle('projects:rename', gated((id: string, title: string) => projects.rename(id, title)));
  ipcMain.handle('projects:remove', gated((id: string) => projects.remove(id)));
  ipcMain.handle('projects:edit', gated((id: string, edits: Edit[]) => projects.edit(id, edits)));
  ipcMain.handle('projects:undoTurn', gated((id: string, turnId: string) => projects.undoTurn(id, turnId)));

  const KINDS = new Set<BibleKind>(['characters', 'relations', 'locations', 'props', 'world', 'files']);
  const kind = (k: string): BibleKind => { if (!KINDS.has(k as BibleKind)) throw new Error('bad kind'); return k as BibleKind; };
  ipcMain.handle('bible:add', gated((id: string, k: string, data: object) => projects.bibleAdd(id, kind(k), data)));
  ipcMain.handle('bible:update', gated((id: string, k: string, itemId: string, patch: object) => projects.bibleUpdate(id, kind(k), itemId, patch)));
  ipcMain.handle('bible:remove', gated((id: string, k: string, itemId: string) => projects.bibleRemove(id, kind(k), itemId)));
  ipcMain.handle('bible:move', gated((id: string, k: string, itemId: string, to: number) => projects.bibleMove(id, kind(k), itemId, to)));

  const winOf = (e: Electron.IpcMainInvokeEvent) => { const w = BrowserWindow.fromWebContents(e.sender); if (!w) throw new Error('no window'); return w; };
  ipcMain.handle('files:pick', (e, id: string) => { if (licenseStatus().state !== 'active') throw new Error('未激活'); return files.pickFiles(winOf(e), id); });
  ipcMain.handle('files:addPaths', gated((id: string, paths: string[]) => files.addPaths(id, paths)));
  ipcMain.handle('files:open', gated((id: string, fileId: string) => files.openFile(id, fileId)));
  ipcMain.handle('files:pickImage', (e, id: string) => { if (licenseStatus().state !== 'active') throw new Error('未激活'); return files.pickImage(winOf(e), id); });
  ipcMain.handle('files:readImage', gated((id: string, file: string) => files.readImage(id, file)));

  ipcMain.handle('ai:write', (e, req: AiWriteRequest) => {
    if (licenseStatus().state !== 'active') throw new Error('未激活');
    return ai.write(req, e.sender);
  });
  ipcMain.handle('ai:cancel', (_e, reqId: string) => ai.cancel(reqId));
  ipcMain.handle('export:save', (e, id: string, format: ExportFormat) => {
    if (licenseStatus().state !== 'active') throw new Error('未激活');
    const w = BrowserWindow.fromWebContents(e.sender);
    return w ? exportSave(w, id, format) : { ok: false };
  });
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('before-quit', () => projects.flushAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
