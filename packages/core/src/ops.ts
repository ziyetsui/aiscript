// "Ancher outputs structured ops, the app executes them locally" (spec 0002 §5.4).
// The model wraps edits in <ops>[ … ]</ops>; we validate every op before touching the document.
import { z } from 'zod';
import { ELEMENT_TYPES } from './script.ts';
import { findByName } from './bible.ts';
import type { ScriptDoc } from './doc.ts';

const Type = z.enum(ELEMENT_TYPES);
export const Op = z.discriminatedUnion('op', [
  z.object({ op: z.literal('insertNode'), after: z.string().nullable().default('end'), type: Type, text: z.string().max(4000) }),
  z.object({ op: z.literal('updateNode'), id: z.string(), text: z.string().max(4000) }),
  z.object({ op: z.literal('setType'), id: z.string(), type: Type }),
  z.object({ op: z.literal('deleteNode'), id: z.string() }),
  // Bible ops: the agent registers who and where as it writes (laper does the same).
  z.object({ op: z.literal('upsertCharacter'), name: z.string().min(1).max(40), role: z.string().max(80).optional(), desc: z.string().max(600).optional(), want: z.string().max(200).optional(), fear: z.string().max(200).optional() }),
  z.object({ op: z.literal('upsertLocation'), name: z.string().min(1).max(40), ie: z.enum(['内景', '外景', '内外景']).optional(), times: z.array(z.string().max(8)).max(6).optional(), desc: z.string().max(600).optional() }),
  z.object({ op: z.literal('setWorld'), title: z.string().min(1).max(40), value: z.string().max(2000) }),
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
export function applyOps(doc: ScriptDoc, ops: readonly Op[], label: string) {
  const alias = new Map<string, string>();
  const resolve = (id: string) => alias.get(id) ?? id;
  let last: string | 'end' = 'end';
  return doc.turn(label, (d) => {
    ops.forEach((op, i) => {
      switch (op.op) {
        case 'insertNode': {
          const after = op.after === null ? null : op.after === 'end' ? last : resolve(op.after);
          const id = d.insert(after, op.type, op.text);
          alias.set(`$${i + 1}`, id);
          last = id;
          break;
        }
        case 'updateNode': d.setText(resolve(op.id), op.text); break;
        case 'setType': d.setType(resolve(op.id), op.type); break;
        case 'deleteNode': d.remove(resolve(op.id)); break;
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
      }
    });
  });
}
