import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { describe, expect, it, vi } from 'vitest';
import { fetchNewsNow, normalizeHotspots, stopNewsNowProcesses } from '../src/newsnow.ts';
const serverPath = createRequire(new URL('../../../apps/desktop/package.json', import.meta.url)).resolve('newsnow-mcp-server');
describe('NewsNow official MCP', () => {
  it('deduplicates titles/URLs and rejects unsafe/malformed links', () => {
    const r = normalizeHotspots([
      { source: '知乎', text: '1. [学校新操场](https://example.com/a?utm_source=a)\n2. [坏链接](javascript:alert(1))\n3. [缺失]()' },
      { source: '微博', text: '1. [学校 新操场](https://example.com/b)\n2. [另一个标题](https://example.com/a?utm_source=b)\n3. [雨天](https://example.com/c)' },
    ]);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ title: '学校新操场', sources: ['知乎', '微博'], url: 'https://example.com/a' });
  });
  it('talks to the real official server, tolerates one failed source and closes its process', async () => {
    const http = createServer((req, res) => {
      res.setHeader('content-type', 'application/json');
      if (req.url?.includes('weibo')) { res.statusCode = 403; res.end('{}'); return; }
      res.end(JSON.stringify({ status: 'success', items: [{ title: '学校新操场', url: 'https://example.com/a' }] }));
    }).listen(0, '127.0.0.1');
    await once(http, 'listening');
    const addr = http.address() as { port: number };
    let pid: number | null = null;
    try {
      const r = await fetchNewsNow({ command: process.execPath, serverPath, baseUrl: `http://127.0.0.1:${addr.port}`, onPid: (p) => { pid = p; } }, new AbortController().signal);
      expect(r.items).toHaveLength(1);
      expect(r.failedSources).toEqual(['微博']);
      expect(r.items[0]?.sources).toEqual(['知乎', '百度', '今日头条']);
      expect(pid).toBeTypeOf('number');
      expect(() => process.kill(pid!, 0)).toThrow();
    } finally { http.closeAllConnections(); http.close(); }
  }, 20000);
  it('rejects a pre-cancelled request without starting a process', async () => {
    const c = new AbortController(); c.abort();
    await expect(fetchNewsNow({ command: process.execPath, serverPath }, c.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('reports an unavailable service rather than returning an empty fabricated digest', async () => {
    await expect(fetchNewsNow({ command: process.execPath, serverPath, baseUrl: 'http://127.0.0.1:1' }, new AbortController().signal)).rejects.toThrow('NewsNow 暂时不可用');
  }, 20000);
  it('cleans up a real child process on cancellation and per-source timeout', async () => {
    const http = createServer((_req, _res) => {}).listen(0, '127.0.0.1');
    await once(http, 'listening');
    const baseUrl = `http://127.0.0.1:${(http.address() as { port: number }).port}`;
    try {
      for (const cancel of [true, false]) {
        const c = new AbortController(); let pid: number | null = null;
        const result = fetchNewsNow({ command: process.execPath, serverPath, baseUrl, timeout: 50,
          onPid: (p) => { pid = p; if (cancel) setTimeout(() => c.abort(), 20); },
        }, c.signal);
        if (cancel) await expect(result).rejects.toMatchObject({ name: 'AbortError' });
        else await expect(result).rejects.toThrow('NewsNow 暂时不可用');
        expect(pid).toBeTypeOf('number'); expect(() => process.kill(pid!, 0)).toThrow();
      }
    } finally { http.closeAllConnections(); http.close(); }
  }, 20000);

  it('quit still terminates a child after the transport drops its pid during cleanup', async () => {
    const http = createServer((_req, _res) => {}).listen(0, '127.0.0.1');
    await once(http, 'listening');
    let resolvePid!: (p: number) => void;
    const ready = new Promise<number>((resolve) => { resolvePid = resolve; });
    const c = new AbortController();
    const pending = fetchNewsNow({ command: process.execPath, serverPath, baseUrl: `http://127.0.0.1:${(http.address() as { port: number }).port}`,
      onPid: (pid) => resolvePid(pid!),
    }, c.signal).catch(() => {});
    let spy: ReturnType<typeof vi.spyOn> | undefined;
    try {
      const pid = await ready;
      spy = vi.spyOn(StdioClientTransport.prototype, 'pid', 'get').mockReturnValue(null);
      stopNewsNowProcesses();
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(() => process.kill(pid, 0)).toThrow();
    } finally { spy?.mockRestore(); c.abort(); await pending; http.closeAllConnections(); http.close(); }
  }, 20000);

});
