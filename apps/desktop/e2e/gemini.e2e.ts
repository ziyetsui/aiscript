// Real Electron + real local FFmpeg; only Google's network response is simulated.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
import { GOOD_KEY, startFakeAncher } from './fake-ancher.ts';

const fake = await startFakeAncher();
const tmp = mkdtempSync(join(tmpdir(), 'scripter-gemini-e2e-'));
const { privatePem, publicPem } = generateKeypair();
writeFileSync(join(tmp, 'public.pem'), publicPem);
const media = join(tmp, 'local-video.mp4');
assert.equal(spawnSync(ffmpeg!, ['-v', 'error', '-f', 'lavfi', '-i', 'color=size=32x32:rate=1:duration=1', '-f', 'lavfi', '-i', 'sine=duration=1', '-shortest', '-c:v', 'mpeg4', '-c:a', 'aac', media]).status, 0);
const env = { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: join(tmp, 'data'), SCRIPTER_LICENSE_PUBKEY: join(tmp, 'public.pem'), SCRIPTER_ANCHER_BASE_URL: fake.url };
const launch = () => electron.launch({ args: [join(import.meta.dirname, '..')], env });
let app = await launch();
try {
  let page = await app.firstWindow();
  const machine = await page.evaluate(async () => (await window.api.license.status()).machineCode);
  const code = issueOfflineCode(privatePem, { mid: machine, cust: 'Gemini test', seat: '1', exp: null });
  await page.locator('#code').fill(code);
  await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.getByRole('button', { name: '稍后再填，先写剧本' }).click();
  await page.getByRole('button', { name: '菜单', exact: true }).click();
  await page.getByRole('menuitem', { name: '设置', exact: true }).click();
  assert.equal(await page.getByLabel('Gemini 服务').inputValue(), 'ai-studio');
  await page.getByLabel('Gemini 服务').selectOption('google-cloud');
  await app.evaluate(() => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, init);
      if (String(url) !== 'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent') throw new Error('Unexpected endpoint');
      const key = (init?.headers as Record<string, string>)['x-goog-api-key'];
      if (key === 'denied-cloud-key') return new Response('{}', { status: 403 });
      if (key !== 'test-cloud-key') throw new Error('Unexpected credential');
      const body = JSON.parse(init!.body as string);
      const inline = body.contents[0].parts[0].inlineData;
      if (inline && (inline.mimeType !== 'audio/mpeg' || !inline.data)) throw new Error('Expected extracted MP3');
      if (inline && (body.generationConfig.responseMimeType !== 'application/json' || !body.generationConfig.responseSchema)) throw new Error('Expected structured transcription request');
      return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ segments: [{ startMs: 0, endMs: 500, text: '小明：你好。' }] }) }] } }] }));
    };
  });
  await page.locator('#k-gemini').fill('denied-cloud-key');
  const save = page.locator('form').filter({ has: page.locator('#k-gemini') }).getByRole('button', { name: '保存', exact: true });
  await save.click();
  await page.getByRole('alert').filter({ hasText: '权限不足' }).waitFor();
  assert.equal((await page.evaluate(() => window.api.keys.status())).gemini, false);
  await page.locator('#k-gemini').fill('test-cloud-key');
  await save.click();
  await page.getByText('已填写 · Google Cloud', { exact: true }).waitFor();
  const settings = JSON.parse(readFileSync(join(tmp, 'data', 'settings.json'), 'utf8'));
  assert.equal(settings.geminiService, 'google-cloud');
  assert.ok(!readFileSync(join(tmp, 'data', 'secrets.json'), 'utf8').includes('test-cloud-key'));
  const project = await page.evaluate(() => window.api.projects.create('本地视频转写', 'video'));
  await page.evaluate(async ({ id, filePath }) => window.api.workflows.start(id, 'transcribe', { filePath }), { id: project.id, filePath: media });
  let result = await page.evaluate(id => window.api.projects.open(id), project.id);
  for (let i = 0; i < 200 && !result.runs[0]?.applied && result.runs[0]?.status !== 'failed'; i++) {
    await page.waitForTimeout(100);
    result = await page.evaluate(id => window.api.projects.open(id), project.id);
  }
  assert.equal(result.runs[0]?.status, 'done', JSON.stringify(result.runs[0]));
  assert.ok(result.runs[0]?.applied?.includes('逐字稿.txt'));
  assert.equal(result.bible.files.length, 2);
  for (const file of result.bible.files) {
    assert.equal(file.extract, 'ready');
    assert.match(file.excerpt, /小明：你好。/);
    assert.match(await page.evaluate(({ id, fileId }) => window.api.files.readBody(id, fileId), { id: project.id, fileId: file.id }), /小明：你好。/);
  }
  // With Ancher connected, generated metadata is saved on both local notes.
  assert.equal((await page.evaluate(key => window.api.keys.setAncher(key), GOOD_KEY)).ok, true);
  const titled = await page.evaluate(() => window.api.projects.create('自动笔记信息', 'video'));
  await page.evaluate(({ id, filePath }) => window.api.workflows.start(id, 'transcribe', { filePath }), { id: titled.id, filePath: media });
  let titledResult = await page.evaluate(id => window.api.projects.open(id), titled.id);
  for (let i = 0; i < 200 && !titledResult.runs[0]?.applied && titledResult.runs[0]?.status !== 'failed'; i++) {
    await page.waitForTimeout(100);
    titledResult = await page.evaluate(id => window.api.projects.open(id), titled.id);
  }
  assert.equal(titledResult.bible.files.length, 2, JSON.stringify(titledResult.runs));
  assert.deepEqual(titledResult.bible.files.map(f => f.title), ['小明的问候 · 逐字稿', '小明的问候 · 字幕']);
  for (const file of titledResult.bible.files) {
    assert.equal(file.summary, '视频中小明向对方问好。');
    assert.match(file.excerpt, /小明：你好。/);
  }
  await app.close();
  app = await launch(); page = await app.firstWindow();
  const status = await page.evaluate(() => window.api.keys.status());
  assert.equal(status.geminiService, 'google-cloud');
  assert.equal(status.gemini, true);
  assert.ok(!JSON.stringify(status).includes('test-cloud-key'));
  assert.deepEqual((await page.evaluate(id => window.api.projects.open(id), titled.id)).bible.files.map(f => ({ title: f.title, summary: f.summary })), titledResult.bible.files.map(f => ({ title: f.title, summary: f.summary })));
  console.log('Gemini E2E passed: Cloud validation, encrypted key, video → MP3 → TXT/SRT, restart persistence.');
} finally {
  await app.close().catch(() => {});
  fake.server.close();
  rmSync(tmp, { recursive: true, force: true });
}
