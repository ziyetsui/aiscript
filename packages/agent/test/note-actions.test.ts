import { expect, it } from 'vitest';
import { createAncher, mutateAncherNotes } from '../src/index.ts';

it('adds each selected note to each collection without replacing existing members, deduplicates ids and reports partial failures', async () => {
  const calls: string[] = [];
  const sdk = createAncher('test', { baseUrl: 'https://api.example.com', fetch: (async (input, init) => {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    calls.push(`${init?.method} ${new URL(String(input)).pathname} ${body.note_id}`);
    if (body.note_id === 'bad') return new Response('failed', { status: 403 });
    return Response.json({ id: 'collection' });
  }) as typeof fetch });
  const result = await mutateAncherNotes(sdk, { action: 'collect', ids: ['good', 'good', 'bad'], collectionIds: ['c1', 'c2', 'c1'] });
  expect(result.succeeded).toEqual(['good']);
  expect(result.failed.map(f => f.id)).toEqual(['bad']);
  expect(calls).toContain('POST /api/v1/collections/c1/notes good');
  expect(calls).toContain('POST /api/v1/collections/c2/notes good');
  expect(calls.filter(c => c.endsWith(' good'))).toHaveLength(2);
  expect(calls.some(c => c.startsWith('PUT'))).toBe(false);
});
it('renames through Note.update and pins through Pinned, validates before making requests', async () => {
  const calls: unknown[] = [];
  const sdk = createAncher('test', { baseUrl: 'https://api.example.com', fetch: (async (input, init) => {
    calls.push([init?.method, new URL(String(input)).pathname, init?.body ? JSON.parse(String(init.body)) : null]);
    return Response.json({});
  }) as typeof fetch });
  await expect(mutateAncherNotes(sdk, { action: 'rename', ids: ['n1'], title: ' ' })).rejects.toThrow();
  expect(calls).toHaveLength(0);
  await mutateAncherNotes(sdk, { action: 'rename', ids: ['n1'], title: ' 新标题 ' });
  await mutateAncherNotes(sdk, { action: 'pin', ids: ['n1'] });
  expect(calls).toEqual([['PATCH', '/api/v1/notes/n1', { title: '新标题' }], ['POST', '/api/v1/pinned/', { type: 'note', entity_id: 'n1' }]]);
});

it('bounds bulk deletion concurrency, retains failures and preserves request order', async () => {
  let active = 0, peak = 0;
  const sdk = createAncher('test', { baseUrl: 'https://api.example.com', fetch: (async (input, init) => {
    expect(init?.method).toBe('DELETE');
    active++; peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, 5)); active--;
    return new Response(null, { status: String(input).endsWith('/n3') ? 403 : 204 });
  }) as typeof fetch });
  const result = await mutateAncherNotes(sdk, { action: 'delete', ids: Array.from({ length: 9 }, (_, i) => `n${i}`) });
  expect(peak).toBe(4);
  expect(result.succeeded).toEqual(['n0', 'n1', 'n2', 'n4', 'n5', 'n6', 'n7', 'n8']);
  expect(result.failed.map(f => f.id)).toEqual(['n3']);
});
it('only changes public state explicitly and emits the canonical share URL', async () => {
  const bodies: unknown[] = [];
  const sdk = createAncher('test', { baseUrl: 'https://api.example.com', fetch: (async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body))); return Response.json({ id: 'n1', slug: 'public-note' });
  }) as typeof fetch });
  expect((await mutateAncherNotes(sdk, { action: 'share', ids: ['n1'], public: true })).shareUrl).toBe('https://app.ancher.ai/notes/public-note');
  expect((await mutateAncherNotes(sdk, { action: 'share', ids: ['n1'], public: false })).shareUrl).toBeUndefined();
  expect(bodies).toEqual([{ is_public: true }, { is_public: false }]);
});
