import { describe, expect, it, vi } from 'vitest';
import { checkGeminiKey, mergeTranscriptSegments, transcribeWithGoogleCloud } from '../src/gemini.ts';

const subtitle = '1\n00:00:01,000 --> 00:00:02,000\n小明：你好。';
const response = (finishReason = 'STOP', text = JSON.stringify({ segments: [{ startMs: 1000, endMs: 2000, text: '小明：你好。' }] })) => new Response(JSON.stringify({ candidates: [{ finishReason, content: { parts: [{ text }] } }] }));

describe('Google Cloud API-key transcription', () => {
  it('validates against the same Cloud generateContent endpoint, without Files API', async () => {
    const f = vi.fn<typeof fetch>().mockResolvedValue(response());
    expect((await checkGeminiKey('cloud-key', f, 'google-cloud')).ok).toBe(true);
    expect(f.mock.calls[0]![0]).toBe('https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent');
    const init = f.mock.calls[0]![1]!;
    expect(init.headers).toMatchObject({ 'x-goog-api-key': 'cloud-key' });
    expect(JSON.parse(init.body as string).contents[0].parts[0].text).toBeTruthy();
  });
  it.each([[403, '权限'], [429, '配额'], [400, '请求']])('explains HTTP %s without echoing secrets', async (status, message) => {
    const f = vi.fn<typeof fetch>().mockResolvedValue(new Response('cloud-key', { status }));
    const result = await checkGeminiKey('cloud-key', f, 'google-cloud');
    expect(result.ok).toBe(false);
    expect(result.message).toContain(message);
    expect(result.message).not.toContain('cloud-key');
  });
  it('sends inline audio and extracts both SRT and plain text', async () => {
    const f = vi.fn<typeof fetch>().mockResolvedValue(response());
    const result = await transcribeWithGoogleCloud('key', new Uint8Array([1, 2, 3]), new AbortController().signal, f);
    const body = JSON.parse(f.mock.calls[0]![1]!.body as string);
    expect(body.contents[0].parts[0].inlineData).toEqual({ mimeType: 'audio/mpeg', data: 'AQID' });
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseSchema.properties.segments.items.required).toEqual(['startMs', 'endMs', 'text']);
    expect(result).toEqual({ srt: subtitle, text: '小明：你好。' });
  });
  it.each([['MAX_TOKENS', subtitle], ['STOP', ''], ['STOP', '这是一段摘要']])('rejects incomplete or invalid subtitles (%s)', async (reason, text) => {
    await expect(transcribeWithGoogleCloud('key', new Uint8Array([1]), new AbortController().signal, vi.fn<typeof fetch>().mockResolvedValue(response(reason, text)))).rejects.toThrow();
  });
  it('builds canonical subtitles locally, preserving multiline, numeric dialogue and arrows', async () => {
    const segments = [{ startMs: 1250, endMs: 2700, text: '12345\nA --> B' }, { startMs: 3000, endMs: 4000, text: '旁白：下一句' }];
    const f = vi.fn<typeof fetch>().mockResolvedValue(response('STOP', JSON.stringify({ segments })));
    expect(await transcribeWithGoogleCloud('key', new Uint8Array([1]), new AbortController().signal, f)).toEqual({
      srt: '1\n00:00:01,250 --> 00:00:02,700\n12345\nA --> B\n\n2\n00:00:03,000 --> 00:00:04,000\n旁白：下一句', text: '12345\nA --> B\n旁白：下一句',
    });
  });
  it('allows a silent audio segment without inventing subtitles', async () => {
    const f = vi.fn<typeof fetch>().mockResolvedValue(response('STOP', '{"segments":[]}'));
    expect(await transcribeWithGoogleCloud('key', new Uint8Array([1]), new AbortController().signal, f)).toEqual({ text: '', srt: '' });
  });
  it.each([
    {}, { segments: null }, { segments: [{ startMs: -1, endMs: 2, text: 'a' }] },
    { segments: [{ startMs: 2, endMs: 1, text: 'a' }] },
    { segments: [{ startMs: '1', endMs: 2, text: 'a' }] },
    { segments: [{ startMs: 1.5, endMs: 2, text: 'a' }] },
    { segments: [{ startMs: 1, endMs: 2, text: ' ' }] },
    { segments: [{ startMs: 1, endMs: 2, text: 'a' }, { startMs: 0, endMs: 1, text: 'b' }] },
  ])('rejects invalid structured transcript data', async (value) => {
    const f = vi.fn<typeof fetch>().mockResolvedValue(response('STOP', JSON.stringify(value)));
    await expect(transcribeWithGoogleCloud('key', new Uint8Array([1]), new AbortController().signal, f)).rejects.toThrow();
  });
  it('shifts each segment and renumbers subtitles', () => {
    expect(mergeTranscriptSegments([{ srt: subtitle, offsetSeconds: 0 }, { srt: subtitle, offsetSeconds: 600.25 }])).toEqual({
      srt: `${subtitle}\n\n2\n00:10:01,250 --> 00:10:02,250\n小明：你好。`, text: '小明：你好。\n小明：你好。',
    });
  });
  it('preserves numeric dialogue and arrows in the plain text transcript', () => {
    const result = mergeTranscriptSegments([{ srt: '1\n00:00:00,000 --> 00:00:01,000\n12345\nA --> B', offsetSeconds: 0 }]);
    expect(result.text).toBe('12345\nA --> B');
  });
  it('does not send an already cancelled request or oversized audio', async () => {
    const f = vi.fn<typeof fetch>();
    await expect(transcribeWithGoogleCloud('key', new Uint8Array([1]), AbortSignal.abort(), f)).rejects.toThrow();
    await expect(transcribeWithGoogleCloud('key', new Uint8Array(15 * 1024 * 1024), new AbortController().signal, f)).rejects.toThrow('过大');
    expect(f).not.toHaveBeenCalled();
  });
});
