import { useEffect, useState } from 'react';
import type { ProjectMeta } from '../../../shared/ipc.ts';
import type { Route } from '../App.tsx';
import { Icon, Logo, useToast } from '../lib/ui.tsx';
import { PROJECT_NAV, type Tab } from '../lib/project-navigation.ts';

export function Recents({ trash, tab, go }: { trash: boolean; tab?: Tab; go: (r: Route) => void }) {
  const [items, setItems] = useState<ProjectMeta[]>([]);
  const toast = useToast();
  const [opening, setOpening] = useState(false);
  const panel = PROJECT_NAV.find(([id]) => id === tab)?.[2];
  const reload = () => (trash ? window.api.projects.trashList() : window.api.projects.list()).then(setItems);
  useEffect(() => { void reload(); }, [trash]);
  async function openPanel(nextTab: Tab) {
    if (opening) return;
    setOpening(true);
    try {
      const projects = await window.api.projects.list();
      let lastId: string | null = null;
      try { lastId = localStorage.getItem('last-project'); } catch {}
      const project = projects.find((p) => p.id === lastId) ?? projects[0];
      go(project ? { name: 'project', id: project.id, tab: nextTab } : { name: 'recents', tab: nextTab });
    } catch (e) { toast(String(e).replace(/^Error invoking remote method '[^']+': Error: /, '')); }
    finally { setOpening(false); }
  }
  async function action(p: ProjectMeta, kind: 'remove' | 'restore' | 'purge') {
    if (kind === 'purge' && !confirm(`彻底删除「${p.title}」？此操作不能恢复。`)) return;
    try { await window.api.projects[kind](p.id); await reload(); toast(kind === 'remove' ? '已移入回收站' : kind === 'restore' ? '已恢复项目' : '已彻底删除'); }
    catch (e) { toast(String(e).replace(/^Error invoking remote method '[^']+': Error: /, '')); }
  }
  return (
    <div className="collection-shell">
      <aside className="collection-nav" aria-label="项目导航">
        <div className="collection-brand"><Logo size={24} /><b>Ancher Scripter</b></div>
        <button onClick={() => go({ name: 'home' })}><Icon name="plus" size={15} />新建</button>
        <button aria-current={!trash && !tab ? 'page' : undefined} onClick={() => go({ name: 'recents' })}><Icon name="home" size={15} />最近</button>
        {PROJECT_NAV.map(([id, icon, label]) => (
          <button key={id} aria-current={!trash && tab === id ? 'page' : undefined} disabled={opening} onClick={() => void openPanel(id)}>
            <Icon name={icon} size={15} />{label}
          </button>
        ))}
        <button aria-current={trash ? 'page' : undefined} onClick={() => go({ name: 'recents', trash: true })}><Icon name="trash" size={15} />回收站</button>
        <span className="grow" />
        <div className="collection-status card">项目保存在这台电脑上<br /><small>请定期导出备份</small></div>
        <button onClick={() => go({ name: 'settings', back: { name: 'recents', trash, tab } })}><Icon name="gear" size={15} />设置</button>
      </aside>
      <section className="collection-main">
        <div className="topbar drag"><b>{trash ? '回收站' : panel ? `${panel} · 选择项目` : '最近'}</b></div>
        <div className="page">
          {trash && <p className="muted">删除的项目保存在这里，可以恢复。</p>}
          {!trash && panel && <p className="muted">选择一个项目，进入{panel}面板。</p>}
          <div className="recent-grid">
            {!trash && !tab && <button className="card recent" onClick={() => go({ name: 'home' })}><Icon name="plus" size={22} />新建剧本<small className="muted">写出专业、结构清晰的剧本</small></button>}
            {items.map((p) => (
              <div className="card recent" data-project-id={p.id} key={p.id}>
                <button className="linkish" disabled={trash} onClick={() => go({ name: 'project', id: p.id, tab: tab ?? 'write' })}><b>{p.title}</b></button>
                <span className="muted">{p.words} 字 · {new Date(p.updatedAt).toLocaleDateString('zh-CN')}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {trash ? <><button className="btn btn-ghost" onClick={() => void action(p, 'restore')}>恢复</button><button className="btn btn-quiet" onClick={() => void action(p, 'purge')}>彻底删除</button></> : <button className="btn btn-quiet" aria-label={`删除 ${p.title}`} onClick={() => void action(p, 'remove')}>移入回收站</button>}
                </div>
              </div>
            ))}
          </div>
          {!items.length && <p className="muted">{trash ? '回收站为空' : '还没有项目'}</p>}
          {!trash && tab && !items.length && <button className="btn btn-primary" onClick={() => go({ name: 'home' })}>新建项目</button>}
        </div>
      </section>
    </div>
  );
}
