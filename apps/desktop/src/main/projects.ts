// Projects live in userData/projects/<id>/: script.loro (Loro snapshot, the source of truth) + meta.json.
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ScriptDoc, scenes, wordCount, type BibleItem, type BibleKind, type Op, type Turn } from '@scripter/core';
import { recoverInterrupted, type RunState } from '@scripter/agent';
import type { ChatMsg, Edit, ProjectMeta, ProjectState } from '../shared/ipc.ts';
import { dataDir, writeAtomic } from './store.ts';

interface Meta extends ProjectMeta {
  conversationId?: string | null;
  turns?: Turn[];
  chat?: ChatMsg[];
  /** Ops behind each open modification preview, keyed by chat message id. Never sent to the renderer. */
  pending?: Record<string, { ops: Op[]; label: string }>;
  workflows?: RunState[];
}
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
    .map((d) => { const { conversationId: _c, turns: _t, chat: _h, pending: _p, workflows: _w, ...m } = readMeta(d); return m; })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function create(title: string, kind: ProjectMeta['kind']): ProjectMeta {
  const id = randomUUID();
  mkdirSync(dirOf(id), { recursive: true });
  const meta: Meta = { id, title: title.trim() || '未命名剧本', kind, createdAt: Date.now(), updatedAt: Date.now(), words: 0, conversationId: null, turns: [], chat: [], pending: {} };
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
    // Workflow runs left "running" by a quit become retryable failures.
    for (const r of meta.workflows ?? []) if (r.status === 'running') recoverInterrupted(r);
    p = { meta, doc };
    open.set(id, p);
  }
  return p;
}

export function state(p: Open): ProjectState {
  const nodes = p.doc.nodes();
  const { conversationId: _c, turns: _t, chat = [], pending: _p, workflows = [], ...meta } = p.meta;
  return { meta: { ...meta, words: wordCount(nodes) }, nodes, scenes: scenes(nodes), turns: p.doc.listTurns().map(({ id, label, undone }) => ({ id, label, undone })), bible: p.doc.readBible(), chat, runs: workflows.map((r) => ({ ...r, ctx: {} })), outline: p.doc.outline };
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

export function pushChat(p: Open, m: ChatMsg): ChatMsg {
  (p.meta.chat ??= []).push(m);
  if (p.meta.chat.length > 400) p.meta.chat.splice(0, p.meta.chat.length - 400);
  return m;
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

/** Project-owned files (knowledge base, reference images) live in <project>/files/. Names are generated, never user paths. */
export const filesDir = (id: string) => join(dirOf(id), 'files');
export function filePath(id: string, file: string): string {
  if (!/^[a-z0-9]+\.[a-z0-9]{1,8}$/i.test(file) && !/^[a-z0-9]+$/i.test(file)) throw new Error('bad file name');
  return join(filesDir(id), file);
}

export function bibleAdd<K extends BibleKind>(id: string, kind: K, data: Partial<BibleItem<K>>): ProjectState {
  const p = get(id);
  p.doc.bible(kind).add(data);
  p.doc.commit(`add ${kind}`);
  schedule(p);
  return state(p);
}

export function bibleUpdate<K extends BibleKind>(id: string, kind: K, itemId: string, patch: Partial<BibleItem<K>>): ProjectState {
  const p = get(id);
  p.doc.bible(kind).update(itemId, patch);
  p.doc.commit(`update ${kind}`);
  schedule(p);
  return state(p);
}

export function bibleRemove(id: string, kind: BibleKind, itemId: string): ProjectState {
  const p = get(id);
  if (kind === 'characters') {
    // Relations pointing at a removed character go with it.
    const rel = p.doc.bible('relations');
    for (const r of rel.all()) if (r.a === itemId || r.b === itemId) rel.remove(r.id);
  }
  if (kind === 'files') {
    const f = p.doc.bible('files').get(itemId);
    if (f?.file) rmSync(filePath(id, f.file), { force: true });
  }
  p.doc.bible(kind).remove(itemId);
  p.doc.commit(`remove ${kind}`);
  schedule(p);
  return state(p);
}

export function bibleMove(id: string, kind: BibleKind, itemId: string, to: number): ProjectState {
  const p = get(id);
  p.doc.bible(kind).move(itemId, to);
  p.doc.commit(`move ${kind}`);
  schedule(p);
  return state(p);
}

export function setOutline(id: string, text: string): ProjectState {
  const p = get(id);
  p.doc.setOutline(text);
  p.doc.commit('outline');
  schedule(p);
  return state(p);
}
