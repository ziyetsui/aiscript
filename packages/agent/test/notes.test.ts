import { describe, expect, it } from 'vitest';
import { createAncher, loadAncherLibrary, readAncherNote } from '../src/index.ts';

const note = (id: string, extra = {}) => ({ id, title: `官网笔记 ${id}`, status: 'ready', created_at: 1750000000, updated_at: 1750000001, description: '摘要', comment: '', tags: [], collections: [], files: {}, ...extra });
const sdkFor = (route: (url: URL) => Response) => createAncher('test-key', { baseUrl: 'https://api.example.com', fetch: (async (input) => route(new URL(String(input)))) as typeof fetch });

describe('Ancher account knowledge', () => {
  it('includes notes across pages, empty collections and server-owned pins', async () => {
    const sdk = sdkFor((url) => {
      if (url.pathname === '/api/v1/notes/') return Response.json(url.searchParams.has('cursor')
        ? { items: [note('n2', { status: 'processing', collections: [{ id: 'c1', name: '参考' }] })], has_more: false, next_cursor: 'final-cursor' }
        : { items: [note('n1')], has_more: true, next_cursor: 'page2' });
      if (url.pathname === '/api/v1/collections/') return Response.json({ items: [{ id: 'c1', name: '参考', color: 'blue', status: 'active' }, { id: 'c2', name: '空合集', color: 'green', status: 'active' }], has_more: false, next_cursor: null });
      if (url.pathname === '/api/v1/pinned/') return Response.json({ items: [{ type: 'note', entity_id: 'n2', index: 0, note: note('n2'), collection: null, artifact: null }, { type: 'note', entity_id: 'n1', index: 1, note: note('n1'), collection: null, artifact: null }], has_more: false, next_cursor: null });
      throw new Error(`unexpected ${url}`);
    });
    const library = await loadAncherLibrary(sdk);
    expect(library.notes).toMatchObject([{ id: 'n1', title: '官网笔记 n1', starred: true, addedAt: 1750000000000 }, { id: 'n2', status: 'processing', collectionIds: ['c1'], starred: true }]);
    expect(library.pinnedNoteIds).toEqual(['n2', 'n1']);
    expect(library.collections).toEqual([{ id: 'c1', name: '参考', color: 'blue' }, { id: 'c2', name: '空合集', color: 'green' }]);
  });

  it('does not fetch a body until transcription is ready', async () => {
    const sdk = sdkFor((url) => {
      if (url.pathname === '/api/v1/notes/n1') return Response.json(note('n1', { status: 'processing' }));
      throw new Error('body must not be fetched for a processing note');
    });
    expect(await readAncherNote(sdk, 'n1')).toMatchObject({ note: { status: 'processing' }, body: null });
  });

  it('keeps fetched notes and legacy articles pending until generated content is ready', async () => {
    for (const extra of [{ status: 'fetched' }, { status: 'ready', article: { status: 'processing' } }]) {
      const sdk = sdkFor((url) => {
        if (url.pathname === '/api/v1/notes/n1') return Response.json(note('n1', extra));
        throw new Error('must not read generated content while the article is pending');
      });
      const result = await readAncherNote(sdk, 'n1');
      expect(result.note.status).toBe(extra.article ? 'processing' : 'fetched');
      expect(result.body).toBeNull();
    }
  });

  it('reads text through the SDK content URL without forwarding account credentials to the CDN', async () => {
    const sdk = createAncher('test-key', { baseUrl: 'https://api.example.com', fetch: (async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname === '/api/v1/notes/n1') return Response.json(note('n1'));
      if (url.pathname === '/api/v1/notes/n1/content/presigned-urls') return Response.json({ download_url: 'https://cdn.example.com/body', expires_in: 300 });
      if (url.origin === 'https://cdn.example.com') {
        if (new Headers(init?.headers).has('authorization')) throw new Error('credential leaked to CDN');
        return new Response('# 视频逐字稿\n你好。', { headers: { 'content-type': 'text/markdown' } });
      }
      throw new Error(`unexpected ${url}`);
    }) as typeof fetch });
    expect(await readAncherNote(sdk, 'n1')).toMatchObject({ body: '# 视频逐字稿\n你好。' });
  });

  it('rejects binary note content instead of showing corrupted text', async () => {
    const sdk = sdkFor((url) => {
      if (url.pathname === '/api/v1/notes/n1') return Response.json(note('n1'));
      if (url.pathname.endsWith('/content/presigned-urls')) return Response.json({ download_url: 'https://cdn.example.com/image', expires_in: 300 });
      return new Response(new Uint8Array([255, 216, 255]), { headers: { 'content-type': 'image/jpeg' } });
    });
    await expect(readAncherNote(sdk, 'n1')).rejects.toThrow('此笔记的正文不是文本');
  });
});
