import { createPortal } from 'react-dom';
// Workspace (prototype P4): scenes outline · script page · AI panel. AI edits arrive as one undoable turn
// and are typed out on the page with the typewriter sound (spec 0002 §5.4, §9.4).
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScriptNode } from '@scripter/core/script';
import type { ActivityRow, AiWriteResult, ChatMsg, Edit, ExportFormat, KeyStatus, ProjectState, WorkflowId, WorkflowInput } from '../../../shared/ipc.ts';
import { RunCard, WF_MENU, WorkflowLauncher } from '../components/Workflows.tsx';
import { Activity } from '../components/Activity.tsx';
import { AssistantMessage, ChatHeader, Composer, EmptyChat, JumpPill, Thinking, UserBubble } from '../components/Chat.tsx';
import { SelectionBar } from '../components/SelectionBar.tsx';
import { ShotsView, shotInstruction } from '../components/Shots.tsx';
import type { Route } from '../App.tsx';
import { bell, carriageReturn, keyClick, onSound, setSound, soundOn } from '../lib/typewriter.ts';
import { Icon, useToast } from '../lib/ui.tsx';
import { Drawer } from '../components/Drawer.tsx';
import { ExportDialog } from '../components/ExportDialog.tsx';
import { Editor, placeCaret } from './Editor.tsx';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const visibleReply = (t: string) => t.split('<ops>')[0]!.trim();

export function Workspace({ id, pending, pendingWeb, pendingEpisode, keys, go, dockHost, pageContext }: { id: string; pending?: string; pendingWeb?: boolean; pendingEpisode?: string; keys: KeyStatus; go: (r: Route) => void; dockHost?: HTMLDivElement | null; pageContext?: { page: string; fileId?: string } }) {
  const [st, setSt] = useState<ProjectState | null>(null);
  const [nodes, setNodes] = useState<ScriptNode[]>([]);
  const [asking, setAsking] = useState<string | null>(null); // the user's message while its reply is in flight
  const [input, setInput] = useState('');
  const [web, setWeb] = useState(pendingWeb ?? false);
  const [externalBusy, setExternalBusy] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [stream, setStream] = useState('');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState<{ id: string; shown: number } | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [sound, setSoundState] = useState(soundOn());
  const [exportOpen, setExportOpen] = useState(false);
  const [episodeDialog, setEpisodeDialog] = useState<{ action: 'create' | 'rename'; id?: string; title: string } | null>(null);
  const [view, setView] = useState<'script' | 'outline' | 'shots' | 'episodes' | 'beats' | 'cover' | 'scenes'>('script');
  const [launcher, setLauncher] = useState<{ id: WorkflowId; focusId: string | null; focusText: string | null } | null>(null);
  const lastFocus = useRef<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const outlineTimer = useRef<number | undefined>(undefined);
  const outlineSent = useRef<string | null>(null);
  const [outlineKey, setOutlineKey] = useState(0);
  const toast = useToast();
  const sent = useRef(false);
  const feed = useRef<HTMLDivElement>(null);
  const stick = useRef(true); // follow the bottom only while the reader is there (Ancher use-conversation-scroll)
  const [unread, setUnread] = useState(0);
  const [awayFromBottom, setAway] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [ghost, setGhost] = useState(''); // Tab suggestion after a turn

  const apply = useCallback((s: ProjectState) => { setSt(s); setNodes(s.nodes); window.dispatchEvent(new CustomEvent('scripter:project', { detail: id })); }, [id]);
  useEffect(() => { void window.api.projects.open(id).then(apply); }, [id, apply]);
  useEffect(() => { void window.api.projects.open(id).then(apply); }, [id, pageContext?.page, pageContext?.fileId]);
  useEffect(() => window.api.files.onProjectChanged((e) => { if (e.projectId === id) void window.api.projects.open(id).then(apply); }), [id, apply]);
  useEffect(() => {
    let live = true; let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      const status = await window.api.ai.status(id);
      if (!live) return;
      setExternalBusy(status.busy);
      if (status.busy) timer = setTimeout(() => void check(), 700);
      else void window.api.projects.open(id).then(apply);
    };
    void check(); return () => { live = false; clearTimeout(timer); };
  }, [id, pageContext?.page, apply]);
  useEffect(() => { const h = (e: Event) => { if ((e as CustomEvent<string>).detail === id) void window.api.projects.open(id).then(apply); }; window.addEventListener('scripter:note', h); return () => window.removeEventListener('scripter:note', h); }, [id, apply]);
  useEffect(() => onSound(setSoundState), []);
  useEffect(() => window.api.ai.onDelta((d) => { if (d.reqId === running) setStream((s) => s + d.text); }), [running]);
  const [acts, setActs] = useState<ActivityRow[]>([]); // live agent activity for the running request
  useEffect(() => window.api.ai.onActivity((d) => { if (d.reqId === running) setActs(d.rows); }), [running]);
  const chatLen = st?.chat.length ?? 0;
  const prevLen = useRef(chatLen);
  useEffect(() => {
    const el = feed.current;
    if (!el) return;
    if (stick.current) el.scrollTop = el.scrollHeight;
    else if (chatLen > prevLen.current) setUnread((u) => u + (chatLen - prevLen.current));
    prevLen.current = chatLen;
  }, [chatLen, stream, asking, running, st?.runs, acts]);
  function onFeedScroll() {
    const el = feed.current!;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    stick.current = near;
    setAway(!near);
    if (near) setUnread(0);
  }
  function toLatest() {
    const el = feed.current!;
    el.scrollTo({ top: el.scrollHeight, behavior: reduced() ? 'auto' : 'smooth' });
    stick.current = true;
    setUnread(0);
  }
  // 加入队列: messages typed while a reply runs are sent one by one after it finishes.
  useEffect(() => {
    if (running || !queue.length) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    void send(next!);
  }, [running, queue]);
  // Remount the outline editor only when the outline changed from outside (e.g. 「写进大纲」), never while typing.
  useEffect(() => {
    if (st && st.outline !== outlineSent.current) { outlineSent.current = st.outline; setOutlineKey((k) => k + 1); }
  }, [st?.outline]);
  // Live workflow progress from main.
  useEffect(() => window.api.workflows.onUpdate(({ projectId, run }) => {
    if (projectId !== id) return;
    setSt((s) => (s ? { ...s, runs: s.runs.some((r) => r.id === run.id) ? s.runs.map((r) => (r.id === run.id ? run : r)) : [...s.runs, run] } : s));
  }), [id]);
  // ⌥1–⌥8 open a workflow (e.code, because Option+digit types a symbol on macOS). Only while this pane is visible.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const m = /^Digit([1-9])$/.exec(e.code);
      if (!e.altKey || e.metaKey || e.ctrlKey || !m || !root.current?.offsetParent) return;
      e.preventDefault();
      openWorkflow(WF_MENU[+m[1]! - 1]!.id);
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });

  const edit = useCallback(async (edits: Edit[]) => {
    const s = await window.api.projects.edit(id, edits);
    setSt(s); // node text stays local while typing; ids/types/order come back authoritative
    if (edits.every((e) => e.op === 'text')) return; // an older keystroke reply must not remove a newer optimistic split
    setNodes((live) => s.nodes.map((n) => ({ ...n, text: live.find((x) => x.id === n.id)?.text ?? n.text })));
  }, [id]);

  /** Reveal newly inserted nodes one by one, character by character. */
  async function typeOut(newIds: string[], all: ScriptNode[]) {
    if (reduced() || localStorage.getItem('script-typing') === 'false' || !newIds.length) { setFresh(new Set(newIds)); return; }
    setHidden(new Set(newIds));
    for (const nid of newIds) {
      const n = all.find((x) => x.id === nid);
      setHidden((h) => { const c = new Set(h); c.delete(nid); return c; });
      if (!n) continue;
      const step = Math.max(1, Math.ceil(n.text.length / 60)); // long paragraphs speed up so a turn never drags
      for (let i = 0; i <= n.text.length; i += step) {
        setTyping({ id: nid, shown: i });
        keyClick(n.text[i] ?? '');
        await new Promise((r) => setTimeout(r, 16));
      }
      setTyping(null);
      carriageReturn();
      await new Promise((r) => setTimeout(r, 60));
    }
    bell();
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t) return;
    if (externalBusy && !running) { toast('请等待当前任务完成'); return; }
    if (!keys.ancher) { toast('先到设置里填写 Ancher key'); return; }
    if (running) { setQueue((q) => [...q, t]); setInput(''); return; }
    stick.current = true;
    setGhost('');
    const reqId = crypto.randomUUID();
    setAsking(t);
    setInput('');
    setStream('');
    setActs([]);
    setRunning(reqId);
    const focusId = (document.activeElement as HTMLElement | null)?.dataset?.id;
    const before = new Set(nodes.map((n) => n.id));
    let r: AiWriteResult;
    try {
      r = await window.api.ai.write({ reqId, projectId: id, instruction: t, webSearch: web, focusId, pageContext });
    } catch (e) {
      r = { ok: false, narration: '', applied: 0, errors: [], citations: [], message: String(e) };
    }
    const s = await window.api.projects.open(id);
    setRunning(null);
    setStream('');
    setActs([]);
    setAsking(null);
    const newIds = s.nodes.filter((n) => !before.has(n.id)).map((n) => n.id);
    apply(s);
    if (r.ok && r.turn) void typeOut(newIds, s.nodes);
    if (r.ok && r.turn && s.outline !== st?.outline) toast('已写进大纲，点左侧「大纲」查看');
    if (!r.ok && !r.cancelled && r.message && !s.chat.length) toast(r.message);
    setGhost(suggestNext([...s.chat].reverse().find((m) => m.role === 'ai')?.text ?? '', s.chat.length));
  }

  useEffect(() => {
    if (!st || sent.current) return;
    if (pending) { sent.current = true; void send(pending); }
    else if (pendingEpisode !== undefined) { sent.current = true; void startWorkflow('episode', { text: pendingEpisode }); }
  }, [pending, pendingEpisode, st]);

  /** "+" menu and empty-chat tiles. */
  function onAction(a: Parameters<typeof EmptyChat>[0]['onAction'] extends (x: infer T) => void ? T : never) {
    if (a.kind === 'attach') void attach();
    else if (a.kind === 'video') { openWorkflow('transcribe'); return; }
    else if (a.kind === 'workflow') { openWorkflow(a.id); return; }
    else if (a.kind === 'web') { setWeb(true); setInput(a.text); }
    else if (a.kind === 'prefill') setInput(a.text);
    else if (a.kind === 'mention') setInput((v) => `${v}@`);
    requestAnimationFrame(() => document.getElementById('agent-in')?.focus());
  }

  /** + in the composer: add files to the knowledge base and turn on 写作时参考 for them. */
  async function attach() {
    const before = new Set(st?.bible.files.map((f) => f.id));
    const r = await window.api.files.pick(id);
    if (!r) return;
    let s = r.state;
    for (const f of s.bible.files.filter((x) => !before.has(x.id))) s = await window.api.files.pin(id, f.id, true);
    setSt(s);
    toast(r.added ? `已添加 ${r.added} 个参考文件，AI 写作时会参考` : '没有添加文件');
  }

  async function undo(turnId: string) {
    apply(await window.api.projects.undoTurn(id, turnId));
    toast('已撤销这一轮修改');
  }

  async function resolve(m: ChatMsg, accept: boolean) {
    const before = new Set(nodes.map((n) => n.id));
    const r = await window.api.ai.resolve(id, m.id, accept);
    apply(r.state);
    if (!r.ok) { toast(r.message ?? '没有写入'); return; }
    if (!accept) { toast('已拒绝，剧本没有改动'); return; }
    const changed = (m.preview?.items ?? []).flatMap((it) => ('id' in it ? [it.id] : []));
    setFresh(new Set(changed));
    void typeOut(r.state.nodes.filter((n) => !before.has(n.id)).map((n) => n.id), r.state.nodes);
  }

  function openWorkflow(wf: WorkflowId) {
    if (!keys.ancher) { toast('工作流需要 Ancher key，请到设置里填写'); return; }
    const w = WF_MENU.find((x) => x.id === wf)!;
    const focusId = lastFocus.current;
    const focusText = focusId ? nodes.find((n) => n.id === focusId)?.text ?? null : null;
    if (w.input === 'none') void startWorkflow(wf, {});
    else setLauncher({ id: wf, focusId, focusText });
  }

  async function startWorkflow(wf: WorkflowId, input: WorkflowInput) {
    setLauncher(null);
    const focusId = launcher?.focusId ?? lastFocus.current ?? undefined;
    setSt(await window.api.workflows.start(id, wf, { ...input, ...(focusId ? { focusId } : {}) }));
  }

  function jumpTo(nodeId: string) {
    setView('script');
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-id="${nodeId}"]`);
      el?.scrollIntoView({ block: 'center' });
      placeCaret(el, 'end');
    });
  }

  function onOutline(text: string) {
    window.clearTimeout(outlineTimer.current);
    outlineSent.current = text;
    void window.api.projects.setOutline(id, text).then((s) => setSt((x) => (x ? { ...x, outline: s.outline } : s)));
  }

  async function doExport(f: ExportFormat) {
    setExportOpen(false);
    const r = await window.api.exporter.save(id, f);
    if (r.ok) toast(`已导出到 ${r.path}`);
  }

  async function episode(action: 'create' | 'select' | 'rename', episodeId?: string, title?: string) {
    if (action !== 'select' && title === undefined) { setEpisodeDialog({ action, id: episodeId, title: action === 'create' ? `第 ${(st?.episodes.length ?? 0) + 1} 集` : st?.episodes.find((e) => e.id === episodeId)?.title ?? '' }); return; }
    try {
      const next = await window.api.projects.episode(id, action, episodeId, title);
      apply(next); setHidden(new Set()); setTyping(null); setFresh(new Set()); setOutlineKey((k) => k + 1); outlineSent.current = null; lastFocus.current = null; setEpisodeDialog(null);
      if (action !== 'rename') setView('script');
    } catch (e) { toast(String(e)); }
  }

  async function rename(title: string) {
    if (st && title.trim() && title !== st.meta.title) setSt(await window.api.projects.rename(id, title));
  }


  if (!st) return null;
  const shown = nodes
    .filter((n) => !hidden.has(n.id))
    .map((n) => (typing && n.id === typing.id ? { ...n, text: n.text.slice(0, typing.shown) } : n));

  const chatPanel = (
<section className="agent" aria-label="AI 编剧">
          <ChatHeader title={pageContext?.page && pageContext.page !== 'write' ? ({ characters: '关于这些角色', locations: '关于这些地点', props: '关于这些道具', world: '关于这个世界观', knowledge: '关于这条笔记', production: '关于这场制作' } as Record<string, string>)[pageContext.page]! : chatTitle(st.chat)} conversations={st.conversations} disabled={!!running || externalBusy}
            onNew={async () => { apply(await window.api.chat.newConversation(id)); setQueue([]); toast('已开始新对话'); }}
            onOpen={async (cid) => { apply(await window.api.chat.openConversation(id, cid)); stick.current = true; }}
            onSave={async () => { try { const r = await window.api.chat.saveAsNote(id, null); setSt(r.state); toast(`已存进知识库：${r.name}`); } catch (e) { toast(cleanErr(e)); } }} />
          <div className="ag-body">
            <div className="ag-feed" ref={feed} onScroll={onFeedScroll} aria-live="polite">
              {st.chat.length === 0 && !running && !asking && (!pageContext || pageContext.page === 'write') && <EmptyChat onAction={onAction} />}
              {st.chat.map((m) => {
                const undone = !!m.turnId && st.turns.find((t) => t.id === m.turnId)?.undone;
                const turnLine = m.turnId && (
                      <div className="turn-line">{undone ? <span>已撤销本轮 {m.applied ?? 0} 处修改</span>
                        : <><span className="tnum">本轮 {m.applied ?? 0} 处修改</span><span aria-hidden="true">·</span><button onClick={() => void undo(m.turnId!)}>撤销</button></>}</div>
                );
                const extras = (
                  <>
                    {m.runId && (() => { const run = st.runs.find((r) => r.id === m.runId); return run ? <RunCard run={run} projectId={id} onApplied={(s) => apply(s)} onJump={jumpTo} /> : null; })()}
                    {m.preview && <PreviewCard m={m} onResolve={(a) => void resolve(m, a)} />}
                    {m.citations && m.citations.length > 0 && (
                      <div className="chipset">{m.citations.slice(0, 5).map((c) => <a key={c.url} className="chip" href={c.url} target="_blank" rel="noreferrer">{c.title || new URL(c.url).hostname}</a>)}</div>
                    )}
                    {m.error && <div className="err" role="alert">{m.error}</div>}
                  </>
                );
                return m.role === 'user'
                  ? <UserBubble key={m.id} text={m.text} />
                  : <AssistantMessage key={m.id} m={m} onReact={async (r) => setSt(await window.api.chat.react(id, m.id, r))}
                      onSave={async () => { try { const r = await window.api.chat.saveAsNote(id, m.id); setSt(r.state); toast(`已存进知识库：${r.name}`); } catch (e) { toast(cleanErr(e)); } }} after={turnLine}>{extras}</AssistantMessage>;
              })}
              {asking && <UserBubble text={asking} />}
              {running && acts.length > 0 && <Activity folded={false} items={acts.map((r) => ({ ...r, state: r.running ? 'running' : 'done' }))} />}
              {running && <Thinking partial={visibleReply(stream)} />}
            </div>
            <JumpPill show={awayFromBottom || unread > 0} unread={unread} onClick={toLatest} />
          </div>
          {launcher && <div className="launcher-wrap"><WorkflowLauncher id={launcher.id} focusText={launcher.focusText} onStart={(input) => void startWorkflow(launcher.id, input)} onClose={() => setLauncher(null)} /></div>}
          {pageContext && pageContext.page !== 'write' && <div className="dock-context"><Icon name="doc" size={14} /><span>{pageContext.fileId ? (st.bible.files.find((f) => f.id === pageContext.fileId)?.title || st.bible.files.find((f) => f.id === pageContext.fileId)?.name || '当前笔记') : ({ characters: '角色表', locations: '地点表', props: '道具表', world: '世界观', production: '制作' } as Record<string, string>)[pageContext.page]}<small>当前页面参考</small></span></div>}
          <Composer value={input} onChange={(v) => { setInput(v); if (v) setGhost(''); }} onSend={() => void send(input)} onStop={() => { if (running) void window.api.ai.cancel(running); else if (externalBusy) toast('任务正在其他页面执行，请稍候'); }}
            running={!!running || externalBusy} queue={queue} onDequeue={(i) => setQueue((q) => q.filter((_, k) => k !== i))} ghost={ghost}
            web={web} onWeb={setWeb} onAction={onAction}
            mentions={[...st.bible.characters.map((c) => ({ label: c.name, kind: '角色' })), ...st.bible.locations.map((l) => ({ label: l.name, kind: '地点' })), ...st.bible.world.filter((w) => w.title).map((w) => ({ label: w.title, kind: '设定' })), ...st.bible.files.map((f) => ({ label: f.name, kind: '笔记' }))]} />
        </section>
  );

  const pageHeader = (
      <div className="topbar drag">
        <button className="btn btn-quiet no-drag" onClick={() => go({ name: 'home' })} aria-label="返回首页"><Icon name="home" size={15} /></button>
        <b>{view === 'outline' ? '大纲' : view === 'beats' ? '故事节拍' : view === 'episodes' ? '分集看板' : view === 'shots' ? '分镜' : view === 'scenes' ? '场景' : '剧本'}</b><span className="grow" /><div className="seg no-drag"><button aria-pressed={view === 'script'} onClick={() => setView('script')}><Icon name="doc" size={12} />剧本</button><button aria-pressed={view === 'cover'} onClick={() => setView('cover')}>封面</button></div><span className="grow" />
        <label className="toggle no-drag" title="打字机音效"><input aria-label="打字机音效" type="checkbox" checked={sound} onChange={(e) => { setSound(e.target.checked); setSoundState(e.target.checked); }} /><span>打字机音效</span></label>
        <button className="btn btn-quiet no-drag" aria-label="撤销最近一轮修改" title="撤销最近一轮生成或笔记信息修改" disabled={!st.turns.some((t) => !t.undone)} onClick={() => { const t = [...st.turns].reverse().find((t) => !t.undone); if (t) void undo(t.id); }}><Icon name="undo" size={14} /></button><button className="btn btn-quiet no-drag" aria-label="批注" onClick={async () => { const newId = crypto.randomUUID().replaceAll('-', ''); setView('script'); await edit([{ op: 'insert', after: lastFocus.current ?? 'end', type: 'note', text: '', id: newId }]); requestAnimationFrame(() => placeCaret(document.querySelector(`[data-id="${newId}"]`), 'end')); }}><Icon name="chat" size={14} /></button>
        <span className="no-drag" style={{ position: 'relative' }}>
          <button className="btn btn-ghost" aria-haspopup="dialog" aria-expanded={exportOpen} onClick={() => setExportOpen((o) => !o)}><Icon name="export" size={14} />导出</button>

        </span>
      </div>
  );

  return (
    <>
      <ExportDialog open={exportOpen} state={st} onClose={() => setExportOpen(false)} onDone={(path) => toast(`已导出到 ${path}`)} />
      <Drawer open={!!episodeDialog} title={episodeDialog?.action === 'rename' ? '重命名分集' : '新建一集'} cta="保存" modal onClose={() => setEpisodeDialog(null)} onSubmit={() => episodeDialog ? episode(episodeDialog.action, episodeDialog.id, episodeDialog.title) : undefined}><label>分集名称<input className="input" aria-label="分集名称" value={episodeDialog?.title ?? ''} onChange={(e) => setEpisodeDialog((x) => x ? { ...x, title: e.target.value } : x)} /></label></Drawer>
      <div className="ws" ref={root}>
        <aside className="outline" aria-label="场景">
          <div className="project-side-title"><input className="project-title-input" aria-label="剧本标题" defaultValue={st.meta.title} key={st.meta.title} onBlur={(e) => void rename(e.target.value)} /><button aria-label="新建一集" onClick={() => void episode('create')}><Icon name="plus" size={14} /></button></div>
          <button className="episode-board-link" onClick={() => setView('episodes')}><Icon name="book" size={14} />分集看板</button>
          {st.episodes.map((e, i) => <div className="episode-row" key={e.id}><button className="episode-label" aria-current={st.activeEpisodeId === e.id ? 'page' : undefined} onClick={() => void episode('select', e.id)}><small>第 {i + 1} 集</small><span>{e.title}</span></button><button className="episode-rename" aria-label={`重命名分集 ${e.title}`} onClick={() => void episode('rename', e.id)}>⋯</button></div>)}
          <div className="view-switch" role="tablist" aria-label="视图">
            <button role="tab" aria-current={view === 'outline'} aria-selected={view === 'outline'} onClick={() => setView('outline')}><Icon name="book" size={14} />大纲</button>
            <button role="tab" aria-current={view === 'script'} aria-selected={view === 'script'} onClick={() => setView('script')}><Icon name="doc" size={14} />剧本</button>
            <button role="tab" aria-current={view === 'shots'} aria-selected={view === 'shots'} onClick={() => { setView('shots'); void window.api.projects.open(id).then(apply); }}><Icon name="film" size={14} />分镜</button>
          </div>
          <button className="episode-board-link" onClick={() => setView('beats')}><Icon name="book" size={14} />故事节拍</button><button className="episode-board-link" onClick={() => setView('scenes')}><Icon name="map" size={14} />场景</button>
          {st.scenes.length === 0 ? <div className="muted" style={{ fontSize: 12, padding: '4px 8px' }}>写下第一个场景标题后会出现在这里</div>
            : st.scenes.map((s) => (
              <button key={s.nodeId} title={s.heading} onClick={() => jumpTo(s.nodeId)}>
                <span className="tnum muted">{s.index}.</span> {s.heading || '（未命名场景）'}
              </button>
            ))}
        </aside>
        <div className="writing-center">
        {pageHeader}
        <SelectionBar container={view === 'script' ? paperRef.current : null} />
        <div ref={paperRef} className="paper-scroll" onFocus={(e) => { const nid = (e.target as HTMLElement).dataset?.id; if (nid) lastFocus.current = nid; }}>
          {view === 'script' && <div className="script-toolbar" role="toolbar" aria-label="剧本格式">{([['heading','film','场景'], ['action','pen','动作'], ['character','user','角色'], ['parenthetical','indent','括号'], ['dialogue','chat','对白'], ['transition','export','转场'], ['shot','eye','镜头'], ['note','doc','注释'], ['subtitle','book','字幕']] as const).map(([type, icon, label]) => <button key={type} aria-label={`设为${label}`} onMouseDown={(e) => e.preventDefault()} onClick={async () => { const nodeId = lastFocus.current; if (nodeId && nodes.some((n) => n.id === nodeId)) { await edit([{ op: 'type', id: nodeId, type }]); placeCaret(document.querySelector(`[data-id="${nodeId}"]`), 'end'); } else { const newId = crypto.randomUUID().replaceAll('-', ''); await edit([{ op: 'insert', after: 'end', type, text: '', id: newId }]); requestAnimationFrame(() => placeCaret(document.querySelector(`[data-id="${newId}"]`), 'end')); } }}><Icon name={icon} size={14} /><span>{label}</span></button>)}</div>}
          {view === 'cover' ? <article className="paper script-cover"><h1>{st.meta.title}</h1><h2>{st.episodes.find((e) => e.id === st.activeEpisodeId)?.title}</h2>{([['author','作者'],['draft','稿次'],['date','日期']] as const).map(([field,label]) => <label key={field}>{label}<input className="input" aria-label={`封面${label}`} defaultValue={st.cover[field]} key={`${st.activeEpisodeId}:${field}`} onBlur={async (e) => setSt(await window.api.projects.setCover(id, { [field]: e.target.value }))} /></label>)}</article> : view === 'scenes' ? <div className="scene-board">{st.scenes.length ? st.scenes.map((s) => <button className="card" key={s.nodeId} onClick={() => jumpTo(s.nodeId)}><h3>{s.index}. {s.heading}</h3><p>{s.characters.join('、') || '暂无角色'} · {s.dialogueCount} 段对白</p></button>) : <div className="empty-state">写下场景标题后会出现在这里</div>}</div> : view === 'episodes' ? <div className="episode-board">{st.episodes.map((e, i) => <button className="card" key={e.id} onClick={() => void episode('select', e.id)}><small>第 {i + 1} 集</small><h2>{e.title}</h2><p>{e.scenes} 场 · {e.words} 字</p></button>)}<button className="card" onClick={() => void episode('create')}>＋ 新建一集</button></div> : view === 'script'
            ? <Editor nodes={shown} typingId={typing?.id ?? null} freshIds={fresh} edit={edit} setLocal={setNodes} />
            : view === 'shots'
              ? <ShotsView st={st} projectId={id} setSt={apply} busy={!!running} onAI={(sc) => void send(shotInstruction(sc))}
                  onAll={() => void send(`给全部 ${st.scenes.length} 场拆分镜：每场一个 setShots（sceneId 用场景标题的节点 id），景别有变化，一句话写清画面和动作。只写分镜，不要改剧本。`)}
                  onExport={() => void doExport('shots')} />
            : view === 'beats' ? <textarea className="outline-doc" aria-label="故事节拍" key={st.activeEpisodeId} defaultValue={st.beats} onChange={(e) => { const text = e.target.value; void window.api.projects.setBeats(id, text).then((s) => setSt((x) => x ? { ...x, beats: s.beats } : s)); }} placeholder="写下这一集的关键节拍…" /> : <textarea className="outline-doc" aria-label="大纲" key={outlineKey} defaultValue={st.outline} onChange={(e) => onOutline(e.target.value)}
                placeholder={'写下这一集的故事大纲：起、承、转、合，重场戏，人物动机。\n「写飘检查」会对照这里检查剧本有没有跑偏。'} />}
        </div>
        </div>
        {dockHost ? createPortal(chatPanel, dockHost) : chatPanel}
      </div>
    </>
  );
}

const TYPE_LABEL: Record<string, string> = { heading: '场景', action: '动作', character: '角色', parenthetical: '括号', dialogue: '对白', transition: '转场', shot: '镜头', note: '注释', subtitle: '字幕' };

/** Modification preview: what would change, accept or reject. Nothing touches the script until 接受. */
export function PreviewCard({ m, onResolve }: { m: ChatMsg; onResolve: (accept: boolean) => void }) {
  const pv = m.preview!;
  const label = { open: '', accepted: '已接受并写入', rejected: '已拒绝，剧本没有改动', stale: '剧本已变化，没有写入', failed: '写入失败，剧本没有改动' }[pv.state];
  return (
    <div className={`card preview${pv.state === 'open' ? '' : ' done'}`}>
      <div className="preview-hd"><Icon name="eye" size={13} /><b style={{ flex: 1 }}>修改预览 · {pv.items.length} 处</b>{label && <span className="muted">{label}</span>}</div>
      <div className="preview-list">
        {pv.items.map((it, i) => (
          <div key={i} className="pv-it">
            <span className="pv-tag">{it.kind === 'insert' ? '新增' : it.kind === 'update' ? '改写' : it.kind === 'delete' ? '删除' : it.kind === 'retype' ? '改格式' : it.kind === 'outline' ? '大纲' : '设定'}</span>
            {it.kind === 'update' && <span><del>{it.before}</del><ins>{it.after}</ins></span>}
            {it.kind === 'delete' && <del>{it.before}</del>}
            {it.kind === 'insert' && <ins><span className="muted">{TYPE_LABEL[it.type] ?? it.type} · </span>{it.text}</ins>}
            {it.kind === 'retype' && <span>{it.text}<span className="muted">（{TYPE_LABEL[it.from]} → {TYPE_LABEL[it.to]}）</span></span>}
            {it.kind === 'bible' && <span><span className="muted">{it.text}</span>{it.after && <ins style={{ whiteSpace: 'pre-wrap', display: 'block' }}>{it.after}</ins>}</span>}
            {it.kind === 'outline' && (it.mode === 'append'
              ? <ins><span className="muted">大纲 · </span>{it.after}</ins>
              : <span>{it.before && <del>{it.before}</del>}<ins><span className="muted">大纲 · </span>{it.after}</ins></span>)}
          </div>
        ))}
      </div>
      {pv.state === 'open' && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" style={{ height: 30 }} onClick={() => onResolve(false)}>拒绝</button>
          <button className="btn btn-primary" style={{ height: 30 }} onClick={() => onResolve(true)}><Icon name="check" size={13} />接受</button>
        </div>
      )}
    </div>
  );
}

const chatTitle = (chat: ChatMsg[]) => {
  const first = chat.find((m) => m.role === 'user')?.text.replace(/\s+/g, ' ').trim() ?? '';
  return first ? (first.length > 24 ? `${first.slice(0, 24)}…` : first) : '新对话';
};
const cleanErr = (e: unknown) => String((e as Error)?.message ?? e).replace(/^Error invoking remote method '[^']+': Error: /, '');

/**
 * Tab suggestion after a turn. When the reply ends by offering a next step ("要我接着写「三、命运的分岔」吗？"),
 * suggest accepting it; otherwise rotate through a few safe next steps.
 */
function suggestNext(reply: string, n: number): string {
  const tail = reply.trim().slice(-160);
  const m = /(?:要不要我|要我|需要我|要不要|我可以)([^。！？?\n]{2,40}?)[吗呢吧]?[？?]\s*$/.exec(tail);
  if (m) return `好，${m[1]!.trim()}`;
  const fallback = ['续写下一场', '把这一场的对白改得更像孩子说话', '检查人物一致性'];
  return fallback[n % fallback.length]!;
}
