import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { GOOD_KEY, cloudNote, startFakeAncher } from './fake-ancher.ts';
const fake = await startFakeAncher();
const longTitle = '特别长的官网笔记标题'.repeat(10);
fake.cloudNotes.push({...cloudNote('cloud-long'),title:longTitle});
const requests: {content:string;attachments?:{type:string;id:string}[]}[]=[];
fake.server.on('request',req=>{if(req.method==='POST'&&/^\/api\/v1\/conversations(\/c1)?$/.test(req.url??'')){let raw='';req.on('data',c=>raw+=c);req.on('end',()=>requests.push(JSON.parse(raw)));}});
const tmp=mkdtempSync(join(tmpdir(),'scripter-note-chat-'));const {privatePem,publicPem}=generateKeypair();writeFileSync(join(tmp,'pub.pem'),publicPem);
const app=await electron.launch({args:[join(import.meta.dirname,'..')],env:{...process.env,SCRIPTER_E2E:'1',SCRIPTER_USER_DATA:join(tmp,'data'),SCRIPTER_LICENSE_PUBKEY:join(tmp,'pub.pem'),SCRIPTER_ANCHER_BASE_URL:fake.url}});
const page=await app.firstWindow();page.setDefaultTimeout(20000);
const modifier=process.platform==='darwin'?'Meta':'Control';
try {
 await page.locator('.mc .tnum').waitFor();const machine=(await page.locator('.mc .tnum').textContent())!.trim();
 await page.locator('#code').fill(issueOfflineCode(privatePem,{mid:machine,cust:'笔记测试',seat:'1/1',exp:null}));await page.getByRole('button',{name:'激活',exact:true}).click();
 await page.locator('#k-ancher').fill(GOOD_KEY);await page.getByRole('button',{name:'验证并保存'}).click();await page.locator('#ask').waitFor();
 if(process.platform==='darwin') await app.evaluate(({BrowserWindow})=>{for(const window of BrowserWindow.getAllWindows())window.hide();});
 await page.locator('#ask').fill('笔记引用测试');await page.getByRole('button',{name:'开始',exact:true}).click();await page.getByText('本轮 6 处修改').waitFor();
 await page.getByRole('button',{name:'知识库',exact:true}).click();await page.locator('.note-all [data-note-id="cloud-long"]').waitFor();
 const metrics=await page.locator('.note-all [data-note-id]').evaluateAll(rows=>rows.map(row=>{const slot=row.querySelector('.note-leading')!.getBoundingClientRect();const icon=row.querySelector('.note-leading svg')!.getBoundingClientRect();return{slot:slot.width,icon:icon.width,x:slot.x};}));
 assert.equal(metrics.length,2);for(const m of metrics){assert.equal(m.slot,20);assert.equal(m.icon,16);assert.equal(m.x,metrics[0]!.x);}
 await page.keyboard.press(`${modifier}+k`);assert.equal(await page.getByLabel('搜索 Ancher 笔记',{exact:true}).evaluate(el=>el===document.activeElement),true);
 await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.activeElement?.getAttribute('data-note-id')==='cloud-long');
 await page.keyboard.press('ArrowUp');await page.waitForFunction(()=>document.activeElement?.getAttribute('data-note-id')==='cloud-n1');await page.keyboard.press('Enter');await page.getByRole('heading',{name:'官网保存的视频笔记',exact:true}).waitFor();
 // Add opens a closed chat dock, attaches without importing or sending, and focuses the composer.
 await page.getByRole('button',{name:'切换 AI 对话',exact:true}).click();
 await page.getByRole('button',{name:'添加到对话',exact:true}).click();await page.getByLabel('待发送笔记',{exact:true}).waitFor();
 await page.waitForFunction(()=>document.activeElement?.id==='agent-in');
 const id=await page.evaluate(async()=>(await window.api.projects.list())[0]!.id);
 assert.equal((await page.evaluate(async(id)=>window.api.projects.open(id),id)).bible.files.length,0);
 assert.equal(requests.length,1,'attachment selection must not send');
 await page.getByRole('button',{name:'添加到对话',exact:true}).click();assert.equal(await page.getByLabel('待发送笔记',{exact:true}).locator('.chat-note-chip').count(),1,'dedupe attachments');
 await page.getByRole('button',{name:'移除笔记 官网保存的视频笔记',exact:true}).click();assert.equal(await page.getByLabel('待发送笔记',{exact:true}).count(),0);
 await page.keyboard.press(`${modifier}+Shift+Enter`);await page.getByLabel('待发送笔记',{exact:true}).waitFor();
 await page.locator('#agent-in').fill('根据官网笔记分析');await page.getByRole('button',{name:'发送',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.ag-ai').length===2&&!document.querySelector('.cmp-card.busy'));
 assert.deepEqual(requests[1]!.attachments,[{type:'note',id:'cloud-n1'}]);assert.equal(await page.getByLabel('待发送笔记',{exact:true}).count(),0);
 // @ + Tab turns a matched note into an actual attachment, rather than just inserting its title.
 await page.locator('#agent-in').fill('@官网保存');await page.getByRole('option',{name:/Ancher 笔记.*官网保存的视频笔记/}).waitFor();await page.locator('#agent-in').press('Tab');
 assert.equal(await page.locator('#agent-in').inputValue(),'');await page.getByLabel('待发送笔记',{exact:true}).waitFor();
 await page.getByRole('button',{name:'移除笔记 官网保存的视频笔记',exact:true}).click();
 // Local notes are per-message references and do not become permanently pinned.
 await page.getByRole('tab',{name:'项目笔记',exact:true}).click();
 const fileId=await page.evaluate(async(id)=>{const state=await window.api.files.createNote(id,'本地参考','本地正文证据');window.dispatchEvent(new CustomEvent('scripter:project',{detail:id}));return state.bible.files.at(-1)!.id;},id);
 await page.getByLabel('笔记标题',{exact:true}).waitFor();await page.getByRole('button',{name:'添加到对话',exact:true}).click();await page.getByLabel('待发送笔记',{exact:true}).waitFor();
 await page.locator('#agent-in').fill('只参考本地笔记');await page.getByRole('button',{name:'发送',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.ag-ai').length===3&&!document.querySelector('.cmp-card.busy'));
 assert.ok(requests[2]!.content.includes('本地正文证据'));assert.equal(requests[2]!.attachments,undefined);
 assert.equal((await page.evaluate(async({id,fileId})=>(await window.api.projects.open(id)).bible.files.find(f=>f.id===fileId)!,{id,fileId})).pinned,false);
 console.log('PASS: fixed note icon geometry, search/list keyboard navigation, Add to chat, hidden dock focus, dedupe/remove, cloud resource IDs, @+Tab, local reference without pinning');
} catch(e){console.log(await page.locator('body').innerText());throw e;}finally{await app.close();fake.server.close();rmSync(tmp,{recursive:true,force:true});}
