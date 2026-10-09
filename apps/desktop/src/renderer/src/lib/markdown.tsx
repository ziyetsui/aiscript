// Assistant replies are Markdown (Ancher renders them with react-markdown + GFM). This covers what replies
// actually use — headings, paragraphs, lists, quotes, rules, code, simple tables, bold / italic / code / links —
// and builds React elements only, so model output can never inject HTML.
import { Fragment, memo, type ReactNode } from 'react';

function inline(text: string, key = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    const t = m[0];
    if (m[1]) out.push(<code key={k}>{t.slice(1, -1)}</code>);
    else if (m[2] || m[3]) out.push(<strong key={k}>{inline(t.slice(2, -2), k)}</strong>);
    else if (m[4]) out.push(<em key={k}>{inline(t.slice(1, -1), k)}</em>);
    else if (m[5]) out.push(<a key={k} href={m[6]} target="_blank" rel="noreferrer">{t.slice(1, t.indexOf(']'))}</a>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let b = 0;
  const key = () => `b${b++}`;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) { i++; continue; }
    const fence = /^```/.exec(line.trim());
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i]!.trim())) body.push(lines[i++]!);
      i++;
      blocks.push(<pre key={key()}><code>{body.join('\n')}</code></pre>);
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = Math.min(h[1]!.length, 4);
      const H = `h${level}` as 'h1';
      blocks.push(<H key={key()}>{inline(h[2]!)}</H>);
      i++;
      continue;
    }
    if (/^\s*(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line)) { blocks.push(<hr key={key()} />); i++; continue; }
    if (isTableRow(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1]!)) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i]!)) rows.push(cells(lines[i++]!));
      blocks.push(
        <div className="md-table" key={key()}><table>
          <thead><tr>{head.map((c, k) => <th key={k}>{inline(c)}</th>)}</tr></thead>
          <tbody>{rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
        </table></div>,
      );
      continue;
    }
    if (/^\s*>/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i]!)) q.push(lines[i++]!.replace(/^\s*>\s?/, ''));
      blocks.push(<blockquote key={key()}>{q.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l)}</Fragment>)}</blockquote>);
      continue;
    }
    const ul = /^\s*[-*+]\s+/;
    const ol = /^\s*\d+[.)]\s+/;
    if (ul.test(line) || ol.test(line)) {
      const ordered = ol.test(line);
      const re = ordered ? ol : ul;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i]!)) {
        let item = lines[i++]!.replace(re, '');
        // continuation lines indented under the item
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]!) && !ul.test(lines[i]!) && !ol.test(lines[i]!)) item += `\n${lines[i++]!.trim()}`;
        items.push(item);
      }
      const L = ordered ? 'ol' : 'ul';
      blocks.push(<L key={key()}>{items.map((it, k) => <li key={k}>{it.split('\n').map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}</li>)}</L>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !/^(#{1,6}\s|```|\s*>|\s*[-*+]\s+|\s*\d+[.)]\s+)/.test(lines[i]!) && !isTableRow(lines[i]!)) para.push(lines[i++]!);
    if (!para.length) para.push(lines[i++]!);
    blocks.push(<p key={key()}>{para.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l)}</Fragment>)}</p>);
  }
  return <div className="chat-md">{blocks}</div>;
});
