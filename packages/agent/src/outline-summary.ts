import { parseReply, type Op } from '@scripter/core';

/** A dedicated outline command writes only the outline, even if the model proposes script edits. */
export function outlineSummaryReply(text: string) {
  const parsed = parseReply(text);
  if (parsed.errors.length) throw new Error('大纲回复格式不正确，原大纲未改动，请重试');
  const replacements = parsed.ops.filter((op) => op.op === 'setOutline');
  const additions = parsed.ops.filter((op) => op.op === 'appendOutline');
  const outline = (replacements.at(-1)?.text ?? (additions.length ? additions.map((op) => op.text).join('\n\n') : parsed.ops.length ? '' : parsed.narration)).trim();
  if (!outline) throw new Error('没有收到可写入的大纲，原大纲未改动，请重试');
  return { ...parsed, narration: '已总结并更新大纲。', ops: [{ op: 'setOutline', text: outline }] as Op[] };
}
