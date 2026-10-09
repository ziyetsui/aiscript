// Loro is the single source of truth for a script (spec 0002 §4.1).
// Every AI turn is recorded as (before, after) frontiers so it can be undone on its own,
// even after the writer has kept typing (§5.4 "turnId → commits", "Undo edit").
import { LoroDoc, LoroMap, LoroText, type Frontiers, type LoroMovableList } from 'loro-crdt';
import { Collection, PRODUCTION_DEFAULTS, readBible, type Bible, type BibleKind, type Production } from './bible.ts';
import { ELEMENT_TYPES, newId, type ElementType, type ScriptNode } from './script.ts';

export interface Turn { id: string; label: string; before: Frontiers; after: Frontiers; undone: boolean; episodeId?: string }
export interface Episode { id: string; title: string }
export interface ScriptCover { author: string; draft: string; date: string }

export class ScriptDoc {
  readonly doc: LoroDoc;
  private turns: Turn[] = [];
  private viewEpisodeId?: string;

  constructor(doc = new LoroDoc()) {
    this.doc = doc;
  }

  static fromSnapshot(bytes: Uint8Array): ScriptDoc {
    return new ScriptDoc(LoroDoc.fromSnapshot(bytes));
  }

  snapshot(): Uint8Array {
    return this.doc.export({ mode: 'snapshot' });
  }

  private get list(): LoroMovableList {
    return this.doc.getMovableList(this.activeEpisodeId === 'first' ? 'nodes' : `nodes:${this.activeEpisodeId}`);
  }

  get activeEpisodeId(): string { return this.viewEpisodeId ?? (this.doc.getMap('meta').get('activeEpisode') as string | undefined) ?? 'first'; }
  episodes(): Episode[] {
    const list = this.doc.getMovableList('episodes');
    if (!list.length) return [{ id: 'first', title: '第 1 集' }];
    return Array.from({ length: list.length }, (_, i) => { const e = list.get(i) as LoroMap; return { id: e.get('id') as string, title: e.get('title') as string }; });
  }
  private episodeEntry(id: string): LoroMap {
    const list = this.doc.getMovableList('episodes');
    if (!list.length) { const e = list.insertContainer(0, new LoroMap()); e.set('id', 'first'); e.set('title', '第 1 集'); }
    for (let i = 0; i < list.length; i++) { const e = list.get(i) as LoroMap; if (e.get('id') === id) return e; }
    throw new Error('分集不存在');
  }
  addEpisode(title: string): string {
    this.episodeEntry('first');
    const id = newId(); const list = this.doc.getMovableList('episodes'); const e = list.insertContainer(list.length, new LoroMap());
    e.set('id', id); e.set('title', title.trim() || `第 ${list.length} 集`); this.selectEpisode(id); return id;
  }
  selectEpisode(id: string): void {
    if (!this.episodes().some((e) => e.id === id)) throw new Error('分集不存在');
    this.doc.getMap('meta').set('activeEpisode', id); this.doc.commit({ message: 'select episode' });
  }
  renameEpisode(id: string, title: string): void {
    if (!title.trim()) throw new Error('分集名称不能为空');
    this.episodeEntry(id).set('title', title.trim()); this.doc.commit({ message: 'rename episode' });
  }
  /** Export/reference view of the same project; never changes the writer's active episode. */
  episode(id: string): ScriptDoc {
    if (!this.episodes().some((e) => e.id === id)) throw new Error('分集不存在');
    const view = new ScriptDoc(this.doc); view.viewEpisodeId = id; return view;
  }

  get title(): string {
    return (this.doc.getMap('meta').get('title') as string | undefined) ?? '未命名剧本';
  }

  setTitle(title: string): void {
    this.doc.getMap('meta').set('title', title);
    this.doc.commit({ message: 'title' });
  }

  /** Story outline (大纲): one rich-text-free LoroText, edited as plain text. */
  get outline(): string {
    return this.doc.getText(this.activeEpisodeId === 'first' ? 'outline' : `outline:${this.activeEpisodeId}`).toString();
  }

  setOutline(text: string): void {
    const t = this.doc.getText(this.activeEpisodeId === 'first' ? 'outline' : `outline:${this.activeEpisodeId}`);
    if (t.toString() === text) return;
    t.delete(0, t.length);
    t.insert(0, text);
  }
  get beats(): string { return this.doc.getText(this.activeEpisodeId === 'first' ? 'beats' : `beats:${this.activeEpisodeId}`).toString(); }
  setBeats(text: string): void {
    const t = this.doc.getText(this.activeEpisodeId === 'first' ? 'beats' : `beats:${this.activeEpisodeId}`);
    if (t.toString() === text) return; t.delete(0, t.length); t.insert(0, text);
  }
  get cover(): ScriptCover { return { author: '', draft: '', date: '', ...this.doc.getMap(`cover:${this.activeEpisodeId}`).toJSON() } as ScriptCover; }
  setCover(patch: Partial<ScriptCover>): void { const m = this.doc.getMap(`cover:${this.activeEpisodeId}`); for (const key of ['author','draft','date'] as const) if (typeof patch[key] === 'string') m.set(key, patch[key]!.slice(0, 500)); this.commit('cover'); }

  /** 制作设置 (prototype P6). */
  get production(): Production {
    return { ...PRODUCTION_DEFAULTS, ...(this.doc.getMap('production').toJSON() as Partial<Production>) };
  }

  setProduction(patch: Partial<Production>): void {
    const m = this.doc.getMap('production');
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v as never);
    this.doc.commit({ message: 'production' });
  }

  bible<K extends BibleKind>(kind: K): Collection<K> {
    return new Collection(this.doc, kind);
  }

  readBible(): Bible {
    return readBible(this.doc);
  }

  nodes(): ScriptNode[] {
    const out: ScriptNode[] = [];
    for (let i = 0; i < this.list.length; i++) {
      const m = this.list.get(i) as LoroMap;
      const text = m.get('text') as LoroText | undefined;
      out.push({ id: m.get('id') as string, type: m.get('type') as ElementType, text: text?.toString() ?? '' });
    }
    return out;
  }

  private indexOf(id: string): number {
    for (let i = 0; i < this.list.length; i++) if ((this.list.get(i) as LoroMap).get('id') === id) return i;
    return -1;
  }

  private mapAt(id: string): LoroMap {
    const i = this.indexOf(id);
    if (i < 0) throw new Error(`node ${id} not found`);
    return this.list.get(i) as LoroMap;
  }

  /** Insert after `afterId` (null = at start, 'end' = append). Returns the new id. Does not commit. */
  insert(afterId: string | null | 'end', type: ElementType, text: string, id = newId()): string {
    const at = afterId === 'end' ? this.list.length : afterId === null ? 0 : this.indexOf(afterId) + 1;
    if (afterId !== 'end' && afterId !== null && at === 0) throw new Error(`node ${afterId} not found`);
    const m = this.list.insertContainer(at, new LoroMap());
    m.set('id', id);
    m.set('type', type);
    m.setContainer('text', new LoroText()).insert(0, text);
    return id;
  }

  setText(id: string, text: string): void {
    const t = this.mapAt(id).get('text') as LoroText;
    // Replace in place; Loro merges concurrent character edits.
    if (t.toString() !== text) {
      t.delete(0, t.length);
      t.insert(0, text);
    }
  }

  setType(id: string, type: ElementType): void {
    if (!ELEMENT_TYPES.includes(type)) throw new Error(`bad type ${type}`);
    this.mapAt(id).set('type', type);
  }

  remove(id: string): void {
    const i = this.indexOf(id);
    if (i >= 0) this.list.delete(i, 1);
  }

  commit(message = 'edit'): void {
    this.doc.commit({ message });
  }

  /** Run `fn` as one AI turn: one commit, recorded for per-turn undo. */
  turn(label: string, fn: (d: ScriptDoc) => void): Turn {
    this.doc.commit();
    const before = this.doc.frontiers();
    try {
      fn(this);
    } catch (e) {
      // Leave nothing half-written (spec §12.4 "取消后不留下半截写入").
      this.doc.commit();
      this.doc.applyDiff(this.doc.diff(this.doc.frontiers(), before));
      this.doc.commit({ message: `rollback ${label}` });
      throw e;
    }
    this.doc.commit({ message: `ai: ${label}` });
    const t: Turn = { id: newId(), label, before, after: this.doc.frontiers(), undone: false, episodeId: this.activeEpisodeId };
    this.turns.push(t);
    return t;
  }

  listTurns(): readonly Turn[] {
    return this.turns;
  }

  /** Turns are persisted next to the snapshot so "撤销这一轮" survives a restart. */
  loadTurns(turns: Turn[]): void {
    this.turns = turns.map((t) => ({ ...t }));
  }

  /** Undo only this turn's changes; later edits by the writer are kept. */
  undoTurn(turnId: string): void {
    const t = this.turns.find((x) => x.id === turnId);
    if (!t || t.undone) return;
    this.doc.commit();
    this.doc.applyDiff(this.doc.diff(t.after, t.before));
    this.doc.commit({ message: `undo ${t.label}` });
    t.undone = true;
  }
}
