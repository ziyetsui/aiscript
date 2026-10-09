// 制作 (prototype P6 / laper /production): per-scene storyboard + 制作设置. Ancher writes shot lists and image
// prompts; it does not render images (spec 0003 §3 G4, §8), so 「生成画面提示词」 returns text to copy.
import { useState } from 'react';
import { ART_STYLES, shotsByScene, type Production as Prod } from '@scripter/core/script';
import { Drawer, PageHead, Section, Tabs } from '../components/Drawer.tsx';
import { SceneShotList, shotInstruction } from '../components/Shots.tsx';
import { useProject } from '../lib/project.ts';
import { Icon, useToast } from '../lib/ui.tsx';
import { PreviewCard } from './Workspace.tsx';
import { cleanErr } from './Characters.tsx';

const CLIPS = [5, 8, 10, 15] as const;
const STYLE_COLORS = ['oklch(0.58 0.14 45)', 'oklch(0.55 0.06 150)', 'oklch(0.55 0.15 35)', 'oklch(0.42 0.12 265)'];

export function Production({ id }: { id: string }) {
  const p = useProject(id);
  const toast = useToast();
  const [sel, setSel] = useState<string | null>(null);
  const [clip, setClip] = useState<number>(15);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState<{ sceneId: string; local: string; en: string } | null>(null);
  const [prompting, setPrompting] = useState(false);
  const [settings, setSettings] = useState<Prod | null>(null);
  const st = p.st;
  if (!st) return null;
  const scenes = shotsByScene(st.nodes, st.bible.shots);
  const sc = scenes.find((s) => s.sceneId === sel) ?? scenes[0];
  const excerpt = sc ? (() => { const at = st.nodes.findIndex((n) => n.id === sc.sceneId); return st.nodes.slice(at + 1).find((n) => n.type === 'action')?.text ?? ''; })() : '';

  async function aiShots() {
    if (!sc) return;
    setBusy(true);
    try {
      const r = await window.api.ai.write({ reqId: crypto.randomUUID(), projectId: id, instruction: shotInstruction(sc, clip), webSearch: false });
      p.setSt(await window.api.projects.open(id));
      if (r.previewId) { toast('已有分镜的修改等待确认，请查看下面的预览'); return; }
      toast(r.ok ? (r.applied ? `第 ${sc.n} 场已拆好分镜，可在写作页的对话里撤销` : r.narration || '没有生成分镜') : r.message ?? '没有生成分镜');
    } catch (e) { toast(cleanErr(e)); } finally {
      setBusy(false);
    }
  }

  async function scenePrompt() {
    if (!sc) return;
    setPrompting(true);
    try {
      const r = await window.api.ai.scenePrompt(id, sc.sceneId);
      setPrompt({ sceneId: sc.sceneId, ...r });
    } catch (e) {
      toast(cleanErr(e));
    } finally {
      setPrompting(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;
    p.setSt(await window.api.projects.setProduction(id, settings));
    setSettings(null);
    toast('制作设置已保存，之后生成画面提示词都会按它来');
  }

  const pr = st.production;
  return (
    <>
      <PageHead title="制作" count={scenes.length}
        right={<>
          <button className="btn btn-quiet" style={{ height: 30 }} disabled={!st.bible.shots.length} onClick={async () => { const r = await window.api.exporter.save(id, 'shots'); if (r.ok) toast(`已导出到 ${r.path}`); }}><Icon name="export" size={13} />导出分镜表</button>
          <button className="btn btn-ghost" style={{ height: 30 }} onClick={() => setSettings({ ...pr })}><Icon name="gear" size={13} />制作设置</button>
        </>} />
      {st.chat.filter((m) => m.preview?.state === 'open' && m.preview.items.some((it) => it.kind === 'bible' && it.text.startsWith('分镜：'))).map((m) => <div key={m.id} style={{ padding: '12px 24px' }}><PreviewCard m={m} onResolve={async (accept) => { const r = await window.api.ai.resolve(id, m.id, accept); p.setSt(r.state); if (!r.ok) toast(r.message ?? '没有写入'); }} /></div>)}
      {!sc ? (
        <div className="page dots"><div className="empty-state"><Icon name="film" size={34} /><div>剧本里还没有场景。先在写作页写下场景标题，再回来拆分镜。</div></div></div>
      ) : (
        <>
          <div className="prod-strip" role="tablist" aria-label="场景">
            {scenes.map((s) => (
              <button key={s.sceneId} role="tab" className="chip" aria-selected={s.sceneId === sc.sceneId} onClick={() => setSel(s.sceneId)}>
                <span className="tnum">{s.n}.</span> {s.heading || '（未命名场景）'}{s.shots.length > 0 && <span className="muted tnum">· {s.shots.length}</span>}
              </button>
            ))}
          </div>
          <div className="page dots prod-canvas">
            <div className="card prod-shots">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="muted" style={{ fontSize: 12, flex: 1 }}>片段时长</span>
                <Tabs label="片段时长" value={String(clip)} onChange={(v) => setClip(+v)} options={CLIPS.map((c) => [String(c), `${c}s`])} />
              </div>
              <div className="prod-guide muted">@ 提及角色来指导表演；用引号标出要高亮的对白。</div>
              <SceneShotList sc={sc} projectId={id} setSt={p.setSt} busy={busy} onAI={() => void aiShots()} />
              <button className="btn btn-primary" style={{ height: 32 }} disabled={busy} onClick={() => void aiShots()}>
                {busy ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />正在拆镜…</> : <><Icon name="spark" size={13} />AI 分镜</>}
              </button>
            </div>
            <div className="card prod-scene">
              <div className={`prod-frame ${pr.aspect === '9:16' ? 'tall' : ''}`} aria-hidden="true"><Icon name="film" size={20} /><span className="muted">{pr.aspect} · {pr.style}</span></div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <b>{sc.heading}</b>
                {excerpt && <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>{excerpt.length > 80 ? `${excerpt.slice(0, 80)}…` : excerpt}</p>}
                <button className="btn btn-ghost" style={{ height: 30, alignSelf: 'flex-start' }} disabled={prompting} onClick={() => void scenePrompt()}>
                  {prompting ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />生成中…</> : <><Icon name="spark" size={12} />生成画面提示词</>}
                </button>
                {prompt?.sceneId === sc.sceneId && (
                  <div className="prod-prompt">
                    {[['中文', prompt.local], ['English', prompt.en]].filter(([, t]) => t).map(([l, t]) => (
                      <div key={l}>
                        <div style={{ display: 'flex', alignItems: 'center' }}><span className="muted" style={{ fontSize: 11.5, flex: 1 }}>{l}</span>
                          <button className="btn btn-quiet btn-icon" style={{ width: 26, height: 26 }} aria-label={`复制${l}提示词`} onClick={() => { void navigator.clipboard.writeText(t!); toast('已复制'); }}><Icon name="copy" size={12} /></button></div>
                        <p style={{ margin: 0, fontSize: 13 }}>{t}</p>
                      </div>
                    ))}
                    <p className="muted" style={{ fontSize: 11.5, margin: 0 }}>Ancher 只生成提示词，不出图。可以贴到你常用的生图工具里。</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      <Drawer modal open={!!settings} title="制作设置" sub="美术风格是影片的视觉灵魂——每一场、每一张分镜都会遵循它。" cta="确认" onClose={() => setSettings(null)} onSubmit={saveSettings}>
        {settings && (
          <>
            <Section title="画幅"><Tabs label="画幅" value={settings.aspect} onChange={(v) => setSettings({ ...settings, aspect: v })} options={[['16:9', '横屏 16:9'], ['9:16', '竖屏 9:16']]} /></Section>
            <Section title="制作类型"><Tabs label="制作类型" value={settings.kind} onChange={(v) => setSettings({ ...settings, kind: v })} options={[['叙事', '叙事'], ['商业', '商业']]} /></Section>
            <Section title="镜头风格" sub="定义整部片的运镜和质感"><p className="muted" style={{ fontSize: 12 }}>在镜头描述中填写运镜要求；AI 会结合剧本和美术风格生成提示词。</p></Section>
            <Section title="美术风格">
              <div className="prod-styles" role="radiogroup" aria-label="美术风格">
                {ART_STYLES.map((s, i) => (
                  <button key={s.name} type="button" role="radio" aria-checked={settings.style === s.name} className="card prod-style" onClick={() => setSettings({ ...settings, style: s.name })}>
                    <span className="prod-sw" style={{ background: `linear-gradient(135deg, ${STYLE_COLORS[i]}, color-mix(in srgb, ${STYLE_COLORS[i]}, black 40%))` }} />
                    <b>{s.name}</b><span className="muted">{s.era}</span>
                  </button>
                ))}
              </div>
              <label className="fl" htmlFor="style-note">风格补充（可选）</label>
              <textarea id="style-note" className="input" value={settings.styleNote} onChange={(e) => setSettings({ ...settings, styleNote: e.target.value })} placeholder="例如：暖橙色傍晚光，九十年代北京胡同，手绘质感" />
            </Section>
          </>
        )}
      </Drawer>
    </>
  );
}
