import { useCallback, useEffect, useState } from 'react';
import type { KeyStatus, LicenseStatus } from '../../shared/ipc.ts';
import { Activate } from './screens/Activate.tsx';
import { Home } from './screens/Home.tsx';
import { KeysSetup } from './screens/Keys.tsx';
import { Settings } from './screens/Settings.tsx';
import { Workspace } from './screens/Workspace.tsx';
import { Icon, Logo } from './lib/ui.tsx';

export type Route = { name: 'home' } | { name: 'settings' } | { name: 'workspace'; id: string; pending?: string };

export function App() {
  const [lic, setLic] = useState<LicenseStatus | null>(null);
  const [keys, setKeys] = useState<KeyStatus | null>(null);
  const [skipKeys, setSkipKeys] = useState(false);
  const [route, setRoute] = useState<Route>({ name: 'home' });

  const refresh = useCallback(async () => {
    const l = await window.api.license.status();
    setLic(l);
    if (l.state === 'active') setKeys(await window.api.keys.status());
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  if (!lic) return null;
  if (lic.state !== 'active') return <Activate status={lic} onDone={refresh} />;
  if (!keys) return null;
  if (!keys.ancher && !skipKeys) return <KeysSetup onDone={refresh} onSkip={() => setSkipKeys(true)} />;

  const nav = (
    <nav className="rail drag" aria-label="导航">
      <div className="no-drag" style={{ marginBottom: 10 }}><Logo size={24} /></div>
      <button className="no-drag" title="创作首页" aria-label="创作首页" aria-current={route.name === 'home' ? 'page' : undefined} onClick={() => setRoute({ name: 'home' })}><Icon name="home" size={17} /></button>
      <button className="no-drag" title="写作" aria-label="写作" aria-current={route.name === 'workspace' ? 'page' : undefined} disabled={route.name !== 'workspace'}><Icon name="pen" size={17} /></button>
      <div className="grow" />
      <button className="no-drag" title="设置" aria-label="设置" aria-current={route.name === 'settings' ? 'page' : undefined} onClick={() => setRoute({ name: 'settings' })}><Icon name="gear" size={17} /></button>
    </nav>
  );

  return (
    <div className="shell">
      {nav}
      <div className="main">
        {route.name === 'home' && <Home keys={keys} go={setRoute} />}
        {route.name === 'workspace' && <Workspace key={route.id} id={route.id} pending={route.pending} keys={keys} go={setRoute} />}
        {route.name === 'settings' && <Settings license={lic} keys={keys} onChange={refresh} />}
      </div>
    </div>
  );
}
