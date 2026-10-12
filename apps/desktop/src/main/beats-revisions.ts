// Episode beats history shares the snapshot transaction, so a failed save cannot create a phantom version.
import type { DatabaseSync } from 'node:sqlite';
import { wordCount } from '@scripter/core/script';
import type { BeatsRevision, ScriptRevisionInfo } from '../shared/ipc.ts';

export interface RevisionSave { episodeId: string; text: string; label: string; force?: boolean }
const table = 'CREATE TABLE IF NOT EXISTS beats_revisions (episodeId TEXT NOT NULL, revision INTEGER NOT NULL, at INTEGER NOT NULL, label TEXT NOT NULL, words INTEGER NOT NULL, text TEXT NOT NULL, PRIMARY KEY(episodeId,revision))';
function checkedText(text: unknown): string {
  if (typeof text !== 'string') throw new Error('版本内容无法读取');
  return text;
}
const words = (text: string) => wordCount([{ id: 'beats', type: 'action', text }]);
export function recordRevisions(db: DatabaseSync, versions: RevisionSave[]): void {
  db.exec(table);
  for (const v of versions) {
    const text = checkedText(v.text);
    const latest = db.prepare('SELECT revision,text FROM beats_revisions WHERE episodeId=? ORDER BY revision DESC LIMIT 1').get(v.episodeId);
    if (!v.force && latest?.text === text) continue;
    db.prepare('INSERT INTO beats_revisions VALUES(?,?,?,?,?,?)').run(v.episodeId, Number(latest?.revision ?? 0) + 1, Date.now(), v.label, words(text), text);
  }
}
function hasTable(db: DatabaseSync): boolean { return !!db.prepare("SELECT name FROM sqlite_master WHERE name='beats_revisions'").get(); }
export function revisionList(db: DatabaseSync, episodeId: string): ScriptRevisionInfo[] {
  if (!hasTable(db)) return [];
  return db.prepare('SELECT episodeId,revision,at,label,words FROM beats_revisions WHERE episodeId=? ORDER BY revision DESC').all(episodeId) as unknown as ScriptRevisionInfo[];
}
export function revisionRead(db: DatabaseSync, episodeId: string, revision: number): BeatsRevision {
  if (!Number.isSafeInteger(revision) || revision < 1 || !hasTable(db)) throw new Error('版本不存在');
  const row = db.prepare('SELECT * FROM beats_revisions WHERE episodeId=? AND revision=?').get(episodeId, revision);
  if (!row || typeof row.text !== 'string') throw new Error('版本不存在');
  return { ...(row as unknown as ScriptRevisionInfo), text: checkedText(row.text) };
}
export function revisionExport(db: DatabaseSync): BeatsRevision[] {
  if (!hasTable(db)) return [];
  return db.prepare('SELECT episodeId,revision FROM beats_revisions ORDER BY episodeId,revision').all().map(r => revisionRead(db, String(r.episodeId), Number(r.revision)));
}
export function revisionImport(db: DatabaseSync, input: unknown): void {
  if (!Array.isArray(input)) throw new Error('版本历史格式无效');
  db.exec(table);
  for (const v of input) {
    if (!v || typeof v.episodeId !== 'string' || !Number.isSafeInteger(v.revision) || v.revision < 1 || !Number.isSafeInteger(v.at) || v.at < 0 || typeof v.label !== 'string') throw new Error('版本历史格式无效');
    const text = checkedText(v.text);
    db.prepare('INSERT INTO beats_revisions VALUES(?,?,?,?,?,?)').run(v.episodeId, v.revision, v.at, v.label.slice(0, 300), words(text), text);
  }
}
