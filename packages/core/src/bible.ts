// Loro-backed bible collections (same doc as the script: saves, syncs and undoes alike, spec 0002 §4.1).
import { LoroMap, type LoroDoc, type LoroMovableList } from 'loro-crdt';
import { BIBLE_DEFAULTS as DEFAULTS, BIBLE_KINDS, type Bible, type BibleItem, type BibleKind } from './bible-model.ts';
import { newId } from './script.ts';

export * from './bible-model.ts';

/** A typed view over one LoroMovableList of LoroMaps. Does not commit; callers commit once per user action. */
export class Collection<K extends BibleKind> {
  constructor(private readonly doc: LoroDoc, readonly kind: K) {}

  private get list(): LoroMovableList {
    return this.doc.getMovableList(`bible:${this.kind}`);
  }

  private indexOf(id: string): number {
    for (let i = 0; i < this.list.length; i++) if ((this.list.get(i) as LoroMap).get('id') === id) return i;
    return -1;
  }

  all(): BibleItem<K>[] {
    const out: BibleItem<K>[] = [];
    for (let i = 0; i < this.list.length; i++) {
      const m = this.list.get(i) as LoroMap;
      out.push({ ...DEFAULTS[this.kind], ...(m.toJSON() as object) } as unknown as BibleItem<K>);
    }
    return out;
  }

  get(id: string): BibleItem<K> | undefined {
    return this.all().find((x) => x.id === id);
  }

  add(data: Partial<BibleItem<K>>, at?: number): BibleItem<K> {
    const item = { ...DEFAULTS[this.kind], ...data, id: data.id ?? newId() } as unknown as BibleItem<K>;
    const m = this.list.insertContainer(at ?? this.list.length, new LoroMap());
    for (const [k, v] of Object.entries(item)) m.set(k, v as never);
    return item;
  }

  update(id: string, patch: Partial<BibleItem<K>>): void {
    const i = this.indexOf(id);
    if (i < 0) throw new Error(`${this.kind} ${id} not found`);
    const m = this.list.get(i) as LoroMap;
    for (const [k, v] of Object.entries(patch)) if (k !== 'id' && v !== undefined) m.set(k, v as never);
  }

  remove(id: string): void {
    const i = this.indexOf(id);
    if (i >= 0) this.list.delete(i, 1);
  }

  move(id: string, to: number): void {
    const i = this.indexOf(id);
    if (i < 0) return;
    this.list.move(i, Math.max(0, Math.min(to, this.list.length - 1)));
  }
}

export function readBible(doc: LoroDoc): Bible {
  const b = Object.fromEntries(BIBLE_KINDS.map((k) => [k, new Collection(doc, k).all()])) as unknown as Bible;
  // A relation whose character was removed (e.g. its AI turn was undone) is hidden, not shown dangling.
  const ids = new Set(b.characters.map((c) => c.id));
  b.relations = b.relations.filter((r) => ids.has(r.a) && ids.has(r.b));
  // Same for shots whose scene heading no longer exists.
  const nodes = doc.getMovableList('nodes');
  const heads = new Set<string>();
  for (let i = 0; i < nodes.length; i++) { const m = nodes.get(i) as LoroMap; if (m.get('type') === 'heading') heads.add(m.get('id') as string); }
  b.shots = b.shots.filter((s) => heads.has(s.sceneId));
  return b;
}

