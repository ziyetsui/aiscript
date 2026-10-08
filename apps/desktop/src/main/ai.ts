// AI writes into the script: Ancher returns <ops>, we validate and apply them as one undoable turn (spec 0002 §5.4).
import { app, type WebContents } from 'electron';
import { applyOps, bibleBrief, parseReply } from '@scripter/core';
import { buildMessage, checkAncherKey, createAncher, describeError, runChat } from '@scripter/agent';
import type { AiWriteRequest, AiWriteResult } from '../shared/ipc.ts';
import { get, saveNow } from './projects.ts';
import { getSecret } from './secrets.ts';

const running = new Map<string, AbortController>();

// Dev/test only: point the SDK at a local fake Ancher for E2E runs.
export const ancher = (key: string) => createAncher(key, { baseUrl: !app.isPackaged ? process.env.SCRIPTER_ANCHER_BASE_URL : undefined });

export async function write(req: AiWriteRequest, sender: WebContents): Promise<AiWriteResult> {
  const key = getSecret('ancher');
  if (!key) return { ok: false, narration: '', applied: 0, errors: [], citations: [], message: '还没有填写 Ancher API key，请到设置里填写' };
  const p = get(req.projectId);
  const ac = new AbortController();
  running.set(req.reqId, ac);
  try {
    const sdk = ancher(key);
    const content = buildMessage(req.instruction, p.meta.title, p.doc.nodes(), req.focusId, bibleBrief(p.doc.readBible()));
    const r = await runChat(sdk, { conversationId: p.meta.conversationId, content, webSearch: req.webSearch, signal: ac.signal }, {
      onText: (text) => { if (!sender.isDestroyed()) sender.send('ai:delta', { reqId: req.reqId, text }); },
    });
    p.meta.conversationId = r.conversationId;
    const citations = r.citations.map(({ url, title }) => ({ url, title }));
    if (r.finish === 'cancelled') { saveNow(p); return { ok: false, cancelled: true, narration: '', applied: 0, errors: [], citations, message: '已取消，剧本没有改动' }; }
    const parsed = parseReply(r.text);
    if (!parsed.ops.length) { saveNow(p); return { ok: true, narration: parsed.narration, applied: 0, errors: parsed.errors, citations }; }
    let turn;
    try {
      turn = applyOps(p.doc, parsed.ops, req.instruction.slice(0, 24));
    } catch (e) {
      saveNow(p);
      return { ok: false, narration: parsed.narration, applied: 0, errors: [...parsed.errors, String((e as Error).message)], citations, message: 'AI 给出的修改无法执行，剧本没有改动' };
    }
    saveNow(p);
    return { ok: true, narration: parsed.narration, applied: parsed.ops.length, errors: parsed.errors, citations, turn: { id: turn.id, label: turn.label, undone: false } };
  } catch (e) {
    return { ok: false, narration: '', applied: 0, errors: [], citations: [], message: describeError(e) };
  } finally {
    running.delete(req.reqId);
  }
}

export function cancel(reqId: string): void {
  running.get(reqId)?.abort();
}

export { checkAncherKey, createAncher };
