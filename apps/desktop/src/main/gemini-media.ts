import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ffmpeg from 'ffmpeg-static';
import { mergeTranscriptSegments } from '@scripter/agent';

type Transcript = { text: string; srt: string };

/** Extract only audio on this computer. The Cloud API receives one bounded MP3 at a time. */
export async function transcribeCloudMedia(
  path: string,
  signal: AbortSignal,
  transcribe: (audio: Uint8Array) => Promise<Transcript>,
  options: { ffmpegPath?: string; tempRoot?: string; segmentSeconds?: number; onSegment?: (index: number, total: number) => void } = {},
): Promise<Transcript> {
  signal.throwIfAborted();
  const dir = await mkdtemp(join(options.tempRoot ?? tmpdir(), 'scripter-audio-'));
  try {
    const executable = options.ffmpegPath ?? ffmpeg;
    if (!executable) throw new Error('当前平台没有可用的音频处理程序');
    await new Promise<void>((resolve, reject) => {
      const child = spawn(executable, [
        '-nostdin', '-v', 'error', '-i', path, '-map', '0:a:0', '-vn',
        '-ac', '1', '-ar', '16000', '-c:a', 'libmp3lame', '-b:a', '64k',
        '-f', 'segment', '-segment_time', String(options.segmentSeconds ?? 600),
        '-reset_timestamps', '1', '-segment_list', join(dir, 'segments.csv'), '-segment_list_type', 'csv',
        join(dir, 'chunk-%05d.mp3'),
      ], { signal, windowsHide: true, stdio: 'ignore' });
      // Wait for close even on abort/error before deleting files (especially on Windows).
      let error: Error | undefined;
      child.on('error', e => { error = e; });
      child.on('close', code => {
        if (signal.aborted) reject(Object.assign(new Error('已取消'), { name: 'AbortError' }));
        else if (error || code !== 0) reject(new Error('无法提取音轨，请检查文件是否损坏或没有音轨'));
        else resolve();
      });
    });
    signal.throwIfAborted();
    const list = await readFile(join(dir, 'segments.csv'), 'utf8');
    const segments: { srt: string; offsetSeconds: number }[] = [];
    const rows = list.trim().split(/\r?\n/);
    for (const [index, row] of rows.entries()) {
      const match = /^(chunk-\d+\.mp3),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/.exec(row);
      if (!match) throw new Error('音频分段失败，请重试');
      signal.throwIfAborted();
      options.onSegment?.(index + 1, rows.length);
      const result = await transcribe(await readFile(join(dir, match[1]!)));
      signal.throwIfAborted();
      if (result.srt) segments.push({ srt: result.srt, offsetSeconds: Number(match[2]) });
    }
    if (!segments.length) throw new Error('音频中没有检测到可转写的人声');
    return mergeTranscriptSegments(segments);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
