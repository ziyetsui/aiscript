import { app, BrowserWindow, dialog, ipcMain, nativeTheme, shell } from 'electron';
import { join } from 'node:path';
import { checkGeminiKey } from '@scripter/agent';
import { ART_STYLES, type BibleKind, type Production } from '@scripter/core';

/** Only known production fields with known values cross the IPC boundary. */
function pickProduction(x: object): Partial<Production> {
  const v = x as Record<string, unknown>;
  const out: Partial<Production> = {};
  if (v.aspect === '16:9' || v.aspect === '9:16') out.aspect = v.aspect;
  if (v.kind === '叙事' || v.kind === '商业') out.kind = v.kind;
  if (typeof v.style === 'string' && (ART_STYLES.some((s) => s.name === v.style) || v.style === '自定义')) out.style = v.style;
  if (typeof v.styleNote === 'string') out.styleNote = v.styleNote.slice(0, 400);
  return out;
}
import type { AiWriteRequest, Edit, ExportFormat, KeyResult, ProjectMeta, WorkflowAction, WorkflowId, WorkflowInput } from '../shared/ipc.ts';
import * as ai from './ai.ts';
import { save as exportSave } from './exporter.ts';
import { activateKeygen, activateOffline, deactivateLocal, licenseStatus } from './license.ts';
import * as archive from './archive.ts';
import * as updater from './updater.ts';
import * as files from './files.ts';
import * as ancherNotes from './ancher-notes.ts';
import * as wf from './workflows.ts';
import * as projects from './projects.ts';
import { encryptionAvailable, getSecret, setSecret } from './secrets.ts';
import { readJson, writeJson } from './store.ts';

// Dev/test-only overrides (never honoured in a packaged build): isolated data dir for E2E runs.
if (!app.isPackaged && process.env.SCRIPTER_USER_DATA) app.setPath('userData', process.env.SCRIPTER_USER_DATA);
// E2E runs on a developer's desktop: never take keyboard focus, so their typing can't leak into the test window.
const e2e = !app.isPackaged && process.env.SCRIPTER_E2E === '1';
if (e2e && process.platform === 'darwin') app.setActivationPolicy('accessory');

if (!app.requestSingleInstanceLock()) app.quit();

let win: BrowserWindow | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 1360, height: 860, minWidth: 980, minHeight: 640, show: false,
    title: 'Ancher Scripter', backgroundColor: nativeTheme.shouldUseDarkColors ? '#111110' : '#f9f9f8',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: { preload: join(import.meta.dirname, '../preload/index.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  win.once('ready-to-show', () => (e2e ? win?.showInactive() : win?.show()));
  if (!e2e) updater.initUpdater(win);
  // Links open in the system browser; the app window never navigates away.
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) void shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('http://localhost') && !url.startsWith('file://')) e.preventDefault(); });
  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  else void win.loadFile(join(import.meta.dirname, '../renderer/index.html'));
}

/** Everything except license/app info refuses to run until the machine is activated. */
function gated<A extends unknown[], R>(fn: (...a: A) => R) {
  return (_e: Electron.IpcMainInvokeEvent, ...a: A): R => {
    if (licenseStatus().state !== 'active') throw new Error('未激活');
    return fn(...a);
  };
}

/** 外观: 跟随系统 / 亮色 / 暗色. Electron's nativeTheme drives prefers-color-scheme in the renderer. */
type Theme = 'system' | 'light' | 'dark';
const themeSetting = (): Theme => { const t = readJson<{ theme?: Theme }>('settings.json', {}).theme; return t === 'system' || t === 'light' || t === 'dark' ? t : 'light'; };

const active = () => { if (licenseStatus().state !== 'active') throw new Error('未激活'); };

function registerIpc(): void {
  ipcMain.handle('app:info', () => ({ version: app.getVersion(), platform: process.platform }));
  ipcMain.handle('app:getTheme', () => themeSetting());
  ipcMain.handle('app:setTheme', (_e, t: Theme) => {
    if (!['system', 'light', 'dark'].includes(t)) return themeSetting();
    writeJson('settings.json', { ...readJson('settings.json', {}), theme: t });
    nativeTheme.themeSource = t;
    for (const w of BrowserWindow.getAllWindows()) w.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#111110' : '#f9f9f8');
    return t;
  });
  ipcMain.handle('update:status', () => updater.updateStatus());
  ipcMain.handle('update:check', () => updater.checkNow());
  ipcMain.handle('update:install', () => updater.installNow());
  ipcMain.handle('app:diagnostics', (e) => { const w = BrowserWindow.fromWebContents(e.sender); return w ? archive.exportDiagnostics(w) : { ok: false }; });
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
  ipcMain.handle('projects:episode', gated((id: string, action: 'create' | 'select' | 'rename', episodeId?: string, title?: string) => { if (ai.isBusy(id)) throw new Error('请先停止正在生成的内容'); return projects.episode(id, action, episodeId, title); }));
  ipcMain.handle('projects:rename', gated((id: string, title: string) => projects.rename(id, title)));
  ipcMain.handle('projects:remove', gated((id: string) => { if (ai.isBusy(id) || projects.state(projects.get(id)).runs.some((r) => r.status === 'running')) throw new Error('请先停止正在生成的内容'); projects.remove(id); }));
  ipcMain.handle('projects:trashList', gated(() => projects.trashList()));
  ipcMain.handle('projects:restore', gated((id: string) => projects.restore(id)));
  ipcMain.handle('projects:purge', gated((id: string) => projects.purge(id)));
  ipcMain.handle('projects:edit', gated((id: string, edits: Edit[]) => projects.edit(id, edits)));
  ipcMain.handle('projects:undoTurn', gated((id: string, turnId: string) => projects.undoTurn(id, turnId)));
  ipcMain.handle('projects:exportArchive', (e, id: string) => { active(); const w = BrowserWindow.fromWebContents(e.sender); return w ? archive.exportProject(w, id) : { ok: false }; });
  ipcMain.handle('projects:importArchive', async (e) => {
    active();
    const w = BrowserWindow.fromWebContents(e.sender);
    if (!w) return null;
    try { return await archive.importProject(w); } catch (err) { archive.log('warn', `import failed: ${(err as Error).message}`); throw err; }
  });
  ipcMain.handle('projects:setCover', gated((id: string, patch: object) => projects.setCover(id, patch)));
  ipcMain.handle('projects:setBeats', gated((id: string, text: string) => projects.setBeats(id, text)));
  ipcMain.handle('projects:setOutline', gated((id: string, text: string) => projects.setOutline(id, text)));
  ipcMain.handle('projects:setProduction', gated((id: string, patch: object) => projects.setProduction(id, pickProduction(patch))));

  ipcMain.handle('wf:start', (e, projectId: string, id: WorkflowId, input: WorkflowInput) => { active(); return wf.start(projectId, id, input, e.sender); });
  ipcMain.handle('wf:cancel', (_e, runId: string, projectId?: string) => wf.cancel(runId, projectId));
  ipcMain.handle('wf:confirm', (e, projectId: string, runId: string, text: string) => { active(); return wf.confirmStep(projectId, runId, text, e.sender); });
  ipcMain.handle('wf:retry', (e, projectId: string, runId: string) => { active(); return wf.retry(projectId, runId, e.sender); });
  ipcMain.handle('wf:apply', gated((projectId: string, runId: string, a: WorkflowAction) => wf.apply(projectId, runId, a)));
  ipcMain.handle('wf:pickFile', async (e, kind: 'media' | 'any') => {
    active();
    const w = BrowserWindow.fromWebContents(e.sender);
    if (!w) return null;
    const r = await dialog.showOpenDialog(w, { properties: ['openFile'], filters: kind === 'media' ? [{ name: '视频 / 音频', extensions: ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'mp3', 'wav', 'm4a', 'aac'] }] : [{ name: '文件', extensions: ['*'] }] });
    return r.canceled ? null : r.filePaths[0] ?? null;
  });

  const KINDS = new Set<BibleKind>(['characters', 'relations', 'locations', 'props', 'world', 'files', 'shots']);
  const kind = (k: string): BibleKind => { if (!KINDS.has(k as BibleKind)) throw new Error('bad kind'); return k as BibleKind; };
  ipcMain.handle('bible:add', gated((id: string, k: string, data: object) => projects.bibleAdd(id, kind(k), data)));
  ipcMain.handle('bible:update', gated((id: string, k: string, itemId: string, patch: object) => projects.bibleUpdate(id, kind(k), itemId, patch)));
  ipcMain.handle('bible:remove', gated((id: string, k: string, itemId: string) => projects.bibleRemove(id, kind(k), itemId)));
  ipcMain.handle('bible:move', gated((id: string, k: string, itemId: string, to: number) => projects.bibleMove(id, kind(k), itemId, to)));

  const winOf = (e: Electron.IpcMainInvokeEvent) => { const w = BrowserWindow.fromWebContents(e.sender); if (!w) throw new Error('no window'); return w; };
  ipcMain.handle('files:pick', (e, id: string) => { if (licenseStatus().state !== 'active') throw new Error('未激活'); return files.pickFiles(winOf(e), id); });
  ipcMain.handle('ancherNotes:list', gated(ancherNotes.list));
  ipcMain.handle('ancherNotes:read', gated(ancherNotes.read));
  ipcMain.handle('ancherNotes:import', gated(ancherNotes.importNote));
  ipcMain.handle('files:collection', gated(files.collection));
  ipcMain.handle('files:exportNote', (e, id: string, fileId: string) => { active(); return files.exportNote(winOf(e), id, fileId); });
  ipcMain.handle('files:update', gated(files.update));
  ipcMain.handle('files:createNote', gated(files.createNote));
  ipcMain.handle('files:readBody', gated(files.readBody));
  ipcMain.handle('files:saveBody', gated(files.saveBody));
  ipcMain.handle('files:addPaths', gated((id: string, paths: string[]) => files.addPaths(id, paths)));
  ipcMain.handle('files:open', gated((id: string, fileId: string) => files.openFile(id, fileId)));
  ipcMain.handle('files:pickImage', (e, id: string) => { if (licenseStatus().state !== 'active') throw new Error('未激活'); return files.pickImage(winOf(e), id); });
  ipcMain.handle('files:readImage', gated((id: string, file: string) => files.readImage(id, file)));

  ipcMain.handle('ai:write', (e, req: AiWriteRequest) => {
    if (licenseStatus().state !== 'active') throw new Error('未激活');
    return ai.write(req, e.sender);
  });
  ipcMain.handle('ai:cancel', (_e, reqId: string) => ai.cancel(reqId));
  ipcMain.handle('ai:status', gated((id: string) => ({ busy: ai.isBusy(id) })));
  const chatIdle = (id: string) => { if (ai.isBusy(id)) throw new Error('请等待当前生成完成后再切换对话'); };
  ipcMain.handle('chat:new', gated((id: string) => { chatIdle(id); return projects.newConversation(id); }));
  ipcMain.handle('chat:open', gated((id: string, convId: string) => { chatIdle(id); return projects.openConversation(id, convId); }));
  ipcMain.handle('chat:react', gated((id: string, msgId: string, r: 'like' | 'dislike' | null) => projects.react(id, msgId, r)));
  ipcMain.handle('chat:saveNote', gated((id: string, msgId: string | null) => files.saveNote(id, msgId)));
  ipcMain.handle('ai:reverse', gated((projectId: string, kind: 'characters' | 'locations', itemId: string) => ai.reverse(projectId, kind, itemId)));
  ipcMain.handle('ai:summarizeNote', gated(ai.summarizeNote));
  ipcMain.handle('ai:scenePrompt', gated((projectId: string, sceneId: string) => ai.scenePrompt(projectId, sceneId)));
  ipcMain.handle('ai:selection', gated((kind: 'explain' | 'summarize' | 'translate', text: string) => ai.selection(kind, text)));
  ipcMain.handle('files:pin', (e, id: string, fileId: string, on: boolean) => { active(); return files.pin(id, fileId, on, () => { if (!e.sender.isDestroyed()) e.sender.send('project:changed', { projectId: id }); }); });
  ipcMain.handle('ai:resolve', gated((projectId: string, msgId: string, accept: boolean) => ai.resolve(projectId, msgId, accept)));
  ipcMain.handle('export:save', (e, id: string, format: ExportFormat, selection?: import('../shared/ipc.ts').ExportSelection) => {
    if (licenseStatus().state !== 'active') throw new Error('未激活');
    const w = BrowserWindow.fromWebContents(e.sender);
    return w ? exportSave(w, id, format, selection) : { ok: false };
  });
}

process.on('uncaughtException', (e) => archive.log('error', `uncaught: ${e.message}`));
process.on('unhandledRejection', (e) => archive.log('error', `unhandled: ${e instanceof Error ? e.message : String(e)}`));

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  nativeTheme.themeSource = themeSetting(); // before the window exists, so it never flashes the wrong theme
  registerIpc();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('before-quit', () => projects.flushAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
