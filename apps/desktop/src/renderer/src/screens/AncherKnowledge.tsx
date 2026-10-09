import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AncherLibrary, AncherNoteContent } from '@scripter/agent';
import { NewAncherNote } from './NewAncherNote.tsx';
import { AncherMarkdown, AncherOriginalViewer } from './AncherNoteContent.tsx';
import { NoteLeadingIcon } from '../components/NoteLeadingIcon.tsx';
import { addNoteToChat } from '../lib/note-chat.ts';
import { useNoteShortcuts } from '../lib/note-shortcuts.ts';
import { Icon, isMac, useToast } from '../lib/ui.tsx';

const statusLabel = { queued: '等待处理', processing: '正在处理', fetched: '内容已获取，正在生成', ready: '已就绪', error: '处理失败' };
export function AncherKnowledge({ id, onSelect, toggleDock, dockOpen, switcher, onImported }: {
  id: string;
  onSelect?: (fileId?: string) => void; toggleDock?: () => void; dockOpen?: boolean;
  switcher?: ReactNode; onImported?: (fileId: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') { e.preventDefault(); setCreating(true); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const [library, setLibrary] = useState<AncherLibrary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('');
  const [selected, setSelected] = useState('');
  const [reverse, setReverse] = useState(false);
  const [content, setContent] = useState<AncherNoteContent | null>(null);
  const [bodyError, setBodyError] = useState('');
  const [mode, setMode] = useState<'summary' | 'original'>('summary');
  const [originalFileId, setOriginalFileId] = useState('');
  const [importing, setImporting] = useState(false);
  const [mediaRetry, setMediaRetry] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const alive = useRef(false);
  const inFlight = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
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
  useEffect(() => {
    if (!mediaRetry) return;
    const timer = setTimeout(() => { setMediaRetry(false); setRefreshKey((x) => x + 1); }, 15000);
    return () => clearTimeout(timer);
  }, [mediaRetry]);
  // Cloud notes become project/chat reference only after explicit local import.
  useEffect(() => { onSelect?.(undefined); }, [onSelect]);
  const notes = library?.notes ?? [];
  const list = notes.filter((n) => !collection || n.collectionIds.includes(collection)).filter((n) => `${n.title} ${n.memo} ${n.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  if (reverse) list.reverse();
  const note = list.find((n) => n.id === selected) ?? list[0];
  const noteId = note?.id;
  useEffect(() => {
    let live = true;
    setContent((previous) => previous?.note.id === noteId ? previous : null); setBodyError('');
    if (!noteId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const read = async () => {
      try {
        const next = await window.api.ancherNotes.read(noteId);
        if (!live) return;
        setContent(next); setBodyError('');
        if (next.needsRetry) timer = setTimeout(read, 15000);
        else if (next.note.status !== 'ready' && next.note.status !== 'error') timer = setTimeout(read, 5000);
      } catch (e) {
        if (live) { setBodyError(String(e)); timer = setTimeout(read, 15000); }
      }
    };
    void read();
    return () => { live = false; clearTimeout(timer); };
  }, [noteId, note?.updatedAt, note?.status, refreshKey]);
  const current = content?.note ?? note;
  const pick = (noteId: string) => { setSelected(noteId); setMode('summary'); setOriginalFileId(''); };
  const attach = () => {
    if (!current || current.id !== noteId || current.status !== 'ready') return;
    addNoteToChat(id, { source:'ancher', id:current.id, title:current.title });
  };
  useNoteShortcuts(root, search, noteId, list.map((n) => n.id), pick, attach, current?.id === noteId && current?.status === 'ready');
  const byId = new Map(notes.map((n) => [n.id, n]));
  const pinned = (library?.pinnedNoteIds ?? []).flatMap((id) => byId.has(id) ? [byId.get(id)!] : []);
  async function importNote() {
    if (!noteId) return;
    setImporting(true);
    try {
      const result = await window.api.ancherNotes.import(id, noteId);
      window.dispatchEvent(new CustomEvent('scripter:project', { detail: id }));
      onSelect?.(result.fileId); toast('已保存到项目，可用作写作参考');
      onImported?.(result.fileId);
    } catch (e) { toast(String(e)); }
    finally { if (alive.current) setImporting(false); }
  }
  return <div ref={root} className="knowledge-layout ancher-knowledge">
    <aside className="side-list note-list">
      {switcher}
      <button className="btn btn-ghost" onClick={() => setCreating(true)}><Icon name="plus" size={16} />新建笔记<kbd>{isMac ? '⇧⌘O' : 'Ctrl+Shift+O'}</kbd></button>
      <button className="btn btn-ghost" disabled={loading} onClick={() => { void refresh(); setRefreshKey((x) => x + 1); }}><Icon name="undo" size={14} />{loading ? '刷新中…' : '刷新 Ancher 笔记'}</button>
      <input ref={search} className="input" aria-label="搜索 Ancher 笔记" placeholder={isMac ? '搜索笔记  ⌘K' : '搜索笔记  Ctrl+K'} value={query} onChange={(e) => setQuery(e.target.value)} />
      <details open className="note-group"><summary>已固定 <span>{pinned.length}</span></summary><div className="note-items">{pinned.map((n) => <button data-note-id={n.id} key={n.id} onClick={() => { setCollection(''); setQuery(''); pick(n.id); }} aria-current={n.id === noteId ? 'page' : undefined}><NoteLeadingIcon kind={n.kind} status={n.status} thumbnail={n.thumbnail} /><span title={n.title}>{n.title}</span></button>)}</div></details>
      <details open className="note-group"><summary>合集 <span>{library?.collections.length ?? 0}</span></summary><div className="note-items">{library?.collections.map((c) => <button key={c.id} aria-current={collection === c.id ? 'page' : undefined} onClick={() => { setCollection(c.id); setSelected(''); setQuery(''); }}><span className="cloud-collection-icon" style={{ color: `var(--color-${c.color}-500, var(--primary))` }}><Icon name="box" size={16} /></span><span>{c.name}</span></button>)}</div></details>
      <details open className="note-group note-all"><summary>笔记 <span>{list.length}</span><span className="grow" /><button aria-label="排序 Ancher 笔记" onClick={(e) => { e.preventDefault(); setReverse((x) => !x); }}>↕</button></summary><div className="note-items">{list.map((n) => <button data-note-id={n.id} key={n.id} aria-current={n.id === noteId ? 'page' : undefined} onClick={() => pick(n.id)}><NoteLeadingIcon kind={n.kind} status={n.status} thumbnail={n.thumbnail} /><span title={n.title}>{n.title}</span>{n.status !== 'ready' && <small>{statusLabel[n.status]}</small>}</button>)}</div></details>
      <button className="btn btn-ghost" onClick={() => { setCollection(''); setQuery(''); }}>全部 Ancher 笔记</button>
      <p className="muted cloud-hint">与官网同一账号 · 自动刷新</p>
    </aside>
    <section className="note-page">
      {error ? <div className="empty-state"><div role="alert" className="err">{error}</div><button className="btn" onClick={() => void refresh()}>重试</button></div>
        : !current ? <div className="empty-state">{loading ? '正在读取 Ancher 笔记…' : library && notes.length ? '没有符合条件的笔记' : '还没有笔记，点击“新建笔记”添加内容'}</div>
        : <div className="note-frame">
          <div className="note-tools"><span className="muted">Ancher 笔记 · {statusLabel[current.status]}</span><span className="grow" /><button className="btn btn-ghost" disabled={current.status !== 'ready'} title={isMac ? '添加到对话 ⇧⌘↵' : '添加到对话 Ctrl+Shift+Enter'} onClick={attach}><Icon name="chat" size={14} />添加到对话</button><button className="btn btn-ghost" disabled={importing || current.status !== 'ready' || content?.body == null || !!bodyError || !!content?.summaryError} onClick={() => void importNote()}>{importing ? '保存中…' : '保存到项目'}</button><button className="btn btn-quiet" aria-label="切换 AI 对话" aria-pressed={dockOpen} onClick={toggleDock}><Icon name="chat" size={14} /></button></div>
          <div className="page note-content">
            <div className="note-kicker muted">笔记 · {new Date(current.addedAt).toLocaleDateString('zh-CN')}</div>
            <h1 className="cloud-note-title">{current.title}</h1>
            <div className="chipset">{current.tags.map((t) => <span className="chip" key={t}>{t}</span>)}</div>
            {current.memo && <div className="cloud-memo"><span>备注</span><p>{current.memo}</p></div>}
            <div className="seg" role="tablist" aria-label="笔记内容"><button role="tab" aria-selected={mode === 'summary'} onClick={() => setMode('summary')}>摘要</button><button role="tab" aria-selected={mode === 'original'} onClick={() => { setMode('original'); setRefreshKey((x) => x + 1); }}>原文</button></div>
            <div className="note-body">
              {bodyError ? <div role="alert" className="err">{bodyError}<button className="btn btn-quiet" onClick={() => setRefreshKey((x) => x + 1)}>重试读取</button></div>
                : mode === 'original' && content ? <AncherOriginalViewer content={content} fileId={originalFileId} onSelect={(fileId) => { setOriginalFileId(fileId); setRefreshKey((x) => x + 1); }} onMediaError={() => setMediaRetry(true)} />
                : content?.summaryError ? <div role="alert" className="err">{content.summaryError}<button className="btn btn-quiet" onClick={() => setRefreshKey((x) => x + 1)}>重试读取</button></div>
                : current.status === 'error' ? <div role="alert" className="err">{current.error || 'Ancher 处理失败，请在官网重试'}</div>
                : current.status !== 'ready' ? <div className="note-processing">{statusLabel[current.status]}…<p>转写完成后这里会自动显示正文。</p></div>
                : !content ? '正在读取内容…' : <AncherMarkdown text={content.body || current.description || '暂无摘要。'} imageUrls={content.imageUrls} onMediaError={() => setMediaRetry(true)} />}
            </div>
            <p className="muted cloud-hint">添加到对话后可直接询问这条笔记 · 保存到项目后可用作写作参考</p>
          </div>
        </div>}
    </section>
    {creating && <NewAncherNote collections={library?.collections ?? []} initialCollection={collection} onClose={() => setCreating(false)} onCreated={(result) => {
      setCreating(false); setCollection(''); setQuery(''); pick(result.noteId); setRefreshKey((x) => x + 1);
      toast(result.warning || '笔记已创建，处理完成后会自动显示内容'); void refresh();
    }} />}
  </div>;
}
