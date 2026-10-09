import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { startFakeAncher, GOOD_KEY } from './fake-ancher.ts';
const tmp = mkdtempSync(join(tmpdir(), 'scripter-export-'));
const { privatePem, publicPem } = generateKeypair();
writeFileSync(join(tmp, 'pub.pem'), publicPem);
const fake = await startFakeAncher();
const app = await electron.launch({ args: [join(import.meta.dirname, '..')], env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: join(tmp, 'data'), SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: fake.url } });
const page = await app.firstWindow();
if (process.platform === 'darwin') await app.evaluate(({ BrowserWindow }) => { for (const w of BrowserWindow.getAllWindows()) w.hide(); });
page.setDefaultTimeout(15000);
try {
  await page.locator('.mc .tnum').waitFor();
  const mid = (await page.locator('.mc .tnum').innerText()).trim();
  await page.locator('#code').fill(issueOfflineCode(privatePem, { mid, cust: '导出测试', seat: '1/1', exp: null }));
  await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.locator('#k-ancher').fill(GOOD_KEY); await page.getByRole('button', { name: '验证并保存' }).click();
  await page.locator('#plus').click(); await page.getByRole('menuitem', { name: '空白剧本', exact: true }).click();
  await page.getByRole('tab', { name: '大纲', exact: true }).waitFor();
  const id = await page.evaluate(async () => (await window.api.projects.list())[0]!.id);
  await page.evaluate(async (id) => {
    await window.api.projects.setOutline(id, '第一集大纲内容');
    await window.api.projects.edit(id, [{ op: 'insert', after: 'end', type: 'heading', text: '内景 老屋 — 日' }]);
    await window.api.projects.episode(id, 'create', undefined, '第二集');
    await window.api.projects.setOutline(id, '# 第二集大纲\n独有的大纲正文');
    await window.api.projects.setBeats(id, '独有的节拍正文');
    await window.api.projects.edit(id, [{ op: 'insert', after: 'end', type: 'heading', text: '外景 学校 — 日' }, { op: 'insert', after: 'end', type: 'action', text: '独有的剧本正文' }]);
  }, id);
  // Reopen to load the episode and data created through IPC.
  await page.getByRole('button', { name: '返回首页', exact: true }).first().click();
  await page.getByRole('button', { name: '最近项目', exact: true }).click();
  await page.getByRole('button', { name: /未命名剧本/ }).first().click();
  for (const [tab, content] of [['大纲','outline'], ['分镜','shots'], ['剧本','script']] as const) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await page.waitForFunction((name) => document.querySelector('[role=tab][aria-selected=true]')?.textContent === name, tab);
    
    await page.getByRole('button', { name: '导出', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: '导出', exact: true });
    await page.waitForFunction((content) => document.querySelector<HTMLInputElement>('input[name=content]:checked')?.value === content, content);
    assert.equal(await drawer.getByRole('checkbox', { name: /导出分集/ }).filter({ visible: true }).evaluateAll((els) => els.filter((e) => (e as HTMLInputElement).checked).length), 1);
    await drawer.getByRole('button', { name: '关闭', exact: true }).click();
  }
  const ep = (await page.evaluate(async (id) => window.api.projects.open(id), id)).activeEpisodeId;
  for (const content of ['script','outline','beats','scenes','shots','characters','locations','props'] as const) {
    for (const format of ['txt','docx','pdf'] as const) {
      const path = join(tmp, `${content}.${format}`);
      await app.evaluate(({ dialog }, path) => { dialog.showSaveDialog = (async () => ({ canceled: false, filePath: path })) as typeof dialog.showSaveDialog; }, path);
      const result = await page.evaluate(async ({ id, ep, content, format }) => window.api.exporter.save(id, format, { episodes: [ep], content, format, layout: 'asian', texture: false, font: 'typewriter' }), { id, ep, content, format });
      assert.equal(result.ok, true);
      const bytes = readFileSync(path);
      if (format === 'pdf') { assert.ok(bytes.subarray(0, 5).toString() === '%PDF-' && bytes.length > 1000); }
      else {
        const text = format === 'txt' ? bytes.toString('utf8') : strFromU8(unzipSync(bytes)['word/document.xml']!);
        if (content === 'outline') { assert.ok(text.includes('独有的大纲正文')); assert.ok(!text.includes('独有的剧本正文') && !text.includes('第一集大纲内容')); }
        if (content === 'beats') assert.ok(text.includes('独有的节拍正文'));
        if (content === 'script') assert.ok(text.includes('独有的剧本正文'));
      }
    }
  }
  for (const format of ['fdx','fountain'] as const) {
    const path = join(tmp, `script.${format}`);
    await app.evaluate(({ dialog }, path) => { dialog.showSaveDialog = (async () => ({ canceled: false, filePath: path })) as typeof dialog.showSaveDialog; }, path);
    assert.equal((await page.evaluate(async ({ id, ep, format }) => window.api.exporter.save(id, format, { episodes: [ep], content: 'script', format, layout: 'hollywood', texture: false, font: 'typewriter' }), { id, ep, format })).ok, true);
    assert.ok(readFileSync(path, 'utf8').includes('独有的剧本正文'));
  }
  const arc = join(tmp, 'project.scripter');
  await app.evaluate(({ dialog }, path) => { dialog.showSaveDialog = (async () => ({ canceled: false, filePath: path })) as typeof dialog.showSaveDialog; }, arc);
  assert.equal((await page.evaluate(async (id) => window.api.projects.exportArchive(id), id)).ok, true);
  const files = unzipSync(readFileSync(arc)); assert.ok(files['script.loro'] && files['meta.json']);
  console.log('PASS: current page/episode defaults, 24 document exports, FDX/Fountain and project archive');
} finally { await app.close(); await new Promise<void>((r) => fake.server.close(() => r())); rmSync(tmp, { recursive: true, force: true }); }
