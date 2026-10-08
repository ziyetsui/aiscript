// AI writes into the script: Ancher returns <ops>, we validate them, then either apply them as one undoable turn
// (new content) or hold them as a modification preview until the writer accepts (rewrites / deletions).
// Spec 0002 §0 "AI 改稿", §5.4, D9, §12.4.
import { app, type WebContents } from 'electron';
import { randomUUID } from 'node:crypto';
import { applyOps, bibleBrief, needsReview, parseReply, previewOps, type Op } from '@scripter/core';
import { buildMessage, checkAncherKey, createAncher, describeError, runChat } from '@scripter/agent';
import type { AiWriteRequest, AiWriteResult, ChatMsg, TurnInfo } from '../shared/ipc.ts';
import { get, pushChat, saveNow, state } from './projects.ts';
import { getSecret } from './secrets.ts';
import { log } from './archive.ts';

const running = new Map<string, AbortController>();

// Dev/test only: point the SDK at a local fake Ancher for E2E runs.
export const ancher = (key: string) => createAncher(key, { baseUrl: !app.isPackaged ? process.env.SCRIPTER_ANCHER_BASE_URL : undefined });

const msg = (m: Omit<ChatMsg, 'id' | 'at'>): ChatMsg => ({ id: randomUUID(), at: Date.now(), ...m });

export async function write(req: AiWriteRequest, sender: WebContents): Promise<AiWriteResult> {
  const p = get(req.projectId);
  const key = getSecret('ancher');
  if (!key) return { ok: false, narration: '', applied: 0, errors: [], citations: [], message: '还没有填写 Ancher API key，请到设置里填写' };
  pushChat(p, msg({ role: 'user', text: req.instruction }));
  const reply = (m: Omit<ChatMsg, 'id' | 'at' | 'role'>) => { const r = pushChat(p, msg({ role: 'ai', ...m })); saveNow(p); return r; };
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
    if (r.finish === 'cancelled') {
      reply({ text: '', error: '已取消，剧本没有改动' });
      return { ok: false, cancelled: true, narration: '', applied: 0, errors: [], citations, message: '已取消，剧本没有改动' };
    }
    const parsed = parseReply(r.text);
    const skipped = parsed.errors.length ? `有 ${parsed.errors.length} 处修改格式不对，已跳过` : undefined;
    if (!parsed.ops.length) {
      reply({ text: parsed.narration || '好的。', citations, error: skipped });
      return { ok: true, narration: parsed.narration, applied: 0, errors: parsed.errors, citations };
    }
    if (needsReview(parsed.ops)) {
      const pv = previewOps(p.doc, parsed.ops);
      if (pv.missing.length) {
        reply({ text: parsed.narration, citations, error: 'AI 要改的段落找不到了，剧本没有改动。请再说一次' });
        return { ok: false, narration: parsed.narration, applied: 0, errors: parsed.errors, citations, message: 'AI 要改的段落找不到了' };
      }
      const m = propose(p, parsed.ops, parsed.narration || '我想这样改，确认后再写入：', req.instruction.slice(0, 24), { citations, error: skipped });
      return { ok: true, narration: parsed.narration, applied: 0, errors: parsed.errors, citations, previewId: m.id };
    }
    let turn;
    try {
      turn = applyOps(p.doc, parsed.ops, req.instruction.slice(0, 24));
    } catch (e) {
      reply({ text: parsed.narration, citations, error: 'AI 给出的修改无法执行，剧本没有改动' });
      return { ok: false, narration: parsed.narration, applied: 0, errors: [...parsed.errors, String((e as Error).message)], citations, message: 'AI 给出的修改无法执行，剧本没有改动' };
    }
    reply({ text: parsed.narration || '好的。', citations, error: skipped, turnId: turn.id, applied: parsed.ops.length });
    return { ok: true, narration: parsed.narration, applied: parsed.ops.length, errors: parsed.errors, citations, turn: { id: turn.id, label: turn.label, undone: false } };
  } catch (e) {
    const message = describeError(e);
    log('warn', `ai.write failed: ${message}`);
    reply({ text: '', error: message });
    return { ok: false, narration: '', applied: 0, errors: [], citations: [], message };
  } finally {
    running.delete(req.reqId);
  }
}

/** Put ops behind a modification preview in the conversation (used by chat replies and workflow results). */
export function propose(p: ReturnType<typeof get>, ops: Op[], text: string, label: string, extra: Partial<ChatMsg> = {}): ChatMsg {
  const m = pushChat(p, msg({ role: 'ai', text, ...extra, preview: { items: previewOps(p.doc, ops).items, state: 'open' } }));
  (p.meta.pending ??= {})[m.id] = { ops, label };
  saveNow(p);
  return m;
}

/** Accept → apply as one undoable turn (re-checked against the current text). Reject → nothing changes. */
export function resolve(projectId: string, msgId: string, accept: boolean) {
  const p = get(projectId);
  const m = p.meta.chat?.find((x) => x.id === msgId);
  const pend = p.meta.pending?.[msgId];
  if (!m?.preview || m.preview.state !== 'open' || !pend) return { ok: false, message: '这条修改已经处理过了', state: state(p) };
  delete p.meta.pending![msgId];
  if (!accept) {
    m.preview.state = 'rejected';
    saveNow(p);
    return { ok: true, state: state(p) };
  }
  // The writer may have edited or deleted the target since the preview was made.
  const now = previewOps(p.doc, pend.ops);
  const changed = now.missing.length > 0 || now.items.some((it, i) => {
    const was = m.preview!.items[i];
    return !was || ('before' in it && 'before' in was && it.before !== was.before);
  });
  if (changed) {
    m.preview.state = 'stale';
    saveNow(p);
    return { ok: false, message: '这段剧本在预览之后被改过了，修改没有写入。请让 AI 重新生成', state: state(p) };
  }
  let turn: TurnInfo;
  try {
    const t = applyOps(p.doc, pend.ops, pend.label);
    turn = { id: t.id, label: t.label, undone: false };
  } catch {
    m.preview.state = 'stale';
    saveNow(p);
    return { ok: false, message: '修改无法执行，剧本没有改动', state: state(p) };
  }
  m.preview.state = 'accepted';
  m.turnId = turn.id;
  m.applied = pend.ops.length;
  saveNow(p);
  return { ok: true, turn, state: state(p) };
}

export function cancel(reqId: string): void {
  running.get(reqId)?.abort();
}

export { checkAncherKey, createAncher };
