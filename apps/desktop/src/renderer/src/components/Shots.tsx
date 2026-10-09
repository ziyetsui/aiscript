// Storyboard (分镜, prototype P4 「分镜」 + P6 制作): shots per scene, edited in place; AI 拆镜 goes through the
// normal <ops> path (setShots) so it lands as one undoable turn.
import { useRef } from 'react';
import { SHOT_SIZES, shotsByScene, type Shot } from '@scripter/core/script';
import type { ProjectState } from '../../../shared/ipc.ts';
import { Icon } from '../lib/ui.tsx';

export type SceneShots = ReturnType<typeof shotsByScene>[number];

/** The instruction behind 「AI 拆镜」 for one scene. */
export const shotInstruction = (sc: SceneShots, clip = 0) =>
  `给第 ${sc.n} 场「${sc.heading}」拆分镜：用 setShots（sceneId 是 ${sc.sceneId}），${clip ? `每个镜头 ${clip} 秒左右，` : ''}景别有变化，一句话写清画面和动作。只写分镜，不要改剧本。`;

export function useShots(projectId: string, setSt: (s: ProjectState) => void) {
  const timers = useRef(new Map<string, number>());
  return {
    add: async (sceneId: string) => setSt(await window.api.bible.add(projectId, 'shots', { sceneId, size: '中景', desc: '', dur: 3 })),
    remove: async (s: Shot) => setSt(await window.api.bible.remove(projectId, 'shots', s.id)),
    /** Text edits are debounced; size / duration save at once. */
    update: (s: Shot, patch: Partial<Shot>, debounce = false) => {
      window.clearTimeout(timers.current.get(s.id));
      const go = async () => setSt(await window.api.bible.update(projectId, 'shots', s.id, patch));
      if (debounce) timers.current.set(s.id, window.setTimeout(() => void go(), 400));
      else void go();
    },
  };
}

export function SceneShotList({ sc, projectId, setSt, onAI, busy }: { sc: SceneShots; projectId: string; setSt: (s: ProjectState) => void; onAI: () => void; busy: boolean }) {
  const ops = useShots(projectId, setSt);
  const total = sc.shots.reduce((a, s) => a + s.dur, 0);
  return (
    <section className="shot-scene" aria-label={`第 ${sc.n} 场分镜`}>
      <div className="shot-hd">
        <b className="tnum">{sc.n}.</b><span className="shot-title">{sc.heading || '（未命名场景）'}</span>
        <span className="muted tnum" style={{ fontSize: 12 }}>{sc.shots.length} 个镜头 · {total} 秒</span>
        <button className="btn btn-ghost" style={{ height: 28 }} disabled={busy} onClick={onAI}><Icon name="spark" size={12} />{sc.shots.length ? '重新拆镜' : 'AI 拆镜'}</button>
      </div>
      {sc.shots.length === 0 ? <div className="muted shot-empty">还没有镜头。点「AI 拆镜」，或者手动添加。</div> : (
        <ol className="shot-list">
          {sc.shots.map((s, k) => (
            <li key={s.id} className="shot-row">
              <span className="tnum muted shot-no">{k + 1}</span>
              <button className="chip shot-size" title="点一下切换景别" aria-label={`景别：${s.size}，点击切换`}
                onClick={() => ops.update(s, { size: SHOT_SIZES[(SHOT_SIZES.indexOf(s.size) + 1) % SHOT_SIZES.length]! })}>{s.size}</button>
              <input className="shot-desc" aria-label={`镜头 ${k + 1} 描述`} defaultValue={s.desc} placeholder="镜头描述…" spellCheck={false}
                onChange={(e) => ops.update(s, { desc: e.target.value }, true)} />
              <label className="shot-dur tnum"><input type="number" min={1} max={60} aria-label={`镜头 ${k + 1} 时长（秒）`} defaultValue={s.dur}
                onChange={(e) => { const v = Math.round(+e.target.value); if (v >= 1 && v <= 60) ops.update(s, { dur: v }, true); }} />秒</label>
              <button className="btn btn-quiet btn-icon" style={{ width: 28, height: 28 }} aria-label={`删除镜头 ${k + 1}`} onClick={() => void ops.remove(s)}><Icon name="trash" size={12} /></button>
            </li>
          ))}
        </ol>
      )}
      <button className="btn btn-quiet shot-add" onClick={() => void ops.add(sc.sceneId)}><Icon name="plus" size={12} />添加镜头</button>
    </section>
  );
}

/** Workspace 「分镜」 view: every scene, one after another. */
export function ShotsView({ st, projectId, setSt, onAI, onAll, onExport, busy }: {
  st: ProjectState; projectId: string; setSt: (s: ProjectState) => void; onAI: (sc: SceneShots) => void; onAll: () => void; onExport: () => void; busy: boolean;
}) {
  const scenes = shotsByScene(st.nodes, st.bible.shots);
  if (!scenes.length) return <div className="empty-state" style={{ minHeight: 320 }}><Icon name="film" size={30} /><div>写下第一个场景标题后，就可以按场拆分镜。</div></div>;
  const shots = st.bible.shots.length;
  return (
    <div className="shots-view">
      <div className="shots-bar">
        <span className="muted" style={{ fontSize: 12.5, flex: 1 }}>按场拆镜头。景别点一下切换；描述和时长直接改。共 <span className="tnum">{shots}</span> 个镜头。</span>
        <button className="btn btn-ghost" style={{ height: 30 }} disabled={!shots} onClick={onExport}><Icon name="export" size={13} />导出分镜表</button>
        <button className="btn btn-primary" style={{ height: 30 }} disabled={busy} onClick={onAll}><Icon name="spark" size={13} />全部拆镜</button>
      </div>
      {scenes.map((sc) => <SceneShotList key={sc.sceneId} sc={sc} projectId={projectId} setSt={setSt} onAI={() => onAI(sc)} busy={busy} />)}
    </div>
  );
}
