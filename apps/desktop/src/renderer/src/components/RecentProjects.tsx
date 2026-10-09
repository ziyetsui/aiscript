import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ProjectMeta } from '../../../shared/ipc.ts';
import { Icon } from '../lib/ui.tsx';

export function RecentProjects({ currentId, onSelect, onAll }: { currentId: string; onSelect: (id: string) => void; onAll: () => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ProjectMeta[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ left: 56, top: 80 });
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true); setError('');
    void window.api.projects.list().then((projects) => { if (active) setItems(projects); }, () => { if (active) setError('无法读取项目，请关闭后重试。'); }).finally(() => { if (active) setLoading(false); });
    popup.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const close = (event: PointerEvent) => {
      if (!popup.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', key);
    return () => { active = false; document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key); };
  }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  return <>
    <button ref={trigger} className="no-drag" title="最近项目" aria-label="最近项目" aria-haspopup="dialog" aria-expanded={open} onClick={() => {
      const rect = trigger.current!.getBoundingClientRect();
      setPosition({ left: rect.right + 8, top: rect.top });
      setOpen((value) => !value);
    }}><Icon name="doc" size={17} /></button>
    {open && createPortal(<div ref={popup} className="card recent-project-popup no-drag" role="dialog" aria-label="最近项目" style={position}>
      <div className="recent-project-heading"><b>最近项目</b><button className="btn btn-quiet" aria-label="关闭最近项目" onClick={close}><Icon name="x" size={15} /></button></div>
      {loading ? <p className="muted">读取中…</p> : error ? <p role="alert">{error}</p> : <div className="recent-project-list">
        {items.map((project) => <button key={project.id} data-project-id={project.id} className="recent-project-item" aria-current={project.id === currentId ? 'true' : undefined} onClick={() => { close(); if (project.id !== currentId) onSelect(project.id); }}>
          <Icon name="doc" size={16} /><span><b>{project.title}</b><small className="muted">{new Date(project.updatedAt).toLocaleDateString('zh-CN')} · {project.words} 字</small></span>{project.id === currentId && <Icon name="check" size={15} />}
        </button>)}
        {!items.length && <p className="muted">还没有项目</p>}
      </div>}
      <button className="btn btn-ghost" onClick={() => { close(); onAll(); }}>查看全部项目</button>
    </div>, document.body)}
  </>;
}
