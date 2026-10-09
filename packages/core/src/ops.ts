// "Ancher outputs structured ops, the app executes them locally" (spec 0002 §5.4).
// The model wraps edits in <ops>[ … ]</ops>; we validate every op before touching the document.
import { z } from 'zod';
import { ELEMENT_TYPES } from './script.ts';
import { findByName, SHOT_SIZES, type Shot, type ShotSize } from './bible-model.ts';
import type { ScriptDoc } from './doc.ts';

const Type = z.enum(ELEMENT_TYPES);
export const Op = z.discriminatedUnion('op', [
  // `id` lets the model name a new node so later ops can point at it.
  z.object({ op: z.literal('insertNode'), after: z.string().nullable().default('end'), type: Type, text: z.string().max(4000), id: z.string().max(40).optional() }),
  z.object({ op: z.literal('updateNode'), id: z.string(), text: z.string().max(4000) }),
  z.object({ op: z.literal('setType'), id: z.string(), type: Type }),
  z.object({ op: z.literal('deleteNode'), id: z.string() }),
  // Bible ops: the agent registers who and where as it writes (laper does the same).
  z.object({ op: z.literal('upsertCharacter'), name: z.string().min(1).max(40), role: z.string().max(80).optional(), desc: z.string().max(600).optional(), want: z.string().max(200).optional(), fear: z.string().max(200).optional() }),
  z.object({ op: z.literal('upsertLocation'), name: z.string().min(1).max(40), ie: z.enum(['内景', '外景', '内外景']).optional(), times: z.array(z.string().max(8)).max(6).optional(), desc: z.string().max(600).optional() }),
  z.object({ op: z.literal('setWorld'), title: z.string().min(1).max(40), value: z.string().max(2000) }),
  // The outline (大纲) is its own document, not notes inside the script.
  z.object({ op: z.literal('appendOutline'), text: z.string().min(1).max(20000) }),
  z.object({ op: z.literal('setOutline'), text: z.string().max(20000) }),
  // Storyboard (分镜): replaces one scene's shot list; sceneId is the scene heading's node id.
  z.object({ op: z.literal('setShots'), sceneId: z.string(), shots: z.array(z.object({ size: z.enum(SHOT_SIZES as [ShotSize, ...ShotSize[]]).default('中景'), desc: z.string().min(1).max(400), dur: z.number().min(1).max(60).default(3) })).max(40) }),
]);
export type Op = z.infer<typeof Op>;

export interface ParsedReply { narration: string; ops: Op[]; errors: string[] }

/** Split a model reply into narration and validated ops. Invalid ops are reported, never applied. */
export function parseReply(reply: string): ParsedReply {
  const errors: string[] = [];
  const ops: Op[] = [];
  const re = /<ops>([\s\S]*?)<\/ops>/g;
  for (const m of reply.matchAll(re)) {
    let raw: unknown;
    try {
      raw = JSON.parse(m[1] ?? '');
    } catch {
      errors.push('ops 不是合法 JSON');
      continue;
    }
    for (const item of Array.isArray(raw) ? raw : [raw]) {
      const r = Op.safeParse(item);
      if (r.success) ops.push(r.data);
      else errors.push(r.error.issues.map((i) => i.message).join('; '));
    }
  }
  return { narration: reply.replace(re, '').trim(), ops, errors };
}

/** Apply ops in one undoable turn. Ids the model invents for new nodes ("$1") can be referenced by later ops. */
/**
 * Models refer to nodes they just inserted in several ways: "$n" counted over inserts or over all ops, an `id`
 * they chose on the insert, or a slip. All of them resolve here; an `after` that still can't be found falls back
 * to "right after the previous insert" (or the end) instead of failing the whole turn.
 */
class Refs {
  private alias = new Map<string, string>();
  private inserts = 0;
  last: string | 'end' = 'end';
  constructor(private readonly exists: (id: string) => boolean) {}
  inserted(opIndex: number, realId: string, own?: string): void {
    this.inserts++;
    this.alias.set(`$${this.inserts}`, realId);
    if (!this.alias.has(`$op${opIndex + 1}`)) this.alias.set(`$op${opIndex + 1}`, realId);
    if (own) this.alias.set(own, realId);
    this.last = realId;
  }
  resolve(ref: string): string | null {
    const r = this.alias.get(ref) ?? this.alias.get(ref.replace(/^\$/, '$op')) ?? ref;
    return this.exists(r) ? r : null;
  }
  after(ref: string | null): string | null | 'end' {
    if (ref === null) return null;
    if (ref === 'end') return this.last;
    return this.resolve(ref) ?? this.last;
  }
}

/** Apply ops in one undoable turn. Targets of update / delete that no longer exist are skipped, not fatal. */
export function applyOps(doc: ScriptDoc, ops: readonly Op[], label: string) {
  return doc.turn(label, (d) => {
    const ids = new Set(d.nodes().map((n) => n.id));
    const refs = new Refs((id) => ids.has(id));
    ops.forEach((op, i) => {
      switch (op.op) {
        case 'insertNode': {
          const id = d.insert(refs.after(op.after), op.type, op.text);
          ids.add(id);
          refs.inserted(i, id, op.id);
          break;
        }
        case 'updateNode': { const t = refs.resolve(op.id); if (t) d.setText(t, op.text); break; }
        case 'setType': { const t = refs.resolve(op.id); if (t) d.setType(t, op.type); break; }
        case 'deleteNode': { const t = refs.resolve(op.id); if (t) { d.remove(t); ids.delete(t); } break; }
        case 'upsertCharacter': {
          const { op: _o, ...data } = op;
          const c = d.bible('characters');
          const hit = findByName(c.all(), op.name);
          if (hit) c.update(hit.id, data); else c.add(data);
          break;
        }
        case 'upsertLocation': {
          const { op: _o, ...data } = op;
          const l = d.bible('locations');
          const hit = findByName(l.all(), op.name);
          if (hit) l.update(hit.id, data); else l.add(data);
          break;
        }
        case 'setWorld': {
          const w = d.bible('world');
          const hit = w.all().find((x) => x.title === op.title);
          if (hit) w.update(hit.id, { value: op.value }); else w.add({ title: op.title, value: op.value });
          break;
        }
        case 'appendOutline': {
          const cur = d.outline.trimEnd();
          d.setOutline(cur ? `${cur}\n\n${op.text.trim()}` : op.text.trim());
          break;
        }
        case 'setOutline': d.setOutline(op.text); break;
        case 'setShots': {
          const sceneId = refs.resolve(op.sceneId);
          if (!sceneId) break;
          const col = d.bible('shots');
          for (const s of col.all().filter((x) => x.sceneId === sceneId)) col.remove(s.id);
          for (const s of op.shots) col.add({ sceneId, size: s.size, desc: s.desc, dur: s.dur });
          break;
        }
      }
    });
  });
}

// Modification preview (spec 0002 §0, D9, §5.6): new content is written straight away, but anything that
// rewrites or removes what is already on the page is shown as a diff first and applied only when accepted.
export type PreviewItem =
  | { kind: 'insert'; type: string; text: string }
  | { kind: 'update'; id: string; type: string; before: string; after: string }
  | { kind: 'retype'; id: string; text: string; from: string; to: string }
  | { kind: 'delete'; id: string; type: string; before: string }
  | { kind: 'bible'; text: string; before?: string; after?: string }
  | { kind: 'outline'; mode: 'append' | 'replace'; before: string; after: string };

/** Rewrites of existing text need review; so does replacing an outline that already has content. */
export function needsReview(ops: readonly Op[], currentOutline = '', currentShots: readonly Shot[] = []): boolean {
  return ops.some((o) => o.op === 'updateNode' || o.op === 'deleteNode' || o.op === 'setType' || (o.op === 'setShots' && currentShots.some((s) => s.sceneId === o.sceneId)) || (o.op === 'setOutline' && currentOutline.trim() !== '' && o.text.trim() !== currentOutline.trim()));
}

/** Describe what the ops would change, against the current document. Missing targets are reported, not guessed. */
export function previewOps(doc: ScriptDoc, ops: readonly Op[]): { items: PreviewItem[]; missing: string[] } {
  const byId = new Map(doc.nodes().map((n) => [n.id, n]));
  const items: PreviewItem[] = [];
  const missing: string[] = [];
  const own = new Set(ops.flatMap((o) => (o.op === 'insertNode' && o.id ? [o.id] : [])));
  for (const o of ops) {
    if (o.op === 'insertNode') items.push({ kind: 'insert', type: o.type, text: o.text });
    else if (o.op === 'upsertCharacter') items.push({ kind: 'bible', text: `登记角色：${o.name}` });
    else if (o.op === 'upsertLocation') items.push({ kind: 'bible', text: `登记地点：${o.name}` });
    else if (o.op === 'setWorld') items.push({ kind: 'bible', text: `世界观「${o.title}」` });
    else if (o.op === 'appendOutline') items.push({ kind: 'outline', mode: 'append', before: '', after: o.text });
    else if (o.op === 'setOutline') items.push({ kind: 'outline', mode: 'replace', before: doc.outline, after: o.text });
    else if (o.op === 'setShots') {
      if (byId.get(o.sceneId)?.type !== 'heading') missing.push(o.sceneId);
      items.push({ kind: 'bible', text: `分镜：${byId.get(o.sceneId)?.text ?? '一场'} · ${o.shots.length} 个镜头`, before: JSON.stringify(doc.readBible().shots.filter((s) => s.sceneId === o.sceneId)), after: o.shots.map((s, i) => `${i + 1}. ${s.size} · ${s.dur}秒 · ${s.desc}`).join('\n') });
    }
    else {
      const n = byId.get(o.id);
      if (!n) { if (!/^\$\d+$/.test(o.id) && !own.has(o.id)) missing.push(o.id); continue; }
      if (o.op === 'updateNode') items.push({ kind: 'update', id: n.id, type: n.type, before: n.text, after: o.text });
      else if (o.op === 'deleteNode') items.push({ kind: 'delete', id: n.id, type: n.type, before: n.text });
      else items.push({ kind: 'retype', id: n.id, text: n.text, from: n.type, to: o.type });
    }
  }
  return { items, missing };
}
