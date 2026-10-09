import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { GOOD_KEY, cloudNote, startFakeAncher } from './fake-ancher.ts';
const fake = await startFakeAncher();
const requests: { text: string; comment?: string }[] = [];
const original = fake.server.listeners('request')[0] as (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void;
fake.server.removeAllListeners('request');
fake.server.on('request', (req, res) => {
 if (req.method !== 'POST' || !['/api/v1/notes/text', '/api/v1/notes/url'].includes(req.url ?? '')) { original(req, res); return; }
 req.url = '/api/v1/notes/'; // The generic fake server has no POST handler for this path.
 let body = ''; req.on('data', (chunk) => body += chunk); req.on('end', () => {
  const input = JSON.parse(body);
  if(input.text === '__FAIL__') { res.writeHead(503, {'content-type':'application/json'}); res.end(JSON.stringify({message:'暂时无法创建'})); return; }
  requests.push(input);
  const note = { ...cloudNote(`new-${requests.length}`), title: input.text, comment: input.comment || '' };
  fake.cloudNotes.unshift(note); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(note));
 });
});
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
 await page.getByRole('button',{name:'知识库',exact:true}).click();await page.locator('.note-all [data-note-id="cloud-n1"]').waitFor();
 assert.equal(await page.getByRole('tab',{name:'项目笔记',exact:true}).count(),1);
 assert.equal(await page.getByRole('tab',{name:'Ancher 笔记',exact:true}).getAttribute('aria-selected'),'true');
 await page.getByRole('button',{name:/新建笔记/}).click();
 const modal=page.getByRole('dialog',{name:'新建笔记',exact:true});await modal.waitFor();
 assert.equal(await modal.getByRole('button',{name:'创建笔记',exact:true}).isEnabled(),false);
 await modal.getByLabel('笔记内容',{exact:true}).fill('创建功能验证');
 await modal.getByLabel('背景与意图',{exact:true}).fill('用于后续改编');
 await modal.getByRole('button',{name:'创建笔记',exact:true}).click();
 await page.getByRole('heading',{name:'创建功能验证',exact:true}).waitFor();
 assert.deepEqual(requests[0],{text:'创建功能验证',comment:'用于后续改编'});
 await page.keyboard.press(`${modifier}+Shift+O`);await modal.waitFor();
 await modal.getByLabel('笔记内容',{exact:true}).fill('https://example.com/article');
 await modal.getByRole('button',{name:'创建笔记',exact:true}).click();
 await page.getByRole('heading',{name:'https://example.com/article',exact:true}).waitFor();
 await page.keyboard.press(`${modifier}+Shift+O`);await modal.waitFor();
 await modal.getByLabel('笔记内容',{exact:true}).fill('__FAIL__');
 await modal.getByRole('button',{name:'创建笔记',exact:true}).click();await modal.getByRole('alert').waitFor();
 assert.equal(await modal.getByLabel('笔记内容',{exact:true}).inputValue(),'__FAIL__');
 assert.equal(await modal.getByRole('button',{name:'创建笔记',exact:true}).isEnabled(),true);

 await page.emulateMedia({colorScheme:'dark'});assert.equal(await modal.isVisible(),true);
 await page.keyboard.press('Escape');await modal.waitFor({state:'detached'});
 console.log('PASS: cloud knowledge retains project switcher, new-note dialog, empty validation, create/select text and URL, background, shortcut and Escape');
} catch(e){console.log(await page.locator('body').innerText());throw e;}finally{await app.close();fake.server.close();rmSync(tmp,{recursive:true,force:true});}
