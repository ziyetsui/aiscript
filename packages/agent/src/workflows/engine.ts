// Pain-point workflows (spec 0002 §5.6): plain TypeScript state machines, no Mastra yet (§0).
// Each run is a list of steps; state is persisted after every step, so a run can be cancelled,
// a failed step retried, and a run interrupted by quitting resumes from where it stopped.
// Nothing is written to the script by a run: it ends in a result the writer chooses to apply.
import type { Bible, Op, ScriptNode } from '@scripter/core';
import { z } from 'zod';
import type { NewsNowDigest } from '../newsnow.ts';

export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped' | 'waiting';
export type RunStatus = 'running' | 'waiting' | 'done' | 'failed' | 'cancelled';

export interface StepState { id: string; label: string; status: StepStatus; error?: string; note?: string }

export type WorkflowResult =
  | { kind: 'directions'; items: { title: string; conflict: string; resolution: string; beats: string[]; joke: string }[]; citations: { url: string; title: string }[] }
  | { kind: 'ops'; narration: string; ops: Op[] }
  | { kind: 'jokes'; target: { id: string; text: string } | null; items: { text: string; mechanism: string; conflict: string }[] }
  | { kind: 'issues'; items: { nodeId: string | null; quote: string; problem: string; suggestion: string }[]; summary: string }
  | { kind: 'rules'; items: { text: string; scope: string; level: 'hard' | 'pref'; conflict: string }[]; source: string }
  | { kind: 'transcript'; fileName: string; text: string; srt: string; provider: string }
  | { kind: 'topics'; items: { title: string; logline: string; why: string }[]; citations: { url: string; title: string }[]; brief?: { headline: string; summary: string; citations: { url: string; title: string }[] }[]; sourceWarning?: string; fetchedAt?: number };

export interface WorkflowInput { text?: string; url?: string; filePath?: string; focusId?: string; target?: number; provider?: 'gemini' | 'ancher'; minutes?: number }

export interface RunState {
  id: string;
  wf: WorkflowId;
  status: RunStatus;
  input: WorkflowInput;
  steps: StepState[];
  /** Intermediate values carried between steps (JSON-serialisable, persisted). */
  ctx: Record<string, unknown>;
  result?: WorkflowResult;
  /** Set while the run is paused for the writer (spec §5.4 "人工确认 suspend"). */
  waiting?: { stepId: string; title: string; text: string; hint: string };
  /** What the writer did with the result. */
  applied?: string;
  error?: string;
  startedAt: number;
  endedAt?: number;
}

/** What a workflow may touch. Everything is local except `hotspots` (NewsNow MCP), `chat` (Ancher) and `transcribe` / `parse` (Ancher or Gemini). */
export interface WorkflowEnv {
  title(): string;
  nodes(): ScriptNode[];
  bible(): Bible;
  outline(): string;
  chat(prompt: string, opts: { webSearch?: boolean; signal: AbortSignal }): Promise<{ text: string; citations: { url: string; title: string }[] }>;
  /** Turn a URL / file into text with Ancher's parser (notes). */
  parse(src: { url?: string; filePath?: string }, signal: AbortSignal): Promise<string>;
  transcribe(filePath: string, provider: 'gemini' | 'ancher', signal: AbortSignal): Promise<{ text: string; srt: string }>;
  hotspots(signal: AbortSignal): Promise<NewsNowDigest>;
  hasGemini(): boolean;
}

export type WorkflowId = 'directions' | 'restructure' | 'jokes' | 'drift' | 'notes' | 'length' | 'transcribe' | 'topics' | 'episode';

export type StepOutcome = void | { note?: string; skip?: boolean; wait?: { title: string; text: string; hint: string } };
/** A step may pause the run for the writer; it is re-run after they confirm, with ctx[`confirmed:${id}`] set. */
export interface StepDef { id: string; label: string; run(ctx: Record<string, unknown>, env: WorkflowEnv, input: WorkflowInput, signal: AbortSignal): Promise<StepOutcome> }
export interface WorkflowDef {
  id: WorkflowId;
  key: number; // ⌥1–⌥8
  title: string;
  desc: string;
  input: 'none' | 'text' | 'url-or-text' | 'file' | 'focus' | 'target';
  inputHint?: string;
  steps: StepDef[];
  finish(ctx: Record<string, unknown>, input: WorkflowInput): WorkflowResult;
}

export class Cancelled extends Error { constructor() { super('已取消'); this.name = 'Cancelled'; } }

export function newRun(def: WorkflowDef, input: WorkflowInput, id: string): RunState {
  return { id, wf: def.id, status: 'running', input, steps: def.steps.map((s) => ({ id: s.id, label: s.label, status: 'pending' })), ctx: {}, startedAt: Date.now() };
}

/** Run (or resume) from the first step that isn't done. `save` is called after every state change. */
export async function execute(def: WorkflowDef, run: RunState, env: WorkflowEnv, signal: AbortSignal, save: (r: RunState) => void): Promise<RunState> {
  run.status = 'running';
  run.error = undefined;
  run.waiting = undefined;
  for (const st of run.steps) if (st.status === 'failed' || st.status === 'running' || st.status === 'waiting') { st.status = 'pending'; st.error = undefined; }
  save(run);
  for (let i = 0; i < def.steps.length; i++) {
    const st = run.steps[i]!;
    if (st.status === 'done' || st.status === 'skipped') continue;
    if (signal.aborted) return finishCancelled(run, save);
    st.status = 'running';
    save(run);
    try {
      const r = await def.steps[i]!.run(run.ctx, env, run.input, signal);
      if (signal.aborted) return finishCancelled(run, save);
      if (r?.wait) {
        st.status = 'waiting';
        run.status = 'waiting';
        run.waiting = { stepId: st.id, ...r.wait };
        save(run);
        return run;
      }
      st.status = r?.skip ? 'skipped' : 'done';
      if (r?.note) st.note = r.note;
      save(run);
    } catch (e) {
      if (signal.aborted || e instanceof Cancelled || (e instanceof Error && e.name === 'AbortError')) return finishCancelled(run, save);
      st.status = 'failed';
      st.error = e instanceof Error ? e.message : String(e);
      run.status = 'failed';
      run.error = st.error;
      run.endedAt = Date.now();
      save(run);
      return run;
    }
  }
  try {
    run.result = def.finish(run.ctx, run.input);
    run.status = 'done';
  } catch (e) {
    run.status = 'failed';
    run.error = e instanceof Error ? e.message : String(e);
  }
  run.endedAt = Date.now();
  save(run);
  return run;
}

function finishCancelled(run: RunState, save: (r: RunState) => void): RunState {
  for (const st of run.steps) if (st.status === 'running') st.status = 'pending';
  run.status = 'cancelled';
  run.endedAt = Date.now();
  save(run);
  return run;
}

/** The writer confirmed (and possibly edited) what a waiting step showed; `execute` again to continue. */
export function confirm(run: RunState, text: string): RunState {
  if (run.status !== 'waiting' || !run.waiting) throw new Error('这个流程没有在等确认');
  run.ctx[`confirmed:${run.waiting.stepId}`] = text;
  run.waiting = undefined;
  return run;
}

/** Runs left "running" by a quit become failed at that step, so the writer can retry from there. */
export function recoverInterrupted(run: RunState): RunState {
  if (run.status !== 'running') return run;
  const st = run.steps.find((s) => s.status === 'running') ?? run.steps.find((s) => s.status === 'pending');
  if (st) { st.status = 'failed'; st.error = '应用退出时中断，点「重试」从这一步继续'; }
  run.status = 'failed';
  run.error = st?.error;
  return run;
}

/** Models answer inside <result>…</result>; anything else is narration. Bad JSON fails the step (retryable). */
export function parseResult<T>(text: string, schema: z.ZodType<T>): T {
  const m = text.match(/<result>([\s\S]*?)<\/result>/);
  const raw = (m?.[1] ?? text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? '').trim();
  if (!raw) throw new Error('AI 没有按约定格式返回结果，请重试');
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('AI 返回的结果不是合法 JSON，请重试');
  }
  const r = schema.safeParse(json);
  if (!r.success) throw new Error(`AI 返回的结果缺少字段：${r.error.issues.slice(0, 2).map((i) => i.path.join('.')).join('、')}`);
  return r.data;
}
