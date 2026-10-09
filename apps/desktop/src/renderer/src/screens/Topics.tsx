import { useState, type FormEvent } from 'react';
import type { Topic } from '@scripter/core/script';
import { PageHead, Tabs } from '../components/Drawer.tsx';
import { useProject } from '../lib/project.ts';
import { Icon } from '../lib/ui.tsx';

type Filter = 'all' | Topic['status'];
const STATUS = { idea: '待定', picked: '已选', dropped: '已否' } as const;

export function Topics({ id }: { id: string }) {
  const p = useProject(id);
  const [filter, setFilter] = useState<Filter>('all');
  if (!p.st) return null;
  const topics = p.st.bible.topics;
  const visible = topics.filter((t) => filter === 'all' || t.status === filter);
  return (
    <>
      <PageHead title="选题池" count={topics.length} />
      <section className="page topics-page" aria-label="选题池">
        <div className="topics-toolbar">
          <p className="muted">收集灵感，选出值得展开的故事。</p>
          <Tabs label="选题状态" value={filter} onChange={setFilter}
            options={ [['all', '全部'], ['idea', '待定'], ['picked', '已选'], ['dropped', '已否']] } />
        </div>
        {visible.length ? (
          <div className="topics-grid">
            {visible.map((t) => <TopicCard key={t.id} topic={t} onChange={(patch) => p.update('topics', t.id, patch).then(() => {})} />)}
          </div>
        ) : (
          <div className="topics-empty">
            <Icon name="bulb" size={32} />
            <h2>{topics.length ? `还没有${STATUS[filter as Topic['status']]}选题` : '还没有选题'}</h2>
            <p>{topics.length ? '可以切换到其他状态查看。' : '在 AI 对话中使用「今日热点选题」，把喜欢的故事加入这里。'}</p>
          </div>
        )}
      </section>
    </>
  );
}

function TopicCard({ topic: t, onChange }: { topic: Topic; onChange: (patch: Partial<Topic>) => Promise<void> }) {
  const [reason, setReason] = useState(t.reason);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function change(patch: Partial<Topic>) {
    setBusy(true); setError('');
    try { await onChange(patch); if (patch.reason !== undefined) setReason(patch.reason); }
    catch { setError('保存失败，请重试。'); }
    finally { setBusy(false); }
  }
  function reject(e: FormEvent) { e.preventDefault(); void change({ status: 'dropped', reason: reason.trim() }); }
  return (
    <article className="card topic-card" aria-label={t.title} aria-busy={busy}>
      <header className="topic-card-head">
        <h2>{t.title}</h2>
        <span className="chip topic-status" data-status={t.status}>{STATUS[t.status]}</span>
      </header>
      <p className="topic-logline">{t.logline}</p>
      {t.why && <div className="topic-rationale"><span>推荐理由</span><p>{t.why}</p></div>}
      {t.status === 'dropped' && t.reason && <p className="topic-reason">否掉的原因：{t.reason}</p>}
      <footer className="topic-card-actions">
        <div className="topic-decision">
          {t.status !== 'picked' && <button className="btn btn-ghost" disabled={busy} onClick={() => void change({ status: 'picked' })}><Icon name="check" size={14} />选这个</button>}
          {t.status !== 'idea' && <button className="btn btn-quiet" disabled={busy} onClick={() => void change({ status: 'idea', reason: '' })}>恢复待定</button>}
        </div>
        {t.status !== 'dropped' && <form className="topic-reject" onSubmit={reject}>
          <input className="input" aria-label="否掉的原因" placeholder="否掉的原因（选填）" value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)} />
          <button className="btn btn-quiet" disabled={busy}>否掉</button>
        </form>}
        {error && <p className="err" role="alert">{error}</p>}
      </footer>
    </article>
  );
}
