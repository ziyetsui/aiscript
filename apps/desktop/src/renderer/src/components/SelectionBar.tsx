// Selection toolbar on the script page (spec 0002 §5.2: 选中文本解释 / 总结 / 翻译). Read-only answers, copyable.
import { useEffect, useState } from 'react';
import { Icon, useToast } from '../lib/ui.tsx';

type Kind = 'explain' | 'summarize' | 'translate';
const LABEL: Record<Kind, string> = { explain: '解释', summarize: '总结', translate: '译成英文' };

export function SelectionBar({ container }: { container: HTMLElement | null }) {
  const [sel, setSel] = useState<{ text: string; x: number; y: number } | null>(null);
  const [answer, setAnswer] = useState<{ kind: Kind; text: string | null } | null>(null);
  const toast = useToast();

  useEffect(() => {
    const onChange = () => {
      if (answer) return;
      const s = getSelection();
      const text = s?.toString().trim() ?? '';
      if (!s || s.isCollapsed || text.length < 2 || !container || !container.contains(s.anchorNode)) { setSel(null); return; }
      const r = s.getRangeAt(0).getBoundingClientRect();
      setSel({ text, x: r.left + r.width / 2, y: r.top });
    };
    document.addEventListener('selectionchange', onChange);
    return () => document.removeEventListener('selectionchange', onChange);
  }, [container, answer]);

  useEffect(() => {
    if (!answer) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setAnswer(null); setSel(null); } };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [answer]);

  if (!sel) return null;
  async function run(kind: Kind) {
    setAnswer({ kind, text: null });
    try {
      setAnswer({ kind, text: await window.api.ai.selection(kind, sel!.text) });
    } catch (e) {
      setAnswer(null);
      toast(String((e as Error).message).replace(/^Error invoking remote method '[^']+': Error: /, ''));
    }
  }
  return (
    <div className="selbar" style={{ left: sel.x, top: sel.y }} onMouseDown={(e) => e.preventDefault()} role="toolbar" aria-label="选中文字">
      {!answer ? (
        <div className="card selbar-btns">
          {(Object.keys(LABEL) as Kind[]).map((k) => <button key={k} onClick={() => void run(k)}>{LABEL[k]}</button>)}
        </div>
      ) : (
        <div className="card selbar-answer" role="dialog" aria-label={LABEL[answer.kind]}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><b style={{ flex: 1 }}>{LABEL[answer.kind]}</b>
            {answer.text && <button className="btn btn-quiet btn-icon" style={{ width: 26, height: 26 }} aria-label="复制" onClick={() => { void navigator.clipboard.writeText(answer.text!); toast('已复制'); }}><Icon name="copy" size={12} /></button>}
            <button className="btn btn-quiet btn-icon" style={{ width: 26, height: 26 }} aria-label="关闭" onClick={() => { setAnswer(null); setSel(null); }}><Icon name="x" size={12} /></button></div>
          {answer.text === null ? <span className="muted"><span className="spinner" style={{ display: 'inline-block', verticalAlign: -2, marginRight: 6 }} />Ancher 正在处理…</span> : <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{answer.text}</p>}
        </div>
      )}
    </div>
  );
}
