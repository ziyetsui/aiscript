// End-to-end: drives the real Electron build (spec 0002 §12.2 ④, Phase 2–3 acceptance).
// Run: pnpm --filter @scripter/desktop e2e   (builds first). Screenshots → e2e/shots/.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { GOOD_KEY, startFakeAncher } from './fake-ancher.ts';

const here = import.meta.dirname;
const shots = join(here, 'shots');
mkdirSync(shots, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'scripter-e2e-'));
const userData = join(tmp, 'data');
const { privatePem, publicPem } = generateKeypair();
writeFileSync(join(tmp, 'pub.pem'), publicPem);
const fake = await startFakeAncher();

async function launch(): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    args: [join(here, '..')],
    env: { ...process.env, SCRIPTER_USER_DATA: userData, SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: fake.url },
  });
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  return { app, page };
}
const shot = (page: Page, name: string) => page.screenshot({ path: join(shots, `${name}.png`) });
const step = (s: string) => console.log(`• ${s}`);

let { app, page } = await launch();
try {
  step('activation page shows the machine code; a code for another machine is refused');
  await page.getByRole('heading', { name: '激活 Ancher Scripter' }).waitFor();
  const machine = (await page.locator('.mc .tnum').textContent())!.trim();
  assert.match(machine, /^AS-/);
  await shot(page, '01-activate');
  const wrong = issueOfflineCode(privatePem, { mid: 'AS-0000-0000-0000-0000', cust: '测试', seat: '1/3', exp: null });
  await page.locator('#code').fill(wrong);
  await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '另一台电脑' }).waitFor();

  step('the right machine-bound code activates');
  await page.locator('#code').fill(issueOfflineCode(privatePem, { mid: machine, cust: '测试工作室', seat: '1/3', exp: null }));
  await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.getByRole('heading', { name: '连接 Ancher' }).waitFor();

  step('a bad Ancher key is rejected, a good one is stored');
  await page.locator('#k-ancher').fill('nope');
  await page.getByRole('button', { name: '验证并保存' }).click();
  await page.getByRole('alert').filter({ hasText: 'Ancher key 无效' }).waitFor();
  await page.locator('#k-ancher').fill(GOOD_KEY);
  await page.getByRole('button', { name: '验证并保存' }).click();
  await page.getByText('已激活 · Ancher 已连接').waitFor();
  const secrets = readFileSync(join(userData, 'secrets.json'), 'utf8');
  assert.ok(!secrets.includes(GOOD_KEY), 'key must not be stored in plain text');

  step('intent chip opens suggestions; picking one fills the box');
  await page.getByRole('button', { name: '灵感' }).click();
  await page.getByRole('option', { name: '把这个设定演成三种不同走向' }).waitFor();
  await shot(page, '02-home-intents');
  await page.getByRole('button', { name: '关闭建议' }).click();

  step('send an idea → workspace → AI writes 4 nodes as one turn, typed out');
  await page.locator('#ask').fill('胡同里的小男孩发现自家门墩儿会说话，写第一场');
  await page.getByRole('button', { name: '开始' }).click();
  await page.getByText('写入 4 处修改').waitFor({ timeout: 20_000 });
  await page.waitForFunction(() => !document.querySelector('.node.caret') && document.querySelectorAll('.paper .node').length === 4, null, { timeout: 20_000 });
  assert.deepEqual(await page.locator('.paper .node').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.type)), ['heading', 'action', 'character', 'dialogue']);
  assert.ok(fake.prompts[0]!.includes('<ops>') && fake.prompts[0]!.includes('门墩儿会说话'), 'prompt carries the ops contract and the idea');
  await page.getByRole('button', { name: /1\. 外景 胡同口/ }).waitFor();
  await shot(page, '03-workspace-ai');

  step('writer types: Enter after dialogue → character line; Tab / Shift+Tab cycle the format');
  const last = page.locator('.paper .node').last();
  await last.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('豆豆');
  assert.equal(await page.locator('.paper .node').last().getAttribute('data-type'), 'character');
  await page.keyboard.press('Enter');
  await page.keyboard.type('石头……石头说话了？');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.paper .node').last().getAttribute('data-type'), 'transition');
  await page.keyboard.press('Shift+Tab'); // back to dialogue
  assert.equal(await page.locator('.paper .node').last().getAttribute('data-type'), 'dialogue');
  await page.waitForTimeout(600); // debounce → saved

  step('undo the AI turn: its 4 nodes go, the writer’s 2 lines stay');
  await page.getByRole('button', { name: '撤销' }).click();
  await page.getByText('已撤销', { exact: true }).waitFor();
  assert.deepEqual(await page.locator('.paper .node').allTextContents(), ['豆豆', '石头……石头说话了？']);

  step('export FDX and PDF (save dialog stubbed)');
  for (const [fmt, label] of [['fdx', 'Final Draft'], ['pdf', 'PDF']] as const) {
    const out = join(tmp, `out.${fmt}`);
    await app.evaluate(({ dialog }, p) => { dialog.showSaveDialog = (async () => ({ canceled: false, filePath: p })) as typeof dialog.showSaveDialog; }, out);
    await page.getByRole('button', { name: '导出' }).click();
    await page.getByRole('menuitem', { name: new RegExp(label) }).click();
    await page.getByText(`已导出到 ${out}`).waitFor();
    assert.ok(statSync(out).size > 200);
  }
  assert.match(readFileSync(join(tmp, 'out.fdx'), 'utf8'), /<Paragraph Type="Character"><Text>豆豆<\/Text>/);
  assert.equal(readFileSync(join(tmp, 'out.pdf')).subarray(0, 4).toString(), '%PDF');
  await shot(page, '04-after-undo');

  step('restart: project and text survive');
  await app.close();
  ({ app, page } = await launch());
  await page.getByText('最近').waitFor();
  await page.locator('.recent').first().click();
  await page.locator('.paper .node').first().waitFor();
  assert.deepEqual(await page.locator('.paper .node').allTextContents(), ['豆豆', '石头……石头说话了？']);

  step('settings shows the activation, no usage anywhere');
  await page.getByRole('button', { name: '设置' }).click();
  await page.getByText('测试工作室 · 第 1/3 台').waitFor();
  assert.ok(!(await page.locator('body').textContent())!.match(/积分余额|用量统计|credits/i));
  await shot(page, '05-settings');
  console.log('\nE2E passed');
} catch (e) {
  await shot(page, 'failure').catch(() => {});
  throw e;
} finally {
  await app.close().catch(() => {});
  fake.server.close();
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
}
