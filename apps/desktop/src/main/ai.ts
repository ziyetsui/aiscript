// AI writes into the script: Ancher returns <ops>, we validate them, then either apply them as one undoable turn
// (new content) or hold them as a modification preview until the writer accepts (rewrites / deletions).
// Spec 0002 §0 "AI 改稿", §5.4, D9, §12.4.
import { app, type WebContents } from 'electron';
import { randomUUID } from 'node:crypto';
import { applyOps, bibleBrief, needsReview, parseReply, previewOps, referenceBrief, type Op } from '@scripter/core';
import { buildMessage, checkAncherKey, createAncher, describeError, reversePrompt, runChat, selectionAction } from '@scripter/agent';
import type { AiWriteRequest, AiWriteResult, ChatMsg, TurnInfo } from '../shared/ipc.ts';
import { filePath, get, pushChat, saveNow, state } from './projects.ts';
import { openAsBlob } from 'node:fs';
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
    const bible = p.doc.readBible();
    const content = buildMessage(req.instruction, p.meta.title, p.doc.nodes(), req.focusId, bibleBrief(bible), referenceBrief(bible));
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
  } catch (e) {
    log('error', `accept preview failed: ${(e as Error).message}`);
    m.preview.state = 'failed';
    saveNow(p);
    return { ok: false, message: '写入失败，剧本没有改动。已记录到诊断日志，请让 AI 重新生成', state: state(p) };
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

const needKey = () => {
  const k = getSecret('ancher');
  if (!k) throw new Error('需要先在设置里填写 Ancher key');
  return k;
};

/** 逆向提示词: a character portrait or location reference → visual prompt saved on the item. */
export async function reverse(projectId: string, kind: 'characters' | 'locations', itemId: string) {
  const p = get(projectId);
  const item = kind === 'characters' ? p.doc.bible('characters').get(itemId) : p.doc.bible('locations').get(itemId);
  const file = item && ('portrait' in item ? item.portrait : item.image);
  if (!item || !file) throw new Error('先上传一张参考图');
  try {
    const r = await reversePrompt(ancher(needKey()), await openAsBlob(filePath(projectId, file)));
    const text = r.local ? `${r.local}\n${r.en}` : r.en;
    if (kind === 'characters') p.doc.bible('characters').update(itemId, { look: text });
    else p.doc.bible('locations').update(itemId, { visual: text });
    p.doc.commit('reverse prompt');
    saveNow(p);
    return { prompt: text, state: state(p) };
  } catch (e) {
    log('warn', `reverse prompt failed: ${describeError(e)}`);
    throw new Error(describeError(e));
  }
}

export async function selection(kind: 'explain' | 'summarize' | 'translate', text: string): Promise<string> {
  try {
    return await selectionAction(ancher(needKey()), kind, text.slice(0, 4000));
  } catch (e) {
    throw new Error(describeError(e));
  }
}
