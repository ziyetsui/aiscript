// Workflow runs (spec 0002 §5.6): started from the chat, persisted with the project after every step,
// cancellable, retryable from the failed step, and recovered after a quit. Results are only applied
// by an explicit choice; rewrites go through the modification preview.
import type { WebContents } from 'electron';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, openAsBlob, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { confirm, execute, mimeFor, newRun, parseWithAncher, runChat, transcribeWithGemini, workflow, type RunState, type WorkflowEnv, type WorkflowId, type WorkflowInput } from '@scripter/agent';
import { ancher, propose } from './ai.ts';
import { filePath, filesDir, get, pushChat, saveNow, state } from './projects.ts';
import { getSecret } from './secrets.ts';
import type { ProjectState, WorkflowAction } from '../shared/ipc.ts';

type Open = ReturnType<typeof get>;
const live = new Map<string, AbortController>();
let sender: WebContents | null = null;

const runsOf = (p: Open): RunState[] => {
  const m = p.meta as { workflows?: RunState[] };
  if (!m.workflows) m.workflows = [];
  return m.workflows;
};

function emit(projectId: string, run: RunState): void {
  if (sender && !sender.isDestroyed()) sender.send('wf:update', { projectId, run: publicRun(run) });
}

/** ctx can hold large intermediate text; the renderer only needs steps and the result. */
export const publicRun = (r: RunState): RunState => ({ ...r, ctx: {} });

async function fileBlob(path: string): Promise<File> {
  return new File([await openAsBlob(path)], basename(path), { type: mimeFor(path) });
}

function envFor(p: Open, run: RunState): WorkflowEnv {
  const key = () => {
    const k = getSecret('ancher');
    if (!k) throw new Error('需要先在设置里填写 Ancher key');
    return k;
  };
  return {
    title: () => p.meta.title,
    nodes: () => p.doc.nodes(),
    bible: () => p.doc.readBible(),
    outline: () => p.doc.outline,
    hasGemini: () => !!getSecret('gemini'),
    // One Ancher conversation per run, separate from the writing chat.
    async chat(prompt, { webSearch, signal }) {
      const r = await runChat(ancher(key()), { conversationId: (run.ctx.conversationId as string | undefined) ?? null, content: prompt, webSearch, signal });
      run.ctx.conversationId = r.conversationId;
      if (r.finish === 'cancelled') throw Object.assign(new Error('已取消'), { name: 'AbortError' });
      return { text: r.text, citations: r.citations.map(({ url, title }) => ({ url, title })) };
    },
    async parse(src, signal) {
      return parseWithAncher(ancher(key()), src.url ? { url: src.url } : { file: await fileBlob(src.filePath!) }, signal);
    },
    async transcribe(path, provider, signal) {
      if (provider === 'gemini') {
        const g = getSecret('gemini');
        if (!g) throw new Error('还没有填写 Gemini key');
        return transcribeWithGemini(g, await fileBlob(path), basename(path), signal);
      }
      const text = await parseWithAncher(ancher(key()), { file: await fileBlob(path) }, signal);
      return { text, srt: '' };
    },
  };
}

function launch(p: Open, run: RunState): void {
  const ac = new AbortController();
  live.set(run.id, ac);
  const save = (r: RunState) => { saveNow(p); emit(p.meta.id, r); };
  void execute(workflow(run.wf), run, envFor(p, run), ac.signal, save).then((r) => {
    live.delete(run.id);
    if (r.status === 'done' && r.result?.kind === 'transcript') saveTranscript(p, r);
    save(r);
  });
}

/** ⌥7 lands its result in the knowledge base automatically (spec §5.6 "逐字稿存入项目"). */
function saveTranscript(p: Open, run: RunState): void {
  const r = run.result;
  if (r?.kind !== 'transcript') return;
  mkdirSync(filesDir(p.meta.id), { recursive: true });
  const base = r.fileName.replace(/\.[^.]+$/, '');
  const files: [string, string][] = [[`${base} 逐字稿.txt`, r.text]];
  if (r.srt) files.push([`${base}.srt`, r.srt]);
  for (const [name, content] of files) {
    const file = `${randomBytes(8).toString('hex')}.${name.split('.').pop()}`;
    writeFileSync(filePath(p.meta.id, file), content, 'utf8');
    p.doc.bible('files').add({ name, size: Buffer.byteLength(content), src: 'chat', file, addedAt: Date.now() });
  }
  p.doc.commit('transcript');
  run.applied = `已存进知识库：${files.map(([n]) => n).join('、')}`;
}

export function start(projectId: string, wf: WorkflowId, input: WorkflowInput, from: WebContents): ProjectState {
  sender = from;
  const p = get(projectId);
  workflow(wf); // throws on unknown ids
  const run = newRun(workflow(wf), input, randomUUID());
  run.ctx.episodeId = p.doc.activeEpisodeId;
  runsOf(p).push(run);
  if (runsOf(p).length > 60) runsOf(p).splice(0, runsOf(p).length - 60);
  pushChat(p, { id: randomUUID(), role: 'ai', text: '', at: Date.now(), runId: run.id });
  saveNow(p);
  launch(p, run);
  return state(p);
}

export function cancel(runId: string, projectId?: string): void {
  if (live.has(runId)) { live.get(runId)!.abort(); return; }
  // A run paused for confirmation isn't executing; cancelling just closes it.
  if (!projectId) return;
  const p = get(projectId);
  const run = runsOf(p).find((r) => r.id === runId);
  if (run && (run.ctx.episodeId ?? 'first') !== p.doc.activeEpisodeId) throw new Error('请切回此工作流所属的分集后再操作');
  if (run?.status === 'waiting') {
    run.status = 'cancelled';
    run.waiting = undefined;
    for (const st of run.steps) if (st.status === 'waiting') st.status = 'pending';
    run.endedAt = Date.now();
    saveNow(p);
    emit(projectId, run);
  }
}

/** The writer confirmed (and maybe edited) a paused step. Confirming the episode story also lands it in the outline and world. */
export function confirmStep(projectId: string, runId: string, text: string, from: WebContents): ProjectState {
  sender = from;
  const p = get(projectId);
  const run = runsOf(p).find((r) => r.id === runId);
  if (run && (run.ctx.episodeId ?? 'first') !== p.doc.activeEpisodeId) throw new Error('请切回此工作流所属的分集后再操作');
  if (!run || run.status !== 'waiting' || !run.waiting) return state(p);
  const stepId = run.waiting.stepId;
  confirm(run, text);
  if (run.wf === 'episode' && stepId === 'confirmStory') {
    const [story = '', core = ''] = text.split('【锁定核心】');
    const cur = p.doc.outline.trim();
    p.doc.setOutline(cur ? `${cur}\n\n【故事】\n${story.trim()}` : `【故事】\n${story.trim()}`);
    if (core.trim()) {
      const w = p.doc.bible('world');
      const hit = w.all().find((x) => x.title === '锁定核心');
      if (hit) w.update(hit.id, { value: core.trim() }); else w.add({ title: '锁定核心', value: core.trim() });
    }
    p.doc.commit('episode: story confirmed');
  }
  saveNow(p);
  launch(p, run);
  return state(p);
}

export function retry(projectId: string, runId: string, from: WebContents): ProjectState {
  sender = from;
  const p = get(projectId);
  const run = runsOf(p).find((r) => r.id === runId);
  if (run && (run.ctx.episodeId ?? 'first') !== p.doc.activeEpisodeId) throw new Error('请切回此工作流所属的分集后再操作');
  if (run && !live.has(runId) && (run.status === 'failed' || run.status === 'cancelled')) launch(p, run);
  return state(p);
}

/** Apply a finished run's result the way the writer chose. Returns a message for the toast. */
export function apply(projectId: string, runId: string, a: WorkflowAction): { ok: boolean; message: string; state: ProjectState } {
  const p = get(projectId);
  const run = runsOf(p).find((r) => r.id === runId);
  if (run && (run.ctx.episodeId ?? 'first') !== p.doc.activeEpisodeId) throw new Error('请切回此工作流所属的分集后再操作');
  const r = run?.result;
  const done = (message: string, ok = true) => { if (ok && run) run.applied = message; saveNow(p); if (run) emit(projectId, run); return { ok, message, state: state(p) }; };
  if (!run || !r) return done('这个工作流还没有结果', false);
  switch (a.type) {
    case 'direction': {
      if (r.kind !== 'directions') break;
      const d = r.items[a.index];
      if (!d) break;
      const block = `【走向】${d.title}\n冲突：${d.conflict}\n解决：${d.resolution}\n${d.beats.map((b, i) => `${['起', '承', '转', '合'][i] ?? i + 1}：${b}`).join('\n')}${d.joke ? `\n主笑点：${d.joke}` : ''}`;
      const cur = p.doc.outline.trim();
      p.doc.setOutline(cur ? `${cur}\n\n${block}` : block);
      p.doc.commit('outline: direction');
      return done(`已写进大纲：${d.title}`);
    }
    case 'preview': {
      if (r.kind !== 'ops') break;
      propose(p, r.ops, r.narration || `${workflow(run.wf).title}：确认后写入`, workflow(run.wf).title);
      return done('已生成修改预览，确认后写入');
    }
    case 'joke': {
      if (r.kind !== 'jokes' || !r.target) break;
      const j = r.items[a.index];
      if (!j) break;
      if (a.verdict) {
        p.doc.bible('jokes').add({ text: j.text, mechanism: j.mechanism, verdict: a.verdict, context: r.target.text, addedAt: Date.now() });
        p.doc.commit('joke verdict');
        saveNow(p);
        return { ok: true, message: a.verdict === 'good' ? '已记为「好笑」' : '已记为「不好笑」，以后会避开', state: state(p) };
      }
      propose(p, [{ op: 'updateNode', id: r.target.id, text: j.text }], `笑点方案：${j.mechanism}`, '笑点方案');
      return done('已生成修改预览，确认后写入');
    }
    case 'rules': {
      if (r.kind !== 'rules') break;
      const picked = a.indexes.map((i) => r.items[i]).filter(Boolean);
      for (const x of picked) p.doc.bible('rules').add({ text: x!.text, scope: x!.scope, level: x!.level, source: r.source, status: 'active', addedAt: Date.now() });
      p.doc.commit('rules');
      return done(`已加入规则库 ${picked.length} 条，之后写作都会遵守`);
    }
    case 'topics': {
      if (r.kind !== 'topics') break;
      const picked = a.indexes.map((i) => r.items[i]).filter(Boolean);
      for (const x of picked) p.doc.bible('topics').add({ title: x!.title, logline: x!.logline, why: x!.why, source: r.citations.map((c) => c.url).join(' '), status: 'idea', addedAt: Date.now() });
      p.doc.commit('topics');
      return done(`已加入选题池 ${picked.length} 个`);
    }
  }
  return done('无法应用这个结果', false);
}
