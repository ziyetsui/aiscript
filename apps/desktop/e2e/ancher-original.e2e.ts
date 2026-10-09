// Regression: AI content is Summary; Original uses independent source files, media and subtitles.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { cloudNote, GOOD_KEY, startFakeAncher } from './fake-ancher.ts';
const fake = await startFakeAncher();
Object.assign(fake.cloudNotes[0]!, { url: null, downloaded_files: [{ id: 'source', filename: '原始文本.txt', mimetype: 'text/plain' }, { id: 'video', filename: '源视频.mp4', mimetype: 'video/mp4' }], transcript_file: { id: 'transcript', filename: '字幕.srt', mimetype: 'application/x-subrip' } });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
let base = ''; let leaked = false; let summaryFail = false;
const signatures = new Map<string, number>();
const proxy = createServer(async (req, res) => {
  const url = new URL(req.url!, base);
  const json = (body: unknown) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
  const id = url.pathname.match(/\/files\/([^/]+)\/content\/presigned-urls$/)?.[1];
  if (id) { const signature = (signatures.get(id) ?? 0) + 1; signatures.set(id, signature); return json({ download_url: `${base}/cdn/${id}?signature=${signature}`, expires_in: 300 }); }
  if (url.pathname.endsWith('/content/presigned-urls')) return json({ download_url: `${base}/cdn/summary`, expires_in: 300 });
  if (url.pathname.startsWith('/cdn/')) {
    if (summaryFail && url.pathname === '/cdn/summary') { res.writeHead(503); return res.end('unavailable'); }
    if (req.headers.authorization) leaked = true;
    if (url.pathname === '/cdn/image') { res.writeHead(200, { 'content-type': 'image/png', 'access-control-allow-origin': '*' }); return res.end(png); }
    res.writeHead(200, { 'content-type': 'text/plain' });
    return res.end(url.pathname === '/cdn/summary' ? '# AI 详细摘要\n\n![剧照](streamify-file://image)' : url.pathname === '/cdn/transcript' ? '1\n00:00:00,000 --> 00:00:01,000\n原始对白' : '未经摘要的原始文本');
  }
  const response = await fetch(`${fake.url}${req.url}`, { method: req.method, headers: req.headers.authorization ? { authorization: req.headers.authorization } : {} });
  res.writeHead(response.status, { 'content-type': response.headers.get('content-type') || 'application/json' }); res.end(Buffer.from(await response.arrayBuffer()));
});
await new Promise<void>((r) => proxy.listen(0, '127.0.0.1', r));
base = `http://127.0.0.1:${(proxy.address() as { port: number }).port}`;
const tmp = mkdtempSync(join(tmpdir(), 'scripter-original-'));
const { privatePem, publicPem } = generateKeypair(); writeFileSync(join(tmp, 'pub.pem'), publicPem);
const app = await electron.launch({ args: [join(import.meta.dirname, '..')], colorScheme: null as never, env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: join(tmp, 'data'), SCRIPTER_LICENSE_PUBKEY: join(tmp, 'pub.pem'), SCRIPTER_ANCHER_BASE_URL: base } });
const page = await app.firstWindow(); page.setDefaultTimeout(20000);
await app.evaluate(({ BrowserWindow }) => { for (const window of BrowserWindow.getAllWindows()) window.hide(); });
try {
  await page.locator('.mc .tnum').waitFor(); const mid = (await page.locator('.mc .tnum').textContent())!.trim();
  await page.locator('#code').fill(issueOfflineCode(privatePem, { mid, cust: '原文测试', seat: '1/1', exp: null })); await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.locator('#k-ancher').fill(GOOD_KEY); await page.getByRole('button', { name: '验证并保存' }).click(); await page.locator('#ask').waitFor();
  await page.evaluate(async () => window.api.projects.create('原文测试'));
  await page.getByRole('button', { name: '最近项目', exact: true }).click(); await page.getByText('原文测试', { exact: true }).first().click();
  await page.getByRole('button', { name: '知识库', exact: true }).click();
  await page.getByRole('heading', { name: 'AI 详细摘要' }).waitFor();
  assert.equal(await page.getByRole('tab', { name: '摘要', exact: true }).getAttribute('aria-selected'), 'true');
  await page.waitForFunction(() => { const img = document.querySelector<HTMLImageElement>('.cloud-note-image'); return img?.complete && img.naturalWidth > 0; });
  assert.ok(!(await page.locator('.note-body').innerText()).includes('streamify-file://'));
  await page.getByRole('tab', { name: '原文', exact: true }).click(); await page.getByText('未经摘要的原始文本', { exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'AI 详细摘要' }).count(), 0);
  await page.getByLabel('选择原文文件').selectOption('video'); await page.getByLabel('原文视频').waitFor();
  assert.ok((await page.getByLabel('原文视频').getAttribute('src'))!.startsWith(`${base}/cdn/video?signature=`));
  await page.waitForFunction(() => !document.querySelector('.note-body')?.textContent?.includes('正在读取'));
  const previousVideo = await page.getByLabel('原文视频').getAttribute('src');
  await page.getByLabel('原文视频').evaluate((video) => video.dispatchEvent(new Event('error')));
  await page.waitForFunction((previous) => document.querySelector('video')?.getAttribute('src') !== previous, previousVideo, { timeout: 25000 });
  await page.getByLabel('选择原文文件').selectOption('transcript'); await page.getByText(/原始对白/).waitFor();
  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate(async (theme) => window.api.app.setTheme(theme), theme);
    await page.waitForFunction((theme) => matchMedia('(prefers-color-scheme: dark)').matches === (theme === 'dark'), theme);
    await page.evaluate(async () => { await Promise.all(document.getAnimations().filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime)).map((a) => a.finished.catch(() => {}))); });
    mkdirSync(join(import.meta.dirname, 'shots'), { recursive: true });
    await page.screenshot({ path: join(import.meta.dirname, 'shots', `ancher-original-${theme}.png`) });
  }
  summaryFail = true;
  await page.getByRole('tab', { name: '原文', exact: true }).click();
  await page.getByText(/原始对白/).waitFor();
  await page.getByRole('tab', { name: '摘要', exact: true }).click();
  await page.locator('.note-body [role=alert]').waitFor();
  await page.getByRole('tab', { name: '原文', exact: true }).click();
  await page.getByText(/原始对白/).waitFor();
  summaryFail = false;
  await page.route('https://www.youtube.com/embed/**', async (route) => { assert.equal(route.request().headers().authorization, undefined); await route.fulfill({ contentType: 'text/html', body: '<html><body>YouTube test player</body></html>' }); });
  Object.assign(fake.cloudNotes[0]!, { url: 'https://youtu.be/dQw4w9WgXcQ', status: 'fetched', updated_at: 1750000010 });
  await page.getByRole('button', { name: '刷新 Ancher 笔记', exact: true }).click(); await page.getByText(/内容已获取，正在生成/, { exact: false }).first().waitFor();
  await page.getByText(/原始对白/).waitFor();
  await page.getByTitle('YouTube 原文视频').waitFor();
  await page.getByRole('region', { name: '转录', exact: true }).getByText(/原始对白/).waitFor();
  assert.equal(await page.getByTitle('YouTube 原文视频').getAttribute('src'), 'https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0');
  assert.equal(await page.getByLabel('选择原文文件').count(), 0, 'transcript is visible without file switching');
  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate(async (t) => window.api.app.setTheme(t), theme);
    await page.waitForFunction((t) => matchMedia('(prefers-color-scheme: dark)').matches === (t === 'dark'), theme);
    await page.evaluate(async () => { await Promise.all(document.getAnimations().filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime)).map((a) => a.finished.catch(() => {}))); });
    await page.screenshot({ path: join(import.meta.dirname, 'shots', `ancher-url-source-${theme}.png`) });
  }
  Object.assign(fake.cloudNotes[0]!, { url: 'https://example.com/video', updated_at: 1750000020 });
  await page.getByRole('button', { name: '刷新 Ancher 笔记', exact: true }).click();
  await page.getByTitle('YouTube 原文视频').waitFor({ state: 'hidden' });
  await page.locator('.cloud-source-files summary').click();
  await page.getByLabel('选择原文文件').selectOption('video');
  await page.getByLabel('原文视频').waitFor();
  assert.equal(leaked, false, 'account credentials must not reach source CDN');
  console.log('Ancher summary / original / images / video / transcript E2E passed');
} finally { await app.close(); proxy.close(); fake.server.close(); rmSync(tmp, { recursive: true, force: true }); }
