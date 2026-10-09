import type { ScriptDoc } from '../doc.ts';
import { scenes, type ScriptNode } from '../script.ts';
export type ExportContent = 'script' | 'outline' | 'beats' | 'scenes' | 'shots' | 'characters' | 'locations' | 'props';
export interface ExportSelection { episodes: string[]; content: ExportContent; format: 'pdf' | 'docx' | 'fdx' | 'fountain' | 'txt'; layout: 'hollywood' | 'asian'; texture: boolean; font: 'typewriter' | 'song' | 'system' }
export const EXPORT_CONTENTS: ExportContent[] = ['script', 'outline', 'beats', 'scenes', 'shots', 'characters', 'locations', 'props'];

/** Each exported section belongs to a selected episode; reference tables use only its script occurrences. */
export function exportNodes(doc: ScriptDoc, selection: ExportSelection): ScriptNode[] {
  if (!selection.episodes.length || new Set(selection.episodes).size !== selection.episodes.length) throw new Error('请选择至少一集，分集不能重复');
  if (!EXPORT_CONTENTS.includes(selection.content)) throw new Error('不支持的导出内容');
  if (!['pdf', 'docx', 'fdx', 'fountain', 'txt'].includes(selection.format) || !['hollywood', 'asian'].includes(selection.layout) || !['typewriter', 'song', 'system'].includes(selection.font)) throw new Error('不支持的导出格式或版式');
  if (selection.content !== 'script' && ['fdx', 'fountain'].includes(selection.format)) throw new Error('Final Draft 和 Fountain 仅用于剧本；资料可导出 PDF、Word 或 TXT');
  const bible = doc.readBible(); const result: ScriptNode[] = [];
  for (const id of selection.episodes) {
    const ep = doc.episodes().find((e) => e.id === id); if (!ep) throw new Error('所选分集不存在');
    const view = doc.episode(id), nodes = view.nodes(); const sc = scenes(nodes);
    const row = (text: string, type: ScriptNode['type'] = 'action') => result.push({ id: `${id}:export:${result.length}`, type, text });
    row(ep.title, 'subtitle');
    if (selection.content === 'script') { const cover = view.cover; for (const [label, value] of [['作者',cover.author],['稿次',cover.draft],['日期',cover.date]]) if (value) row(`${label}：${value}`, 'note'); }
    switch (selection.content) {
      case 'script': result.push(...nodes); break;
      case 'outline': row(view.outline || '暂无大纲'); break;
      case 'beats': row(view.beats || '暂无节拍'); break;
      case 'scenes': for (const s of sc) { row(`${s.index}. ${s.heading}`, 'heading'); row(`角色：${s.characters.join('、') || '暂无'} · ${s.dialogueCount} 段对白`); } break;
      case 'shots': for (const s of sc) { row(`${s.index}. ${s.heading}`, 'heading'); for (const [i, shot] of bible.shots.filter((x) => x.sceneId === s.nodeId).entries()) row(`${i + 1} · ${shot.size} · ${shot.dur}秒\n${shot.desc}`); } break;
      case 'characters': for (const c of bible.characters.filter((x) => nodes.some((n) => n.type === 'character' && n.text.trim() === x.name))) { row(c.name, 'heading'); row(`${c.role}\n${c.desc}\n形象：${c.look}\n声音：${c.voice}\n选角${c.castLocked ? '已锁定' : '待定'}`); } break;
      case 'locations': for (const l of bible.locations.filter((x) => sc.some((s) => s.heading.includes(x.name)))) { row(l.name, 'heading'); row(`${l.ie} · ${l.times.join(' / ')}\n${l.desc}\n${l.visual}`); } break;
      case 'props': for (const p of bible.props.filter((x) => nodes.some((n) => n.text.includes(x.name)))) { row(p.name, 'heading'); row(`${p.category}\n${p.desc}\n${p.visual}`); } break;
    }
    if (result.at(-1)?.type === 'subtitle') row('暂无内容');
  }
  return result;
}
