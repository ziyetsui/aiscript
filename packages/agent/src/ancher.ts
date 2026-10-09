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
  onText?: (delta: string) => void;
  /** Tool calls and returns from any run (main agent or its sub-agents), for the activity rows. */
  onTool?: (e: ToolEvent) => void;
  onCitations?: (c: ChatCitation[]) => void;
}
export interface RunResult { conversationId: string; text: string; citations: ChatCitation[]; finish: string }

/** One agent run. Starts a conversation or continues one; streams main-agent text; cancellable with `signal`. */
export async function runChat(
  sdk: Pick<AncherSdk, 'Conversation'>,
  opts: { conversationId?: string | null; content: string; attachments?: Schemas.ResourceAttachment[]; webSearch?: boolean; signal?: AbortSignal },
  h: RunHandlers = {},
): Promise<RunResult> {
  const body = { content: opts.content, enable_web_search: !!opts.webSearch, enable_kb_search: false, ...(opts.attachments?.length ? { attachments: opts.attachments } : {}) };
  opts.signal?.throwIfAborted();
  const receipt = opts.conversationId ? await sdk.Conversation.send(opts.conversationId, body) : await sdk.Conversation.start(body);
  const id = receipt.conversation_id;
  const onAbort = () => { void sdk.Conversation.interrupt(id).catch(() => {}); };
  opts.signal?.addEventListener('abort', onAbort, { once: true });
  let text = '';
  const citations: ChatCitation[] = [];
  let finish = 'stop';
  try {
    for await (const ev of sdk.Conversation.stream(id, { signal: opts.signal }) as AsyncIterable<ChatEvent>) {
      if (ev.type === 'text' && (!ev.run || ev.run.isMain)) { text += ev.text; h.onText?.(ev.text); }
      else if (ev.type === 'tool-call') h.onTool?.({ phase: 'call', id: ev.toolCallId, name: ev.toolName, args: ev.args });
      else if (ev.type === 'tool-return') h.onTool?.({ phase: 'return', id: ev.toolCallId, name: ev.toolName });
      else if (ev.type === 'citations') { citations.push(...ev.citations); h.onCitations?.(ev.citations); }
      else if (ev.type === 'done') { finish = ev.finishReason; break; }
      else if (ev.type === 'error') throw new Error(ev.message);
    }
  } finally {
    opts.signal?.removeEventListener('abort', onAbort);
  }
  if (opts.signal?.aborted) finish = 'cancelled';
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
