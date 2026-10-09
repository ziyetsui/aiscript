// Users bring their own Ancher key (required for AI) and optional Gemini key (spec 0002 §5.5, D2, D11).
import type { GeminiService } from '../../../shared/ipc.ts';
import { useState, type FormEvent } from 'react';
import { Icon, Logo, useToast } from '../lib/ui.tsx';

export function KeyForm({ which, onSaved, compact, geminiService = 'ai-studio' }: { which: 'ancher' | 'gemini'; onSaved: () => void; compact?: boolean; geminiService?: GeminiService }) {
  const [service, setService] = useState<GeminiService>(geminiService);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const label = which === 'ancher' ? 'Ancher API key' : 'Gemini API key（可选）';

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setBusy(true);
    setError('');
    try {
      const r = which === 'ancher' ? await window.api.keys.setAncher(key) : await window.api.keys.setGemini(key, service);
      if (r.ok) { setKey(''); toast(which === 'ancher' ? `已连接 Ancher${r.account ? ` · ${r.account}` : ''}` : 'Gemini key 已保存'); onSaved(); }
      else setError(r.message);
    } catch {
      setError('保存失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="field" onSubmit={submit}>
      {which === 'gemini' && <>
        <label htmlFor="gemini-service">Gemini 服务</label>
        <select id="gemini-service" className="input" value={service} disabled={busy} onChange={e => { setService(e.target.value as GeminiService); setError(''); }}>
          <option value="ai-studio">Google AI Studio</option>
          <option value="google-cloud">Google Cloud（GCP API key）</option>
        </select>
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>{service === 'google-cloud' ? '使用 Google Cloud 的 API key。验证会发送一次简短请求；视频在本机提取音频后分段转写。' : '使用 Google AI Studio 的 API key，音视频通过 Google Files API 转写。'}</p>
      </>}
      <label htmlFor={`k-${which}`}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input id={`k-${which}`} className="input" type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" spellCheck={false} data-1p-ignore aria-invalid={!!error} placeholder={which === 'ancher' ? '在 ancher.ai → 设置 → API 密钥 里创建' : service === 'google-cloud' ? '粘贴 Google Cloud API key' : 'Google AI Studio 里创建'} />
        <button className="btn btn-primary" disabled={busy || !key.trim()} style={{ height: 40 }}>{busy ? <span className="spinner" /> : compact ? '保存' : '验证并保存'}</button>
      </div>
      {error && <div className="err" role="alert"><Icon name="x" size={13} />{error}</div>}
    </form>
  );
}

export function KeysSetup({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  return (
    <div className="act" style={{ gridTemplateColumns: '1fr' }}>
      <div className="act-form" style={{ margin: '0 auto' }}>
        <Logo size={36} />
        <div>
          <h1 className="display" style={{ fontSize: 28 }}>连接 Ancher</h1>
          <p className="muted" style={{ margin: '6px 0 0' }}>AI 写作用的是你自己的 Ancher key，积分在 ancher.ai 账户里结算。key 只保存在这台电脑的系统钥匙串里。</p>
        </div>
        <KeyForm which="ancher" onSaved={onDone} />
        <button className="btn btn-quiet" style={{ alignSelf: 'flex-start' }} onClick={onSkip}>稍后再填，先写剧本</button>
      </div>
    </div>
  );
}
