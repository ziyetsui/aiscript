import { describe, it, expect, vi } from 'vitest';
import { createAncherNote } from '../src/create-note.ts';
const mock = () => ({ Note: { createFromText: vi.fn().mockResolvedValue({ id: 'new' }), createFromUrl: vi.fn().mockResolvedValue({ id: 'new' }), createFromFile: vi.fn().mockResolvedValue({ id: 'new' }) }, File: { upload: vi.fn().mockResolvedValue({ id: 'file' }) }, Collection: { addNote: vi.fn().mockResolvedValue({}) } });
describe('create cloud note', () => {
 it('routes text and background, then adds the created note to a collection', async () => {
  const sdk = mock();
  expect(await createAncherNote(sdk as never, { text: '正文', comment: '意图', collectionId: 'collection' })).toEqual({ noteId: 'new' });
  expect(sdk.Note.createFromText).toHaveBeenCalledWith({ text: '正文', comment: '意图' });
  expect(sdk.Collection.addNote).toHaveBeenCalledWith('collection', 'new');
 });
 it('routes a URL to parsing', async () => {
  const sdk = mock(); await createAncherNote(sdk as never, { text: 'https://youtube.com/watch?v=123' });
  expect(sdk.Note.createFromUrl).toHaveBeenCalled(); expect(sdk.Note.createFromText).not.toHaveBeenCalled();
 });
 it('uploads files before creating a note', async () => {
  const sdk = mock(); await createAncherNote(sdk as never, { text: '', files: [{ name: 'a.txt', mime: 'text/plain', bytes: new Uint8Array([65]) }] });
  expect(sdk.File.upload).toHaveBeenCalled(); expect(sdk.Note.createFromFile).toHaveBeenCalledWith({ file_ids: ['file'], comment: undefined });
 });
 it('rejects empty content before sending', async () => { const sdk = mock(); await expect(createAncherNote(sdk as never, { text: '  ' })).rejects.toThrow('内容'); expect(sdk.Note.createFromText).not.toHaveBeenCalled(); });
 it('preserves successful creation when collection assignment fails', async () => { const sdk = mock(); sdk.Collection.addNote.mockRejectedValue(new Error('offline')); expect(await createAncherNote(sdk as never, { text: '正文', collectionId: 'c' })).toEqual({ noteId: 'new', warning: '笔记已创建，但未能加入合集，请在官网调整' }); });
});
