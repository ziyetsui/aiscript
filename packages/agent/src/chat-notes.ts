import type { Bible } from '@scripter/core';
export interface ChatNoteAttachment { source: 'ancher' | 'project'; id: string; title: string }
export function prepareChatNotes(input: ChatNoteAttachment[], bible: Bible) {
  if (!Array.isArray(input) || input.length > 10) throw new Error('每条消息最多添加 10 条笔记');
  const notes: ChatNoteAttachment[] = [];
  const attachments: { type: 'note'; id: string }[] = [];
  const references: string[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    if (!item || !['ancher','project'].includes(item.source) || typeof item.id !== 'string' || !item.id || item.id.length > 200 || typeof item.title !== 'string') throw new Error('笔记附件无效');
    const key = `${item.source}:${item.id}`;
    if (seen.has(key)) continue; seen.add(key);
    if (item.source === 'ancher') { attachments.push({ type: 'note', id: item.id }); notes.push({ ...item, title: item.title.slice(0, 200) }); }
    else {
      const file = bible.files.find((f) => f.id === item.id);
      if (!file) throw new Error('笔记已移除，请重新添加');
      if (file.extract !== 'ready' || !file.excerpt.trim()) throw new Error(`《${file.title || file.name}》还没有可用正文，请先完成笔记读取`);
      notes.push({ source:'project', id:file.id, title:file.title || file.name });
      references.push(`《${file.title || file.name}》\n${file.excerpt.slice(0, 10000)}`);
    }
  }
  return { notes, attachments, reference: references.join('\n\n') };
}
