import { Fragment } from 'react';
import { WRITING_ACTIONS, filterWritingActions } from '@scripter/agent/skills';
// AI panel pieces, rebuilt after app.ancher.ai's agent UI (streamify-one-design-system ·
// packages/domain-ui/agent-ui and apps/web/src/components/product/agent), same as prototype PR #26.
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type ClipboardEvent, type Dispatch, type SetStateAction } from 'react';
import type { ChatNoteAttachment, ChatMsg, ConversationInfo, WorkflowId, ClipboardImage, StoredChatImage } from '../../../shared/ipc.ts';
import type { IconName } from '../lib/icon-paths.ts';
import { WF_MENU } from './Workflows.tsx';
import { Markdown } from '../lib/markdown.tsx';
import { NoteLeadingIcon } from './NoteLeadingIcon.tsx';
import { Activity } from './Activity.tsx';
import { Icon, isMac, useToast } from '../lib/ui.tsx';

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
export function UserBubble({ text, children }: { text: string; children?: ReactNode }) {
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
        {children}<div className="bd" ref={body}>{text}</div>
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
export function AssistantMessage({ m, children, after, onReact, onSave }: {
  m: ChatMsg; children?: ReactNode; after?: ReactNode; onReact: (r: 'like' | 'dislike' | null) => void; onSave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="ag-ai">
      {m.steps && m.steps.length > 0 && <Activity folded items={m.steps.map((r) => ({ ...r, state: 'done' as const }))} />}
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
      {after}
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

export interface Mentionable { label: string; kind: string; note?: ChatNoteAttachment }

/** "+" menu groups (Codex-style, prototype PR #28): 添加 · 快捷指令 · 工作流. */
export type PlusAction = { kind: 'attach' } | { kind: 'video' } | { kind: 'blank' } | { kind: 'mention' } | { kind: 'prefill'; text: string; skillActionId?: string } | { kind: 'outline'; text: string } | { kind: 'workflow'; id: WorkflowId };
const QUICK = WRITING_ACTIONS.map((a) => ['spark', a.title, a.description, a.prompt, a.id] as const);
const PLUS: [string, [IconName, string, string, PlusAction, string?][]][] = [
  ['添加', [['clip', '文件和图片', '剧本、PDF、Word、截图', { kind: 'attach' }], ['video', '本地视频', '转成逐字稿，存进知识库', { kind: 'video' }], ['book', '知识库笔记', '作为这次对话的参考', { kind: 'mention' }]]],
  ['快捷指令', QUICK.map(([ic, t, d, text, skillActionId]) => [ic, t, d, t === '总结大纲' ? { kind: 'outline', text } : { kind: 'prefill', text, skillActionId }] as [IconName, string, string, PlusAction])],
  ['工作流', WF_MENU.map((w) => ['bolt', w.title, w.desc, { kind: 'workflow', id: w.id }, `${isMac ? '⌥' : 'Alt+'}${w.key}`] as [IconName, string, string, PlusAction, string])],
];

/** Empty chat: Ancher-style 3-column action grid and key hints (prototype PR #28). */
const GRID: [IconName, string, PlusAction | { kind: 'web'; text: string }][] = [
  ['pen', '写第一场', { kind: 'prefill', text: '写第一场：' }], ['book', '写大纲', { kind: 'prefill', text: '帮我写这一集的大纲' }], ['user', '角色小传', { kind: 'prefill', text: '给主角写一份人物小传' }],
  ['globe', '搜索网页', { kind: 'web', text: '联网搜一下：' }], ['search', '搜索知识库', { kind: 'mention' }], ['film', '参考结构重写', { kind: 'workflow', id: 'restructure' }],
  ['spark', '笑点方案', { kind: 'workflow', id: 'jokes' }], ['chat', '导演意见 → 规则', { kind: 'workflow', id: 'notes' }], ['video', '视频转逐字稿', { kind: 'workflow', id: 'transcribe' }],
  ['eye', '写飘检查', { kind: 'workflow', id: 'drift' }], ['indent', '控字数', { kind: 'workflow', id: 'length' }], ['bulb', '今日热点选题', { kind: 'workflow', id: 'topics' }],
];

export function EmptyChat({ onAction }: { onAction: (a: PlusAction | { kind: 'web'; text: string }) => void }) {
  return (
    <div className="ag-empty">
      <div className="ag-grid">{GRID.map(([ic, t, a]) => <button key={t} className="ag-tile" onClick={() => onAction(a)}><Icon name={ic} size={18} /><span>{t}</span></button>)}</div>
      <div className="ag-hints"><div><kbd>@</kbd>提及角色、地点或设定</div><div><kbd>↵</kbd>发送消息</div><div><kbd>+</kbd>文件、快捷指令和工作流</div></div>
    </div>
  );
}

/**
 * Two-layer composer: @ · + (grouped menu) · 联网 · model · mic · send / stop; running border while busy (agent-input).
 * While a reply runs, typing turns send into 「加入队列 ↵」 and queued messages show above the box. After a turn,
 * a ghost suggestion sits in the empty box — Tab takes it.
 */
export function Composer({ value, onChange, onSend, onStop, running, queue, onDequeue, ghost, web, onWeb, mentions, onAction, home = false, inputId = 'agent-in', inputLabel = '给 AI 的指令', model, images = [], onImagesChange, notes = [], onNotesChange, onMentionOpen }: {
  value: string; onChange: (v: string) => void; onSend: () => void; onStop: () => void;
  running: boolean; queue: string[]; onDequeue: (i: number) => void; ghost: string;
  web: boolean; onWeb: (v: boolean) => void; mentions: Mentionable[];
  onAction: (a: PlusAction | { kind: 'web'; text: string }) => void;
  home?: boolean; inputId?: string; inputLabel?: string; model?: ReactNode;
  notes?: ChatNoteAttachment[]; onNotesChange?: Dispatch<SetStateAction<ChatNoteAttachment[]>>; onMentionOpen?: () => void;
  images?: ClipboardImage[]; onImagesChange?: Dispatch<SetStateAction<ClipboardImage[]>>;
}) {
  const toast = useToast();
  const [reading, setReading] = useState(false);
  const readingRef = useRef(false);
  async function paste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const files = [...e.clipboardData.items].filter((item) => item.kind === 'file' && item.type.startsWith('image/')).map((item) => item.getAsFile()).filter((f): f is File => !!f);
    if (!files.length || !onImagesChange) return;
    e.preventDefault();
    if (readingRef.current) return;
    if (images.length + files.length > 5) { toast('每条消息最多添加 5 张图片'); return; }
    if (files.some((f) => !['image/png','image/jpeg','image/webp','image/gif'].includes(f.type) || f.size > 20 * 1024 * 1024)) { toast('支持 PNG、JPEG、WebP、GIF，每张不超过 20 MB'); return; }
    readingRef.current = true; setReading(true);
    try {
      const added = await Promise.all(files.map((file) => new Promise<ClipboardImage>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name || '粘贴图片.png', dataUrl: String(reader.result) });
        reader.onerror = () => reject(new Error('图片读取失败，请重试'));
        reader.readAsDataURL(file);
      })));
      onImagesChange((current) => [...current, ...added].slice(0, 5));
    } catch (err) { toast(String(err)); }
    finally { readingRef.current = false; setReading(false); }
  }
  const ta = useRef<HTMLTextAreaElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);
  const [mention, setMention] = useState<{ q: string; sel: number } | null>(null);
  const [plus, setPlus] = useState(false);
  const focusSub = useRef(false);
  const [submenu, setSubmenu] = useState<string | null>(null);
  const [skillQuery, setSkillQuery] = useState('');
  const list = mention ? mentions.filter((m) => m.label.includes(mention.q)).slice(0, 8) : [];

  useEffect(() => {
    if (!plus) return;
    plusRef.current?.querySelector<HTMLElement>('.pm-item')?.focus();
    const close = (e: PointerEvent) => { if (!plusRef.current?.contains(e.target as Node) && !(e.target as HTMLElement).closest('#plus')) setPlus(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [plus]);

  function pick(a: PlusAction) {
    setPlus(false); setSubmenu(null);
    if (a.kind === 'mention') { onInput(`${value}@`); ta.current?.focus(); return; }
    if (a.kind === 'prefill') { onAction(a); onChange(a.text); requestAnimationFrame(() => { const el = ta.current!; el.focus(); el.setSelectionRange(a.text.length, a.text.length); }); return; }
    onAction(a);
  }

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).tagName === 'INPUT' && !['ArrowDown', 'ArrowUp', 'Escape'].includes(e.key)) return;
    const current = (document.activeElement as HTMLElement)?.closest('[role="menu"]');
    const items = [...(current?.querySelectorAll<HTMLElement>(':scope > .pm-item') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { items[(i + 1) % items.length]?.focus(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { items[(i - 1 + items.length) % items.length]?.focus(); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { (document.activeElement as HTMLElement)?.click(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
      if (submenu) { const group = submenu; setSubmenu(null); requestAnimationFrame(() => plusRef.current?.querySelector<HTMLElement>(`[data-group="${group}"]`)?.focus()); }
      else { setPlus(false); document.getElementById('plus')?.focus(); }
      e.preventDefault();
    }
  }
  useLayoutEffect(() => { if (submenu && focusSub.current) { plusRef.current?.querySelector<HTMLElement>('.pm-sub .pm-item')?.focus(); focusSub.current = false; } }, [submenu]);
  function openSub(group: string, focus: boolean) { focusSub.current = focus; setSubmenu(group); if (focus && submenu === group) plusRef.current?.querySelector<HTMLElement>('.pm-sub .pm-item')?.focus(); }

  function insertMention(item: Mentionable) {
    const label = item.label;
    if (item.note && onNotesChange) {
      const note = item.note;
      if (!notes.some((n) => n.source === note.source && n.id === note.id)) {
        if (notes.length >= 10) { toast('每条消息最多添加 10 条笔记'); return; }
        onNotesChange((current) => [...current, note]);
      }
      const el = ta.current!;
      const before = value.slice(0, el.selectionStart).replace(/@[^\s@]*$/, '');
      onChange(before + value.slice(el.selectionStart)); setMention(null);
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(before.length, before.length); });
      return;
    }

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
    if (m && !mention) onMentionOpen?.();
    setMention(m ? { q: m[1]!, sel: 0 } : null);
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
    if (mention && list.length) {
      if (e.key === 'ArrowDown') { setMention({ ...mention, sel: (mention.sel + 1) % list.length }); e.preventDefault(); return; }
      if (e.key === 'ArrowUp') { setMention({ ...mention, sel: (mention.sel - 1 + list.length) % list.length }); e.preventDefault(); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { insertMention(list[mention.sel]!); e.preventDefault(); return; }
      if (e.key === 'Escape') { setMention(null); e.preventDefault(); return; }
    }
    if (e.key === 'Tab' && !value && !notes.length && !images.length && ghost) { e.preventDefault(); onChange(ghost); return; }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (!readingRef.current && (value.trim() || images.length || notes.length)) onSend(); }
  }

  const has = !reading && (!!value.trim() || images.length > 0 || notes.length > 0);
  return (
    <div className="cmp-wrap">
      {queue.length > 0 && (
        <div className="queue" aria-live="polite" aria-label="排队中的消息">
          {queue.map((q, i) => (
            <div key={`${i}-${q}`} className="q-item"><small>排队中</small><span>{q}</span>
              <button className="ico-btn xs" aria-label="移出队列" onClick={() => onDequeue(i)}><Icon name="x" size={12} /></button></div>
          ))}
        </div>
      )}
      <div className="cmp">
        {plus && (
          <div className="plus-menu" ref={plusRef} role="menu" aria-label="添加与快捷指令" onKeyDown={onMenuKey}>
            {PLUS[0]![1].map(([ic, t, d, action]) => <button type="button" key={t} className="pm-item" role="menuitem" onPointerEnter={() => setSubmenu(null)} onClick={() => pick(action)}><Icon name={ic} size={15} /><b>{t}</b><span>{d}</span></button>)}
            <div className="pm-divider" />
            {PLUS.slice(1).filter(([g]) => !home || g !== '工作流').map(([g]) => <button type="button" key={g} className="pm-item" role="menuitem" data-group={g} aria-haspopup="menu" aria-expanded={submenu === g} onPointerEnter={() => openSub(g, false)} onClick={() => openSub(g, true)}><Icon name={g === '工作流' ? 'bolt' : 'spark'} size={15} /><b>{g}</b><span /><Icon name="chev" size={12} /></button>)}
            {home && <button type="button" className="pm-item" role="menuitem" onClick={() => pick({ kind: 'blank' })}><Icon name="doc" size={15} /><b>空白剧本</b></button>}
            {submenu && <div className="pm-sub" role="menu" aria-label={submenu}>
              {submenu === '快捷指令' && <input className="input pm-search" aria-label="搜索编剧技能" placeholder="搜索技能、类型或创作环节" value={skillQuery} onChange={(e) => setSkillQuery(e.target.value)} />}
              {PLUS.find(([g]) => g === submenu)![1].filter(([, title]) => submenu !== '快捷指令' || filterWritingActions(skillQuery).some((a) => a.title === title)).map(([ic, t, d, action, key], i, items) => {
                const category = WRITING_ACTIONS.find((a) => a.title === t)?.category;
                const previous = i ? WRITING_ACTIONS.find((a) => a.title === items[i - 1]![1])?.category : undefined;
                return <Fragment key={t}>{submenu === '快捷指令' && category !== previous && <div className="pm-category" role="presentation">{category}</div>}<button type="button" className="pm-item" role="menuitem" onClick={() => pick(action)}><Icon name={ic} size={15} /><div><b>{t}</b><small>{d}</small></div>{key && <kbd>{key}</kbd>}</button></Fragment>;
              })}
              {submenu === '快捷指令' && !filterWritingActions(skillQuery).length && <div className="pm-category" role="status">没有匹配的技能</div>}
            </div>}

          </div>
        )}
        <form className={`cmp-card${running ? ' busy' : ''}`} onSubmit={(e) => { e.preventDefault(); if (!readingRef.current && (value.trim() || images.length || notes.length)) onSend(); }}>
          {notes.length > 0 && <div className="chat-note-attachments" aria-label="待发送笔记">{notes.map((note) => <span className="chat-note-chip" key={`${note.source}:${note.id}`}><NoteLeadingIcon /><span title={note.title}>{note.title}</span><button type="button" className="ico-btn xs" aria-label={`移除笔记 ${note.title}`} onClick={() => onNotesChange?.((current) => current.filter((n) => n.source !== note.source || n.id !== note.id))}><Icon name="x" size={12} /></button></span>)}</div>}
          {images.length > 0 && <div aria-label="待发送图片" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 12px 0' }}>{images.map((image, i) => <div key={`${i}-${image.name}`} style={{ position: 'relative' }}><img src={image.dataUrl} alt={image.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} /><button type="button" className="ico-btn xs" aria-label={`移除图片 ${i + 1}`} style={{ position: 'absolute', right: 0, top: 0, background: 'var(--paper)' }} onClick={() => onImagesChange?.((current) => current.filter((_, n) => n !== i))}><Icon name="x" size={12} /></button></div>)}</div>}
          <label htmlFor={inputId} className="sr-only">{inputLabel}</label>
          {!value && !images.length && !notes.length && ghost && !running && <div className="ghost" aria-hidden="true"><span>{ghost}</span><kbd>Tab</kbd></div>}
          <textarea id={inputId} ref={ta} value={value} rows={2} onChange={(e) => onInput(e.target.value)} onKeyDown={onKey} onPaste={(e) => void paste(e)}
            placeholder={ghost && !running ? '' : '随便问，@ 提及角色、地点或设定'} aria-description={ghost && !value ? `按 Tab 采纳建议：${ghost}` : undefined} />
          {mention && list.length > 0 && (
            <div className="card menu cmp-mention" role="listbox" aria-label="提及">
              {list.map((m, k) => (
                <button key={`${m.kind}-${m.note?.id ?? m.label}`} type="button" role="option" aria-selected={k === mention.sel} onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}>
                  <span className="muted" style={{ fontSize: 11.5, flex: 'none' }}>{m.kind}</span><span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</span>
                </button>
              ))}
              <div className="muted" role="presentation" style={{ fontSize: 11, padding: '4px 10px' }}>↑↓ 选择 · Tab 确认 · Esc 关闭</div>
            </div>
          )}
          <div className="cmp-bar">
            <button type="button" className="ico-btn" aria-label="提及" title="提及角色、地点、设定或知识库笔记" onClick={() => { onInput(`${value}@`); ta.current?.focus(); }}><Icon name="at" size={16} /></button>
            <button type="button" id="plus" className="ico-btn" aria-label="添加与快捷指令" title="文件、快捷指令和工作流" aria-haspopup="menu" aria-expanded={plus} onClick={() => setPlus((o) => !o)}><Icon name="plus" size={16} /></button>
            <button type="button" className="ico-btn" aria-label="联网搜索" title="联网搜索" aria-pressed={web} onClick={() => onWeb(!web)}><Icon name="globe" size={15} /></button>
            <span style={{ flex: 1 }} />
            <span className="cmp-model">{model ?? <><span className="ag-dot" />Ancher</>}</span>
            <button type="button" className="ico-btn" aria-label="语音输入" title="语音输入（即将支持）" disabled><Icon name="mic" size={16} /></button>
            {running && has
              ? <button type="submit" className="q-pill" title="当前回复结束后自动发送">加入队列<kbd>↵</kbd></button>
              : running
                ? <button type="button" className="cmp-send stop" aria-label="停止" onClick={onStop}><span className="sq" /></button>
                : <button type="submit" className="cmp-send" aria-label={home ? "开始" : "发送"} disabled={!has}><Icon name="send" size={15} /></button>}
          </div>
        </form>
        <div className="cmp-note">AI 可能会出错。请核对重要信息。</div>
      </div>
    </div>
  );
}

/** Original images are kept with the project, including archived conversations. */
export function ChatImages({ projectId, images }: { projectId: string; images: StoredChatImage[] }) {
  const [sources, setSources] = useState<string[]>([]);
  useEffect(() => { let live = true; void Promise.all(images.map((image) => window.api.files.readImage(projectId, image.file).catch(() => null))).then((data) => { if (live) setSources(data.map((src) => src ?? '')); }); return () => { live = false; }; }, [projectId, images]);
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{images.map((image, i) => sources[i] ? <a href={sources[i]} key={image.file} download={image.name} title="保存原图"><img src={sources[i]} alt={image.name} style={{ width: 96, height: 96, objectFit: 'contain', borderRadius: 8 }} /></a> : <span key={image.file}>{image.name}</span>)}</div>;
}
