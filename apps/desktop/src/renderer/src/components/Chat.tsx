// AI panel pieces, rebuilt after app.ancher.ai's agent UI (streamify-one-design-system ·
// packages/domain-ui/agent-ui and apps/web/src/components/product/agent), same as prototype PR #26.
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { ChatMsg, ConversationInfo } from '../../../shared/ipc.ts';
import { Markdown } from '../lib/markdown.tsx';
import { Icon, isMac } from '../lib/ui.tsx';

const time = (at: number) => new Date(at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

/** Header: conversation title ⌄ (history) · 保存 · 新对话 (agent-ui shell/agent-header). */
export function ChatHeader({ title, conversations, onOpen, onNew, onSave, disabled }: {
  title: string; conversations: ConversationInfo[]; disabled?: boolean;
  onOpen: (id: string) => void; onNew: () => void; onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="ag-hd">
      <div ref={ref} style={{ position: 'relative', minWidth: 0 }}>
        <button className="ag-title" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} title="对话记录">
          <span>{title}</span><Icon name="chev" size={13} />
        </button>
        {open && (
          <div className="card menu ag-history" role="menu">
            <div className="muted" style={{ fontSize: 11.5, padding: '4px 10px 6px' }}>这个项目的对话</div>
            <button role="menuitem" aria-current="true"><span className="ag-dot" />{title}</button>
            {conversations.length === 0 && <div className="muted" style={{ fontSize: 12.5, padding: '6px 10px' }}>还没有更早的对话</div>}
            {conversations.map((c) => (
              <button key={c.id} role="menuitem" disabled={disabled} onClick={() => { setOpen(false); onOpen(c.id); }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                <span className="muted tnum" style={{ fontSize: 11.5 }}>{new Date(c.at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <span style={{ flex: 1 }} />
      <button className="ag-save" onClick={onSave} title="把这段对话存进知识库"><Icon name="doc" size={15} />保存</button>
      <button className="ico-btn" aria-label="新对话" title="新对话" onClick={onNew} disabled={disabled}><Icon name="plus" size={16} /></button>
    </div>
  );
}

/** Right-aligned muted bubble; clamps past 164px with a fade and 展开更多 / 收起; copy on hover (user-message-bubble). */
export function UserBubble({ text }: { text: string }) {
  const body = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setOver(el.scrollHeight > 164));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="ag-user">
      <div className={`bubble${open ? ' open' : ''}`}>
        <div className="bd" ref={body}>{text}</div>
        {over && (
          <button className="more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span>{open ? '收起' : '展开更多'}</span><Icon name="chev" size={12} />
          </button>
        )}
      </div>
      <div className="msg-acts">
        <button className="ico-btn" aria-label={copied ? '已复制' : '复制消息'} title="复制"
          onClick={() => { void navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
          <Icon name={copied ? 'check' : 'copy'} size={13} />
        </button>
      </div>
    </div>
  );
}

/** Assistant reply: no bubble, Markdown body; actions row copy · 存为笔记 · 赞 · 踩 · time (message-actions). */
export function AssistantMessage({ m, children, onReact, onSave }: {
  m: ChatMsg; children?: ReactNode; onReact: (r: 'like' | 'dislike' | null) => void; onSave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="ag-ai">
      {m.text && <Markdown text={m.text} />}
      {children}
      {m.text && (
        <div className="msg-acts" role="group" aria-label="消息操作">
          <button className="ico-btn" aria-label={copied ? '已复制' : '复制'} title="复制"
            onClick={() => { void navigator.clipboard.writeText(m.text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
            <Icon name={copied ? 'check' : 'copy'} size={13} />
          </button>
          <button className="ico-btn" aria-label="存为笔记" title="存进知识库" onClick={onSave}><Icon name="doc" size={13} /></button>
          <button className="ico-btn" aria-label="好的回答" aria-pressed={m.reaction === 'like'} onClick={() => onReact(m.reaction === 'like' ? null : 'like')}><Icon name="thumbUp" size={13} /></button>
          <button className="ico-btn" aria-label="不好的回答" aria-pressed={m.reaction === 'dislike'} onClick={() => onReact(m.reaction === 'dislike' ? null : 'dislike')}><Icon name="thumbDown" size={13} /></button>
          <span className="msg-time">{time(m.at)}</span>
        </div>
      )}
    </div>
  );
}

const TIPS = [
  '把参考剧本放进知识库并打开「写作时参考」，AI 会照着它写。',
  `按 ${isMac ? '⌥' : 'Alt+'}1–9 可以直接启动工作流。`,
  '选中剧本里的文字，可以让 AI 解释、总结或翻译。',
  '改写已有内容时会先给你修改预览，接受才写入。',
];
const DOTS = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

/** While a request runs: ascii dots + shimmering "Thinking", the streamed text so far, and a rotating tip. */
export function Thinking({ partial }: { partial: string }) {
  const [f, setF] = useState(0);
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [showTip, setShowTip] = useState(true);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const d = reduce ? undefined : setInterval(() => setF((x) => x + 1), 90);
    const t = setInterval(() => setTip((x) => x + 1), 5000);
    return () => { clearInterval(d); clearInterval(t); };
  }, []);
  return (
    <div className="ag-thinking" aria-live="polite">
      <button className="thinking" aria-expanded={open} aria-label="正在思考" onClick={() => setOpen((o) => !o)} disabled={!partial}>
        <span className="dots" aria-hidden="true">{DOTS[f % DOTS.length]}</span><span className="shimmer">Thinking</span>
        <span className="thinking-chev" style={{ transform: `rotate(${open ? 0 : -90}deg)` }}><Icon name="chev" size={12} /></span>
      </button>
      {open && partial && <div className="thinking-body">{partial}</div>}
      {showTip && (
        <div className="wait-tip"><Icon name="bulb" size={15} /><span>{TIPS[tip % TIPS.length]}</span>
          <button className="ico-btn" aria-label="关闭提示" onClick={() => setShowTip(false)}><Icon name="x" size={12} /></button></div>
      )}
    </div>
  );
}

export function JumpPill({ show, unread, onClick }: { show: boolean; unread: number; onClick: () => void }) {
  return (
    <button className={`jump-pill${show ? ' show' : ''}`} onClick={onClick} aria-label="回到最新消息" tabIndex={show ? 0 : -1}>
      <Icon name="arrowDown" size={13} />最新{unread > 0 && <span className="n tnum">{unread > 99 ? '99+' : unread}</span>}
    </button>
  );
}

export interface Mentionable { label: string; kind: string }

/** Two-layer composer: @ · + · 联网 · model · mic · send / stop, running border while busy (agent-input). */
export function Composer({ value, onChange, onSend, onStop, running, queued, web, onWeb, onAttach, mentions, chips }: {
  value: string; onChange: (v: string) => void; onSend: () => void; onStop: () => void;
  running: boolean; queued: number; web: boolean; onWeb: (v: boolean) => void; onAttach: () => void;
  mentions: Mentionable[]; chips: ReactNode;
}) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const [mention, setMention] = useState<{ q: string; sel: number } | null>(null);
  const list = mention ? mentions.filter((m) => m.label.includes(mention.q)).slice(0, 8) : [];

  function insertMention(label: string) {
    const el = ta.current!;
    const pos = el.selectionStart;
    const before = value.slice(0, pos).replace(/@[^\s@]*$/, '');
    const next = `${before}@${label} ${value.slice(pos)}`;
    onChange(next);
    setMention(null);
    requestAnimationFrame(() => { el.focus(); const c = before.length + label.length + 2; el.setSelectionRange(c, c); });
  }

  function onInput(v: string) {
    onChange(v);
    const pos = ta.current?.selectionStart ?? v.length;
    const m = /@([^\s@]*)$/.exec(v.slice(0, pos));
    setMention(m ? { q: m[1]!, sel: 0 } : null);
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (mention && list.length) {
      if (e.key === 'ArrowDown') { setMention({ ...mention, sel: (mention.sel + 1) % list.length }); e.preventDefault(); return; }
      if (e.key === 'ArrowUp') { setMention({ ...mention, sel: (mention.sel - 1 + list.length) % list.length }); e.preventDefault(); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { insertMention(list[mention.sel]!.label); e.preventDefault(); return; }
      if (e.key === 'Escape') { setMention(null); e.preventDefault(); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); onSend(); }
  }

  const canSend = !!value.trim();
  return (
    <div className="cmp-wrap">
      {chips}
      <div className="cmp">
        <form className={`cmp-card${running ? ' busy' : ''}`} onSubmit={(e) => { e.preventDefault(); onSend(); }}>
          <label htmlFor="agent-in" className="sr-only">给 AI 的指令</label>
          <textarea id="agent-in" ref={ta} value={value} rows={2} onChange={(e) => onInput(e.target.value)} onKeyDown={onKey}
            placeholder="随便问，@ 提及角色、地点或设定" />
          {mention && list.length > 0 && (
            <div className="card menu cmp-mention" role="listbox" aria-label="提及">
              {list.map((m, k) => (
                <button key={`${m.kind}-${m.label}`} type="button" role="option" aria-selected={k === mention.sel} onMouseDown={(e) => { e.preventDefault(); insertMention(m.label); }}>
                  <span className="muted" style={{ fontSize: 11.5, width: 34 }}>{m.kind}</span>{m.label}
                </button>
              ))}
            </div>
          )}
          <div className="cmp-bar">
            <button type="button" className="ico-btn" aria-label="提及" title="提及角色、地点或设定" onClick={() => { onInput(`${value}@`); ta.current?.focus(); }}><Icon name="at" size={16} /></button>
            <button type="button" className="ico-btn" aria-label="添加文件" title="添加参考文件（存进知识库并在写作时参考）" onClick={onAttach}><Icon name="plus" size={16} /></button>
            <button type="button" className="ico-btn" aria-label="联网搜索" title="联网搜索" aria-pressed={web} onClick={() => onWeb(!web)}><Icon name="globe" size={15} /></button>
            <span style={{ flex: 1 }} />
            <span className="cmp-model"><span className="ag-dot" />Ancher</span>
            {running && canSend ? (
              <button type="submit" className="cmp-queue" title="当前回复结束后自动发送">加入队列<kbd>↵</kbd></button>
            ) : (
              <button type="button" className="ico-btn" aria-label="语音输入" title="语音输入（即将支持）" disabled><Icon name="mic" size={16} /></button>
            )}
            {running
              ? <button type="button" className="cmp-send stop" aria-label="停止" onClick={onStop}><span className="sq" /></button>
              : <button type="submit" className="cmp-send" aria-label="发送" disabled={!canSend}><Icon name="send" size={15} /></button>}
          </div>
        </form>
        {queued > 0 && <div className="cmp-queued muted">队列里还有 {queued} 条，会在这条回复结束后依次发送</div>}
        <div className="cmp-note">AI 可能会出错。请核对重要信息。</div>
      </div>
    </div>
  );
}
