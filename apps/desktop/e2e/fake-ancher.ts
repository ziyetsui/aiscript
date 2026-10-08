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
  const r = (o: unknown) => `好的。<result>${JSON.stringify(o)}</result>`;
  if (prompt.includes('为这一集少儿动画')) return '1. 孩子之间比鞋子很常见。';
  if (prompt.includes('写这一集的故事')) return r({ story: '豆豆想要一双会发光的鞋。门墩儿借来一双旧球鞋，鞋底刻着姥爷的名字。', core: { theme: '旧东西里有爱', keyScenes: ['鞋底刻字被发现'], motives: ['豆豆：不想输给大壮'] } });
  if (prompt.includes('把故事拆成')) return r({ scenes: Array.from({ length: 13 }, (_, i) => ({ heading: `外景 胡同口 — 日 ${i + 1}`, summary: `第 ${i + 1} 场`, key: i === 9 })) });
  const w = prompt.match(/任务：写第 (\d+)–(\d+) 场/);
  if (w) {
    const ops = [];
    for (let n = +w[1]!; n <= +w[2]!; n++) ops.push({ op: 'insertNode', after: 'end', type: 'heading', text: `外景 胡同口 — 日 ${n}` }, { op: 'insertNode', after: 'end', type: 'action', text: `第 ${n} 场：${'豆豆在胡同里跑。'.repeat(40)}` });
    return `<ops>${JSON.stringify(ops)}</ops>`;
  }
  if (prompt.includes('检查这一集剧本')) return r({ issues: [] });
  if (prompt.includes('做简短调研')) return '1. 胡同里的孩子放学后在门口玩。2. 避开"许愿成真"的老套路。';
  if (prompt.includes('写 3 个故事走向')) return r({ items: [1, 2, 3].map((i) => ({ title: `走向${i}：门墩儿的秘密${i}`, conflict: `冲突来源${i}`, resolution: `解决方式${i}`, beats: ['起', '承', '转', '合'], joke: `笑点${i}` })) });
  if (prompt.includes('整理成可以复用的写作规则')) return r({ items: [{ text: '笑点要来自孩子的视角', scope: '全剧', level: 'hard', conflict: '' }, { text: '不要出现手机', scope: '全剧', level: 'pref', conflict: '' }] });
  if (prompt.includes('逐项检查剧本是否偏离')) {
    const id = prompt.match(/\[([a-z0-9]+)\] dialogue:/)?.[1] ?? null;
    return r({ summary: '有一处可能跑偏', items: [{ nodeId: id, quote: '石头', problem: '豆豆太快接受了石头会说话', suggestion: '加一拍怀疑' }] });
  }
  if (prompt.includes('搜索今天')) return '1. 北京胡同口新开了修鞋铺。2. 学校推广跳绳。';
  if (prompt.includes('筛出最多 5 个')) return r({ items: [{ title: '修鞋铺', logline: '门墩儿想修好姥爷的旧鞋', why: '贴近胡同生活' }, { title: '跳绳比赛', logline: '豆豆为跳绳比赛借来一双鞋', why: '学校题材' }, { title: '雨天', logline: '下雨天门墩儿怕冷', why: '季节' }] });
  return REPLY;
}

/** Prompts containing __SLOW__ stall before streaming, so the E2E can cancel a workflow mid-step. */
export const isSlow = (prompt: string) => prompt.includes('__SLOW__');

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
      const delay = isSlow(prompts.at(-1) ?? '') ? 2500 : 0;
      let t: NodeJS.Timeout | undefined;
      const go = () => { t = setInterval(() => {
        if (i < chunks.length) res.write(`data: ${JSON.stringify(ev(chunks[i++]!))}\n\n`);
        else { res.write(`data: ${JSON.stringify({ type: 'done', conversation_id: 'c1', message_id: 'm1', finish_reason: 'stop' })}\n\n`); res.end(); clearInterval(t); }
      }, 120); };
      const wait = setTimeout(go, delay);
      req.on('close', () => { clearTimeout(wait); clearInterval(t); });
      return;
    }
    if (req.method === 'POST' && url.endsWith('/interruption')) return json(204, {});
    if (req.method === 'POST' && url.startsWith('/api/v1/image-prompts')) { req.resume(); req.on('end', () => json(200, { prompt_en: 'a 9-year-old boy, round face, blue school uniform', prompt_local: '九岁男孩，圆脸，蓝色校服', local_lang: 'zh' })); return; }
    if (req.method === 'POST' && url.startsWith('/api/v1/text-selections/')) {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => { const t = JSON.parse(body).text; json(200, { content: url.endsWith('explanations') ? `解释：「${t}」是孩子的惊讶。` : url.endsWith('summaries') ? '总结' : 'Translation' }); });
      return;
    }
    json(404, { message: `no route ${req.method} ${url}` });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    const a = server.address();
    resolve({ url: `http://127.0.0.1:${typeof a === 'object' && a ? a.port : 0}`, server, prompts });
  }));
}
