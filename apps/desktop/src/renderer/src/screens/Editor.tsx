// Script editor: one contentEditable line per Loro node. Keys follow laper / Final Draft:
// Enter splits into the natural next element, Tab cycles the format, Backspace at start merges upward.
import { memo, useEffect, useLayoutEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { ELEMENT_LABEL, inferType, newId, nextTypeOnEnter, nextTypeOnTab, type ScriptNode } from '@scripter/core/script';
import type { Edit } from '../../../shared/ipc.ts';
import { carriageReturn, keyClick } from '../lib/typewriter.ts';

const PH: Record<string, string> = { heading: '内景/外景 地点 — 日/夜', action: '动作描写', character: '角色名', parenthetical: '（括号）', dialogue: '对白', transition: '切至：', shot: '镜头', note: '注释', subtitle: '字幕' };

function caretOffset(el: HTMLElement): number {
  const s = getSelection();
  if (!s || !s.rangeCount || !el.contains(s.anchorNode)) return 0;
  const r = s.getRangeAt(0).cloneRange();
  r.selectNodeContents(el);
  r.setEnd(s.anchorNode!, s.anchorOffset);
  return r.toString().length;
}

export function placeCaret(el: HTMLElement | null | undefined, at: 'start' | 'end' | number): void {
  if (!el) return;
  el.focus();
  const s = getSelection();
  if (!s) return;
  const r = document.createRange();
  const t = el.firstChild;
  if (!t) { r.setStart(el, 0); }
  else {
    const len = t.textContent?.length ?? 0;
    r.setStart(t, at === 'start' ? 0 : at === 'end' ? len : Math.min(at, len));
  }
  r.collapse(true);
  s.removeAllRanges();
  s.addRange(r);
}

interface LineProps { node: ScriptNode; typing?: boolean; fresh?: boolean; onText(id: string, text: string): void; onKey(e: KeyboardEvent<HTMLDivElement>, n: ScriptNode): void; onPaste(e: ClipboardEvent<HTMLDivElement>, n: ScriptNode): void }

const Line = memo(function Line({ node, typing, fresh, onText, onKey, onPaste }: LineProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Uncontrolled: only push text into the DOM when it changed elsewhere (AI, undo) and the writer isn't in this line.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && (typing || document.activeElement !== el) && el.textContent !== node.text) el.textContent = node.text;
  }, [node.text, typing]);
  return (
    <div ref={ref} className={`node${typing ? ' caret' : ''}${fresh ? ' fresh' : ''}`} data-id={node.id} data-type={node.type} data-ph={PH[node.type]}
      contentEditable={typing ? false : 'plaintext-only'} suppressContentEditableWarning spellCheck={false} role="textbox" aria-label={ELEMENT_LABEL[node.type]}
      onInput={(e) => onText(node.id, e.currentTarget.textContent ?? '')} onKeyDown={(e) => onKey(e, node)} onPaste={(e) => onPaste(e, node)} />
  );
});

export function Editor({ nodes, typingId, freshIds, edit, setLocal }: {
  nodes: ScriptNode[];
  typingId: string | null;
  freshIds: Set<string>;
  edit: (edits: Edit[]) => Promise<void>;
  setLocal: (fn: (n: ScriptNode[]) => ScriptNode[]) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const pending = useRef(new Map<string, string>());
  const timer = useRef<number | undefined>(undefined);
  const focusAfter = useRef<{ id: string; at: 'start' | 'end' | number } | null>(null);
  const el = (id: string) => root.current?.querySelector<HTMLElement>(`[data-id="${id}"]`);

  const flush = async () => {
    window.clearTimeout(timer.current);
    if (!pending.current.size) return;
    const edits: Edit[] = [...pending.current].map(([id, text]) => ({ op: 'text', id, text }));
    pending.current.clear();
    await edit(edits);
  };
  useEffect(() => () => { void flush(); }, []);

  useLayoutEffect(() => {
    const f = focusAfter.current;
    if (f) { focusAfter.current = null; placeCaret(el(f.id), f.at); }
  });

  const onText = (id: string, text: string) => {
    pending.current.set(id, text);
    setLocal((ns) => ns.map((n) => (n.id === id ? { ...n, text } : n)));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { void flush(); }, 250);
  };

  const onKey = async (e: KeyboardEvent<HTMLDivElement>, n: ScriptNode) => {
    const i = nodes.findIndex((x) => x.id === n.id);
    const text = e.currentTarget.textContent ?? '';
    const off = caretOffset(e.currentTarget);
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const before = text.slice(0, off);
      const after = text.slice(off);
      const curType = inferType(before, n.type);
      const id = newId();
      const type = after ? curType : nextTypeOnEnter(curType);
      focusAfter.current = { id, at: 'start' };
      pending.current.delete(n.id);
      setLocal((ns) => { const c = [...ns]; c.splice(i, 1, { ...n, type: curType, text: before }, { id, type, text: after }); return c; });
      e.currentTarget.textContent = before;
      await edit([{ op: 'text', id: n.id, text: before }, ...(curType !== n.type ? [{ op: 'type' as const, id: n.id, type: curType }] : []), { op: 'insert', after: n.id, type, text: after, id }]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const type = nextTypeOnTab(n.type, e.shiftKey);
      setLocal((ns) => ns.map((x) => (x.id === n.id ? { ...x, type } : x)));
      await edit([{ op: 'type', id: n.id, type }]);
    } else if (e.key === 'Backspace' && off === 0 && getSelection()?.isCollapsed && i > 0) {
      e.preventDefault();
      const prev = nodes[i - 1]!;
      const prevText = el(prev.id)?.textContent ?? prev.text;
      focusAfter.current = { id: prev.id, at: prevText.length };
      pending.current.delete(n.id);
      setLocal((ns) => ns.filter((x) => x.id !== n.id).map((x) => (x.id === prev.id ? { ...x, text: prevText + text } : x)));
      const pe = el(prev.id);
      if (pe) pe.textContent = prevText + text;
      await edit([{ op: 'text', id: prev.id, text: prevText + text }, { op: 'remove', id: n.id }]);
    } else if (e.key === 'ArrowUp' && off === 0 && i > 0) {
      e.preventDefault();
      placeCaret(el(nodes[i - 1]!.id), 'end');
    } else if (e.key === 'ArrowDown' && off === text.length && i < nodes.length - 1) {
      e.preventDefault();
      placeCaret(el(nodes[i + 1]!.id), 'start');
    }
  };

  // Multi-line paste becomes one node per line, typed by simple rules; everything else is plain text.
  const onPaste = async (e: ClipboardEvent<HTMLDivElement>, n: ScriptNode) => {
    const raw = e.clipboardData.getData('text/plain');
    if (!raw.includes('\n')) return;
    e.preventDefault();
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let after = n.id;
    const edits: Edit[] = [];
    const added: ScriptNode[] = [];
    let prevType = n.type;
    for (const l of lines) {
      const id = newId();
      const type = inferType(l, prevType === 'character' ? 'dialogue' : 'action');
      edits.push({ op: 'insert', after, type, text: l, id });
      added.push({ id, type, text: l });
      after = id;
      prevType = type;
    }
    const i = nodes.findIndex((x) => x.id === n.id);
    setLocal((ns) => { const c = [...ns]; c.splice(i + 1, 0, ...added); return c; });
    focusAfter.current = { id: after, at: 'end' };
    await edit(edits);
  };

  async function startBlank() {
    const id = newId();
    focusAfter.current = { id, at: 'start' };
    setLocal(() => [{ id, type: 'heading', text: '' }]);
    await edit([{ op: 'insert', after: 'end', type: 'heading', text: '', id }]);
  }

  return (
    <div className="paper" ref={root} onKeyDown={(e) => { if (e.key.length === 1) keyClick(e.key); else if (e.key === 'Enter') carriageReturn(); }}>
      {nodes.length === 0 ? (
        <button className="node" style={{ width: '100%', textAlign: 'left', color: 'var(--ink-3)' }} onClick={startBlank}>
          点这里开始写，或在右边让 AI 先写第一场。Tab 切换格式 · Enter 换到下一种元素
        </button>
      ) : nodes.map((n) => <Line key={n.id} node={n} typing={n.id === typingId} fresh={freshIds.has(n.id)} onText={onText} onKey={onKey} onPaste={onPaste} />)}
    </div>
  );
}
