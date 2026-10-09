// Real Electron input and Web Audio; only the remote Ancher response is simulated.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { GOOD_KEY, startFakeAncher } from './fake-ancher.ts';

const fake = await startFakeAncher();
const tmp = mkdtempSync(join(tmpdir(), 'scripter-typewriter-'));
const { privatePem, publicPem } = generateKeypair();
writeFileSync(join(tmp, 'pub.pem'), publicPem);
const app = await electron.launch({ args: [join(import.meta.dirname, '..')], env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: join(tmp, 'data'), SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: fake.url } });
const page = await app.firstWindow();
page.setDefaultTimeout(20000);
const count = () => page.evaluate(() => (window as unknown as { typingSounds: number }).typingSounds);
try {
  await app.evaluate(({ BrowserWindow }) => { for (const w of BrowserWindow.getAllWindows()) w.hide(); });
  const machine = await page.evaluate(async () => (await window.api.license.status()).machineCode);
  await page.locator('#code').fill(issueOfflineCode(privatePem, { mid: machine, cust: '音效测试', seat: '1', exp: null }));
  await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.locator('#k-ancher').fill(GOOD_KEY);
  await page.getByRole('button', { name: '验证并保存' }).click();
  await page.locator('#ask').waitFor();
  await page.evaluate(() => {
    localStorage.setItem('tw-sound', 'off'); // Old checkbox preference must no longer disable manual typing.
    (window as unknown as { typingSounds: number }).typingSounds = 0;
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      (window as unknown as { typingSounds: number }).typingSounds++;
      return create.call(this);
    };
  });
  await page.locator('#ask').fill('写第一场');
  await page.getByRole('button', { name: '开始', exact: true }).click();
  await page.getByText('本轮 6 处修改').waitFor();
  await page.waitForFunction(() => !document.querySelector('.node.caret') && document.querySelectorAll('.paper .node').length === 4);
  assert.equal(await page.getByLabel('打字机音效', { exact: true }).count(), 0);
  assert.equal(await count(), 0, 'AI generation is silent');
  const line = page.locator('.paper .node').last();
  await line.click();
  await page.keyboard.press('End');
  await page.keyboard.type('abc');
  assert.equal(await count(), 3, 'one sound per manually typed letter');
  await page.keyboard.type('你好');
  assert.equal(await count(), 5, 'Chinese text insertion plays sounds too');
  await page.keyboard.press('Enter');
  assert.equal(await count(), 6, 'manual paragraph break plays a carriage return');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await count(), 6, 'format and navigation keys are silent');
  console.log('PASS: checkbox removed, AI silent, English/Chinese manual typing and Enter audible, navigation silent.');
} finally {
  await app.close();
  fake.server.close();
  rmSync(tmp, { recursive: true, force: true });
}
