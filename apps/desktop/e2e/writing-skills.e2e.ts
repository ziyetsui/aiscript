import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
const requests: { content: string; web_search?: boolean }[] = [];
let nodeId = '';
const server = createServer((req, res) => {
  const json = (status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (req.url!.includes('/users/me')) return json(200, { id: 'u1', email: 'test@example.com', is_active: true, activation_completed: true });
  if (req.method === 'POST' && req.url!.includes('/conversations')) {
    let raw = ''; req.on('data', (c) => raw += c); req.on('end', () => { requests.push(JSON.parse(raw)); json(202, { conversation_id: 'c1', stream_url: '/api/v1/conversations/c1/stream' }); }); return;
  }
  if (req.url!.includes('/stream')) {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    const content = requests.at(-1)!.content;
    const delta = content.includes('用户：__REWRITE__') ? `修改预览。<ops>${JSON.stringify([{ op: 'updateNode', id: nodeId, text: '修改后的对白' }])}</ops>` : '## 分析\n\n已按本次方法分析。';
    const finish = () => res.end(`data: ${JSON.stringify({ type: 'content', conversation_id: 'c1', message_id: 'm1', delta, created_at: 0 })}\n\ndata: ${JSON.stringify({ type: 'done', conversation_id: 'c1', message_id: 'm1', finish_reason: 'stop' })}\n\n`);
    if (content.includes('用户：__SLOW__')) setTimeout(finish, 1800); else finish(); return;
  }
  json(404, {});
});
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address() as { port: number };
const tmp = mkdtempSync(join(tmpdir(), 'scripter-skills-'));
const { privatePem, publicPem } = generateKeypair(); writeFileSync(join(tmp, 'pub.pem'), publicPem);
const app = await electron.launch({ args: [join(import.meta.dirname, '..')], env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: join(tmp, 'data'), SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: `http://127.0.0.1:${port}` } });
const page = await app.firstWindow();
// Hidden native windows cannot complete Playwright actionability checks on Windows.
if (process.platform === 'darwin') await app.evaluate(({ BrowserWindow }) => { for (const w of BrowserWindow.getAllWindows()) w.hide(); });
page.setDefaultTimeout(15000);
async function choose(query: string, title: string) {
  await page.locator('#plus').click();
  await page.getByRole('menuitem', { name: '快捷指令', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索编剧技能' }).fill(query);
  await page.getByRole('menuitem', { name: new RegExp(`^${title}`) }).click();
}
try {
  await page.locator('.mc .tnum').waitFor(); const machine = (await page.locator('.mc .tnum').textContent())!.trim();
  await page.locator('#code').fill(issueOfflineCode(privatePem, { mid: machine, cust: '技能测试', seat: '1/1', exp: null }));
  await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.locator('#k-ancher').fill('test-key'); await page.getByRole('button', { name: '验证并保存' }).click(); await page.locator('#ask').waitFor();
  await choose('昆曲', '曲牌体戏曲创作'); await page.locator('#ask').fill('分析这个设定');
  await page.getByRole('button', { name: '开始', exact: true }).click(); await page.locator('#agent-in').waitFor();
  await page.waitForFunction(() => !!document.querySelector('.ag-ai .chat-md'));
  assert.ok(requests[0]!.content.includes('\n### sw-chinese-opera-qupai\n'), 'Home selection survives edited starter and project creation');
  const project = await page.evaluate(async () => (await window.api.projects.list())[0]!.id);
  nodeId = await page.evaluate(async (id) => { const s = await window.api.projects.edit(id, [{ op: 'insert', after: 'end', type: 'dialogue', text: '原来的对白' }]); return s.nodes.at(-1)!.id; }, project);
  await choose('潜台词', '润色对白'); await page.locator('#agent-in').fill('__SLOW__'); await page.locator('#agent-in').press('Enter');
  await page.waitForFunction(() => !!document.querySelector('.cmp-card.busy'));
  await choose('角色小传', '角色小传与弧光'); await page.locator('#agent-in').fill('分析此人'); await page.locator('#agent-in').press('Enter');
  await page.waitForFunction(() => !document.querySelector('.cmp-card.busy') && !document.querySelector('.queue'));
  assert.equal(requests.length, 3);
  assert.ok(requests[1]!.content.includes('\n### sw-dialogue\n'));
  assert.ok(requests[2]!.content.includes('\n### sw-character-conflict\n'), 'queued messages keep their own selected skills');
  assert.ok(!requests[2]!.content.includes('\n### sw-dialogue\n'));
  await choose('对白', '润色对白'); await page.locator('#agent-in').fill('__REWRITE__'); await page.locator('#agent-in').press('Enter');
  await page.waitForFunction(() => !document.querySelector('.cmp-card.busy'));
  assert.equal((await page.evaluate(async (id) => window.api.projects.open(id), project)).nodes[0]!.text, '原来的对白', 'skill edits still wait for preview confirmation');
  await page.getByRole('button', { name: '接受', exact: true }).last().click();
  await page.waitForFunction(async (id) => (await window.api.projects.open(id)).nodes[0]?.text === '修改后的对白', project);
  await page.getByRole('button', { name: '撤销', exact: true }).last().click();
  await page.waitForFunction(async (id) => (await window.api.projects.open(id)).nodes[0]?.text === '原来的对白', project);
  await choose('原型建模', '原型建模');
  const starter = await page.locator('#agent-in').inputValue();
  assert.ok(starter.includes('仅分析'), 'modeling defaults to research without document writes');
  await page.locator('#agent-in').fill('研究逐字稿：00:04 角色说：我想拿到蛋糕。');
  await page.locator('#agent-in').press('Enter');
  await page.waitForFunction(() => !document.querySelector('.cmp-card.busy'));
  const modeling = requests.at(-1)!.content;
  assert.ok(modeling.includes('\n### prototype-modeling\n'));
  assert.ok(modeling.includes('# OUTPUT CONTRACT') && modeling.includes('# ULTIMATE GOAL'), 'complete research prompt reaches the SDK request');
  assert.ok(modeling.includes('00:04 角色说：我想拿到蛋糕。'));
  assert.equal((await page.evaluate(async (id) => window.api.projects.open(id), project)).nodes[0]!.text, '原来的对白');
  await page.locator('#plus').click(); await page.getByRole('menuitem', { name: '快捷指令', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索编剧技能' }).fill('不存在的技能');
  assert.equal(await page.locator('.pm-sub [role="status"]').innerText(), '没有匹配的技能');
  console.log('PASS: searchable skill menus, Home-to-project selection, edited prompts, queued selections, bounded real request methods, modification preview and undo');
} catch (error) { console.log('DEBUG', await page.locator('body').innerText(), { requests: requests.length }); throw error; }
finally { await app.close(); await new Promise<void>((r) => server.close(() => r())); rmSync(tmp, { recursive: true, force: true }); }
