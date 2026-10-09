import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { GOOD_KEY, cloudNote, startFakeAncher } from './fake-ancher.ts';
const fake = await startFakeAncher();
const requests: { text: string }[] = []; const collectionRequests: unknown[] = []; let failSave = true;
const original = fake.server.listeners('request')[0] as (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void;
fake.server.removeAllListeners('request');
fake.server.on('request', (req, res) => {
 const path = new URL(req.url!, 'http://localhost').pathname;
 if (req.method !== 'POST' || (path !== '/api/v1/notes/text' && !path.startsWith('/api/v1/collections/cloud-c1'))) { original(req, res); return; }
 let body = ''; req.on('data', (chunk) => body += chunk); req.on('end', () => {
  const input = JSON.parse(body || '{}'); res.setHeader('content-type', 'application/json');
  if (path === '/api/v1/notes/text') {
   if (failSave) { failSave = false; res.writeHead(503); res.end(JSON.stringify({message:'暂时无法保存'})); return; }
   requests.push(input); const note = {...cloudNote(`topic-note-${requests.length}`),title:input.text.split('\n')[0].slice(2)}; fake.cloudNotes.push(note);res.end(JSON.stringify(note));
  } else { collectionRequests.push(input); res.end(JSON.stringify({success:true})); }
 });
});
const tmp=mkdtempSync(join(tmpdir(),'scripter-topics-'));const {privatePem,publicPem}=generateKeypair();writeFileSync(join(tmp,'pub.pem'),publicPem);
const env={...process.env,SCRIPTER_E2E:'1',SCRIPTER_USER_DATA:join(tmp,'data'),SCRIPTER_LICENSE_PUBKEY:join(tmp,'pub.pem'),SCRIPTER_ANCHER_BASE_URL:fake.url};
let app=await electron.launch({args:[join(import.meta.dirname,'..')],colorScheme:null as never,env});let page=await app.firstWindow();page.setDefaultTimeout(15000);
const shots=join(import.meta.dirname,'shots');mkdirSync(shots,{recursive:true});
try {
 await page.locator('.mc .tnum').waitFor();const machine=(await page.locator('.mc .tnum').textContent())!.trim();
 await page.locator('#code').fill(issueOfflineCode(privatePem,{mid:machine,cust:'选题测试',seat:'1/1',exp:null}));await page.getByRole('button',{name:'激活',exact:true}).click();
 await page.locator('#k-ancher').fill(GOOD_KEY);await page.getByRole('button',{name:'验证并保存'}).click();await page.locator('#ask').waitFor();
 if(process.platform==='darwin') await app.evaluate(({BrowserWindow})=>{for(const window of BrowserWindow.getAllWindows())window.hide();});
 await page.locator('#ask').fill('选题引用测试');await page.getByRole('button',{name:'开始',exact:true}).click();await page.getByText('本轮 6 处修改').waitFor();
 const id=await page.evaluate(async()=>(await window.api.projects.list())[0]!.id);
 const seeded=await page.evaluate(async(id)=>{
  const items=[['懒人养生大作战','大雄想靠「喝大水、睡大觉、练瘦肌」偷懒变强壮，结果身体被折腾出一连串爆笑反效果。','贴合孩子对「不努力也能变好」的幻想，用道具反噬制造笑点。'],['玉米大冒险','大雄嫌玉米不好吃不肯吃饭，哆啦A梦用缩小道具带他钻进玉米世界，见识玉米如何养活全世界。','把玉米科普变成奇幻探险，强化不挑食、珍惜粮食。'],['桂花香的魔法秘密','两人追着忽浓忽淡的香味，意外发现香气像会躲猫猫的神奇流体。','温暖的趣味科学，追香气的桥段适合做可爱动画。'],['小野猪进城记','一群迷路的小野猪误闯县城，大雄帮它们找回家的路，闹出一串温馨又搞笑的意外。','动物题材传递关爱小动物与帮助他人的主题。'],['修鞋铺','门墩儿想修好姥爷的旧鞋','贴近胡同生活'],['雨天','下雨天门墩儿怕冷','季节题材']];
  for(let i=0;i<items.length;i++){await window.api.bible.add(id,'topics',{title:items[i]![0],logline:items[i]![1],why:items[i]![2],source:'https://example.com/story',addedAt:Date.now()-i*86400000});}
  window.dispatchEvent(new CustomEvent('scripter:project',{detail:id}));return (await window.api.projects.open(id)).bible.topics;
 },id);
 await page.getByRole('button',{name:'选题池',exact:true}).click();await page.getByRole('article',{name:'懒人养生大作战',exact:true}).waitFor();
 assert.equal(await page.locator('.topic-card').count(),6);
 await page.getByRole('button',{name:'显示与排序',exact:true}).click();await page.getByRole('tab',{name:'列表',exact:true}).click();assert.equal(await page.locator('.topic-row').count(),6);await page.getByLabel('选题排序',{exact:true}).selectOption('oldest');await page.waitForFunction(()=>document.querySelector('.topic-item')?.getAttribute('aria-label')==='雨天');await page.getByLabel('选题排序',{exact:true}).selectOption('newest');await page.waitForFunction(()=>document.querySelector('.topic-item')?.getAttribute('aria-label')==='懒人养生大作战');await page.keyboard.press('Escape');
 await page.getByLabel('搜索选题',{exact:true}).fill('珍惜粮食');assert.equal(await page.locator('.topic-row').count(),1);await page.getByLabel('搜索选题',{exact:true}).fill('');
 const corn=page.getByRole('article',{name:'玉米大冒险',exact:true});
 await corn.getByRole('button',{name:'查看选题 玉米大冒险',exact:true}).click();let info=page.getByRole('dialog',{name:'玉米大冒险',exact:true});await info.getByText('推荐理由',{exact:true}).waitFor();await info.getByRole('button',{name:'选这个',exact:true}).click();await info.getByText('已选',{exact:true}).waitFor();await info.getByLabel('否掉的原因',{exact:true}).fill('不符合这集主题');await info.getByLabel('否掉的原因',{exact:true}).press('Enter');await info.getByText('已否',{exact:true}).waitFor();await info.getByRole('button',{name:'恢复待定',exact:true}).click();assert.equal(await info.getByLabel('否掉的原因',{exact:true}).inputValue(),'');await page.keyboard.press('Escape');
 async function menu(title:string){await page.getByRole('button',{name:`${title} 的更多操作`,exact:true}).click();await page.getByRole('menu').waitFor();}
 await corn.click({button:'right'});await page.getByRole('menu').waitFor();await page.keyboard.press('End');assert.equal(await page.getByRole('menuitem',{name:'删除',exact:true}).evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Escape');
 await menu('玉米大冒险');await page.getByRole('menuitemcheckbox',{name:'喜欢',exact:true}).click();await menu('玉米大冒险');assert.equal(await page.getByRole('menuitemcheckbox',{name:'喜欢',exact:true}).getAttribute('aria-checked'),'true');await page.keyboard.press('Escape');
 await menu('玉米大冒险');await page.getByRole('menuitem',{name:'保存为笔记',exact:true}).click();await page.locator('.topics-page .err').waitFor();assert.equal(requests.length,0);await menu('玉米大冒险');await page.getByRole('menuitem',{name:'保存为笔记',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.topics-page[aria-busy="true"]'));assert.ok(requests[0]!.text.includes('珍惜粮食'));
 await menu('玉米大冒险');await page.getByRole('menuitem',{name:'添加到合集',exact:true}).click();await page.getByLabel('选择合集',{exact:true}).selectOption('cloud-c1');await page.getByRole('dialog',{name:'添加到合集',exact:true}).getByRole('button',{name:'添加到合集',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(collectionRequests.length,1);
 await menu('玉米大冒险');await page.getByRole('menuitem',{name:'分享',exact:true}).click();assert.ok((await page.getByLabel('分享内容',{exact:true}).inputValue()).includes('https://example.com/story'));await page.getByRole('button',{name:'复制内容',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.ok((await app.evaluate(({clipboard})=>clipboard.readText())).includes('玉米大冒险'));
 // Download goes through Electron's actual download manager, into the isolated test folder.
 const downloadPath=join(tmp,'topic.md');await app.evaluate(({BrowserWindow},path)=>{BrowserWindow.getAllWindows()[0]!.webContents.session.once('will-download',(_,item)=>item.setSavePath(path));},downloadPath);
 await menu('玉米大冒险');await page.getByRole('menuitem',{name:'下载',exact:true}).click();await page.waitForTimeout(500);assert.ok(readFileSync(downloadPath,'utf8').includes('珍惜粮食'));
 // Open a hidden dock and attach without sending or saving any note.
 await page.getByRole('button',{name:'切换 AI 对话',exact:true}).click();const before=fake.prompts.length;const saved=requests.length;
 await menu('玉米大冒险');await page.getByRole('menuitem',{name:'添加到对话',exact:true}).click();await page.getByLabel('待发送笔记',{exact:true}).waitFor();await page.waitForFunction(()=>document.activeElement?.id==='agent-in');assert.equal(fake.prompts.length,before);assert.equal(requests.length,saved);
 await menu('玉米大冒险');await page.getByRole('menuitem',{name:'添加到对话',exact:true}).click();assert.equal(await page.locator('.chat-note-attachments .chat-note-chip').count(),1);
 await page.locator('#agent-in').fill('根据这个选题展开故事');await page.getByRole('button',{name:'发送',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.ag-ai').length===2&&!document.querySelector('.cmp-card.busy'));assert.ok(fake.prompts.at(-1)!.includes('珍惜粮食'));
 await page.locator('#agent-in').fill('@玉米');await page.getByRole('option',{name:/选题.*玉米大冒险/}).waitFor();await page.locator('#agent-in').press('Tab');await page.getByLabel('待发送笔记',{exact:true}).waitFor();await page.getByRole('button',{name:'移除笔记 玉米大冒险',exact:true}).click();
 // AI document writes navigate to the script; return to the topics panel before batch actions.
 await page.getByRole('button',{name:'选题池',exact:true}).click();
 await page.getByLabel('选择选题 桂花香的魔法秘密',{exact:true}).check();await page.getByLabel('选择选题 小野猪进城记',{exact:true}).check();await page.getByLabel('批量选题操作',{exact:true}).getByRole('button',{name:'添加到对话',exact:true}).click();assert.equal(await page.locator('.chat-note-attachments .chat-note-chip').count(),2);await page.getByRole('button',{name:'移除笔记 桂花香的魔法秘密',exact:true}).click();await page.getByRole('button',{name:'移除笔记 小野猪进城记',exact:true}).click();await page.getByLabel('批量选题操作',{exact:true}).getByRole('button',{name:'删除',exact:true}).click();await page.getByRole('dialog',{name:'删除选题',exact:true}).getByRole('button',{name:'取消',exact:true}).click();assert.equal(await page.locator('.topic-row').count(),6);await page.getByLabel('批量选题操作',{exact:true}).getByRole('button',{name:'删除',exact:true}).click();await page.getByRole('button',{name:'确认删除',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(await page.locator('.topic-row').count(),4);
 await app.evaluate(({BrowserWindow})=>{BrowserWindow.getAllWindows()[0]!.showInactive();});
 for(const theme of ['light','dark'] as const){await page.evaluate(t=>window.api.app.setTheme(t),theme);await page.waitForFunction(t=>matchMedia('(prefers-color-scheme: dark)').matches===(t==='dark'),theme);for(const view of ['卡片','列表']){await page.getByRole('button',{name:`${view}视图`,exact:true}).click();await page.locator(view==='卡片'?'.topic-card':'.topic-row').first().waitFor();await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await page.screenshot({path:join(shots,`topics-artifacts-${theme}-${view==='卡片'?'grid':'list'}.png`)});}await menu('玉米大冒险');await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));await page.screenshot({path:join(shots,`topics-artifacts-${theme}-menu.png`)});await page.keyboard.press('Escape');}
 await page.getByRole('tab',{name:'已选',exact:true}).click();await page.getByText('还没有已选选题',{exact:true}).waitFor();await page.getByRole('button',{name:'清除筛选',exact:true}).click();
 await app.close();app=await electron.launch({args:[join(import.meta.dirname,'..')],colorScheme:null as never,env});page=await app.firstWindow();page.setDefaultTimeout(15000);await page.getByRole('button',{name:'最近项目',exact:true}).click();await page.locator('.recent[data-project-id]').first().getByRole('button').first().click();await page.locator('.paper .node').first().waitFor();await page.getByRole('button',{name:'选题池',exact:true}).click();await page.locator('.topic-row').first().waitFor();assert.equal(await page.locator('.topic-row').count(),4);const state=await page.evaluate(id=>window.api.projects.open(id),id);assert.equal(state.bible.topics.find(t=>t.title==='玉米大冒险')!.reaction,'like');assert.equal(state.bible.topics.find(t=>t.title==='玉米大冒险')!.status,'idea');assert.ok(!state.bible.topics.some(t=>t.title==='小野猪进城记'));assert.equal(state.bible.files.length,0);
 console.log('PASS: card/list + persistence, search/filter/sort controls, context menu + keyboard, decisions, reactions, cloud save failure/retry, collection, share clipboard, actual Markdown download, hidden dock + dedupe + selected topic reference, confirmed batch deletion, light/dark screenshots');
} catch(e){console.log(await page.locator('body').innerText());throw e;}finally{await app.close();fake.server.close();rmSync(tmp,{recursive:true,force:true});}
