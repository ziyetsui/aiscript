// Workspace (prototype P4): scenes outline · script page · AI panel. AI edits arrive as one undoable turn
// and are typed out on the page with the typewriter sound (spec 0002 §5.4, §9.4).
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { ScriptNode } from '@scripter/core/script';
import type { AiWriteResult, ChatMsg, Edit, ExportFormat, KeyStatus, ProjectState, WorkflowId, WorkflowInput } from '../../../shared/ipc.ts';
import { RunCard, WF_MENU, WorkflowLauncher, WorkflowMenu } from '../components/Workflows.tsx';
import { SelectionBar } from '../components/SelectionBar.tsx';
import type { Route } from '../App.tsx';
import { bell, carriageReturn, keyClick, setSound, soundOn } from '../lib/typewriter.ts';
import { Icon, useToast } from '../lib/ui.tsx';
import { Editor, placeCaret } from './Editor.tsx';

const QUICK = ['润色对白', '续写下一场', '检查人物一致性', '润色格式', '总结大纲'];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const visibleReply = (t: string) => t.split('<ops>')[0]!.trim();

export function Workspace({ id, pending, pendingEpisode, keys, go }: { id: string; pending?: string; pendingEpisode?: string; keys: KeyStatus; go: (r: Route) => void }) {
  const [st, setSt] = useState<ProjectState | null>(null);
  const [nodes, setNodes] = useState<ScriptNode[]>([]);
  const [asking, setAsking] = useState<string | null>(null); // the user's message while its reply is in flight
  const [input, setInput] = useState('');
  const [web, setWeb] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [stream, setStream] = useState('');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState<{ id: string; shown: number } | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [sound, setSoundState] = useState(soundOn());
  const [exportOpen, setExportOpen] = useState(false);
  const [view, setView] = useState<'script' | 'outline'>('script');
  const [launcher, setLauncher] = useState<{ id: WorkflowId; focusId: string | null; focusText: string | null } | null>(null);
  const lastFocus = useRef<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const outlineTimer = useRef<number | undefined>(undefined);
  const outlineSent = useRef<string | null>(null);
  const [outlineKey, setOutlineKey] = useState(0);
  const toast = useToast();
  const sent = useRef(false);
  const logEnd = useRef<HTMLDivElement>(null);

  const apply = useCallback((s: ProjectState) => { setSt(s); setNodes(s.nodes); }, []);
  useEffect(() => { void window.api.projects.open(id).then(apply); }, [id, apply]);
  useEffect(() => window.api.ai.onDelta((d) => { if (d.reqId === running) setStream((s) => s + d.text); }), [running]);
  useEffect(() => { logEnd.current?.scrollIntoView({ block: 'end' }); }, [st?.chat.length, stream, asking]);
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
  }, [id]);

  /** Reveal newly inserted nodes one by one, character by character. */
  async function typeOut(newIds: string[], all: ScriptNode[]) {
    if (reduced() || !newIds.length) { setFresh(new Set(newIds)); return; }
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
    if (!t || running) return;
    if (!keys.ancher) { toast('先到设置里填写 Ancher key'); return; }
    const reqId = crypto.randomUUID();
    setAsking(t);
    setInput('');
    setStream('');
    setRunning(reqId);
    const focusId = (document.activeElement as HTMLElement | null)?.dataset?.id;
    const before = new Set(nodes.map((n) => n.id));
    let r: AiWriteResult;
    try {
      r = await window.api.ai.write({ reqId, projectId: id, instruction: t, webSearch: web, focusId });
    } catch (e) {
      r = { ok: false, narration: '', applied: 0, errors: [], citations: [], message: String(e) };
    }
    const s = await window.api.projects.open(id);
    setRunning(null);
    setStream('');
    setAsking(null);
    const newIds = s.nodes.filter((n) => !before.has(n.id)).map((n) => n.id);
    apply(s);
    if (r.ok && r.turn) void typeOut(newIds, s.nodes);
    if (!r.ok && !r.cancelled && r.message && !s.chat.length) toast(r.message);
  }

  useEffect(() => {
    if (!st || sent.current) return;
    if (pending) { sent.current = true; void send(pending); }
    else if (pendingEpisode !== undefined) { sent.current = true; void startWorkflow('episode', { text: pendingEpisode }); }
  }, [pending, pendingEpisode, st]);

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
    outlineTimer.current = window.setTimeout(() => { void window.api.projects.setOutline(id, text).then((s) => setSt((x) => (x ? { ...x, outline: s.outline } : s))); }, 400);
  }

  async function doExport(f: ExportFormat) {
    setExportOpen(false);
    const r = await window.api.exporter.save(id, f);
    if (r.ok) toast(`已导出到 ${r.path}`);
  }

  async function rename(title: string) {
    if (st && title.trim() && title !== st.meta.title) setSt(await window.api.projects.rename(id, title));
  }

  function submit(e: FormEvent) { e.preventDefault(); void send(input); }

  if (!st) return null;
  const shown = nodes
    .filter((n) => !hidden.has(n.id))
    .map((n) => (typing && n.id === typing.id ? { ...n, text: n.text.slice(0, typing.shown) } : n));

  return (
    <>
      <div className="topbar drag">
        <button className="btn btn-quiet no-drag" onClick={() => go({ name: 'home' })} aria-label="返回首页"><Icon name="home" size={15} /></button>
        <input className="no-drag" defaultValue={st.meta.title} key={st.meta.title} onBlur={(e) => void rename(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          aria-label="剧本标题" style={{ border: 0, background: 'transparent', fontWeight: 600, fontSize: 15, outline: 'none', minWidth: 120 }} />
        <span className="muted tnum" style={{ fontSize: 12 }}>{st.scenes.length} 场 · {st.meta.words} 字</span>
        <span style={{ flex: 1 }} />
        <label className="toggle no-drag" title="打字机音效"><input type="checkbox" checked={sound} onChange={(e) => { setSound(e.target.checked); setSoundState(e.target.checked); }} />打字机音效</label>
        <span className="no-drag" style={{ position: 'relative' }}>
          <button className="btn btn-ghost" aria-haspopup="menu" aria-expanded={exportOpen} onClick={() => setExportOpen((o) => !o)}><Icon name="export" size={14} />导出</button>
          {exportOpen && (
            <div className="card menu" role="menu" style={{ right: 0, top: 'calc(100% + 6px)', transformOrigin: 'top right' }} onMouseLeave={() => setExportOpen(false)}>
              {([['pdf', 'PDF', '发给导演、打印'], ['docx', 'Word（.docx）', '继续编辑、走审批'], ['fdx', 'Final Draft（.fdx）', '行业标准格式'], ['fountain', 'Fountain', '纯文本剧本标准'], ['txt', 'TXT', '纯文本']] as const).map(([f, t, d]) => (
                <button key={f} role="menuitem" onClick={() => void doExport(f)}><span><b>{t}</b><br /><span className="muted" style={{ fontSize: 12 }}>{d}</span></span></button>
              ))}
              <div style={{ height: 1, background: 'var(--line)', margin: '4px 6px' }} />
              <button role="menuitem" onClick={async () => { setExportOpen(false); const r = await window.api.projects.exportArchive(id); if (r.ok) toast(`已导出整个项目到 ${r.path}`); }}>
                <span><b>整个项目（.scripter）</b><br /><span className="muted" style={{ fontSize: 12 }}>含设定、规则库、知识库和对话，换电脑时用</span></span></button>
            </div>
          )}
        </span>
      </div>
      <div className="ws" ref={root}>
        <aside className="outline" aria-label="场景">
          <div className="view-switch" role="tablist" aria-label="视图">
            <button role="tab" aria-current={view === 'script'} aria-selected={view === 'script'} onClick={() => setView('script')}><Icon name="doc" size={14} />剧本</button>
            <button role="tab" aria-current={view === 'outline'} aria-selected={view === 'outline'} onClick={() => setView('outline')}><Icon name="book" size={14} />大纲</button>
          </div>
          <div className="eyebrow">场景</div>
          {st.scenes.length === 0 ? <div className="muted" style={{ fontSize: 12, padding: '4px 8px' }}>写下第一个场景标题后会出现在这里</div>
            : st.scenes.map((s) => (
              <button key={s.nodeId} title={s.heading} onClick={() => jumpTo(s.nodeId)}>
                <span className="tnum muted">{s.index}.</span> {s.heading || '（未命名场景）'}
              </button>
            ))}
        </aside>
        <SelectionBar container={view === 'script' ? paperRef.current : null} />
        <div ref={paperRef} className="paper-scroll" onFocus={(e) => { const nid = (e.target as HTMLElement).dataset?.id; if (nid) lastFocus.current = nid; }}>
          {view === 'script'
            ? <Editor nodes={shown} typingId={typing?.id ?? null} freshIds={fresh} edit={edit} setLocal={setNodes} />
            : <textarea className="outline-doc" aria-label="大纲" key={outlineKey} defaultValue={st.outline} onChange={(e) => onOutline(e.target.value)}
                placeholder={'写下这一集的故事大纲：起、承、转、合，重场戏，人物动机。\n「写飘检查」会对照这里检查剧本有没有跑偏。'} />}
        </div>
        <section className="agent" aria-label="AI 编剧">
          <div className="topbar" style={{ height: 44 }}><b style={{ fontSize: 13.5 }}>AI 编剧</b><span style={{ flex: 1 }} /><span className="chip">{keys.ancher ? 'Ancher' : '未连接'}</span></div>
          <div className="agent-log" aria-live="polite">
            {st.chat.length === 0 && !running && (
              <div className="muted" style={{ fontSize: 13 }}>说说你想写什么。AI 会直接写进剧本，每一轮都可以单独撤销。</div>
            )}
            {st.chat.map((m) => {
              const undone = !!m.turnId && st.turns.find((t) => t.id === m.turnId)?.undone;
              return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {m.text && <div className={`msg ${m.role}`}>{m.text}</div>}
                {m.runId && (() => { const run = st.runs.find((r) => r.id === m.runId); return run ? <RunCard run={run} projectId={id} onApplied={(s) => apply(s)} onJump={jumpTo} /> : null; })()}
                {m.preview && <PreviewCard m={m} onResolve={(a) => void resolve(m, a)} />}
                {m.turnId && (
                  <div className="turn-card"><Icon name="pen" size={13} /><span style={{ flex: 1 }}>{undone ? '已撤销' : `写入 ${m.applied ?? 0} 处修改`}</span>
                    {!undone && <button className="btn btn-quiet" style={{ height: 26 }} onClick={() => void undo(m.turnId!)}><Icon name="undo" size={13} />撤销</button>}</div>
                )}
                {m.citations && m.citations.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{m.citations.slice(0, 5).map((c) => <a key={c.url} className="chip" href={c.url} target="_blank" rel="noreferrer">{c.title || new URL(c.url).hostname}</a>)}</div>
                )}
                {m.error && <div className="err" role="alert">{m.error}</div>}
              </div>
              );
            })}
            {asking && <div className="msg user">{asking}</div>}
            {running && <div className="msg ai muted"><span className="spinner" style={{ display: 'inline-block', verticalAlign: -2, marginRight: 6 }} />{visibleReply(stream) || '正在思考…'}</div>}
            <div ref={logEnd} />
          </div>
          <div className="composer">
            {launcher && <WorkflowLauncher id={launcher.id} focusText={launcher.focusText} onStart={(input) => void startWorkflow(launcher.id, input)} onClose={() => setLauncher(null)} />}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <WorkflowMenu onPick={openWorkflow} disabled={!!running} />
              {QUICK.map((q) => <button key={q} className="chip" disabled={!!running} onClick={() => void send(q)}>{q}</button>)}
            </div>
            <form className="card box" onSubmit={submit}>
              <label htmlFor="agent-in" className="sr-only">给 AI 的指令</label>
              <textarea id="agent-in" value={input} onChange={(e) => setInput(e.target.value)} placeholder="比如：写第一场，豆豆发现门墩儿会说话"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(input); } }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label className="toggle"><input type="checkbox" checked={web} onChange={(e) => setWeb(e.target.checked)} />联网搜索</label>
                <span style={{ flex: 1 }} />
                {running ? (
                  <button type="button" className="btn btn-ghost" onClick={() => void window.api.ai.cancel(running)}><Icon name="stop" size={13} />停止</button>
                ) : (
                  <button className="btn btn-primary btn-icon" style={{ borderRadius: '50%' }} aria-label="发送" disabled={!input.trim()}><Icon name="send" size={15} /></button>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}

const TYPE_LABEL: Record<string, string> = { heading: '场景', action: '动作', character: '角色', parenthetical: '括号', dialogue: '对白', transition: '转场', shot: '镜头', note: '注释', subtitle: '字幕' };

/** Modification preview: what would change, accept or reject. Nothing touches the script until 接受. */
function PreviewCard({ m, onResolve }: { m: ChatMsg; onResolve: (accept: boolean) => void }) {
  const pv = m.preview!;
  const label = { open: '', accepted: '已接受并写入', rejected: '已拒绝，剧本没有改动', stale: '剧本已变化，没有写入' }[pv.state];
  return (
    <div className={`card preview${pv.state === 'open' ? '' : ' done'}`}>
      <div className="preview-hd"><Icon name="eye" size={13} /><b style={{ flex: 1 }}>修改预览 · {pv.items.length} 处</b>{label && <span className="muted">{label}</span>}</div>
      <div className="preview-list">
        {pv.items.map((it, i) => (
          <div key={i} className="pv-it">
            <span className="pv-tag">{it.kind === 'insert' ? '新增' : it.kind === 'update' ? '改写' : it.kind === 'delete' ? '删除' : it.kind === 'retype' ? '改格式' : '设定'}</span>
            {it.kind === 'update' && <span><del>{it.before}</del><ins>{it.after}</ins></span>}
            {it.kind === 'delete' && <del>{it.before}</del>}
            {it.kind === 'insert' && <ins><span className="muted">{TYPE_LABEL[it.type] ?? it.type} · </span>{it.text}</ins>}
            {it.kind === 'retype' && <span>{it.text}<span className="muted">（{TYPE_LABEL[it.from]} → {TYPE_LABEL[it.to]}）</span></span>}
            {it.kind === 'bible' && <span className="muted">{it.text}</span>}
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
