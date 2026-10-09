// Export (spec 0002 §9.4): FDX / Fountain / TXT as real files; PDF via printToPDF with the typewriter stack.
import { app, BrowserWindow, dialog } from 'electron';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { exportNodes, shotsCsv, toDocx, toFdx, toFountain, toTxt, type ScriptNode } from '@scripter/core';
import type { ExportFormat, ExportSelection } from '../shared/ipc.ts';
import { get } from './projects.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function scriptHtml(title: string, nodes: readonly ScriptNode[], selection?: ExportSelection): string {
  const body = nodes.map((n) => `<p class="${n.type}">${esc(n.text)}</p>`).join('\n');
  return `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><style>
  ${fontCss()}
  @page { size: A4; margin: 25mm 22mm; }
  body { font-family: "Courier Prime", "Courier New", Courier, "Zhuque Fangsong", "STFangsong", "FangSong", serif; font-size: 12pt; line-height: 1.5; color: #111; }
  h1 { text-align: center; font-size: 16pt; margin: 0 0 18mm; }
  p { margin: 0 0 1em; white-space: pre-wrap; }
  .heading { font-weight: bold; margin-top: 1.6em; } .character { margin: 1em 0 0 38%; } .parenthetical { margin: 0 0 0 30%; }
  .dialogue { margin: 0 18% 1em 22%; } .transition { text-align: right; } .note { color: #666; font-style: italic; } .shot { font-weight: bold; }
  ${selection?.layout === 'asian' ? '.character,.parenthetical,.dialogue{margin-left:0;margin-right:0}.character{font-weight:bold}' : ''}
  ${selection?.texture ? 'body{background-color:#fffefb;background-image:radial-gradient(#cfc7b422 .35px,transparent .35px);background-size:3px 3px}' : ''}
  ${selection?.font === 'song' ? 'body{font-family:"Songti SC","SimSun",serif}' : selection?.font === 'system' ? 'body{font-family:system-ui,sans-serif}' : ''}
  .subtitle { text-align:center;break-before:page;font-size:14pt;font-weight:bold; }
  </style><h1>${esc(title)}</h1>${body}`;
}

export async function save(win: BrowserWindow, id: string, format: ExportFormat, selection?: ExportSelection) {
  const p = get(id);
  if (selection && selection.format !== format) throw new Error('导出格式与选择不一致');
  const nodes = selection ? exportNodes(p.doc, selection) : p.doc.nodes();
  const title = p.meta.title;
  const ext = { pdf: 'pdf', docx: 'docx', fdx: 'fdx', fountain: 'fountain', txt: 'txt', shots: 'csv', characters: 'json', locations: 'pdf', props: 'csv' }[format];
  const r = await dialog.showSaveDialog(win, { defaultPath: `${title}${format === 'shots' ? ' 分镜表' : ''}.${ext}`, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  if (r.canceled || !r.filePath) return { ok: false };
  if (format === 'characters') {
    writeFileSync(r.filePath, JSON.stringify(p.doc.readBible()[format], null, 2), 'utf8');
  } else if (format === 'props') {
    const q = (v: string) => '"' + v.replace(/"/g, '""') + '"';
    const rows = [['道具', '分类', '描述', '视觉提示词'], ...p.doc.readBible().props.map((x) => [x.name, x.category, x.desc, x.visual])];
    writeFileSync(r.filePath, '\uFEFF' + rows.map((row) => row.map(q).join(',')).join('\r\n'), 'utf8');
  } else if (format === 'pdf' || format === 'locations') {
    const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true, nodeIntegration: false, contextIsolation: true } });
    const printDir = mkdtempSync(join(app.getPath('temp'), 'aiscript-print-'));
    try {
      const html = format === 'locations' ? `<!doctype html><meta charset="utf-8"><style>body{font-family:system-ui;font-size:12pt}section{break-inside:avoid;margin-bottom:24px}p{white-space:pre-wrap}</style><h1>${esc(title)} · 勘景本</h1>${p.doc.readBible().locations.map((l) => `<section><h2>${esc(l.name)} · ${esc(l.ie)}</h2><p>${esc(l.times.join(' / '))}</p><p>${esc(l.desc)}</p><p>${esc(l.visual)}</p></section>`).join('')}` : scriptHtml(title, nodes, selection);
      const printFile = join(printDir, 'print.html'); writeFileSync(printFile, '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; font-src data:">' + html); await w.loadFile(printFile);
      await Promise.race([w.webContents.executeJavaScript('document.fonts.ready.then(() => true)'), new Promise((_, reject) => setTimeout(() => reject(new Error('字体加载超时，请重试导出')), 15000))]);
      writeFileSync(r.filePath, await w.webContents.printToPDF({ pageSize: 'A4', printBackground: !!selection?.texture, preferCSSPageSize: true }));
    } finally {
      w.destroy(); rmSync(printDir, { recursive: true, force: true });
    }
  } else if (format === 'shots') {
    writeFileSync(r.filePath, shotsCsv(nodes, p.doc.readBible().shots), 'utf8');
  } else if (format === 'docx') {
    writeFileSync(r.filePath, await toDocx(title, nodes, selection?.layout, selection?.font));
  } else {
    writeFileSync(r.filePath, format === 'fdx' ? toFdx(title, nodes) : format === 'fountain' ? toFountain(title, nodes) : toTxt(title, nodes), 'utf8');
  }
  return { ok: true, path: r.filePath };
}

let cachedFontCss: string | undefined;
function fontCss(): string {
  return cachedFontCss ??= [['Courier Prime','CourierPrime-Regular.ttf','400'],['Courier Prime','CourierPrime-Bold.ttf','700'],['Zhuque Fangsong','ZhuqueFangsong-Regular.ttf','400']].map(([family,file,weight]) => `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/ttf;base64,${readFileSync(join(app.getAppPath(),'out/renderer/fonts',file!)).toString('base64')}) format('truetype')}`).join('\n');
}
