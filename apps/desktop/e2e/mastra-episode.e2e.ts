import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { unzipSync, strFromU8 } from 'fflate';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { GOOD_KEY, startFakeAncher } from './fake-ancher.ts';
const fake=await startFakeAncher();
const tmp=mkdtempSync(join(tmpdir(),'scripter-mastra-episode-'));
const {privatePem,publicPem}=generateKeypair();writeFileSync(join(tmp,'pub.pem'),publicPem);
const env={...process.env,SCRIPTER_E2E:'1',SCRIPTER_USER_DATA:join(tmp,'data'),SCRIPTER_LICENSE_PUBKEY:join(tmp,'pub.pem'),SCRIPTER_ANCHER_BASE_URL:fake.url};
let app=await electron.launch({args:[join(import.meta.dirname,'..')],colorScheme:null as never,env});
let page=await app.firstWindow();page.setDefaultTimeout(20000);await page.emulateMedia({reducedMotion:'reduce'});
let id='';
const state=()=>page.evaluate(id=>window.api.projects.open(id),id);
const disk=()=>JSON.parse(readFileSync(join(tmp,'data','projects',id,'meta.json'),'utf8')).workflows.at(-1);
async function restart(){await app.close();app=await electron.launch({args:[join(import.meta.dirname,'..')],colorScheme:null as never,env});page=await app.firstWindow();page.setDefaultTimeout(20000);await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'最近项目',exact:true}).click();await page.locator(`.recent[data-project-id="${id}"]`).getByRole('button').first().click();}
try{
 await page.locator('.mc .tnum').waitFor();const mid=(await page.locator('.mc .tnum').textContent())!.trim();await page.locator('#code').fill(issueOfflineCode(privatePem,{mid,cust:'Mastra 流程测试',seat:'1/1',exp:null}));await page.getByRole('button',{name:'激活',exact:true}).click();await page.locator('#k-ancher').fill(GOOD_KEY);await page.getByRole('button',{name:'验证并保存'}).click();await page.locator('#ask').fill('豆豆想要一双会发光的鞋');await page.getByRole('button',{name:'⚡ 写一整集'}).click();
 await page.getByLabel('确认故事和锁定核心',{exact:true}).waitFor();id=await page.evaluate(async()=>(await window.api.projects.list())[0]!.id);
 assert.equal(disk().mastra.snapshot.status,'suspended');assert.equal((await state()).runs.at(-1)!.mastra,undefined);
 const promptCount=fake.prompts.length;await restart();await page.getByLabel('确认故事和锁定核心',{exact:true}).waitFor();assert.equal(fake.prompts.length,promptCount);
 const storyBox=page.getByLabel('确认故事和锁定核心',{exact:true});await storyBox.fill((await storyBox.inputValue()).replace('【锁定核心】','作者补充：大壮也借到了鞋。\n\n【锁定核心】'));await page.getByRole('button',{name:'确认，继续',exact:true}).click();await page.getByLabel('确认分场',{exact:true}).waitFor();assert.equal(disk().mastra.snapshot.status,'suspended');assert.match((await state()).outline,/作者补充/);assert.ok(fake.prompts.at(-1)!.includes('作者补充'));
 // Export/import retains the native paused execution, but strips the cloud account's conversation IDs.
 const archive=join(tmp,'paused.scripter');await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=(async()=>({canceled:false,filePath:path})) as typeof dialog.showSaveDialog;dialog.showOpenDialog=(async()=>({canceled:false,filePaths:[path]})) as typeof dialog.showOpenDialog;},archive);
 await page.evaluate(id=>window.api.projects.exportArchive(id),id);const z=unzipSync(new Uint8Array(readFileSync(archive)));const meta=strFromU8(z['meta.json']!);assert.ok(!meta.includes('conversationId'));assert.equal(JSON.parse(meta).workflows.at(-1).mastra.snapshot.status,'suspended');
 const imported=await page.evaluate(()=>window.api.projects.importArchive());assert.ok(imported);id=imported!.id;await page.evaluate(id=>window.dispatchEvent(new CustomEvent('scripter:project',{detail:id})),id);
 const beforeRestart=fake.prompts.length;await restart();const scenes=page.getByLabel('确认分场',{exact:true});await scenes.waitFor();assert.equal(fake.prompts.length,beforeRestart);assert.equal((await scenes.inputValue()).split('\n').length,13);
 await page.getByRole('button',{name:'确认，继续',exact:true}).click();await page.getByRole('button',{name:'查看修改预览',exact:true}).waitFor();assert.equal(disk().mastra.snapshot.status,'success');assert.equal((await state()).nodes.length,0);
 await page.getByRole('button',{name:'查看修改预览',exact:true}).click();await page.locator('.preview').last().getByRole('button',{name:'接受',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.paper .node[data-type="heading"]').length===13);assert.equal((await state()).runs.at(-1)!.status,'done');
 await restart();await page.locator('.paper .node[data-type="heading"]').first().waitFor();assert.equal((await state()).scenes.length,13);assert.equal(disk().mastra.snapshot.status,'success');await page.getByRole('button',{name:'撤销最近一轮修改',exact:true}).click();await page.waitForFunction(async(id)=>(await window.api.projects.open(id)).nodes.length===0,id);
 console.log('PASS: Mastra episode native suspend/resume across two restarts, edited confirmation, portable paused snapshot without account IDs, imported run completion, Loro preview/apply/persistence/undo');
}catch(e){console.log((await page.locator('body').innerText()).slice(-1800));throw e;}finally{await app.close();fake.server.close();rmSync(tmp,{recursive:true,force:true});}
