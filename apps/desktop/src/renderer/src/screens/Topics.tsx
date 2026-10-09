import { useCallback, useEffect, useRef, useState } from 'react';
import type { Topic } from '@scripter/core/script';
import type { AncherLibrary } from '@scripter/agent';
import { PageHead, Tabs } from '../components/Drawer.tsx';
import { TopicDialog, TopicMenu, type TopicAction } from '../components/TopicActions.tsx';
import { useProject } from '../lib/project.ts';
import { addNoteToChat } from '../lib/note-chat.ts';
import { downloadTopics, topicAge, topicFilename, topicMarkdown, TOPIC_STATUS as STATUS } from '../lib/topics.ts';
import { Icon, useToast } from '../lib/ui.tsx';

type Filter = 'all' | Topic['status'];
type View = 'grid' | 'list';
type Sort = 'newest' | 'oldest' | 'alpha';
type Dialog = { kind: 'info' | 'share' | 'collection' | 'delete'; ids: string[] };
function stored(key: string, fallback: string) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }

export function Topics({ id }: { id: string }) {
  const p = useProject(id); const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>(() => stored('topics-view', 'grid') === 'list' ? 'list' : 'grid');
  const [sort, setSort] = useState<Sort>(() => { const v = stored('topics-sort', 'newest'); return v === 'oldest' || v === 'alpha' ? v : 'newest'; });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [controls, setControls] = useState(false);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [reason, setReason] = useState('');
  const [collections, setCollections] = useState<AncherLibrary['collections']>([]);
  const [collectionId, setCollectionId] = useState('');
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const controlRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  useEffect(() => { if (!controls) return; const close = (e: PointerEvent) => { if (!controlRef.current?.contains(e.target as Node)) setControls(false); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, [controls]);
  const topics = p.st?.bible.topics ?? [];
  const selectedTopics = topics.filter((t) => selected.includes(t.id));
  const dialogTopics = topics.filter((t) => dialog?.ids.includes(t.id));
  const current = dialogTopics[0]; const menuTopic = topics.find((t) => t.id === menu?.id);
  const visible = topics.filter((t) => (filter === 'all' || t.status === filter) && `${t.title} ${t.logline} ${t.why}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a, b) => sort === 'alpha' ? a.title.localeCompare(b.title, 'zh-CN') : sort === 'oldest' ? a.addedAt - b.addedAt : b.addedAt - a.addedAt);
  useEffect(() => {
    if (view !== 'grid' || !gridRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        el.style.gridRowEnd = `span ${Math.ceil((el.getBoundingClientRect().height + 12) / 4)}`;
      }
    });
    for (const item of gridRef.current.children) observer.observe(item);
    return () => observer.disconnect();
  }, [view, p.st, filter, search, sort]);
  function preference(key: string, value: string) { try { localStorage.setItem(key, value); } catch {} }
  function chooseView(value: View) { setView(value); preference('topics-view', value); }
  function show(kind: Dialog['kind'], items: Topic[]) { setError(''); setReason(items[0]?.reason ?? ''); setDialog({ kind, ids: items.map((t) => t.id) }); }
  async function run(action: () => Promise<void>) {
    if (busy) return; setBusy(true); setError('');
    try { await action(); } catch (e) { const message = e instanceof Error ? e.message : String(e); setError(message); toast(message); } finally { setBusy(false); }
  }
  async function update(t: Topic, patch: Partial<Topic>) { await p.update('topics', t.id, patch); if (patch.reason !== undefined) setReason(patch.reason); }
  function attach(items: Topic[]) {
    if (items.length > 10) { toast('每条消息最多添加 10 条参考，请减少选择'); return; }
    const accepted = items.filter((t) => addNoteToChat(id, { source: 'topic', id: t.id, title: t.title })).length;
    setDialog(null); toast(accepted === items.length ? '已添加到对话，输入你的问题后发送' : `已添加 ${accepted} 项参考，每条消息最多添加 10 条`);
  }
  async function save(items: Topic[], targetCollection?: string) {
    // Remove successful items from the pending dialog so retry never duplicates them.
    const warnings: string[] = [];
    for (const t of items) {
      const result = await window.api.ancherNotes.create({ text: topicMarkdown(t), ...(targetCollection ? { collectionId: targetCollection } : {}) });
      setDialog((d) => d ? { ...d, ids: d.ids.filter((itemId) => itemId !== t.id) } : null);
      if (result.warning) warnings.push(result.warning);
    }
    setDialog(null); toast(warnings.length ? warnings.join('；') : targetCollection ? '选题已保存为笔记并添加到合集' : '选题已保存到 Ancher 笔记');
  }
  function action(t: Topic, value: TopicAction) {
    if (value === 'chat') attach([t]);
    else if (value === 'download') downloadTopics([t]);
    else if (value === 'save') void run(() => save([t]));
    else if (value === 'like' || value === 'dislike') void run(() => update(t, { reaction: t.reaction === value ? null : value }));
    else if (value === 'collection') {
      show('collection', [t]); setCollectionId(''); setLoadingCollections(true);
      void window.api.ancherNotes.list().then((library) => setCollections(library.collections)).catch((e) => setError(String(e))).finally(() => setLoadingCollections(false));
    } else show(value, [t]);
  }
  function toggle(itemId: string) { setSelected((s) => s.includes(itemId) ? s.filter((v) => v !== itemId) : [...s, itemId]); }
  if (!p.st) return null;
  return <>
    <PageHead title="选题池" count={topics.length} />
    <section className="page topics-page" aria-label="选题池" aria-busy={busy}>
      <div className="topics-toolbar">
        <p className="muted">收集灵感，选出值得展开的故事。</p>
        <div className="topics-tools"><label className="topics-search"><Icon name="search" size={14} /><input aria-label="搜索选题" placeholder="搜索选题" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
          <Tabs label="选题状态" value={filter} onChange={setFilter} options={ [['all', '全部'], ['idea', '待定'], ['picked', '已选'], ['dropped', '已否']] } />
          <div className="topics-controls" ref={controlRef} onKeyDown={(e) => { if (e.key === 'Escape') { setControls(false); controlRef.current?.querySelector<HTMLButtonElement>('button')?.focus(); } }}>
            <button className="btn btn-quiet btn-icon" title="显示与排序" aria-label="显示与排序" aria-expanded={controls} onClick={() => setControls(!controls)}><Icon name="filter" size={17} /></button>
            {controls && <div className="topics-controls-pop"><span>视图</span><Tabs label="选题视图" value={view} onChange={chooseView} options={ [['grid', '卡片'], ['list', '列表']] } /><label>排序<select aria-label="选题排序" value={sort} onChange={(e) => { const value = e.target.value as Sort; setSort(value); preference('topics-sort', value); }}><option value="newest">最新创建</option><option value="oldest">最早创建</option><option value="alpha">名称排序</option></select></label></div>}
          </div>
          <div className="topics-view" role="group" aria-label="切换选题视图"><button className="btn btn-quiet btn-icon" aria-label="卡片视图" aria-pressed={view === 'grid'} onClick={() => chooseView('grid')}><Icon name="grid" /></button><button className="btn btn-quiet btn-icon" aria-label="列表视图" aria-pressed={view === 'list'} onClick={() => chooseView('list')}><Icon name="menu" /></button></div>
        </div>
      </div>
      {error && !dialog && <p className="err" role="alert">{error}</p>}
      {selectedTopics.length > 0 && <div className="topics-selection" aria-label="批量选题操作"><span>已选 {selectedTopics.length} 项</span><button className="btn btn-quiet" onClick={() => setSelected(visible.every((t) => selected.includes(t.id)) ? [] : visible.map((t) => t.id))}>全选当前结果</button><button className="btn btn-quiet" disabled={busy} onClick={() => attach(selectedTopics)}><Icon name="chat" size={14} />添加到对话</button><button className="btn btn-quiet" onClick={() => downloadTopics(selectedTopics)}><Icon name="arrowDown" size={14} />下载</button><button className="btn btn-quiet danger" disabled={busy} onClick={() => show('delete', selectedTopics)}><Icon name="trash" size={14} />删除</button><button className="btn btn-quiet" onClick={() => setSelected([])}>取消选择</button></div>}
      {visible.length ? <div ref={gridRef} className={view === 'grid' ? 'topics-grid' : 'topics-list'} aria-label={view === 'grid' ? '选题卡片' : '选题列表'}>
        {visible.map((t) => <article key={t.id} className={`topic-item ${view === 'grid' ? 'topic-card' : 'topic-row'}${selected.includes(t.id) ? ' selected' : ''}`} aria-label={t.title} onContextMenu={(e) => { e.preventDefault(); if (!busy) setMenu({ id: t.id, x: e.clientX, y: e.clientY }); }}>
          <button className="topic-open" aria-label={`查看选题 ${t.title}`} onClick={() => selectedTopics.length ? toggle(t.id) : show('info', [t])} onKeyDown={(e) => { if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { e.preventDefault(); const rect = e.currentTarget.getBoundingClientRect(); setMenu({ id: t.id, x: rect.right - 200, y: rect.top + 32 }); } }}>
            {view === 'list' && <span className="topic-thumbnail"><Icon name="doc" size={20} /></span>}
            <div className="topic-copy"><h2>{t.title || '未命名选题'}</h2>{view === 'grid' ? <p className="topic-logline">{t.logline || '暂无故事简介'}</p> : <p className="topic-file-meta">{(new TextEncoder().encode(topicMarkdown(t)).length / 1024).toFixed(1)} KB · {topicFilename(t)}</p>}
              {view === 'grid' && <footer><time dateTime={t.addedAt ? new Date(t.addedAt).toISOString() : undefined} title={t.addedAt ? new Date(t.addedAt).toLocaleString('zh-CN') : undefined}>{topicAge(t.addedAt)}</time><span className="topic-status" data-status={t.status}>{STATUS[t.status]}</span>{t.reaction && <Icon name={t.reaction === 'like' ? 'thumbUp' : 'thumbDown'} size={13} />}</footer>}
            </div>
          </button>
          <div className="topic-hover-actions"><button className="btn btn-quiet btn-icon" aria-label={`添加 ${t.title} 到对话`} title="添加到对话" disabled={busy} onClick={() => attach([t])}><Icon name="chat" size={15} /></button><button className="btn btn-quiet btn-icon" aria-label={`${t.title} 的更多操作`} title="更多操作" aria-haspopup="menu" disabled={busy} onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setMenu({ id: t.id, x: rect.right - 200, y: rect.bottom + 4 }); }}><Icon name="more" size={17} /></button></div>
          {view === 'list' && <span className="topic-status" data-status={t.status}>{STATUS[t.status]}</span>}
          <input className="topic-select" type="checkbox" aria-label={`选择选题 ${t.title}`} checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />
        </article>)}
      </div> : <div className="topics-empty"><Icon name="bulb" size={32} /><h2>{search ? '没有匹配的选题' : topics.length && filter !== 'all' ? `还没有${STATUS[filter]}选题` : '还没有选题'}</h2><p>{search ? '试试其他关键词，或清除筛选。' : topics.length ? '可以切换到其他状态查看。' : '在 AI 对话中使用「今日热点选题」，把喜欢的故事加入这里。'}</p>{(search || filter !== 'all') && <button className="btn btn-ghost" onClick={() => { setSearch(''); setFilter('all'); }}>清除筛选</button>}</div>}
    </section>
    {menu && menuTopic && <TopicMenu topic={menuTopic} x={menu.x} y={menu.y} onClose={closeMenu} onAction={(value) => action(menuTopic, value)} />}
    {dialog && <TopicDialog title={dialog.kind === 'info' ? current?.title || '选题信息' : dialog.kind === 'share' ? '分享选题' : dialog.kind === 'collection' ? '添加到合集' : '删除选题'} busy={busy} onClose={() => setDialog(null)}>
      <div className="topic-dialog-body">
        {dialog.kind === 'info' && current && <><div className="topic-detail-meta"><span className="chip topic-status" data-status={current.status}>{STATUS[current.status]}</span><span>{topicAge(current.addedAt)} · Markdown</span></div><p className="topic-detail-logline">{current.logline}</p>{current.why && <div className="topic-rationale"><span>推荐理由</span><p>{current.why}</p></div>}{current.reason && <p className="topic-reason">否掉的原因：{current.reason}</p>}{current.source && <div className="topic-sources"><h3>来源</h3>{current.source.split(/\s+/).filter(Boolean).map((url, i) => /^https?:\/\//i.test(url) ? <a key={i} href={url} target="_blank" rel="noreferrer">{url}</a> : <span key={i}>{url}</span>)}</div>}<dl className="topic-info"><dt>文件</dt><dd>{topicFilename(current)}</dd><dt>创建时间</dt><dd>{current.addedAt ? new Date(current.addedAt).toLocaleString('zh-CN') : '未记录'}</dd><dt>大小</dt><dd>{new TextEncoder().encode(topicMarkdown(current)).length} 字节</dd></dl><div className="topic-decision">{current.status !== 'picked' && <button className="btn btn-ghost" disabled={busy} onClick={() => void run(() => update(current, { status: 'picked' }))}><Icon name="check" size={14} />选这个</button>}{current.status !== 'idea' && <button className="btn btn-quiet" disabled={busy} onClick={() => void run(() => update(current, { status: 'idea', reason: '' }))}>恢复待定</button>}</div>{current.status !== 'dropped' && <form className="topic-reject" onSubmit={(e) => { e.preventDefault(); void run(() => update(current, { status: 'dropped', reason: reason.trim() })); }}><input className="input" aria-label="否掉的原因" placeholder="否掉的原因（选填）" value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)} /><button className="btn btn-quiet" disabled={busy}>否掉</button></form>}</>}
        {dialog.kind === 'share' && current && <><p className="muted">复制选题内容，分享给你的协作者。</p><textarea className="input topic-share-content" aria-label="分享内容" readOnly value={topicMarkdown(current)} /></>}
        {dialog.kind === 'collection' && <><p>将「{current?.title}」保存为 Ancher 笔记，并添加到所选合集。</p><label className="field">合集<select className="input" aria-label="选择合集" value={collectionId} disabled={loadingCollections || busy} onChange={(e) => setCollectionId(e.target.value)}><option value="">{loadingCollections ? '正在加载合集…' : '请选择合集'}</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{!loadingCollections && !collections.length && !error && <p className="muted">还没有合集，请先在 Ancher 知识库中创建。</p>}</>}
        {dialog.kind === 'delete' && <p>删除这 {dialogTopics.length} 个选题？此操作无法撤销，已保存的笔记会保留。</p>}
        {error && <p className="err" role="alert">{error}</p>}
      </div>
      <footer className="topic-dialog-footer">
        {dialog.kind === 'info' && current ? <><button className="btn btn-quiet" disabled={busy} onClick={() => action(current, 'save')}><Icon name="doc" size={14} />保存为笔记</button><button className="btn btn-quiet" onClick={() => downloadTopics([current])}><Icon name="arrowDown" size={14} />下载</button><button className="btn btn-primary" disabled={busy} onClick={() => attach([current])}><Icon name="chat" size={14} />添加到对话</button></> : <><button className="btn btn-quiet" disabled={busy} onClick={() => setDialog(null)}>取消</button>{dialog.kind === 'share' && current && <button className="btn btn-primary" disabled={busy} onClick={() => void run(async () => { await navigator.clipboard.writeText(topicMarkdown(current)); toast('选题内容已复制'); setDialog(null); })}><Icon name="copy" size={14} />复制内容</button>}{dialog.kind === 'collection' && <button className="btn btn-primary" disabled={busy || !collectionId || loadingCollections || !dialogTopics.length} onClick={() => void run(() => save(dialogTopics, collectionId))}>{busy ? '保存中…' : '添加到合集'}</button>}{dialog.kind === 'delete' && <button className="btn topic-delete-confirm" disabled={busy || !dialogTopics.length} onClick={() => void run(async () => { for (const t of dialogTopics) { await p.remove('topics', t.id); setDialog((d) => d ? { ...d, ids: d.ids.filter((itemId) => itemId !== t.id) } : null); setSelected((s) => s.filter((itemId) => itemId !== t.id)); } setDialog(null); toast('选题已删除'); })}>{busy ? '删除中…' : '确认删除'}</button>}</>}
      </footer>
    </TopicDialog>}
  </>;
}
