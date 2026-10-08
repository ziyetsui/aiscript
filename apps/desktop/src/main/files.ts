// Knowledge base and reference images: copied into the project folder, so a project is self-contained
// and "导出整个项目" (spec 0002 §8) can carry them. Nothing leaves the machine.
import { dialog, shell, type BrowserWindow } from 'electron';
import { randomBytes } from 'node:crypto';
import { copyFileSync, mkdirSync, openAsBlob, readFileSync, statSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { parseWithAncher } from '@scripter/agent';
import type { ProjectState } from '../shared/ipc.ts';
import { ancher } from './ai.ts';
import { getSecret } from './secrets.ts';
import { filePath, filesDir, get, saveNow, state } from './projects.ts';

const MAX = 200 * 1024 * 1024;
const IMG = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
export const KB_EXT = ['pdf', 'docx', 'doc', 'txt', 'md', 'fdx', 'fountain', 'srt', 'mp4', 'mov', 'mp3', 'wav', 'm4a', 'png', 'jpg', 'jpeg', 'webp'];

function store(id: string, src: string): string {
  const ext = extname(src).slice(1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  const name = randomBytes(8).toString('hex') + (ext ? `.${ext}` : '');
  mkdirSync(filesDir(id), { recursive: true });
  copyFileSync(src, filePath(id, name));
  return name;
}

export function addPaths(id: string, paths: string[], src: 'upload' | 'chat' = 'upload'): { state: ProjectState; added: number; skipped: string[] } {
  const p = get(id);
  const skipped: string[] = [];
  let added = 0;
  for (const path of paths) {
    let size = 0;
    try {
      const st = statSync(path);
      if (!st.isFile()) { skipped.push(basename(path)); continue; }
      size = st.size;
    } catch {
      skipped.push(basename(path));
      continue;
    }
    if (size > MAX) { skipped.push(`${basename(path)}（超过 200MB）`); continue; }
    const file = store(id, path);
    p.doc.bible('files').add({ name: basename(path), size, src, file, addedAt: Date.now() });
    added++;
  }
  p.doc.commit('add files');
  saveNow(p);
  return { state: state(p), added, skipped };
}

export async function pickFiles(win: BrowserWindow, id: string) {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'], filters: [{ name: '参考资料', extensions: KB_EXT }, { name: '全部文件', extensions: ['*'] }] });
  if (r.canceled || !r.filePaths.length) return null;
  return addPaths(id, r.filePaths);
}

/** Pick an image for a portrait / location; returns the stored file name. */
export async function pickImage(win: BrowserWindow, id: string): Promise<string | null> {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: '图片', extensions: IMG }] });
  if (r.canceled || !r.filePaths[0]) return null;
  if (statSync(r.filePaths[0]).size > 20 * 1024 * 1024) throw new Error('图片超过 20MB');
  return store(id, r.filePaths[0]);
}

/** Images go to the renderer as data URLs (CSP allows data: images, not file:). */
export function readImage(id: string, file: string): string | null {
  const ext = extname(file).slice(1).toLowerCase();
  if (!MIME[ext]) return null;
  try {
    return `data:${MIME[ext]};base64,${readFileSync(filePath(id, file)).toString('base64')}`;
  } catch {
    return null;
  }
}

export async function openFile(id: string, fileId: string): Promise<string> {
  const f = get(id).doc.bible('files').get(fileId);
  if (!f) return '文件不存在';
  return shell.openPath(filePath(id, f.file));
}

const TEXT_EXT = ['txt', 'md', 'srt', 'fountain', 'fdx'];
const EXCERPT_MAX = 20000;

/**
 * "写作时参考": pinning a file extracts its text once (plain text locally; PDF / Word / media through Ancher's
 * parser) so writing requests can include it. `notify` tells the window the project changed when it finishes.
 */
export async function pin(id: string, fileId: string, on: boolean, notify: () => void): Promise<ProjectState> {
  const p = get(id);
  const files = p.doc.bible('files');
  const f = files.get(fileId);
  if (!f) throw new Error('文件不存在');
  files.update(fileId, { pinned: on });
  const needs = on && f.extract !== 'ready';
  if (needs) files.update(fileId, { extract: 'working' });
  p.doc.commit('pin file');
  saveNow(p);
  if (needs) {
    void (async () => {
      let excerpt = '';
      let ok = true;
      try {
        const ext = extname(f.name).slice(1).toLowerCase();
        if (TEXT_EXT.includes(ext)) {
          excerpt = readFileSync(filePath(id, f.file), 'utf8');
          if (ext === 'fdx') excerpt = excerpt.replace(/<\/Paragraph>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        } else {
          const key = getSecret('ancher');
          if (!key) throw new Error('需要 Ancher key 才能读取这类文件');
          excerpt = await parseWithAncher(ancher(key), { file: new File([await openAsBlob(filePath(id, f.file))], f.name) }, new AbortController().signal);
        }
      } catch {
        ok = false;
      }
      const cur = get(id);
      if (!cur.doc.bible('files').get(fileId)) return;
      cur.doc.bible('files').update(fileId, ok ? { excerpt: excerpt.trim().slice(0, EXCERPT_MAX), extract: 'ready' } : { extract: 'failed', pinned: false });
      cur.doc.commit('file excerpt');
      saveNow(cur);
      notify();
    })();
  }
  return state(p);
}
