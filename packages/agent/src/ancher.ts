// Ancher access from the Electron main process only; the key comes from the OS keychain (spec 0002 §4.1, §5.5).
import type { ToolEvent } from './activity.ts';
import { createAncherSdk, isAncherApiError, isActivationRequiredError, isInsufficientCreditsError, type AncherSdk, type ChatCitation, type ChatEvent, type Schemas } from '@ancher-ai/sdk';

export type KeyCheck = { ok: true; name: string; email: string } | { ok: false; reason: 'invalid' | 'activation' | 'network'; message: string };

export function createAncher(apiKey: string, opts: { fetch?: typeof fetch; baseUrl?: string } = {}): AncherSdk {
  return createAncherSdk({ apiKey, credentials: 'omit', timeoutMs: 120_000, ...(opts.fetch ? { fetch: opts.fetch } : {}), ...(opts.baseUrl ? { baseUrl: opts.baseUrl } : {}) });
}

export async function checkAncherKey(sdk: Pick<AncherSdk, 'User'>): Promise<KeyCheck> {
  try {
    const me = await sdk.User.me();
    return { ok: true, name: me.full_name ?? me.email, email: me.email };
  } catch (e) {
    if (isActivationRequiredError(e)) return { ok: false, reason: 'activation', message: '这个 Ancher 账号还没完成激活，请先在 ancher.ai 完成' };
    if (isAncherApiError(e) && (e.status === 401 || e.status === 403)) return { ok: false, reason: 'invalid', message: 'Ancher key 无效，请重新填写' };
    return { ok: false, reason: 'network', message: '连不上 Ancher，请检查网络后重试' };
  }
}

export interface RunHandlers {
  onClarificationChange?: (request: PendingClarification | null) => void;
  onText?: (delta: string) => void;
  /** Tool calls and returns from any run (main agent or its sub-agents), for the activity rows. */
  onTool?: (e: ToolEvent) => void;
  onCitations?: (c: ChatCitation[]) => void;
}
export interface RunResult { conversationId: string; text: string; citations: ChatCitation[]; finish: string }
export interface PendingClarification { request_id: string; conversation_id: string; questions: { id: string; prompt: string; options: { label: string }[] }[] }

function clarificationAnswer(request: PendingClarification, text: string): Schemas.ClarificationSubmitPayload {
  return { action: 'answer', request_id: request.request_id, answers: request.questions.map((q) => ({ question_id: q.id, value: text })), note: text };
}

/** Recover a question missed by older clients; terminal responses prevent resurrecting old requests. */
async function recoverClarification(sdk: Partial<Pick<AncherSdk, 'Message'>>, id: string): Promise<PendingClarification | undefined> {
  if (!sdk.Message) return;
  const resolved = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < 5; page++) {
    const history = await sdk.Message.list(id, cursor ? { cursor } : { limit: 50, orderBy: '-created_at' });
    for (const m of history.items) {
      const c = m.clarification;
      if (!c) continue;
      if ('status' in c) resolved.add(c.request_id);
      else if (!resolved.has(c.request_id) && c.conversation_id === id && c.questions.length) return c;
    }
    if (!history.has_more || !history.next_cursor) break;
    cursor = history.next_cursor;
  }
}

/** One agent run. Starts a conversation or continues one; streams main-agent text; cancellable with `signal`. */
export async function runChat(
  sdk: Pick<AncherSdk, 'Conversation'> & Partial<Pick<AncherSdk, 'Message'>>,
  opts: { conversationId?: string | null; content: string; answerText?: string; clarification?: PendingClarification | null; attachments?: Schemas.ResourceAttachment[]; webSearch?: boolean; signal?: AbortSignal },
  h: RunHandlers = {},
): Promise<RunResult> {
  const body = { content: opts.content, enable_web_search: !!opts.webSearch, enable_kb_search: false, ...(opts.attachments?.length ? { attachments: opts.attachments } : {}) };
  opts.signal?.throwIfAborted();
  let request = opts.clarification?.conversation_id === opts.conversationId ? opts.clarification : undefined;
  const answerText = opts.answerText ?? opts.content;
  // The server accepts clarification answers exclusively: content/attachments would invalidate the request.
  const submit = () => opts.conversationId ? sdk.Conversation.send(opts.conversationId, request ? { clarification: clarificationAnswer(request, answerText) } : body) : sdk.Conversation.start(body);
  let receipt;
  try { receipt = await submit(); }
  catch (e) {
    if (!opts.conversationId || request || !/pending clarification/i.test(e instanceof Error ? e.message : String(e))) throw e;
    request = await recoverClarification(sdk, opts.conversationId);
    opts.signal?.throwIfAborted();
    if (!request) throw e;
    receipt = await submit();
  }
  if (request) h.onClarificationChange?.(null);
  const id = receipt.conversation_id;
  const onAbort = () => { void sdk.Conversation.interrupt(id).catch(() => {}); };
  opts.signal?.addEventListener('abort', onAbort, { once: true });
  let text = '';
  const citations: ChatCitation[] = [];
  let finish = 'stop';
  let clarification: PendingClarification | undefined;
  try {
    for await (const ev of sdk.Conversation.stream(id, { signal: opts.signal }) as AsyncIterable<ChatEvent>) {
      if (ev.type === 'text' && (!ev.run || ev.run.isMain)) { text += ev.text; h.onText?.(ev.text); }
      else if (ev.type === 'tool-call') h.onTool?.({ phase: 'call', id: ev.toolCallId, name: ev.toolName, args: ev.args });
      else if (ev.type === 'tool-return') h.onTool?.({ phase: 'return', id: ev.toolCallId, name: ev.toolName });
      else if (ev.type === 'citations') { citations.push(...ev.citations); h.onCitations?.(ev.citations); }
      else if (ev.type === 'clarification-requested') { clarification = ev.clarification; h.onClarificationChange?.(clarification); }
      else if (ev.type === 'clarification-resolved') { clarification = undefined; h.onClarificationChange?.(null); }
      else if (ev.type === 'done') { finish = ev.finishReason; break; }
      else if (ev.type === 'error') throw new Error(ev.message);
    }
  } finally {
    opts.signal?.removeEventListener('abort', onAbort);
  }
  if (opts.signal?.aborted) finish = 'cancelled';
  if (clarification && finish !== 'cancelled') {
    finish = 'clarification_requested';
    const questions = clarification.questions.map((q, i) => `${i + 1}. ${q.prompt}${q.options.length ? '\n' + q.options.map((o) => `   - ${o.label}`).join('\n') : ''}`).join('\n\n');
    text += `\n\n等待你确认：\n${questions}\n\n请直接回复你的选择或说明，我会将回复作为确认答案继续处理。`;
  }
  return { conversationId: id, text, citations, finish };
}

export function describeError(e: unknown): string {
  if (isInsufficientCreditsError(e)) return 'Ancher 积分不足，请到 ancher.ai 充值';
  if (isAncherApiError(e)) return e.status === 401 ? 'Ancher key 无效，请重新填写' : `Ancher 返回错误：${e.message}`;
  if (e instanceof Error && e.name === 'AbortError') return '已取消';
  return e instanceof Error ? e.message : String(e);
}

/** Ancher's parser (notes): URL or uploaded file → text. Polls until the note is ready. [待实测] with a real key. */
export async function parseWithAncher(sdk: Pick<AncherSdk, 'Note' | 'File'>, src: { url?: string; file?: Blob }, signal: AbortSignal, pollMs = 2000): Promise<string> {
  let note = src.url
    ? await sdk.Note.createFromUrl({ text: src.url })
    : await sdk.Note.createFromFile({ file_id: (await sdk.File.upload(src.file!)).id });
  for (let i = 0; (note.status === 'queued' || note.status === 'processing') && i < 300; i++) {
    if (signal.aborted) throw Object.assign(new Error('已取消'), { name: 'AbortError' });
    await new Promise((r) => setTimeout(r, pollMs));
    note = await sdk.Note.get(note.id);
  }
  if (note.status !== 'ready') throw new Error(note.error_message || 'Ancher 没能解析这个内容');
  const res = await sdk.Note.getContent(note.id);
  const text = (await res.text()).trim();
  if (!text) throw new Error('Ancher 解析结果为空');
  return text;
}

/** 逆向提示词 (spec §5.2): reference image → visual prompt, in English and the local language. */
export async function reversePrompt(sdk: Pick<AncherSdk, 'ImagePrompt'>, image: Blob): Promise<{ en: string; local: string }> {
  const r = await sdk.ImagePrompt.generate(image);
  return { en: r.prompt_en, local: r.prompt_local ?? '' };
}

/** Selection toolbar: explain / summarise / translate the selected script text. */
export async function selectionAction(sdk: Pick<AncherSdk, 'TextSelection'>, kind: 'explain' | 'summarize' | 'translate', text: string, lang = 'English'): Promise<string> {
  const r = kind === 'translate' ? await sdk.TextSelection.translate(text, lang) : await sdk.TextSelection[kind](text);
  return r.content;
}
