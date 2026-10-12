import { expect, it } from 'vitest';
import { ScriptDoc, applyOps, needsReview, previewOps } from '../src/index.ts';

it('treats legacy outline additions as standalone replacements with accurate review', () => {
  const doc = new ScriptDoc();
  doc.setOutline('第一版：旧的开场和结尾');
  doc.commit();
  const ops = [{ op: 'appendOutline' as const, text: '第二版：全新的开场和结尾' }];
  expect(needsReview(ops, doc.outline)).toBe(true);
  expect(previewOps(doc, ops).items).toEqual([{ kind: 'outline', mode: 'replace', before: '第一版：旧的开场和结尾', after: '第二版：全新的开场和结尾' }]);
  applyOps(doc, ops, '生成第二版');
  expect(doc.outline).toBe('第二版：全新的开场和结尾');
});
