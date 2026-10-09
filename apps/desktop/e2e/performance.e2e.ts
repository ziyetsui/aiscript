// Real renderer + IPC + Loro, with only the remote SDK service replaced. Never uses customer data.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ServerResponse, IncomingMessage } from 'node:http';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { GOOD_KEY, startFakeAncher } from './fake-ancher.ts';

const fake = await startFakeAncher();
const original = fake.server.listeners('request')[0] as (req: IncomingMessage, res: ServerResponse) => void;
let streaming: ServerResponse | undefined;
const content = (delta: string) => `data: ${JSON.stringify({ type: 'content', conversation_id: 'c1', message_id: 'm1', delta })}\n\n`;
const done = `data: ${JSON.stringify({ type: 'done', conversation_id: 'c1', message_id: 'm1', finish_reason: 'stop' })}\n\n`;
const paragraph = '故事里的小狐狸决定亲手修好这座桥。'.repeat(8);
fake.server.removeAllListeners('request');
fake.server.on('request', (req, res) => {
  const instruction = (fake.prompts.at(-1) ?? '').split('用户：').at(-1) ?? '';
  if (req.method !== 'GET' || !req.url?.startsWith('/api/v1/conversations/c1/stream') || !instruction.startsWith('__PERF_')) { original(req, res); return; }
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  if (instruction.startsWith('__PERF_STREAM__')) { streaming = res; res.write(content('正在整理故事。')); return; }
  const text = instruction.startsWith('__PERF_INSERT__')
    ? `已写入。<ops>${JSON.stringify(Array.from({ length: 120 }, () => ({ op: 'insertNode', after: 'end', type: 'action', text: paragraph })))}</ops>`
    : '# 原型模型\n\n' + Array.from({ length: 60 }, (_, i) => `## 原理 ${i + 1}\n\n**观察**：角色行动产生后果。\n\n| 变量 | 证据 |\n| --- | --- |\n| 目标 | 修桥 |\n`).join('\n');
  res.write(content(text)); res.end(done);
});

const tmp = mkdtempSync(join(tmpdir(), 'scripter-perf-'));
const { privatePem, publicPem } = generateKeypair();
writeFileSync(join(tmp, 'pub.pem'), publicPem);
const app = await electron.launch({ args: [join(import.meta.dirname, '..')], env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: join(tmp, 'data'), SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: fake.url } });
const page = await app.firstWindow();
page.setDefaultTimeout(20000);
await page.emulateMedia({ reducedMotion: 'no-preference' });
const cdp = await page.context().newCDPSession(page);
const measurements: Record<string, unknown> = {};
try {
  await page.locator('.mc .tnum').waitFor();
  const mid = (await page.locator('.mc .tnum').textContent())!.trim();
  await page.locator('#code').fill(issueOfflineCode(privatePem, { mid, cust: '性能回归测试', seat: '1/1', exp: null }));
  await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.locator('#k-ancher').fill(GOOD_KEY);
  await page.getByRole('button', { name: '验证并保存' }).click();
  await page.getByText('已激活 · Ancher 已连接').waitFor();
  const project = await page.evaluate(() => window.api.projects.create('性能隔离项目', 'script'));
  // Count calls at the real IPC boundary, preserving the registered permission gate and handler.
  await app.evaluate(({ ipcMain }) => {
    const host = ipcMain as unknown as { _invokeHandlers: Map<string, (...args: unknown[]) => unknown> };
    const handler = host._invokeHandlers.get('projects:open')!;
    (globalThis as unknown as { projectOpens: number }).projectOpens = 0;
    ipcMain.removeHandler('projects:open');
    ipcMain.handle('projects:open', (...args) => { (globalThis as unknown as { projectOpens: number }).projectOpens++; return handler(...args); });
  });
  await page.getByRole('button', { name: '最近项目', exact: true }).click();
  await page.getByRole('button', { name: '性能隔离项目', exact: true }).click();
  await page.locator('#agent-in').waitFor();
  await page.waitForTimeout(200); // Allow initial status IPC/effects to settle before counting.
  measurements.projectOpens = await app.evaluate(() => (globalThis as unknown as { projectOpens: number }).projectOpens);
  const send = async (text: string) => {
    await page.locator('#agent-in').fill(text);
    await page.getByRole('button', { name: '发送', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.cmp-card.busy'));
  };
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
  const counts = async () => {
    const coverage = await cdp.send('Profiler.takePreciseCoverage');
    const count = (name: string) => coverage.result.flatMap(s => s.functions).filter(f => f.functionName === name).reduce((n, f) => n + (f.ranges[0]?.count ?? 0), 0);
    return { workspace: count('Workspace'), markdown: count('Markdown') + count('Markdown2') };
  };
  // Verify coverage can see the actual renderer functions before trusting a zero count.
  await send('__PERF_HISTORY__ 分析故事模型');
  await page.locator('.chat-md h2').first().waitFor();
  const control = await counts();
  console.log('coverage control:', control);
  assert.ok(control.workspace > 0 && control.markdown > 0, 'coverage must observe a real workspace render and its first Markdown render');
  await counts();
  await page.locator('#agent-in').pressSequentially('中文草稿 abc');
  measurements.draft = await counts();
  assert.equal(await page.locator('#agent-in').inputValue(), '中文草稿 abc');
  await page.getByRole('button', { name: '角色', exact: true }).click();
  await page.getByRole('button', { name: '写作', exact: true }).click();
  assert.equal(await page.locator('#agent-in').inputValue(), '中文草稿 abc', 'draft survives page switches');
  await page.locator('#agent-in').fill('__PERF_STREAM__ 分析故事');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await page.getByRole('button', { name: '正在思考', exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '正在思考', exact: true }).click();
  await page.locator('.thinking-body').waitFor();
  await page.waitForTimeout(100);
  await counts();
  for (let i = 0; i < 30; i++) { streaming!.write(content(`片段${i}。`)); await page.waitForTimeout(20); }
  await page.getByText(/片段29。/, { exact: false }).waitFor();
  measurements.stream = await counts();
  await page.getByRole('button', { name: '角色', exact: true }).click();
  const thinking = page.getByRole('button', { name: '正在思考', exact: true }).filter({ visible: true });
  assert.equal(await thinking.isEnabled(), true, 'stream prefix survives moving the chat into the dock');
  await thinking.click();
  assert.ok((await page.locator('.thinking-body').filter({ visible: true }).innerText()).includes('片段0。'));
  await page.getByRole('button', { name: '写作', exact: true }).click();
  streaming!.write(content('尾部必须保留。')); streaming!.end(done);
  await page.waitForFunction(() => !document.querySelector('.cmp-card.busy'));
  assert.ok((await page.locator('.ag-ai').last().innerText()).includes('片段29。尾部必须保留。'), 'final delta is not dropped');
  await send('__PERF_INSERT__ 写入剧本');
  measurements.availableNodes = await page.locator('.paper .node').count();
  measurements.completeNodes = await page.locator('.paper .node').evaluateAll((nodes, text) => nodes.filter(n => n.textContent === text && n.getAttribute('contenteditable') === 'plaintext-only').length, paragraph);
  console.log(JSON.stringify(measurements, null, 2));
  if (process.env.SCRIPTER_PERF_BASELINE !== '1') {
    assert.equal(measurements.projectOpens, 1, 'one complete initial project read');
    assert.deepEqual(measurements.draft, { workspace: 0, markdown: 0 }, 'typing must not rebuild the workspace or completed Markdown');
    assert.deepEqual(measurements.stream, { workspace: 0, markdown: 0 }, 'streaming must not rebuild the workspace or completed Markdown');
    assert.equal(measurements.availableNodes, 120, 'all committed nodes are immediately accessible');
    assert.equal(measurements.completeNodes, 120, 'all committed text is complete and editable');
  }
  await page.getByRole('button', { name: '撤销最近一轮修改', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.paper .node[data-id]').length === 0);
  assert.equal((await page.evaluate(id => window.api.projects.open(id), project.id)).nodes.length, 0);
  console.log('PASS: isolated performance journeys and atomic undo');
} finally {
  await cdp.detach(); await app.close();
  streaming?.destroy(); fake.server.closeAllConnections(); await new Promise<void>(resolve => fake.server.close(() => resolve()));
  rmSync(tmp, { recursive: true, force: true });
}
