import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { useProject } from '../lib/project.ts';
import { NoteLeadingIcon } from '../components/NoteLeadingIcon.tsx';
import { addNoteToChat } from '../lib/note-chat.ts';
import { useNoteShortcuts } from '../lib/note-shortcuts.ts';
import { Markdown } from '../lib/markdown.tsx';
import { Icon, useToast } from '../lib/ui.tsx';
import { AncherKnowledge } from './AncherKnowledge.tsx';

type Group = 'all' | 'pinned' | 'chat' | 'upload';
type KnowledgeProps = { id: string; toggleDock?: () => void; dockOpen?: boolean; onSelect?: (fileId?: string) => void };
export function Knowledge(props: KnowledgeProps) {
  const [source, setSource] = useState(() => sessionStorage.getItem(`scripter-knowledge-source-${props.id}`) || 'ancher');
  const choose = (next: string) => { sessionStorage.setItem(`scripter-knowledge-source-${props.id}`, next); setSource(next); };
  const switcher = <div className="seg note-source" role="tablist" aria-label="笔记来源">
    <button role="tab" aria-selected={source === 'ancher'} onClick={() => choose('ancher')}>Ancher 笔记</button>
    <button role="tab" aria-selected={source === 'local'} onClick={() => choose('local')}>项目笔记</button>
  </div>;
  return source === 'ancher' ? <AncherKnowledge {...props} switcher={switcher} onImported={(fileId) => {
    sessionStorage.setItem(`scripter-note-${props.id}`, fileId); choose('local');
  }} /> : <LocalKnowledge {...props} switcher={switcher} />;
}
function LocalKnowledge({ id, onSelect, toggleDock, dockOpen, switcher }: KnowledgeProps & { switcher: ReactNode }) {
  const p = useProject(id);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [group, setGroup] = useState<Group>('all');
  const [selected, setSelected] = useState<string | undefined>(() => sessionStorage.getItem(`scripter-note-${id}`) || undefined);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'summary' | 'original'>('summary');
  const [collection, setCollection] = useState('');
  const [newCollection, setNewCollection] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string>();
  const [more, setMore] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [reverseSort, setReverseSort] = useState(false);
  const [editing, setEditing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [over, setOver] = useState(false);
  const toast = useToast();
  const isWindows = /Windows/.test(navigator.userAgent);
  const files = p.st?.bible.files ?? [];
  const matches = (f: typeof files[number]) => group === 'all' || (group === 'pinned' ? f.pinned : f.src === group);
  const collections = [...new Set([...(p.st?.meta.noteGroups ?? []), ...files.map((f) => f.group).filter((g) => g && g !== '全部笔记')])];
  const list = [...files].sort((a, b) => reverseSort ? b.addedAt - a.addedAt : a.addedAt - b.addedAt).filter(matches).filter((f) => !collection || f.group === collection).filter((f) => `${f.title || f.name} ${f.memo} ${f.tags.map((t) => t.label).join(' ')}`.includes(query));
  const note = list.find((f) => f.id === selected) ?? list[0];
  const attach = () => { if (note) addNoteToChat(id, { source:'project', id:note.id, title:note.title || note.name }); };
  useNoteShortcuts(root, search, note?.id, list.map((f) => f.id), setSelected, attach, note?.extract === 'ready' && !!note.excerpt.trim());
  useEffect(() => { if (note) sessionStorage.setItem(`scripter-note-${id}`, note.id); onSelect?.(note?.id); }, [note?.id, onSelect]);
  const create = async () => {
    try { const s = await window.api.files.createNote(id, '未命名笔记', ''); p.setSt(s); setGroup('all'); setCollection(''); setQuery(''); setSelected(s.bible.files.at(-1)?.id); setMode('original'); setEditing(true); requestAnimationFrame(() => document.querySelector<HTMLInputElement>('[aria-label="笔记标题"]')?.select()); } catch (e) { toast(String(e)); }
  };
  useEffect(() => { const h = (e: KeyboardEvent) => { if (!(e.metaKey || e.ctrlKey)) return; if (e.shiftKey && e.key.toLowerCase() === 'o') { e.preventDefault(); void create(); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [id]);
  useEffect(() => { setMore(false); setAddingTag(false); }, [note?.id]);
  useEffect(() => { if (!more && !addingTag) return; const click = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('.note-more-wrap')) setMore(false); }; const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMore(false); setAddingTag(false); } }; window.addEventListener('pointerdown', click); window.addEventListener('keydown', key); return () => { window.removeEventListener('pointerdown', click); window.removeEventListener('keydown', key); }; }, [more, addingTag]);
  if (!p.st) return null;
  const update = async (patch: Parameters<typeof window.api.files.update>[2]) => {
    if (!note) return;
    try { p.setSt(await window.api.files.update(id, note.id, patch)); window.dispatchEvent(new CustomEvent('scripter:note', { detail: id })); } catch (e) { toast(String(e)); }
  };
  async function pick() {
    const r = await window.api.files.pick(id);
    if (r) { p.setSt(r.state); setGroup('all'); setCollection(''); setQuery(''); if (r.added) setSelected(r.state.bible.files.at(-1)?.id); if (r.skipped.length) toast(`没有添加：${r.skipped.join('、')}`); }
  }
  async function drop(e: DragEvent) {
    e.preventDefault(); setOver(false);
    try { const r = await window.api.files.addPaths(id, [...e.dataTransfer.files].map((f) => window.api.files.pathFor(f)).filter(Boolean)); p.setSt(r.state); setGroup('all'); setCollection(''); setQuery(''); if (r.added) setSelected(r.state.bible.files.at(-1)?.id); }
    catch (e) { toast(String(e)); }
  }
  const editable = !!note && /\.(md|txt|fountain|srt)$/i.test(note.file);
  return <div ref={root} className="knowledge-layout" onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => void drop(e)}>
    <aside className="side-list note-list">
      {switcher}
      <button className="btn btn-ghost" onClick={() => void create()}><Icon name="plus" size={14} />新建笔记<kbd>{isWindows ? 'Ctrl+Shift+O' : '⇧⌘O'}</kbd></button>
      <input ref={search} className="input" aria-label="搜索笔记" placeholder={isWindows ? '搜索笔记  Ctrl+K' : '搜索笔记  ⌘K'} value={query} onChange={(e) => setQuery(e.target.value)} />
      <details open className="note-group"><summary>已固定 <span className="muted">{files.filter((f) => f.starred).length}</span></summary><div className="note-items">{files.filter((f) => f.starred).map((f) => <button data-note-id={f.id} key={f.id} onClick={() => { setGroup('all'); setCollection(''); setQuery(''); setSelected(f.id); }} aria-current={f.id === note?.id ? 'page' : undefined}><NoteLeadingIcon kind={f.src === 'upload' ? 'file' : 'note'} /><span title={f.title || f.name}>{f.title || f.name}</span></button>)}</div></details>
      <details open className="note-group"><summary>合集 <span className="muted">{collections.length}</span><span className="grow" /><button aria-label="排序合集" onClick={(e) => { e.preventDefault(); setReverseSort((x) => !x); }}>↕</button><button aria-label="新建合集" onClick={(e) => { e.preventDefault(); setRenaming(undefined); setNewCollection(''); }}>+</button></summary><div className="note-items">{(reverseSort ? [...collections].reverse() : collections).map((g) => <button key={g} onClick={() => { setCollection(g); setGroup('all'); }}><Icon name="box" size={14} /><span>{g}</span></button>)}</div>{collection && <div className="collection-controls"><button aria-label="重命名合集" onClick={() => { setRenaming(collection); setNewCollection(collection); }}>重命名</button><button aria-label="删除合集" onClick={async () => { if (confirm('删除合集？笔记会回到全部笔记。')) { p.setSt(await window.api.files.collection(id, 'delete', collection)); setCollection(''); } }}>删除</button></div>}<button className="btn btn-quiet" onClick={() => { setRenaming(undefined); setNewCollection(''); }}>+ 新建合集</button>{newCollection !== null && <input autoFocus className="input" aria-label="新合集名称" placeholder="名称 · 回车保存" value={newCollection} onChange={(e) => setNewCollection(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.nativeEvent.keyCode !== 229 && newCollection.trim()) { void window.api.files.collection(id, renaming ? 'rename' : 'create', renaming || newCollection.trim(), renaming ? newCollection.trim() : undefined).then(p.setSt).catch((e) => toast(String(e))); setCollection(''); setNewCollection(null); } if (e.key === 'Escape') setNewCollection(null); }} />}</details>
      <details open className="note-group note-all"><summary>笔记 <span className="muted">{list.length}</span><span className="grow" /><button aria-label="排序笔记" onClick={(e) => { e.preventDefault(); setReverseSort((x) => !x); }}>↕</button><button aria-label="新建笔记" onClick={(e) => { e.preventDefault(); void create(); }}>+</button></summary><div className="note-items">{list.map((f) => <button data-note-id={f.id} key={f.id} aria-current={f.id === note?.id ? 'page' : undefined} onClick={() => { setSelected(f.id); setEditing(false); }}><NoteLeadingIcon kind={f.src === 'upload' ? 'file' : 'note'} /><span title={f.title || f.name}>{f.title || f.name}</span></button>)}</div></details>
      <select className="note-filter" aria-label="文件来源" value={group} onChange={(e) => { setGroup(e.target.value as Group); setCollection(''); }}><option value="all">全部笔记</option><option value="pinned">写作时参考</option><option value="chat">聊天附件</option><option value="upload">直接上传</option></select>
      <button className="btn btn-ghost" onClick={() => void pick()}><Icon name="upload" size={14} />添加文件</button>
    </aside>
    <section className="note-page">

      {!note ? <div className="empty-state">新建笔记，或把参考资料拖进来</div> : <div className="note-frame" key={note.id}>
        <div className="note-tools"><button className="note-version muted" onClick={() => toast(`版本：v${note.revision || 1}（当前）`)}><Icon name="undo" size={14} />v{note.revision || 1}⌄</button><span className="grow" />
          {(() => { const turn = [...p.st.turns].reverse().find((t) => t.label === `编辑笔记元数据：${note.id}` && !t.undone); return turn && <button className="btn btn-quiet" aria-label="撤销笔记信息修改" onClick={async () => { p.setSt(await window.api.projects.undoTurn(id, turn.id)); toast('已撤销笔记信息修改'); }}><Icon name="undo" size={14} /></button>; })()}
          <button className="btn btn-ghost" disabled={note.extract !== 'ready' || !note.excerpt.trim()} title={isWindows ? '添加到对话 Ctrl+Shift+Enter' : '添加到对话 ⇧⌘↵'} onClick={attach}><Icon name="chat" size={14} />添加到对话</button>
          <button className="chip" aria-pressed={note.pinned} disabled={note.extract === 'working'} onClick={async () => p.setSt(await window.api.files.pin(id, note.id, !note.pinned))}>{note.extract === 'working' ? '读取中' : note.extract === 'failed' ? '读取失败，重试' : note.pinned ? '写作时参考 ✓' : '写作时参考'}</button>
          <button className="btn btn-ghost" aria-pressed={editing} onClick={() => { setEditing((x) => !x); setMode('original'); }}><Icon name="pen" size={14} />{editing ? '完成' : '编辑'}</button>
          <button className="btn btn-quiet" aria-label="切换 AI 对话" aria-pressed={dockOpen} onClick={toggleDock}><Icon name="chat" size={14} /></button><div className="note-more-wrap"><button className="btn btn-quiet" aria-label="更多笔记操作" aria-expanded={more} onClick={() => setMore((x) => !x)}>⋯</button>{more && <div className="note-more" role="menu">
          <button role="menuitem" onClick={() => { void update({ starred: !note.starred }); setMore(false); }}>{note.starred ? '取消固定' : '固定笔记'}</button>
          <label>移动到合集<select aria-label="移动到合集" value={note.group} onChange={(e) => { void update({ group: e.target.value }); setMore(false); }}><option>全部笔记</option>{collections.map((g) => <option key={g}>{g}</option>)}</select></label>
          <button role="menuitem" onClick={async () => { try { if (await window.api.files.exportNote(id, note.id)) toast('笔记已导出'); } catch (e) { toast(String(e)); } setMore(false); }}>导出笔记</button>
          <button role="menuitem" onClick={async () => { const e = await window.api.files.open(id, note.id); if (e) toast(e); setMore(false); }}>打开原文件</button>
          <button role="menuitem" onClick={async () => { if (confirm(`移除「${note.title || note.name}」？请先保存需要的内容。`)) await p.remove('files', note.id); setMore(false); }}>删除笔记</button>
          </div>}</div>
        </div>
<div className="page note-content"><div className="note-kicker muted"><Icon name="doc" size={14} />笔记 · {new Date(note.addedAt).toLocaleDateString('zh-CN')}</div>
        <input className="note-title" aria-label="笔记标题" key={`title:${note.title}`} defaultValue={note.title || note.name} onBlur={(e) => void update({ title: e.target.value })} />
        <div className="chipset">{note.tags.map((t) => <button className="chip" style={{ color: t.color, background: `color-mix(in srgb, ${t.color} 10%, transparent)` }} key={t.label} aria-label={`删除标签 ${t.label}`} onClick={() => void update({ tags: note.tags.filter((x) => x.label !== t.label) })}>{t.label} ×</button>)}
          {!addingTag ? <button className="chip" onClick={() => setAddingTag(true)}>◇ 添加标签</button> : <input autoFocus onBlur={() => setAddingTag(false)} className="input" aria-label="添加标签" placeholder="添加标签，回车保存" onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.currentTarget.value.trim()) { void update({ tags: [...note.tags.filter((t) => t.label !== e.currentTarget.value.trim()), { label: e.currentTarget.value.trim(), color: ['#ad7438', '#777777', '#608e53', '#496cc2'][note.tags.length % 4]! }] }); e.currentTarget.value = ''; setAddingTag(false); } }} />}
        </div>
        <label className="note-memo"><span className="muted">备注</span><textarea className="input" aria-label="笔记备注" key={`memo:${note.memo}`} placeholder="为这份资料加一点备注" defaultValue={note.memo} onBlur={(e) => void update({ memo: e.target.value })} /></label>
        {note.extract === 'failed' && <div className="err" role="alert">{note.extractError || '上次读取被中断，请重试。原文件仍保存在项目中。'}</div>}<div className="seg" role="tablist" aria-label="笔记内容"><button role="tab" aria-selected={mode === 'summary'} onClick={() => setMode('summary')}>摘要</button><button role="tab" aria-selected={mode === 'original'} onClick={() => setMode('original')}>原文</button></div>
        {mode === 'summary' ? <div className="note-body">{note.summary ? <Markdown text={note.summary} /> : note.extract === 'working' ? <div className="note-processing">正在读取资料…<p>完成后可生成摘要，切换页面不会中断读取。</p><div className="skeleton" /></div> : '暂无 AI 摘要。'}<div><button className="btn btn-quiet" disabled={summarizing || !note.excerpt.trim()} onClick={async () => { setSummarizing(true); try { p.setSt(await window.api.ai.summarizeNote(id, note.id)); } catch (e) { toast(String(e)); } finally { setSummarizing(false); } }}>{summarizing ? '生成中…' : '生成摘要'}</button></div></div> : <NoteBody projectId={id} fileId={note.id} version={note.extract} editable={editable && editing} onSaved={p.setSt} />}
        <select className="note-filter" aria-label="笔记合集" value={note.group} onChange={(e) => void update({ group: e.target.value })}><option>全部笔记</option>{collections.map((g) => <option key={g}>{g}</option>)}</select>
        <p className="muted" style={{ fontSize: 12 }}>修改自动保存 · 文件保存在这台电脑上</p>
      </div></div>}
    </section>{over && <div className="kb-over on">松开添加到知识库</div>}
  </div>;
}


function NoteBody({ projectId, fileId, version, editable, onSaved }: { projectId: string; fileId: string; version: string; editable: boolean; onSaved: (s: import('../../../shared/ipc.ts').ProjectState) => void }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState('');
  const toast = useToast();
  useEffect(() => { let live = true; setText(null); setError(''); void window.api.files.readBody(projectId, fileId).then((v) => { if (live) setText(v); }).catch((e) => { if (live) setError(String(e)); }); return () => { live = false; }; }, [projectId, fileId, version]);
  if (error) return <div className="err">{error}</div>;
  if (!editable) return <div className="note-body">{text === null ? '读取中…' : <Markdown text={text} />}</div>;
  return <textarea className="note-body" aria-label="笔记原文" value={text ?? ''} readOnly={!editable || text === null} placeholder={text === null ? '读取中…' : '写下你的笔记…'} onChange={(e) => setText(e.target.value)} onBlur={async () => { if (editable && text !== null) { try { onSaved(await window.api.files.saveBody(projectId, fileId, text)); } catch (e) { toast(String(e)); } } }} />;
}
