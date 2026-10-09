// Episode script history shares the snapshot transaction, so a failed save cannot create a phantom version.
import type { DatabaseSync } from 'node:sqlite';
import { ELEMENT_TYPES, wordCount, type ScriptNode } from '@scripter/core/script';
import type { ScriptRevision, ScriptRevisionInfo } from '../shared/ipc.ts';

export interface RevisionSave { episodeId: string; nodes: ScriptNode[]; label: string; force?: boolean }
const table = 'CREATE TABLE IF NOT EXISTS script_revisions (episodeId TEXT NOT NULL, revision INTEGER NOT NULL, at INTEGER NOT NULL, label TEXT NOT NULL, words INTEGER NOT NULL, nodes TEXT NOT NULL, PRIMARY KEY(episodeId,revision))';
export function checkedRevisionNodes(nodes: unknown): ScriptNode[] {
  if (!Array.isArray(nodes)) throw new Error('版本内容无法读取');
  const ids = new Set<string>();
  for (const n of nodes) {
    if (!n || typeof n.id !== 'string' || !/^[a-z0-9-]{1,80}$/i.test(n.id) || ids.has(n.id) || !ELEMENT_TYPES.includes(n.type) || typeof n.text !== 'string') throw new Error('版本内容无法读取');
    ids.add(n.id);
  }
  return nodes.map(n => ({ id: n.id, type: n.type, text: n.text }));
}
export function recordRevisions(db: DatabaseSync, versions: RevisionSave[]): void {
  db.exec(table);
  for (const v of versions) {
    const nodes = JSON.stringify(checkedRevisionNodes(v.nodes));
    const latest = db.prepare('SELECT revision,nodes FROM script_revisions WHERE episodeId=? ORDER BY revision DESC LIMIT 1').get(v.episodeId);
    if (!v.force && latest?.nodes === nodes) continue;
    db.prepare('INSERT INTO script_revisions VALUES(?,?,?,?,?,?)').run(v.episodeId, Number(latest?.revision ?? 0) + 1, Date.now(), v.label, wordCount(v.nodes), nodes);
  }
}
function hasTable(db: DatabaseSync): boolean { return !!db.prepare("SELECT name FROM sqlite_master WHERE name='script_revisions'").get(); }
export function revisionList(db: DatabaseSync, episodeId: string): ScriptRevisionInfo[] {
  if (!hasTable(db)) return [];
  return db.prepare('SELECT episodeId,revision,at,label,words FROM script_revisions WHERE episodeId=? ORDER BY revision DESC').all(episodeId) as unknown as ScriptRevisionInfo[];
}
export function revisionRead(db: DatabaseSync, episodeId: string, revision: number): ScriptRevision {
  if (!Number.isSafeInteger(revision) || revision < 1 || !hasTable(db)) throw new Error('版本不存在');
  const row = db.prepare('SELECT * FROM script_revisions WHERE episodeId=? AND revision=?').get(episodeId, revision);
  if (!row || typeof row.nodes !== 'string') throw new Error('版本不存在');
  return { ...(row as unknown as ScriptRevisionInfo), nodes: checkedRevisionNodes(JSON.parse(row.nodes)) };
}
export function revisionExport(db: DatabaseSync): ScriptRevision[] {
  if (!hasTable(db)) return [];
  return db.prepare('SELECT episodeId,revision FROM script_revisions ORDER BY episodeId,revision').all().map(r => revisionRead(db, String(r.episodeId), Number(r.revision)));
}
export function revisionImport(db: DatabaseSync, input: unknown): void {
  if (!Array.isArray(input)) throw new Error('版本历史格式无效');
  db.exec(table);
  for (const v of input) {
    if (!v || typeof v.episodeId !== 'string' || !Number.isSafeInteger(v.revision) || v.revision < 1 || !Number.isSafeInteger(v.at) || v.at < 0 || typeof v.label !== 'string') throw new Error('版本历史格式无效');
    const nodes = checkedRevisionNodes(v.nodes);
    db.prepare('INSERT INTO script_revisions VALUES(?,?,?,?,?,?)').run(v.episodeId, v.revision, v.at, v.label.slice(0, 300), wordCount(nodes), JSON.stringify(nodes));
  }
}
