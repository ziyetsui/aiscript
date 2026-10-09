import { expect, it } from 'vitest';
import { createAncher, runChat } from '../src/ancher.ts';

it('sends uploaded image resource ids on both new and existing conversations', async () => {
  const bodies: unknown[] = [];
  const sdk = createAncher('test-key', { fetch: (async (_url, init) => {
    if (init?.method === 'POST') {
      bodies.push(JSON.parse(String(init.body)));
      return Response.json({ conversation_id: 'c1', stream_url: '/api/v1/conversations/c1/stream' });
    }
    return new Response('', { headers: { 'content-type': 'text/event-stream' } });
  }) as typeof fetch });
  const opts = { content: '描述图片', attachments: [{ type: 'file' as const, id: 'uploaded-image-1' }] };
  await runChat(sdk, opts);
  await runChat(sdk, { ...opts, conversationId: 'c1' });
  expect(bodies).toEqual([
    { content: '描述图片', attachments: [{ type: 'file', id: 'uploaded-image-1' }], enable_web_search: false, enable_kb_search: false },
    { content: '描述图片', attachments: [{ type: 'file', id: 'uploaded-image-1' }], enable_web_search: false, enable_kb_search: false },
  ]);
});

import { decodeChatImages, uploadChatImages, MAX_CHAT_IMAGE_BYTES } from '../src/chat-images.ts';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
const image = { name: '截图.png', dataUrl: `data:image/png;base64,${png.toString('base64')}` };
it('validates image bytes and rejects invalid or oversized attachments', () => {
  expect(decodeChatImages([image])[0]!.bytes).toEqual(png);
  expect(() => decodeChatImages(Array(6).fill(image))).toThrow('最多');
  expect(() => decodeChatImages([{ ...image, dataUrl: 'data:image/png;base64,aGVsbG8=' }])).toThrow('不一致');
  expect(() => decodeChatImages([{ ...image, dataUrl: image.dataUrl.replace('image/png','text/html') }])).toThrow('支持');
  expect(() => decodeChatImages([{ ...image, dataUrl: `data:image/png;base64,${Buffer.alloc(MAX_CHAT_IMAGE_BYTES+1).toString('base64')}` }])).toThrow('20MB');
});
it('uploads original bytes as multipart and uses the returned resource id', async () => {
  const sdk = createAncher('test-key', { fetch: (async (_url, init) => {
    const body = init!.body as FormData;
    const file = body.get('file') as File;
    expect(file.name).toBe('截图.png'); expect(file.type).toBe('image/png');
    expect(Buffer.from(await file.arrayBuffer())).toEqual(png);
    return Response.json({ id: 'original-image' });
  }) as typeof fetch });
  expect(await uploadChatImages(sdk, decodeChatImages([image]), new AbortController().signal)).toEqual([{ type:'file',id:'original-image' }]);
});
it('does not start a conversation after cancellation', async () => {
  let called = false;
  const sdk = createAncher('test-key', { fetch: (async () => { called = true; return Response.json({}); }) as typeof fetch });
  const controller = new AbortController(); controller.abort();
  await expect(runChat(sdk, { content:'图片',signal:controller.signal })).rejects.toThrow();
  expect(called).toBe(false);
});
