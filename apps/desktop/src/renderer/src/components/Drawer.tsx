// Right-side drawer (laper 新建道具). Drawer curve, 260ms in / 180ms out; Esc and scrim close; focus returns to the trigger.
import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { Icon } from '../lib/ui.tsx';

export function Drawer({ open, title, sub, cta, onClose, onSubmit, children, busy, modal }: {
  modal?: boolean; open: boolean; title: string; sub?: string; cta: string; busy?: boolean;
  onClose: () => void; onSubmit: () => void | Promise<void>; children: ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const ret = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      ret.current = document.activeElement as HTMLElement | null;
      const t = setTimeout(() => ref.current?.querySelector<HTMLElement>('input, textarea, select')?.focus(), 60);
      return () => clearTimeout(t);
    }
    ret.current?.focus?.();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  const submit = (e: FormEvent) => { e.preventDefault(); void onSubmit(); };
  return (
    <>
      <div className={`dw-scrim${open ? ' open' : ''}`} onClick={onClose} aria-hidden="true" />
      <form ref={ref} className={`dw${modal ? ' centered-modal' : ''}${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={title} onSubmit={submit} inert={!open}>
        <div className="dw-hd">
          <div><h2>{title}</h2>{sub && <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{sub}</div>}</div>
          <button type="button" className="round-x" onClick={onClose} aria-label="关闭"><Icon name="x" size={16} /></button>
        </div>
        <div className="dw-body">{children}</div>
        <div className="dw-ft"><button className="btn btn-primary" style={{ height: 36, padding: '0 18px' }} disabled={busy}>{cta}</button></div>
      </form>
    </>
  );
}

export function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="fs">
      <b>{title}{sub && <><br /><span className="muted" style={{ fontWeight: 400, fontSize: 11.5 }}>{sub}</span></>}</b>
      <div className="in">{children}</div>
    </div>
  );
}

export function PageHead({ title, count, mid, right }: { title: string; count?: number; mid?: ReactNode; right?: ReactNode }) {
  return (
    <div className="topbar drag">
      <b>{title}</b>{count !== undefined && <span className="chip tnum" style={{ height: 20 }}>{count}</span>}
      <span style={{ flex: 1 }} /><span className="no-drag">{mid}</span><span style={{ flex: 1 }} />
      <span className="no-drag" style={{ display: 'flex', gap: 8 }}>{right}</span>
    </div>
  );
}

export function Tabs<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="tablist" aria-label={label}>
      {options.map(([v, t]) => <button key={v} type="button" role="tab" aria-selected={v === value} onClick={() => onChange(v)}>{t}</button>)}
    </div>
  );
}

export function ColorPicker({ value, onChange, palette }: { value: string; onChange: (c: string) => void; palette: [string, string][] }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="radiogroup" aria-label="主题色">
      {palette.map(([n, c]) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} title={n} aria-label={n} className="swatch" style={{ background: c }} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}
