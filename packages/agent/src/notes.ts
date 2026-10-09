import type { AncherSdk } from '@ancher-ai/sdk';
import type { Note } from '@ancher-ai/sdk/contracts';

/** Account data sent to the renderer; contains no keys or expiring download URLs. */
export interface AncherNote {
  id: string; title: string; description: string; memo: string;
  status: 'queued' | 'processing' | 'fetched' | 'ready' | 'error'; error: string;
  addedAt: number; updatedAt: number; starred: boolean;
  tags: string[]; collectionIds: string[];
}
export interface AncherLibrary {
  notes: AncherNote[];
  pinnedNoteIds: string[];
  collections: { id: string; name: string; color: string }[];
}
export interface AncherNoteContent { note: AncherNote; body: string | null }

function publicNote(note: Note, starred = false): AncherNote {
  // The current API adds fetched; legacy notes expose the article's lifecycle separately.
  const pending = ['queued', 'processing', 'fetched'] as const;
  const status = pending.find((s) => (note.status as string) === s || (note.article?.status as string | undefined) === s) ?? note.status;
  return {
    id: note.id, title: note.title || note.article?.title || '未命名笔记',
    description: note.description || note.article?.description || '', memo: note.comment || '',
    status, error: note.error_message || '', addedAt: note.created_at * 1000, updatedAt: note.updated_at * 1000,
    starred, tags: (note.tags ?? []).map((t) => t.name), collectionIds: (note.collections ?? []).map((c) => c.id),
  };
}

async function collect<T>(items: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of items) result.push(item);
  return result;
}
export async function loadAncherLibrary(sdk: Pick<AncherSdk, 'Note' | 'Collection' | 'Pinned'>): Promise<AncherLibrary> {
  const [notes, collections, pins] = await Promise.all([
    collect(sdk.Note.iterate({ limit: 100, orderBy: ['-created_at'] })),
    collect(sdk.Collection.iterate({ limit: 100, where: { status: 'active' } })),
    collect(sdk.Pinned.iterate({ limit: 100, orderBy: ['+index'] })),
  ]);
  const pinnedNoteIds = pins.filter((p) => p.type === 'note').map((p) => p.entity_id);
  const pinned = new Set(pinnedNoteIds);
  return { notes: notes.map((n) => publicNote(n, pinned.has(n.id))), pinnedNoteIds, collections: collections.map(({ id, name, color }) => ({ id, name, color })) };
}

export async function readAncherNote(sdk: Pick<AncherSdk, 'Note'>, id: string): Promise<AncherNoteContent> {
  if (!id || id.length > 200) throw new Error('笔记 ID 无效');
  const note = publicNote(await sdk.Note.get(id));
  if (note.status !== 'ready') return { note, body: null };
  const res = await sdk.Note.getContent(id);
  const mime = res.headers.get('content-type')?.split(';')[0]?.trim() || '';
  if (mime && !mime.startsWith('text/') && !['application/json', 'application/xml'].includes(mime)) throw new Error('此笔记的正文不是文本，请在 Ancher 官网查看');
  const reader = res.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2 * 1024 * 1024) { await reader.cancel(); throw new Error('笔记正文超过 2MB，请在 Ancher 官网查看'); }
      chunks.push(value);
    }
  } finally { reader?.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return { note, body: new TextDecoder().decode(bytes) };
}
