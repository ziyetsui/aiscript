// Serializable desktop workflow view models; execution lives in the main-only Mastra runtime.
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
  | { kind: 'transcript'; fileName: string; text: string; srt: string; provider: string; title?: string; summary?: string }
  | { kind: 'topics'; items: { title: string; logline: string; why: string }[]; citations: { url: string; title: string }[]; brief?: { headline: string; summary: string; citations: { url: string; title: string }[] }[]; sourceWarning?: string; fetchedAt?: number };

export interface WorkflowInput { text?: string; url?: string; filePath?: string; focusId?: string; target?: number; provider?: 'gemini' | 'ancher'; minutes?: number; browser?: 'chrome' | 'safari' | 'edge' | 'firefox' }

export interface RunState {
  id: string;
  wf: WorkflowId;
  status: RunStatus;
  input: WorkflowInput;
  steps: StepState[];
  /** Intermediate values carried between steps (JSON-serialisable, persisted). */
  ctx: Record<string, unknown>;
  /** Native Mastra snapshot, persisted with the project; never sent to the renderer. */
  mastra?: { version: 1; snapshot: unknown };
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
  youtube?(url: string, signal: AbortSignal): Promise<{ text: string; srt: string; fileName: string; provider: string }>;
  hotspots(signal: AbortSignal): Promise<NewsNowDigest>;
  hasGemini(): boolean;
  /** Persist partial progress inside a long step (for example each three-scene batch). */
  checkpoint?(): void;
}

export type WorkflowId = 'directions' | 'restructure' | 'jokes' | 'drift' | 'notes' | 'length' | 'transcribe' | 'youtube' | 'topics' | 'episode';

export type StepOutcome = void | { note?: string; skip?: boolean; wait?: { title: string; text: string; hint: string } };
/** A step may pause the run for the writer; it is re-run after they confirm, with ctx[`confirmed:${id}`] set. */
export interface StepDef { id: string; label: string; run(ctx: Record<string, unknown>, env: WorkflowEnv, input: WorkflowInput, signal: AbortSignal): Promise<StepOutcome> }
export interface WorkflowDef {
  id: WorkflowId;
  key: number; // ⌥1–⌥8
  title: string;
  desc: string;
  input: 'none' | 'text' | 'url-or-text' | 'url' | 'file' | 'focus' | 'target';
  inputHint?: string;
  steps: StepDef[];
  finish(ctx: Record<string, unknown>, input: WorkflowInput): WorkflowResult;
}

export class Cancelled extends Error { constructor() { super('已取消'); this.name = 'Cancelled'; } }

export function newRun(def: WorkflowDef, input: WorkflowInput, id: string): RunState {
  return { id, wf: def.id, status: 'running', input, steps: def.steps.map((s) => ({ id: s.id, label: s.label, status: 'pending' })), ctx: {}, startedAt: Date.now() };
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

/** Distinguish syntax/format errors from schema errors and transport failures. */
export class ResultFormatError extends Error {}

/** Models answer inside <result>…</result>; anything else is narration. Bad JSON fails the step (retryable). */
export function parseResult<T>(text: string, schema: z.ZodType<T>): T {
  const m = text.match(/<result>([\s\S]*?)<\/result>/);
  const raw = (m?.[1] ?? text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? '').trim();
  if (!raw) throw new ResultFormatError('AI 没有按约定格式返回结果，请重试');
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ResultFormatError('AI 返回的结果不是合法 JSON，请重试');
  }
  const r = schema.safeParse(json);
  if (!r.success) throw new Error(`AI 返回的结果缺少字段：${r.error.issues.slice(0, 2).map((i) => i.path.join('.')).join('、')}`);
  return r.data;
}
