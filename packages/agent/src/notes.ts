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
export interface AncherOriginal {
  id: string; name: string; mime: string; body?: string; url?: string; error?: string;
}
/** body is the generated detailed summary; originals are independent source files. */
export interface AncherNoteContent { note: AncherNote; body: string | null; summaryError?: string; needsRetry: boolean; originals: AncherOriginal[]; imageUrls: Record<string, string> }
interface SourceFile { id: string; filename?: string | null; mimetype?: string | null; parent_file_id?: string | null }
interface FileSlots { files?: Record<string, SourceFile>; origin_files?: SourceFile[]; downloaded_files?: SourceFile[]; transcript_file?: SourceFile | null; display_file?: SourceFile | null }
const textMime = (mime: string) => mime.startsWith('text/') || ['application/json', 'application/xml', 'application/x-subrip'].includes(mime);
function safeDownloadUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) throw new Error('原文下载地址无效');
  return url.href;
}

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
  const raw = await sdk.Note.get(id);
  const note = publicNote(raw);
  const slots = raw as unknown as FileSlots & { article?: FileSlots };
  const transcript = slots.transcript_file ?? slots.files?.transcript ?? slots.article?.transcript_file ?? slots.article?.files?.transcript;
  const display = slots.display_file ?? slots.files?.display ?? slots.article?.display_file ?? slots.article?.files?.display;
  // Download visibility is server-owned; never recover article.downloaded_files.
  const sources = [...(slots.origin_files ?? slots.article?.origin_files ?? []), ...(slots.downloaded_files ?? []), ...(transcript ? [transcript] : [])];
  const seen = new Set<string>();
  const originals = await Promise.all(sources.filter((f) => {
    if (!f?.id || !f.mimetype || seen.has(f.id)) return false;
    seen.add(f.id); return true;
  }).map(async (file): Promise<AncherOriginal> => {
    const original: AncherOriginal = { id: file.id, name: file.filename || '原始文件', mime: file.mimetype! };
    try {
      if (textMime(original.mime)) original.body = await readText(await sdk.Note.downloadFile(id, file.id));
      else {
        const isDocument = /officedocument|msword|ms-powerpoint|ms-excel/.test(original.mime);
        const rendition = isDocument && display && (display.parent_file_id === file.id || (!display.parent_file_id && sources[0]?.id === file.id)) ? display : undefined;
        original.mime = rendition?.mimetype || original.mime;
        original.url = safeDownloadUrl(await sdk.Note.filePresignedUrl(id, rendition?.id ?? file.id));
      }
    } catch { original.error = '原文文件暂时无法读取，请刷新重试'; }
    return original;
  }));
  let body: string | null = null;
  let summaryError: string | undefined;
  if (note.status === 'ready') try { body = await readText(await sdk.Note.getContent(id)); }
  catch (e) { summaryError = e instanceof Error ? e.message : '摘要暂时无法读取'; }
  const imageIds = new Set([...([body ?? '', ...originals.map((f) => f.body ?? '')].join('\n')).matchAll(/!\[[^\]]*\]\(streamify-file:\/\/([a-zA-Z0-9-]+)\)/g)].map((m) => m[1]!));
  const imageUrls: Record<string, string> = {};
  await Promise.all([...imageIds].map(async (fileId) => {
    try { imageUrls[fileId] = safeDownloadUrl(await sdk.Note.filePresignedUrl(id, fileId)); } catch { /* preserve readable text if one image is unavailable */ }
  }));
  return { note, body, summaryError, originals, imageUrls, needsRetry: !!summaryError || originals.some((f) => !!f.error) || Object.keys(imageUrls).length < imageIds.size };
}

async function readText(res: Response): Promise<string> {
  const mime = res.headers.get('content-type')?.split(';')[0]?.trim() || '';
  if (mime && !textMime(mime)) throw new Error('此笔记的正文不是文本，请在 Ancher 官网查看');
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
  return new TextDecoder().decode(bytes);
}
