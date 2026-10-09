// End-to-end: drives the real Electron build (spec 0002 §12.2 ④, Phase 2–3 acceptance).
// Run: pnpm --filter @scripter/desktop e2e   (builds first). Screenshots → e2e/shots/.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { cloudNote, GOOD_KEY, startFakeAncher } from './fake-ancher.ts';

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
    env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: userData, SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: fake.url, SCRIPTER_NEWSNOW_BASE_URL: fake.url },
  });
  app.process().on('exit', (code, signal) => console.log(`Electron exit: code=${code}, signal=${signal}`));
  app.process().stderr?.on('data', (chunk) => { if (/crash|fatal|uncaught|error/i.test(String(chunk))) console.error(String(chunk)); });
  const page = await app.firstWindow();
  // Prefer a secondary display; on a single-screen Mac, stay below normal windows.
  const placement = await app.evaluate(({ BrowserWindow, screen }) => {
    const primary = screen.getPrimaryDisplay();
    const secondary = screen.getAllDisplays().filter((display) => display.id !== primary.id).sort((a, b) => b.workArea.width - a.workArea.width)[0];
    for (const window of BrowserWindow.getAllWindows()) {
      if (secondary) {
        const { x, y, width, height } = secondary.workArea;
        const [windowWidth, windowHeight] = window.getSize();
        window.setPosition(x + Math.max(0, Math.round((width - windowWidth) / 2)), y + Math.max(0, Math.round((height - windowHeight) / 2)));
      } else if (process.platform === 'darwin') window.setAlwaysOnTop(true, 'normal', -1);
    }
    if (process.env.SCRIPTER_E2E_HIDDEN === '1') for (const window of BrowserWindow.getAllWindows()) window.hide();
    return { target: secondary?.id ?? primary.id, actual: screen.getDisplayMatching(BrowserWindow.getAllWindows()[0]!.getBounds()).id, secondary: !!secondary };
  });
  assert.equal(placement.actual, placement.target, 'test window must use the selected display');
  console.log(`E2E window on ${placement.secondary ? 'secondary' : 'primary'} display ${placement.actual}`);
  page.setDefaultTimeout(20000);
  await page.waitForLoadState('domcontentloaded');
  assert.deepEqual(await page.evaluate(async () => { const latin = await document.fonts.load('14px "Courier Prime"'); const chinese = await document.fonts.load('14px "Zhuque Fangsong"'); await document.fonts.ready; return [latin.length,chinese.length]; }), [1,1]);
  return { app, page };
}
const shot = async (page: Page, name: string) => {
  if (name.startsWith('final-')) {
    await page.evaluate(async () => { await Promise.all(document.getAnimations().filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime)).map((a) => a.finished.catch(() => {}))); });
    await page.locator('.toast.show').waitFor({ state: 'hidden' });
    const metrics = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scale: devicePixelRatio, panels: ['.nav','.window-bar','.outline','.note-list','.note-page','.dock-host','.agent','.collection-nav','.settings'].flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)].filter((el) => el.getBoundingClientRect().width > 0).map((el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return { selector,x:r.x,y:r.y,width:r.width,height:r.height,background:s.backgroundColor,borderRadius:s.borderRadius,font:s.fontFamily }; })) }));
    writeFileSync(join(shots, `${name}.json`), JSON.stringify(metrics, null, 2));
  }
  return page.screenshot({ path: join(shots, `${name}.png`) });
};
const step = (s: string) => console.log(`• ${s}`);
/** Quick commands live in the composer's "+" menu (prototype PR #28): pick one, it prefills the box, Enter sends. */
async function quick(page: Page, name: string) {
  await page.locator('#plus').filter({ visible: true }).click();
  await page.getByRole('menuitem', { name: '快捷指令', exact: true }).click();
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
  for (const size of [[1360,860],[1440,960]] as const) {
    await app.evaluate(({ BrowserWindow }, size) => BrowserWindow.getAllWindows()[0]!.setContentSize(size[0], size[1]), size);
    await page.setViewportSize({ width: size[0], height: size[1] });
    assert.deepEqual(await page.evaluate(() => [innerWidth, innerHeight]), [...size]);
    for (const theme of ['light','dark'] as const) { await page.evaluate(async (t) => window.api.app.setTheme(t), theme); await shot(page, `final-激活-${theme}-${size[0]}x${size[1]}`); }
  }
  await page.evaluate(async () => window.api.app.setTheme('light'));

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
  fake.streamGate.paused = true; // hold stream until the workspace has subscribed to live activity
  await page.locator('#ask').fill('胡同里的小男孩发现自家门墩儿会说话，写第一场');
  await page.getByRole('button', { name: '开始' }).click();
  await page.locator('.paper').waitFor();
  fake.streamGate.paused = false;
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

  step('the rail theme button switches dark/light without leaving the project and saves the preference');
  await page.getByRole('button', { name: '切换亮暗模式', exact: true }).click();
  await page.waitForFunction(() => matchMedia('(prefers-color-scheme: dark)').matches);
  assert.equal(await page.evaluate(() => window.api.app.getTheme()), 'dark');
  assert.equal(JSON.parse(readFileSync(join(userData, 'settings.json'), 'utf8')).theme, 'dark');
  assert.equal(await page.locator('.paper .node').count(), 4);
  await page.getByRole('button', { name: '切换亮暗模式', exact: true }).click();
  await page.waitForFunction(() => !matchMedia('(prefers-color-scheme: dark)').matches);
  assert.equal(await page.evaluate(() => window.api.app.getTheme()), 'light');

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
  // macOS End scrolls the viewport; explicitly establish the end-of-dialogue precondition.
  await last.evaluate((el) => {
    const range = document.createRange(); range.selectNodeContents(el); range.collapse(false);
    const selection = window.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
  });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => {
    const line = document.querySelector('.paper .node:last-child');
    return line?.getAttribute('data-type') === 'character' && document.activeElement === line;
  });
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
  await page.getByRole('button', { name: '撤销', exact: true }).click();
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
  await page.getByRole('button', { name: '撤销', exact: true }).last().click();
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
    step(`export ${fmt}`);
    const out = join(tmp, `out.${fmt}`);
    await app.evaluate(({ dialog }, p) => { dialog.showSaveDialog = (async () => ({ canceled: false, filePath: p })) as typeof dialog.showSaveDialog; }, out);
    await page.getByRole('button', { name: '导出' }).click();
    const exportDialog = page.getByRole('dialog', { name: '导出', exact: true });
    await exportDialog.getByRole('radio', { name: new RegExp(label) }).check();
    await exportDialog.getByRole('button', { name: '导出', exact: true }).click();
    await page.getByText(`已导出到 ${out}`).waitFor();
    assert.ok(statSync(out).size > 200);
  }
  assert.match(readFileSync(join(tmp, 'out.fdx'), 'utf8'), /<Paragraph Type="Character"><Text>豆豆<\/Text>/);
  assert.equal(readFileSync(join(tmp, 'out.pdf')).subarray(0, 4).toString(), '%PDF');
  assert.match(readFileSync(join(tmp, 'out.pdf')).toString('latin1'), /Zhuque/i, 'PDF embeds the bundled Chinese font');
  assert.match(strFromU8(unzipSync(new Uint8Array(readFileSync(join(tmp, 'out.docx'))))['word/document.xml']!), /石头……石头说话了？/);
  await shot(page, '04-after-undo');

  step('restart: project and text survive');
  await app.close();
  ({ app, page } = await launch());
  await page.getByText('最近').waitFor();
  await page.getByRole('button', { name: '最近项目', exact: true }).click();
  await page.locator('.recent[data-project-id]').first().getByRole('button').first().click();
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
  assert.equal(await page.getByRole('button', { name: '世界观', exact: true }).count(), 0);
  // Existing setting data still survives even though its dedicated panel was removed.
  await page.evaluate(async () => {
    const id = (await window.api.projects.list())[0]!.id;
    await window.api.bible.add(id, 'world', { title: '世界规则', value: '门墩儿只能“借”胡同里的老物件，不能凭空变出东西' });
  });
  const doc = join(tmp, '导演意见.txt');
  writeFileSync(doc, '第一集：笑点要来自孩子的视角，不要大人式的抖机灵。');
  await app.evaluate(({ dialog }, p) => { dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [p] })) as typeof dialog.showOpenDialog; }, doc);
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  step('Ancher website notes, collections and pins appear at the knowledge entry');
  await page.locator('.note-all').getByRole('button', { name: '官网保存的视频笔记', exact: true }).waitFor();
  await page.getByRole('button', { name: '官网参考资料', exact: true }).waitFor();
  await page.locator('.note-page').getByText('豆豆：这是在官网保存的笔记正文。', { exact: true }).waitFor();
  assert.equal(await page.locator('.note-group').first().getByRole('button', { name: '官网保存的视频笔记', exact: true }).count(), 1);
  fake.cloudNotes.push({ ...cloudNote('cloud-n2'), title: '官网刚保存的转写', status: 'processing' });
  await page.getByRole('button', { name: '刷新 Ancher 笔记', exact: true }).click();
  await page.locator('.note-all').getByRole('button', { name: /官网刚保存的转写/ }).click();
  await page.getByText('转写完成后这里会自动显示正文。', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '保存到项目', exact: true }).isDisabled(), true);
  fake.cloudNotes[1]!.status = 'ready';
  await page.locator('.note-page').getByText('豆豆：这是在官网保存的笔记正文。', { exact: true }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: '保存到项目', exact: true }).click();
  await page.getByLabel('笔记标题', { exact: true }).waitFor();
  const cloudPid = await page.evaluate(async () => (await window.api.projects.list())[0]!.id);
  // The local notes pane can mount before its asynchronous cloud import completes.
  await page.waitForFunction(async (id) => (await window.api.projects.open(id)).bible.files.some((f) => f.id === 'ancher-cloud-n2'), cloudPid);
  await page.evaluate(async (id) => window.api.files.saveBody(id, 'ancher-cloud-n2', '本地编辑内容'), cloudPid);
  const imported = await page.evaluate(async (id) => window.api.ancherNotes.import(id, 'cloud-n2'), cloudPid);
  assert.equal(imported.state.bible.files.filter((f) => f.id === 'ancher-cloud-n2').length, 1);
  assert.equal(await page.evaluate(async (id) => window.api.files.readBody(id, 'ancher-cloud-n2'), cloudPid), '本地编辑内容');
  await page.getByRole('tab', { name: 'Ancher 笔记', exact: true }).click();
  await page.getByRole('button', { name: '官网参考资料', exact: true }).click();
  await page.locator('.note-all').getByRole('button', { name: /官网刚保存的转写/ }).waitFor();
  await shot(page, '09a-ancher-knowledge');
  await page.evaluate(async () => window.api.app.setTheme('dark'));
  await page.waitForFunction(() => matchMedia('(prefers-color-scheme: dark)').matches);
  await shot(page, '09b-ancher-knowledge-dark');
  await page.evaluate(async () => window.api.app.setTheme('light'));
  await page.waitForFunction(() => !matchMedia('(prefers-color-scheme: dark)').matches);
  step('a temporary cloud body failure recovers without user interaction');
  fake.cloudFailures.body = 1;
  await page.locator('.note-all').getByRole('button', { name: '官网刚保存的转写', exact: true }).click();
  await page.locator('.note-page').getByRole('alert').waitFor();
  await page.locator('.note-page').getByText('豆豆：这是在官网保存的笔记正文。', { exact: true }).waitFor({ timeout: 18000 });
  await page.getByRole('tab', { name: '项目笔记', exact: true }).click();
  await page.getByRole('button', { name: '添加文件' }).click();
  await page.getByText('导演意见.txt', { exact: true }).first().waitFor();
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
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.locator('.pm-sub .pm-item:focus').waitFor();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
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
  await run8.getByText('热点简报', { exact: true }).waitFor();
  await run8.getByRole('link', { name: /知乎.*北京胡同口/ }).waitFor();
  const oldOpenExternal = await app.evaluate(({ shell }) => {
    const original = shell.openExternal;
    (globalThis as typeof globalThis & { newsnowOpen?: string }).newsnowOpen = '';
    shell.openExternal = async (url) => { (globalThis as typeof globalThis & { newsnowOpen?: string }).newsnowOpen = url; };
    // Retain function in main process only, not through serialization.
    (globalThis as typeof globalThis & { restoreNewsNowOpen?: () => void }).restoreNewsNowOpen = () => { shell.openExternal = original; };
    return true;
  });
  assert.ok(oldOpenExternal);
  await run8.getByRole('link', { name: /学校推广跳绳/ }).click();
  await page.waitForTimeout(100);
  assert.equal(await app.evaluate(() => (globalThis as typeof globalThis & { newsnowOpen?: string }).newsnowOpen), 'http://example.com/school');
  await app.evaluate(() => (globalThis as typeof globalThis & { restoreNewsNowOpen?: () => void }).restoreNewsNowOpen?.());
  assert.ok(fake.prompts.some((p) => p.includes('中文时事简报') && p.includes('https://example.com/hutong')));
  await run8.getByRole('button', { name: '加入选题池（3）' }).click();
  await run8.getByText('已加入选题池 3 个').waitFor();
  await page.getByLabel('给 AI 的指令').fill('续写下一场');
  await page.keyboard.press('Enter');
  await page.getByText('本轮 6 处修改').last().waitFor({ timeout: 20_000 });
  assert.ok(fake.prompts.at(-1)!.includes('笑点要来自孩子的视角'), 'confirmed rules are sent with the next writing request');
  assert.ok(!fake.prompts.at(-1)!.includes('不要出现手机'), 'unconfirmed rules are not');
  assert.match(fake.prompts.at(-1)!, /<reference>[\s\S]*《导演意见\.txt》[\s\S]*不要大人式的抖机灵[\s\S]*<\/reference>/, 'pinned knowledge goes along as reference material');
  assert.ok(await page.evaluate(async () => { const id = (await window.api.projects.list())[0]!.id; return (await window.api.projects.open(id)).bible.rules.some(r => r.text.includes('笑点要来自孩子的视角')); }));
  await shot(page, '11-library');
  await page.getByRole('button', { name: '选题池', exact: true }).click();
  const shoeTopic = page.getByRole('article', { name: '修鞋铺', exact: true });
  await shoeTopic.getByText('门墩儿想修好姥爷的旧鞋', { exact: true }).waitFor();
  assert.equal(await page.getByRole('article').count(), 3);
  await page.getByRole('button', { name: '关于这些选题', exact: true }).waitFor();
  await shoeTopic.getByRole('button', { name: '选这个', exact: true }).click();
  await shoeTopic.getByText('已选', { exact: true }).waitFor();
  await page.getByRole('tab', { name: '已选', exact: true }).click();
  assert.equal(await page.getByRole('article').count(), 1);
  await page.getByRole('tab', { name: '全部', exact: true }).click();
  const rainTopic = page.getByRole('article', { name: '雨天', exact: true });
  await rainTopic.getByLabel('否掉的原因').fill('不符合这集的主题');
  await rainTopic.getByRole('button', { name: '否掉', exact: true }).click();
  await rainTopic.getByText('已否', { exact: true }).waitFor();
  await rainTopic.getByRole('button', { name: '恢复待定', exact: true }).click();
  await rainTopic.getByText('待定', { exact: true }).waitFor();
  assert.equal(await rainTopic.getByLabel('否掉的原因').inputValue(), '');
  await rainTopic.getByLabel('否掉的原因').fill('不符合这集的主题');
  await rainTopic.getByLabel('否掉的原因').press('Enter');
  await rainTopic.getByText('已否', { exact: true }).waitFor();
  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate(async (t) => window.api.app.setTheme(t), theme);
    await page.waitForFunction((t) => matchMedia('(prefers-color-scheme: dark)').matches === (t === 'dark'), theme);
    await page.evaluate(async () => { await Promise.all(document.getAnimations().filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime)).map((a) => a.finished.catch(() => {}))); });
    await shot(page, `topics-panel-${theme}`);
  }

  step('restart again: the whole bible persisted');
  await app.close();
  ({ app, page } = await launch());
  await page.getByRole('button', { name: '最近项目', exact: true }).click();
  await page.locator('.recent[data-project-id]').first().getByRole('button').first().click();
  await page.locator('.paper .node').first().waitFor();
  await page.getByRole('button', { name: '角色', exact: true }).click();
  await page.getByRole('tab', { name: '关系' }).click();
  await page.locator('.rel-tag', { hasText: '秘密朋友' }).waitFor();
  await page.getByRole('tab', { name: '选角' }).click();
  assert.equal(await page.getByLabel('门墩儿 的配音').inputValue(), '老年男声 · 京腔 · 慢');
  await page.getByRole('button', { name: '道具', exact: true }).click();
  await page.locator('.prop-card', { hasText: '白球鞋' }).waitFor();
  assert.ok(await page.evaluate(async () => { const id = (await window.api.projects.list())[0]!.id; return (await window.api.projects.open(id)).bible.world.some(s => s.value.includes('只能“借”')); }));
  await page.getByRole('button', { name: '选题池', exact: true }).click();
  await page.getByRole('article', { name: '修鞋铺', exact: true }).getByText('已选', { exact: true }).waitFor();
  await page.getByRole('article', { name: '雨天', exact: true }).getByText('否掉的原因：不符合这集的主题', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '世界观', exact: true }).count(), 0);
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  await page.getByRole('tab', { name: '项目笔记', exact: true }).click();
  await page.getByText('导演意见.txt', { exact: true }).first().waitFor();
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.locator('.run', { hasText: '已加入规则库 1 条' }).waitFor(); // workflow runs are kept with the project
  await page.getByRole('tab', { name: '大纲' }).click();
  assert.match(await page.getByLabel('大纲', { exact: true }).inputValue(), /走向2：门墩儿的秘密2/);

  step('settings shows the activation, no usage anywhere');
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByText('测试工作室 · 第 1/3 台').waitFor();
  assert.ok(!(await page.locator('body').textContent())!.match(/积分余额|用量统计|credits/i));
  await page.getByRole('radio', { name: '宋体', exact: true }).click();
  assert.match(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--font-script')), /Songti SC/);
  await page.getByRole('radio', { name: '打字机（Courier Prime + 仿宋）', exact: true }).click();
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
  await page.getByRole('dialog', { name: '导出', exact: true }).getByRole('button', { name: /整个项目/ }).click();
  await page.getByText(`已导出到 ${arc}`).waitFor();
  assert.ok(!readFileSync(arc).toString('latin1').includes('conversationId":"c1'), 'the Ancher conversation id is not exported');
  await page.getByRole('button', { name: '返回首页' }).last().click();
  await page.getByRole('button', { name: '导入项目' }).click();
  await page.locator('.paper .node').first().waitFor();
  await page.locator('.paper .node').first().waitFor();
  assert.deepEqual(await page.locator('.paper .node').allTextContents(), original);
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  await page.getByRole('tab', { name: '项目笔记', exact: true }).click();
  await page.getByText('导演意见.txt', { exact: true }).first().waitFor(); // files travel with the project
  assert.ok(await page.evaluate(async () => { const id = (await window.api.projects.list())[0]!.id; return (await window.api.projects.open(id)).bible.rules.some(r => r.text.includes('笑点要来自孩子的视角')); }));

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
  // The writer's edit remains in project settings without a dedicated world panel.
  const lockedCore = await page.evaluate(async () => { const id = (await window.api.projects.list())[0]!.id; return (await window.api.projects.open(id)).bible.world.find(s => s.title === '锁定核心')?.value; });
  assert.match(lockedCore ?? '', /旧东西里有爱[\s\S]*大壮最后也借到了鞋/);

  step('制作: AI 分镜 for scene 1 (one undoable turn), cycle a shot size, image prompt, 制作设置 → 9:16, export the shot list; 分镜 view in the workspace');
  await page.getByRole('button', { name: '制作', exact: true }).click();
  await page.locator('.prod-strip .chip[aria-selected="true"]', { hasText: '1.' }).waitFor();
  await page.getByRole('button', { name: 'AI 分镜' }).click();
  await page.locator('.prod-shots .shot-row').nth(1).waitFor({ timeout: 20_000 });
  assert.match(fake.prompts.at(-1)!, /setShots[\s\S]*每个镜头 15 秒左右/, 'the clip length goes into the instruction');
  await page.locator('.prod-shots .shot-size').first().click();
  await page.locator('.prod-shots .shot-size', { hasText: '中景' }).waitFor();
  await page.getByRole('button', { name: '生成画面提示词' }).click();
  await page.getByText('傍晚胡同口，暖橙色逆光').waitFor();
  await page.getByRole('button', { name: '制作设置' }).click();
  await page.getByRole('tab', { name: '竖屏 9:16' }).click();
  await page.getByRole('radio', { name: /胡同水彩/ }).click();
  await page.getByRole('button', { name: '确认' }).click();
  await page.locator('.prod-frame.tall', { hasText: '9:16 · 胡同水彩' }).waitFor();
  const csv = join(tmp, 'shots.csv');
  await app.evaluate(({ dialog }, p) => { dialog.showSaveDialog = (async () => ({ canceled: false, filePath: p })) as typeof dialog.showSaveDialog; }, csv);
  await page.getByRole('button', { name: '导出分镜表' }).click();
  await page.getByText(`已导出到 ${csv}`).waitFor();
  assert.match(readFileSync(csv, 'utf8'), /"1",".*?","1","中景","胡同口，夕阳斜照","4"/);
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.getByRole('tab', { name: '分镜' }).click();
  assert.equal(await page.locator('.shot-scene').count(), 13);
  await page.locator('.shot-scene').first().locator('.shot-row').nth(1).waitFor();
  await shot(page, '13-shots');
  await page.getByRole('tab', { name: '剧本' }).click();

  step('AI panel (Ancher agent UI): thinking + tip, 加入队列, long-bubble clamp, actions, save, new conversation + history');
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.locator('.ag-hd .ico-btn[aria-label="新对话"]').filter({ visible: true }).click();
  await page.locator('.ag-grid').filter({ visible: true }).waitFor();
  const ask = page.getByLabel('给 AI 的指令', { exact: true }).filter({ visible: true });
  await ask.fill('__SLOW__ 第一条：写一场雨天的戏');
  await ask.press('Enter');
  await page.locator('.ag-thinking .shimmer', { hasText: 'Thinking' }).waitFor();
  await page.locator('.wait-tip').waitFor();
  const busyError = await page.evaluate(async () => { const id = (await window.api.projects.list())[0]!.id; try { await window.api.chat.newConversation(id); return ''; } catch (e) { return String(e); } });
  assert.match(busyError, /等待当前生成完成/);
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
  await page.getByRole('tab', { name: '项目笔记', exact: true }).click();
  await page.locator('.note-all').getByRole('button', { name: /AI 回复 .*\.md/ }).waitFor();

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
  step('final knowledge layout: full original text, metadata and shared content-page chat');
  await page.getByRole('radio', { name: '亮色' }).click();
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  const longNote = 'A'.repeat(21000) + '保留末尾正文';
  const longFile = join(tmp, '长笔记.md'); writeFileSync(longFile, longNote);
  await app.evaluate(({ dialog }, file) => { dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [file] })) as typeof dialog.showOpenDialog; }, longFile);
  await page.getByRole('button', { name: '添加文件', exact: true }).click();
  await page.locator('.note-all').getByRole('button', { name: '长笔记.md', exact: true }).click();
  await page.getByRole('button', { name: '编辑', exact: true }).click();
  const body = page.getByLabel('笔记原文', { exact: true });
  await page.waitForFunction(() => document.querySelector<HTMLTextAreaElement>('[aria-label="笔记原文"]')?.value.endsWith('保留末尾正文'));
  await body.fill(longNote + '修改'); await body.blur();
  await page.getByLabel('笔记标题').fill('客户参考笔记'); await page.getByLabel('笔记标题').blur();
  await page.getByRole('button', { name: /添加标签/ }).click();
  await page.getByLabel('添加标签').fill('Prompting'); await page.getByLabel('添加标签').press('Enter');
  await page.getByLabel('笔记备注').fill('客户导演意见'); await page.getByLabel('笔记备注').blur();
  const pid = await page.evaluate(async () => (await window.api.projects.list())[0]!.id);
  const noteId = await page.evaluate(async (id) => (await window.api.projects.open(id)).bible.files.find((f) => f.title === '客户参考笔记')!.id, pid);
  assert.equal(await page.evaluate(async ({ id, file }) => window.api.files.readBody(id, file), { id: pid, file: noteId }), longNote + '修改');
  await page.getByRole('button', { name: '更多笔记操作' }).click();
  await page.getByRole('menuitem', { name: '固定笔记', exact: true }).click();
  await page.getByRole('button', { name: '新建合集', exact: true }).click();
  await page.getByLabel('新合集名称').fill('客户资料');
  await page.getByLabel('新合集名称').dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true, keyCode: 229 });
  assert.equal(await page.getByLabel('新合集名称').isVisible(), true);
  await page.getByLabel('新合集名称').press('Enter');
  await page.getByRole('tab', { name: '摘要', exact: true }).click();
  await page.getByRole('button', { name: '生成摘要', exact: true }).click();
  await page.getByText('笔记包含客户参考资料和导演意见。').waitFor();
  await shot(page, '17-final-knowledge-light');
  await page.getByRole('button', { name: '角色', exact: true }).click();
  const beforeCount = await page.evaluate(async (id) => (await window.api.projects.open(id)).bible.characters.length, pid);
  const dockAsk = page.getByLabel('给 AI 的指令').filter({ visible: true });
  await dockAsk.fill('补充人物弧光'); await dockAsk.press('Enter');
  await page.getByText('补充了人物弧光。', { exact: true }).filter({ visible: true }).waitFor();
  await page.locator('.turn-line').filter({ visible: true }).last().getByRole('button', { name: '撤销', exact: true }).waitFor();
  await page.waitForFunction(async ({ id, count }) => (await window.api.projects.open(id)).bible.characters.length === count + 1, { id: pid, count: beforeCount });
  assert.ok(fake.prompts.at(-1)!.includes('当前页面：characters'));
  await page.locator('.turn-line').filter({ visible: true }).last().getByRole('button', { name: '撤销', exact: true }).click();
  assert.equal(await page.evaluate(async (id) => (await window.api.projects.open(id)).bible.characters.length, pid), beforeCount);
  await shot(page, '18-final-characters-dock');
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  await page.getByText('已撤销本轮 1 处修改').filter({ visible: true }).waitFor();
  await page.getByRole('button', { name: '返回首页' }).last().click();
  await page.getByRole('button', { name: '最近项目', exact: true }).click();
  await page.getByRole('button', { name: /^删除 / }).first().click();
  assert.ok(!(await page.evaluate(async () => window.api.projects.list())).some((p) => p.id === pid));
  await page.getByRole('button', { name: '回收站', exact: true }).click();
  await page.locator(`[data-project-id="${pid}"]`).getByRole('button', { name: '恢复', exact: true }).waitFor();
  await shot(page, '19-final-trash');
  await app.close(); ({ app, page } = await launch());
  await page.getByRole('button', { name: '最近项目', exact: true }).click();
  await page.getByRole('button', { name: '回收站', exact: true }).click();
  await page.locator(`[data-project-id="${pid}"]`).getByRole('button', { name: '恢复', exact: true }).click();
  await page.getByRole('button', { name: '最近', exact: true }).click();
  await page.locator(`[data-project-id="${pid}"]`).getByRole('button').first().click();
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  await page.getByRole('tab', { name: '项目笔记', exact: true }).click();
  await page.locator('.note-all').getByRole('button', { name: '客户参考笔记' }).click();
  assert.equal(await page.getByLabel('笔记备注').inputValue(), '客户导演意见');
  assert.equal(await page.getByRole('button', { name: '删除标签 Prompting' }).count(), 1);
  assert.equal(await page.getByRole('button', { name: '客户资料', exact: true }).count(), 1);
  const savedNote = await page.evaluate(async ({ id, file }) => (await window.api.projects.open(id)).bible.files.find((f) => f.id === file)!, { id: pid, file: noteId });
  assert.equal(savedNote.starred, true); assert.equal(savedNote.pinned, false); assert.equal(savedNote.revision, 2);
  assert.equal(await page.evaluate(async ({ id, file }) => window.api.files.readBody(id, file), { id: pid, file: noteId }), longNote + '修改');
  await page.getByLabel('笔记备注').fill('撤销测试'); await page.getByLabel('笔记备注').press('Tab');
  await page.waitForFunction(async ({ id, file }) => (await window.api.projects.open(id)).bible.files.find((f) => f.id === file)?.memo === '撤销测试', { id: pid, file: noteId });
  await page.getByRole('button', { name: '撤销笔记信息修改', exact: true }).click();
  await page.waitForFunction(() => document.querySelector<HTMLTextAreaElement>('[aria-label="笔记备注"]')?.value === '客户导演意见');
  const undoneNote = await page.evaluate(async ({ id, file }) => (await window.api.projects.open(id)).bible.files.find((f) => f.id === file)!, { id: pid, file: noteId });
  assert.equal(undoneNote.memo, '客户导演意见');
  assert.equal(await page.getByLabel('笔记备注').inputValue(), '客户导演意见');
  await page.getByRole('button', { name: '写作', exact: true }).click();
  const composingAsk = page.getByLabel('给 AI 的指令', { exact: true }).filter({ visible: true }); await composingAsk.fill('@');
  await composingAsk.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true, keyCode: 229 }); assert.equal(await composingAsk.inputValue(), '@'); await composingAsk.fill('');
  step('episode isolation, immediate export, cover and beats persist through archive round trip');
  await page.getByRole('button', { name: '写作', exact: true }).click();
  await page.getByRole('button', { name: '新建一集', exact: true }).click();
  await page.getByLabel('分集名称').fill('借来的东西');
  await page.getByRole('dialog', { name: '新建一集', exact: true }).getByRole('button', { name: '保存', exact: true }).click();
  await page.getByRole('button', { name: '第 2 集 借来的东西', exact: true }).waitFor();
  assert.equal((await page.evaluate(async (id) => window.api.projects.open(id), pid)).nodes.length, 0);
  await page.getByRole('button', { name: '设为动作', exact: true }).click();
  const immediate = join(tmp, 'immediate.txt');
  await app.evaluate(({ dialog }, p) => { dialog.showSaveDialog = (async () => ({ canceled: false, filePath: p })) as typeof dialog.showSaveDialog; }, immediate);
  await page.getByRole('textbox', { name: '动作', exact: true }).waitFor();
  // Same event loop: reproduces the original debounce race without a sleep or a slow dialog click.
  await page.evaluate(async (id) => { const el = document.querySelector<HTMLElement>('.paper [contenteditable]')!; el.textContent = '第二集最后一次输入'; el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '第二集最后一次输入' })); return window.api.exporter.save(id, 'txt'); }, pid);
  assert.match(readFileSync(immediate, 'utf8'), /第二集最后一次输入/);
  const oldFocus = await page.evaluate(() => { const el = document.querySelector<HTMLElement>('.paper [contenteditable]')!; el.focus(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection()!; s.removeAllRanges(); s.addRange(r); el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' })); el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true })); return el.dataset.id!; });
  await page.waitForFunction((old) => !!(document.activeElement as HTMLElement)?.dataset?.id && (document.activeElement as HTMLElement).dataset.id !== old, oldFocus);
  await page.getByRole('button', { name: '导出', exact: true }).click();
  const ed = page.getByRole('dialog', { name: '导出', exact: true });
  await ed.getByRole('radio', { name: /TXT/ }).check();
  await ed.getByRole('button', { name: '导出', exact: true }).click();
  await page.getByText(`已导出到 ${immediate}`).waitFor();
  assert.match(readFileSync(immediate, 'utf8'), /第二集最后一次输入/);
  await page.getByRole('button', { name: '故事节拍', exact: true }).click();
  await page.getByRole('textbox', { name: '故事节拍', exact: true }).fill('催化：借来的鞋');
  await page.getByRole('button', { name: '封面', exact: true }).click();
  await page.getByLabel('封面作者').fill('测试作者'); await page.getByLabel('封面作者').press('Tab');
  const epState = await page.evaluate(async (id) => window.api.projects.open(id), pid);
  assert.equal(epState.beats, '催化：借来的鞋'); assert.equal(epState.cover.author, '测试作者');
  await page.getByRole('button', { name: '第 1 集 第 1 集', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.episode-label[aria-current="page"]')?.textContent?.includes('第 1 集') && ![...document.querySelectorAll('.paper .node')].some((e) => e.textContent === '第二集最后一次输入'));
  assert.ok(!(await page.locator('.paper .node').allTextContents()).includes('第二集最后一次输入'));
  const multiArc = join(tmp, 'episodes.scripter');
  await app.evaluate(({ dialog }, p) => { dialog.showSaveDialog = (async () => ({ canceled: false, filePath: p })) as typeof dialog.showSaveDialog; dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [p] })) as typeof dialog.showOpenDialog; }, multiArc);
  await page.evaluate(async (id) => window.api.projects.exportArchive(id), pid);
  const restoredEp = await page.evaluate(async () => { const imported = await window.api.projects.importArchive(); return imported ? window.api.projects.open(imported.id) : null; });
  assert.equal(restoredEp?.episodes.length, 2);
  const secondData = await page.evaluate(async ({ id, ep }) => window.api.projects.episode(id, 'select', ep), { id: restoredEp!.meta.id, ep: epState.activeEpisodeId });
  assert.equal(secondData.cover.author, '测试作者'); assert.equal(secondData.beats, '催化：借来的鞋'); assert.ok(secondData.nodes.some((n) => n.text === '第二集最后一次输入'));
  assert.equal(await page.evaluate(() => document.fonts.check('14px "Courier Prime"') && document.fonts.check('14px "Zhuque Fangsong"')), true);
  // Prototype samples live only in this disposable E2E profile, never in customer projects.
  const visualId = await page.evaluate(async () => {
    const p = await window.api.projects.create('门墩儿', 'script');
    for (const c of [{name:'豆豆',role:'男 · 9 岁 · 三年级学生',desc:'胆小，心细，只有他看得见门墩儿。',color:'#c56808'}, {name:'门墩儿',role:'精灵 · 一百多岁 · 石门墩',desc:'嘴硬心软，能“借”不能“变”。',color:'#3266a2'}, {name:'姥爷',role:'男 · 68 岁 · 修车铺',desc:'话少，手巧，记得胡同每一样东西。'}, {name:'大壮',role:'男 · 9 岁 · 同学',desc:'爱显摆，其实很怕输。'}]) await window.api.bible.add(p.id, 'characters', c);
    for (const l of [{name:'胡同口',ie:'外景',times:['傍晚','日'],desc:'青砖灰瓦的老胡同入口，门墩儿就在豆豆家门口。',color:'#3266a2'}, {name:'豆豆家',ie:'内景',times:['夜'],desc:'两间小平房，饭桌挨着窗。',color:'#c56808'}, {name:'学校操场',ie:'外景',times:['日'],desc:'水泥地，旗杆，一圈杨树。'}, {name:'姥爷修车铺',ie:'内景',times:['夜'],desc:'胡同里的修车铺，墙上挂满零件。'}] as const) await window.api.bible.add(p.id, 'locations', {...l,times:[...l.times]});
    await window.api.bible.add(p.id, 'props', {name:'白球鞋',category:'服装',desc:'一双落满灰的旧球鞋。鞋底刻着一个“建”字。',color:'#bb8a24',x:60,y:60});
    await window.api.bible.add(p.id, 'props', {name:'石门墩',category:'场景',desc:'豆豆家门口的石狮子，门墩儿住在里面。',color:'#77776b',x:320,y:100});
    for (const title of ['一句话故事','核心议题']) await window.api.bible.add(p.id, 'world', {title,value:''});
    for (const name of ['第一季','导演意见','参考作品','角色设定']) await window.api.files.collection(p.id,'create',name);
    const s = await window.api.files.createNote(p.id, '《门墩儿·借来的白球鞋》逆向复刻提示词', '把第一集拆成「作品风格 · 主要角色 · 故事母题 · 四幕结构 · 对白风格」五块，可以直接喂给剧本生成。核心笑点：想偷懒省事，反而大费周章，最后回到原点。');
    const note = s.bible.files.at(-1)!;
    await window.api.files.update(p.id,note.id,{starred:true,memo:'第一集的逆向复刻提示词，含结构化版与一段式版',tags:[{label:'Animation',color:'#ad7438'},{label:'Prompting',color:'#777777'},{label:'门墩儿',color:'#608e53'},{label:'Scriptwriting',color:'#496cc2'}]});
    await window.api.bible.update(p.id,'files',note.id,{summary:note.excerpt}); await window.api.files.pin(p.id,note.id,true); return p.id;
  });
  await page.getByRole('button', { name: '返回首页', exact: true }).last().click(); await page.getByRole('button', { name: '最近项目', exact: true }).click(); await page.locator(`.recent[data-project-id="${visualId}"]`).getByRole('button').first().click();
  // Capture all content pages in both themes for visual review; empty and populated fixture data remain honest.

  for (const size of [[1360,860],[1440,960]] as const) {
  await app.evaluate(({ BrowserWindow }, size) => BrowserWindow.getAllWindows()[0]!.setContentSize(size[0], size[1]), size);
  // Hosted macOS screens clamp native height; use an explicit CSS viewport for visual fixtures.
  await page.setViewportSize({ width: size[0], height: size[1] });
  assert.deepEqual(await page.evaluate(() => [innerWidth, innerHeight]), [...size]);
  for (const theme of ['亮色', '暗色']) {
    await page.getByRole('button', { name: '设置', exact: true }).click(); await page.getByRole('radio', { name: theme }).click();
    for (const tab of ['写作', '角色', '地点', '道具', '知识库', '制作']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await page.locator(tab === '写作' ? '.writing-center' : '.content-main > *').first().waitFor({ state: 'visible' });
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      if (tab === '知识库') await page.getByRole('tab', { name: '摘要', exact: true }).click();
      if (tab === '制作') await page.getByRole('button', { name: '制作设置', exact: true }).click();
      await shot(page, `final-${tab}-${theme}-${size[0]}x${size[1]}`);
      if (tab === '制作') await page.getByRole('dialog', { name: '制作设置', exact: true }).getByRole('button', { name: '关闭', exact: true }).click();
    }
    await page.getByRole('button', { name: '设置', exact: true }).click(); await shot(page, `final-设置-${theme}-${size[0]}x${size[1]}`);
    await page.getByRole('button', { name: '返回首页', exact: true }).click(); await page.locator('#ask').waitFor(); await shot(page, `final-首页-${theme}-${size[0]}x${size[1]}`);
    await page.getByRole('button', { name: '最近项目', exact: true }).click(); await page.locator(`.recent[data-project-id="${visualId}"]`).waitFor(); await shot(page, `final-最近-${theme}-${size[0]}x${size[1]}`);
    await page.locator(`.recent[data-project-id="${visualId}"]`).getByRole('button').first().click(); await page.locator('.writing-center').waitFor({ state: 'visible' });
  }
  }
  await page.evaluate(async () => window.api.app.setTheme('system')); await app.close(); ({ app, page } = await launch()); assert.equal(await page.evaluate(() => window.api.app.getTheme()), 'system');
  console.log('\nE2E passed');
} catch (e) {
  await shot(page, 'failure').catch(() => {});
  throw e;
} finally {
  await app.close().catch(() => {});
  fake.server.close();
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
}
