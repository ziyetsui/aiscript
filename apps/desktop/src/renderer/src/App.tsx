import { useCallback, useEffect, useState } from 'react';
import type { KeyStatus, LicenseStatus } from '../../shared/ipc.ts';
import { Activate } from './screens/Activate.tsx';
import { Characters } from './screens/Characters.tsx';
import { Home } from './screens/Home.tsx';
import { KeysSetup } from './screens/Keys.tsx';
import { Knowledge } from './screens/Knowledge.tsx';
import { Recents } from './screens/Recents.tsx';
import { Production } from './screens/Production.tsx';
import { Locations } from './screens/Locations.tsx';
import { Props } from './screens/Props.tsx';
import { Settings } from './screens/Settings.tsx';
import { Workspace } from './screens/Workspace.tsx';
import { World } from './screens/World.tsx';
import type { IconName } from './lib/icon-paths.ts';
import { Icon, Logo } from './lib/ui.tsx';

export type Tab = 'write' | 'production' | 'characters' | 'locations' | 'props' | 'world' | 'knowledge';
export type Route = { name: 'home' } | { name: 'recents'; trash?: boolean } | { name: 'settings'; back?: Route } | { name: 'project'; id: string; tab: Tab; pending?: string; pendingWeb?: boolean; pendingEpisode?: string };

// Same order as the prototype rail (laper): 写作 · 制作 · 角色 · 地点 · 道具 · 世界观 · 知识库.
const TABS: [Tab, IconName, string][] = [['write', 'pen', '写作'], ['production', 'film', '制作'], ['characters', 'users', '角色'], ['locations', 'map', '地点'], ['props', 'box', '道具'], ['world', 'globe', '世界观'], ['knowledge', 'book', '知识库']];

export function App() {
  const [platform, setPlatform] = useState('');
  useEffect(() => { void window.api.app.info().then((i) => setPlatform(i.platform)); }, []);
  const [lic, setLic] = useState<LicenseStatus | null>(null);
  const [keys, setKeys] = useState<KeyStatus | null>(null);
  const [skipKeys, setSkipKeys] = useState(false);
  const [dockHost, setDockHost] = useState<HTMLDivElement | null>(null);
  const [fileId, setFileId] = useState<string>();
  const [dockHidden, setDockHidden] = useState<Record<string, boolean>>(() => { try { return JSON.parse(localStorage.getItem('dock-hidden') || '{}'); } catch { return {}; } });
  const [route, setRoute] = useState<Route>({ name: 'home' });

  const refresh = useCallback(async () => {
    const l = await window.api.license.status();
    setLic(l);
    if (l.state === 'active') setKeys(await window.api.keys.status());
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  if (!lic) return null;
  if (lic.state !== 'active') return <div className={`activation-shell ${platform === 'darwin' ? 'mac-shell' : ''}`}>{platform === 'darwin' && <div className="window-bar drag">Ancher Scripter · 激活</div>}<Activate status={lic} onDone={refresh} /></div>;
  if (!keys) return null;
  if (!keys.ancher && !skipKeys) return <KeysSetup onDone={refresh} onSkip={() => setSkipKeys(true)} />;

  const project = route.name === 'project' ? route : route.name === 'settings' && route.back?.name === 'project' ? route.back : null;
  const nav = (
    <nav className="rail drag" aria-label="导航">
      <div className="no-drag" style={{ marginBottom: 10 }}><Logo size={24} /></div>
      {project && TABS.map(([t, ic, label]) => (
        <button key={t} className="no-drag" title={label} aria-label={label} aria-current={route.name === 'project' && route.tab === t ? 'page' : undefined}
          onClick={() => setRoute({ name: 'project', id: project.id, tab: t })}><Icon name={ic} size={17} /></button>
      ))}
      {!project && <><button className="no-drag" aria-label="新建" onClick={() => setRoute({ name: 'home' })}><Icon name="pen" size={17} /></button><button className="no-drag" aria-label="最近" onClick={() => setRoute({ name: 'recents' })}><Icon name="book" size={17} /></button><button className="no-drag" aria-label="回收站" onClick={() => setRoute({ name: 'recents', trash: true })}><Icon name="trash" size={17} /></button></>}
      <div className="grow" />
      <button className="no-drag" title="设置" aria-label="设置" aria-current={route.name === 'settings' ? 'page' : undefined} onClick={() => setRoute({ name: 'settings', back: route.name === 'settings' ? route.back : route })}><Icon name="gear" size={17} /></button>
      <button className="no-drag" title="返回首页" aria-label="返回首页" aria-current={route.name === 'home' ? 'page' : undefined} onClick={() => setRoute({ name: 'home' })}><Icon name="home" size={17} /></button>
    </nav>
  );

  return (
    <div className={`shell ${platform === 'darwin' ? 'mac-shell' : ''}`}>
      {platform === 'darwin' && <div className="window-bar drag">Ancher Scripter{route.name === 'project' ? ` — ${TABS.find(([t]) => t === route.tab)?.[2]}` : ''}</div>}
      {route.name !== 'home' && route.name !== 'recents' && route.name !== 'settings' && nav}
      <div className="main">
        {route.name === 'home' && <Home keys={keys} go={setRoute} />}
        {route.name === 'recents' && <Recents trash={!!route.trash} go={setRoute} />}
        {route.name === 'settings' && <Settings license={lic} keys={keys} onChange={refresh} go={setRoute} back={route.back} />}
        {/* The writing tab stays mounted while its project is open, so the AI conversation and its undo buttons survive tab switches. */}
        {project && (
          <div className="tab-pane" hidden={!(route.name === 'project' && route.tab === 'write')}>
            <Workspace key={project.id} id={project.id} pending={project.pending} pendingWeb={project.pendingWeb} pendingEpisode={project.pendingEpisode} keys={keys} go={setRoute} dockHost={route.name === 'project' && route.tab !== 'write' && route.tab !== 'production' && !dockHidden[route.tab] ? dockHost : null} pageContext={{ page: route.name === 'project' ? route.tab : 'write', fileId: route.name === 'project' && route.tab === 'knowledge' ? fileId : undefined }} />
          </div>
        )}
        {route.name === 'project' && route.tab !== 'write' && <div className={`content-row ${route.tab === 'knowledge' ? 'knowledge-row' : ''}`}>
          <div className="content-main">        {route.name === 'project' && route.tab === 'characters' && <Characters key={route.id} id={route.id} />}
        {route.name === 'project' && route.tab === 'locations' && <Locations key={route.id} id={route.id} />}
        {route.name === 'project' && route.tab === 'props' && <Props key={route.id} id={route.id} />}
        {route.name === 'project' && route.tab === 'world' && <World key={route.id} id={route.id} />}
        {route.name === 'project' && route.tab === 'knowledge' && <Knowledge key={route.id} id={route.id} onSelect={setFileId} dockOpen={!dockHidden.knowledge} toggleDock={() => setDockHidden((x) => { const n = { ...x, knowledge: !x.knowledge }; localStorage.setItem('dock-hidden', JSON.stringify(n)); return n; })} />}
        {route.name === 'project' && route.tab === 'production' && <Production key={route.id} id={route.id} />}</div>
          <button hidden={route.tab === 'production' || route.tab === 'knowledge'} className="dock-toggle btn btn-quiet" aria-label="切换 AI 对话" onClick={() => setDockHidden((x) => { const n = { ...x, [route.tab]: !x[route.tab] }; try { localStorage.setItem('dock-hidden', JSON.stringify(n)); } catch {} return n; })}><Icon name="chat" size={15} /></button>
          <div className="dock-host" ref={setDockHost} hidden={route.tab === 'production' || !!dockHidden[route.tab]} />
        </div>}
      </div>
    </div>
  );
}
