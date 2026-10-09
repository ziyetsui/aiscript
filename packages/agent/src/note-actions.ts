import type { AncherSdk } from '@ancher-ai/sdk';
import { describeError } from './ancher.ts';

export type AncherNoteMutation =
  | { action: 'delete' | 'pin' | 'unpin' | 'retry'; ids: string[] }
  | { action: 'rename'; ids: string[]; title: string }
  | { action: 'collect'; ids: string[]; collectionIds: string[] }
  | { action: 'share'; ids: string[]; public: boolean };
export interface AncherMutationResult { succeeded: string[]; failed: { id: string; error: string }[]; shareUrl?: string }
const uniqueIds = (ids: string[]) => {
  if (!Array.isArray(ids) || !ids.length || ids.some(id => typeof id !== 'string' || !id.trim() || id.length > 200)) throw new Error('请选择有效的笔记或合集');
  return [...new Set(ids)];
};
/** Remote mutations use the real SDK. Failures stay selectable; collection membership is additive. */
export async function mutateAncherNotes(sdk: Pick<AncherSdk, 'Note' | 'Collection' | 'Pinned'>, input: AncherNoteMutation): Promise<AncherMutationResult> {
  const ids = uniqueIds(input.ids);
  const collectionIds = input.action === 'collect' ? uniqueIds(input.collectionIds) : [];
  if (input.action === 'rename' && (!input.title.trim() || input.title.trim().length > 255 || ids.length !== 1)) throw new Error('标题须为 1–255 个字符');
  if (input.action === 'share' && ids.length !== 1) throw new Error('一次只能分享一条笔记');
  const result: AncherMutationResult = { succeeded: [], failed: [] };
  // Limit concurrency to four requests, rather than flooding the account API on select-all.
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, ids.length) }, async () => {
    while (next < ids.length) {
      const id = ids[next++]!;
      try {
        switch (input.action) {
          case 'delete': await sdk.Note.delete(id); break;
          case 'pin': await sdk.Pinned.pin({ type: 'note', entity_id: id }); break;
          case 'unpin': await sdk.Pinned.unpin(id); break;
          case 'retry': await sdk.Note.retry(id); break;
          case 'rename': await sdk.Note.update(id, { title: input.title.trim() }); break;
          case 'collect': for (const collectionId of collectionIds) await sdk.Collection.addNote(collectionId, id); break;
          case 'share': {
            const note = await sdk.Note.update(id, { is_public: input.public });
            if (input.public) result.shareUrl = `https://app.ancher.ai/notes/${encodeURIComponent(note.slug || note.id || id)}`;
            break;
          }
          default: throw new Error('不支持的笔记操作');
        }
        result.succeeded.push(id);
      } catch (e) { result.failed.push({ id, error: describeError(e) }); }
    }
  }));
  result.succeeded.sort((a, b) => ids.indexOf(a) - ids.indexOf(b));
  result.failed.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return result;
}
