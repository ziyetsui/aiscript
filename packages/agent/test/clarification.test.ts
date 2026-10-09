import { expect, it, vi } from 'vitest';
import { runChat } from '../src/ancher.ts';
import { runWritingWorkflow } from '../src/writing-workflow.ts';
const question = { kind: 'clarification_requested', request_id: 'r1', conversation_id: 'c1', message_id: 'm1', reason: '确认文档', questions: [{ id: 'q1', prompt: '写入哪个文档？', header: null, reason: null, options: [], free_text: { label: '其他', placeholder: null } }], remaining_question_budget: 1 };
const stream = async function* () { yield { type: 'clarification-requested', clarification: question }; yield { type: 'done', finishReason: 'clarification_requested' }; };
it('preserves clarification events and shows a question even without assistant text', async () => {
  const change = vi.fn();
  const sdk = { Conversation: { start: async () => ({ conversation_id: 'c1' }), stream } };
  const r = await runChat(sdk as never, { content: '写入剧本' }, { onClarificationChange: change });
  expect(change).toHaveBeenCalledWith(question);
  expect(r.text).toContain('写入哪个文档？');
  expect(r.text).toContain('回复');
  expect(r.finish).toBe('clarification_requested');
});
it('submits a reply with request and question ids without mutually exclusive content or attachments', async () => {
  const send = vi.fn(async () => ({ conversation_id: 'c1' }));
  const change = vi.fn();
  await runChat({ Conversation: { send, stream: async function* () {} } } as never, { conversationId: 'c1', content: '完整上下文', answerText: '写入本集剧本', clarification: question, attachments: [{ type: 'note', id: 'n1' }] }, { onClarificationChange: change });
  expect(send.mock.calls[0]).toEqual(['c1', { clarification: { action: 'answer', request_id: 'r1', answers: [{ question_id: 'q1', value: '写入本集剧本' }], note: '写入本集剧本' } }]);
  expect(change).toHaveBeenCalledWith(null);
});
it('recovers a clarification ignored by an older client from remote message history', async () => {
  const send = vi.fn().mockRejectedValueOnce(new Error('Answer, skip, or cancel the pending clarification before continuing this conversation')).mockResolvedValue({ conversation_id: 'c1' });
  const list = vi.fn(async () => ({ items: [{ clarification: question }], has_more: false }));
  await runChat({ Conversation: { send, stream: async function* () {} }, Message: { list } } as never, { conversationId: 'c1', content: '上下文', answerText: '就是添加的这份笔记，写入本集剧本' });
  expect(list).toHaveBeenCalledWith('c1', expect.objectContaining({ orderBy: '-created_at' }));
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[1]![1].clarification.request_id).toBe('r1');
});
it('does not retry unrelated errors or revive a resolved clarification', async () => {
  const send = vi.fn().mockRejectedValue(new Error('network failure'));
  const list = vi.fn();
  await expect(runChat({ Conversation: { send }, Message: { list } } as never, { conversationId: 'c1', content: '回复' })).rejects.toThrow('network');
  expect(list).not.toHaveBeenCalled();
  send.mockRejectedValue(new Error('pending clarification'));
  list.mockResolvedValue({ items: [{ clarification: { request_id: 'r1', status: 'answered' } }, { clarification: question }], has_more: false });
  await expect(runChat({ Conversation: { send }, Message: { list } } as never, { conversationId: 'c1', content: '回复' })).rejects.toThrow('pending clarification');
  expect(send).toHaveBeenCalledTimes(2);
});
it('holds a document-writing turn for clarification without a repair or any document operations', async () => {
  const generate = vi.fn(async () => ({ conversationId: 'c1', text: '请确认写入哪份剧本', citations: [], finish: 'clarification_requested' }));
  const validate = vi.fn(); const commit = vi.fn(async (parsed) => parsed);
  const result = await runWritingWorkflow({ instruction: '写入剧本', targets: ['script'] }, { signal: new AbortController().signal, generate, validate, commit });
  expect(generate).toHaveBeenCalledTimes(1); expect(validate).not.toHaveBeenCalled();
  expect(result.ops).toEqual([]); expect(result.narration).toContain('确认');
});
