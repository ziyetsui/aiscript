// World-building (prototype P10 / laper /world): a reorderable table of contents, official templates, editable setting cards.
import { useState } from 'react';
import { WORLD_TEMPLATES, type WorldSetting } from '@scripter/core/script';
import { PageHead } from '../components/Drawer.tsx';
import { useProject } from '../lib/project.ts';
import { Icon, useToast } from '../lib/ui.tsx';
import type { IconName } from '../lib/icon-paths.ts';

const TPL_ICON: Record<string, IconName> = { short: 'video', feature: 'film', series: 'spark' };

export function World({ id }: { id: string }) {
  const p = useProject(id);
  const toast = useToast();
  const [dragId, setDragId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const st = p.st;
  if (!st) return null;
  const sets = st.bible.world;

  async function add() {
    const s = await p.add('world', { title: '', value: '' });
    setFocusId(s.bible.world.at(-1)?.id ?? null);
  }

  async function apply(t: (typeof WORLD_TEMPLATES)[number]) {
    const missing = t.fields.filter((f) => !sets.some((s) => s.title === f));
    for (const f of missing) await p.add('world', { title: f, value: '' });
    toast(missing.length ? `已套用「${t.name}」模版，新增 ${missing.length} 个设定` : `「${t.name}」的设定都已经在了`);
  }

  function jump(s: WorldSetting) {
    const el = document.getElementById(`ws-${s.id}`);
    el?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    el?.querySelector('textarea')?.focus({ preventScroll: true });
  }

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <aside className="side-list">
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 4px 10px' }}><b style={{ flex: 1 }}>世界观</b>
          <button className="btn btn-quiet btn-icon" style={{ width: 28, height: 28 }} aria-label="添加设定" onClick={() => void add()}><Icon name="plus" size={15} /></button></div>
        <ol className="toc">
          {sets.map((s, i) => (
            <li key={s.id} draggable onDragStart={(e) => { setDragId(s.id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (dragId && dragId !== s.id) void p.move('world', dragId, i); setDragId(null); }}
              className={dragId === s.id ? 'dragging' : ''}>
              <span className="grip" aria-hidden="true">⋮⋮</span><span className="tnum muted">{i + 1}</span>
              <button onClick={() => jump(s)}>{s.title || '未命名设定'}</button>
            </li>
          ))}
        </ol>
      </aside>
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PageHead title="设定" count={sets.length} right={<button className="btn btn-primary" style={{ height: 30 }} onClick={() => void add()}><Icon name="plus" size={13} />添加设定</button>} />
        <div className="page" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="muted" style={{ fontSize: 12.5 }}>官方模版</div>
          <div className="tpls">
            {WORLD_TEMPLATES.map((t) => {
              const used = t.fields.filter((f) => sets.some((s) => s.title === f)).length;
              return (
                <button key={t.id} className="card tpl" onClick={() => void apply(t)}>
                  <span className="muted" style={{ fontSize: 12 }}>{t.sub}</span>
                  <b className="display" style={{ fontSize: 24 }}>{t.name}</b>
                  <span className="tpl-art" aria-hidden="true"><Icon name={TPL_ICON[t.id] ?? 'book'} size={56} /></span>
                  <span className="tpl-meta"><span>作者<br /><b>Ancher</b></span><span>字段<br /><b className="tnum">{t.fields.length}</b></span><span>类型<br /><b>官方</b></span><span>已用<br /><b className="tnum">{used}/{t.fields.length}</b></span></span>
                </button>
              );
            })}
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>设定</div>
          {sets.length === 0 ? <div className="card empty">还没有设定。套用一个模版，或者点「添加设定」。AI 写作时会遵守这里的设定。</div> : (
            <div className="sets">
              {sets.map((s) => <SettingCard key={s.id} s={s} autoFocus={s.id === focusId}
                onChange={(patch) => void p.update('world', s.id, patch)} onDelete={() => void p.remove('world', s.id)} />)}
            </div>
          )}
          <Library p={p} />
        </div>
      </section>
    </div>
  );
}

/** Rules and humor examples gathered by the ⚡ workflows (spec §1.1: 规则库 / 正反例库). */
function Library({ p }: { p: ReturnType<typeof useProject> }) {
  const b = p.st!.bible;
  return (
    <>
      <div className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>规则库 · 导演确认过的规则，AI 写作时必须遵守</div>
      {b.rules.length === 0 ? <div className="card empty">还没有规则。用「⚡ 导演意见 → 规则」把批注整理进来。</div> : (
        <div className="card" style={{ padding: 4 }}><table className="tb"><tbody>
          {b.rules.map((r) => (
            <tr key={r.id}>
              <td style={{ width: 70 }}><span className="chip">{r.level === 'hard' ? '硬规则' : '偏好'}</span></td>
              <td>{r.text}<div className="muted" style={{ fontSize: 11.5 }}>{r.scope} · 来源：{r.source || '手动'}</div></td>
              <td style={{ width: 120 }}><button className="btn btn-quiet" style={{ height: 26 }} onClick={() => void p.update('rules', r.id, { level: r.level === 'hard' ? 'pref' : 'hard' })}>改为{r.level === 'hard' ? '偏好' : '硬规则'}</button></td>
              <td style={{ width: 40 }}><button className="btn btn-quiet btn-icon" style={{ width: 26, height: 26 }} aria-label={`删除规则 ${r.text}`} onClick={() => void p.remove('rules', r.id)}><Icon name="trash" size={12} /></button></td>
            </tr>
          ))}
        </tbody></table></div>
      )}
      {b.jokes.length > 0 && (
        <>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>正反例 · 好笑 / 不好笑</div>
          <div className="chipset">{b.jokes.map((j) => (
            <span key={j.id} className="chip" title={j.mechanism} style={{ height: 'auto', padding: '4px 10px', color: j.verdict === 'good' ? 'var(--success)' : 'var(--danger)' }}>
              {j.verdict === 'good' ? '好笑' : '不好笑'}：{j.text}
              <button aria-label="删除这条例子" onClick={() => void p.remove('jokes', j.id)}><Icon name="x" size={11} /></button>
            </span>
          ))}</div>
        </>
      )}
    </>
  );
}

function SettingCard({ s, autoFocus, onChange, onDelete }: { s: WorldSetting; autoFocus: boolean; onChange: (p: Partial<WorldSetting>) => void; onDelete: () => void }) {
  return (
    <div className="card setting" id={`ws-${s.id}`}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input aria-label="设定名" defaultValue={s.title} placeholder="设定名" autoFocus={autoFocus} style={{ flex: 1 }}
          onBlur={(e) => { if (e.target.value !== s.title) onChange({ title: e.target.value.trim() }); }} />
        <button className="btn btn-quiet btn-icon" style={{ width: 26, height: 26 }} aria-label={`删除设定 ${s.title}`} onClick={onDelete}><Icon name="trash" size={12} /></button>
      </div>
      <textarea aria-label={s.title || '设定内容'} defaultValue={s.value} placeholder="在此填写…" onBlur={(e) => { if (e.target.value !== s.value) onChange({ value: e.target.value }); }} />
    </div>
  );
}
