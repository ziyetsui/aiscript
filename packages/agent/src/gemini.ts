// Optional Gemini key (spec 0002 §5.5). Only checks the key here; transcription arrives with workflow ⌥7.
export async function checkGeminiKey(key: string, f: typeof fetch = fetch): Promise<{ ok: boolean; message: string }> {
  try {
    const r = await f('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', { headers: { 'x-goog-api-key': key } });
    if (r.ok) return { ok: true, message: 'Gemini key 可用' };
    return { ok: false, message: r.status === 400 || r.status === 403 ? 'Gemini key 无效' : `Gemini 返回 ${r.status}` };
  } catch {
    return { ok: false, message: '连不上 Gemini，请检查网络' };
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
