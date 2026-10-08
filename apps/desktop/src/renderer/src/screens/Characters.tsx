// Characters (prototype P5): overview cards, a draggable relationship map, and casting.
import { Fragment, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { characterStats, type Character, type Relation } from '@scripter/core/script';
import { ColorPicker, Drawer, PageHead, Section, Tabs } from '../components/Drawer.tsx';
import { PALETTE, useImage, useProject } from '../lib/project.ts';
import { Icon, useToast } from '../lib/ui.tsx';

type View = 'overview' | 'relations' | 'casting';
type Draft = Pick<Character, 'name' | 'role' | 'color' | 'desc' | 'look' | 'catchphrase' | 'want' | 'fear'>;
const EMPTY: Draft = { name: '', role: '', color: PALETTE[4]![1], desc: '', look: '', catchphrase: '', want: '', fear: '' };

export function Characters({ id }: { id: string }) {
  const p = useProject(id);
  const [view, setView] = useState<View>('overview');
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [error, setError] = useState('');
  const toast = useToast();
  const st = p.st;
  const stats = useMemo(() => characterStats(st?.nodes ?? []), [st?.nodes]);
  if (!st) return null;
  const chars = st.bible.characters;
  const unregistered = [...stats.keys()].filter((n) => n && !chars.some((c) => c.name.trim() === n));

  async function save() {
    if (!editing) return;
    const d = editing.draft;
    if (!d.name.trim()) { setError('请填写角色名'); return; }
    if (chars.some((c) => c.name.trim() === d.name.trim() && c.id !== editing.id)) { setError('已经有同名角色'); return; }
    if (editing.id) await p.update('characters', editing.id, { ...d, name: d.name.trim() });
    else await p.add('characters', { ...d, name: d.name.trim() });
    toast(editing.id ? '已保存' : `已新建角色：${d.name.trim()}`);
    setEditing(null);
  }

  async function remove(c: Character) {
    if (!confirm(`删除角色「${c.name}」？和 TA 有关的人物关系也会一起删除。剧本正文不受影响。`)) return;
    await p.remove('characters', c.id);
    toast(`已删除 ${c.name}`);
  }

  async function registerAll() {
    for (const [i, n] of unregistered.entries()) await p.add('characters', { name: n, color: PALETTE[(chars.length + i) % PALETTE.length]![1] });
    toast(`已为 ${unregistered.length} 个角色建档`);
  }

  const set = (k: keyof Draft, v: string) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, [k]: v } } : e));

  return (
    <>
      <PageHead title="角色" count={chars.length}
        mid={<Tabs label="角色视图" value={view} onChange={setView} options={[['overview', '概览'], ['relations', '关系'], ['casting', '选角']]} />}
        right={<button className="btn btn-primary" style={{ height: 30 }} onClick={() => { setError(''); setEditing({ id: null, draft: { ...EMPTY, color: PALETTE[chars.length % PALETTE.length]![1] } }); }}><Icon name="plus" size={13} />新角色</button>} />
      {unregistered.length > 0 && (
        <div className="banner"><span style={{ flex: 1 }}>剧本里出现了还没建档的角色：{unregistered.join('、')}</span><button className="btn btn-ghost" style={{ height: 28 }} onClick={() => void registerAll()}>一键建档</button></div>
      )}
      {view === 'overview' && (
        chars.length === 0 ? (
          <div className="page dots"><div className="empty-state"><Icon name="users" size={34} /><div>还没有角色。新建一个，或者让 AI 写剧本时自动登记。</div></div></div>
        ) : (
          <div className="page dots"><div className="grid-cards">
            {chars.map((c) => <CharCard key={c.id} projectId={id} c={c} stat={stats.get(c.name.trim())} onEdit={() => { setError(''); setEditing({ id: c.id, draft: pick(c) }); }} onDelete={() => void remove(c)}
              onPortrait={async () => { try { const f = await window.api.files.pickImage(id); if (f) await p.update('characters', c.id, { portrait: f }); } catch (e) { toast(String((e as Error).message)); } }} />)}
          </div></div>
        )
      )}
      {view === 'relations' && <Relations chars={chars} rels={st.bible.relations} p={p} />}
      {view === 'casting' && <Casting projectId={id} chars={chars} p={p} />}
      <Drawer open={!!editing} title={editing?.id ? '编辑角色' : '新角色'} sub="角色设定会作为 AI 写作的上下文" cta={editing?.id ? '保存' : '创建'} onClose={() => setEditing(null)} onSubmit={save}>
        {editing && (
          <>
            <Section title="基本信息">
              <label className="fl" htmlFor="cn">名字</label>
              <input id="cn" className="input" value={editing.draft.name} onChange={(e) => set('name', e.target.value)} placeholder="例如：豆豆" autoComplete="off" aria-invalid={!!error} />
              {error && <div className="err" role="alert">{error}</div>}
              <label className="fl" htmlFor="cr">身份</label>
              <input id="cr" className="input" value={editing.draft.role} onChange={(e) => set('role', e.target.value)} placeholder="男 · 9 岁 · 三年级学生" autoComplete="off" />
              <span className="fl">主题色</span>
              <ColorPicker value={editing.draft.color} onChange={(c) => set('color', c)} palette={PALETTE} />
            </Section>
            <Section title="描述"><textarea className="input" aria-label="描述" value={editing.draft.desc} onChange={(e) => set('desc', e.target.value)} placeholder="性格、处境、在故事里的作用…" /></Section>
            <Section title="高级" sub="想要 / 害怕 决定了这个角色会怎么行动">
              {([['want', '想要', '有人陪他说话'], ['fear', '害怕', '被当成怪孩子'], ['catchphrase', '口头禅', '那可说不准。'], ['look', '外形', '圆脸短发 · 蓝校服']] as const).map(([k, l, ph]) => (
                <div className="field" key={k}><label className="fl" htmlFor={`c-${k}`}>{l}</label><input id={`c-${k}`} className="input" value={editing.draft[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} autoComplete="off" /></div>
              ))}
            </Section>
          </>
        )}
      </Drawer>
    </>
  );
}

const pick = (c: Character): Draft => ({ name: c.name, role: c.role, color: c.color, desc: c.desc, look: c.look, catchphrase: c.catchphrase, want: c.want, fear: c.fear });

function Avatar({ projectId, c, size = 32 }: { projectId: string; c: Character; size?: number }) {
  const img = useImage(projectId, c.portrait);
  return <span className="avatar" style={{ width: size, height: size, background: img ? `center / cover url(${img})` : c.color, fontSize: size * 0.4 }} aria-hidden="true">{img ? '' : c.name.slice(0, 1)}</span>;
}

function CharCard({ projectId, c, stat, onEdit, onDelete, onPortrait }: { projectId: string; c: Character; stat?: { scenes: number; lines: number }; onEdit(): void; onDelete(): void; onPortrait(): void }) {
  const [adv, setAdv] = useState(false);
  const img = useImage(projectId, c.portrait);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Tabs label={`${c.name} 视图`} value={adv ? 'a' : 'p'} onChange={(v) => setAdv(v === 'a')} options={[['p', '肖像'], ['a', '高级']]} />
      <div className="card ecard">
        {adv ? (
          <dl className="kv" style={{ padding: 12, margin: 0, gridTemplateColumns: '64px 1fr', fontSize: 12.5 }}>
            {([['外形', c.look], ['口头禅', c.catchphrase], ['想要', c.want], ['害怕', c.fear], ['配音', c.voice || '未定']] as const).map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v || '—'}</dd></Fragment>)}
          </dl>
        ) : (
          <div className="ecard-top" style={{ background: img ? `center / cover url(${img})` : `linear-gradient(160deg, ${c.color}, color-mix(in oklch, ${c.color}, black 35%))`, justifyItems: 'start', alignContent: 'end', padding: 12 }}>
            {!img && <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0.6 }}><Icon name="user" size={40} /></span>}
            <b style={{ fontSize: 17, position: 'relative', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>{c.name}</b>
            <span style={{ fontSize: 11.5, position: 'relative', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>{c.role}</span>
          </div>
        )}
        <div className="ecard-body">
          <div className="chipset"><span className="chip tnum"><Icon name="film" size={11} />{stat?.scenes ?? 0} 场</span><span className="chip tnum"><Icon name="chat" size={11} />{stat?.lines ?? 0} 句</span>{c.castLocked && <span className="chip">已定角</span>}</div>
          <p>{c.desc || '还没有描述'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
            <button className="btn btn-ghost" style={{ height: 30 }} onClick={onEdit}><Icon name="pen" size={13} />编辑</button>
            <button className="btn btn-ghost" style={{ height: 30 }} onClick={onPortrait}><Icon name="upload" size={13} />{c.portrait ? '换肖像' : '上传肖像'}</button>
            <button className="btn btn-quiet btn-icon" style={{ height: 30, width: 30 }} onClick={onDelete} aria-label={`删除 ${c.name}`}><Icon name="trash" size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

type P = ReturnType<typeof useProject>;

function Relations({ chars, rels, p }: { chars: Character[]; rels: Relation[]; p: P }) {
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [focus, setFocus] = useState<string | null>(null);
  const [editRel, setEditRel] = useState<string | null>(null);
  const [form, setForm] = useState({ a: chars[0]?.id ?? '', b: chars[1]?.id ?? '', label: '' });
  const toast = useToast();

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Stored positions win; new characters are placed on a circle.
  useEffect(() => {
    setPos(Object.fromEntries(chars.map((c, i) => {
      const a = (i / Math.max(1, chars.length)) * Math.PI * 2 - Math.PI / 2;
      return [c.id, c.x || c.y ? { x: c.x, y: c.y } : { x: size.w / 2 - 60 + Math.cos(a) * size.w * 0.3, y: size.h / 2 - 20 + Math.sin(a) * size.h * 0.32 }];
    })));
  }, [chars, size.w, size.h]);

  const center = (cid: string) => { const q = pos[cid]; return q ? { x: q.x + 60, y: q.y + 22 } : { x: 0, y: 0 }; };
  const name = (cid: string) => chars.find((c) => c.id === cid)?.name ?? '?';
  const related = (cid: string) => focus === null || cid === focus || rels.some((r) => (r.a === focus && r.b === cid) || (r.b === focus && r.a === cid));

  function drag(e: RPointerEvent<HTMLButtonElement>, cid: string) {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY;
    const { x: ox, y: oy } = pos[cid]!;
    let moved = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 4) return; // a click, not a drag
      moved = true;
      el.classList.add('dragging');
      setPos((s) => ({ ...s, [cid]: { x: Math.max(0, Math.min(size.w - 120, ox + dx)), y: Math.max(0, Math.min(size.h - 44, oy + dy)) } }));
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.classList.remove('dragging');
      if (moved) setPos((s) => { const q = s[cid]!; void p.update('characters', cid, { x: Math.round(q.x), y: Math.round(q.y) }); return s; });
      else setFocus((f) => (f === cid ? null : cid));
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  }

  async function addRel() {
    if (!form.a || !form.b || form.a === form.b) { toast('请选两个不同的角色'); return; }
    if (!form.label.trim()) return;
    await p.add('relations', { a: form.a, b: form.b, label: form.label.trim() });
    setForm((f) => ({ ...f, label: '' }));
  }

  if (chars.length < 2) return <div className="page dots"><div className="empty-state"><Icon name="users" size={34} /><div>至少要有两个角色，才能画人物关系。</div></div></div>;
  const list = rels.filter((r) => focus === null || r.a === focus || r.b === focus);
  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div ref={stage} className="rel-stage dots" onPointerDown={(e) => { if (e.target === e.currentTarget) setFocus(null); }}>
        <svg className="rel-svg" aria-hidden="true">
          {rels.map((r) => { const a = center(r.a), b = center(r.b); const on = focus === null || r.a === focus || r.b === focus;
            return <line key={r.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={focus === null ? '' : on ? 'hot' : 'dim'} />; })}
        </svg>
        {rels.map((r) => { const a = center(r.a), b = center(r.b); const on = focus === null || r.a === focus || r.b === focus;
          return editRel === r.id ? (
            <input key={r.id} className="rel-tag-in" style={{ left: (a.x + b.x) / 2, top: (a.y + b.y) / 2 }} defaultValue={r.label} autoFocus aria-label="关系"
              onBlur={(e) => { setEditRel(null); if (e.target.value.trim() && e.target.value !== r.label) void p.update('relations', r.id, { label: e.target.value.trim() }); }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditRel(null); }} />
          ) : (
            <button key={r.id} className={`rel-tag${on ? '' : ' dim'}`} style={{ left: (a.x + b.x) / 2, top: (a.y + b.y) / 2 }} title={`${r.note || ''} 点击修改`} onClick={() => setEditRel(r.id)}>{r.label}</button>
          );
        })}
        {chars.map((c) => pos[c.id] && (
          <button key={c.id} className={`rel-node${focus === c.id ? ' on' : ''}${related(c.id) ? '' : ' dim'}`} style={{ left: pos[c.id]!.x, top: pos[c.id]!.y }} onPointerDown={(e) => drag(e, c.id)} aria-pressed={focus === c.id}>
            <span className="avatar" style={{ width: 28, height: 28, background: c.color, fontSize: 12 }}>{c.name.slice(0, 1)}</span><b>{c.name}</b>
          </button>
        ))}
        <div className="muted" style={{ position: 'absolute', left: 16, bottom: 12, fontSize: 11.5 }}>拖动角色调整位置 · 点角色只看 TA 的关系 · 点连线上的字可以改</div>
      </div>
      <aside className="rel-side">
        <b style={{ fontSize: 14 }}>{focus ? `${name(focus)} 的关系（${list.length}）` : `全部关系（${rels.length}）`}</b>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0 14px' }}>
          {list.length === 0 ? <div className="muted" style={{ fontSize: 12.5 }}>还没有关系，在下面添加一条。</div> : list.map((r) => (
            <div key={r.id} className="card" style={{ padding: '8px 10px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ flex: 1 }}><b>{name(r.a)} — {name(r.b)}</b> · {r.label}</span>
              <button className="btn btn-quiet btn-icon" style={{ width: 26, height: 26 }} aria-label="删除这条关系" onClick={() => void p.remove('relations', r.id)}><Icon name="trash" size={12} /></button>
            </div>
          ))}
        </div>
        <form className="card" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }} onSubmit={(e) => { e.preventDefault(); void addRel(); }}>
          <b style={{ fontSize: 12.5 }}>添加关系</b>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['a', 'b'] as const).map((k) => (
              <select key={k} className="input" style={{ height: 34, fontSize: 13 }} aria-label={k === 'a' ? '角色一' : '角色二'} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}>
                {chars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ))}
          </div>
          <input className="input" style={{ height: 34, fontSize: 13 }} placeholder="关系，比如：秘密朋友" aria-label="关系" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          <button className="btn btn-primary" style={{ height: 32 }} disabled={!form.label.trim()}><Icon name="plus" size={13} />添加</button>
        </form>
      </aside>
    </div>
  );
}

function Casting({ projectId, chars, p }: { projectId: string; chars: Character[]; p: P }) {
  const toast = useToast();
  if (!chars.length) return <div className="page"><div className="empty-state"><Icon name="users" size={34} /><div>先新建角色，再来定配音和形象。</div></div></div>;
  return (
    <div className="page" style={{ padding: '20px 28px' }}>
      <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>为每个角色定下配音和形象参考。定角后，制作阶段会用这里的选择。</p>
      <table className="tb">
        <thead><tr><th>角色</th><th>配音 / 音色</th><th>形象参考</th><th style={{ width: 120 }}>状态</th></tr></thead>
        <tbody>
          {chars.map((c) => (
            <tr key={c.id}>
              <td><span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Avatar projectId={projectId} c={c} /><span><b>{c.name}</b><br /><span className="muted" style={{ fontSize: 12 }}>{c.role}</span></span></span></td>
              <td><input className="input" style={{ height: 34, fontSize: 13 }} defaultValue={c.voice} placeholder="例如：童声 · 清亮 · 带京腔" aria-label={`${c.name} 的配音`} disabled={c.castLocked}
                onBlur={(e) => { if (e.target.value !== c.voice) void p.update('characters', c.id, { voice: e.target.value.trim() }); }} /></td>
              <td><button className="btn btn-ghost" style={{ height: 32 }} disabled={c.castLocked}
                onClick={async () => { const f = await window.api.files.pickImage(projectId); if (f) await p.update('characters', c.id, { portrait: f }); }}><Icon name="upload" size={13} />{c.portrait ? '更换' : '上传'}</button></td>
              <td>
                <button className={`btn ${c.castLocked ? 'btn-ghost' : 'btn-primary'}`} style={{ height: 32 }}
                  onClick={async () => {
                    if (!c.castLocked && !c.voice.trim()) { toast(`先给 ${c.name} 填写配音`); return; }
                    await p.update('characters', c.id, { castLocked: !c.castLocked });
                    toast(c.castLocked ? `${c.name} 改为待定` : `${c.name} 已定角`);
                  }}>{c.castLocked ? '改选' : '定角'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
