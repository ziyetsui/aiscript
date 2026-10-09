// Real workflow UI, IPC, local FFmpeg and storage; only YouTube/Google network boundaries are simulated.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { _electron as electron } from 'playwright-core';
import { generateKeypair, issueOfflineCode } from '../../../packages/license/src/offline.ts';
const tmp = mkdtempSync(join(tmpdir(), 'scripter-youtube-e2e-'));
const { privatePem, publicPem } = generateKeypair(); writeFileSync(join(tmp, 'public.pem'), publicPem);
const media = join(tmp, 'media.mp4');
assert.equal(spawnSync(ffmpeg!, ['-v', 'error', '-f', 'lavfi', '-i', 'color=size=32x32:rate=1:duration=1', '-f', 'lavfi', '-i', 'sine=duration=1', '-shortest', '-c:v', 'mpeg4', '-c:a', 'aac', media]).status, 0);
const launch = () => electron.launch({ args: [join(import.meta.dirname, '..')], env: { ...process.env, SCRIPTER_E2E: '1', SCRIPTER_USER_DATA: join(tmp, 'data'), SCRIPTER_LICENSE_PUBKEY: join(tmp, 'public.pem') } });
let app = await launch();
try {
  let page = await app.firstWindow();
  const machine = await page.evaluate(async () => (await window.api.license.status()).machineCode);
  await page.locator('#code').fill(issueOfflineCode(privatePem, { mid: machine, cust: 'YouTube test', seat: '1', exp: null }));
  await page.getByRole('button', { name: '激活', exact: true }).click();
  await page.getByRole('button', { name: '稍后再填，先写剧本' }).click();
  await app.evaluate(async (_electron, mediaPath) => {
    const { syncBuiltinESMExports } = process.getBuiltinModule('node:module');
    const require = (name: string) => process.getBuiltinModule(name);
    const cp = require('node:child_process');
    const { EventEmitter } = require('node:events');
    const { PassThrough } = require('node:stream');
    const { writeFileSync, copyFileSync } = require('node:fs');
    const original = cp.spawn;
    cp.spawn = (command: string, args: string[], options: { signal?: AbortSignal }) => {
      if (!/yt-dlp(?:\.exe)?$/.test(command)) return original(command, args, options);
      const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.kill = () => child.emit('close', 1);
      setImmediate(() => {
        try {
          const url = args.at(-1)!;
          const captions = url.includes('caption1234');
          if (args.includes('--dump-single-json')) child.stdout.write(JSON.stringify({ id: captions ? 'caption1234' : 'audio123456', title: captions ? '有字幕的视频' : '无字幕的视频', language: 'zh', ...(captions ? { subtitles: { zh: [{}] } } : {}) }));
          else {
            const out = args[args.indexOf('-o') + 1]!;
            if (args.includes('--skip-download')) writeFileSync(out.replace('%(ext)s', 'zh.json3'), JSON.stringify({ events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: '来自现成字幕。' }] }] }));
            else copyFileSync(mediaPath, out.replace('%(ext)s', 'm4a'));
          }
          child.emit('close', 0);
        } catch (error) { child.emit('error', error); child.emit('close', 1); }
      });
      return child;
    };
    syncBuiltinESMExports();
    (globalThis as unknown as { googleAudioCalls: number }).googleAudioCalls = 0;
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(init!.body as string);
      if (body.contents[0].parts[0].inlineData) (globalThis as unknown as { googleAudioCalls: number }).googleAudioCalls++;
      return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ segments: [{ startMs: 0, endMs: 500, text: '来自 Gemini 音轨转写。' }] }) }] } }] }));
    };
  }, media);
  await page.locator('#ask').fill('YouTube 工作流测试'); await page.getByRole('button', { name: '开始', exact: true }).click();
  await page.locator('.writing-center').waitFor();
  const id = (await page.evaluate(() => window.api.projects.list()))[0]!.id;
  async function start(url: string) {
    await page.locator('#plus').filter({ visible: true }).click();
    await page.getByRole('menuitem', { name: '工作流', exact: true }).click();
    await page.getByRole('menuitem', { name: /^YouTube 视频 → 逐字稿/ }).click();
    const launcher = page.getByRole('form', { name: 'YouTube 视频 → 逐字稿', exact: true });
    await launcher.getByLabel('YouTube 视频链接', { exact: true }).fill(url);
    await launcher.getByRole('button', { name: '开始', exact: true }).click();
    for (let n = 0; n < 200; n++) {
      const state = await page.evaluate(id => window.api.projects.open(id), id);
      const run = state.runs.at(-1)!;
      if (run.status === 'failed') throw new Error(run.error);
      if (run.status === 'done' && run.applied) return state;
      await page.waitForTimeout(100);
    }
    throw new Error('YouTube workflow timed out');
  }
  let state = await start('https://youtu.be/caption1234');
  assert.equal(state.runs.at(-1)?.result?.kind, 'transcript');
  assert.equal(await app.evaluate(() => (globalThis as unknown as { googleAudioCalls: number }).googleAudioCalls), 0);
  assert.equal(state.bible.files.length, 2);
  assert.equal((await page.evaluate(() => window.api.keys.status())).ancher, false, 'YouTube workflow must not require Ancher');
  const result = await page.evaluate(() => window.api.keys.setGemini('youtube-test-key', 'google-cloud')); assert.equal(result.ok, true);
  state = await start('https://www.youtube.com/watch?v=audio123456');
  assert.equal(await app.evaluate(() => (globalThis as unknown as { googleAudioCalls: number }).googleAudioCalls), 1);
  assert.equal(state.bible.files.length, 4);
  for (const file of state.bible.files) {
    const content = await page.evaluate(({ id, fileId }) => window.api.files.readBody(id, fileId), { id, fileId: file.id });
    assert.match(content, /来自(?:现成字幕| Gemini 音轨转写)。/);
    if (file.name.endsWith('.srt')) assert.match(content, /^1\n00:00:00,000 --> /);
    else assert.match(content, /来源：https:\/\/www.youtube.com\/watch\?v=/);
  }
  await app.close(); app = await launch(); page = await app.firstWindow();
  state = await page.evaluate(id => window.api.projects.open(id), id);
  assert.equal(state.bible.files.length, 4); assert.ok(state.runs.every(run => run.status === 'done' && run.applied));
  console.log('YouTube E2E passed: real menu without Ancher key, captions without API calls, audio → FFmpeg → Gemini, TXT/SRT and restart persistence.');
} finally { await app.close().catch(() => {}); rmSync(tmp, { recursive: true, force: true }); }
