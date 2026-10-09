// Adapted from Ancher's use-multi-select, NoteSelectionBar and NoteActionsMenu
// at streamify-one/streamify-one-design-system@bf0cd935 (see docs/research/ancher-note-actions.md).
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { AncherLibrary, AncherNote, AncherNoteMutation } from '@scripter/agent';
import { NoteLeadingIcon } from './NoteLeadingIcon.tsx';
import { addNoteToChat } from '../lib/note-chat.ts';
import { Icon, useToast } from '../lib/ui.tsx';

type Sort = 'updated-desc' | 'created-desc' | 'title-asc' | 'manual';
const sortNames: Record<Sort, string> = { 'updated-desc': '最近更新', 'created-desc': '最新创建', 'title-asc': '标题 A–Z', manual: '手动排序' };
const labels = { queued: '等待处理', processing: '正在处理', fetched: '正在生成', ready: '已就绪', error: '处理失败' };
function stored<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function Modal({ title, close, busy, children }: { title: string; close: () => void; busy: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="new-note-dialog cloud-action-dialog" aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) close(); }}>
    <header><h2>{title}</h2><button className="btn btn-quiet" aria-label="关闭" disabled={busy} onClick={close}>×</button></header>{children}
  </dialog>;
}
function CloudNoteRename({ note, busy, commit, done }: { note: AncherNote; busy: boolean; commit: (title: string) => Promise<boolean>; done: () => void }) {
  const [value, setValue] = useState(note.title);
  const input = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  useEffect(() => { input.current?.focus(); input.current?.select(); }, []);
  const save = async () => {
    if (submitting.current) return;
    if (!value.trim() || value.trim() === note.title) { done(); return; }
    submitting.current = true;
    if (await commit(value)) done();
    else { input.current?.focus(); submitting.current = false; }
  };
  return <div className="cloud-note-rename"><input ref={input} className="input" aria-label="笔记标题" maxLength={255} value={value} disabled={busy} onChange={e => setValue(e.target.value)} onBlur={() => { if (!submitting.current && !busy) done(); }} onKeyDown={e => {
    e.stopPropagation();
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') { e.preventDefault(); void save(); }
    if (e.key === 'Escape') { e.preventDefault(); done(); }
  }} /><button aria-label="保存标题" disabled={busy || !value.trim()} onMouseDown={e => e.preventDefault()} onClick={() => void save()}><Icon name="check" size={16} /></button></div>;
}
export function CloudNoteSidebar({ library, list, projectId, noteId, collection, onCollection, onPick, onOrder, refresh }: {
  library: AncherLibrary | null; list: AncherNote[]; projectId: string; noteId?: string; collection: string;
  onCollection: (id: string) => void; onPick: (id: string) => void; onOrder: (ids: string[]) => void; refresh: () => Promise<void>;
}) {
  const toast = useToast();
  const [sort, setSort] = useState<Sort>(() => { const value = stored<Sort>('ancher-note-sort', 'updated-desc'); return value in sortNames ? value : 'updated-desc'; });
  const [order, setOrder] = useState<string[]>(() => stored('ancher-note-order', []));
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const anchor = useRef('');
  const dragging = useRef('');
  const [menu, setMenu] = useState<{ note?: AncherNote; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dialog, setDialog] = useState<{ kind: 'collect' | 'delete' | 'share' | 'info'; ids: string[] } | null>(null);
  const [renameId, setRenameId] = useState('');
  const [collectionQuery, setCollectionQuery] = useState('');
  const [collections, setCollections] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const ordered = useMemo(() => [...list].sort((a, b) => sort === 'title-asc' ? a.title.localeCompare(b.title, 'zh-CN') : sort === 'manual' ?
    (order.indexOf(a.id) < 0 ? Infinity : order.indexOf(a.id)) - (order.indexOf(b.id) < 0 ? Infinity : order.indexOf(b.id)) :
    (sort === 'created-desc' ? b.addedAt - a.addedAt : b.updatedAt - a.updatedAt)), [list, sort, order]);
  const visibleIds = ordered.map(n => n.id);
  const signature = visibleIds.join('|');
  useEffect(() => { onOrder(visibleIds); }, [signature, onOrder]);
  const clear = () => { setSelection(new Set()); setSelecting(false); anchor.current = ''; };
  // Selection is scoped to the visible filter and current account snapshot.
  useEffect(() => { const visible = new Set(visibleIds); setSelection(prev => new Set([...prev].filter(id => visible.has(id)))); }, [signature]);
  useEffect(() => { if (!selecting || dialog || busy) return;
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,[contenteditable="true"]') || e.isComposing) return;
      if (e.key === 'Escape') { e.preventDefault(); clear(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); setSelection(new Set(visibleIds)); anchor.current = visibleIds[0] || ''; }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [selecting, signature, dialog, busy]);
  useEffect(() => { if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const dismiss = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(null); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); const buttons = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
      buttons[(buttons.indexOf(document.activeElement as HTMLButtonElement) + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    } };
    document.addEventListener('pointerdown', dismiss); window.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', dismiss); window.removeEventListener('keydown', key); };
  }, [menu]);
  const toggle = (id: string, shift = false) => {
    const checked = !selection.has(id);
    const from = visibleIds.indexOf(anchor.current), to = visibleIds.indexOf(id);
    const range = shift && from >= 0 && to >= 0 ? visibleIds.slice(Math.min(from, to), Math.max(from, to) + 1) : [id];
    const next = new Set(selection); for (const item of range) checked ? next.add(item) : next.delete(item);
    setSelection(next); setSelecting(next.size > 0); anchor.current = id;
  };
  const open = (kind: NonNullable<typeof dialog>['kind'] | 'rename', ids: string[]) => {
    setMenu(null); setError(''); setCollections(new Set()); setCollectionQuery(''); setShareUrl(''); if (kind === 'rename') { clear(); setRenameId(ids[0]!); } else setDialog({ kind, ids });
  };
  const mutate = async (input: AncherNoteMutation) => {
    setBusy(true); setError('');
    try {
      const result = await window.api.ancherNotes.mutate(input);
      await refresh();
      if (result.failed.length) {
        const failed = new Set(result.failed.map(f => f.id));
        setSelection(failed); setSelecting(true);
        setDialog(prev => prev ? { ...prev, ids: [...failed] } : null);
        setError(`${result.succeeded.length} 条成功，${failed.size} 条失败：${result.failed[0]!.error}`);
        toast('部分操作失败，失败的笔记已保留选中');
      } else {
        clear();
        if (input.action === 'share') { setShareUrl(result.shareUrl || ''); toast(input.public ? '已开启公开分享' : '已关闭公开分享'); }
        else { setDialog(null); toast('操作已完成'); }
      }
      return result.failed.length === 0;
    } catch (e) { setError(String(e)); toast(String(e)); return false; }
    finally { setBusy(false); }
  };
  const attach = (ids: string[]) => {
    const notes = ids.map(id => library?.notes.find(n => n.id === id));
    if (notes.some(n => !n || n.status !== 'ready')) return;
    for (const n of notes) addNoteToChat(projectId, { source: 'ancher', id: n!.id, title: n!.title });
    clear(); setMenu(null); toast(`已将 ${ids.length} 条笔记添加到对话`);
  };
  const showMenu = (e: React.MouseEvent, note?: AncherNote) => { e.preventDefault(); e.stopPropagation(); if (busy) return; setMenu({ note, x: Math.max(8, Math.min(e.clientX, window.innerWidth - 240)), y: Math.max(8, Math.min(e.clientY, window.innerHeight - 410)) }); };
  const rows = (notes: AncherNote[], pinned = false) => notes.map(n => <div className={`cloud-note-row${selection.has(n.id) && !pinned ? ' selected' : ''}${n.id === noteId ? ' current' : ''}`} key={n.id}
    onContextMenu={e => showMenu(e, n)} draggable={!selecting && !pinned && !busy && !renameId} onDragStart={() => { dragging.current = n.id; }} onDragOver={e => { if (dragging.current) e.preventDefault(); }} onDragEnd={() => { dragging.current = ''; }} onDrop={e => {
      e.preventDefault(); const from = dragging.current; dragging.current = ''; if (!from || from === n.id || pinned) return;
      const ids = ordered.map(item => item.id).filter(item => item !== from); ids.splice(ids.indexOf(n.id), 0, from);
      const hidden = order.filter(item => !visibleIds.includes(item)); const next = [...ids, ...hidden];
      setOrder(next); setSort('manual'); localStorage.setItem('ancher-note-order', JSON.stringify(next)); localStorage.setItem('ancher-note-sort', JSON.stringify('manual'));
    }}>
    {pinned ? <NoteLeadingIcon kind={n.kind} status={n.status} thumbnail={n.thumbnail} /> : <label className={`cloud-note-check${selecting ? ' showing' : ''}`} title={`选择 ${n.title}`}><input type="checkbox" aria-label={`选择 ${n.title}`} checked={selection.has(n.id)} disabled={busy} onClick={e => { e.stopPropagation(); toggle(n.id, e.shiftKey); }} onChange={() => {}} /><span className="cloud-check-icon"><NoteLeadingIcon kind={n.kind} status={n.status} thumbnail={n.thumbnail} /></span></label>}
    {renameId === n.id && (!pinned || !visibleIds.includes(n.id)) ? <CloudNoteRename note={n} busy={busy} done={() => setRenameId('')} commit={title => mutate({ action: 'rename', ids: [n.id], title })} /> : <button className="cloud-note-open" data-note-id={n.id} aria-current={n.id === noteId ? 'page' : undefined} onClick={e => { if (selecting && !pinned) toggle(n.id, e.shiftKey); else { clear(); if (pinned) onCollection(''); onPick(n.id); } }}><span title={n.title}>{n.title}</span>{n.status !== 'ready' && <small>{labels[n.status]}</small>}</button>}
    <button className="cloud-note-more" aria-label={`操作 ${n.title}`} disabled={busy} onClick={e => showMenu(e, n)}>⋯</button>
  </div>);
  const pinned = (library?.pinnedNoteIds || []).flatMap(id => { const n = library?.notes.find(n => n.id === id); return n ? [n] : []; });
  const selectedNotes = [...selection].map(id => library?.notes.find(n => n.id === id));
  const target = library?.notes.find(n => n.id === dialog?.ids[0]);
  return <>
    <details open className="note-group"><summary>已固定 <span>{pinned.length}</span></summary><div className="note-items">{rows(pinned, true)}</div></details>
    <details open className="note-group"><summary>合集 <span>{library?.collections.length ?? 0}</span></summary><div className="note-items">{library?.collections.map(c => <button key={c.id} aria-current={collection === c.id ? 'page' : undefined} onClick={() => { clear(); onCollection(c.id); }}><span className="cloud-collection-icon" style={{ color: `var(--color-${c.color}-500, var(--primary))` }}><Icon name="box" size={16} /></span><span>{c.name}</span></button>)}</div></details>
    <details open className="note-group note-all"><summary>笔记 <span>{ordered.length}</span><span className="grow" /><button aria-label={selecting ? '取消多选' : '多选笔记'} title="多选笔记" disabled={busy} onClick={e => { e.preventDefault(); selecting ? clear() : setSelecting(true); }}>☑</button><button aria-label="排序 Ancher 笔记" onClick={e => showMenu(e)}>↕</button><button aria-label="全选当前笔记" title="全选当前笔记" disabled={busy} onClick={e => { e.preventDefault(); setSelecting(true); setSelection(new Set(visibleIds)); }}>全选</button></summary><div className="note-items">{rows(ordered)}</div></details>
    {menu && createPortal(<div ref={menuRef} className="topic-menu cloud-note-menu" role="menu" aria-label={menu.note ? '笔记操作' : '笔记排序'} style={{ left: menu.x, top: menu.y }}>
      {menu.note ? <>
        <button role="menuitem" disabled={busy} onClick={() => { setMenu(null); void mutate({ action: menu.note!.starred ? 'unpin' : 'pin', ids: [menu.note!.id] }); }}>{menu.note.starred ? '取消固定' : '固定笔记'}</button>
        <button role="menuitem" onClick={() => open('rename', [menu.note!.id])}>重命名</button>
        <button role="menuitem" disabled={menu.note.status !== 'ready'} onClick={() => attach([menu.note!.id])}>添加到对话</button>
        <button role="menuitem" onClick={() => open('collect', [menu.note!.id])}>添加到合集</button>
        {menu.note.sourceUrl && <><button role="menuitem" onClick={() => { void navigator.clipboard.writeText(menu.note!.sourceUrl!).then(() => toast('已复制来源链接'), e => toast(String(e))); setMenu(null); }}>复制来源链接</button><button role="menuitem" onClick={() => { window.open(menu.note!.sourceUrl!, '_blank'); setMenu(null); }}>打开来源</button></>}
        <button role="menuitem" disabled={menu.note.status !== 'ready'} onClick={() => open('share', [menu.note!.id])}>分享</button>
        <button role="menuitem" onClick={() => open('info', [menu.note!.id])}>笔记信息</button>
        {menu.note.status === 'error' && <button role="menuitem" disabled={busy} onClick={() => { const id = menu.note!.id; setMenu(null); void mutate({ action: 'retry', ids: [id] }); }}>重试处理</button>}
        <hr /><button role="menuitem" className="err" disabled={busy} onClick={() => open('delete', [menu.note!.id])}>删除笔记</button>
      </> : Object.entries(sortNames).map(([value, label]) => <button role="menuitemradio" aria-checked={sort === value} key={value} onClick={() => { setSort(value as Sort); localStorage.setItem('ancher-note-sort', JSON.stringify(value)); setMenu(null); }}>{sort === value ? '✓ ' : ''}{label}</button>)}
    </div>, document.body)}
    {selection.size > 0 && createPortal(<div className="cloud-selection-bar" role="toolbar" aria-label="批量笔记操作"><strong aria-live="polite">已选 {selection.size} 条</strong><button title="取消选择" aria-label="取消选择" disabled={busy} onClick={clear}><Icon name="x" size={20} /></button><span className="cloud-selection-divider" /><button title="添加到合集" aria-label="批量添加到合集" disabled={busy} onClick={() => open('collect', [...selection])}><Icon name="folderPlus" size={20} /></button><button title="添加到对话" aria-label="批量添加到对话" disabled={busy || selectedNotes.some(n => !n || n.status !== 'ready')} onClick={() => attach([...selection])}><Icon name="chat" size={20} /></button><button title="删除" aria-label="批量删除笔记" disabled={busy} onClick={() => open('delete', [...selection])}><Icon name="trash" size={20} /></button></div>, document.body)}
    {dialog && <Modal key={dialog.kind} title={{ collect: '添加到合集', delete: '删除笔记', rename: '重命名笔记', share: '分享笔记', info: '笔记信息' }[dialog.kind]} busy={busy} close={() => setDialog(null)}>
      {error && <p className="err" role="alert">{error}</p>}
      {dialog.kind === 'collect' && <><p>将 {dialog.ids.length} 条笔记添加到所选合集，保留原有合集。</p><input className="input" aria-label="搜索或新建合集" placeholder="搜索或新建合集" value={collectionQuery} disabled={busy} onChange={e => setCollectionQuery(e.target.value)} /><div className="cloud-collection-options">{library?.collections.filter(c => c.name.toLowerCase().includes(collectionQuery.toLowerCase())).map(c => <label key={c.id}><input type="checkbox" disabled={busy} checked={collections.has(c.id)} onChange={() => setCollections(prev => { const next = new Set(prev); next.has(c.id) ? next.delete(c.id) : next.add(c.id); return next; })} />{c.name}</label>)}</div>
        {collectionQuery.trim() && !library?.collections.some(c => c.name.toLowerCase() === collectionQuery.trim().toLowerCase()) && <button className="btn" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { const c = await window.api.ancherNotes.createCollection(collectionQuery); await refresh(); setCollections(prev => new Set([...prev, c.id])); setCollectionQuery(''); } catch (e) { setError(String(e)); } finally { setBusy(false); } }}>新建合集“{collectionQuery.trim()}”</button>}
        <footer><button className="btn" disabled={busy} onClick={() => setDialog(null)}>取消</button><button className="btn btn-primary" disabled={busy || !collections.size} onClick={() => void mutate({ action: 'collect', ids: dialog.ids, collectionIds: [...collections] })}>{busy ? '添加中…' : `添加到 ${collections.size} 个合集`}</button></footer></>}
      {dialog.kind === 'delete' && <><p>确认删除这 {dialog.ids.length} 条 Ancher 笔记？这会同步影响官网账号。当前 SDK 不提供恢复接口，请确认后再继续。</p><footer><button className="btn" disabled={busy} onClick={() => setDialog(null)}>取消</button><button className="btn danger" disabled={busy} onClick={() => void mutate({ action: 'delete', ids: dialog.ids })}>{busy ? '删除中…' : '确认删除'}</button></footer></>}
      {dialog.kind === 'share' && <><p>当前状态：{target?.isPublic ? '公开' : '私有'}</p><p>开启公开分享后，任何获得链接的人都可以查看这条笔记。</p><button className="btn" disabled={busy} onClick={() => void mutate({ action: 'share', ids: dialog.ids, public: true })}>开启公开分享</button><button className="btn" disabled={busy} onClick={() => void mutate({ action: 'share', ids: dialog.ids, public: false })}>关闭公开分享</button>{shareUrl && <><input className="input" aria-label="分享链接" readOnly value={shareUrl} /><button className="btn" onClick={() => void navigator.clipboard.writeText(shareUrl).then(() => toast('已复制分享链接'), e => setError(String(e)))}>复制分享链接</button></>}</>}
      {dialog.kind === 'info' && target && <dl><dt>标题</dt><dd>{target.title}</dd><dt>状态</dt><dd>{labels[target.status]}</dd><dt>创建时间</dt><dd>{new Date(target.addedAt).toLocaleString('zh-CN')}</dd><dt>更新时间</dt><dd>{new Date(target.updatedAt).toLocaleString('zh-CN')}</dd><dt>合集</dt><dd>{library?.collections.filter(c => target.collectionIds.includes(c.id)).map(c => c.name).join('、') || '无'}</dd><dt>来源</dt><dd>{target.sourceUrl || '文本或文件'}</dd><dt>ID</dt><dd>{target.id}</dd></dl>}
    </Modal>}
  </>;
}
