// Creation home (prototype P3 / laper /app/new): one box, intent chips that open suggestion panels, recent projects.
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { KeyStatus, ProjectMeta } from '../../../shared/ipc.ts';
import type { Route } from '../App.tsx';
import { Composer, type PlusAction } from '../components/Chat.tsx';
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

  const [attachments, setAttachments] = useState<string[]>([]);
  const [web, setWeb] = useState(false);
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const toast = useToast();


  useEffect(() => {
    if (!kindOpen) return;
    const close = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('.kind-wrap')) setKindOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [kindOpen]);

  async function start(e?: FormEvent) {
    e?.preventDefault();
    const t = text.trim();
    if (!t) { document.querySelector<HTMLTextAreaElement>('#ask')?.focus(); return; }
    setBusy(true);
    try {
    const title = t.replace(/\s+/g, ' ').slice(0, 18) + (t.length > 18 ? '…' : '');
    if (kind === 'video') toast('快速视频流程即将推出，本次创建剧本项目');
    const p = await window.api.projects.create(title, 'script');
    if (attachments.length) { const r = await window.api.files.addPaths(p.id, attachments); for (const f of r.state.bible.files) await window.api.files.pin(p.id, f.id, true); }
    go({ name: 'project', id: p.id, tab: 'write', pendingWeb: web, pending: keys.ancher ? t : undefined });
    if (!keys.ancher) toast('还没填写 Ancher key，AI 暂时不能写。可以先手动写，或到设置里填写');
    } catch (e) { toast(String(e)); } finally { setBusy(false); }
  }

  async function blank() {
    const p = await window.api.projects.create('未命名剧本', 'script');
    go({ name: 'project', id: p.id, tab: 'write' });
  }

  function pick(i: number) {
    const item = intent !== null ? INTENTS[intent]?.items[i] : undefined;
    if (!item) return;
    setText(item);
    setIntent(null);
    requestAnimationFrame(() => { document.querySelector<HTMLTextAreaElement>('#ask')?.focus(); document.querySelector<HTMLTextAreaElement>('#ask')?.setSelectionRange(item.length, item.length); });
  }

  function onListKey(e: KeyboardEvent) {
    const n = intent !== null ? INTENTS[intent]!.items.length : 0;
    if (e.key === 'ArrowDown') { setSel((s) => (s + 1) % n); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setSel((s) => (s - 1 + n) % n); e.preventDefault(); }
    else if (e.key === 'Enter' && sel >= 0) { pick(sel); e.preventDefault(); }
    else if (e.key === 'Escape') { setIntent(null); e.preventDefault(); }
  }
  useEffect(() => { if (sel >= 0) (list.current?.children[sel] as HTMLElement | undefined)?.focus(); }, [sel]);

  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { if (!menuOpen) return; const close = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); }; const outside = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('.home-menu')) setMenuOpen(false); }; window.addEventListener('keydown', close); window.addEventListener('pointerdown', outside); return () => { window.removeEventListener('keydown', close); window.removeEventListener('pointerdown', outside); }; }, [menuOpen]);
  const k = KINDS.find((x) => x.id === kind)!;
  return (
    <>
      <div className="topbar drag" style={{ borderBottom: 0 }}>
        <div className="no-drag home-menu" style={{position:'relative'}}><button className="btn btn-quiet" aria-label="菜单" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((x) => !x)}><Icon name="menu" size={16} /></button>{menuOpen && <div className="card menu" role="menu" style={{top:40,left:0,minWidth:160}}><button role="menuitem" onClick={() => go({ name:'recents' })}>最近项目</button><button role="menuitem" onClick={() => go({ name:'settings',back:{name:'home'} })}>设置</button></div>}</div><span style={{ flex: 1 }} />
        <span className="chip no-drag"><span style={{ width: 6, height: 6, borderRadius: '50%', background: keys.ancher ? 'var(--success)' : 'var(--ink-3)' }} />{keys.ancher ? '已激活 · Ancher 已连接' : '已激活 · 未连接 Ancher'}</span>
      </div>
      <div className="home">
        <div className="home-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Logo size={34} /><h1 className="display" style={{ fontSize: 28 }}>{greeting()}</h1></div>
          <div className="home-composer">
            <Composer inputId="ask" inputLabel="想写什么" home value={text} onChange={setText} onSend={() => void start()} onStop={() => {}} running={busy} queue={[]} onDequeue={() => {}} ghost="" web={web} onWeb={setWeb} mentions={[]} model={              <span className="kind-wrap" style={{ position: 'relative' }}>
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
              </span>} onAction={(a: PlusAction | { kind: 'web'; text: string }) => {
              if (a.kind === 'blank') void blank();
              else if (a.kind === 'attach' || a.kind === 'video') void window.api.workflows.pickFile(a.kind === 'video' ? 'media' : 'any').then((path) => { if (path) setAttachments((x) => [...x, path]); });
              else if (a.kind === 'mention') toast('先创建项目，即可添加知识库笔记');
              else if (a.kind === 'prefill') setText(a.text);
            }} />
            {attachments.map((path, i) => <button className="chip" key={`${i}-${path}`} onClick={() => setAttachments((x) => x.filter((_, n) => n !== i))}>{path.split(/[\\/]/).at(-1)} ×</button>)}
          </div>
          <button className="btn btn-quiet episode-home" disabled={busy} onClick={async () => {
            const t = text.trim(); if (!t) { document.getElementById('ask')?.focus(); return; }
            if (!keys.ancher) { toast('写一整集需要 Ancher key，请到设置里填写'); return; }
            setBusy(true); const p = await window.api.projects.create(t.slice(0, 18), 'script'); go({ name: 'project', id: p.id, tab: 'write', pendingEpisode: t });
          }}>⚡ 写一整集</button>

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
          <div className="home-links"><button className="btn btn-quiet" onClick={() => go({ name: 'recents' })}>最近项目</button><button className="btn btn-quiet" onClick={async () => { try { const p = await window.api.projects.importArchive(); if (p) go({ name: 'project', id: p.id, tab: 'write' }); } catch (e) { toast(String(e)); } }}>导入项目</button></div>
        </div>
      </div>
    </>
  );
}
