import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { youtubeCaptions, youtubeVideoUrl } from '@scripter/agent';

type Transcript = { text: string; srt: string };
type Metadata = { id: string; title?: string; language?: string; is_live?: boolean; subtitles?: Record<string, unknown>; automatic_captions?: Record<string, unknown> };
export type ToolRunner = (args: string[], signal: AbortSignal, timeoutMs: number) => Promise<string>;

export function youtubeTools(root: string, browser?: string): ToolRunner {
  if (browser && !['chrome', 'safari', 'edge', 'firefox'].includes(browser)) throw new Error('不支持这个浏览器');
  const exe = process.platform === 'win32' ? '.exe' : '';
  return (args, signal, timeoutMs) => new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const child = spawn(join(root, `yt-dlp${exe}`), ['--ignore-config', '--no-playlist', '--no-warnings', '--socket-timeout', '30', '--js-runtimes', `deno:${join(root, `deno${exe}`)}`, ...(browser ? ['--cookies-from-browser', browser] : []), ...args], { signal, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', error = '', failure: Error | undefined;
    const timeout = setTimeout(() => { failure = new Error('视频下载超时，请检查网络后重试'); child.kill(); }, timeoutMs);
    child.stdout.on('data', (bytes) => { output += String(bytes); if (output.length > 4 * 1024 * 1024) { failure = new Error('视频信息过大'); child.kill(); } });
    child.stderr.on('data', (bytes) => { error = (error + String(bytes)).slice(-64000); });
    child.on('error', e => { failure = e; });
    child.on('close', code => {
      clearTimeout(timeout);
      if (signal.aborted) reject(Object.assign(new Error('已取消'), { name: 'AbortError' }));
      else if (failure) reject(failure.message.includes('ENOENT') ? new Error('缺少视频下载工具，请更新客户端') : failure);
      else if (code !== 0) reject(new Error(/confirm.*not a bot|cookies|cookie|keyring|keychain/i.test(error) ? 'YouTube 要求验证登录状态，请选择已登录的浏览器并允许读取登录信息，或改用本地文件' : /sign in|private|age.restricted|members.only/i.test(error) ? '视频需要登录或没有访问权限，请选择已登录的浏览器，或改用本地文件' : /unavailable|not available|removed/i.test(error) ? '视频不可用或存在地区限制' : '无法获取 YouTube 视频，请检查网络后重试'));
      else resolve(output);
    });
  });
}

export async function transcribeYouTube(input: string, signal: AbortSignal, options: {
  run: ToolRunner; transcribe?: (path: string, signal: AbortSignal) => Promise<Transcript>;
  progress?: (note: string) => void; tempRoot?: string;
}): Promise<Transcript & { fileName: string; provider: string }> {
  const url = youtubeVideoUrl(input);
  signal.throwIfAborted();
  const dir = await mkdtemp(join(options.tempRoot ?? tmpdir(), 'scripter-youtube-'));
  try {
    options.progress?.('读取视频信息');
    const meta = JSON.parse(await options.run(['--dump-single-json', '--skip-download', '--', url], signal, 120000)) as Metadata;
    if (!meta || !/^[\w-]{11}$/.test(meta.id)) throw new Error('无法识别视频信息');
    if (meta.is_live) throw new Error('直播尚未结束，请在直播结束后转写');
    const fileName = `${(meta.title || 'YouTube 视频').replace(/[<>:"/\\|?*\x00-\x1f]/g, ' ').trim().slice(0, 100)} [${meta.id}].mp3`;
    for (const [captions, automatic] of [[meta.subtitles, false], [meta.automatic_captions, true]] as const) {
      const languages = Object.keys(captions ?? {}).filter(lang => lang !== 'live_chat' && /^[\w-]+$/.test(lang));
      const language = [meta.language, ...languages.filter(lang => lang.endsWith('-orig')), 'zh-Hans', 'zh-Hant', 'zh', 'en', ...languages].find(lang => lang && languages.includes(lang));
      if (!language) continue;
      try {
        options.progress?.(automatic ? '获取 YouTube 自动字幕' : '获取 YouTube 原有字幕');
        await options.run([automatic ? '--write-auto-subs' : '--write-subs', '--skip-download', '--sub-format', 'json3', '--sub-langs', language, '-o', join(dir, 'captions.%(ext)s'), '--', url], signal, 120000);
        signal.throwIfAborted();
        const names = (await readdir(dir)).filter(name => name.endsWith('.json3'));
        if (!names.length) continue;
        const transcript = youtubeCaptions(JSON.parse(await readFile(join(dir, names[0]!), 'utf8')));
        return { ...transcript, fileName, provider: automatic ? 'YouTube 自动字幕' : 'YouTube 原有字幕' };
      } catch { signal.throwIfAborted(); }
      // A failed caption attempt must not reuse an incomplete file on the next attempt.
      for (const name of await readdir(dir)) await rm(join(dir, name), { force: true });
    }
    if (!options.transcribe) throw new Error('此视频没有可用字幕，请先在设置里填写 Gemini key');
    options.progress?.('下载音轨（不下载画面）');
    await options.run(['-f', 'bestaudio', '--no-progress', '--max-filesize', '2G', '-o', join(dir, 'audio.%(ext)s'), '--', url], signal, 30 * 60 * 1000);
    signal.throwIfAborted();
    const audio = (await readdir(dir)).find(name => /^audio\.(?!.*(?:part|ytdl)$)[a-zA-Z0-9]+$/.test(name));
    if (!audio) throw new Error('未能下载音轨，请检查网络后重试');
    options.progress?.('音轨分段并调用 Gemini 转写');
    const transcript = await options.transcribe(join(dir, audio), signal);
    signal.throwIfAborted();
    return { ...transcript, fileName, provider: 'Gemini' };
  } finally { await rm(dir, { recursive: true, force: true }); }
}
