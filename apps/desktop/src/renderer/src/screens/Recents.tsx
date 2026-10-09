import { useEffect, useState } from 'react';
import type { ProjectMeta } from '../../../shared/ipc.ts';
import type { Route } from '../App.tsx';
import { Icon, Logo, useToast } from '../lib/ui.tsx';

export function Recents({ trash, go }: { trash: boolean; go: (r: Route) => void }) {
  const [items, setItems] = useState<ProjectMeta[]>([]);
  const toast = useToast();
  const reload = () => (trash ? window.api.projects.trashList() : window.api.projects.list()).then(setItems);
  useEffect(() => { void reload(); }, [trash]);
  async function action(p: ProjectMeta, kind: 'remove' | 'restore' | 'purge') {
    if (kind === 'purge' && !confirm(`彻底删除「${p.title}」？此操作不能恢复。`)) return;
    try { await window.api.projects[kind](p.id); await reload(); toast(kind === 'remove' ? '已移入回收站' : kind === 'restore' ? '已恢复项目' : '已彻底删除'); }
    catch (e) { toast(String(e).replace(/^Error invoking remote method '[^']+': Error: /, '')); }
  }
  return <div className="collection-shell"><aside className="collection-nav"><div className="collection-brand"><Logo size={24} /><b>Ancher Scripter</b></div>{([['plus', '新建'], ['home', '最近'], ['doc', '剧本'], ['video', '快速视频 Beta'], ['users', '社区'], ['trash', '回收站']] as const).map(([icon, label]) => <button key={label} aria-current={(label === '回收站' ? trash : label === '最近' && !trash) ? 'page' : undefined} onClick={() => { if (label === '新建') go({ name: 'home' }); else if (label === '回收站') go({ name: 'recents', trash: true }); else if (label === '快速视频 Beta' || label === '社区') toast(`${label}即将推出`); else go({ name: 'recents' }); }}><Icon name={icon} size={15} />{label}</button>)}<span className="grow" /><div className="collection-status card">项目保存在这台电脑上<br /><small>请定期导出备份</small></div><button onClick={() => go({ name: 'settings', back: { name: 'recents', trash } })}><Icon name="gear" size={15} />设置</button></aside><section className="collection-main"><div className="topbar drag"><b>{trash ? '回收站' : '最近'}</b></div><div className="page">{trash && <p className="muted">删除的项目保存在这里，可以恢复。</p>}<div className="recent-grid">
    {!trash && <><button className="card recent" onClick={() => go({ name: 'home' })}><Icon name="plus" size={22} />新建剧本<small className="muted">写出专业、结构清晰的剧本</small></button><button className="card recent" aria-disabled="true" onClick={() => toast('快速视频专属流程即将推出')}><Icon name="video" size={22} />新建快速视频<small className="muted">Beta · 即将推出</small></button></>}
    {items.map((p) => <div className="card recent" data-project-id={p.id} key={p.id}><button className="linkish" disabled={trash} onClick={() => go({ name: 'project', id: p.id, tab: 'write' })}><b>{p.title}</b></button><span className="muted">{p.words} 字 · {new Date(p.updatedAt).toLocaleDateString('zh-CN')}</span><div style={{ display: 'flex', gap: 8 }}>{trash ? <><button className="btn btn-ghost" onClick={() => void action(p, 'restore')}>恢复</button><button className="btn btn-quiet" onClick={() => void action(p, 'purge')}>彻底删除</button></> : <button className="btn btn-quiet" aria-label={`删除 ${p.title}`} onClick={() => void action(p, 'remove')}>移入回收站</button>}</div></div>)}
  </div>{!items.length && <p className="muted">{trash ? '回收站为空' : '还没有项目'}</p>}</div></section></div>;
}
