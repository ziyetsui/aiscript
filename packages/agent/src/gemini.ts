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
