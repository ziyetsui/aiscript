import { afterEach, expect, it, vi } from 'vitest';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { youtubeTools, transcribeYouTube, type ToolRunner } from '../../apps/desktop/src/main/youtube.ts';
const dirs: string[] = [];
afterEach(async () => { for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true }); });
const root = async () => { const dir = await mkdtemp(join(tmpdir(), 'youtube-test-')); dirs.push(dir); return dir; };
const signal = () => new AbortController().signal;
const url = 'https://youtu.be/abcdefghijk';
const metadata = (captions = true) => JSON.stringify({ id: 'abcdefghijk', title: '视频标题', language: 'zh', ...(captions ? { subtitles: { zh: [{}] } } : {}) });
const output = (args: string[]) => args[args.indexOf('-o') + 1]!;
it('reports a missing executable clearly', async () => {
  await expect(youtubeTools(await root())([], signal(), 1000)).rejects.toThrow('缺少视频下载工具');
});
it.skipIf(process.platform === 'win32')('stops a real child process on timeout and cancellation', async () => {
  const dir = await root();
  await writeFile(join(dir, 'yt-dlp'), '#!/bin/sh\nexec sleep 30\n', { mode: 0o755 });
  const run = youtubeTools(dir);
  await expect(run([], signal(), 50)).rejects.toThrow('下载超时');
  const abort = new AbortController();
  const promise = run([], abort.signal, 1000);
  abort.abort();
  await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
});
it('imports existing captions without downloading media or calling Gemini, then removes temporary files', async () => {
  const dir = await root();
  const run = vi.fn<ToolRunner>(async args => {
    if (args.includes('--dump-single-json')) return metadata();
    await writeFile(output(args).replace('%(ext)s', 'zh.json3'), JSON.stringify({ events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: '原有字幕' }] }] })); return '';
  });
  const transcribe = vi.fn();
  expect(await transcribeYouTube(url, signal(), { run, transcribe, tempRoot: dir })).toMatchObject({ text: '原有字幕', provider: 'YouTube 原有字幕' });
  expect(transcribe).not.toHaveBeenCalled(); expect(await readdir(dir)).toEqual([]);
  expect(run.mock.calls.every(([args]) => args.at(-2) === '--' && args.at(-1) === 'https://www.youtube.com/watch?v=abcdefghijk')).toBe(true);
});
it('falls back from invalid captions to an audio-only download and transcribes locally', async () => {
  const dir = await root();
  const run = vi.fn<ToolRunner>(async args => {
    if (args.includes('--dump-single-json')) return metadata();
    if (args.includes('--skip-download')) await writeFile(output(args).replace('%(ext)s', 'zh.json3'), '{}');
    else { expect(args[args.indexOf('-f') + 1]).toBe('bestaudio'); await writeFile(output(args).replace('%(ext)s', 'm4a'), 'audio'); }
    return '';
  });
  const transcribe = vi.fn(async (path: string) => { expect((await readdir(dirname(path))).length).toBe(1); return { text: '转写内容', srt: '字幕' }; });
  expect(await transcribeYouTube(url, signal(), { run, transcribe, tempRoot: dir })).toMatchObject({ text: '转写内容', provider: 'Gemini' });
  expect(transcribe).toHaveBeenCalledOnce(); expect(await readdir(dir)).toEqual([]);
});
it('does not download audio without a Gemini key when captions are absent', async () => {
  const run = vi.fn<ToolRunner>(async () => metadata(false));
  await expect(transcribeYouTube(url, signal(), { run })).rejects.toThrow('Gemini key');
  expect(run).toHaveBeenCalledOnce();
});
it('cleans up after cancellation and does not continue into transcription', async () => {
  const dir = await root(), abort = new AbortController();
  const run: ToolRunner = async () => { abort.abort(); throw Object.assign(new Error('cancelled'), { name: 'AbortError' }); };
  const transcribe = vi.fn();
  await expect(transcribeYouTube(url, abort.signal, { run, transcribe, tempRoot: dir })).rejects.toThrow('cancelled');
  expect(transcribe).not.toHaveBeenCalled(); expect(await readdir(dir)).toEqual([]);
});
