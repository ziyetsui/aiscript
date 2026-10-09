import { expect, it } from 'vitest';
import { runWritingWorkflow } from '../src/writing-workflow.ts';
import { ScriptDoc, previewOps } from '@scripter/core';
const response = (text:string) => ({text,conversationId:'c1',finish:'stop',citations:[]});
it('repairs a false success claim before committing any document changes',async()=>{
 const prompts:string[]=[];const committed:unknown[]=[];
 const result=await runWritingWorkflow({instruction:'写入剧本',targets:['script']},{signal:new AbortController().signal,
  generate:async(suffix)=>{prompts.push(suffix);return response(prompts.length===1?'已写入剧本。':`完成。<ops>${JSON.stringify([{op:'insertNode',after:'end',type:'heading',text:'外景 胡同 — 日'}])}</ops>`);},
  validate:()=>[],commit:(parsed)=>{committed.push(parsed.ops);return 'saved';},
 });
 expect(result).toBe('saved');expect(prompts).toHaveLength(2);expect(prompts[1]).toContain('没有');expect(committed).toHaveLength(1);
});
it('rejects invalid output atomically, including valid ops next to a malformed op',async()=>{
 let calls=0;let writes=0;
 await expect(runWritingWorkflow({instruction:'写入剧本',targets:['script']},{signal:new AbortController().signal,generate:async()=>{calls++;return response('<ops>[{"op":"insertNode","type":"heading","text":"外景 日"},{"op":"setScript","text":"整篇"}]</ops>');},validate:()=>[],commit:()=>{writes++;}})).rejects.toThrow('未写入');
 expect(calls).toBe(2);expect(writes).toBe(0);
});
it('validates new scene aliases for combined script and storyboard writes',async()=>{
 const d=new ScriptDoc();let writes=0;
 await runWritingWorkflow({instruction:'写剧本和分镜',targets:['script','shots']},{signal:new AbortController().signal,generate:async()=>response('<ops>[{"op":"insertNode","after":"end","type":"heading","text":"外景 胡同 — 日","id":"scene-new"},{"op":"setShots","sceneId":"scene-new","shots":[{"desc":"胡同全景","dur":3}]}]</ops>'),validate:(ops)=>previewOps(d,ops).missing,commit:()=>{writes++;}});
 expect(writes).toBe(1);
});
it('stops cancellation before the commit step',async()=>{
 const ac=new AbortController();let writes=0;
 await expect(runWritingWorkflow({instruction:'写大纲',targets:['outline']},{signal:ac.signal,generate:async()=>{ac.abort();return response('<ops>[{"op":"setOutline","text":"大纲"}]</ops>');},validate:()=>[],commit:()=>{writes++;}})).rejects.toThrow();
 expect(writes).toBe(0);
});
