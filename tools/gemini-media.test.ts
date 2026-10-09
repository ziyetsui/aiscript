import { afterEach, expect, it } from 'vitest';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { transcribeCloudMedia } from '../apps/desktop/src/main/gemini-media.ts';

const require = createRequire(new URL('../apps/desktop/package.json', import.meta.url));
const ffmpeg = require('ffmpeg-static') as string;
const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(p => rm(p, { recursive: true, force: true }))); });

it('extracts real media into bounded chunks, offsets subtitles and removes temporary audio', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cloud-media-test-')); dirs.push(dir);
  const media = join(dir, 'audio.wav');
  expect(spawnSync(ffmpeg, ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', media]).status).toBe(0);
  let calls = 0;
  const result = await transcribeCloudMedia(media, AbortSignal.timeout(15000), async (audio) => {
    expect(audio.length).toBeGreaterThan(0);
    expect(audio.length).toBeLessThan(100000);
    calls++;
    return { text: '你好', srt: '1\n00:00:00,000 --> 00:00:00,500\n你好' };
  }, { ffmpegPath: ffmpeg, tempRoot: dir, segmentSeconds: 2 });
  expect(calls).toBe(2);
  expect(result.text).toBe('你好\n你好');
  expect(result.srt).toMatch(/2\n00:00:02,\d{3} --> 00:00:02,\d{3}/);
  expect(await readdir(dir)).toEqual(['audio.wav']);
}, 20000);

it('cleans up when a Cloud request fails or media has no audio', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cloud-failure-test-')); dirs.push(dir);
  const media = join(dir, 'input.wav');
  expect(spawnSync(ffmpeg, ['-v', 'error', '-f', 'lavfi', '-i', 'sine=duration=1', media]).status).toBe(0);
  await expect(transcribeCloudMedia(media, new AbortController().signal, async () => { throw new Error('配额不足'); }, { ffmpegPath: ffmpeg, tempRoot: dir })).rejects.toThrow('配额不足');
  await writeFile(join(dir, 'invalid.mp4'), 'invalid');
  await expect(transcribeCloudMedia(join(dir, 'invalid.mp4'), new AbortController().signal, async () => ({ text: '', srt: '' }), { ffmpegPath: ffmpeg, tempRoot: dir })).rejects.toThrow('音轨');
  expect((await readdir(dir)).sort()).toEqual(['input.wav', 'invalid.mp4']);
});

it('cancels before extraction and skips silent segments', async () => {
  await expect(transcribeCloudMedia('unused', AbortSignal.abort(), async () => ({ text: '', srt: '' }), { ffmpegPath: ffmpeg })).rejects.toThrow();
  const dir = await mkdtemp(join(tmpdir(), 'cloud-silent-test-')); dirs.push(dir);
  const media = join(dir, 'silent.wav');
  expect(spawnSync(ffmpeg, ['-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '1', media]).status).toBe(0);
  await expect(transcribeCloudMedia(media, new AbortController().signal, async () => ({ text: '', srt: '' }), { ffmpegPath: ffmpeg, tempRoot: dir })).rejects.toThrow('人声');
  expect(await readdir(dir)).toEqual(['silent.wav']);
});
