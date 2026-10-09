import { useEffect, useState } from 'react';
import type { Api } from '../../../shared/ipc.ts';
import { useToast } from '../lib/ui.tsx';
type Info = Awaited<ReturnType<Api['localData']['info']>>;
export function LocalData() {
  const toast = useToast();
  const [info, setInfo] = useState<Info>();
  const [projectId, setProjectId] = useState(''), [backup, setBackup] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const reload = async () => { const r = await window.api.localData.info(); setInfo(r); setProjectId((id) => id || r.projects[0]?.id || ''); };
  useEffect(() => { void reload().catch((e) => setError(String(e))); }, []);
  const selected = info?.projects.find((p) => p.id === projectId);
  async function act(fn: () => Promise<void>) { setBusy(true); setError(''); try { await fn(); await reload(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } }
  return <>
    <p className="muted" style={{ fontSize: 13, margin: 0 }}>对话和剧本自动保存在这台电脑上。覆盖安装新版会继续使用这些数据。每天首次保存及升级时自动备份；恢复会创建副本，保留原项目。</p>
    {info && <><div className="muted" style={{ fontSize: 12, overflowWrap: 'anywhere' }}>数据位置：{info.path}</div><button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => void act(async () => window.api.localData.showFolder())}>打开数据文件夹</button></>}
    {selected && <>
      <label className="field">项目<select aria-label="备份项目" value={projectId} disabled={busy} onChange={(e) => { setProjectId(e.target.value); setBackup(''); }}>{info?.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
      <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => void act(async () => { await window.api.localData.backup(projectId); toast('已创建本地备份'); })}>立即备份此项目</button>
      {selected.backups.length > 0 ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><select aria-label="本地备份" value={backup} disabled={busy} onChange={(e) => setBackup(e.target.value)}><option value="">选择备份</option>{selected.backups.map((b) => <option key={b.name} value={b.name}>{new Date(b.at).toLocaleString('zh-CN')} · {b.reason}</option>)}</select><button className="btn btn-ghost" disabled={!backup || busy} onClick={() => void act(async () => { const p = await window.api.localData.recover(projectId, backup); toast(`已恢复为「${p.title}」，可从最近项目打开`); })}>恢复为副本</button></div> : <span className="muted">尚无备份，下次保存会建立保护。</span>}
    </>}
    {error && <div role="alert" className="err">{error}</div>}
    <p className="muted" style={{ fontSize: 12, margin: 0 }}>数据库备份保护对话与剧本，附件仍在项目文件夹。换电脑或另存含附件的完整备份，请使用「导出 → 整个项目」。</p>
  </>;
}
