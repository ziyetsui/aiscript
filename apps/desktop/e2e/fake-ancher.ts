// A tiny stand-in for api.ancher.ai, speaking the same SSE envelope the SDK parses. Test use only.
import { createServer, type Server } from 'node:http';

export const GOOD_KEY = 'test-ancher-key';
export const REPLY = '好的，先写开场。<ops>[{"op":"insertNode","type":"heading","text":"外景 胡同口 — 傍晚"},{"op":"insertNode","type":"action","text":"豆豆蹲在自家门墩儿旁边，用手指头戳石狮子的鼻子。"},{"op":"insertNode","type":"character","text":"门墩儿"},{"op":"insertNode","type":"dialogue","text":"别捏了，它要说话的。"},{"op":"upsertCharacter","name":"门墩儿","role":"精灵 · 一百多岁","desc":"住在石门墩里，嘴硬心软"},{"op":"upsertLocation","name":"胡同口","ie":"外景","times":["傍晚"]}]</ops>';

/** "润色对白" rewrites the first dialogue line it sees in the packed script — exercises the modification preview. */
function replyFor(prompt: string): string {
  if (prompt.includes('用户：润色对白')) {
    const m = prompt.match(/\[([a-z0-9]+)\] dialogue: (.*)/);
    if (m) return `把这句改得更像孩子说话。<ops>[{"op":"updateNode","id":"${m[1]}","text":"石头……石头它会说话？！"}]</ops>`;
  }
  return REPLY;
}

export function startFakeAncher(): Promise<{ url: string; server: Server; prompts: string[] }> {
  const prompts: string[] = [];
  const server = createServer((req, res) => {
    const auth = req.headers.authorization;
    const json = (status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (auth !== `Bearer ${GOOD_KEY}`) return json(401, { message: 'invalid api key', code: 'API-AUT001' });
    const url = req.url ?? '';
    if (req.method === 'GET' && url.startsWith('/api/v1/users/me')) {
      return json(200, { id: 'u1', email: 'writer@example.com', full_name: '测试编剧', created_at: 0, created_by: '', updated_at: 0, updated_by: '', phone: null, oauth_source: null, invitation_code: '', is_active: true, is_email_verified: true, activation_completed: true, tutorial_completed: true, demographic: null, preferences: null });
    }
    if (req.method === 'POST' && /^\/api\/v1\/conversations(\/c1)?$/.test(url)) {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => { prompts.push(JSON.parse(body).content); json(202, { conversation_id: 'c1', message_id: 'm1', user_message_id: 'um1', run_id: 'r1', stream_url: '/api/v1/conversations/c1/stream', status: 'running' }); });
      return;
    }
    if (req.method === 'GET' && url.startsWith('/api/v1/conversations/c1/stream')) {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      const reply = replyFor(prompts.at(-1) ?? '');
      const chunks = [reply.slice(0, 8), reply.slice(8, 120), reply.slice(120)].filter(Boolean);
      // Main-agent text arrives as `content` envelopes (what parseChatStream maps to ChatEvent 'text').
      const ev = (delta: string) => ({ type: 'content', conversation_id: 'c1', message_id: 'm1', delta, created_at: Date.now() / 1000 });
      let i = 0;
      const t = setInterval(() => {
        if (i < chunks.length) res.write(`data: ${JSON.stringify(ev(chunks[i++]!))}\n\n`);
        else { res.write(`data: ${JSON.stringify({ type: 'done', conversation_id: 'c1', message_id: 'm1', finish_reason: 'stop' })}\n\n`); res.end(); clearInterval(t); }
      }, 120);
      req.on('close', () => clearInterval(t));
      return;
    }
    if (req.method === 'POST' && url.endsWith('/interruption')) return json(204, {});
    json(404, { message: `no route ${req.method} ${url}` });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    const a = server.address();
    resolve({ url: `http://127.0.0.1:${typeof a === 'object' && a ? a.port : 0}`, server, prompts });
  }));
}
