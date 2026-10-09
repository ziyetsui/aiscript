// Real Electron + renderer + IPC + official SDK; only the remote account is isolated.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { cloudNote, cloudCollection, GOOD_KEY, startFakeAncher } from './fake-ancher.ts';
const fake = await startFakeAncher();
fake.cloudNotes.splice(0, 1, ...Array.from({ length: 5 }, (_, i) => ({ ...cloudNote(`n${i + 1}`), title: `笔记 ${i + 1}`, created_at: 1750000000 + i, updated_at: 1750000100 - i, status: i === 4 ? 'error' : 'ready' })));
const collections = [cloudCollection];
const pins = new Set(['n1']);
let failId = '';
const mutations: { method: string; path: string; body: Record<string, unknown> }[] = [];
const original = fake.server.listeners('request')[0] as (req: IncomingMessage, res: ServerResponse) => void;
fake.server.removeAllListeners('request');
fake.server.on('request', (req, res) => {
  const path = new URL(req.url || '', 'http://localhost').pathname;
  const json = (status: number, body: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (req.method === 'GET' && path === '/api/v1/collections/') return json(200, { items: collections, has_more: false });
  if (req.method === 'GET' && path === '/api/v1/pinned/') return json(200, { items: [...pins].map(entity_id => ({ type: 'note', entity_id, index: 0, note: fake.cloudNotes.find(n => n.id === entity_id) })), has_more: false });
  if (req.method === 'GET' || !/^\/api\/v1\/(notes|collections|pinned)/.test(path) || path.endsWith('/presigned-urls')) return original(req, res);
  let body = ''; req.on('data', c => { body += c; }); req.on('end', () => {
    const data = body ? JSON.parse(body) : {};
    mutations.push({ method: req.method!, path, body: data });
    const id = path.split('/')[4];
    if (failId && (id === failId || data.note_id === failId)) return json(403, { message: '隔离账号测试失败' });
    if (req.method === 'POST' && path === '/api/v1/collections/') { const c = { ...cloudCollection, id: 'new-c', name: data.name, color: data.color }; collections.push(c); return json(200, c); }
    if (req.method === 'POST' && path.endsWith('/notes')) { const note = fake.cloudNotes.find(n => n.id === data.note_id)!; const c = collections.find(c => c.id === id)!; if (!note.collections.some(v => v.id === id)) note.collections.push(c); return json(200, c); }
    if (req.method === 'POST' && path === '/api/v1/pinned/') { pins.add(data.entity_id); return json(200, {}); }
    if (req.method === 'DELETE' && path.startsWith('/api/v1/pinned/')) { pins.delete(id!); return json(200, {}); }
    const note = fake.cloudNotes.find(n => n.id === id);
    if (!note) return json(404, { message: 'missing note' });
    if (req.method === 'PATCH') { Object.assign(note, data, { updated_at: Date.now() / 1000 }); return json(200, note); }
    if (req.method === 'POST' && path.endsWith('/retry')) { note.status = 'processing'; return json(200, note); }
    if (req.method === 'DELETE') { fake.cloudNotes.splice(fake.cloudNotes.indexOf(note), 1); pins.delete(note.id); return json(200, {}); }
    json(404, {});
  });
});
const tmp = mkdtempSync(join(tmpdir(), 'scripter-note-selection-'));
const { privatePem, publicPem } = generateKeypair(); writeFileSync(join(tmp, 'pub.pem'), publicPem);
const app = await electron.launch({ args: [join(import.meta.dirname, '..')], env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: join(tmp, 'data'), SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: fake.url } });
const page = await app.firstWindow(); page.setDefaultTimeout(15000);
try {
  await page.locator('.mc .tnum').waitFor();
  await page.locator('#code').fill(issueOfflineCode(privatePem, { mid: (await page.locator('.mc .tnum').textContent())!.trim(), cust: '多选隔离测试', seat: '1/1', exp: null }));
  await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.locator('#k-ancher').fill(GOOD_KEY); await page.getByRole('button', { name: '验证并保存' }).click();
  await page.getByText('已激活 · Ancher 已连接').waitFor();
  await page.evaluate(() => window.api.projects.create('多选隔离项目', 'script'));
  await page.getByRole('button', { name: '最近项目', exact: true }).click(); await page.getByRole('button', { name: '多选隔离项目', exact: true }).click();
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  const all = page.locator('.note-all');
  await all.locator('[data-note-id="n1"]').waitFor();
  await page.getByRole('button', { name: '多选笔记', exact: true }).click();
  await all.getByRole('checkbox', { name: '选择 笔记 1', exact: true }).click();
  await all.getByRole('checkbox', { name: '选择 笔记 3', exact: true }).click({ modifiers: ['Shift'] });
  assert.equal(await all.getByRole('checkbox', { checked: true }).count(), 3, 'Shift range follows displayed updated order');
  await page.getByRole('button', { name: '批量添加到对话', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.cloud-selection-bar'));
  assert.equal(await page.locator('.chat-note-chip').count(), 3, 'all selected notes must reach the chat composer');
  // Filtered select-all must not select hidden notes; pending/error disables chat attach.
  await page.getByRole('textbox', { name: '搜索 Ancher 笔记' }).fill('笔记 5');
  await page.getByRole('button', { name: '全选当前笔记' }).click();
  assert.equal(await all.getByRole('checkbox', { checked: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: '批量添加到对话' }).isDisabled(), true);
  await page.getByRole('button', { name: '取消选择', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索 Ancher 笔记' }).fill('');
  await page.getByRole('button', { name: '排序 Ancher 笔记' }).click();
  await page.getByRole('menuitemradio', { name: '最新创建', exact: true }).click();
  assert.equal(await all.locator('[data-note-id]').first().getAttribute('data-note-id'), 'n5');
  // Checkbox selection must not change the open note.
  const before = await page.locator('.cloud-note-title').innerText();
  await all.getByRole('checkbox', { name: '选择 笔记 2', exact: true }).click();
  assert.equal(await page.locator('.cloud-note-title').innerText(), before);
  await page.getByRole('button', { name: '批量添加到合集' }).click();
  const collect = page.getByRole('dialog', { name: '添加到合集', exact: true });
  await collect.getByRole('textbox', { name: '搜索或新建合集' }).fill('新参考');
  await collect.getByRole('button', { name: '新建合集“新参考”' }).click();
  await collect.getByRole('button', { name: '添加到 1 个合集' }).click();
  await collect.waitFor({ state: 'hidden' });
  assert.deepEqual(fake.cloudNotes.find(n => n.id === 'n2')!.collections.map(c => c.id), ['cloud-c1', 'new-c']);
  assert.ok(mutations.some(m => m.method === 'POST' && m.path === '/api/v1/collections/new-c/notes' && m.body.note_id === 'n2'));
  await all.getByRole('button', { name: '操作 笔记 2', exact: true }).click(); await page.getByRole('menuitem', { name: '重命名', exact: true }).click();
  const patchesBefore = mutations.filter(m => m.method === 'PATCH').length;
  await page.getByRole('textbox', { name: '笔记标题', exact: true }).fill('取消的标题');
  await page.getByRole('textbox', { name: '笔记标题', exact: true }).press('Escape');
  assert.equal(mutations.filter(m => m.method === 'PATCH').length, patchesBefore);
  await all.getByRole('button', { name: '操作 笔记 2', exact: true }).click(); await page.getByRole('menuitem', { name: '重命名', exact: true }).click();
  await page.getByRole('textbox', { name: '笔记标题', exact: true }).fill('重新命名'); await page.getByRole('button', { name: '保存标题', exact: true }).click();
  await all.getByRole('button', { name: '操作 重新命名', exact: true }).waitFor();
  await all.getByRole('button', { name: '操作 重新命名', exact: true }).click(); await page.getByRole('menuitem', { name: '固定笔记', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.note-group .note-items [data-note-id="n2"]'));
  assert.equal(pins.has('n2'), true);
  await all.getByRole('button', { name: '操作 重新命名', exact: true }).click(); await page.getByRole('menuitem', { name: '分享', exact: true }).click();
  await page.getByRole('button', { name: '开启公开分享', exact: true }).click();
  assert.equal(await page.getByRole('textbox', { name: '分享链接' }).inputValue(), 'https://app.ancher.ai/notes/n2');
  await page.getByRole('button', { name: '关闭公开分享', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('input[aria-label="分享链接"]'));
  assert.equal(fake.cloudNotes.find(n => n.id === 'n2')!.is_public, false);
  await page.getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click();
  // Cancel has no API side effect; partial failure retains only failed selections.
  await all.getByRole('checkbox', { name: '选择 笔记 3', exact: true }).click();
  await all.getByRole('checkbox', { name: '选择 笔记 4', exact: true }).click();
  await page.getByRole('button', { name: '批量删除笔记' }).click();
  const deletedBefore = mutations.filter(m => m.method === 'DELETE').length;
  await page.getByRole('dialog').getByRole('button', { name: '取消', exact: true }).click();
  assert.equal(mutations.filter(m => m.method === 'DELETE').length, deletedBefore);
  failId = 'n4';
  await page.getByRole('button', { name: '批量删除笔记' }).click(); await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await page.getByRole('dialog').getByRole('alert').waitFor();
  assert.equal(fake.cloudNotes.some(n => n.id === 'n3'), false);
  assert.equal(fake.cloudNotes.some(n => n.id === 'n4'), true);
  assert.equal(await all.getByRole('checkbox', { checked: true }).count(), 1);
  failId = ''; await page.getByRole('button', { name: '确认删除', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' });
  // Project notes remain available and never share remote deletion state.
  await page.getByRole('tab', { name: '项目笔记', exact: true }).click(); await page.getByRole('tab', { name: 'Ancher 笔记', exact: true }).click();
  await page.getByRole('button', { name: '多选笔记', exact: true }).click();
  await all.locator('[data-note-id="n1"]').focus(); await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
  assert.equal(await all.getByRole('checkbox', { checked: true }).count(), 3);
  await page.keyboard.press('Escape'); assert.equal(await page.locator('.cloud-selection-bar').count(), 0);
  await all.locator('.cloud-note-row').filter({ has: page.locator('[data-note-id="n1"]') }).dragTo(all.locator('.cloud-note-row').filter({ has: page.locator('[data-note-id="n5"]') }));
  assert.equal(await all.locator('[data-note-id]').first().getAttribute('data-note-id'), 'n1', 'dragging switches to manual display order');
  mkdirSync(join(import.meta.dirname, 'shots'), { recursive: true });
  await page.getByRole('button', { name: '全选当前笔记' }).click();
  await page.screenshot({ path: join(import.meta.dirname, 'shots/note-selection.png') });
  console.log('PASS: multi-select, Shift range, filtered select-all, sort, additive collections, rename, pin, share/privacy, delete cancel and partial failure, keyboard shortcuts, project notes');
} finally { await app.close(); fake.server.close(); rmSync(tmp, { recursive: true, force: true }); }
