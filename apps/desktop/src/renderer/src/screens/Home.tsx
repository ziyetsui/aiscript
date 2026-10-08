// Creation home (prototype P3 / laper /app/new): one box, intent chips that open suggestion panels, recent projects.
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { KeyStatus, ProjectMeta } from '../../../shared/ipc.ts';
import type { Route } from '../App.tsx';
import { INTENTS } from '../lib/intents.ts';
import { Icon, Logo, useToast } from '../lib/ui.tsx';

const KINDS = [
  { id: 'script', icon: 'doc', title: '剧本项目', sub: '写出专业、结构清晰的剧本' },
  { id: 'video', icon: 'video', title: '快速视频', sub: '为 AI 视频创作而生' },
] as const;

function greeting(): string {
  const h = new Date().getHours();
  return h < 6 ? '夜深了' : h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好';
}

export function Home({ keys, go }: { keys: KeyStatus; go: (r: Route) => void }) {
  const [text, setText] = useState('');
  const [kind, setKind] = useState<ProjectMeta['kind']>('script');
  const [kindOpen, setKindOpen] = useState(false);
  const [intent, setIntent] = useState<number | null>(null);
  const [sel, setSel] = useState(-1);
  const [recents, setRecents] = useState<ProjectMeta[] | null>(null);
  const [busy, setBusy] = useState(false);
  const ask = useRef<HTMLTextAreaElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => { void window.api.projects.list().then(setRecents); }, []);
  useEffect(() => {
    if (!kindOpen) return;
    const close = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('.kind-wrap')) setKindOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [kindOpen]);

  async function start(e?: FormEvent) {
    e?.preventDefault();
    const t = text.trim();
    if (!t) { ask.current?.focus(); return; }
    setBusy(true);
    const title = t.replace(/\s+/g, ' ').slice(0, 18) + (t.length > 18 ? '…' : '');
    const p = await window.api.projects.create(title, kind);
    go({ name: 'project', id: p.id, tab: 'write', pending: keys.ancher ? t : undefined });
    if (!keys.ancher) toast('还没填写 Ancher key，AI 暂时不能写。可以先手动写，或到设置里填写');
  }

  async function blank() {
    const p = await window.api.projects.create('未命名剧本', kind);
    go({ name: 'project', id: p.id, tab: 'write' });
  }

  function pick(i: number) {
    const item = intent !== null ? INTENTS[intent]?.items[i] : undefined;
    if (!item) return;
    setText(item);
    setIntent(null);
    requestAnimationFrame(() => { ask.current?.focus(); ask.current?.setSelectionRange(item.length, item.length); });
  }

  function onListKey(e: KeyboardEvent) {
    const n = intent !== null ? INTENTS[intent]!.items.length : 0;
    if (e.key === 'ArrowDown') { setSel((s) => (s + 1) % n); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setSel((s) => (s - 1 + n) % n); e.preventDefault(); }
    else if (e.key === 'Enter' && sel >= 0) { pick(sel); e.preventDefault(); }
    else if (e.key === 'Escape') { setIntent(null); e.preventDefault(); }
  }
  useEffect(() => { if (sel >= 0) (list.current?.children[sel] as HTMLElement | undefined)?.focus(); }, [sel]);

  const k = KINDS.find((x) => x.id === kind)!;
  return (
    <>
      <div className="topbar drag" style={{ borderBottom: 0 }}>
        <span style={{ flex: 1 }} />
        <span className="chip no-drag"><span style={{ width: 6, height: 6, borderRadius: '50%', background: keys.ancher ? 'var(--success)' : 'var(--ink-3)' }} />{keys.ancher ? '已激活 · Ancher 已连接' : '已激活 · 未连接 Ancher'}</span>
      </div>
      <div className="home">
        <div className="home-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Logo size={34} /><h1 className="display" style={{ fontSize: 28 }}>{greeting()}</h1></div>
          <form className="card ask" onSubmit={start}>
            <label htmlFor="ask" className="sr-only">想写什么</label>
            <textarea id="ask" ref={ask} value={text} onChange={(e) => setText(e.target.value)} placeholder="帮您处理剧本格式或从新点子开始？"
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void start(); }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className="btn btn-ghost" onClick={blank}><Icon name="plus" size={14} />空白剧本</button>
              <span className="kind-wrap" style={{ position: 'relative' }}>
                <button type="button" className="btn btn-ghost" aria-haspopup="listbox" aria-expanded={kindOpen} onClick={() => setKindOpen((o) => !o)}><Icon name={k.icon} size={14} />{k.title}<Icon name="chev" size={12} /></button>
                {kindOpen && (
                  <div className="card menu" role="listbox" aria-label="项目类型" style={{ top: 'calc(100% + 6px)', left: 0, width: 250 }}>
                    {KINDS.map((x) => (
                      <button key={x.id} type="button" role="option" aria-selected={x.id === kind} onClick={() => { setKind(x.id); setKindOpen(false); }}>
                        <Icon name={x.icon} size={15} /><span><b>{x.title}</b><br /><span className="muted" style={{ fontSize: 12 }}>{x.sub}</span></span>
                      </button>
                    ))}
                  </div>
                )}
              </span>
              <span style={{ flex: 1 }} />
              <span className="muted" style={{ fontSize: 12 }}>⌘/Ctrl + Enter</span>
              <button className="btn btn-primary btn-icon" style={{ width: 38, height: 38, borderRadius: '50%' }} aria-label="开始" disabled={busy}><Icon name="send" size={16} /></button>
            </div>
          </form>
          {intent === null ? (
            <div className="intents">
              {INTENTS.map((x, i) => (
                <button key={x.chip} type="button" className="btn btn-ghost" onClick={(e) => { setIntent(i); setSel(e.detail === 0 ? 0 : -1); }}><Icon name={x.icon} size={14} />{x.chip}</button>
              ))}
            </div>
          ) : (
            <section className="card sugg" aria-labelledby="sugg-t" onKeyDown={onListKey}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 10px', fontSize: 15 }}>
                <Icon name={INTENTS[intent]!.icon} size={18} /><b id="sugg-t">{INTENTS[intent]!.title}</b><span style={{ flex: 1 }} />
                <button type="button" className="btn btn-ghost btn-icon" style={{ width: 40, height: 40, borderRadius: '50%' }} aria-label="关闭建议" onClick={() => setIntent(null)}><Icon name="x" size={16} /></button>
              </div>
              <div ref={list} role="listbox">
                {INTENTS[intent]!.items.map((t, i) => (
                  <button key={t} type="button" role="option" className="sugg-it" aria-selected={i === sel} onPointerEnter={() => setSel(i)} onClick={() => pick(i)}>{t}</button>
                ))}
              </div>
            </section>
          )}
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="muted" style={{ fontSize: 12.5 }}>最近</div>
            {recents === null ? null : recents.length === 0 ? (
              <div className="card empty">还没有项目。在上面写一句想法，或者新建一个空白剧本。</div>
            ) : (
              <div className="recents">
                {recents.map((p) => (
                  <button key={p.id} className="card recent" onClick={() => go({ name: 'project', id: p.id, tab: 'write' })}>
                    <b style={{ fontSize: 14 }}>{p.title}</b>
                    <span className="muted tnum" style={{ fontSize: 12 }}>{p.kind === 'video' ? '快速视频' : '剧本'} · {p.words} 字 · {new Date(p.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
