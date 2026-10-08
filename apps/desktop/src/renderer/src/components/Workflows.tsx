// ⚡ workflows in the AI panel (spec 0002 §5.6): menu + ⌥1–⌥8, an input launcher, and run cards
// that show each step, can be cancelled / retried, and end in a result the writer chooses to apply.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { RunState, WorkflowAction, WorkflowId, WorkflowInput } from '../../../shared/ipc.ts';
import { Icon, isMac, useToast } from '../lib/ui.tsx';

/** Mirror of the workflow table (titles/keys/input kinds) so the menu renders without IPC. Kept in sync by the E2E. */
export const WF_MENU: { id: WorkflowId; key: number; title: string; desc: string; input: 'none' | 'text' | 'url-or-text' | 'file' | 'focus' | 'target'; hint?: string }[] = [
  { id: 'directions', key: 1, title: '一个创意 → 3 个走向', desc: '三个冲突来源不同的走向，选一个写进大纲', input: 'text', hint: '一句话创意（留空则用大纲）' },
  { id: 'restructure', key: 2, title: '参考经典结构重写', desc: '拆节拍、换成自家角色、检查原创度，先预览再写入', input: 'url-or-text', hint: '参考作品的链接或一段剧本，也可以选文件' },
  { id: 'jokes', key: 3, title: '笑点方案', desc: '给光标所在的这句出 3–5 个笑点方案', input: 'focus' },
  { id: 'drift', key: 4, title: '写飘检查', desc: '对照大纲和故事核心检查有没有跑偏', input: 'none' },
  { id: 'notes', key: 5, title: '导演意见 → 规则', desc: '整理成待确认规则，确认后全剧生效', input: 'url-or-text', hint: '粘贴导演意见，或选一张截图 / 一段录音' },
  { id: 'length', key: 6, title: '控字数 / 时长', desc: '按场估算时长，给出删减方案，先预览再写入', input: 'target' },
  { id: 'transcribe', key: 7, title: '视频 → 逐字稿', desc: '本地视频转逐字稿，存进知识库', input: 'file' },
  { id: 'topics', key: 8, title: '今日热点选题', desc: '联网找今天的热点，筛成 5 个选题', input: 'none' },
  { id: 'episode', key: 9, title: '一集剧本流水线', desc: '故事和锁定核心、分场都先给你确认，再逐场写完一整集', input: 'text', hint: '这一集的选题或一句话创意（留空则用大纲或选中的选题）' },
];
const optKey = (n: number) => (isMac ? `⌥${n}` : `Alt+${n}`);

export function WorkflowMenu({ onPick, disabled }: { onPick: (id: WorkflowId) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <span ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="chip" aria-haspopup="menu" aria-expanded={open} disabled={disabled} onClick={() => setOpen((o) => !o)} title={`工作流（${optKey(1)}–${optKey(9)}）`}>⚡ 工作流</button>
      {open && (
        <div className="card menu" role="menu" style={{ bottom: 'calc(100% + 6px)', left: 0, width: 320, transformOrigin: 'bottom left' }}>
          {WF_MENU.map((w) => (
            <button key={w.id} role="menuitem" onClick={() => { setOpen(false); onPick(w.id); }}>
              <span style={{ flex: 1 }}><b>{w.title}</b><br /><span className="muted" style={{ fontSize: 12 }}>{w.desc}</span></span>
              <span className="kbd tnum">{optKey(w.key)}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

/** Collects the workflow's input, then starts it. "none" workflows never show this. */
export function WorkflowLauncher({ id, focusText, onStart, onClose }: { id: WorkflowId; focusText: string | null; onStart: (input: WorkflowInput) => void; onClose: () => void }) {
  const w = WF_MENU.find((x) => x.id === id)!;
  const [text, setText] = useState('');
  const [file, setFile] = useState<string | null>(null);
  const [target, setTarget] = useState(5000);
  const first = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  useEffect(() => { first.current?.focus(); }, [id]);
  async function pick(kind: 'media' | 'any') { const f = await window.api.workflows.pickFile(kind); if (f) setFile(f); }
  function submit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (w.input === 'url-or-text') onStart(file ? { filePath: file } : /^https?:\/\//.test(t) ? { url: t } : { text: t });
    else if (w.input === 'file') { if (file) onStart({ filePath: file }); }
    else if (w.input === 'target') onStart({ target });
    else onStart({ text: t });
  }
  const ready = w.input === 'file' ? !!file : w.input === 'url-or-text' ? !!(file || text.trim()) : w.input === 'focus' ? !!focusText : true;
  return (
    <form className="card launcher" onSubmit={submit} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} aria-label={w.title}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><b style={{ flex: 1 }}>⚡ {w.title}</b><button type="button" className="btn btn-quiet btn-icon" style={{ width: 26, height: 26 }} aria-label="关闭" onClick={onClose}><Icon name="x" size={13} /></button></div>
      <span className="muted" style={{ fontSize: 12 }}>{w.desc}</span>
      {w.input === 'text' && <textarea ref={first} className="input" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={w.hint} aria-label="创意" style={{ minHeight: 60, fontSize: 14 }} />}
      {w.input === 'url-or-text' && (
        <>
          {!file && <textarea ref={first} className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={w.hint} aria-label="内容" style={{ minHeight: 70, fontSize: 14 }} />}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button type="button" className="btn btn-ghost" style={{ height: 30 }} onClick={() => void pick('any')}><Icon name="upload" size={13} />{file ? '换一个文件' : '选择文件'}</button>
            {file && <span className="chip" style={{ maxWidth: 200, overflow: 'hidden' }}>{file.split(/[\\/]/).pop()}<button type="button" aria-label="移除文件" onClick={() => setFile(null)}><Icon name="x" size={11} /></button></span>}
          </div>
        </>
      )}
      {w.input === 'file' && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button type="button" className="btn btn-ghost" style={{ height: 30 }} onClick={() => void pick('media')}><Icon name="video" size={13} />选择视频 / 音频</button>
          {file && <span className="chip" style={{ maxWidth: 200, overflow: 'hidden' }}>{file.split(/[\\/]/).pop()}</span>}
        </div>
      )}
      {w.input === 'focus' && (focusText
        ? <div className="quote">「{focusText}」</div>
        : <div className="err">先在剧本里点一下要改的那句台词，再打开笑点方案</div>)}
      {w.input === 'target' && (
        <label className="fl" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>目标字数
          <input ref={first} className="input tnum" type="number" min={500} step={500} value={target} onChange={(e) => setTarget(+e.target.value)} style={{ width: 120, height: 32 }} />
          <span className="muted">≈ {(target / 500).toFixed(0)} 分钟</span></label>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" style={{ height: 30 }} disabled={!ready}>开始</button></div>
    </form>
  );
}

const STEP_ICON: Record<string, string> = { done: '✓', failed: '✕', skipped: '–', pending: '' };

export function RunCard({ run, projectId, onApplied, onJump }: { run: RunState; projectId: string; onApplied: (s: Awaited<ReturnType<typeof window.api.workflows.apply>>['state']) => void; onJump: (nodeId: string) => void }) {
  const w = WF_MENU.find((x) => x.id === run.wf);
  const toast = useToast();
  const [sel, setSel] = useState<number[] | null>(null);
  const r = run.result;
  async function apply(a: WorkflowAction) {
    const res = await window.api.workflows.apply(projectId, run.id, a);
    onApplied(res.state);
    toast(res.message);
  }
  const all = (n: number) => sel ?? Array.from({ length: n }, (_, i) => i);
  const toggle = (n: number, i: number) => setSel((s) => { const cur = s ?? Array.from({ length: n }, (_, k) => k); return cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]; });
  return (
    <div className={`card run run-${run.status}`} aria-label={w?.title}>
      <div className="run-hd"><span aria-hidden="true">⚡</span><b style={{ flex: 1 }}>{w?.title}</b>
        {(run.status === 'running' || run.status === 'waiting') && <button className="btn btn-quiet" style={{ height: 26 }} onClick={() => void window.api.workflows.cancel(run.id, projectId)}><Icon name="stop" size={12} />取消</button>}
        {(run.status === 'failed' || run.status === 'cancelled') && <button className="btn btn-ghost" style={{ height: 26 }} onClick={async () => onApplied(await window.api.workflows.retry(projectId, run.id))}><Icon name="undo" size={12} />重试</button>}
      </div>
      <ol className="steps">
        {run.steps.map((s) => (
          <li key={s.id} className={`st-${s.status}`}>
            <span className="st-ic" aria-hidden="true">{s.status === 'running' ? <span className="spinner" /> : s.status === 'waiting' ? '…' : STEP_ICON[s.status]}</span>
            <span>{s.label}{s.note && <span className="muted"> · {s.note}</span>}{s.error && <span className="err" style={{ display: 'block' }}>{s.error}</span>}</span>
          </li>
        ))}
      </ol>
      {run.status === 'waiting' && run.waiting && <ConfirmPanel key={run.waiting.stepId} run={run} projectId={projectId} onDone={onApplied} />}
      {run.status === 'cancelled' && <div className="muted" style={{ fontSize: 12 }}>已取消，没有写入任何内容</div>}
      {run.applied && <div className="ok">{run.applied}</div>}
      {r?.kind === 'directions' && (
        <div className="res">
          {r.items.map((d, i) => (
            <div key={i} className="res-card">
              <b>{d.title}</b>
              <span><span className="muted">冲突</span> {d.conflict}</span>
              <span><span className="muted">解决</span> {d.resolution}</span>
              <span className="muted" style={{ fontSize: 12 }}>{d.beats.join(' → ')}</span>
              {d.joke && <span><span className="muted">主笑点</span> {d.joke}</span>}
              <button className="btn btn-ghost" style={{ height: 28, alignSelf: 'flex-start' }} onClick={() => void apply({ type: 'direction', index: i })}>写进大纲</button>
            </div>
          ))}
          {r.citations.length > 0 && <div className="chipset">{r.citations.map((c) => <a key={c.url} className="chip" href={c.url} target="_blank" rel="noreferrer">{c.title || c.url}</a>)}</div>}
        </div>
      )}
      {r?.kind === 'ops' && (
        <div className="res">
          {r.narration && <span>{r.narration}</span>}
          <span className="muted" style={{ fontSize: 12 }}>{r.ops.length} 处修改</span>
          {!run.applied && <button className="btn btn-primary" style={{ height: 28, alignSelf: 'flex-start' }} onClick={() => void apply({ type: 'preview' })}><Icon name="eye" size={13} />查看修改预览</button>}
        </div>
      )}
      {r?.kind === 'jokes' && (
        <div className="res">
          {r.target && <div className="quote">原句：{r.target.text}</div>}
          {r.items.map((j, i) => (
            <div key={i} className="res-card">
              <span>{j.text}</span>
              <span className="muted" style={{ fontSize: 12 }}>{j.mechanism}</span>
              {j.conflict && <span className="err">{j.conflict}</span>}
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost" style={{ height: 26 }} onClick={() => void apply({ type: 'joke', index: i })}>用这个</button>
                <button className="btn btn-quiet" style={{ height: 26 }} onClick={() => void apply({ type: 'joke', index: i, verdict: 'good' })}>好笑</button>
                <button className="btn btn-quiet" style={{ height: 26 }} onClick={() => void apply({ type: 'joke', index: i, verdict: 'bad' })}>不好笑</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {r?.kind === 'issues' && (
        <div className="res">
          <span>{r.summary}</span>
          {r.items.length === 0 ? <span className="ok">没有发现跑偏</span> : r.items.map((x, i) => (
            <button key={i} className="res-card issue" disabled={!x.nodeId} onClick={() => x.nodeId && onJump(x.nodeId)}>
              {x.quote && <span className="quote">「{x.quote}」</span>}
              <span>{x.problem}</span>
              <span className="muted" style={{ fontSize: 12 }}>建议：{x.suggestion}</span>
            </button>
          ))}
        </div>
      )}
      {(r?.kind === 'rules' || r?.kind === 'topics') && (
        <div className="res">
          {r.items.map((x, i) => (
            <label key={i} className="res-card pick">
              <input type="checkbox" checked={all(r.items.length).includes(i)} onChange={() => toggle(r.items.length, i)} disabled={!!run.applied} />
              <span>
                {'text' in x ? <><b>{x.text}</b><span className="muted" style={{ fontSize: 12, display: 'block' }}>{x.level === 'hard' ? '硬规则' : '偏好'} · {x.scope}</span>{x.conflict && <span className="err">{x.conflict}</span>}</>
                  : <><b>{x.title}</b><span style={{ display: 'block' }}>{x.logline}</span><span className="muted" style={{ fontSize: 12 }}>{x.why}</span></>}
              </span>
            </label>
          ))}
          {!run.applied && (
            <button className="btn btn-primary" style={{ height: 28, alignSelf: 'flex-start' }} disabled={all(r.items.length).length === 0}
              onClick={() => void apply(r.kind === 'rules' ? { type: 'rules', indexes: all(r.items.length) } : { type: 'topics', indexes: all(r.items.length) })}>
              {r.kind === 'rules' ? `确认加入规则库（${all(r.items.length).length}）` : `加入选题池（${all(r.items.length).length}）`}
            </button>
          )}
        </div>
      )}
      {r?.kind === 'transcript' && <div className="res"><span className="quote" style={{ maxHeight: 120, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{r.text.slice(0, 600)}{r.text.length > 600 ? '…' : ''}</span></div>}
    </div>
  );
}

/** A paused pipeline step: the writer edits the draft (story, scene list) and confirms to continue (spec §5.4). */
function ConfirmPanel({ run, projectId, onDone }: { run: RunState; projectId: string; onDone: (s: Awaited<ReturnType<typeof window.api.workflows.confirm>>) => void }) {
  const w = run.waiting!;
  const [text, setText] = useState(w.text);
  const [busy, setBusy] = useState(false);
  return (
    <div className="confirm">
      <b>{w.title}</b>
      <span className="muted" style={{ fontSize: 12 }}>{w.hint}</span>
      <textarea className="input" aria-label={w.title} value={text} onChange={(e) => setText(e.target.value)} rows={Math.min(14, Math.max(5, text.split('\n').length + 1))} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <button className="btn btn-primary" style={{ height: 30 }} disabled={busy || !text.trim()} onClick={async () => { setBusy(true); onDone(await window.api.workflows.confirm(projectId, run.id, text)); }}><Icon name="check" size={13} />确认，继续</button>
      </div>
    </div>
  );
}
