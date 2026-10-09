// Agent activity, after Ancher's ActivityTree: muted 28px rows (ascii dots + shimmer while running, a small check
// when done), consecutive same-tool calls already merged into ×N, and a finished block folded into one
// 「› 完成 N 个步骤 · …」 line that opens with a guide line. Also used for ⚡ workflow run steps.
import { useEffect, useState } from 'react';
import { Icon } from '../lib/ui.tsx';

export type ActState = 'running' | 'done' | 'failed' | 'waiting' | 'pending' | 'skipped';
export interface ActItem { label: string; obj?: string; n?: number; state: ActState; error?: string }

const DOTS = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';

export const actSummary = (items: ActItem[]) => {
  const done = items.filter((r) => r.state !== 'pending' && r.state !== 'skipped');
  return `完成 ${done.reduce((a, r) => a + (r.n ?? 1), 0)} 个步骤 · ${done.slice(-2).map((r) => r.label).join('、')}`;
};

function useDots(on: boolean) {
  const [f, setF] = useState(0);
  useEffect(() => {
    if (!on || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setF((x) => x + 1), 90);
    return () => clearInterval(t);
  }, [on]);
  return DOTS[f % DOTS.length] ?? '⠋';
}

function Row({ r, dot }: { r: ActItem; dot: string }) {
  return (
    <div className={`act-row is-${r.state}`}>
      <span className="ai" aria-hidden="true">
        {r.state === 'running' ? dot : r.state === 'done' ? <Icon name="check" size={12} /> : r.state === 'failed' ? <Icon name="x" size={12} /> : r.state === 'waiting' ? '…' : r.state === 'skipped' ? '–' : '·'}
      </span>
      <span className="al"><span>{r.label}</span>{r.obj && <span className="ao"> · {r.obj}</span>}</span>
      {(r.n ?? 1) > 1 && <span className="an">×{r.n}</span>}
      {r.error && <span className="act-err">{r.error}</span>}
    </div>
  );
}

/** `folded`: show the one-line summary (closed by default); otherwise the rows themselves, live. */
export function Activity({ items, folded, label = '执行步骤' }: { items: ActItem[]; folded: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  const dot = useDots(items.some((r) => r.state === 'running'));
  if (!items.length) return null;
  return (
    <div className="ag-act" role="group" aria-label={label}>
      {folded && (
        <button className="act-sum" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name="chev" size={12} /><span>{actSummary(items)}</span>
        </button>
      )}
      {(!folded || open) && <div className={folded ? 'act-rows guide' : 'act-rows'}>{items.map((r, i) => <Row key={i} r={r} dot={dot} />)}</div>}
    </div>
  );
}
