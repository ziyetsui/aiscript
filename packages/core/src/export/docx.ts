// Word export (spec 0002 §9.4): for editing on and passing through approval. Same element layout as the PDF;
// Courier Prime for Latin text and 仿宋 for Chinese, so it reads like a typed script when opened in Word / WPS.
import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx';
import type { ElementType, ScriptNode } from '../script.ts';

const TWIP_PER_CM = 567;
const INDENT: Partial<Record<ElementType, { left?: number; right?: number }>> = {
  character: { left: 6.5 * TWIP_PER_CM },
  parenthetical: { left: 5 * TWIP_PER_CM, right: 5 * TWIP_PER_CM },
  dialogue: { left: 3.5 * TWIP_PER_CM, right: 2.8 * TWIP_PER_CM },
};

function para(n: ScriptNode): Paragraph {
  const run = (text: string) => new TextRun({
    text,
    font: { ascii: 'Courier Prime', hAnsi: 'Courier Prime', eastAsia: 'FangSong' },
    size: 24, // 12pt
    bold: n.type === 'heading' || n.type === 'shot',
    italics: n.type === 'note',
    color: n.type === 'note' ? '666666' : undefined,
  });
  const text = n.type === 'note' ? `[注释] ${n.text}` : n.text;
  return new Paragraph({
    children: [run(text)],
    indent: INDENT[n.type],
    alignment: n.type === 'transition' ? AlignmentType.RIGHT : n.type === 'subtitle' ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: {
      before: n.type === 'heading' ? 360 : n.type === 'character' ? 240 : 0,
      after: n.type === 'character' || n.type === 'parenthetical' ? 0 : 200,
      line: 360,
    },
    keepNext: n.type === 'heading' || n.type === 'character' || n.type === 'parenthetical',
  });
}

export async function toDocx(title: string, nodes: readonly ScriptNode[]): Promise<Uint8Array> {
  const doc = new Document({
    creator: 'Ancher Scripter',
    title,
    sections: [{
      properties: { page: { margin: { top: 1418, bottom: 1418, left: 1247, right: 1247 } } }, // A4, 2.5 cm / 2.2 cm
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: title, bold: true, size: 32, font: { ascii: 'Courier Prime', hAnsi: 'Courier Prime', eastAsia: 'FangSong' } })] }),
        ...nodes.map(para),
      ],
    }],
  });
  return new Uint8Array(await Packer.toBuffer(doc));
}
