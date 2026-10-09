import type { AncherSdk } from '@ancher-ai/sdk';
export interface CreateAncherNoteInput {
  text: string; comment?: string; collectionId?: string;
  files?: { name: string; mime: string; bytes: Uint8Array }[];
}
export async function createAncherNote(sdk: Pick<AncherSdk, 'Note' | 'File' | 'Collection'>, input: CreateAncherNoteInput): Promise<{ noteId: string; warning?: string }> {
  const text = input.text.trim();
  const files = input.files ?? [];
  const comment = input.comment?.trim() || undefined;
  if (!text && !files.length) throw new Error('请输入笔记内容或选择文件');
  if (files.length > 10) throw new Error('最多选择 10 个文件');
  if (files.some((f) => !f.bytes.byteLength || f.bytes.byteLength > 50 * 1024 * 1024)) throw new Error('文件不能为空，且每个文件最大 50 MB');
  if (files.length && text) throw new Error('请分别创建文本笔记和文件笔记，或将补充说明填入背景与意图');
  let note;
  if (files.length) {
    const ids: string[] = [];
    for (const file of files) {
      const uploaded = await sdk.File.upload(new Blob([new Uint8Array(file.bytes)], { type: file.mime || 'application/octet-stream' }), { filename: file.name });
      ids.push(uploaded.id);
    }
    note = await sdk.Note.createFromFile({ file_ids: ids, comment });
  } else if (/^https?:\/\/\S+$/i.test(text)) note = await sdk.Note.createFromUrl({ text, comment });
  else note = await sdk.Note.createFromText({ text, comment });
  if (input.collectionId) try { await sdk.Collection.addNote(input.collectionId, note.id); }
  catch { return { noteId: note.id, warning: '笔记已创建，但未能加入合集，请在官网调整' }; }
  return { noteId: note.id };
}
