// Run only with a dedicated test license; never use a customer code.
// SCRIPTER_KEYGEN_TEST_LICENSE_FILE points to an ignored file containing that code.
import { _electron } from 'playwright-core';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

assert.ok(process.env.SCRIPTER_KEYGEN_TEST_LICENSE_FILE, 'A dedicated test license file is required');
const key = readFileSync(process.env.SCRIPTER_KEYGEN_TEST_LICENSE_FILE, 'utf8').trim();
assert.ok(key && !key.includes('\n'), 'Expected one dedicated test code');
const profile = mkdtempSync(resolve(tmpdir(), 'aiscript-keygen-live-'));
const evidence = resolve('../../delivery/evidence');
mkdirSync(evidence, { recursive: true });
const env = { ...process.env };
for (const name of ['SCRIPTER_KEYGEN_TEST_LICENSE_FILE', 'SCRIPTER_E2E', 'SCRIPTER_USER_DATA', 'SCRIPTER_LICENSE_PUBKEY', 'SCRIPTER_ANCHER_BASE_URL', 'ELECTRON_RENDERER_URL']) delete env[name];
const launch = () => _electron.launch({ executablePath: resolve(process.argv[2] || 'release/mac-arm64/Ancher Scripter.app/Contents/MacOS/Ancher Scripter'), env, args: ['--user-data-dir=' + profile] });
let app;
try {
  app = await launch();
  let page = await app.firstWindow();
  await page.getByRole('heading', { name: '激活 Ancher Scripter' }).waitFor();
  assert.equal(await page.getByRole('tab', { name: '在线激活' }).isEnabled(), true);
  await page.getByLabel('激活码', { exact: true }).fill(key);
  await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.getByRole('heading', { name: '连接 Ancher' }).waitFor({ timeout: 60000 });
  assert.equal((await page.evaluate(() => window.api.license.status())).state, 'active');
  const repeat = await page.evaluate(key => window.api.license.activateKeygen(key), key);
  assert.deepEqual(repeat, { ok: true });
  await page.screenshot({ path: resolve(evidence, 'keygen-live-beta4-activated.png') });
  await app.close(); app = undefined;
  app = await launch();
  page = await app.firstWindow();
  await page.getByRole('heading', { name: '连接 Ancher' }).waitFor();
  // Block main-process HTTP before reading persisted authorization again.
  await app.evaluate(() => { globalThis.fetch = async () => { throw new Error('offline verification: network blocked'); }; });
  const persisted = await page.evaluate(() => window.api.license.status());
  assert.equal(persisted.state, 'active');
  assert.equal(persisted.via, 'keygen');
  const result = { version: await app.evaluate(({ app }) => app.getVersion()), checkedAt: new Date().toISOString(), dedicatedTestLicense: true, firstActivation: 'passed', sameMachineReactivation: 'passed', restart: 'passed', offlineVerification: 'passed' };
  writeFileSync(resolve(evidence, 'keygen-live-beta4.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  if (app) await app.close();
  rmSync(profile, { recursive: true, force: true });
}
