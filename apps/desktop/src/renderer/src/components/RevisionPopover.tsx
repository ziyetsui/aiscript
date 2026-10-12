// Ancher's common/revision-popover.tsx interaction, using local IPC and this client's UI primitives.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { ScriptRevisionInfo } from '../../../shared/ipc.ts';
import { Icon, useToast } from '../lib/ui.tsx';

export function RevisionPopover({ projectId, episodeId, selected, refresh, onSelect, target = 'script' }: {
  target?: 'script' | 'outline' | 'beats'; projectId: string; episodeId: string; selected: number | null; refresh: number;
  onSelect: (revision: number | null) => Promise<void>;
}) {
  const title = target === 'beats' ? '故事节拍' : target === 'outline' ? '大纲' : '剧本';
  const [versions, setVersions] = useState<ScriptRevisionInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const request = useRef(0);
  const toast = useToast();
  async function load(capture = false) {
    const token = ++request.current;
    if (capture) setBusy(true);
    try {
      const list = await (target === 'beats' ? window.api.projects.beatsRevisions : target === 'outline' ? window.api.projects.outlineRevisions : window.api.projects.revisions)(projectId, episodeId, capture);
      if (token === request.current) setVersions(list);
    } catch (e) { if (token === request.current) toast(String(e)); }
    finally { if (capture) setBusy(false); }
  }
  useEffect(() => { void load(); return () => { request.current++; }; }, [projectId, episodeId, refresh, target]);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node) && !menu.current?.contains(e.target as Node)) setOpen(false); };
    const resized = () => setOpen(false);
    document.addEventListener('pointerdown', close);
    window.addEventListener('resize', resized);
    menu.current?.focus();
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('resize', resized); };
  }, [open]);
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    items[e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  }
  async function save() {
    setBusy(true);
    try { setVersions(await (target === 'beats' ? window.api.projects.saveBeatsRevision : target === 'outline' ? window.api.projects.saveOutlineRevision : window.api.projects.saveRevision)(projectId, episodeId)); setOpen(false); toast(`已保存${title}版本`); }
    catch (e) { toast(String(e)); }
    finally { setBusy(false); }
  }
  return <div className="revision-picker no-drag" ref={ref}>
    <button className="btn btn-quiet revision-trigger" ref={trigger} aria-label={`${title}版本历史`} aria-haspopup="menu" aria-expanded={open} onClick={() => { if (!open) { const rect = trigger.current!.getBoundingClientRect(); setPosition({ top: rect.bottom + 8, left: Math.max(8, Math.min(rect.left, window.innerWidth - 326)) }); void load(true); } setOpen(!open); }}>
      <Icon name="history" size={14} /><span className="tnum">v{selected ?? versions[0]?.revision ?? 1}</span><Icon name="chev" size={11} />
    </button>
    {open && createPortal(<div className="card menu revision-menu" ref={menu} style={position} role="menu" tabIndex={-1} aria-label={`${title}版本`} onKeyDown={onKey}>
      <div className="revision-menu-title">本集{title}版本</div>
      <button role="menuitem" disabled={busy || selected !== null} onClick={() => void save()}><Icon name="plus" size={14} />保存当前版本</button>
      <div className="revision-list">{versions.map((v, i) => <button role="menuitem" key={v.revision} disabled={busy} aria-label={`预览 v${v.revision}`} aria-current={(selected ?? versions[0]?.revision) === v.revision ? 'true' : undefined} onClick={async () => {
        setBusy(true);
        try { await onSelect(i === 0 ? null : v.revision); setOpen(false); trigger.current?.focus(); }
        catch (e) { toast(String(e)); }
        finally { setBusy(false); }
      }}>
        <span className="revision-number tnum">v{v.revision}</span><span className="revision-detail"><span>{v.label}{i === 0 ? ' · 当前' : ''}</span><small>{new Date(v.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {v.words} 字</small></span>
        {(selected ?? versions[0]?.revision) === v.revision && <Icon name="check" size={14} />}
      </button>)}</div>
    </div>, document.body)}
  </div>;
}
