// Durable project storage. SQLite and its rollback journal live outside the installation directory.
import { DatabaseSync } from 'node:sqlite';
import { chmodSync, closeSync, existsSync, fsyncSync, openSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { recordRevisions, revisionList, revisionRead, revisionExport, revisionImport, type RevisionSave } from './script-revisions.ts';
import * as beats from './beats-revisions.ts';
import * as outlines from './outline-revisions.ts';
export interface Snapshot { meta: string; script: Uint8Array; legacy?: boolean; beatsRevisions?: import('../shared/ipc.ts').BeatsRevision[]; outlineRevisions?: import('../shared/ipc.ts').OutlineRevision[]; revisions?: import('../shared/ipc.ts').ScriptRevision[] }
export interface LocalBackup { name: string; at: number; reason: string }
const filename = 'project.sqlite';
function database(path: string, readOnly = false, initialize = false): DatabaseSync {
  const db = new DatabaseSync(path, { readOnly });
  try {
    const version = db.prepare('PRAGMA user_version').get()?.user_version;
    if (typeof version === 'number' && version > 1) throw new Error('本地数据由较新版本创建，请升级应用；没有覆盖数据');
    db.exec('PRAGMA busy_timeout=5000');
    if (!readOnly) {
      chmodSync(path, 0o600);
      db.exec('PRAGMA synchronous=FULL; PRAGMA journal_mode=DELETE');
      if (initialize) db.exec('CREATE TABLE IF NOT EXISTS snapshot (id INTEGER PRIMARY KEY CHECK(id=1), meta TEXT NOT NULL, script BLOB NOT NULL, build TEXT NOT NULL); PRAGMA user_version=1');
    }
    return db;
  } catch (e) { db.close(); throw e; }
}
function checked(row: Record<string, unknown> | undefined): Snapshot {
  if (typeof row?.meta !== 'string' || !(row.script instanceof Uint8Array) || !row.script.length) throw new Error('本地项目快照不完整');
  const meta = JSON.parse(row.meta);
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new Error('本地项目元数据不完整');
  return { meta: row.meta, script: row.script };
}
export function loadSnapshot(dir: string): Snapshot {
  if (existsSync(join(dir, filename))) {
    const db = database(join(dir, filename)); // writable so SQLite can recover a hot rollback journal
    try { if (db.prepare("SELECT name FROM sqlite_master WHERE name='snapshot'").get()) { const row = db.prepare('SELECT meta,script FROM snapshot WHERE id=1').get(); if (row) return checked(row); } }
    finally { db.close(); }
  }
  return { meta: readFileSync(join(dir, 'meta.json'), 'utf8'), script: new Uint8Array(readFileSync(join(dir, 'script.loro'))), legacy: true };
}
export function listBackups(dir: string): LocalBackup[] {
  const root = join(dir, 'backups');
  if (!existsSync(root)) return [];
  return readdirSync(root).filter((n) => /^(daily|upgrade|manual|migration)-[a-z0-9-]+\.sqlite$/.test(n)).map((name) => ({ name, at: statSync(join(root, name)).mtimeMs, reason: ({ daily: '每日自动', upgrade: '升级前', manual: '手动', migration: '旧数据迁移' } as Record<string, string>)[name.split('-')[0]!]! })).sort((a, b) => b.at - a.at);
}
function copyBackup(dir: string, db: DatabaseSync, kind: string, name?: string): string {
  const root = join(dir, 'backups'); mkdirSync(root, { recursive: true, mode: 0o700 });
  const file = name ?? `${kind}-${Date.now()}-${randomUUID()}.sqlite`;
  const final = join(root, file);
  let valid = false;
  if (existsSync(final)) { try { const existing = database(final, true); try { checked(existing.prepare('SELECT meta,script FROM snapshot WHERE id=1').get()); valid = true; } finally { existing.close(); } } catch { /* rebuild a partial backup */ } }
  if (!valid) {
    const temp = `${final}.${randomUUID()}.tmp`;
    try {
      db.prepare('VACUUM INTO ?').run(temp); chmodSync(temp, 0o600);
      const verify = database(temp, true); try { checked(verify.prepare('SELECT meta,script FROM snapshot WHERE id=1').get()); } finally { verify.close(); }
      const fd = openSync(temp, 'r+'); try { fsyncSync(fd); } finally { closeSync(fd); }
      renameSync(temp, final);
      if (process.platform !== 'win32') { const folder = openSync(root, 'r'); try { fsyncSync(folder); } finally { closeSync(folder); } }
    } finally { rmSync(temp, { force: true }); }
  }
  const keep = kind === 'daily' ? 7 : 5;
  if (kind !== 'migration') for (const old of listBackups(dir).filter((b) => b.name.startsWith(`${kind}-`)).slice(keep)) rmSync(join(root, old.name));
  return file;
}
export function saveSnapshot(dir: string, snapshot: Snapshot, build: string, versions: RevisionSave[] = [], outlineVersions: outlines.RevisionSave[] = [], beatsVersions: beats.RevisionSave[] = []): void {
  JSON.parse(snapshot.meta); // malformed metadata must never enter the database
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const db = database(join(dir, filename), false, true);
  try {
    const old = db.prepare('SELECT build FROM snapshot WHERE id=1').get();
    if (old && old.build !== build) copyBackup(dir, db, 'upgrade');
    if (old) copyBackup(dir, db, 'daily', `daily-${new Date().toISOString().slice(0, 10)}.sqlite`);
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('INSERT INTO snapshot(id,meta,script,build) VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET meta=excluded.meta,script=excluded.script,build=excluded.build').run(snapshot.meta, snapshot.script, build);
      if (versions.length) recordRevisions(db, versions);
      if (outlineVersions.length) outlines.recordRevisions(db, outlineVersions);
      if (beatsVersions.length) beats.recordRevisions(db, beatsVersions);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    if (!old && existsSync(join(dir, 'meta.json'))) copyBackup(dir, db, 'migration');
    if (!old) copyBackup(dir, db, 'daily', `daily-${new Date().toISOString().slice(0, 10)}.sqlite`);
  } finally { db.close(); }
}
export function listScriptRevisions(dir: string, episodeId: string) {
  const db = database(join(dir, filename), true);
  try { return revisionList(db, episodeId); } finally { db.close(); }
}
export function readScriptRevision(dir: string, episodeId: string, revision: number) {
  const db = database(join(dir, filename), true);
  try { return revisionRead(db, episodeId, revision); } finally { db.close(); }
}
export function exportScriptRevisions(dir: string) {
  const db = database(join(dir, filename), true);
  try { return revisionExport(db); } finally { db.close(); }
}
/** Import into a newly created project only; duplicate versions are rejected rather than overwritten. */
export function importScriptRevisions(dir: string, versions: unknown): void {
  const db = database(join(dir, filename), false, true);
  try {
    db.exec('BEGIN IMMEDIATE');
    try { revisionImport(db, versions); db.exec('COMMIT'); }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  } finally { db.close(); }
}
export function backupSnapshot(dir: string, kind = 'manual'): string {
  const db = database(join(dir, filename), true);
  try { checked(db.prepare('SELECT meta,script FROM snapshot WHERE id=1').get()); return copyBackup(dir, db, kind); }
  finally { db.close(); }
}
export function readBackup(dir: string, name: string): Snapshot {
  if (!listBackups(dir).some((b) => b.name === name)) throw new Error('备份名称无效');
  const db = database(join(dir, 'backups', name), true);
  try { return { ...checked(db.prepare('SELECT meta,script FROM snapshot WHERE id=1').get()), revisions: revisionExport(db), outlineRevisions: outlines.revisionExport(db), beatsRevisions: beats.revisionExport(db) }; }
  finally { db.close(); }
}

export function listOutlineRevisions(dir: string, episodeId: string) {
  const db = database(join(dir, filename), true);
  try { return outlines.revisionList(db, episodeId); } finally { db.close(); }
}
export function readOutlineRevision(dir: string, episodeId: string, revision: number) {
  const db = database(join(dir, filename), true);
  try { return outlines.revisionRead(db, episodeId, revision); } finally { db.close(); }
}
export function exportOutlineRevisions(dir: string) {
  const db = database(join(dir, filename), true);
  try { return outlines.revisionExport(db); } finally { db.close(); }
}
export function importOutlineRevisions(dir: string, versions: unknown): void {
  const db = database(join(dir, filename), false, true);
  try {
    db.exec('BEGIN IMMEDIATE');
    try { outlines.revisionImport(db, versions); db.exec('COMMIT'); }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  } finally { db.close(); }
}

export function listBeatsRevisions(dir: string, episodeId: string) {
  const db = database(join(dir, filename), true);
  try { return beats.revisionList(db, episodeId); } finally { db.close(); }
}
export function readBeatsRevision(dir: string, episodeId: string, revision: number) {
  const db = database(join(dir, filename), true);
  try { return beats.revisionRead(db, episodeId, revision); } finally { db.close(); }
}
export function exportBeatsRevisions(dir: string) {
  const db = database(join(dir, filename), true);
  try { return beats.revisionExport(db); } finally { db.close(); }
}
export function importBeatsRevisions(dir: string, versions: unknown): void {
  const db = database(join(dir, filename), false, true);
  try {
    db.exec('BEGIN IMMEDIATE');
    try { beats.revisionImport(db, versions); db.exec('COMMIT'); }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  } finally { db.close(); }
}
