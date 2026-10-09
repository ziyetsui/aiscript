import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AncherLibrary, AncherNoteContent } from '@scripter/agent';
import { Markdown } from '../lib/markdown.tsx';
import { Icon, useToast } from '../lib/ui.tsx';

const statusLabel = { queued: '等待处理', processing: '正在处理', fetched: '内容已获取，正在生成', ready: '已就绪', error: '处理失败' };
export function AncherKnowledge({ id, switcher, onImported, onSelect, toggleDock, dockOpen }: {
  id: string; switcher: ReactNode; onImported: (fileId: string) => void;
  onSelect?: (fileId?: string) => void; toggleDock?: () => void; dockOpen?: boolean;
}) {
  const [library, setLibrary] = useState<AncherLibrary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('');
  const [selected, setSelected] = useState('');
  const [reverse, setReverse] = useState(false);
  const [content, setContent] = useState<AncherNoteContent | null>(null);
  const [bodyError, setBodyError] = useState('');
  const [mode, setMode] = useState<'summary' | 'original'>('original');
  const [importing, setImporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const alive = useRef(false);
  const inFlight = useRef(false);
  const toast = useToast();
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true; setLoading(true);
    try {
      const result = await window.api.ancherNotes.list();
      if (alive.current) { setLibrary(result); setError(''); }
    } catch (e) { if (alive.current) { setError(String(e)); setLibrary(null); } }
    finally { inFlight.current = false; if (alive.current) setLoading(false); }
  }, []);
  useEffect(() => {
    alive.current = true; void refresh();
    const focus = () => { void refresh(); setRefreshKey((x) => x + 1); };
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 15000);
    window.addEventListener('focus', focus);
    return () => { alive.current = false; clearInterval(timer); window.removeEventListener('focus', focus); };
  }, [refresh]);
  // Cloud notes become project/chat reference only after explicit local import.
  useEffect(() => { onSelect?.(undefined); }, [onSelect]);
  const notes = library?.notes ?? [];
  const list = notes.filter((n) => !collection || n.collectionIds.includes(collection)).filter((n) => `${n.title} ${n.memo} ${n.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  if (reverse) list.reverse();
  const note = list.find((n) => n.id === selected) ?? list[0];
  const noteId = note?.id;
  useEffect(() => {
    let live = true;
    setContent(null); setBodyError('');
    if (!noteId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const read = async () => {
      try {
        const next = await window.api.ancherNotes.read(noteId);
        if (!live) return;
        setContent(next); setBodyError('');
        if (next.note.status !== 'ready' && next.note.status !== 'error') timer = setTimeout(read, 5000);
      } catch (e) {
        if (live) { setBodyError(String(e)); timer = setTimeout(read, 15000); }
      }
    };
    void read();
    return () => { live = false; clearTimeout(timer); };
  }, [noteId, note?.updatedAt, note?.status, refreshKey]);
  const current = content?.note ?? note;
  const pick = (noteId: string) => { setSelected(noteId); setMode('original'); };
  const byId = new Map(notes.map((n) => [n.id, n]));
  const pinned = (library?.pinnedNoteIds ?? []).flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
  async function importNote() {
    if (!noteId) return;
    setImporting(true);
    try {
      const result = await window.api.ancherNotes.import(id, noteId);
      window.dispatchEvent(new CustomEvent('scripter:project', { detail: id }));
      toast('已保存到项目笔记，可设为写作参考'); onImported(result.fileId);
    } catch (e) { toast(String(e)); }
    finally { if (alive.current) setImporting(false); }
  }
  return <div className="knowledge-layout ancher-knowledge">
    <aside className="side-list note-list">
      {switcher}
      <button className="btn btn-ghost" disabled={loading} onClick={() => { void refresh(); setRefreshKey((x) => x + 1); }}><Icon name="undo" size={14} />{loading ? '刷新中…' : '刷新 Ancher 笔记'}</button>
      <input className="input" aria-label="搜索 Ancher 笔记" placeholder="搜索笔记" value={query} onChange={(e) => setQuery(e.target.value)} />
      <details open className="note-group"><summary>已固定 <span>{pinned.length}</span></summary><div className="note-items">{pinned.map((n) => <button key={n.id} onClick={() => { setCollection(''); setQuery(''); pick(n.id); }} aria-current={n.id === noteId ? 'page' : undefined}><Icon name="doc" size={14} /><span>{n.title}</span></button>)}</div></details>
      <details open className="note-group"><summary>合集 <span>{library?.collections.length ?? 0}</span></summary><div className="note-items">{library?.collections.map((c) => <button key={c.id} aria-current={collection === c.id ? 'page' : undefined} onClick={() => { setCollection(c.id); setSelected(''); setQuery(''); }}><span className="cloud-collection-icon" style={{ color: `var(--color-${c.color}-500, var(--primary))` }}><Icon name="box" size={16} /></span><span>{c.name}</span></button>)}</div></details>
      <details open className="note-group note-all"><summary>笔记 <span>{list.length}</span><span className="grow" /><button aria-label="排序 Ancher 笔记" onClick={(e) => { e.preventDefault(); setReverse((x) => !x); }}>↕</button></summary><div className="note-items">{list.map((n) => <button key={n.id} aria-current={n.id === noteId ? 'page' : undefined} onClick={() => pick(n.id)}><Icon name="doc" size={14} /><span>{n.title}</span>{n.status !== 'ready' && <small>{statusLabel[n.status]}</small>}</button>)}</div></details>
      <button className="btn btn-ghost" onClick={() => { setCollection(''); setQuery(''); }}>全部 Ancher 笔记</button>
      <p className="muted cloud-hint">与官网同一账号 · 自动刷新</p>
    </aside>
    <section className="note-page">
      {error ? <div className="empty-state"><div role="alert" className="err">{error}</div><button className="btn" onClick={() => void refresh()}>重试</button></div>
        : !current ? <div className="empty-state">{loading ? '正在读取 Ancher 笔记…' : library && notes.length ? '没有符合条件的笔记' : '这个 Ancher 账号还没有笔记，请先在官网保存'}</div>
        : <div className="note-frame">
          <div className="note-tools"><span className="muted">Ancher 笔记 · {statusLabel[current.status]}</span><span className="grow" /><button className="btn btn-ghost" disabled={importing || current.status !== 'ready' || content?.body == null || !!bodyError} onClick={() => void importNote()}>{importing ? '保存中…' : '保存到项目'}</button><button className="btn btn-quiet" aria-label="切换 AI 对话" aria-pressed={dockOpen} onClick={toggleDock}><Icon name="chat" size={14} /></button></div>
          <div className="page note-content">
            <div className="note-kicker muted">笔记 · {new Date(current.addedAt).toLocaleDateString('zh-CN')}</div>
            <h1 className="cloud-note-title">{current.title}</h1>
            <div className="chipset">{current.tags.map((t) => <span className="chip" key={t}>{t}</span>)}</div>
            {current.memo && <p className="muted">{current.memo}</p>}
            <div className="seg" role="tablist" aria-label="笔记内容"><button role="tab" aria-selected={mode === 'summary'} onClick={() => setMode('summary')}>摘要</button><button role="tab" aria-selected={mode === 'original'} onClick={() => setMode('original')}>原文</button></div>
            <div className="note-body">
              {bodyError ? <div role="alert" className="err">{bodyError}<button className="btn btn-quiet" onClick={() => setRefreshKey((x) => x + 1)}>重试读取</button></div>
                : current.status === 'error' ? <div role="alert" className="err">{current.error || 'Ancher 处理失败，请在官网重试'}</div>
                : current.status !== 'ready' ? <div className="note-processing">{statusLabel[current.status]}…<p>转写完成后这里会自动显示正文。</p></div>
                : mode === 'summary' ? <Markdown text={current.description || '暂无摘要。'} />
                : content?.body === null || !content ? '正在读取正文…' : <Markdown text={content.body} />}
            </div>
            <p className="muted cloud-hint">官网笔记只读 · 保存到项目后可离线编辑和用于写作参考</p>
          </div>
        </div>}
    </section>
  </div>;
}
