// Main-process only. Mastra owns ordering, suspension and resumption; the desktop
// RunState is a UI projection and a durable store for the native workflow snapshot.
import { Mastra } from '@mastra/core/mastra';
import { InMemoryStore } from '@mastra/core/storage';
import { createStep, createWorkflow, type WorkflowRunState } from '@mastra/core/workflows';
import { z } from 'zod';
import { Cancelled, type RunState, type WorkflowDef, type WorkflowEnv, type WorkflowResult } from './engine.ts';
import { WORKFLOW_SKILLS } from '../skills/catalog.ts';
import { skillContext } from '../skills/runtime.ts';

// Snapshot data here contains only workflow JSON, not SDK objects. Error messages
// must survive JSON persistence too (JSON.stringify(Error) alone loses them).
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x, (_k, v) => v instanceof Error ? {name:v.name,message:v.message,stack:v.stack} : v));
const Frame = z.object({ ctx: z.record(z.string(), z.unknown()) });
const Resume = z.object({ text: z.string() });
const Output = z.object({result:z.custom<WorkflowResult>()});

export async function execute(def: WorkflowDef, run: RunState, environment: WorkflowEnv, signal: AbortSignal, save: (r: RunState) => void): Promise<RunState> {
  if (run.status === 'done') return run;
  const paused = run.steps.find(s => s.status === 'waiting');
  const snapshot = run.mastra?.snapshot as WorkflowRunState | undefined;
  const craft = skillContext(WORKFLOW_SKILLS[def.id] ?? []);
  const env: WorkflowEnv = { ...environment,
    checkpoint: () => save(run),
    chat: async (prompt, opts) => { const r = await environment.chat(`${craft}\n\n${prompt}`, opts); save(run); return r; },
  };
  // Only the cache is in memory. Every native snapshot is synchronously persisted
  // through the project's existing atomic save; a fresh cache is hydrated on each invocation.
  const storage = new InMemoryStore({id:`project-workflow-${run.id}`});
  const domain = (await storage.getStore('workflows'))!;
  const persist = domain.persistWorkflowSnapshot.bind(domain);
  const name = `scripter-${def.id}`;
  if (snapshot) await persist({workflowName:name,runId:run.id,snapshot:clone(snapshot)});
  domain.persistWorkflowSnapshot = async args => {
    await persist(args);
    run.mastra = {version:1,snapshot:clone(args.snapshot)};
    save(run);
  };
  run.status = 'running'; run.error = undefined; run.waiting = undefined; run.endedAt = undefined;
  for (const st of run.steps) if (['failed','running','waiting'].includes(st.status)) {st.status='pending';st.error=undefined;}
  save(run);
  const flow = createWorkflow({id:name,inputSchema:Frame,outputSchema:Output,retryConfig:{attempts:0,delay:0},options:{shouldPersistSnapshot:()=>true,autoRestartActiveRuns:false}});
  for (const step of def.steps) {
    flow.then(createStep({id:step.id,inputSchema:Frame,outputSchema:Frame,resumeSchema:Resume,
      execute: async ({resumeData,suspend}) => {
        const st = run.steps.find(s=>s.id===step.id)!;
        // Import old state-machine records without repeating completed remote calls.
        if (st.status==='done' || st.status==='skipped') return {ctx:clone(run.ctx)};
        signal.throwIfAborted(); st.status='running';save(run);
        if (resumeData) run.ctx[`confirmed:${step.id}`]=resumeData.text;
        try {
          const outcome = await step.run(run.ctx,env,run.input,signal);
          signal.throwIfAborted();
          if (outcome?.wait) {
            st.status='waiting';run.status='waiting';run.waiting={stepId:step.id,...outcome.wait};save(run);
            return await suspend(outcome.wait);
          }
          st.status=outcome?.skip ? 'skipped':'done';if(outcome?.note)st.note=outcome.note;save(run);
          return {ctx:clone(run.ctx)};
        } catch(e) {
          if(signal.aborted || e instanceof Cancelled || (e instanceof Error && e.name==='AbortError')) {
            st.status='pending';run.status='cancelled';
          } else {st.status='failed';st.error=e instanceof Error?e.message:String(e);run.status='failed';run.error=st.error;}
          run.endedAt=Date.now();save(run);throw e;
        }
      },
    }));
  }
  flow.then(createStep({id:'finalize-result',inputSchema:Frame,outputSchema:Output,execute:async()=>{signal.throwIfAborted();return {result:def.finish(run.ctx,run.input)};}}));
  flow.commit();
  new Mastra({storage,workflows:{pipeline:flow},logger:false});
  try {
    const native = await flow.createRun({runId:run.id});
    const confirmed = paused && run.ctx[`confirmed:${paused.id}`];
    const result = snapshot?.status==='suspended' && paused && typeof confirmed==='string'
      ? await native.resume({step:paused.id,resumeData:{text:confirmed}})
      : await native.start({inputData:{ctx:clone(run.ctx)}});
    // Failed/cancelled retries use a new native execution with the same durable ID;
    // completed step outputs are imported above, so successful work is not repeated.
    if(signal.aborted) {run.status='cancelled';run.endedAt=Date.now();}
    else if(result.status==='success') {run.result=result.result.result;run.status='done';run.endedAt=Date.now();}
    else if(result.status==='failed' && (run as RunState).status!=='cancelled') {run.status='failed';run.error=result.error.message;run.endedAt=Date.now();}
  } catch(e) {
    if(signal.aborted || e instanceof Cancelled || (e instanceof Error && e.name==='AbortError'))run.status='cancelled';
    else {run.status='failed';run.error=e instanceof Error?e.message:String(e);}
    run.endedAt=Date.now();
  }
  if ((run as RunState).status === 'cancelled') {
    run.waiting=undefined;
    for(const st of run.steps) if(st.status==='running' || st.status==='waiting') st.status='pending';
  }
  save(run);return run;
}
