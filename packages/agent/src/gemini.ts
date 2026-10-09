export type GeminiService = 'ai-studio' | 'google-cloud';
export const geminiService = (value: unknown): GeminiService => value === 'google-cloud' ? 'google-cloud' : 'ai-studio';
const CLOUD = 'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent';

function apiError(status: number): string {
  if (status === 400) return 'Gemini 请求不被接受（400），请检查密钥、所选服务和模型是否可用';
  if (status === 401) return 'Gemini 认证失败（401），请检查密钥';
  if (status === 403) return 'Gemini 权限不足（403），请检查密钥限制、API 启用状态和账户权限';
  if (status === 429) return 'Gemini 配额不足或请求过于频繁（429），请检查用量后重试';
  if (status === 404) return 'Gemini 模型或接口不可用（404）';
  return `Gemini 返回 ${status}，请稍后重试`;
}

export async function checkGeminiKey(key: string, f: typeof fetch = fetch, service: GeminiService = 'ai-studio'): Promise<{ ok: boolean; message: string }> {
  try {
    const cloud = service === 'google-cloud';
    const r = await f(cloud ? CLOUD : 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
      method: cloud ? 'POST' : 'GET',
      signal: AbortSignal.timeout(30_000),
      headers: { 'x-goog-api-key': key, ...(cloud ? { 'Content-Type': 'application/json' } : {}) },
      ...(cloud ? { body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply OK.' }] }], generationConfig: { maxOutputTokens: 32, thinkingConfig: { thinkingBudget: 0 } } }) } : {}),
    });
    return r.ok ? { ok: true, message: 'Gemini key 可用' } : { ok: false, message: apiError(r.status) };
  } catch {
    return { ok: false, message: '连不上 Gemini 或请求超时，请检查网络' };
  }
}

// Transcription with the user's own Gemini key (spec 0002 §5.5): the file goes to Google's Files API,
// then one generateContent call returns SRT. [待实测] with a real key.
const BASE = 'https://generativelanguage.googleapis.com';
export const GEMINI_MODEL = 'gemini-2.5-flash';

const MIME: Record<string, string> = { mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac' };
export const mimeFor = (name: string) => MIME[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream';

export async function transcribeWithGemini(key: string, file: Blob, name: string, signal: AbortSignal, f: typeof fetch = fetch, model = GEMINI_MODEL): Promise<{ text: string; srt: string }> {
  const mime = mimeFor(name);
  const start = await f(`${BASE}/upload/v1beta/files`, {
    method: 'POST', signal,
    headers: { 'x-goog-api-key': key, 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Header-Content-Length': String(file.size), 'X-Goog-Upload-Header-Content-Type': mime, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: { display_name: name } }),
  });
  const url = start.headers.get('x-goog-upload-url');
  if (!start.ok || !url) throw new Error(`Gemini 上传失败（${start.status}）`);
  const up = await f(url, { method: 'POST', signal, headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' }, body: file });
  if (!up.ok) throw new Error(`Gemini 上传失败（${up.status}）`);
  let info = ((await up.json()) as { file: { name: string; uri: string; state: string } }).file;
  for (let i = 0; info.state === 'PROCESSING' && i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    if (signal.aborted) throw Object.assign(new Error('已取消'), { name: 'AbortError' });
    info = (await (await f(`${BASE}/v1beta/${info.name}`, { headers: { 'x-goog-api-key': key }, signal })).json()) as typeof info;
  }
  if (info.state !== 'ACTIVE') throw new Error('Gemini 没能处理这个文件');
  const gen = await f(`${BASE}/v1beta/models/${model}:generateContent`, {
    method: 'POST', signal, headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ file_data: { mime_type: mime, file_uri: info.uri } }, { text: '把这段音视频里的所有对白和旁白逐字转写成中文 SRT 字幕（保留说话人，如「豆豆：」）。只输出 SRT。' }] }] }),
  });
  if (!gen.ok) throw new Error(`Gemini 转写失败（${gen.status}）`);
  const out = (await gen.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const srt = (out.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').replace(/^```(?:srt)?\s*|```\s*$/g, '').trim();
  return { srt, text: srtToText(srt) };
}

/** Plain text from SRT: drop counters and timestamps, keep lines in order. */
export function srtToText(srt: string): string {
  return srt
    .split(/\r?\n/)
    .filter((l) => l.trim() && !/^\d+$/.test(l.trim()) && !/-->/.test(l))
    .join('\n');
}

/** Cloud express mode accepts inline media, rather than AI Studio Files API handles. */
export async function transcribeWithGoogleCloud(key: string, audio: Uint8Array, signal: AbortSignal, f: typeof fetch = fetch): Promise<{ text: string; srt: string }> {
  return transcribeGeminiAudio(key, audio, signal, 'google-cloud', f);
}

export async function transcribeGeminiAudio(key: string, audio: Uint8Array, signal: AbortSignal, service: GeminiService, f: typeof fetch = fetch): Promise<{ text: string; srt: string }> {
  signal.throwIfAborted();
  if (audio.byteLength > 14 * 1024 * 1024) throw new Error('音频分段过大，请缩短后重试');
  const r = await f(service === 'google-cloud' ? CLOUD : `${BASE}/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST', signal, headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType: 'audio/mpeg', data: Buffer.from(audio).toString('base64') } },
        { text: '逐字转写这段音频中的所有对白和旁白，保留原语言、口头语；只标注能够确认的说话人，不猜测姓名。返回 segments 数组，每项 startMs 和 endMs 是相对本段音频起点的整数毫秒时间，text 是逐字原文。按开始时间升序排列，不要摘要或翻译。没有人声时返回空的 segments 数组。' },
      ] }],
      generationConfig: {
        maxOutputTokens: 32768, thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT', required: ['segments'],
          properties: { segments: { type: 'ARRAY', items: {
            type: 'OBJECT', required: ['startMs', 'endMs', 'text'],
            properties: { startMs: { type: 'INTEGER' }, endMs: { type: 'INTEGER' }, text: { type: 'STRING' } },
          } } },
        },
      },
    }),
  });
  if (!r.ok) throw new Error(apiError(r.status));
  const out = await r.json() as { candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
  const candidate = out.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new Error('Gemini 转写未完整结束，请重试或缩短音频');
  const raw = (candidate.content?.parts ?? []).filter(p => !p.thought).map(p => p.text ?? '').join('').trim();
  let result: unknown;
  try { result = JSON.parse(raw); } catch { throw new Error('Gemini 返回的转写数据无法解析，请重试'); }
  if (!result || typeof result !== 'object' || !('segments' in result) || !Array.isArray(result.segments)) throw new Error('Gemini 返回的转写数据不完整，请重试');
  const blocks: string[] = [];
  const text: string[] = [];
  let previousStart = -1;
  for (const segment of result.segments) {
    if (!segment || typeof segment !== 'object' || !Number.isSafeInteger(segment.startMs) || !Number.isSafeInteger(segment.endMs) || segment.startMs < 0 || segment.endMs <= segment.startMs || segment.startMs < previousStart) throw new Error('Gemini 返回的转写时间无效，请重试');
    if (typeof segment.text !== 'string' || !segment.text.trim()) throw new Error('Gemini 返回的转写内容为空，请重试');
    // A blank line separates SRT cues; it cannot occur inside a cue's text.
    const line = segment.text.replace(/\r\n?/g, '\n').split('\n').filter((line: string) => line.trim()).join('\n').trim();
    previousStart = segment.startMs;
    blocks.push(`${blocks.length + 1}\n${formatTime(segment.startMs)} --> ${formatTime(segment.endMs)}\n${line}`);
    text.push(line);
  }
  return { srt: blocks.join('\n\n'), text: text.join('\n') };
}

const timestamp = '(\\d{2,}):(\\d{2}):(\\d{2}),(\\d{3})';
const timing = new RegExp(`^${timestamp} --> ${timestamp}$`);
const millis = (parts: string[]) => ((Number(parts[0]) * 60 + Number(parts[1])) * 60 + Number(parts[2])) * 1000 + Number(parts[3]);
function formatTime(value: number): string {
  const ms = Math.round(value);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
}

export function mergeTranscriptSegments(segments: { srt: string; offsetSeconds: number }[]): { text: string; srt: string } {
  const blocks: string[] = [];
  const text: string[] = [];
  for (const segment of segments) {
    if (!Number.isFinite(segment.offsetSeconds) || segment.offsetSeconds < 0) throw new Error('音频分段时间无效');
    if (!segment.srt.trim()) throw new Error('Gemini 没有返回有效字幕，请重试');
    for (const block of segment.srt.trim().split(/\r?\n\s*\r?\n/)) {
      const lines = block.trim().split(/\r?\n/);
      const match = timing.exec(lines[1] ?? '');
      if (!/^\d+$/.test(lines[0] ?? '') || !match || !lines.slice(2).join('').trim()) throw new Error('Gemini 返回的字幕格式无效，请重试');
      const start = millis(match.slice(1, 5));
      const end = millis(match.slice(5, 9));
      if (end < start || [match[2], match[3], match[6], match[7]].some(n => Number(n) >= 60)) throw new Error('Gemini 返回的字幕时间无效，请重试');
      text.push(lines.slice(2).join('\n'));
      const offset = segment.offsetSeconds * 1000;
      blocks.push(`${blocks.length + 1}\n${formatTime(start + offset)} --> ${formatTime(end + offset)}\n${lines.slice(2).join('\n')}`);
    }
  }
  const srt = blocks.join('\n\n');
  return { srt, text: text.join('\n') };
}
