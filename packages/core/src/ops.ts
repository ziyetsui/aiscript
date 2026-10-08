// "Ancher outputs structured ops, the app executes them locally" (spec 0002 §5.4).
// The model wraps edits in <ops>[ … ]</ops>; we validate every op before touching the document.
import { z } from 'zod';
import { ELEMENT_TYPES } from './script.ts';
import type { ScriptDoc } from './doc.ts';

const Type = z.enum(ELEMENT_TYPES);
export const Op = z.discriminatedUnion('op', [
  z.object({ op: z.literal('insertNode'), after: z.string().nullable().default('end'), type: Type, text: z.string().max(4000) }),
  z.object({ op: z.literal('updateNode'), id: z.string(), text: z.string().max(4000) }),
  z.object({ op: z.literal('setType'), id: z.string(), type: Type }),
  z.object({ op: z.literal('deleteNode'), id: z.string() }),
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
      }
    });
  });
}
