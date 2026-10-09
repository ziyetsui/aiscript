import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { GOOD_KEY, startFakeAncher } from './fake-ancher.ts';
const fake=await startFakeAncher();
const original=fake.server.listeners('request')[0] as (req:import('node:http').IncomingMessage,res:import('node:http').ServerResponse)=>void;
const ops=(items:unknown[])=>`内容已准备好。<ops>${JSON.stringify(items)}</ops>`;
fake.server.removeAllListeners('request');
fake.server.on('request',(req,res)=>{
 const prompt=fake.prompts.at(-1)??'';
 if(req.method!=='GET'||!req.url?.startsWith('/api/v1/conversations/c1/stream')||!prompt.includes('用户：__')){original(req,res);return;}
 const user=prompt.split('用户：').at(-1)!;
 let text='';
 if(user.startsWith('__WRITE_SCRIPT__')) text=prompt.includes('刚才的结果还没有写入本地')?ops([{op:'insertNode',after:'end',type:'heading',text:'外景 后海 — 日'},{op:'insertNode',after:'end',type:'action',text:'小康娃握紧神笔，发现笔尖已经褪色。'},{op:'insertNode',after:'end',type:'character',text:'小康娃'},{op:'insertNode',after:'end',type:'dialogue',text:'这次得靠我自己。'}]):'已把完整剧本写入正文了。';
 else if(user.startsWith('__OUTLINE__'))text=ops([{op:'setOutline',text:'一、借来神笔\n二、神笔失效\n三、自己画完壁画'}]);
 else if(user.startsWith('__BEATS__'))text=ops([{op:'setBeats',text:'开场：炫耀神笔\n转折：神笔失效\n结尾：自己努力'}]);
 else if(user.startsWith('__BEATS_UPDATE__'))text=ops([{op:'setBeats',text:'开场：炫耀神笔\n转折：倒计时响起\n结尾：亲手完成'}]);
 else if(user.startsWith('__SHOTS__')){const scene=prompt.match(/\[([^\]]+)\] heading: 外景 后海 — 日/)![1];text=ops([{op:'setShots',sceneId:scene,shots:[{size:'全景',desc:'后海岸边，小康娃蹲在墙前',dur:4},{size:'特写',desc:'笔尖褪色，小康娃握紧神笔',dur:3}]}]);}
 else if(user.startsWith('__INVALID__'))text='已写入剧本。<ops>[{"op":"setScript","text":"错误格式"}]</ops>';
 else if(user.startsWith('__SLOW_WRITE__'))text=ops([{op:'setBeats',text:'不应写入的节拍'}]);
 else if(user.startsWith('__CHAT__'))text='神笔的限制可以让主角依靠自己的努力解决问题。';
 else if(user.startsWith('__MULTI__'))text=ops([{op:'insertNode',after:'end',type:'heading',text:'外景 校园 — 黄昏',id:'new-scene'},{op:'insertNode',after:'end',type:'action',text:'孩子们接力画完壁画。'},{op:'setOutline',text:'接力完成壁画的故事大纲'},{op:'setBeats',text:'相遇—受挫—合作—完成'},{op:'setShots',sceneId:'new-scene',shots:[{size:'全景',desc:'孩子们围着壁画欢呼',dur:5}]}]);
 const send=()=>{if(res.destroyed)return;res.writeHead(200,{'content-type':'text/event-stream'});res.write(`data: ${JSON.stringify({type:'content',conversation_id:'c1',message_id:'m1',delta:text})}\n\n`);res.end(`data: ${JSON.stringify({type:'done',conversation_id:'c1',message_id:'m1',finish_reason:'stop'})}\n\n`);};
 if(user.startsWith('__SLOW_WRITE__'))setTimeout(send,1500);else send();
});
const tmp=mkdtempSync(join(tmpdir(),'scripter-documents-'));const{privatePem,publicPem}=generateKeypair();writeFileSync(join(tmp,'pub.pem'),publicPem);
const env={...process.env,SCRIPTER_E2E:'1',SCRIPTER_USER_DATA:join(tmp,'data'),SCRIPTER_LICENSE_PUBKEY:join(tmp,'pub.pem'),SCRIPTER_ANCHER_BASE_URL:fake.url};
let app=await electron.launch({args:[join(import.meta.dirname,'..')],colorScheme:null as never,env});let page=await app.firstWindow();page.setDefaultTimeout(20000);await page.emulateMedia({reducedMotion:'reduce'});
try{
 await page.locator('.mc .tnum').waitFor();const mid=(await page.locator('.mc .tnum').textContent())!.trim();await page.locator('#code').fill(issueOfflineCode(privatePem,{mid,cust:'编剧测试',seat:'1/1',exp:null}));await page.getByRole('button',{name:'激活',exact:true}).click();await page.locator('#k-ancher').fill(GOOD_KEY);await page.getByRole('button',{name:'验证并保存'}).click();await page.locator('#ask').fill('编剧写入测试');await page.getByRole('button',{name:'开始',exact:true}).click();await page.getByText('本轮 6 处修改').waitFor();
 if(process.platform==='darwin')await app.evaluate(({BrowserWindow})=>{for(const w of BrowserWindow.getAllWindows())w.hide();});
 const id=await page.evaluate(async()=>(await window.api.projects.list())[0]!.id);
 await page.evaluate(async(id)=>{const p=await window.api.projects.open(id);await window.api.projects.edit(id,p.nodes.map(n=>({op:'remove' as const,id:n.id})));window.dispatchEvent(new CustomEvent('scripter:project',{detail:id}));},id);
 async function send(text:string){await page.locator('#agent-in').fill(text);await page.getByRole('button',{name:'发送',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.cmp-card.busy'));}
 const state=()=>page.evaluate(id=>window.api.projects.open(id),id);
 // The original failure: false success text must be repaired and actually saved via Mastra + Loro.
 await send('__WRITE_SCRIPT__ 把刚才的故事写入剧本');await page.locator('.paper .node[data-type="heading"]').waitFor();assert.equal((await state()).nodes.length,4);assert.ok((await page.locator('.paper').innerText()).includes('后海'));assert.equal(fake.prompts.filter(p=>p.includes('用户：__WRITE_SCRIPT__')).length,2);assert.ok((await state()).chat.at(-1)!.steps!.some(s=>s.label==='修复写入格式'));
 await send('__OUTLINE__ 自动写大纲');await page.getByLabel('大纲',{exact:true}).waitFor();assert.ok((await page.getByLabel('大纲',{exact:true}).inputValue()).includes('神笔失效'));
 await send('__BEATS__ 写入故事节拍');await page.getByLabel('故事节拍',{exact:true}).waitFor();assert.ok((await page.getByLabel('故事节拍',{exact:true}).inputValue()).includes('神笔失效'));assert.ok((await state()).outline.includes('一、'));
 // Writing into the currently open beats document refreshes it after preview acceptance.
 await send('__BEATS_UPDATE__ 把倒计时写入这里');await page.getByText('修改已准备好，接受后写入对应文档。',{exact:true}).waitFor();assert.ok(!(await state()).beats.includes('倒计时'));await page.getByRole('button',{name:'接受',exact:true}).click();await page.waitForFunction(()=>document.querySelector<HTMLTextAreaElement>('textarea[aria-label="故事节拍"]')?.value.includes('倒计时'));
 const beatTurn=(await state()).turns.at(-1)!.id;await page.getByRole('button',{name:'撤销最近一轮修改',exact:true}).click();await page.waitForFunction(()=>document.querySelector<HTMLTextAreaElement>('textarea[aria-label="故事节拍"]')?.value.includes('神笔失效'));assert.equal((await state()).turns.find(t=>t.id===beatTurn)!.undone,true);
 await send('__SHOTS__ 帮我生成分镜');await page.getByRole('tab',{name:'分镜',exact:true}).getAttribute('aria-selected').then(v=>assert.equal(v,'true'));assert.equal((await state()).bible.shots.length,2);assert.equal(await page.getByLabel('镜头 2 描述',{exact:true}).inputValue(),'笔尖褪色，小康娃握紧神笔');
 await page.getByRole('tab',{name:'剧本',exact:true}).click();const requestsBeforeToolbar=fake.prompts.length;const firstNode=page.locator('.paper .node').first();await firstNode.click();
 for(const [type,label] of [['action','动作'],['character','角色'],['parenthetical','括号'],['dialogue','对白'],['transition','转场'],['shot','镜头'],['note','注释'],['subtitle','字幕'],['heading','场景']]){await page.getByRole('button',{name:`设为${label}`,exact:true}).click();assert.equal((await state()).nodes[0]!.type,type);}
 assert.equal(fake.prompts.length,requestsBeforeToolbar);await page.getByRole('button',{name:'场景',exact:true}).click();await page.locator('.scene-board .card').waitFor();await page.getByRole('button',{name:'分集看板',exact:true}).click();await page.locator('.episode-board .card').first().waitFor();
 const before=await state();await send('__INVALID__ 写入剧本');assert.deepEqual((await state()).nodes,before.nodes);assert.ok((await state()).chat.at(-1)!.error!.includes('未写入'));assert.equal((await state()).chat.at(-1)!.text,'');
 await send('__CHAT__ 分析这个故事的主题');assert.equal((await state()).turns.length,before.turns.length);
 await send('__MULTI__ 自动写大纲、剧本、分镜和故事街拍');await page.locator('.preview:not(.done)').waitFor();const previous=await state();assert.deepEqual(previous.nodes,before.nodes);await page.getByRole('button',{name:'接受',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.paper .node').length===6);const combined=await state();assert.equal(combined.outline,'接力完成壁画的故事大纲');assert.equal(combined.beats,'相遇—受挫—合作—完成');assert.equal(combined.bible.shots.length,3);assert.equal(combined.bible.shots.at(-1)!.sceneId,combined.nodes.find(n=>n.text==='外景 校园 — 黄昏')!.id);
 await page.getByRole('button',{name:'撤销最近一轮修改',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.paper .node').length===4);const undone=await state();assert.equal(undone.outline,previous.outline);assert.equal(undone.beats,previous.beats);assert.deepEqual(undone.bible.shots,previous.bible.shots);
 // Cancellation and switching episodes both prevent writes to the wrong document.
 await page.locator('#agent-in').fill('__SLOW_WRITE__ 写入故事节拍');await page.getByRole('button',{name:'发送',exact:true}).click();await page.locator('.cmp-card.busy').waitFor();await page.getByRole('button',{name:'停止',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.cmp-card.busy'));assert.equal((await state()).beats,previous.beats);
 await page.locator('#agent-in').fill('__SLOW_WRITE__ 写入故事节拍');await page.getByRole('button',{name:'发送',exact:true}).click();await page.locator('.cmp-card.busy').waitFor();await assert.rejects(page.evaluate(id=>window.api.projects.episode(id,'create',undefined,'第2集'),id),/请先停止正在生成的内容/);await page.getByRole('button',{name:'停止',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.cmp-card.busy'));await page.evaluate(id=>window.api.projects.episode(id,'create',undefined,'第2集'),id);assert.equal((await state()).beats,'');assert.equal((await state()).nodes.length,0);
 const first=(await state()).episodes[0]!.id;await page.evaluate(({id,first})=>window.api.projects.episode(id,'select',first),{id,first});
 await app.close();app=await electron.launch({args:[join(import.meta.dirname,'..')],colorScheme:null as never,env});page=await app.firstWindow();page.setDefaultTimeout(20000);await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'最近项目',exact:true}).click();await page.locator('.recent[data-project-id]').first().getByRole('button').first().click();await page.locator('.paper .node').first().waitFor();const persisted=await state();assert.equal(persisted.nodes.length,4);assert.equal(persisted.beats,previous.beats);assert.equal(persisted.outline,previous.outline);assert.equal(persisted.bible.shots.length,2);
 console.log('PASS: actual Mastra workflow + Loro write, false-success repair, script/outline/beats/shots navigation, beats preview + live refresh, atomic combined writes + whole-turn undo, invalid replies do not claim success, normal chat, cancellation, episode isolation, persistence');
}catch(e){console.log(await page.locator('body').innerText());throw e;}finally{await app.close();fake.server.close();rmSync(tmp,{recursive:true,force:true});}
