// Final Draft XML. Paragraph types follow Final Draft's built-in names so the file opens as a screenplay.
import type { ElementType, ScriptNode } from '../script.ts';

const FDX_TYPE: Record<ElementType, string> = {
  heading: 'Scene Heading', action: 'Action', character: 'Character', parenthetical: 'Parenthetical',
  dialogue: 'Dialogue', transition: 'Transition', shot: 'Shot', note: 'Action', subtitle: 'Action',
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function toFdx(title: string, nodes: readonly ScriptNode[]): string {
  const paras = nodes
    .map((n) => {
      const text = n.type === 'note' ? `[注释] ${n.text}` : n.type === 'subtitle' ? `[字幕] ${n.text}` : n.text;
      return `    <Paragraph Type="${FDX_TYPE[n.type]}"><Text>${esc(text)}</Text></Paragraph>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
${paras}
  </Content>
  <TitlePage><Content><Paragraph Alignment="Center" Type="Title"><Text>${esc(title)}</Text></Paragraph></Content></TitlePage>
</FinalDraft>
`;
}
