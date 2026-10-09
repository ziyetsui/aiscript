// Settings (prototype P8): activation, keys, data. No usage anywhere (spec 0002 §7).
import { useEffect, useState } from 'react';
import { SCRIPT_FONTS, applyFont, currentFont, type ScriptFont } from '../lib/editor-font.ts';
import { bell, setSound, setVolume, soundOn, soundVolume } from '../lib/typewriter.ts';
import type { KeyStatus, LicenseStatus, UpdateStatus } from '../../../shared/ipc.ts';
import { LocalData } from './LocalData.tsx';
import { KeyForm } from './Keys.tsx';
import type { Route } from '../App.tsx';
import { Icon, useToast } from '../lib/ui.tsx';

export function Settings({ license, keys, onChange, go, back }: { license: Extract<LicenseStatus, { state: 'active' }>; keys: KeyStatus; onChange: () => void; go: (r: Route) => void; back?: Route }) {
  const toast = useToast();
  const [ver, setVer] = useState('');
  const [up, setUp] = useState<UpdateStatus>({ state: 'idle' });
  const [typing, setTyping] = useState(() => localStorage.getItem('script-typing') !== 'false');
  const [defaultExport, setDefaultExport] = useState(() => localStorage.getItem('script-default-export') || 'pdf');
  const [font, setFont] = useState<ScriptFont>(currentFont());
  const [sound, setSoundOn] = useState(soundOn());
  const [vol, setVol] = useState(soundVolume());
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  useEffect(() => {
    void window.api.app.info().then((i) => setVer(i.version));
    void window.api.update.status().then(setUp);
    void window.api.app.getTheme().then(setTheme);
    return window.api.update.onStatus(setUp);
  }, []);
  async function clear(which: 'ancher' | 'gemini') {
    await window.api.keys.clear(which);
    toast(which === 'ancher' ? '已移除 Ancher key' : '已移除 Gemini key');
    onChange();
  }
  async function deactivate() {
    if (!confirm('确定在这台电脑上取消激活吗？本地剧本不会删除，但需要重新输入激活码才能继续使用。')) return;
    await window.api.license.deactivate();
    onChange();
  }
  return (
    <div className="collection-shell"><aside className="collection-nav"><b style={{ padding: '6px 12px', fontSize: 18 }}>设置</b>{['激活与授权', '模型与密钥', '外观', '编辑器', '版本与更新', '项目数据'].map((name, i) => <button key={name} onClick={() => document.querySelectorAll('.settings > section')[i]?.scrollIntoView({ block: 'start' })}>{name}</button>)}<span className="grow" /><button aria-label={back?.name === 'project' ? '写作' : '返回首页'} onClick={() => go(back?.name === 'project' ? { ...back, tab: 'write' } : back ?? { name: 'home' })}><Icon name="home" size={15} />返回</button>{back?.name === 'project' && <button aria-label="返回首页" onClick={() => go({ name: 'home' })}>返回首页</button>}</aside><div className="settings"><h1 style={{ fontSize: 28, margin: '0 0 16px' }}>设置</h1>
        <section className="card">
          <h2 style={{ fontSize: 15 }}>激活与授权</h2>
          <dl className="kv">
            <dt>状态</dt><dd>已激活（{license.via === 'keygen' ? '在线激活' : '手动激活'}）</dd>
            {license.customer && <><dt>授权给</dt><dd>{license.customer}{license.seat ? ` · 第 ${license.seat} 台` : ''}</dd></>}
            <dt>到期</dt><dd>{license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('zh-CN') : '长期有效'}</dd>
            <dt>机器码</dt><dd className="tnum" style={{ fontFamily: 'var(--font-mono)' }}>{license.machineCode}</dd>
          </dl>
          <div><button className="btn btn-ghost" onClick={deactivate}>在这台电脑上取消激活</button></div>
        </section>
        <section className="card">
          <h2 style={{ fontSize: 15 }}>模型与密钥</h2>
          {!keys.encryption && <div className="err">系统钥匙串不可用，暂时无法保存密钥。</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>Ancher：{keys.ancher ? <span className="ok">已连接{keys.ancherAccount ? ` · ${keys.ancherAccount}` : ''}</span> : <span className="muted">未填写（AI 写作需要）</span>}</span>
            {keys.ancher && <button className="btn btn-quiet" onClick={() => clear('ancher')}>移除</button>}
          </div>
          <KeyForm which="ancher" onSaved={onChange} compact />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ flex: 1 }}>Gemini：{keys.gemini ? <span className="ok">已填写 · {keys.geminiService === 'google-cloud' ? 'Google Cloud' : 'AI Studio'}</span> : <span className="muted">未填写（可选，用于视频转写）</span>}</span>
            {keys.gemini && <button className="btn btn-quiet" onClick={() => clear('gemini')}>移除</button>}
          </div>
          <KeyForm key={keys.geminiService} geminiService={keys.geminiService} which="gemini" onSaved={onChange} compact />
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>密钥在本机加密保存，仅用于向对应服务商发起请求。Gemini 转写会将音视频或提取的音频发送给 Google。用量请在服务商账户查看。</p>
        </section>
        <section className="card">
          <h2 style={{ fontSize: 15 }}>外观</h2>
          <div className="seg" role="radiogroup" aria-label="外观" style={{ alignSelf: 'flex-start' }}>
            {([['system', '跟随系统'], ['light', '亮色'], ['dark', '暗色']] as const).map(([k, l]) => (
              <button key={k} role="radio" aria-checked={theme === k} aria-selected={theme === k} onClick={async () => setTheme(await window.api.app.setTheme(k))}>{l}</button>
            ))}
          </div>
        </section><section className="card">
          <h2 style={{ fontSize: 15 }}>编辑器</h2>
          <div className="field">
            <label htmlFor="sf">剧本字体</label>
            <div className="seg" role="radiogroup" aria-label="剧本字体">{(Object.keys(SCRIPT_FONTS) as ScriptFont[]).map((k) => <button key={k} role="radio" aria-checked={font === k} onClick={() => { setFont(k); applyFont(k); }}>{SCRIPT_FONTS[k].label}</button>)}</div>
            <div className="quote" style={{ fontSize: 14 }}>外景 胡同口 — 傍晚　门墩儿：别捏了，它要说话的。</div>
          </div>
          <label className="toggle"><input type="checkbox" checked={typing} onChange={(e) => { setTyping(e.target.checked); localStorage.setItem('script-typing', String(e.target.checked)); }} />AI 剧本逐字生成</label>
          <div className="field"><label>默认导出格式</label><div className="seg" role="radiogroup" aria-label="默认导出格式">{[['pdf', 'PDF'], ['docx', 'Word'], ['fdx', 'Final Draft'], ['fountain', 'Fountain'], ['txt', 'TXT']].map(([v, label]) => <button key={v} role="radio" aria-checked={defaultExport === v} onClick={() => { setDefaultExport(v!); localStorage.setItem('script-default-export', v!); }}>{label}</button>)}</div></div>
          <label className="toggle"><input type="checkbox" checked={sound} onChange={(e) => { setSound(e.target.checked); setSoundOn(e.target.checked); }} />AI 写作时播放打字机音效</label>
          <label className="fl" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>音量
            <input type="range" min={0} max={1} step={0.05} value={vol} disabled={!sound} aria-label="打字机音量" style={{ flex: 1, accentColor: 'var(--primary)' }}
              onChange={(e) => { const v = +e.target.value; setVol(v); setVolume(v); }} onPointerUp={() => bell()} />
            <span className="tnum muted" style={{ width: 36 }}>{Math.round(vol * 100)}%</span></label>
        </section>
        <section className="card">
          <h2 style={{ fontSize: 15 }}>版本与更新</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="tnum" style={{ flex: 1 }}>Ancher Scripter {ver}<span className="muted" style={{ marginLeft: 8, fontSize: 12.5 }}>{
              { idle: '', checking: '正在检查更新…', none: up.message ?? '已是最新版本', downloading: `正在下载 ${up.version ?? ''}（${up.percent ?? 0}%）`, ready: `新版本 ${up.version ?? ''} 已下载`, error: up.message ?? '检查更新失败' }[up.state]
            }</span></span>
            {up.state === 'ready'
              ? <button className="btn btn-primary" onClick={() => void window.api.update.install()}>重启并安装</button>
              : <button className="btn btn-ghost" disabled={up.state === 'checking' || up.state === 'downloading'} onClick={() => void window.api.update.check()}>检查更新</button>}
          </div>
        </section>
        <section className="card">
          <h2 style={{ fontSize: 15 }}>项目数据</h2>
          <LocalData />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={async () => { const r = await window.api.app.diagnostics(); if (r.ok) toast(`已导出诊断包到 ${r.path}`); }}>导出诊断包</button>
          </div>
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>诊断包只含版本信息和错误日志，不含密钥和剧本内容。遇到问题时发给提供者即可。</p>
        </section>
      </div>
    </div>
  );
}
