// Fountain (spec 0002 §9.4): scenes start with ".", Chinese character names with "@", transitions with ">".
import type { ScriptNode } from '../script.ts';

export function toFountain(title: string, nodes: readonly ScriptNode[]): string {
  const out: string[] = [`Title: ${title}`, ''];
  for (const n of nodes) {
    const t = n.text.trim();
    switch (n.type) {
      case 'heading': out.push('', `.${t}`, ''); break;
      case 'character': out.push(`@${t}`); break;
      case 'parenthetical': out.push(/^[（(]/.test(t) ? t : `（${t}）`); break;
      case 'dialogue': out.push(t, ''); break;
      case 'transition': out.push(`> ${t}`, ''); break;
      case 'shot': out.push(`!${t}`, ''); break;
      case 'note': out.push(`[[${t}]]`, ''); break;
      case 'subtitle': out.push(`~${t}`, ''); break;
      default: out.push(`!${t}`, '');
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
