// Whole-project export / import (spec 0002 §8: data lives on this machine, so users move projects themselves)
// and the diagnostics bundle (§13.5: logs only — never keys, never script content).
import { app, dialog, type BrowserWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { strToU8, unzipSync, zipSync, strFromU8, type Zippable } from 'fflate';
import type { ProjectMeta } from '../shared/ipc.ts';
import { flushAll, get, list, rename } from './projects.ts';
import { encryptionAvailable, getSecret } from './secrets.ts';
import { dataDir } from './store.ts';
import { licenseStatus } from './license.ts';

const FORMAT = 'ancher-scripter-project';
const MAX_IMPORT = 1024 * 1024 * 1024; // 1 GB

export async function exportProject(win: BrowserWindow, id: string): Promise<{ ok: boolean; path?: string }> {
  flushAll();
  const p = get(id);
  const r = await dialog.showSaveDialog(win, { defaultPath: `${p.meta.title}.scripter`, filters: [{ name: 'Ancher Scripter 项目', extensions: ['scripter'] }] });
  if (r.canceled || !r.filePath) return { ok: false };
  const dir = join(dataDir(), 'projects', id);
  // The Ancher conversation id belongs to this user's Ancher account; open previews are local state.
  const { conversationId: _c, pending: _p, ...meta } = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8')) as Record<string, unknown>;
  cleanPortableMeta(meta);
  const files: Zippable = {
    'manifest.json': strToU8(JSON.stringify({ format: FORMAT, version: 1, app: app.getVersion(), exportedAt: new Date().toISOString(), title: p.meta.title })),
    'meta.json': strToU8(JSON.stringify(meta)),
    'script.loro': new Uint8Array(readFileSync(join(dir, 'script.loro'))),
  };
  const fdir = join(dir, 'files');
  if (existsSync(fdir)) for (const f of readdirSync(fdir)) files[`files/${f}`] = [new Uint8Array(readFileSync(join(fdir, f))), { level: 0 }];
  writeFileSync(r.filePath, zipSync(files, { level: 6 }));
  return { ok: true, path: r.filePath };
}

export async function importProject(win: BrowserWindow, path?: string): Promise<ProjectMeta | null> {
  let src = path;
  if (!src) {
    const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Ancher Scripter 项目', extensions: ['scripter'] }] });
    if (r.canceled || !r.filePaths[0]) return null;
    src = r.filePaths[0];
  }
  if (statSync(src).size > MAX_IMPORT) throw new Error('项目文件超过 1GB');
  let z: Record<string, Uint8Array>;
  try {
    z = unzipSync(new Uint8Array(readFileSync(src)));
  } catch {
    throw new Error('这不是 Ancher Scripter 的项目文件');
  }
  const manifest = z['manifest.json'] ? JSON.parse(strFromU8(z['manifest.json'])) as { format?: string; version?: number } : null;
  if (manifest?.format !== FORMAT || !z['meta.json'] || !z['script.loro']) throw new Error('这不是 Ancher Scripter 的项目文件');
  if ((manifest.version ?? 0) > 1) throw new Error('这个项目由更新版本的 Ancher Scripter 导出，请先升级');
  const id = randomUUID();
  const dir = join(dataDir(), 'projects', id);
  mkdirSync(join(dir, 'files'), { recursive: true });
  const meta = JSON.parse(strFromU8(z['meta.json'])) as ProjectMeta & Record<string, unknown>;
  cleanPortableMeta(meta);
  const taken = new Set(list().map((m) => m.title));
  const title = taken.has(meta.title) ? `${meta.title}（导入）` : meta.title;
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ ...meta, id, title, conversationId: null, pending: {}, updatedAt: Date.now() }));
  writeFileSync(join(dir, 'script.loro'), z['script.loro']);
  for (const [name, bytes] of Object.entries(z)) {
    // Only flat files under files/ with generated-style names; anything else in the archive is ignored.
    const m = /^files\/([a-z0-9]+(?:\.[a-z0-9]{1,8})?)$/i.exec(name);
    if (m) writeFileSync(join(dir, 'files', m[1]!), bytes);
  }
  get(id); // validates the snapshot loads
  if (title !== meta.title) rename(id, title); // keep the doc's own title in step with meta
  return list().find((x) => x.id === id) ?? null;
}

// ---- diagnostics -------------------------------------------------------------------------------------
const logFile = () => join(dataDir(), 'logs', 'main.log');

/** Append one line to the local log. Callers must never pass keys or script text. */
export function log(level: 'info' | 'warn' | 'error', msg: string): void {
  try {
    mkdirSync(join(dataDir(), 'logs'), { recursive: true });
    appendFileSync(logFile(), `${new Date().toISOString()} ${level} ${msg.replace(/\s+/g, ' ').slice(0, 500)}\n`);
  } catch { /* logging must never break the app */ }
}

export async function exportDiagnostics(win: BrowserWindow): Promise<{ ok: boolean; path?: string }> {
  const r = await dialog.showSaveDialog(win, { defaultPath: `ancher-scripter-诊断-${new Date().toISOString().slice(0, 10)}.zip`, filters: [{ name: 'ZIP', extensions: ['zip'] }] });
  if (r.canceled || !r.filePath) return { ok: false };
  const lic = licenseStatus();
  const info = {
    app: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome, node: process.versions.node,
    platform: process.platform, arch: process.arch, locale: app.getLocale(),
    license: lic.state === 'active' ? `active (${lic.via})` : 'inactive',
    keys: { ancher: !!getSecret('ancher'), gemini: !!getSecret('gemini'), keychain: encryptionAvailable() },
    projects: list().length,
  };
  const files: Zippable = { 'info.json': strToU8(JSON.stringify(info, null, 2)) };
  if (existsSync(logFile())) files['main.log'] = new Uint8Array(readFileSync(logFile()).subarray(-2 * 1024 * 1024));
  writeFileSync(r.filePath, zipSync(files));
  return { ok: true, path: r.filePath };
}

/** Remote conversation IDs and executable preview state cannot cross Ancher accounts. */
function cleanPortableMeta(meta: Record<string, unknown>): void {
  delete meta.clarification;
  delete meta.conversationId; delete meta.pending;
  const clearChat = (chat: unknown) => { if (!Array.isArray(chat)) return; for (const m of chat) if (m?.preview?.state === 'open') m.preview.state = 'stale'; };
  clearChat(meta.chat);
  if (Array.isArray(meta.archive)) for (const c of meta.archive) { c.conversationId = null; clearChat(c.chat); }
  if (Array.isArray(meta.workflows)) for (const r of meta.workflows) {
    if (r?.ctx) delete r.ctx.conversationId;
    // Native snapshots also carry prior step context; strip remote account IDs
    // while retaining the suspended execution needed to continue an imported project.
    if (r?.mastra) r.mastra = JSON.parse(JSON.stringify(r.mastra, (key, value) => key === 'conversationId' ? undefined : value));
  }
}
