import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright-core';
import { ScriptDoc } from '@scripter/core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { GOOD_KEY, startFakeAncher } from './fake-ancher.ts';
const tmp = mkdtempSync(join(tmpdir(), 'scripter-data-')), userData = join(tmp, 'data'), id = randomUUID();
const dir = join(userData, 'projects', id); mkdirSync(join(dir, 'files'), { recursive: true });
const doc = new ScriptDoc(); doc.setTitle('客户已有剧本'); doc.insert('end', 'heading', '内景 客厅 — 日'); doc.insert('end', 'action', '客户的剧本内容'); doc.commit();
const chat = Array.from({ length: 450 }, (_, i) => ({ id: randomUUID(), role: i % 2 ? 'ai' : 'user', text: `历史消息 ${i}`, at: i + 1 }));
const archive = Array.from({ length: 60 }, (_, i) => ({ id: randomUUID(), title: `历史会话 ${i}`, at: i, chat: [chat[i]], conversationId: null }));
writeFileSync(join(dir, 'meta.json'), JSON.stringify({ id, title: '客户已有剧本', kind: 'script', createdAt: 1, updatedAt: 1, words: 7, chat, archive, conversationId: null }));
writeFileSync(join(dir, 'script.loro'), doc.snapshot()); writeFileSync(join(dir, 'files', 'example.txt'), '客户附件');
const { privatePem, publicPem } = generateKeypair(); writeFileSync(join(tmp, 'pub.pem'), publicPem);
const fake = await startFakeAncher(); let app: ElectronApplication, page: Page;
async function launch() {
 app = await electron.launch({ args: [join(import.meta.dirname, '..')], env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: userData, SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: fake.url } });
 page = await app.firstWindow(); page.setDefaultTimeout(20000);
 if (process.platform === 'darwin') await app.evaluate(({ BrowserWindow }) => { for (const w of BrowserWindow.getAllWindows()) w.hide(); });
}
await launch();
try {
 await page.locator('.mc .tnum').waitFor(); const machine = (await page.locator('.mc .tnum').textContent())!.trim();
 await page.locator('#code').fill(issueOfflineCode(privatePem, { mid: machine, cust: '存储测试', seat: '1/1', exp: null })); await page.getByRole('button', { name: '激活', exact: true }).click();
 await page.locator('#k-ancher').fill(GOOD_KEY); await page.getByRole('button', { name: '验证并保存' }).click(); await page.locator('#ask').waitFor();
 let state = await page.evaluate((id) => window.api.projects.open(id), id);
 assert.equal(state.chat.length, 450); assert.equal(state.conversations.length, 60);
 assert.equal(readFileSync(join(dir, 'meta.json'), 'utf8').includes('历史消息 0'), true);
 await page.evaluate((id) => window.api.chat.newConversation(id), id);
 await page.evaluate((id) => window.api.ai.write({ reqId: 'durability-check', projectId: id, instruction: '验证数据保留', webSearch: false }), id);
 state = await page.evaluate((id) => window.api.projects.open(id), id); assert.equal(state.chat.length, 2); assert.equal(state.conversations.length, 61);
 const expectedTurns = state.turns.map((t) => t.id); assert.ok(expectedTurns.length);
 const old = state.conversations.find((c) => c.messages === 450)!; assert.ok(old);
 const restoredChat = await page.evaluate(({ id, conv }) => window.api.chat.openConversation(id, conv), { id, conv: old.id });
 assert.equal(restoredChat.chat.length, 450); assert.equal(restoredChat.chat[0]!.text, '历史消息 0');
 await page.evaluate((id) => window.api.chat.newConversation(id), id);
 const manual = await page.evaluate((id) => window.api.localData.backup(id), id);
 await app.close();
 // Simulate replacing an application build and stale/corrupt compatibility files.
 const db = new DatabaseSync(join(dir, 'project.sqlite')); db.prepare('UPDATE snapshot SET build=?').run('previous-customer-build'); db.close();
 writeFileSync(join(dir, 'meta.json'), '{broken compatibility mirror');
 await launch(); await page.locator('#ask').waitFor();
 state = await page.evaluate((id) => window.api.projects.open(id), id); assert.equal(state.conversations.length, 62);
 const info = await page.evaluate(async (id) => { await window.api.localData.backup(id); return window.api.localData.info(); }, id);
 assert.ok(info.projects.find((p) => p.id === id)!.backups.some((b) => b.reason === '升级前'));
 assert.equal(JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8')).id, id);
 await app.close(); writeFileSync(join(dir, 'project.sqlite'), 'damaged database');
 await launch(); await page.locator('#ask').waitFor();
 await assert.rejects(() => page.evaluate((id) => window.api.projects.open(id), id), /从备份恢复为副本/);
 // Settings offers backups even if the original DB cannot be opened.
 await page.getByRole('button', { name: '最近项目', exact: true }).click(); await page.getByRole('button', { name: '设置', exact: true }).click();
 await page.getByLabel('备份项目').selectOption(id); await page.getByLabel('本地备份').selectOption(manual); await page.getByRole('button', { name: '恢复为副本', exact: true }).click();
 await page.getByText(/已恢复为「客户已有剧本（备份恢复）/).waitFor();
 const copy = (await page.evaluate(() => window.api.projects.list())).find((p) => p.title.includes('备份恢复'))!;
 assert.ok(copy); assert.notEqual(copy.id, id);
 const recovered = await page.evaluate((id) => window.api.projects.open(id), copy.id); assert.equal(recovered.conversations.length, 62);
 assert.ok(expectedTurns.every((id) => recovered.turns.some((t) => t.id === id)), 'backup recovery must preserve AI undo history');
 assert.ok(recovered.conversations.some((c) => c.messages === 450)); assert.equal(readFileSync(join(userData, 'projects', copy.id, 'files', 'example.txt'), 'utf8'), '客户附件');
 assert.equal(readFileSync(join(dir, 'project.sqlite'), 'utf8'), 'damaged database');
 await app.close(); rmSync(join(userData, 'projects', copy.id, 'meta.json')); rmSync(join(userData, 'projects', copy.id, 'script.loro'));
 await launch(); await page.locator('#ask').waitFor(); await page.evaluate((id) => window.api.projects.remove(id), copy.id);
 assert.ok((await page.evaluate(() => window.api.projects.trashList())).some((p) => p.id === copy.id), 'SQLite-only projects must remain visible in recycle bin');
 await page.evaluate((id) => window.api.projects.restore(id), copy.id);
 assert.equal((await page.evaluate((id) => window.api.projects.open(id), copy.id)).conversations.length, 62);
 const inFlight = page.evaluate((id) => window.api.ai.write({ reqId: 'pending-prompt', projectId: id, instruction: '__SLOW__ 客户尚在等待的提问', webSearch: false }), copy.id).catch(() => {});
 let persisted = false;
 for (let n = 0; n < 40 && !persisted; n++) {
   await page.waitForTimeout(50);
   const pendingDb = new DatabaseSync(join(userData, 'projects', copy.id, 'project.sqlite'), { readOnly: true });
   try { persisted = String(pendingDb.prepare('SELECT meta FROM snapshot WHERE id=1').get()?.meta).includes('客户尚在等待的提问'); } finally { pendingDb.close(); }
 }
 assert.equal(persisted, true, 'a user prompt must reach disk before the remote model returns');
 await app.close(); await inFlight; await launch(); await page.locator('#ask').waitFor();
 assert.ok((await page.evaluate((id) => window.api.projects.open(id), copy.id)).chat.some((m) => m.text === '__SLOW__ 客户尚在等待的提问'));
 console.log('SQLite E2E passed: migration, >400 messages, >50 conversations, build update, mirror repair, corrupt DB and settings recovery as copy.');
} finally { await app.close().catch(() => {}); fake.server.closeAllConnections(); fake.server.close(); rmSync(tmp, { recursive: true, force: true }); }
