// End-to-end: drives the real Electron build (spec 0002 §12.2 ④, Phase 2–3 acceptance).
// Run: pnpm --filter @scripter/desktop e2e   (builds first). Screenshots → e2e/shots/.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
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
    colorScheme: null as never, // let Electron's nativeTheme (the 外观 setting) decide, instead of Playwright's light emulation
    env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: userData, SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: fake.url },
  });
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  return { app, page };
}
const shot = (page: Page, name: string) => page.screenshot({ path: join(shots, `${name}.png`) });
const step = (s: string) => console.log(`• ${s}`);
/** Quick commands live in the composer's "+" menu (prototype PR #28): pick one, it prefills the box, Enter sends. */
async function quick(page: Page, name: string) {
  await page.locator('#plus').filter({ visible: true }).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${name}`) }).click();
  await page.getByLabel('给 AI 的指令', { exact: true }).filter({ visible: true }).press('Enter');
}

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

  step('send an idea → workspace → AI writes 4 nodes (+ registers a character and a location) as one turn, typed out');
  await page.locator('#ask').fill('胡同里的小男孩发现自家门墩儿会说话，写第一场');
  await page.getByRole('button', { name: '开始' }).click();
  await page.locator('.act-row.is-running', { hasText: '联网搜索' }).waitFor({ timeout: 20_000 }); // live agent activity rows
  await shot(page, '03a-activity-live');
  await page.getByText('本轮 6 处修改').waitFor({ timeout: 20_000 });
  await page.waitForFunction(() => !document.querySelector('.node.caret') && document.querySelectorAll('.paper .node').length === 4, null, { timeout: 20_000 });
  assert.deepEqual(await page.locator('.paper .node').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.type)), ['heading', 'action', 'character', 'dialogue']);
  assert.ok(fake.prompts[0]!.includes('<ops>') && fake.prompts[0]!.includes('门墩儿会说话'), 'prompt carries the ops contract and the idea');
  await page.getByRole('button', { name: /1\. 外景 胡同口/ }).waitFor();
  const sum = page.locator('.ag-ai .act-sum');
  assert.equal(await sum.textContent(), '完成 3 个步骤 · 联网搜索、读取网页', 'activity folds into one line once the turn ends');
  await sum.click();
  await page.locator('.ag-ai .act-row', { hasText: '联网搜索' }).locator('.an', { hasText: '×2' }).waitFor(); // same-tool calls merged
  await shot(page, '03-workspace-ai');
  await sum.click();

  step('the AI turn registered 门墩儿 and 胡同口');
  await page.getByRole('button', { name: '角色', exact: true }).click();
  await page.getByText('住在石门墩里，嘴硬心软').waitFor();
  await page.getByRole('button', { name: '地点', exact: true }).click();
  await page.locator('.ecard b', { hasText: '胡同口' }).waitFor();
  await page.locator('.ecard', { hasText: '胡同口' }).getByText('1 场').waitFor(); // scene count read from the heading
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.locator('.paper .node').first().waitFor();

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

  step('undo the AI turn: its 4 nodes and its bible entries go, the writer’s 2 lines stay');
  await page.getByRole('button', { name: '撤销' }).click();
  await page.getByText('已撤销本轮 6 处修改').waitFor();
  assert.deepEqual(await page.locator('.paper .node').allTextContents(), ['豆豆', '石头……石头说话了？']);
  await page.getByRole('button', { name: '角色', exact: true }).click();
  await page.getByText('剧本里出现了还没建档的角色：豆豆').waitFor();
  assert.equal(await page.getByText('住在石门墩里，嘴硬心软').count(), 0);
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.locator('.paper .node').first().waitFor();

  step('a rewrite arrives as a modification preview: reject changes nothing, accept writes, undo restores');
  await quick(page, '润色对白');
  const preview = page.locator('.preview').last();
  await preview.getByText('修改预览 · 1 处').waitFor({ timeout: 20_000 });
  await preview.locator('del', { hasText: '石头……石头说话了？' }).waitFor();
  assert.deepEqual(await page.locator('.paper .node').allTextContents(), ['豆豆', '石头……石头说话了？'], 'nothing written before accepting');
  await preview.getByRole('button', { name: '拒绝' }).click();
  await preview.getByText('已拒绝，剧本没有改动').waitFor();
  assert.deepEqual(await page.locator('.paper .node').allTextContents(), ['豆豆', '石头……石头说话了？']);
  await quick(page, '润色对白');
  const preview2 = page.locator('.preview').last();
  await preview2.getByRole('button', { name: '接受' }).waitFor({ timeout: 20_000 });
  await shot(page, '04a-preview');
  await preview2.getByRole('button', { name: '接受' }).click();
  await preview2.getByText('已接受并写入').waitFor();
  await page.locator('.paper .node', { hasText: '石头……石头它会说话？！' }).waitFor();
  await page.getByRole('button', { name: '撤销' }).last().click();
  await page.locator('.paper .node', { hasText: '石头……石头说话了？' }).waitFor();
  assert.deepEqual(await page.locator('.paper .node').allTextContents(), ['豆豆', '石头……石头说话了？']);

  step('「总结大纲」writes into the outline document, not into the script');
  const before = await page.locator('.paper .node').allTextContents();
  await quick(page, '总结大纲');
  await page.getByText('已写进大纲，点左侧「大纲」查看').waitFor({ timeout: 20_000 });
  assert.deepEqual(await page.locator('.paper .node').allTextContents(), before);
  await page.getByRole('tab', { name: '大纲' }).click();
  assert.match(await page.getByLabel('大纲', { exact: true }).inputValue(), /一、豆豆发现门墩儿会说话\n二、两人约定保守秘密/);
  await page.getByRole('tab', { name: '剧本' }).click();
  await page.locator('.paper .node').first().waitFor();

  step('export FDX and PDF (save dialog stubbed)');
  for (const [fmt, label] of [['fdx', 'Final Draft'], ['pdf', 'PDF'], ['docx', 'Word']] as const) {
    const out = join(tmp, `out.${fmt}`);
    await app.evaluate(({ dialog }, p) => { dialog.showSaveDialog = (async () => ({ canceled: false, filePath: p })) as typeof dialog.showSaveDialog; }, out);
    await page.getByRole('button', { name: '导出' }).click();
    await page.getByRole('menuitem', { name: new RegExp(label) }).click();
    await page.getByText(`已导出到 ${out}`).waitFor();
    assert.ok(statSync(out).size > 200);
  }
  assert.match(readFileSync(join(tmp, 'out.fdx'), 'utf8'), /<Paragraph Type="Character"><Text>豆豆<\/Text>/);
  assert.equal(readFileSync(join(tmp, 'out.pdf')).subarray(0, 4).toString(), '%PDF');
  assert.match(strFromU8(unzipSync(new Uint8Array(readFileSync(join(tmp, 'out.docx'))))['word/document.xml']!), /石头……石头说话了？/);
  await shot(page, '04-after-undo');

  step('restart: project and text survive');
  await app.close();
  ({ app, page } = await launch());
  await page.getByText('最近').waitFor();
  await page.locator('.recent').first().click();
  await page.locator('.paper .node').first().waitFor();
  assert.deepEqual(await page.locator('.paper .node').allTextContents(), ['豆豆', '石头……石头说话了？']);
  await page.getByText('已拒绝，剧本没有改动').waitFor(); // the AI conversation is saved with the project
  assert.equal(await page.locator('.preview').count(), 2);

  step('characters: register from script, create, relate, cast');
  await page.getByRole('button', { name: '角色', exact: true }).click();
  await page.getByRole('button', { name: '一键建档' }).click();
  await page.locator('.ecard b', { hasText: '豆豆' }).first().waitFor();
  await page.getByRole('button', { name: '新角色' }).click();
  await page.locator('#cn').fill('门墩儿');
  await page.locator('#cr').fill('精灵 · 一百多岁');
  await page.locator('#c-want').fill('有人陪他说话');
  await page.getByRole('button', { name: '创建' }).click();
  await page.locator('.ecard b', { hasText: '门墩儿' }).waitFor();
  await page.getByRole('button', { name: '新角色' }).click();
  await page.locator('#cn').fill('豆豆');
  await page.getByRole('button', { name: '创建' }).click();
  await page.getByRole('alert').filter({ hasText: '已经有同名角色' }).waitFor();
  await page.getByRole('button', { name: '关闭' }).click();
  await page.waitForTimeout(300); // let the drawer scrim fade before the screenshot
  await shot(page, '06-characters');
  const png = join(tmp, 'portrait.png');
  writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
  await app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [p] })) as typeof dialog.showOpenDialog; }, png);
  const mdr = page.locator('.card.ecard', { hasText: '门墩儿' });
  await mdr.getByRole('button', { name: '上传肖像' }).click();
  await mdr.getByRole('button', { name: '反推提示词' }).click();
  await page.getByText('已写进 门墩儿 的「外形」').waitFor();
  await page.getByRole('tablist', { name: '门墩儿 视图' }).getByRole('tab', { name: '高级' }).click();
  await page.locator('.kv dd', { hasText: '九岁男孩，圆脸，蓝色校服' }).waitFor();
  await page.getByRole('tablist', { name: '门墩儿 视图' }).getByRole('tab', { name: '肖像' }).click();
  await page.getByRole('tab', { name: '关系' }).click();
  await page.getByLabel('关系', { exact: true }).fill('秘密朋友');
  await page.getByRole('button', { name: '添加', exact: true }).click();
  await page.locator('.rel-tag', { hasText: '秘密朋友' }).waitFor();
  await shot(page, '07-relations');
  await page.getByRole('tab', { name: '选角' }).click();
  await page.getByLabel('门墩儿 的配音').fill('老年男声 · 京腔 · 慢');
  await page.getByLabel('门墩儿 的配音').blur();
  await page.locator('tr', { hasText: '门墩儿' }).getByRole('button', { name: '定角' }).click();
  await page.locator('tr', { hasText: '门墩儿' }).getByRole('button', { name: '改选' }).waitFor();

  step('locations, props, world, knowledge');
  await page.getByRole('button', { name: '地点', exact: true }).click();
  await page.getByRole('button', { name: '新建地点' }).click();
  await page.locator('#ln').fill('胡同口');
  await page.getByRole('radio', { name: '砖红' }).click();
  await page.getByRole('button', { name: '傍晚' }).click();
  await page.getByRole('button', { name: '创建' }).click();
  await page.locator('.ecard b', { hasText: '胡同口' }).waitFor();
  await page.getByRole('tab', { name: '地点清单' }).click();
  await page.getByRole('cell', { name: '日 / 傍晚' }).waitFor();
  await page.getByRole('button', { name: '道具', exact: true }).click();
  await page.getByRole('button', { name: '新建道具' }).first().click();
  await page.locator('#pn').fill('白球鞋');
  await page.locator('#pk').fill('服装');
  await page.getByLabel('描述').fill('鞋底刻着一个"林"字——姥爷小时候的鞋');
  await page.getByRole('button', { name: '创建' }).click();
  const card = page.locator('.prop-card', { hasText: '白球鞋' });
  await card.waitFor();
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + 100, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 260, box.y + 160, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const moved = (await card.boundingBox())!;
  assert.ok(Math.abs(moved.x - box.x - 160) < 6 && Math.abs(moved.y - box.y - 120) < 6, 'prop card follows the drag');
  await shot(page, '08-props');
  await page.getByRole('button', { name: '世界观', exact: true }).click();
  await page.getByRole('button', { name: /系列动画/ }).click();
  await page.getByLabel('世界规则', { exact: true }).fill('门墩儿只能“借”胡同里的老物件，不能凭空变出东西');
  await page.getByLabel('世界规则', { exact: true }).blur();
  await shot(page, '09-world');
  const doc = join(tmp, '导演意见.txt');
  writeFileSync(doc, '第一集：笑点要来自孩子的视角，不要大人式的抖机灵。');
  await app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [p] })) as typeof dialog.showOpenDialog; }, doc);
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  await page.getByRole('button', { name: '添加文件' }).click();
  await page.getByText('导演意见.txt').waitFor();
  await page.getByRole('button', { name: '写作时参考' }).click();
  await page.getByRole('button', { name: '写作时参考 ✓' }).waitFor();

  step('selecting script text offers 解释 / 总结 / 翻译 from Ancher');
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.locator('.paper .node[data-type="dialogue"]').first().evaluate((el) => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection()!; s.removeAllRanges(); s.addRange(r); });
  await page.getByRole('toolbar', { name: '选中文字' }).getByRole('button', { name: '解释' }).click();
  await page.getByRole('dialog', { name: '解释' }).getByText('是孩子的惊讶').waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('toolbar', { name: '选中文字' }).waitFor({ state: 'detached' });

  step('⚡ ⌥1 from the keyboard: cancel mid-step, retry, then write a direction into the outline');
  await page.locator('.paper .node').first().click();
  await page.keyboard.press('Alt+1');
  await page.getByLabel('创意', { exact: true }).fill('__SLOW__ 门墩儿会说话');
  await page.getByRole('button', { name: '开始' }).click();
  const run1 = page.locator('.run').last();
  await run1.locator('.act-row.is-running', { hasText: 'Ancher 联网调研' }).waitFor();
  await run1.getByRole('button', { name: '取消' }).click();
  await run1.getByText('已取消，没有写入任何内容').waitFor();
  await run1.getByRole('button', { name: '重试' }).click();
  await run1.getByText('走向1：门墩儿的秘密1').waitFor({ timeout: 20_000 });
  await run1.locator('.act-sum', { hasText: '完成 4 个步骤' }).waitFor(); // finished run folds its steps
  await shot(page, '10-workflow-directions');
  await run1.getByRole('button', { name: '写进大纲' }).nth(1).click();
  await run1.getByText('已写进大纲：走向2：门墩儿的秘密2').waitFor();
  await page.getByRole('tab', { name: '大纲' }).click();
  assert.match(await page.getByLabel('大纲', { exact: true }).inputValue(), /【走向】走向2：门墩儿的秘密2[\s\S]*冲突：冲突来源2/);
  await page.getByRole('tab', { name: '剧本' }).click();

  step('⚡ ⌥5 from the menu: director notes become confirmed rules that reach the next prompt');
  // "+" menu, keyboard only: ↓ through 添加 and 快捷指令 into 工作流, Enter picks 导演意见 → 规则 (the 13th row).
  await page.locator('#plus').filter({ visible: true }).click();
  await page.getByRole('menu', { name: '添加与快捷指令' }).waitFor();
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowDown');
  assert.match((await page.evaluate(() => document.activeElement?.textContent)) ?? '', /导演意见 → 规则/);
  await page.keyboard.press('Enter');
  await page.getByLabel('内容', { exact: true }).fill('第一集：笑点要来自孩子的视角，不要大人式的抖机灵。别让孩子玩手机。');
  await page.getByRole('button', { name: '开始' }).click();
  const run5 = page.locator('.run').last();
  await run5.getByText('笑点要来自孩子的视角').waitFor({ timeout: 20_000 });
  await run5.getByRole('checkbox').nth(1).uncheck();
  await run5.getByRole('button', { name: '确认加入规则库（1）' }).click();
  await run5.getByText('已加入规则库 1 条').waitFor();

  step('⚡ ⌥4 drift check points at a line; ⌥8 topics go into the pool');
  await page.keyboard.press('Alt+4');
  const run4 = page.locator('.run').last();
  await run4.getByText('豆豆太快接受了石头会说话').waitFor({ timeout: 20_000 });
  await run4.getByText('豆豆太快接受了石头会说话').click();
  await page.waitForFunction(() => (document.activeElement as HTMLElement | null)?.dataset.type === 'dialogue'); // the issue jumps to its line
  await page.keyboard.press('Alt+8');
  const run8 = page.locator('.run').last();
  await run8.getByText('门墩儿想修好姥爷的旧鞋').waitFor({ timeout: 20_000 });
  await run8.getByRole('button', { name: '加入选题池（3）' }).click();
  await run8.getByText('已加入选题池 3 个').waitFor();
  await page.getByLabel('给 AI 的指令').fill('续写下一场');
  await page.keyboard.press('Enter');
  await page.getByText('本轮 6 处修改').last().waitFor({ timeout: 20_000 });
  assert.ok(fake.prompts.at(-1)!.includes('笑点要来自孩子的视角'), 'confirmed rules are sent with the next writing request');
  assert.ok(!fake.prompts.at(-1)!.includes('不要出现手机'), 'unconfirmed rules are not');
  assert.match(fake.prompts.at(-1)!, /<reference>[\s\S]*《导演意见\.txt》[\s\S]*不要大人式的抖机灵[\s\S]*<\/reference>/, 'pinned knowledge goes along as reference material');
  await page.getByRole('button', { name: '世界观', exact: true }).click();
  await page.locator('.tb td', { hasText: '笑点要来自孩子的视角' }).first().waitFor();
  await page.locator('.setting', { hasText: '门墩儿想修好姥爷的旧鞋' }).waitFor();
  await shot(page, '11-library');

  step('restart again: the whole bible persisted');
  await app.close();
  ({ app, page } = await launch());
  await page.locator('.recent').first().click();
  await page.locator('.paper .node').first().waitFor();
  await page.getByRole('button', { name: '角色', exact: true }).click();
  await page.getByRole('tab', { name: '关系' }).click();
  await page.locator('.rel-tag', { hasText: '秘密朋友' }).waitFor();
  await page.getByRole('tab', { name: '选角' }).click();
  assert.equal(await page.getByLabel('门墩儿 的配音').inputValue(), '老年男声 · 京腔 · 慢');
  await page.getByRole('button', { name: '道具', exact: true }).click();
  await page.locator('.prop-card', { hasText: '白球鞋' }).waitFor();
  await page.getByRole('button', { name: '世界观', exact: true }).click();
  assert.match(await page.getByLabel('世界规则', { exact: true }).inputValue(), /只能“借”/);
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  await page.getByText('导演意见.txt').waitFor();
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.locator('.run', { hasText: '已加入规则库 1 条' }).waitFor(); // workflow runs are kept with the project
  await page.getByRole('tab', { name: '大纲' }).click();
  assert.match(await page.getByLabel('大纲', { exact: true }).inputValue(), /走向2：门墩儿的秘密2/);

  step('settings shows the activation, no usage anywhere');
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByText('测试工作室 · 第 1/3 台').waitFor();
  assert.ok(!(await page.locator('body').textContent())!.match(/积分余额|用量统计|credits/i));
  await page.getByLabel('剧本字体').selectOption('song');
  assert.match(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-script')), /Songti SC/);
  await page.getByLabel('剧本字体').selectOption('typewriter');
  await shot(page, '05-settings');
  const diag = join(tmp, 'diag.zip');
  await app.evaluate(({ dialog }, p) => { dialog.showSaveDialog = (async () => ({ canceled: false, filePath: p })) as typeof dialog.showSaveDialog; }, diag);
  await page.getByRole('button', { name: '导出诊断包' }).click();
  await page.getByText(`已导出诊断包到 ${diag}`).waitFor();
  const dz = unzipSync(new Uint8Array(readFileSync(diag)));
  assert.match(strFromU8(dz['info.json']!), /"ancher": true/);
  assert.ok(!Object.values(dz).some((b) => strFromU8(b).includes(GOOD_KEY)), 'diagnostics never contain the key');

  step('export the whole project as .scripter and import it back as a copy');
  const arc = join(tmp, '门墩儿.scripter');
  await app.evaluate(({ dialog }, p) => {
    dialog.showSaveDialog = (async () => ({ canceled: false, filePath: p })) as typeof dialog.showSaveDialog;
    dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [p] })) as typeof dialog.showOpenDialog;
  }, arc);
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.getByRole('tab', { name: '剧本' }).click();
  await page.locator('.paper .node').first().waitFor();
  const original = await page.locator('.paper .node').allTextContents();
  assert.ok(original.length >= 2);
  await page.getByRole('button', { name: '导出' }).click();
  await page.getByRole('menuitem', { name: /整个项目/ }).click();
  await page.getByText(`已导出整个项目到 ${arc}`).waitFor();
  assert.ok(!readFileSync(arc).toString('latin1').includes('conversationId":"c1'), 'the Ancher conversation id is not exported');
  await page.getByRole('button', { name: '返回首页' }).last().click();
  await page.getByRole('button', { name: '导入项目' }).click();
  await page.locator('.recent', { hasText: '（导入）' }).click();
  await page.locator('.paper .node').first().waitFor();
  assert.deepEqual(await page.locator('.paper .node').allTextContents(), original);
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  await page.getByText('导演意见.txt').waitFor(); // files travel with the project
  await page.getByRole('button', { name: '世界观', exact: true }).click();
  await page.locator('.tb td', { hasText: '笑点要来自孩子的视角' }).first().waitFor();

  step('⚡ 写一整集: confirm the story (edited), confirm the scenes, preview, accept — 13 scenes land in the script');
  await page.getByRole('button', { name: '返回首页' }).last().click();
  await page.locator('#ask').fill('豆豆想要一双会发光的鞋');
  await page.getByRole('button', { name: '⚡ 写一整集' }).click();
  const ep = page.locator('.run', { hasText: '一集剧本流水线' }).last();
  const storyBox = ep.getByLabel('确认故事和锁定核心', { exact: true });
  await storyBox.waitFor({ timeout: 20_000 });
  await storyBox.fill(`${await storyBox.inputValue()}\n大壮最后也借到了鞋。`);
  await shot(page, '12-episode-confirm');
  await ep.getByRole('button', { name: '确认，继续' }).click();
  const scenesBox = ep.getByLabel('确认分场', { exact: true });
  await scenesBox.waitFor({ timeout: 20_000 });
  assert.equal((await scenesBox.inputValue()).split('\n').length, 13);
  await ep.getByRole('button', { name: '确认，继续' }).click();
  await ep.getByRole('button', { name: '查看修改预览' }).waitFor({ timeout: 30_000 });
  await ep.locator('.act-sum', { hasText: '完成 9 个步骤' }).waitFor();
  await ep.getByRole('button', { name: '查看修改预览' }).click();
  await page.locator('.preview').last().getByRole('button', { name: '接受' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.paper .node[data-type="heading"]').length === 13, null, { timeout: 30_000 });
  await page.getByRole('tab', { name: '大纲' }).click();
  assert.match(await page.getByLabel('大纲', { exact: true }).inputValue(), /【故事】\n豆豆想要一双会发光的鞋/);
  await page.getByRole('button', { name: '世界观', exact: true }).click();
  // The writer's edit (appended under 锁定核心) is what got locked in.
  assert.match(await page.getByLabel('锁定核心', { exact: true }).inputValue(), /旧东西里有爱[\s\S]*大壮最后也借到了鞋/);

  step('AI panel (Ancher agent UI): thinking + tip, 加入队列, long-bubble clamp, actions, save, new conversation + history');
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.locator('.ag-hd .ico-btn[aria-label="新对话"]').filter({ visible: true }).click();
  await page.locator('.ag-grid').filter({ visible: true }).waitFor();
  const ask = page.getByLabel('给 AI 的指令', { exact: true }).filter({ visible: true });
  await ask.fill('__SLOW__ 第一条：写一场雨天的戏');
  await ask.press('Enter');
  await page.locator('.ag-thinking .shimmer', { hasText: 'Thinking' }).waitFor();
  await page.locator('.wait-tip').waitFor();
  assert.ok(await page.locator('.cmp-card.busy').count() === 1, 'running border while the agent works');
  const longMsg = '第二条：' + '豆豆蹲在门墩儿旁边，用手指头戳石狮子的鼻子。'.repeat(12);
  await ask.fill(longMsg);
  await page.getByRole('button', { name: /加入队列/ }).waitFor();
  await shot(page, '13-chat-running');
  await ask.press('Enter');
  await page.locator('.q-item', { hasText: '第二条' }).waitFor(); // queued message shown above the box
  await page.waitForFunction(() => document.querySelectorAll('.turn-line').length >= 2 && !document.querySelector('.ag-thinking'), null, { timeout: 30_000 });
  const firstChat = fake.prompts.find((x) => x.includes('用户：__SLOW__ 第一条'))!;
  const secondChat = fake.prompts.find((x) => x.includes('用户：第二条'))!;
  assert.ok(firstChat.includes('## 你怎么改剧本'), 'a new conversation starts with the full rules');
  assert.ok(!secondChat.includes('## 你怎么改剧本') && secondChat.includes('继续按本对话开头约定的规则'), 'later turns send only a reminder');
  const bubble = page.locator('.bubble', { hasText: '第二条' });
  await bubble.getByRole('button', { name: '展开更多' }).click();
  await bubble.getByRole('button', { name: '收起' }).waitFor();
  const lastAi = page.locator('.ag-ai').last();
  await lastAi.getByRole('button', { name: '好的回答', exact: true }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('.ag-ai')].at(-1)?.querySelector('[aria-label="好的回答"]')?.getAttribute('aria-pressed') === 'true');
  await lastAi.getByRole('button', { name: '存为笔记' }).click();
  await page.getByText(/已存进知识库：AI 回复/).waitFor();
  await page.getByRole('button', { name: '保存', exact: true }).filter({ visible: true }).click();
  await page.getByText(/已存进知识库：__SLOW__ 第一条/).waitFor();
  await shot(page, '14-chat-done');
  await page.locator('.ag-hd .ico-btn[aria-label="新对话"]').filter({ visible: true }).click();
  await page.locator('.ag-grid').filter({ visible: true }).waitFor();
  await page.locator('.ag-title').filter({ visible: true }).click();
  await page.getByRole('menuitem', { name: /__SLOW__ 第一条/ }).click();
  await page.locator('.bubble', { hasText: '__SLOW__ 第一条' }).waitFor();
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  await page.getByText(/AI 回复 .*\.md/).waitFor();

  step('Tab takes the ghost suggestion; an empty-chat tile prefills; 外观 → 暗色 switches to Ancher dark');
  await page.getByRole('button', { name: '写作', exact: true }).click();
  const ask2 = page.getByLabel('给 AI 的指令', { exact: true }).filter({ visible: true });
  await page.locator('.ghost kbd', { hasText: 'Tab' }).filter({ visible: true }).waitFor();
  const suggestion = (await page.locator('.ghost span').filter({ visible: true }).textContent())!;
  await ask2.focus();
  await page.keyboard.press('Tab');
  assert.equal(await ask2.inputValue(), suggestion);
  await ask2.fill('');
  await page.locator('.ag-hd .ico-btn[aria-label="新对话"]').filter({ visible: true }).click();
  await page.locator('.ag-tile', { hasText: '写大纲' }).filter({ visible: true }).click();
  assert.equal(await ask2.inputValue(), '帮我写这一集的大纲');
  await ask2.fill('');
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('radio', { name: '暗色' }).click();
  await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() === 'var(--n2-d1)' || getComputedStyle(document.body).backgroundColor === 'rgb(17, 17, 16)');
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await shot(page, '15-dark');
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('radio', { name: '亮色' }).click();
  await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(249, 249, 248)');
  // A finished turn in both themes: folded activity (opened), the reply, the quiet 「本轮 N 处修改 · 撤销」 line.
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await ask2.fill('写一场豆豆和门墩儿拌嘴的戏');
  await ask2.press('Enter');
  const turnSum = page.locator('.ag-ai .act-sum').filter({ visible: true }).last();
  await turnSum.waitFor({ timeout: 20_000 });
  await page.locator('.turn-line').filter({ visible: true }).last().waitFor();
  await page.waitForFunction(() => !document.querySelector('.node.caret'), null, { timeout: 20_000 });
  await turnSum.click();
  await shot(page, '16-activity-light');
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('radio', { name: '暗色' }).click();
  await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(17, 17, 16)');
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await shot(page, '16-activity-dark');
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('radio', { name: '跟随系统' }).click();
  console.log('\nE2E passed');
} catch (e) {
  await shot(page, 'failure').catch(() => {});
  throw e;
} finally {
  await app.close().catch(() => {});
  fake.server.close();
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
}
