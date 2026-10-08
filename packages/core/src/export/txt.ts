import type { ScriptNode } from '../script.ts';

const INDENT = { character: 20, parenthetical: 15, dialogue: 10, transition: 40 } as const;

export function toTxt(title: string, nodes: readonly ScriptNode[]): string {
  const out = [title, ''];
  for (const n of nodes) {
    const pad = ' '.repeat((INDENT as Record<string, number>)[n.type] ?? 0);
    if (n.type === 'heading') out.push('', n.text, '');
    else if (n.type === 'dialogue' || n.type === 'transition') out.push(pad + n.text, '');
    else if (n.type === 'action' || n.type === 'shot' || n.type === 'note' || n.type === 'subtitle') out.push(n.text, '');
    else out.push(pad + n.text);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
