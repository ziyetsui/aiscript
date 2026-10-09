import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { tmpdir } from 'node:os';
import { z } from 'zod';

export const NEWSNOW_BASE_URL = 'https://newsnow.busiyi.world';
const active = new Map<StdioClientTransport, { pid: number | null }>();
/** Synchronous shutdown for Electron's before-quit, including MCP initialization in progress. */
export function stopNewsNowProcesses(): void {
  for (const [t, state] of active) { const pid = state.pid ?? t.pid; if (pid) { try { process.kill(pid); } catch { /* already closed */ } } }
}
const SOURCES = [{ id: 'zhihu', name: '知乎' }, { id: 'weibo', name: '微博' }, { id: 'baidu', name: '百度' }, { id: 'toutiao', name: '今日头条' }];
export interface Hotspot { title: string; url: string; sources: string[] }
export interface NewsNowDigest { items: Hotspot[]; failedSources: string[]; fetchedAt: number }
export interface NewsNowOptions { command: string; serverPath: string; baseUrl?: string; onPid?: (pid: number | null) => void; timeout?: number }

/** Official tool returns numbered Markdown links; never trust upstream URLs or instructions. */
export function normalizeHotspots(results: { source: string; text: string }[]): Hotspot[] {
  const items: Hotspot[] = [];
  const byTitle = new Map<string, Hotspot>(), byUrl = new Map<string, Hotspot>();
  for (const { source, text } of results) {
    for (const line of text.slice(0, 100000).split(/\r?\n/).slice(0, 10)) {
      const match = /^\d+\.\s+\[(.+)\]\((https?:\/\/.+)\)\s*$/.exec(line);
      if (!match) continue;
      const title = match[1]!.trim().slice(0, 300);
      if (!title) continue;
      let url: URL;
      try { url = new URL(match[2]!); } catch { continue; }
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) continue;
      url.hash = '';
      for (const key of [...url.searchParams.keys()]) if (/^utm_/i.test(key)) url.searchParams.delete(key);
      const canonical = url.href;
      const titleKey = title.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
      const existing = byTitle.get(titleKey) ?? byUrl.get(canonical);
      if (existing) {
        if (!existing.sources.includes(source)) existing.sources.push(source);
        byTitle.set(titleKey, existing); byUrl.set(canonical, existing);
      } else {
        const item = { title, url: canonical, sources: [source] };
        items.push(item); byTitle.set(titleKey, item); byUrl.set(canonical, item);
      }
    }
  }
  return items.slice(0, 40);
}

/** Each run owns its stdio process. No model keys, inherited application secrets or local HTTP server. */
export async function fetchNewsNow(options: NewsNowOptions, signal: AbortSignal): Promise<NewsNowDigest> {
  signal.throwIfAborted();
  const transport = new StdioClientTransport({
    command: options.command, args: [options.serverPath], cwd: tmpdir(), stderr: 'ignore',
    env: { BASE_URL: options.baseUrl ?? NEWSNOW_BASE_URL, ELECTRON_RUN_AS_NODE: '1', DOTENV_CONFIG_QUIET: 'true' },
  });
  const state = { pid: null as number | null };
  active.set(transport, state);
  const client = new Client({ name: 'Ancher-Scripter', version: '1.0.0' });
  try {
    await client.connect(transport, { signal, timeout: 10000 });
    state.pid = transport.pid;
    options.onPid?.(state.pid);
    const results = await Promise.all(SOURCES.map(async ({ id, name }) => {
      try {
        const result = await client.callTool({ name: 'get_hottest_latest_news', arguments: { id, count: 10 } }, undefined, { signal, timeout: options.timeout ?? 15000 });
        if (result.isError) return { source: name, text: '', failed: true };
        const content = z.object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() })) }).parse(result).content;
        const text = content.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('\n');
        return { source: name, text, failed: normalizeHotspots([{ source: name, text }]).length === 0 };
      } catch { signal.throwIfAborted(); return { source: name, text: '', failed: true }; }
    }));
    signal.throwIfAborted();
    const items = normalizeHotspots(results.filter((r) => !r.failed));
    if (!items.length) throw new Error('NewsNow 暂时不可用：未获取到有效热点，请稍后重试（公共服务可能限制访问）');
    return { items, failedSources: results.filter((r) => r.failed).map((r) => r.source), fetchedAt: Date.now() };
  } catch (e) {
    signal.throwIfAborted();
    if (e instanceof Error && e.message.startsWith('NewsNow 暂时不可用')) throw e;
    throw new Error('NewsNow 暂时不可用：无法连接官方 MCP，请稍后重试');
  } finally { state.pid ??= transport.pid; try { await client.close(); } finally { await transport.close(); active.delete(transport); } }
}
