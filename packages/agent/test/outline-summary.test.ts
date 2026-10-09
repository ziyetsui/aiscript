import { expect, it } from 'vitest';
import { outlineSummaryReply } from '../src/outline-summary.ts';
it('writes Markdown-only summaries as an undoable outline replacement',()=>{
  expect(outlineSummaryReply('## 故事\n\n- 开场\n- 结尾').ops).toEqual([{op:'setOutline',text:'## 故事\n\n- 开场\n- 结尾'}]);
});
it('accepts outline ops while rejecting unrelated script edits',()=>{
  expect(outlineSummaryReply('完成。<ops>[{"op":"setOutline","text":"故事梗概"}]</ops>').ops).toEqual([{op:'setOutline',text:'故事梗概'}]);
  expect(()=>outlineSummaryReply('完成。<ops>[{"op":"insertNode","type":"action","text":"正文"}]</ops>')).toThrow();
  expect(()=>outlineSummaryReply('')).toThrow();
  expect(()=>outlineSummaryReply('<ops>坏 JSON</ops>')).toThrow();
});
