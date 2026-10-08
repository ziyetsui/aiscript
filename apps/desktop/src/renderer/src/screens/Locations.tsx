// Locations (prototype P12): cards + list, a new/edit drawer. Scene numbers are read live from the script headings.
import { useMemo, useState } from 'react';
import { locationScenes, type Location } from '@scripter/core/script';
import { ColorPicker, Drawer, PageHead, Section, Tabs } from '../components/Drawer.tsx';
import { PALETTE, useImage, useProject } from '../lib/project.ts';
import { Icon, useToast } from '../lib/ui.tsx';
import { cleanErr } from './Characters.tsx';

const TIMES = ['日', '夜', '清晨', '傍晚', '黄昏'];
type Draft = Pick<Location, 'name' | 'ie' | 'times' | 'desc' | 'visual' | 'color'>;
const EMPTY: Draft = { name: '', ie: '外景', times: ['日'], desc: '', visual: '', color: PALETTE[0]![1] };

export function Locations({ id }: { id: string }) {
  const p = useProject(id);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [error, setError] = useState('');
  const toast = useToast();
  const st = p.st;
  const nodes = st?.nodes ?? [];
  const scenesOf = useMemo(() => (name: string) => locationScenes(nodes, name), [nodes]);
  if (!st) return null;
  const locs = st.bible.locations;
  // Headings name places that aren't registered yet ("外景 胡同口 — 傍晚" → 胡同口).
  const unregistered = [...new Set(st.scenes.map((s) => s.heading.replace(/^(内外景|内景|外景|INT\.|EXT\.)\s*/i, '').split(/\s*[—-]\s*/)[0]!.trim()).filter(Boolean))]
    .filter((n) => !locs.some((l) => n.includes(l.name.trim()) && l.name.trim()));

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, [k]: v } } : e));

  async function save() {
    if (!editing) return;
    const d = { ...editing.draft, name: editing.draft.name.trim() };
    if (!d.name) { setError('请填写地点名称'); return; }
    if (locs.some((l) => l.name.trim() === d.name && l.id !== editing.id)) { setError('已经有同名地点'); return; }
    if (editing.id) await p.update('locations', editing.id, d); else await p.add('locations', d);
    toast(editing.id ? '已保存' : `已创建地点：${d.name}`);
    setEditing(null);
  }

  async function remove(l: Location) {
    if (!confirm(`删除地点「${l.name}」？剧本正文不受影响。`)) return;
    await p.remove('locations', l.id);
    toast(`已删除地点 ${l.name}`);
  }

  async function registerAll() {
    for (const [i, n] of unregistered.entries()) {
      const h = st!.scenes.find((s) => s.heading.includes(n))?.heading ?? '';
      await p.add('locations', { name: n, ie: /^内外景/.test(h) ? '内外景' : /^内景|^INT/i.test(h) ? '内景' : '外景', times: [h.split(/[—-]/)[1]?.trim() || '日'], color: PALETTE[(locs.length + i) % PALETTE.length]![1] });
    }
    toast(`已为 ${unregistered.length} 个地点建档`);
  }

  return (
    <>
      <PageHead title="地点管理" count={locs.length}
        mid={<Tabs label="地点视图" value={view} onChange={setView} options={[['grid', '地点总览'], ['list', '地点清单']]} />}
        right={<button className="btn btn-primary" style={{ height: 30 }} onClick={() => { setError(''); setEditing({ id: null, draft: { ...EMPTY, color: PALETTE[locs.length % PALETTE.length]![1] } }); }}><Icon name="plus" size={13} />新建地点</button>} />
      {unregistered.length > 0 && <div className="banner"><span style={{ flex: 1 }}>场景标题里有还没建档的地点：{unregistered.join('、')}</span><button className="btn btn-ghost" style={{ height: 28 }} onClick={() => void registerAll()}>一键建档</button></div>}
      {locs.length === 0 ? (
        <div className="page dots"><div className="empty-state"><Icon name="map" size={34} /><div>还没有地点。新建一个，或者写下场景标题后一键建档。</div></div></div>
      ) : view === 'grid' ? (
        <div className="page dots"><div className="grid-cards">
          {locs.map((l) => <LocCard key={l.id} projectId={id} l={l} scenes={scenesOf(l.name)} onEdit={() => { setError(''); setEditing({ id: l.id, draft: { name: l.name, ie: l.ie, times: l.times, desc: l.desc, visual: l.visual, color: l.color } }); }}
            onImage={async () => { const f = await window.api.files.pickImage(id); if (f) await p.update('locations', l.id, { image: f }); }} onDelete={() => void remove(l)}
            onReverse={async () => { try { const r = await window.api.ai.reverse(id, 'locations', l.id); p.setSt(r.state); toast(`已写进 ${l.name} 的「视觉备注」`); } catch (e) { toast(cleanErr(e)); } }} />)}
        </div></div>
      ) : (
        <div className="page" style={{ padding: '16px 20px' }}>
          <table className="tb">
            <thead><tr><th>地点</th><th>内/外景</th><th>时间</th><th>场次</th><th>描述</th><th /></tr></thead>
            <tbody>{locs.map((l) => { const sc = scenesOf(l.name); return (
              <tr key={l.id}>
                <td><b>{l.name}</b></td><td>{l.ie}</td><td>{l.times.join(' / ')}</td>
                <td className="tnum">{sc.length ? sc.map((x) => `第 ${x} 场`).join('、') : '—'}</td>
                <td className="muted">{l.desc || '—'}</td>
                <td><button className="btn btn-quiet btn-icon" style={{ width: 28, height: 28 }} aria-label={`删除 ${l.name}`} onClick={() => void remove(l)}><Icon name="trash" size={13} /></button></td>
              </tr>); })}</tbody>
          </table>
        </div>
      )}
      <Drawer open={!!editing} title={editing?.id ? '编辑地点' : '新建地点'} sub="为剧本添加一个拍摄地点" cta={editing?.id ? '保存' : '创建'} onClose={() => setEditing(null)} onSubmit={save}>
        {editing && (
          <>
            <Section title="基本信息">
              <label className="fl" htmlFor="ln">名称</label>
              <input id="ln" className="input" value={editing.draft.name} onChange={(e) => set('name', e.target.value)} placeholder="例如：胡同里的小卖部" autoComplete="off" aria-invalid={!!error} />
              {error && <div className="err" role="alert">{error}</div>}
              <span className="fl">内景 / 外景</span>
              <Tabs label="内景或外景" value={editing.draft.ie} onChange={(v) => set('ie', v)} options={[['内景', '内景'], ['外景', '外景'], ['内外景', '内外景']]} />
              <span className="fl">时间（可多选）</span>
              <div className="chipset" role="group" aria-label="时间">
                {TIMES.map((t) => { const on = editing.draft.times.includes(t); return (
                  <button key={t} type="button" className="chip" aria-pressed={on} onClick={() => set('times', on ? editing.draft.times.filter((x) => x !== t) : [...editing.draft.times, t])}>{t}</button>); })}
              </div>
              <span className="fl">主题色</span>
              <ColorPicker value={editing.draft.color} onChange={(c) => set('color', c)} palette={PALETTE} />
            </Section>
            <Section title="描述"><textarea className="input" aria-label="描述" value={editing.draft.desc} onChange={(e) => set('desc', e.target.value)} placeholder="空间结构 / 陈设 / 氛围 / 在故事里的作用…" /></Section>
            <Section title="视觉备注" sub="AI 生图参考 · 光线 / 色调 / 年代 / 镜头角度"><textarea className="input" aria-label="视觉备注" value={editing.draft.visual} onChange={(e) => set('visual', e.target.value)} placeholder="例如：傍晚逆光，暖橙色，九十年代北京" /></Section>
          </>
        )}
      </Drawer>
    </>
  );
}

function LocCard({ projectId, l, scenes, onEdit, onImage, onDelete, onReverse }: { projectId: string; l: Location; scenes: number[]; onEdit(): void; onImage(): void; onDelete(): void; onReverse(): void }) {
  const img = useImage(projectId, l.image);
  return (
    <div className="card ecard">
      <div className="ecard-top" style={{ background: img ? `center / cover url(${img})` : `linear-gradient(160deg, ${l.color}, color-mix(in oklch, ${l.color}, black 35%))` }}>
        <span className="chip">{l.ie}</span>{!img && <Icon name="map" size={30} />}
      </div>
      <div className="ecard-body">
        <b style={{ fontSize: 15 }}>{l.name}</b>
        <div className="chipset">{l.times.map((t) => <span key={t} className="chip">{t}</span>)}<span className="chip tnum"><Icon name="film" size={11} />{scenes.length} 场</span></div>
        <p>{l.desc || '暂无描述'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
          <button className="btn btn-ghost" style={{ height: 30 }} onClick={onEdit}><Icon name="pen" size={12} />编辑</button>
          <button className="btn btn-ghost" style={{ height: 30 }} onClick={onImage}><Icon name="upload" size={12} />{l.image ? '换参考图' : '参考图'}</button>
          <button className="btn btn-quiet btn-icon" style={{ width: 30, height: 30 }} aria-label={`删除 ${l.name}`} onClick={onDelete}><Icon name="trash" size={12} /></button>
        </div>
        {l.image && <button className="btn btn-quiet" style={{ height: 28 }} onClick={onReverse} title="用 Ancher 从参考图反推视觉提示词，写进「视觉备注」"><Icon name="spark" size={12} />反推提示词</button>}
      </div>
    </div>
  );
}
