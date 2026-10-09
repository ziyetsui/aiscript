import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Topic } from '@scripter/core/script';
import type { IconName } from '../lib/icon-paths.ts';
import { Icon } from '../lib/ui.tsx';
export type TopicAction = 'share' | 'save' | 'download' | 'info' | 'chat' | 'collection' | 'like' | 'dislike' | 'delete';
const GROUPS: [TopicAction, IconName, string][][] = [
  [['share', 'share', '分享'], ['save', 'doc', '保存为笔记'], ['download', 'arrowDown', '下载'], ['info', 'info', '信息']],
  [['chat', 'chat', '添加到对话'], ['collection', 'folderPlus', '添加到合集']],
  [['like', 'thumbUp', '喜欢'], ['dislike', 'thumbDown', '不喜欢']],
  [['delete', 'trash', '删除']],
];
export function TopicMenu({ topic, x, y, onClose, onAction }: { topic: Topic; x: number; y: number; onClose: () => void; onAction: (action: TopicAction) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const scroll = (e: Event) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    document.addEventListener('pointerdown', close); window.addEventListener('resize', onClose); document.addEventListener('scroll', scroll, true);
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('resize', onClose); document.removeEventListener('scroll', scroll, true); if (previous?.isConnected) previous.focus(); };
  }, [onClose]);
  return createPortal(<div ref={ref} className="topic-menu" role="menu" aria-label={`${topic.title} 的操作`} style={{ left: Math.max(8, Math.min(x, window.innerWidth - 208)), top: Math.max(8, Math.min(y, window.innerHeight - 380)) }} onKeyDown={(e) => {
    if (e.key === 'Escape' || e.key === 'Tab') { if (e.key === 'Escape') e.preventDefault(); onClose(); }
    const items = [...ref.current!.querySelectorAll<HTMLButtonElement>('button')]; const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) { e.preventDefault(); items[e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); }
  }}>{GROUPS.map((group, i) => <div key={i} className="topic-menu-group">{group.map(([action, icon, label]) => <button type="button" key={action} role={action === 'like' || action === 'dislike' ? 'menuitemcheckbox' : 'menuitem'} aria-checked={action === 'like' || action === 'dislike' ? topic.reaction === action : undefined} className={action === 'delete' ? 'danger' : ''} onClick={() => { onClose(); onAction(action); }}><Icon name={icon} size={16} /><span>{label}</span>{topic.reaction === action && <Icon name="check" size={14} />}</button>)}</div>)}</div>, document.body);
}
export function TopicDialog({ title, onClose, children, busy = false }: { title: string; onClose: () => void; children: ReactNode; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; ref.current?.showModal(); return () => { if (previous?.isConnected) previous.focus(); }; }, []);
  return <dialog ref={ref} className="topic-dialog" aria-label={title} onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }} onClick={(e) => { if (e.target === e.currentTarget && !busy) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <header><h2>{title}</h2><button className="btn btn-quiet btn-icon" aria-label="关闭选题窗口" disabled={busy} onClick={onClose}><Icon name="x" /></button></header>{children}
  </dialog>;
}
