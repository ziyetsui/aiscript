// Projects live in userData/projects/<id>/: script.loro (Loro snapshot, the source of truth) + meta.json.
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ScriptDoc, scenes, wordCount, type Turn } from '@scripter/core';
import type { Edit, ProjectMeta, ProjectState } from '../shared/ipc.ts';
import { dataDir, writeAtomic } from './store.ts';

interface Meta extends ProjectMeta { conversationId?: string | null; turns?: Turn[] }
interface Open { meta: Meta; doc: ScriptDoc; timer?: NodeJS.Timeout }

const root = () => join(dataDir(), 'projects');
const dirOf = (id: string) => {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('bad project id');
  return join(root(), id);
};
const open = new Map<string, Open>();

function readMeta(id: string): Meta {
  return JSON.parse(readFileSync(join(dirOf(id), 'meta.json'), 'utf8')) as Meta;
}

function persist(p: Open): void {
  p.meta.updatedAt = Date.now();
  p.meta.words = wordCount(p.doc.nodes());
  p.meta.turns = [...p.doc.listTurns()];
  writeAtomic(join(dirOf(p.meta.id), 'script.loro'), p.doc.snapshot());
  writeAtomic(join(dirOf(p.meta.id), 'meta.json'), JSON.stringify(p.meta, null, 2));
}

/** Coalesce keystrokes: save 400ms after the last edit, and always on quit. */
function schedule(p: Open): void {
  clearTimeout(p.timer);
  p.timer = setTimeout(() => persist(p), 400);
}

export function flushAll(): void {
  for (const p of open.values()) { clearTimeout(p.timer); persist(p); }
}

export function list(): ProjectMeta[] {
  if (!existsSync(root())) return [];
  return readdirSync(root())
    .filter((d) => existsSync(join(root(), d, 'meta.json')))
    .map((d) => { const { conversationId: _c, turns: _t, ...m } = readMeta(d); return m; })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function create(title: string, kind: ProjectMeta['kind']): ProjectMeta {
  const id = randomUUID();
  mkdirSync(dirOf(id), { recursive: true });
  const meta: Meta = { id, title: title.trim() || '未命名剧本', kind, createdAt: Date.now(), updatedAt: Date.now(), words: 0, conversationId: null, turns: [] };
  const doc = new ScriptDoc();
  doc.setTitle(meta.title);
  const p = { meta, doc };
  open.set(id, p);
  persist(p);
  return meta;
}

export function get(id: string): Open {
  let p = open.get(id);
  if (!p) {
    const meta = readMeta(id);
    const doc = ScriptDoc.fromSnapshot(new Uint8Array(readFileSync(join(dirOf(id), 'script.loro'))));
    doc.loadTurns(meta.turns ?? []);
    p = { meta, doc };
    open.set(id, p);
  }
  return p;
}

export function state(p: Open): ProjectState {
  const nodes = p.doc.nodes();
  const { conversationId: _c, turns: _t, ...meta } = p.meta;
  return { meta: { ...meta, words: wordCount(nodes) }, nodes, scenes: scenes(nodes), turns: p.doc.listTurns().map(({ id, label, undone }) => ({ id, label, undone })) };
}

export function edit(id: string, edits: Edit[]): ProjectState {
  const p = get(id);
  for (const e of edits) {
    if (e.op === 'insert') p.doc.insert(e.after, e.type, e.text, e.id);
    else if (e.op === 'text') p.doc.setText(e.id, e.text);
    else if (e.op === 'type') p.doc.setType(e.id, e.type);
    else p.doc.remove(e.id);
  }
  p.doc.commit('edit');
  schedule(p);
  return state(p);
}

export function rename(id: string, title: string): ProjectState {
  const p = get(id);
  p.meta.title = title.trim() || p.meta.title;
  p.doc.setTitle(p.meta.title);
  persist(p);
  return state(p);
}

export function undoTurn(id: string, turnId: string): ProjectState {
  const p = get(id);
  p.doc.undoTurn(turnId);
  persist(p);
  return state(p);
}

export function saveNow(p: Open): void {
  clearTimeout(p.timer);
  persist(p);
}

export function remove(id: string): void {
  const p = open.get(id);
  if (p) clearTimeout(p.timer);
  open.delete(id);
  rmSync(dirOf(id), { recursive: true, force: true });
}
