import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
const requests: any[] = [];
const question = { kind: 'clarification_requested', request_id: 'r1', conversation_id: 'c1', message_id: 'm1', reason: '确认目标', questions: [{ id: 'q1', prompt: '请确认写入哪份剧本？', header: null, reason: null, options: [], free_text: { label: '说明', placeholder: null } }], remaining_question_budget: 1 };
const server = createServer((req, res) => {
  const json = (body: unknown, status = 200) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (req.url!.includes('/users/me')) return json({ id: 'u1', email: 'test@example.com', is_active: true, activation_completed: true });
  if (req.method === 'POST' && req.url!.includes('/conversations')) {
    let body = ''; req.on('data', (c) => body += c); req.on('end', () => {
      const parsed = JSON.parse(body);
      if (parsed.clarification && (parsed.content || parsed.attachments || parsed.voice_file_id)) return json({ error: { message: 'clarification cannot be combined with content, voice_file_id, or attachments' } }, 422);
      requests.push(parsed); json({ conversation_id: 'c1', stream_url: '/api/v1/conversations/c1/stream' }, 202);
    }); return;
  }
  if (req.url!.endsWith('/stream')) {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    const event = (e: unknown) => res.write(`data: ${JSON.stringify(e)}\n\n`);
    if (requests.length === 1) {
      event({ type: 'clarification_requested', clarification: question, conversation_id: 'c1', message_id: 'm1' });
      event({ type: 'done', conversation_id: 'c1', message_id: 'm1', finish_reason: 'clarification_requested' });
    } else {
      event({ type: 'content', conversation_id: 'c1', message_id: 'm2', delta: '完成。<ops>[{"op":"insertNode","after":"end","type":"heading","text":"内景 原创工作室 — 日"}]</ops>', created_at: 0 });
      event({ type: 'done', conversation_id: 'c1', message_id: 'm2', finish_reason: 'stop' });
    }
    res.end(); return;
  }
  json({}, 404);
});
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address() as { port: number };
const tmp = mkdtempSync(join(tmpdir(), 'scripter-clarification-'));
const { privatePem, publicPem } = generateKeypair(); writeFileSync(join(tmp, 'pub.pem'), publicPem);
async function launch() {
  const app = await electron.launch({ args: [join(import.meta.dirname, '..')], env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: join(tmp, 'data'), SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: `http://127.0.0.1:${port}` } });
  const page = await app.firstWindow();
  if (process.platform === 'darwin') await app.evaluate(({ BrowserWindow }) => { for (const w of BrowserWindow.getAllWindows()) w.hide(); });
  page.setDefaultTimeout(15000);
  return { app, page };
}
let { app, page } = await launch();
try {
  await page.locator('.mc .tnum').waitFor(); const mid = (await page.locator('.mc .tnum').innerText()).trim();
  await page.locator('#code').fill(issueOfflineCode(privatePem, { mid, cust: '确认测试', seat: '1/1', exp: null })); await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.locator('#k-ancher').fill('test-key'); await page.getByRole('button', { name: '验证并保存' }).click();
  await page.locator('#ask').fill('请写入剧本'); await page.getByRole('button', { name: '开始', exact: true }).click();
  await page.getByText('等待你确认：', { exact: false }).waitFor();
  await page.waitForFunction(() => !document.querySelector('.cmp-card.busy'));
  const id = await page.evaluate(async () => (await window.api.projects.list())[0]!.id);
  assert.equal(requests.length, 1, 'no repair request while waiting for clarification');
  assert.equal((await page.evaluate(async (id) => window.api.projects.open(id), id)).nodes.length, 0);
  await app.close(); ({ app, page } = await launch());
  await page.getByRole('button', { name: '最近项目', exact: true }).click(); await page.getByRole('button', { name: '请写入剧本', exact: true }).click();
  await page.locator('#agent-in').fill('就是添加的文档提示词，写入本集剧本'); await page.locator('#agent-in').press('Enter');
  await page.waitForFunction(async (id) => (await window.api.projects.open(id)).nodes.some((n) => n.text === '内景 原创工作室 — 日'), id);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1].clarification, { action: 'answer', request_id: 'r1', answers: [{ question_id: 'q1', value: '就是添加的文档提示词，写入本集剧本' }], note: '就是添加的文档提示词，写入本集剧本' });
  console.log('PASS: clarification displayed, no repair/no writes before answer, restart persistence, normal reply resumes and writes');
} finally { await app.close(); await new Promise<void>((r) => server.close(() => r())); rmSync(tmp, { recursive: true, force: true }); }
