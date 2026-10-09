import { describe, expect, it } from 'vitest';
import { ScriptDoc, needsReview, previewOps } from '../src/index.ts';

describe('delivery review protections', () => {
  it('requires review before replacing existing scene shots', () => {
    const d = new ScriptDoc();
    d.insert(null, 'heading', '旧场景', 'scene');
    d.bible('shots').add({ sceneId: 'scene', desc: '作者手写的镜头' });
    d.commit();
    const ops = [{ op: 'setShots' as const, sceneId: 'scene', shots: [{ size: '近景' as const, desc: 'AI 新镜头', dur: 5 }] }];
    expect(needsReview(ops, '', d.readBible().shots)).toBe(true);
    expect(needsReview(ops, '', [])).toBe(false);
    const before = previewOps(d, ops);
    expect(before.items[0]).toMatchObject({ after: '1. 近景 · 5秒 · AI 新镜头' });
    d.bible('shots').update(d.readBible().shots[0]!.id, { desc: '预览后作者又改过' });
    d.commit();
    expect(previewOps(d, ops).items).not.toEqual(before.items);
  });
  it('old notes inherit new metadata defaults after loading', () => {
    const d = new ScriptDoc();
    d.bible('files').add({ name: '旧笔记.txt', file: 'abcdef.txt' });
    d.commit();
    const note = ScriptDoc.fromSnapshot(d.snapshot()).readBible().files[0]!;
    expect(note.tags).toEqual([]);
    expect(note.group).toBe('全部笔记');
  });
});
