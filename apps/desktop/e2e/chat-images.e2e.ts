import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
const bodies: { content:string;attachments?:{id:string;type:string}[] }[] = [];
const uploads: Buffer[] = []; let fail = false;
const server = createServer((req,res) => {
  const json = (status:number, body:unknown) => { res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body)); };
  if (req.url!.includes('/users/me')) return json(200,{id:'u1',email:'test@example.com',is_active:true,activation_completed:true});
  if (req.method === 'POST' && req.url!.startsWith('/api/v1/files')) {
    const chunks:Buffer[]=[];req.on('data',c=>chunks.push(c));req.on('end',()=>{if(fail)return json(400,{message:'upload failed'});uploads.push(Buffer.concat(chunks));json(200,{id:`image-${uploads.length}`});});return;
  }
  if (req.method === 'POST' && req.url!.includes('/conversations')) {
    let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{bodies.push(JSON.parse(raw));json(202,{conversation_id:'c1',stream_url:'/api/v1/conversations/c1/stream'});});return;
  }
  if (req.url!.includes('/stream')) {
    res.writeHead(200,{'content-type':'text/event-stream'});
    const delta = bodies.at(-1)!.content.includes('用户：根据当前剧本和已有大纲') ? '## 故事大纲\n\n1. 发现年糕\n2. 分年糕' : bodies.at(-1)!.content.includes('为指定的这一句') ? `<result>${JSON.stringify({items:Array.from({length:3},(_,i)=>({text:`## 方案 ${i+1}\n\n**年糕**\n\n- 肚子打架`,mechanism:'**夸张**与孩子视角',conflict:''}))})}</result>` : '## 图片\n\n**已收到**\n\n- 原图附件';
    const finish = () => res.end(`data: ${JSON.stringify({type:'content',conversation_id:'c1',message_id:'m1',delta,created_at:0})}\n\ndata: ${JSON.stringify({type:'done',conversation_id:'c1',message_id:'m1',finish_reason:'stop'})}\n\n`);
    if (bodies.at(-1)!.content.includes('用户：__SLOW__')) setTimeout(finish,1500); else finish(); return;
  }
  json(404,{});
});
await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
const address=server.address() as {port:number};
const tmp=mkdtempSync(join(tmpdir(),'scripter-images-'));const {privatePem,publicPem}=generateKeypair();writeFileSync(join(tmp,'pub.pem'),publicPem);
const app=await electron.launch({args:[join(import.meta.dirname,'..')],env:{...process.env,SCRIPTER_E2E:'1',SCRIPTER_USER_DATA:join(tmp,'data'),SCRIPTER_LICENSE_PUBKEY:join(tmp,'pub.pem'),SCRIPTER_ANCHER_BASE_URL:`http://127.0.0.1:${address.port}`}});
const page=await app.firstWindow();await app.evaluate(({BrowserWindow})=>{ for (const window of BrowserWindow.getAllWindows()) window.hide(); });page.setDefaultTimeout(15000);
async function paste(selector:string,count=1) {
  await page.locator(selector).evaluate((el,{base64,count})=>{
    const data=new DataTransfer();const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    for(let i=0;i<count;i++)data.items.add(new File([bytes],`截图${i+1}.png`,{type:'image/png'}));
    el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
  },{base64:png.toString('base64'),count});
  await page.getByLabel('待发送图片', {exact:true}).locator('img').first().waitFor();
}
try {
  await page.locator('.mc .tnum').waitFor();const machine=(await page.locator('.mc .tnum').textContent())!.trim();
  await page.locator('#code').fill(issueOfflineCode(privatePem,{mid:machine,cust:'图片测试',seat:'1/1',exp:null}));await page.getByRole('button',{name:'激活',exact:true}).click();
  await page.locator('#k-ancher').fill('test-key');await page.getByRole('button',{name:'验证并保存'}).click();await page.locator('#ask').waitFor();
  await paste('#ask',2);assert.equal(await page.getByLabel('待发送图片',{exact:true}).locator('img').count(),2);assert.equal(uploads.length,0,'pasting must not upload');
  await page.getByRole('button',{name:'移除图片 2',exact:true}).click();assert.equal(await page.getByLabel('待发送图片',{exact:true}).locator('img').count(),1);
  await page.getByRole('button',{name:'开始',exact:true}).click();await page.locator('#agent-in').waitFor();await page.locator('.ag-ai .chat-md strong').waitFor();
  assert.equal(bodies.length,1);assert.deepEqual(bodies[0]!.attachments,[{type:'file',id:'image-1'}]);assert.ok(uploads[0]!.includes(png),'original bytes uploaded');
  await page.locator('.ag-user img').waitFor();assert.equal(await page.locator('.ag-user img').getAttribute('src'),`data:image/png;base64,${png.toString('base64')}`);
  await paste('#agent-in');await page.locator('#agent-in').fill('看一下这张图');await page.getByRole('button',{name:'发送',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.ag-ai').length===2);
  assert.equal(bodies.length,2);assert.deepEqual(bodies[1]!.attachments,[{type:'file',id:'image-2'}]);
  fail=true;await paste('#agent-in');await page.locator('#agent-in').fill('失败后保留图片');await page.getByRole('button',{name:'发送',exact:true}).click();await page.getByLabel('待发送图片',{exact:true}).waitFor();assert.equal(bodies.length,2,'failed upload must not start conversation');
  fail=false;await page.getByRole('button',{name:'发送',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.ag-ai').length>=3 && !document.querySelector('.cmp-card.busy'));assert.equal(bodies.length,3);
  await paste('#agent-in');await page.locator('#agent-in').fill('__SLOW__');await page.getByRole('button',{name:'发送',exact:true}).click();
  await page.getByRole('button',{name:'停止',exact:true}).waitFor();await paste('#agent-in');await page.locator('#agent-in').fill('排队的图片');await page.locator('#agent-in').press('Enter');
  await page.waitForFunction(()=>document.querySelectorAll('.ag-ai .chat-md h2').length===5 && !document.querySelector('.cmp-card.busy'));
  assert.equal(bodies.length,5);assert.deepEqual(bodies[3]!.attachments,[{type:'file',id:'image-4'}]);assert.deepEqual(bodies[4]!.attachments,[{type:'file',id:'image-5'}]);
  await page.reload();await page.getByRole('button',{name:'最近项目',exact:true}).click();await page.getByText('请描述这些图片。', {exact:true}).first().click();await page.locator('.ag-user img').first().waitFor();assert.equal(await page.locator('.ag-user img').count(),6,'stored originals survive reload including failed turn');
  await page.evaluate(async()=>{
    const projects=await window.api.projects.list();const id=projects[0]!.id;
    await window.api.projects.edit(id,[{op:'insert',after:'end',type:'dialogue',text:'吃年糕'}]);
    await window.api.workflows.start(id,'jokes',{});
    window.dispatchEvent(new CustomEvent('scripter:note',{detail:id}));
  });
  await page.locator('.run .res-card .chat-md h2').first().waitFor();
  assert.equal(await page.locator('.run .res-card .chat-md strong').first().textContent(),'年糕');
  assert.equal(await page.locator('.run .res-card .chat-md li').count(),3);
  assert.equal(await page.getByRole('button',{name:'用这个',exact:true}).count(),3);
  await page.getByRole('button',{name:'好笑',exact:true}).first().click();
  await page.waitForFunction(async()=>{const p=(await window.api.projects.list())[0]!;return (await window.api.projects.open(p.id)).bible.jokes.length===1;});
  const id = await page.evaluate(async()=>(await window.api.projects.list())[0]!.id);
  await page.evaluate(async(id)=>{ await window.api.projects.setOutline(id,'原有大纲'); window.dispatchEvent(new CustomEvent('scripter:note',{detail:id})); },id);
  await page.locator('#plus').click();await page.getByRole('menuitem',{name:'快捷指令',exact:true}).click();await page.getByRole('menuitem',{name:/^总结大纲/}).click();
  await page.waitForFunction(async(id)=>(await window.api.projects.open(id)).outline.includes('发现年糕'),id);
  assert.equal(await page.locator('#agent-in').inputValue(),'','one click executes without Enter');
  assert.equal((await page.evaluate(async(id)=>window.api.projects.open(id),id)).nodes.length,1,'summary must not edit script');
  await page.getByRole('button',{name:'撤销',exact:true}).last().click();
  await page.waitForFunction(async(id)=>(await window.api.projects.open(id)).outline==='原有大纲',id);
  assert.equal((await page.evaluate(async(id)=>window.api.projects.open(id),id)).outline,'原有大纲','outline update is undoable');
  console.log('PASS: Home/project paste, thumbnails/removal, image-only send, original upload, failure retry, queued images, persisted history; skill Markdown and feedback actions; one-click outline summary and undo');
} catch (error) { console.log('DEBUG', await page.locator('body').innerText(), {requests:bodies.length,uploads:uploads.length}); throw error; } finally {await app.close();await new Promise<void>(r=>server.close(()=>r()));rmSync(tmp,{recursive:true,force:true});}
