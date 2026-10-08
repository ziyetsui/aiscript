import { AncherApiError } from '@ancher-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import { buildMessage, checkAncherKey, packScript, runChat } from '../src/index.ts';

const nodes = Array.from({ length: 400 }, (_, i) => ({ id: `n${i}`, type: 'action' as const, text: `第 ${i} 行动作，写得稍微长一点让它超出预算。` }));

describe('context packing', () => {
  it('keeps ids and stays within budget around the focus', () => {
    const p = packScript('门墩儿', nodes, 'n200', 2000);
    expect(p.truncated).toBe(true);
    expect(p.text).toContain('[n200]');
    expect(p.text.length).toBeLessThan(2400);
    expect(p.text).toMatch(/前面省略 \d+ 个节点/);
  });
  it('embeds the ops contract and the user instruction', () => {
    const m = buildMessage('写第一场', '门墩儿', []);
    expect(m).toContain('<ops>');
    expect(m).toContain('用户：写第一场');
    expect(m).toContain('（空）');
    expect(m).not.toContain('项目设定：');
    expect(buildMessage('x', 't', [], undefined, '角色：\n- 豆豆')).toContain('项目设定：\n角色：\n- 豆豆');
  });
});

async function* events(list: any[]) { for (const e of list) yield e; }

describe('runChat', () => {
  it('streams main-agent text only and collects citations', async () => {
    const sdk = { Conversation: {
      start: vi.fn(async () => ({ conversation_id: 'c1' })), send: vi.fn(), interrupt: vi.fn(async () => {}),
      stream: vi.fn(() => events([
        { type: 'text', text: '好的', run: null },
        { type: 'text', text: '（子 agent）', run: { isMain: false } },
        { type: 'citations', citations: [{ url: 'https://example.com', title: 't', snippet: '', siteName: '' }], searchQueries: [] },
        { type: 'text', text: '。<ops>[]</ops>', run: { isMain: true } },
        { type: 'done', finishReason: 'stop' },
      ])),
    } } as any;
    const seen: string[] = [];
    const r = await runChat(sdk, { content: 'hi', webSearch: true }, { onText: (t) => seen.push(t) });
    expect(r).toMatchObject({ conversationId: 'c1', text: '好的。<ops>[]</ops>', finish: 'stop' });
    expect(r.citations).toHaveLength(1);
    expect(sdk.Conversation.start).toHaveBeenCalledWith({ content: 'hi', enable_web_search: true, enable_kb_search: false });
  });

  it('continues an existing conversation and interrupts on abort', async () => {
    const ac = new AbortController();
    const sdk = { Conversation: {
      start: vi.fn(), send: vi.fn(async () => ({ conversation_id: 'c9' })), interrupt: vi.fn(async () => {}),
      stream: vi.fn(async function* () { yield { type: 'text', text: 'a', run: null }; ac.abort(); yield { type: 'done', finishReason: 'cancelled' }; }),
    } } as any;
    const r = await runChat(sdk, { conversationId: 'c9', content: 'x', signal: ac.signal });
    expect(sdk.Conversation.send).toHaveBeenCalled();
    expect(sdk.Conversation.interrupt).toHaveBeenCalledWith('c9');
    expect(r.finish).toBe('cancelled');
  });
});

describe('checkAncherKey', () => {
  it('maps 401 to invalid and network errors to network', async () => {
    expect(await checkAncherKey({ User: { me: async () => ({ full_name: '林', email: 'l@x' }) } } as any)).toEqual({ ok: true, name: '林', email: 'l@x' });
    const unauthorized = new AncherApiError({ message: 'no', status: 401 });
    expect(await checkAncherKey({ User: { me: async () => { throw unauthorized; } } } as any)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(await checkAncherKey({ User: { me: async () => { throw new TypeError('fetch failed'); } } } as any)).toMatchObject({ ok: false, reason: 'network' });
  });
});
