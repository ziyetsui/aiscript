import { mergeTranscriptSegments } from './gemini.ts';

/** Accept only individual public YouTube video URLs; strip playlists and tracking. */
export function youtubeVideoUrl(input: string): string {
  let url: URL;
  try { url = new URL(input.trim()); } catch { throw new Error('请输入有效的 YouTube 视频链接'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('请输入 https:// 开头的 YouTube 视频链接');
  const host = url.hostname.toLowerCase();
  let id: string | undefined | null;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:shorts|embed|live)\/([^/]+)\/?$/.exec(url.pathname)?.[1];
  }
  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) throw new Error('请使用单个 YouTube 视频链接，不支持频道或播放列表');
  return `https://www.youtube.com/watch?v=${id}`;
}

/** YouTube JSON3 captions → canonical TXT/SRT. Ignore styling and non-text events. */
export function youtubeCaptions(value: unknown): { text: string; srt: string } {
  if (!value || typeof value !== 'object' || !('events' in value) || !Array.isArray(value.events)) throw new Error('没有可用的字幕');
  const cues: { start: number; end: number; text: string }[] = [];
  for (const event of value.events) {
    if (!event || !Array.isArray(event.segs)) continue;
    const text = event.segs.map((part: { utf8?: unknown }) => typeof part?.utf8 === 'string' ? part.utf8 : '').join('').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    if (!Number.isSafeInteger(event.tStartMs) || !Number.isSafeInteger(event.dDurationMs) || event.tStartMs < 0 || event.dDurationMs <= 0) throw new Error('字幕时间无效');
    const previous = cues.at(-1);
    if (previous && event.tStartMs < previous.start) throw new Error('字幕顺序无效');
    const end = event.tStartMs + event.dDurationMs;
    if (!Number.isSafeInteger(end)) throw new Error('字幕时间无效');
    // Rolling captions often repeat the same cue while it is still displayed.
    if (previous && event.tStartMs < previous.end && (text === previous.text || text.startsWith(previous.text + ' '))) {
      previous.text = text; previous.end = Math.max(previous.end, end); continue;
    }
    cues.push({ start: event.tStartMs, end, text });
  }
  if (!cues.length) throw new Error('没有可用的字幕');
  const time = (ms: number) => `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
  const srt = cues.map((cue, index) => `${index + 1}\n${time(cue.start)} --> ${time(cue.end)}\n${cue.text}`).join('\n\n');
  return mergeTranscriptSegments([{ srt, offsetSeconds: 0 }]);
}
