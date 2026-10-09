// Projects live in userData/projects/<id>/: SQLite is authoritative; JSON/Loro are portable mirrors.
import { app } from 'electron';
import { loadSnapshot, saveSnapshot, backupSnapshot, listBackups, readBackup } from './local-data.ts';
declare const __DATA_BUILD__: string;
import { randomUUID } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ScriptDoc, scenes, wordCount, type BibleItem, type BibleKind, type Op, type Production, type Turn } from '@scripter/core';
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
  /** Earlier conversations, newest last. The current one lives in chat / conversationId. */
  archive?: { id: string; title: string; at: number; chat: ChatMsg[]; conversationId: string | null }[];
}
interface Open { meta: Meta; doc: ScriptDoc; timer?: NodeJS.Timeout }

const root = () => join(dataDir(), 'projects');
const dirOf = (id: string) => {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('bad project id');
  return join(root(), id);
};
const open = new Map<string, Open>();

function readMeta(id: string): Meta {
  return JSON.parse(loadSnapshot(dirOf(id)).meta) as Meta;
}

function persist(p: Open): void {
  p.meta.updatedAt = Date.now();
  p.meta.words = p.doc.episodes().reduce((n, e) => n + wordCount(p.doc.episode(e.id).nodes()), 0);
  p.meta.turns = [...p.doc.listTurns()];
  const snapshot = { script: p.doc.snapshot(), meta: JSON.stringify(p.meta, null, 2) };
  saveSnapshot(dirOf(p.meta.id), snapshot, `${app.getVersion()}:${__DATA_BUILD__}`);
  writeAtomic(join(dirOf(p.meta.id), 'script.loro'), snapshot.script);
  writeAtomic(join(dirOf(p.meta.id), 'meta.json'), snapshot.meta);
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
    .filter((d) => /^[0-9a-f-]{36}$/.test(d) && (existsSync(join(root(), d, 'meta.json')) || existsSync(join(root(), d, 'project.sqlite'))))
    .map((d) => { let stored: Meta; try { stored = readMeta(d); } catch { try { stored = JSON.parse(readFileSync(join(dirOf(d), 'meta.json'), 'utf8')) as Meta; } catch { stored = { id: d, title: '待恢复项目', kind: 'script', createdAt: 0, updatedAt: 0, words: 0 }; } }
      const { conversationId: _c, turns: _t, chat: _h, pending: _p, workflows: _w, archive: _a, ...m } = stored; return m; })
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
    let snapshot: ReturnType<typeof loadSnapshot>;
    try { snapshot = loadSnapshot(dirOf(id)); } catch (e) { if (e instanceof Error && e.message.includes('较新版本')) throw e; throw new Error('本地项目数据无法读取。请到设置 → 项目数据，从备份恢复为副本；原文件未被覆盖。'); }
    const meta = JSON.parse(snapshot.meta) as Meta;
    if (meta.id !== id) throw new Error('项目标识不匹配，原文件未被覆盖');
    const doc = ScriptDoc.fromSnapshot(snapshot.script);
    // Validate the old snapshot before migration, and back it up before any recovery changes.
    if (snapshot.legacy) saveSnapshot(dirOf(id), snapshot, `${app.getVersion()}:${__DATA_BUILD__}`);
    writeAtomic(join(dirOf(id), 'meta.json'), snapshot.meta);
    writeAtomic(join(dirOf(id), 'script.loro'), snapshot.script);
    doc.loadTurns(meta.turns ?? []);
    // Parsing tasks do not survive a restart or a trip through the recycle bin.
    let interrupted = false;
    for (const f of doc.bible('files').all()) if (f.extract === 'working') { doc.bible('files').update(f.id, { extract: 'failed', pinned: false, extractError: '上次读取因应用退出而中断，请重试。' }); interrupted = true; }
    if (interrupted) doc.commit('recover file extraction');
    // Workflow runs left "running" by a quit become retryable failures.
    for (const r of meta.workflows ?? []) if (r.status === 'running') recoverInterrupted(r);
    p = { meta, doc };
    open.set(id, p);
  }
  return p;
}

export function state(p: Open): ProjectState {
  const nodes = p.doc.nodes();
  const { conversationId: _c, turns: _t, chat = [], pending: _p, workflows = [], archive = [], ...meta } = p.meta;
  const episodes = p.doc.episodes().map((e) => { const ns = p.doc.episode(e.id).nodes(); return { ...e, words: wordCount(ns), scenes: scenes(ns).length }; });
  return { meta: { ...meta, words: episodes.reduce((n, e) => n + e.words, 0) }, episodes, activeEpisodeId: p.doc.activeEpisodeId, nodes, scenes: scenes(nodes), turns: p.doc.listTurns().map(({ id, label, undone }) => ({ id, label, undone })), bible: p.doc.readBible(), chat, runs: workflows.map((r) => ({ ...r, ctx: {} })), outline: p.doc.outline, beats: p.doc.beats, cover: p.doc.cover, production: p.doc.production, conversations: archive.map((a) => ({ id: a.id, title: a.title, at: a.at, messages: a.chat.length })).reverse() };
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

export function episode(id: string, action: 'create' | 'select' | 'rename', episodeId?: string, title?: string): ProjectState {
  const p = get(id);
  if ((p.meta.workflows ?? []).some((r) => r.status === 'running' || r.status === 'waiting')) throw new Error('请先完成或取消当前工作流');
  if (action === 'create') p.doc.addEpisode(title ?? '');
  else if (action === 'select') p.doc.selectEpisode(episodeId ?? '');
  else if (action === 'rename') p.doc.renameEpisode(episodeId ?? '', title ?? '');
  else throw new Error('不支持的分集操作');
  if (action !== 'rename') { p.meta.pending = {}; for (const m of p.meta.chat ?? []) if (m.preview?.state === 'open') m.preview.state = 'stale'; }
  saveNow(p); return state(p);
}

export function undoTurn(id: string, turnId: string): ProjectState {
  const p = get(id);
  p.doc.undoTurn(turnId);
  persist(p);
  return state(p);
}

export function pushChat(p: Open, m: ChatMsg): ChatMsg {
  (p.meta.chat ??= []).push(m);
  return m;
}

export function saveNow(p: Open): void {
  clearTimeout(p.timer);
  persist(p);
}

const trashRoot = () => join(dataDir(), 'trash');
const trashDir = (id: string) => { dirOf(id); return join(trashRoot(), id); };
export function trashList(): ProjectMeta[] {
  if (!existsSync(trashRoot())) return [];
  return readdirSync(trashRoot()).filter((id) => /^[0-9a-f-]{36}$/.test(id) && (existsSync(join(trashDir(id), 'meta.json')) || existsSync(join(trashDir(id), 'project.sqlite'))))
    .map((id) => { let m: Meta; try { m = JSON.parse(loadSnapshot(trashDir(id)).meta) as Meta; } catch { try { m = JSON.parse(readFileSync(join(trashDir(id), 'meta.json'), 'utf8')) as Meta; } catch { m = { id, title: '待恢复项目', kind: 'script', createdAt: 0, updatedAt: 0, words: 0 }; } }
      return { id: m.id, title: m.title, kind: m.kind, createdAt: m.createdAt, updatedAt: m.updatedAt, words: m.words }; })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export function restore(id: string): void {
  if (existsSync(dirOf(id))) throw new Error('同名项目已存在，恢复没有覆盖任何文件');
  mkdirSync(root(), { recursive: true });
  renameSync(trashDir(id), dirOf(id));
}
export function purge(id: string): void { rmSync(trashDir(id), { recursive: true, force: true }); }
export function remove(id: string): void {
  const p = open.get(id);
  if (p) clearTimeout(p.timer);
  open.delete(id);
  if (p) saveNow(p);
  mkdirSync(trashRoot(), { recursive: true });
  if (existsSync(trashDir(id))) throw new Error('回收站已有此项目');
  renameSync(dirOf(id), trashDir(id));
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

export function setProduction(id: string, patch: Partial<Production>): ProjectState {
  const p = get(id);
  p.doc.setProduction(patch);
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

/** Title of a conversation: its first user message, trimmed. */
export const conversationTitle = (chat: ChatMsg[]) => {
  const first = chat.find((m) => m.role === 'user')?.text.replace(/\s+/g, ' ').trim() ?? '';
  return first ? (first.length > 24 ? `${first.slice(0, 24)}…` : first) : '新对话';
};

function archiveCurrent(p: Open): void {
  const chat = p.meta.chat ?? [];
  if (!chat.length) return;
  (p.meta.archive ??= []).push({ id: randomUUID(), title: conversationTitle(chat), at: chat.at(-1)!.at, chat, conversationId: p.meta.conversationId ?? null });
}

export function newConversation(id: string): ProjectState {
  const p = get(id);
  archiveCurrent(p);
  p.meta.chat = [];
  p.meta.pending = {};
  p.meta.conversationId = null;
  saveNow(p);
  return state(p);
}

export function openConversation(id: string, convId: string): ProjectState {
  const p = get(id);
  const i = (p.meta.archive ?? []).findIndex((a) => a.id === convId);
  if (i < 0) return state(p);
  const [conv] = p.meta.archive!.splice(i, 1);
  archiveCurrent(p);
  p.meta.chat = conv!.chat;
  p.meta.conversationId = conv!.conversationId;
  p.meta.pending = {}; // open previews of an archived conversation can't be applied any more
  for (const m of p.meta.chat) if (m.preview?.state === 'open') m.preview.state = 'stale';
  saveNow(p);
  return state(p);
}

export function react(id: string, msgId: string, reaction: 'like' | 'dislike' | null): ProjectState {
  const p = get(id);
  const m = p.meta.chat?.find((x) => x.id === msgId);
  if (m) { if (reaction) m.reaction = reaction; else delete m.reaction; }
  saveNow(p);
  return state(p);
}

export function setBeats(id: string, text: string): ProjectState { const p = get(id); p.doc.setBeats(text); p.doc.commit('beats'); schedule(p); return state(p); }

export function setCover(id: string, patch: Partial<ProjectState['cover']>): ProjectState { const p = get(id); p.doc.setCover(patch); schedule(p); return state(p); }


export function localDataInfo() {
  return { path: dataDir(), projects: list().map((p) => ({ id: p.id, title: p.title, backups: listBackups(dirOf(p.id)) })) };
}
export function backupProject(id: string): string {
  saveNow(get(id));
  return backupSnapshot(dirOf(id));
}
/** Recover into a new local project; never overwrite a client's current project. */
export function recoverBackup(id: string, name: string): ProjectMeta {
  const snapshot = readBackup(dirOf(id), name);
  const meta = JSON.parse(snapshot.meta) as Meta;
  const doc = ScriptDoc.fromSnapshot(snapshot.script);
  doc.loadTurns(meta.turns ?? []);
  for (const f of doc.bible('files').all()) if (f.extract === 'working') doc.bible('files').update(f.id, { extract: 'failed', pinned: false, extractError: '备份中的读取任务未完成，请重试。' });
  const nextId = randomUUID(), title = `${meta.title}（备份恢复）`;
  meta.id = nextId; meta.title = title; meta.conversationId = null; meta.pending = {};
  for (const conv of meta.archive ?? []) conv.conversationId = null;
  for (const msgs of [meta.chat ?? [], ...(meta.archive ?? []).map((a) => a.chat)]) for (const msg of msgs) if (msg.preview?.state === 'open') msg.preview.state = 'stale';
  for (const run of meta.workflows ?? []) if (run.status === 'running') recoverInterrupted(run);
  doc.setTitle(title); doc.commit('restore local backup');
  mkdirSync(dirOf(nextId), { recursive: true });
  if (existsSync(filesDir(id))) cpSync(filesDir(id), filesDir(nextId), { recursive: true });
  const restored = { meta, doc }; persist(restored); open.set(nextId, restored);
  return list().find((p) => p.id === nextId)!;
}
