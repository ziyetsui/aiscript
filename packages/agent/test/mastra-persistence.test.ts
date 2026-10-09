import { describe, expect, it, vi } from 'vitest';
import { confirm, newRun, recoverInterrupted, type RunState, type WorkflowDef, type WorkflowEnv } from '../src/workflows/engine.ts';
import { execute } from '../src/workflows/mastra.ts';
const reload = (run: RunState): RunState => JSON.parse(JSON.stringify(run));
const env = {} as WorkflowEnv;
const signal = () => new AbortController().signal;
const result = {kind:'issues' as const,items:[],summary:'完成'};

describe('native Mastra project snapshots',()=>{
  it('hydrates a suspended native snapshot after restart and resumes the edited confirmation',async()=>{
    const first=vi.fn(async(ctx:Record<string,unknown>)=>{ctx.draft='故事草稿';});
    const last=vi.fn(async(ctx:Record<string,unknown>)=>{ctx.final=ctx['confirmed:approve'];});
    const def:WorkflowDef={id:'episode',key:9,title:'test',desc:'',input:'none',steps:[
      {id:'draft',label:'草稿',run:first},
      {id:'approve',label:'确认',async run(ctx){if(typeof ctx['confirmed:approve']!=='string')return {wait:{title:'确认',text:String(ctx.draft),hint:''}};}},
      {id:'finish',label:'完成',run:last},
    ],finish:()=>result};
    let run=await execute(def,newRun(def,{},'persist-pause'),env,signal(),()=>{});
    expect(run.mastra?.snapshot).toMatchObject({status:'suspended'});
    run=reload(run);recoverInterrupted(run);expect(run.status).toBe('waiting');
    confirm(run,'作者修改后的故事');
    run=await execute(def,run,env,signal(),()=>{});
    expect(run.status).toBe('done');expect(run.ctx.final).toBe('作者修改后的故事');
    expect(first).toHaveBeenCalledTimes(1);expect(last).toHaveBeenCalledTimes(1);
    expect(run.mastra?.snapshot).toMatchObject({status:'success'});
  });
  it('persists partial progress inside a step and retries after process loss without duplicating it',async()=>{
    const first=vi.fn(async()=>{});let fail=true;let disk:RunState|undefined;
    const def:WorkflowDef={id:'episode',key:9,title:'test',desc:'',input:'none',steps:[
      {id:'research',label:'调研',run:first},
      {id:'write',label:'写作',async run(ctx,e){if(!ctx.batch){ctx.batch=1;e.checkpoint?.();}if(fail)throw new Error('网络断了');ctx.batch=2;}},
    ],finish:()=>result};
    let run=await execute(def,newRun(def,{},'persist-failure'),env,signal(),r=>{disk=reload(r);});
    expect(disk?.ctx.batch).toBe(1);expect(run.mastra?.snapshot).toMatchObject({status:'failed'});
    run=reload(disk!);fail=false;
    await execute(def,run,env,signal(),()=>{});
    expect(first).toHaveBeenCalledTimes(1);expect(run.ctx.batch).toBe(2);expect(run.status).toBe('done');
  });
  it('imports old records without rerunning finished work or changing their IDs',async()=>{
    const first=vi.fn(async()=>{});const second=vi.fn(async()=>{});
    const def:WorkflowDef={id:'episode',key:9,title:'test',desc:'',input:'none',steps:[{id:'one',label:'一',run:first},{id:'two',label:'二',run:second}],finish:()=>result};
    const old=newRun(def,{},'legacy-id');old.status='failed';old.steps[0]!.status='done';old.steps[1]!.status='failed';old.ctx.story='旧项目故事';
    const run=await execute(def,reload(old),env,signal(),()=>{});
    expect(first).not.toHaveBeenCalled();expect(second).toHaveBeenCalledTimes(1);
    expect(run.id).toBe('legacy-id');expect(run.ctx.story).toBe('旧项目故事');expect(run.status).toBe('done');
    expect(run.mastra?.snapshot).toMatchObject({status:'success'});
  });
});
