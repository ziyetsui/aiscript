import type { Topic } from '@scripter/core/script';
export const TOPIC_STATUS = { idea: '待定', picked: '已选', dropped: '已否' } as const;
export function topicMarkdown(t: Topic) {
  return [`# ${t.title}`, t.logline, t.why && `## 推荐理由\n\n${t.why}`, `状态：${TOPIC_STATUS[t.status]}`, t.reason && `否掉的原因：${t.reason}`, t.source && `## 来源\n\n${t.source}`].filter(Boolean).join('\n\n');
}
export function topicFilename(t: Topic) { return `${t.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim().slice(0, 100) || '未命名选题'}.md`; }
export function topicAge(at: number) {
  if (!at) return '未记录日期';
  const days = Math.max(0, Math.floor((Date.now() - at) / 86400000));
  return days === 0 ? '今天' : days < 7 ? `${days}d` : days < 30 ? `${Math.floor(days / 7)}w` : `${Math.floor(days / 30)}mo`;
}
export function downloadTopics(topics: Topic[]) {
  const url = URL.createObjectURL(new Blob([topics.map(topicMarkdown).join('\n\n---\n\n')], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = topics.length === 1 ? topicFilename(topics[0]!) : '选题池.md';
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
}
