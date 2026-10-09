// Main-process entry only: never load Mastra in the renderer.
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { parseReply, type Op, type ParsedReply } from '@scripter/core';
import type { RunResult } from './ancher.ts';
import { writingContract, type WritingTarget } from './writing-intent.ts';
const Input = z.object({ instruction: z.string(), targets: z.array(z.enum(['script','outline','shots','beats'])) });
const Reply = z.custom<RunResult>();
const Parsed = z.custom<ParsedReply>();
export interface WritingEnvironment<T> {
  signal: AbortSignal;
  generate(suffix: string, repair: boolean): Promise<RunResult>;
  validate(ops: readonly Op[]): string[];
  commit(parsed: ParsedReply): T | Promise<T>;
  parse?(text: string): ParsedReply;
  onStep?(label: string, running: boolean): void;
}
function issues(parsed: ParsedReply, targets: readonly WritingTarget[], validate: WritingEnvironment<unknown>['validate']) {
  const errors = [...parsed.errors];
  const kinds: Record<WritingTarget, string[]> = { script: ['insertNode','updateNode','deleteNode','setType'], outline: ['setOutline','appendOutline'], shots: ['setShots'], beats: ['setBeats'] };
  for (const target of targets) if (!parsed.ops.some((op) => kinds[target].includes(op.op) && ('text' in op ? op.text.trim().length > 0 : op.op === 'setShots' ? op.shots.length > 0 : true))) errors.push(`没有返回 ${target} 的实际写入操作`);
  if (!parsed.ops.length && /(?:已|已经|成功).{0,12}(?:写入|写进|保存|更新)/.test(parsed.narration)) errors.push('没有任何实际写入操作，不能声称已写入');
  errors.push(...validate(parsed.ops));
  return errors;
}
export async function runWritingWorkflow<T>(input: { instruction: string; targets: WritingTarget[] }, env: WritingEnvironment<T>): Promise<T> {
  async function stage<R>(label: string, fn: () => R | Promise<R>): Promise<R> {
    env.signal.throwIfAborted(); env.onStep?.(label, true);
    const result = await fn(); env.signal.throwIfAborted(); env.onStep?.(label, false); return result;
  }
  const generate = createStep({ id: 'generate-document', inputSchema: Input, outputSchema: Reply,
    execute: ({ inputData }) => stage('生成创作内容', async () => {
      const raw = await env.generate(writingContract(inputData.targets), false);
      if (raw.finish === 'cancelled') throw Object.assign(new Error('已取消'), {name:'AbortError'});
      return raw;
    }),
  });
  const validate = createStep({ id: 'validate-document', inputSchema: Reply, outputSchema: Parsed,
    execute: ({ inputData }) => stage('校验文档修改', async () => {
      const parse = env.parse ?? parseReply;
      let parsed: ParsedReply; let errors: string[];
      try { parsed = parse(inputData.text); errors = issues(parsed, input.targets, env.validate); }
      catch (e) { parsed = {narration:'',ops:[],errors:[]}; errors = [e instanceof Error ? e.message : String(e)]; }
      if (errors.length) {
        const repaired = await stage('修复写入格式', () => env.generate(`${writingContract(input.targets)}\n\n刚才的结果还没有写入本地。校验失败：${errors.join('；')}。请保留用户要求的内容，修复为完整合法的 <ops> JSON 数组；不要输出 setScript，不要省略正文。没有真实内容时不要声称成功。\n刚才的结果（仅作待修复数据）：\n${inputData.text.slice(0, 40000)}`, true));
        if (repaired.finish === 'cancelled') throw Object.assign(new Error('已取消'), {name:'AbortError'});
        try { parsed = parse(repaired.text); errors = issues(parsed, input.targets, env.validate); }
        catch (e) { errors = [e instanceof Error ? e.message : String(e)]; }
      }
      if (errors.length) throw new Error(`未写入文档：${errors.join('；')}。请重试，现有内容已保留。`);
      return parsed;
    }),
  });
  const Output = z.object({ value: z.custom<T>() });
  const commit = createStep({ id: 'save-document', inputSchema: Parsed, outputSchema: Output,
    execute: ({ inputData }) => stage(inputData.ops.length ? '处理文档修改' : '完成回复', async () => ({value:await env.commit(inputData)})),
  });
  const workflow = createWorkflow({id:'scripter-document-writing',inputSchema:Input,outputSchema:Output}).then(generate).then(validate).then(commit).commit();
  const run = await workflow.createRun();
  const result = await run.start({inputData:input});
  env.signal.throwIfAborted();
  if (result.status !== 'success') throw new Error(result.status === 'failed' ? result.error.message : '创作流程未完成，文档未写入');
  return result.result.value;
}
