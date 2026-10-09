import { describe, expect, it, vi } from 'vitest';
import { youtubeCaptions, youtubeVideoUrl, workflow, newRun, execute, type WorkflowEnv } from '../src/index.ts';
import { ScriptDoc } from '@scripter/core';

describe('YouTube video input and captions', () => {
  it.each(['https://youtu.be/abcdefghijk?t=30', 'https://m.youtube.com/watch?v=abcdefghijk&list=playlist', 'https://www.youtube.com/shorts/abcdefghijk', 'https://www.youtube.com/live/abcdefghijk'])('normalizes an individual video URL (%s)', input => {
    expect(youtubeVideoUrl(input)).toBe('https://www.youtube.com/watch?v=abcdefghijk');
  });
  it.each(['file:///etc/passwd', 'https://youtube.com.evil.test/watch?v=abcdefghijk', 'https://youtube.com@evil.test/watch?v=abcdefghijk', 'https://youtube.com/playlist?list=xx', 'https://youtu.be/short', 'https://youtube.com:8443/watch?v=abcdefghijk'])('rejects invalid or non-YouTube input (%s)', input => expect(() => youtubeVideoUrl(input)).toThrow());
  it('converts timed captions and merges overlapping rolling duplicates', () => {
    expect(youtubeCaptions({ events: [
      { tStartMs: 1000, dDurationMs: 2000, segs: [{ utf8: 'Hello' }] },
      { tStartMs: 1500, dDurationMs: 2000, segs: [{ utf8: 'Hello world' }] },
      { tStartMs: 3500, dDurationMs: 1000, segs: [{ utf8: '12345' }, { utf8: '\nA --> B' }] },
      { tStartMs: 4500, segs: [{ utf8: '\n' }] },
    ] })).toEqual({ text: 'Hello world\n12345 A --> B', srt: '1\n00:00:01,000 --> 00:00:03,500\nHello world\n\n2\n00:00:03,500 --> 00:00:04,500\n12345 A --> B' });
  });
  it('keeps genuinely repeated speech at different times', () => {
    expect(youtubeCaptions({ events: [0, 2000].map(tStartMs => ({ tStartMs, dDurationMs: 1000, segs: [{ utf8: '你好' }] })) }).text).toBe('你好\n你好');
  });
  it.each([{}, { events: [] }, { events: [{ tStartMs: -1, dDurationMs: 100, segs: [{ utf8: 'a' }] }] }])('rejects absent or invalid captions', input => expect(() => youtubeCaptions(input)).toThrow());
});

it('YouTube workflow validates the URL before touching a downloader and produces a transcript result', async () => {
  const doc = new ScriptDoc();
  const youtube = vi.fn(async () => ({ fileName: '视频.mp3', text: '你好', srt: '字幕', provider: 'YouTube 原有字幕' }));
  const env: WorkflowEnv = { title: () => '', nodes: () => [], outline: () => '', bible: () => doc.readBible(), chat: async () => ({ text: '', citations: [] }), parse: async () => '', transcribe: async () => ({ text: '', srt: '' }), hotspots: async () => ({ items: [], failedSources: [], fetchedAt: 0 }), hasGemini: () => false, youtube };
  const def = workflow('youtube');
  expect((await execute(def, newRun(def, { url: 'https://evil.test' }, 'bad'), env, new AbortController().signal, () => {})).status).toBe('failed');
  expect(youtube).not.toHaveBeenCalled();
  const run = await execute(def, newRun(def, { url: 'https://youtu.be/abcdefghijk' }, 'good'), env, new AbortController().signal, () => {});
  expect(run.result).toEqual({ kind: 'transcript', fileName: '视频.mp3', text: '你好', srt: '字幕', provider: 'YouTube 原有字幕' });
  expect(youtube.mock.calls).toHaveLength(1);
});
