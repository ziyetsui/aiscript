// Activation page (spec 0002 §6.2 / §6.3): online code first, manual machine-bound code as fallback.
import { useState, type FormEvent } from 'react';
import type { LicenseStatus } from '../../../shared/ipc.ts';
import { Icon, Logo, useToast } from '../lib/ui.tsx';

export function Activate({ status, onDone }: { status: Extract<LicenseStatus, { state: 'inactive' }>; onDone: () => void }) {
  const [mode, setMode] = useState<'online' | 'manual'>(status.keygenConfigured ? 'online' : 'manual');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(status.reason ?? '');
  const toast = useToast();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    setError('');
    const r = mode === 'online' ? await window.api.license.activateKeygen(value) : await window.api.license.activateOffline(value);
    setBusy(false);
    if (r.ok) { toast('激活成功'); onDone(); } else setError(r.message);
  }

  async function copy() {
    await navigator.clipboard.writeText(status.machineCode);
    toast('机器码已复制，发给提供者即可');
  }

  return (
    <div className="act">
      <div className="act-art drag" role="img" aria-label="Ancher 品牌画作：窗边读书的女子" />
      <form className="act-form no-drag" onSubmit={submit}>
        <Logo size={36} />
        <div>
          <h1 className="display" style={{ fontSize: 30 }}>激活 Ancher Scripter</h1>
          <p className="muted" style={{ margin: '6px 0 0' }}>不需要注册账号。一个激活码只能在一台电脑上使用。</p>
        </div>
        <div className="seg" role="tablist" aria-label="激活方式">
          <button type="button" role="tab" aria-selected={mode === 'online'} onClick={() => { setMode('online'); setError(''); }} disabled={!status.keygenConfigured} title={status.keygenConfigured ? '' : '这个版本没有配置在线激活'}>在线激活</button>
          <button type="button" role="tab" aria-selected={mode === 'manual'} onClick={() => { setMode('manual'); setError(''); }}>手动激活</button>
        </div>
        {mode === 'online' ? (
          <div className="field">
            <label htmlFor="code">激活码</label>
            <input id="code" className="input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="AIS-XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false} aria-invalid={!!error} autoFocus />
            <span className="muted" style={{ fontSize: 12 }}>首次激活需要联网，之后可以离线使用。</span>
          </div>
        ) : (
          <>
            <div className="field">
              <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>本机机器码 · 发给提供者签发激活码</span>
              <div className="mc"><span className="tnum">{status.machineCode}</span><button type="button" className="btn btn-quiet btn-icon" style={{ height: 28 }} onClick={copy} aria-label="复制机器码"><Icon name="copy" size={14} /></button></div>
            </div>
            <div className="field">
              <label htmlFor="code">激活码</label>
              <textarea id="code" className="input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="粘贴以 AIS1- 开头的激活码" spellCheck={false} aria-invalid={!!error} rows={4} style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }} />
            </div>
          </>
        )}
        {error && <div className="err" role="alert"><Icon name="x" size={13} />{error}</div>}
        <button className="btn btn-primary" style={{ height: 40 }} disabled={busy || !value.trim()}>{busy ? <><span className="spinner" />正在激活…</> : '激活'}</button>
      </form>
    </div>
  );
}
