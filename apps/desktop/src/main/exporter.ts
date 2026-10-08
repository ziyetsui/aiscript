// Export (spec 0002 §9.4): FDX / Fountain / TXT as real files; PDF via printToPDF with the typewriter stack.
import { BrowserWindow, dialog } from 'electron';
import { writeFileSync } from 'node:fs';
import { toDocx, toFdx, toFountain, toTxt, type ScriptNode } from '@scripter/core';
import type { ExportFormat } from '../shared/ipc.ts';
import { get } from './projects.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function scriptHtml(title: string, nodes: readonly ScriptNode[]): string {
  const body = nodes.map((n) => `<p class="${n.type}">${esc(n.text)}</p>`).join('\n');
  return `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><style>
  @page { size: A4; margin: 25mm 22mm; }
  body { font-family: "Courier Prime", "Courier New", Courier, "Zhuque Fangsong", "STFangsong", "FangSong", serif; font-size: 12pt; line-height: 1.5; color: #111; }
  h1 { text-align: center; font-size: 16pt; margin: 0 0 18mm; }
  p { margin: 0 0 1em; white-space: pre-wrap; }
  .heading { font-weight: bold; margin-top: 1.6em; } .character { margin: 1em 0 0 38%; } .parenthetical { margin: 0 0 0 30%; }
  .dialogue { margin: 0 18% 1em 22%; } .transition { text-align: right; } .note { color: #666; font-style: italic; } .shot { font-weight: bold; }
  </style><h1>${esc(title)}</h1>${body}`;
}

export async function save(win: BrowserWindow, id: string, format: ExportFormat) {
  const p = get(id);
  const nodes = p.doc.nodes();
  const title = p.meta.title;
  const ext = { pdf: 'pdf', docx: 'docx', fdx: 'fdx', fountain: 'fountain', txt: 'txt' }[format];
  const r = await dialog.showSaveDialog(win, { defaultPath: `${title}.${ext}`, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  if (r.canceled || !r.filePath) return { ok: false };
  if (format === 'pdf') {
    const w = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true } });
    try {
      await w.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(scriptHtml(title, nodes))}`);
      writeFileSync(r.filePath, await w.webContents.printToPDF({ pageSize: 'A4', printBackground: false, preferCSSPageSize: true }));
    } finally {
      w.destroy();
    }
  } else if (format === 'docx') {
    writeFileSync(r.filePath, await toDocx(title, nodes));
  } else {
    writeFileSync(r.filePath, format === 'fdx' ? toFdx(title, nodes) : format === 'fountain' ? toFountain(title, nodes) : toTxt(title, nodes), 'utf8');
  }
  return { ok: true, path: r.filePath };
}
