// Agent activity, after Ancher's ActivityTree: tool calls become short Chinese rows ("联网搜索 · 胡同 修鞋铺"),
// consecutive calls of the same tool merge into ×N, and the whole block folds into one 「完成 N 个步骤」 line.

export interface ToolEvent { phase: 'call' | 'return'; id: string; name: string; args?: unknown }
/** One row: a tool (or ⚡ workflow step) with its object and how many consecutive calls it stands for. */
export interface ActivityRow { label: string; obj?: string; n: number; running?: boolean }

const KNOWN: Record<string, string> = {
  web_search: '联网搜索', search_web: '联网搜索', google_search: '联网搜索', tavily_search: '联网搜索',
  fetch_url: '读取网页', read_url: '读取网页', web_fetch: '读取网页', browse: '读取网页', crawl: '读取网页',
  kb_search: '搜索知识库', knowledge_search: '搜索知识库', search_knowledge: '搜索知识库', search_notes: '搜索笔记',
  read_note: '读取笔记', get_note: '读取笔记', create_note: '新建笔记', update_note: '更新笔记',
  read_file: '读取文件', parse_file: '解析文件', transcribe: '转写音视频', analyze_video: '解析视频', analyze_image: '识别图片',
  trending: '查看热点', get_trending: '查看热点', think: '整理思路', plan: '拟定计划', delegate: '交给子任务', run_subagent: '交给子任务',
};
// Matched against whole snake_case / kebab-case tokens, so "widget" never reads as "get".
const WORDS: [RegExp, string][] = [
  [/^(search|query|lookup)$/, '搜索'], [/^(fetch|crawl|browse|url|web|scrape)$/, '读取网页'], [/^transcri/, '转写'], [/^video$/, '解析视频'], [/^(image|vision|ocr)$/, '识别图片'],
  [/^notes?$/, '处理笔记'], [/^(files?|docs?|documents?)$/, '读取文件'], [/^(read|get|list|view|load)$/, '读取'], [/^(write|create|insert|add|save)$/, '写入'], [/^(update|edit|patch)$/, '修改'],
];
const pick = (a: unknown): string | undefined => {
  if (typeof a === 'string') { try { return pick(JSON.parse(a)); } catch { return a; } }
  if (!a || typeof a !== 'object') return undefined;
  const o = a as Record<string, unknown>;
  for (const k of ['query', 'q', 'queries', 'url', 'urls', 'title', 'name', 'path', 'file_name', 'topic', 'text']) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v;
    if (Array.isArray(v) && typeof v[0] === 'string') return v.join('、');
  }
  return undefined;
};
const clip = (s: string, n = 28) => { const t = s.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n)}…` : t; };

/** A tool call → the row text the writer sees. Unknown tools get a readable guess, never a bare snake_case id when avoidable. */
export function toolLabel(name: string, args?: unknown): { label: string; obj?: string } {
  const key = name.toLowerCase();
  const label = KNOWN[key] ?? WORDS.find(([re]) => key.split(/[_\-\s.]+/).some((t) => re.test(t)))?.[1] ?? (name.replace(/[_-]+/g, ' ').trim() || '调用工具');
  const o = pick(args);
  return o ? { label, obj: clip(o) } : { label };
}

/** Add a started call to the block: the same label right after a finished one merges into ×N. */
export function addCall(rows: ActivityRow[], label: string, obj?: string): ActivityRow[] {
  const last = rows.at(-1);
  if (last && last.label === label && !last.running) return [...rows.slice(0, -1), { label, obj, n: last.n + 1, running: true }];
  return [...rows, { label, obj, n: 1, running: true }];
}
/** Mark the most recent running row with this label done. */
export function endCall(rows: ActivityRow[], label: string): ActivityRow[] {
  const i = rows.findLastIndex((r) => r.label === label && r.running);
  if (i < 0) return rows;
  return rows.map((r, k) => (k === i ? { label: r.label, n: r.n, ...(r.obj ? { obj: r.obj } : {}) } : r));
}
/** 「完成 N 个步骤 · 后两步」 — the folded line. */
export function activitySummary(rows: ActivityRow[]): string {
  const n = rows.reduce((a, r) => a + r.n, 0);
  return `完成 ${n} 个步骤 · ${rows.slice(-2).map((r) => r.label).join('、')}`;
}
