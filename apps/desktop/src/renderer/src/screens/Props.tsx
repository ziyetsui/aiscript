// Props (prototype P9 / laper /props): a dotted canvas of draggable cards + a list, and the 新建道具 drawer.
import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { Prop } from '@scripter/core/script';
import { ColorPicker, Drawer, PageHead, Section, Tabs } from '../components/Drawer.tsx';
import { PALETTE, useProject } from '../lib/project.ts';
import { Icon, useToast } from '../lib/ui.tsx';

type Draft = Pick<Prop, 'name' | 'category' | 'color' | 'desc' | 'visual'>;
const EMPTY: Draft = { name: '', category: '', color: PALETTE[0]![1], desc: '', visual: '' };
const CATEGORIES = ['道具', '服装', '车辆', '武器', '食物', '装饰'];

export function Props({ id }: { id: string }) {
  const p = useProject(id);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState<Record<string, { x: number; y: number }>>({});
  const board = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const st = p.st;
  if (!st) return null;
  const props = st.bible.props;
  const set = (k: keyof Draft, v: string) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, [k]: v } } : e));

  async function save() {
    if (!editing) return;
    const d = { ...editing.draft, name: editing.draft.name.trim(), category: editing.draft.category.trim() };
    if (!d.name) { setError('请填写道具名称'); return; }
    if (editing.id) await p.update('props', editing.id, d);
    else {
      const n = props.length;
      await p.add('props', { ...d, x: 40 + (n % 3) * 260, y: 40 + Math.floor(n / 3) * 210 });
    }
    toast(editing.id ? '已保存' : `已创建道具：${d.name}`);
    setEditing(null);
  }

  async function remove(x: Prop) {
    if (!confirm(`删除道具「${x.name}」？`)) return;
    await p.remove('props', x.id);
    toast(`已删除 ${x.name}`);
  }

  function startDrag(e: RPointerEvent<HTMLDivElement>, x: Prop) {
    if ((e.target as HTMLElement).closest('button')) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    let last = { x: x.x, y: x.y };
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      el.classList.add('dragging');
      last = { x: Math.max(0, x.x + dx), y: Math.max(0, x.y + dy) };
      setDrag((s) => ({ ...s, [x.id]: last }));
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.classList.remove('dragging');
      if (moved) void p.update('props', x.id, { x: Math.round(last.x), y: Math.round(last.y) }).then(() => setDrag((s) => { const c = { ...s }; delete c[x.id]; return c; }));
      else { setError(''); setEditing({ id: x.id, draft: { name: x.name, category: x.category, color: x.color, desc: x.desc, visual: x.visual } }); }
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  }

  return (
    <>
      <PageHead title="道具管理" count={props.length}
        mid={<Tabs label="道具视图" value={view} onChange={setView} options={[['board', '道具总览'], ['list', '道具清单']]} />}
        right={<button className="btn btn-primary" style={{ height: 30 }} onClick={() => { setError(''); setEditing({ id: null, draft: { ...EMPTY, color: PALETTE[props.length % PALETTE.length]![1] } }); }}><Icon name="plus" size={13} />新建道具</button>} />
      {view === 'board' ? (
        <div ref={board} className="page dots" style={{ position: 'relative', touchAction: 'none' }}>
          {props.length === 0 && <div className="empty-state"><Icon name="box" size={34} /><div>还没有道具</div><button className="btn btn-ghost" onClick={() => { setError(''); setEditing({ id: null, draft: EMPTY }); }}>新建第一件道具</button></div>}
          {props.map((x) => { const q = drag[x.id] ?? x; return (
            <div key={x.id} className="card prop-card" style={{ left: q.x, top: q.y }} onPointerDown={(e) => startDrag(e, x)} role="group" aria-label={x.name}>
              <div className="prop-top" style={{ background: `linear-gradient(160deg, ${x.color}, color-mix(in oklch, ${x.color}, black 30%))` }}><Icon name="box" size={28} /></div>
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><b style={{ flex: 1, fontSize: 14 }}>{x.name}</b><span className="chip" style={{ height: 20, fontSize: 11 }}>{x.category || '未分类'}</span></div>
                <div className="muted" style={{ fontSize: 12 }}>{x.desc || '暂无描述'}</div>
              </div>
            </div>); })}
          {props.length > 0 && <div className="muted" style={{ position: 'absolute', right: 16, bottom: 12, fontSize: 11.5 }}>拖动整理 · 点一下编辑</div>}
        </div>
      ) : (
        <div className="page" style={{ padding: '16px 20px' }}>
          {props.length === 0 ? <div className="empty-state">还没有道具</div> : (
            <table className="tb">
              <thead><tr><th>名称</th><th>分类</th><th>主题色</th><th>描述</th><th /></tr></thead>
              <tbody>{props.map((x) => (
                <tr key={x.id}>
                  <td><button className="linkish" onClick={() => setEditing({ id: x.id, draft: { name: x.name, category: x.category, color: x.color, desc: x.desc, visual: x.visual } })}><b>{x.name}</b></button></td>
                  <td>{x.category || '—'}</td>
                  <td><span className="swatch" style={{ display: 'inline-block', width: 14, height: 14, background: x.color, verticalAlign: -2 }} /> {PALETTE.find(([, c]) => c === x.color)?.[0] ?? ''}</td>
                  <td className="muted" style={{ maxWidth: 360 }}>{x.desc || '—'}</td>
                  <td><button className="btn btn-quiet btn-icon" style={{ width: 28, height: 28 }} aria-label={`删除 ${x.name}`} onClick={() => void remove(x)}><Icon name="trash" size={13} /></button></td>
                </tr>))}</tbody>
            </table>
          )}
        </div>
      )}
      <Drawer open={!!editing} title={editing?.id ? '编辑道具' : '新建道具'} sub="为剧本创建一件新的道具" cta={editing?.id ? '保存' : '创建'} onClose={() => setEditing(null)} onSubmit={save}>
        {editing && (
          <>
            <Section title="基本信息">
              <label className="fl" htmlFor="pn">名称</label>
              <input id="pn" className="input" value={editing.draft.name} onChange={(e) => set('name', e.target.value)} placeholder="例如：姥爷的修车扳手" autoComplete="off" aria-invalid={!!error} />
              {error && <div className="err" role="alert">{error}</div>}
              <span className="fl">主题色</span>
              <ColorPicker value={editing.draft.color} onChange={(c) => set('color', c)} palette={PALETTE} />
              <label className="fl" htmlFor="pk">分类</label>
              <input id="pk" className="input" list="pk-l" value={editing.draft.category} onChange={(e) => set('category', e.target.value)} placeholder="道具 / 服装 / 车辆 / 武器 / 食物 / 装饰…" autoComplete="off" />
              <datalist id="pk-l">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
            </Section>
            <Section title="描述"><textarea className="input" aria-label="描述" value={editing.draft.desc} onChange={(e) => set('desc', e.target.value)} placeholder="形态 / 材质 / 用途 / 状态 / 故事意义…" /></Section>
            <Section title="形象备注" sub="AI 生图参考 · 质感 / 色调 / 光线 / 镜头语言"><textarea className="input" aria-label="形象备注" value={editing.draft.visual} onChange={(e) => set('visual', e.target.value)} placeholder="例如：暖黄台灯下的特写，金属反光，略带锈迹" /></Section>
            {editing.id && <button type="button" className="btn btn-quiet" style={{ alignSelf: 'flex-start', color: 'var(--danger)' }} onClick={() => { const x = props.find((y) => y.id === editing.id); setEditing(null); if (x) void remove(x); }}><Icon name="trash" size={13} />删除这件道具</button>}
          </>
        )}
      </Drawer>
    </>
  );
}
