import { _electron } from 'playwright-core';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
const env = { ...process.env };
for (const name of ['SCRIPTER_E2E', 'SCRIPTER_USER_DATA', 'SCRIPTER_LICENSE_PUBKEY', 'SCRIPTER_ANCHER_BASE_URL', 'ELECTRON_RENDERER_URL']) delete env[name];
const target = resolve('../../delivery/evidence'); mkdirSync(target, { recursive: true });
const profile = mkdtempSync(resolve(tmpdir(), 'aiscript-packaged-'));
const app = await _electron.launch({ executablePath: resolve(process.argv[2] || 'release/mac-arm64/Ancher Scripter.app/Contents/MacOS/Ancher Scripter'), env, args: ['--user-data-dir=' + profile] });
try {
 const page = await app.firstWindow(); await page.waitForLoadState('domcontentloaded');
 await page.getByRole('heading', { name: '激活 Ancher Scripter' }).waitFor();
 await page.screenshot({ path: resolve(target, process.argv[3] || 'packaged-mac-arm64-activation.png') });
 console.log(JSON.stringify(await app.evaluate(({ app }) => ({ packaged: app.isPackaged, version: app.getVersion(), userData: app.getPath('userData') }))));
 console.log('Packaged application cold startup passed; activation screen shown, no dev overrides.');
} finally { await app.close(); rmSync(profile, { recursive: true, force: true }); }
