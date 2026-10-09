import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { describeError, loadAncherLibrary, readAncherNote } from '@scripter/agent';
import { ancher } from './ai.ts';
import { getSecret } from './secrets.ts';
import { filePath, filesDir, get, saveNow, state } from './projects.ts';
import { writeAtomic } from './store.ts';

function account() {
  const key = getSecret('ancher');
  if (!key) throw new Error('请先在设置中连接与 Ancher 官网相同账号的 API key');
  return ancher(key);
}
export async function list() {
  try { return await loadAncherLibrary(account()); }
  catch (e) { throw new Error(describeError(e)); }
}
export async function read(noteId: string) {
  try { return await readAncherNote(account(), noteId); }
  catch (e) { throw new Error(describeError(e)); }
}
/** Explicit local copy. Repeated imports select the existing copy, preserving local edits. */
export async function importNote(projectId: string, noteId: string) {
  const fileId = `ancher-${noteId}`;
  const existing = get(projectId);
  if (existing.doc.bible('files').get(fileId)) return { state: state(existing), fileId };
  const { note, body } = await read(noteId);
  if (note.status !== 'ready' || body === null) throw new Error(note.error || '笔记还在处理中，请完成后再保存到项目');
  if (!body.trim()) throw new Error('笔记正文为空');
  const p = get(projectId);
  if (p.doc.bible('files').get(fileId)) return { state: state(p), fileId };
  const file = `${randomBytes(8).toString('hex')}.md`;
  mkdirSync(filesDir(projectId), { recursive: true });
  writeAtomic(filePath(projectId, file), body);
  p.doc.bible('files').add({ id: fileId, title: note.title, name: `${note.title}.md`, file, size: Buffer.byteLength(body), src: 'upload',
    addedAt: Date.now(), excerpt: body.slice(0, 20000), extract: 'ready', summary: note.description, memo: note.memo,
    tags: note.tags.map((label) => ({ label, color: '#496cc2' })),
  });
  p.doc.commit('import Ancher note'); saveNow(p);
  return { state: state(p), fileId };
}
