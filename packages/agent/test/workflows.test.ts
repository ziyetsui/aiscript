import { ScriptDoc } from '@scripter/core';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { WORKFLOWS, confirm, execute, newRun, parseResult, recoverInterrupted, workflow, type WorkflowEnv } from '../src/index.ts';

function env(replies: (string | Error)[], over: Partial<WorkflowEnv> = {}) {
  const d = new ScriptDoc();
  const h = d.insert('end', 'heading', '外景 胡同口 — 傍晚');
  d.insert(h, 'action', '豆豆蹲在门墩儿旁边，用手指头戳石狮子的鼻子。'.repeat(20));
  const c = d.insert('end', 'character', '门墩儿');
  d.insert(c, 'dialogue', '别捏了。');
  d.bible('world').add({ title: '世界规则', value: '门墩儿只能借，不能变' });
  d.bible('rules').add({ text: '不写大人式的抖机灵', status: 'active', level: 'hard' });
  d.bible('jokes').add({ text: '踩香蕉皮摔倒', verdict: 'bad', mechanism: '滑稽摔跤' });
  d.commit();
  const queue = [...replies];
  const chat = vi.fn(async (_prompt: string, _opts: { webSearch?: boolean; signal: AbortSignal }) => {
    const r = queue.shift();
    if (r instanceof Error) throw r;
    return { text: r ?? '', citations: [{ url: 'https://example.com/a', title: '来源' }] };
  });
  const e: WorkflowEnv = {
    title: () => '门墩儿', nodes: () => d.nodes(), bible: () => d.readBible(), outline: () => '豆豆发现门墩儿会说话，两人约定保守秘密。',
    chat, parse: vi.fn(async () => '参考作品：小明 用 神奇口袋 帮朋友。'), transcribe: vi.fn(async () => ({ text: '你好', srt: '1\n00:00:00,000 --> 00:00:01,000\n你好\n' })),
    hotspots: vi.fn(async () => ({ items: [{ title: '北京修鞋铺', url: 'https://example.com/hot', sources: ['知乎'] }], failedSources: ['微博'], fetchedAt: 123 })),
    hasGemini: () => false, ...over,
  };
  return { e, d, chat };
}
const ac = () => new AbortController();
const res = (o: unknown) => `好的。<result>${JSON.stringify(o)}</result>`;
const DIRS = { items: [1, 2, 3].map((i) => ({ title: `走向${i}`, conflict: `冲突${i}`, resolution: `解决${i}`, beats: ['起', '承', '转', '合'], joke: `笑点${i}` })) };

describe('engine', () => {
  it('runs every step and produces a result; state is saved along the way', async () => {
    const { e, chat } = env(['调研要点', res(DIRS)]);
    const saves: string[] = [];
    const run = await execute(workflow('directions'), newRun(workflow('directions'), {}, 'r1'), e, ac().signal, (r) => saves.push(r.steps.map((s) => s.status[0]).join('')));
    expect(run.status).toBe('done');
    expect(run.result).toMatchObject({ kind: 'directions', items: [{ title: '走向1' }, {}, {}], citations: [{ url: 'https://example.com/a' }] });
    expect(chat.mock.calls[0]![1]).toMatchObject({ webSearch: true }); // research uses Ancher web search
    expect(String(chat.mock.calls[1]![0])).toContain('不写大人式的抖机灵'); // rules and negatives reach the prompt
    expect(String(chat.mock.calls[1]![0])).toContain('踩香蕉皮摔倒');
    expect(saves.at(-1)).toBe('dddd');
  });

  it('a failed step can be retried without redoing finished steps', async () => {
    const { e, chat } = env(['调研要点', new Error('网络断了'), res(DIRS)]);
    const def = workflow('directions');
    let run = await execute(def, newRun(def, { text: '门墩儿会说话' }, 'r2'), e, ac().signal, () => {});
    expect(run.status).toBe('failed');
    expect(run.steps.map((s) => s.status)).toEqual(['done', 'done', 'done', 'failed']);
    expect(run.error).toBe('网络断了');
    run = await execute(def, run, e, ac().signal, () => {});
    expect(run.status).toBe('done');
    expect(chat).toHaveBeenCalledTimes(3); // research was not repeated
  });

  it('cancelling stops the run and writes nothing', async () => {
    const c = ac();
    const { e } = env([], { chat: async () => { c.abort(); const err = new Error('aborted'); err.name = 'AbortError'; throw err; } });
    const run = await execute(workflow('topics'), newRun(workflow('topics'), {}, 'r3'), e, c.signal, () => {});
    expect(run.status).toBe('cancelled');
    expect(run.result).toBeUndefined();
    expect(run.steps[0]!.status).toBe('pending');
  });

  it('a run interrupted by quitting becomes retryable at the interrupted step', () => {
    const def = workflow('drift');
    const run = newRun(def, {}, 'r4');
    run.steps[0]!.status = 'done';
    run.steps[1]!.status = 'running';
    recoverInterrupted(run);
    expect(run.status).toBe('failed');
    expect(run.steps.map((s) => s.status)).toEqual(['done', 'failed', 'pending']);
  });

  it('parseResult accepts <result> or fenced JSON and rejects missing fields', () => {
    const S = z.object({ a: z.number() });
    expect(parseResult('x <result>{"a":1}</result>', S)).toEqual({ a: 1 });
    expect(parseResult('```json\n{"a":2}\n```', S)).toEqual({ a: 2 });
    expect(() => parseResult('no json here', S)).toThrow('约定格式');
    expect(() => parseResult('<result>{"b":1}</result>', S)).toThrow('缺少字段');
  });
});

describe('workflows', () => {
  it('has the eight §5.6 workflows on ⌥1–⌥8, plus the episode pipeline on ⌥9', () => {
    expect(WORKFLOWS.map((w) => [w.key, w.title])).toEqual([
      [1, '一个创意 → 3 个走向'], [2, '参考经典结构重写'], [3, '笑点方案'], [4, '写飘检查'],
      [5, '导演意见 → 规则'], [6, '控字数 / 时长'], [7, '视频 → 逐字稿'], [8, '今日热点选题'], [9, '一集剧本流水线'],
    ]);
  });

  it('⌥1 rejects three directions that share a conflict source', async () => {
    const same = { items: DIRS.items.map((x) => ({ ...x, conflict: '一样的冲突' })) };
    const { e } = env(['调研', res(same)]);
    const run = await execute(workflow('directions'), newRun(workflow('directions'), {}, 'x'), e, ac().signal, () => {});
    expect(run.status).toBe('failed');
    expect(run.error).toContain('冲突来源有重复');
  });

  it('⌥2 blocks a rewrite that borrows names from the reference', async () => {
    const beats = { beats: [{ beat: '想要', function: '愿望' }, { beat: '借道具', function: '帮手' }, { beat: '翻车', function: '失败' }], jokes: ['道具失控'], names: ['神奇口袋', '小明'] };
    const map = { map: [{ slot: '帮手', ours: '门墩儿' }] };
    const borrowing = '改好了。<ops>[{"op":"insertNode","type":"action","text":"门墩儿从神奇口袋里掏出一双鞋。"}]</ops>';
    const { e } = env([res(beats), res(map), borrowing]);
    const def = workflow('restructure');
    const run = await execute(def, newRun(def, { url: 'https://example.com/ep1' }, 'x'), e, ac().signal, () => {});
    expect(run.status).toBe('failed');
    expect(run.error).toContain('神奇口袋');
    expect(e.parse).toHaveBeenCalled();
  });

  it('⌥2 produces ops for the preview when the rewrite is original', async () => {
    const beats = { beats: [{ beat: '想要', function: '愿望' }, { beat: '借', function: '帮手' }, { beat: '翻车', function: '失败' }], jokes: [], names: ['小明'] };
    const { e } = env([res(beats), res({ map: [{ slot: '帮手', ours: '门墩儿' }] }), '<ops>[{"op":"insertNode","type":"action","text":"门墩儿借来一双旧球鞋。"}]</ops>']);
    const def = workflow('restructure');
    const run = await execute(def, newRun(def, { text: '一段参考剧本' }, 'x'), e, ac().signal, () => {});
    expect(run.status).toBe('done');
    expect(run.result).toMatchObject({ kind: 'ops', ops: [{ op: 'insertNode', text: '门墩儿借来一双旧球鞋。' }] });
  });

  it('⌥3 targets the focused line and flags a known unfunny joke', async () => {
    const { e, d } = env([res({ items: [{ text: '踩香蕉皮摔倒', mechanism: '摔', conflict: '' }, { text: 'a', mechanism: 'b' }, { text: 'c', mechanism: 'd' }] })]);
    const target = d.nodes().find((n) => n.type === 'dialogue')!;
    const run = await execute(workflow('jokes'), newRun(workflow('jokes'), { focusId: target.id }, 'x'), e, ac().signal, () => {});
    expect(run.result).toMatchObject({ kind: 'jokes', target: { id: target.id, text: '别捏了。' } });
    expect((run.result as { items: { conflict: string }[] }).items[0]!.conflict).toContain('不好笑');
  });

  it('⌥4 drops node ids the model invented', async () => {
    const replies: string[] = [];
    const { e, d } = env(replies);
    const real = d.nodes()[1]!.id;
    (e.chat as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ text: res({ summary: '有一处跑偏', items: [{ nodeId: 'made-up', quote: 'x', problem: 'p', suggestion: 's' }, { nodeId: real, quote: 'y', problem: 'p', suggestion: 's' }] }), citations: [] });
    const run = await execute(workflow('drift'), newRun(workflow('drift'), {}, 'x'), e, ac().signal, () => {});
    expect((run.result as { items: { nodeId: string | null }[] }).items.map((i) => i.nodeId)).toEqual([null, d.nodes()[1]!.id]);
  });

  it('⌥6 says so when the script is already within the target', async () => {
    const { e } = env([]);
    const run = await execute(workflow('length'), newRun(workflow('length'), { target: 99999 }, 'x'), e, ac().signal, () => {});
    expect(run.status).toBe('failed');
    expect(run.error).toContain('已经在目标');
  });

  it('⌥7 refuses unsupported files before uploading anything', async () => {
    const { e } = env([]);
    const run = await execute(workflow('transcribe'), newRun(workflow('transcribe'), { filePath: '/tmp/a.exe' }, 'x'), e, ac().signal, () => {});
    expect(run.error).toContain('不支持 .exe');
    expect(e.transcribe).not.toHaveBeenCalled();
  });

  it('⌥7 transcribes with Ancher when no Gemini key is set', async () => {
    const { e } = env([]);
    const run = await execute(workflow('transcribe'), newRun(workflow('transcribe'), { filePath: '/Users/x/第一集.mp4' }, 'x'), e, ac().signal, () => {});
    expect(run.result).toMatchObject({ kind: 'transcript', fileName: '第一集.mp4', provider: 'ancher', text: '你好' });
  });
});

describe('episode pipeline (spec §5.4)', () => {
  const story = { story: '豆豆想要一双会发光的鞋，门墩儿借来姥爷小时候的旧球鞋……', core: { theme: '旧东西里有爱', keyScenes: ['鞋底刻字被发现'], motives: ['豆豆：不想输给大壮'] } };
  const scenes = (n: number) => ({ scenes: Array.from({ length: n }, (_, i) => ({ heading: `外景 胡同口 — 日${i + 1}`, summary: `第${i + 1}场内容`, key: i === 5 })) });
  const batch = (from: number, to: number) => `<ops>[${Array.from({ length: to - from }, (_, k) => `{"op":"insertNode","type":"heading","text":"场${from + k + 1}"},{"op":"insertNode","type":"action","text":"${'豆豆跑过胡同。'.repeat(50)}"}`).join(',')}]</ops>`;

  it('pauses for the story and the scene list, uses the writer\'s edits, and ends in ops', async () => {
    const replies = ['调研', res(story), res(scenes(14)), ...[0, 3, 6, 9, 12].map((i) => batch(i, Math.min(i + 3, 14))), res({ issues: [{ problem: '重场戏偏短', suggestion: '加一拍' }] })];
    const { e, chat } = env(replies);
    const def = workflow('episode');
    let run = await execute(def, newRun(def, { text: '门墩儿借鞋' }, 'ep'), e, ac().signal, () => {});
    expect(run.status).toBe('waiting');
    expect(run.waiting).toMatchObject({ stepId: 'confirmStory', title: '确认故事和锁定核心' });
    expect(run.waiting!.text).toContain('【锁定核心】');
    confirm(run, `${run.waiting!.text}\n（作者补充：大壮最后也借到了鞋）`);
    run = await execute(def, run, e, ac().signal, () => {});
    expect(run.waiting?.stepId).toBe('confirmScenes');
    expect(run.waiting!.text.split('\n')).toHaveLength(14);
    expect(String(chat.mock.calls[2]![0])).toContain('作者补充'); // the edited story drives the scene list
    const edited = run.waiting!.text.split('\n').slice(0, 13).join('\n'); // writer drops the last scene
    confirm(run, edited);
    run = await execute(def, run, e, ac().signal, () => {});
    expect(run.status).toBe('done');
    expect(run.steps.every((s) => s.status === 'done')).toBe(true);
    const r = run.result as { kind: string; ops: { op: string; text?: string; after?: string }[]; narration: string };
    expect(r.kind).toBe('ops');
    expect(r.ops.filter((o) => o.op === 'insertNode').every((o) => o.after === 'end')).toBe(true);
    expect(r.narration).toContain('13 场');
    expect(r.narration).toContain('重场戏偏短');
    expect(chat).toHaveBeenCalledTimes(3 + 5 + 1);
  });

  it('rejects a scene list outside 13–17 scenes', async () => {
    const { e } = env(['调研', res(story), res(scenes(8))]);
    const def = workflow('episode');
    const run = await execute(def, newRun(def, { text: 'x' }, 'ep2'), e, ac().signal, () => {});
    confirm(run, run.waiting!.text);
    const r2 = await execute(def, run, e, ac().signal, () => {});
    expect(r2.status).toBe('failed');
    expect(r2.error).toContain('8 场');
  });

  it('a failed writing batch resumes without rewriting earlier scenes', async () => {
    const { e, chat } = env(['调研', res(story), res(scenes(13)), batch(0, 3), new Error('网络断了'), batch(3, 6), batch(6, 9), batch(9, 12), batch(12, 13), res({ issues: [] })]);
    const def = workflow('episode');
    let run = await execute(def, newRun(def, { text: 'x', minutes: 10 }, 'ep3'), e, ac().signal, () => {});
    confirm(run, run.waiting!.text); run = await execute(def, run, e, ac().signal, () => {});
    confirm(run, run.waiting!.text); run = await execute(def, run, e, ac().signal, () => {});
    expect(run.status).toBe('failed');
    expect(run.error).toBe('网络断了');
    run = await execute(def, run, e, ac().signal, () => {});
    expect(run.status).toBe('done');
    const heads = (run.result as { ops: { op: string; type?: string; text?: string }[] }).ops.filter((o) => o.type === 'heading').map((o) => o.text);
    expect(heads).toEqual(Array.from({ length: 13 }, (_, i) => `场${i + 1}`)); // no duplicates of 1–3
    expect(chat).toHaveBeenCalledTimes(3 + 6 + 1);
  });
});


describe('NewsNow topics workflow', () => {
  it('grounds brief links in MCP input and uses the existing model without web search', async () => {
    const { e, chat } = env([res({ brief: [{ headline: '修鞋铺', summary: '胡同生活', sourceIndexes: [0] }] }), res({ items: [{ title: '修鞋铺', logline: '门墩儿修鞋', why: '贴近生活' }] })]);
    const run = await execute(workflow('topics'), newRun(workflow('topics'), {}, 'news'), e, ac().signal, () => {});
    expect(run.status).toBe('done');
    expect(run.result).toMatchObject({ kind: 'topics', brief: [{ headline: '修鞋铺', citations: [{ url: 'https://example.com/hot' }] }], sourceWarning: '未获取到：微博', fetchedAt: 123 });
    expect(chat.mock.calls[0]![0]).toContain('北京修鞋铺');
    expect(chat.mock.calls.every(([, opts]) => opts.webSearch === false)).toBe(true);
    expect(e.hotspots).toHaveBeenCalledTimes(1);
  });
  it('rejects invented source indexes and does not proceed to pick', async () => {
    const { e, chat } = env([res({ brief: [{ headline: '假热点', summary: '假', sourceIndexes: [99] }] })]);
    const run = await execute(workflow('topics'), newRun(workflow('topics'), {}, 'news'), e, ac().signal, () => {});
    expect(run.status).toBe('failed'); expect(run.error).toContain('来源索引');
    expect(chat).toHaveBeenCalledTimes(1);
  });
  it('does not invent topics when none are appropriate and retries pick without fetching again', async () => {
    const { e } = env([res({ brief: [{ headline: '修鞋铺', summary: '胡同生活', sourceIndexes: [0] }] }), new Error('网络断了'), res({ items: [] })]);
    const def = workflow('topics'), run = newRun(def, {}, 'news');
    await execute(def, run, e, ac().signal, () => {}); expect(run.status).toBe('failed');
    await execute(def, run, e, ac().signal, () => {}); expect(run.status).toBe('done');
    expect(run.result).toMatchObject({ items: [] }); expect(e.hotspots).toHaveBeenCalledTimes(1);
  });
  it('does not call the model when the MCP provider fails', async () => {
    const { e, chat } = env([], { hotspots: async () => { throw new Error('NewsNow 暂时不可用'); } });
    const run = await execute(workflow('topics'), newRun(workflow('topics'), {}, 'news'), e, ac().signal, () => {});
    expect(run.status).toBe('failed'); expect(chat).not.toHaveBeenCalled();
  });
  it('rejects embedded fabricated Markdown links even when source indexes are valid', async () => {
    const { e, chat } = env([res({ brief: [{ headline: '修鞋铺', summary: '[来源](https://invented.example)', sourceIndexes: [0] }] })]);
    const run = await execute(workflow('topics'), newRun(workflow('topics'), {}, 'news'), e, ac().signal, () => {});
    expect(run.status).toBe('failed'); expect(run.result).toBeUndefined(); expect(chat).toHaveBeenCalledTimes(1);
  });

});
