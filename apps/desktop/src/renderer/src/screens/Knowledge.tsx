// Knowledge base (prototype P11 / laper /knowledge): local reference files, kept inside the project folder.
import { useState, type DragEvent } from 'react';
import type { KnowledgeFile } from '@scripter/core/script';
import { PageHead } from '../components/Drawer.tsx';
import { useProject } from '../lib/project.ts';
import { Icon, useToast } from '../lib/ui.tsx';

type Tab = 'all' | 'chat' | 'upload';
const kb = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`);

export function Knowledge({ id }: { id: string }) {
  const p = useProject(id);
  const [tab, setTab] = useState<Tab>('all');
  const [over, setOver] = useState(0);
  const toast = useToast();
  const st = p.st;
  if (!st) return null;
  const files = st.bible.files;
  const list = files.filter((f) => tab === 'all' || f.src === tab);
  const count = (t: Tab) => files.filter((f) => t === 'all' || f.src === t).length;

  function report(r: { added: number; skipped: string[] } | null) {
    if (!r) return;
    if (r.added) toast(`已添加 ${r.added} 个文件，只保存在这台电脑上`);
    if (r.skipped.length) toast(`没有添加：${r.skipped.join('、')}`);
  }

  async function pick() {
    const r = await window.api.files.pick(id);
    if (r) { p.setSt(r.state); report(r); if (tab === 'chat') setTab('upload'); }
  }

  async function drop(e: DragEvent) {
    e.preventDefault();
    setOver(0);
    const paths = [...e.dataTransfer.files].map((f) => window.api.files.pathFor(f)).filter(Boolean);
    if (!paths.length) return;
    const r = await window.api.files.addPaths(id, paths);
    p.setSt(r.state);
    report(r);
  }

  async function remove(f: KnowledgeFile) {
    if (!confirm(`从知识库移除「${f.name}」？项目里保存的副本会一起删除，你电脑上的原文件不受影响。`)) return;
    await p.remove('files', f.id);
    toast(`已移除 ${f.name}`);
  }

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <aside className="side-list">
        <b style={{ display: 'block', padding: '4px 6px 10px' }}>知识</b>
        <div className="side-nav" role="tablist" aria-label="文件来源">
          {([['all', '全部文件'], ['chat', '聊天附件'], ['upload', '直接上传']] as const).map(([t, l]) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{l}<span className="tnum muted">{count(t)}</span></button>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 11.5, margin: '14px 6px 0', lineHeight: 1.6 }}>文件只保存在这台电脑的项目文件夹里。可以放参考剧本、人物小传、导演意见、参考视频。</p>
      </aside>
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}
        onDragEnter={(e) => { e.preventDefault(); setOver((n) => n + 1); }} onDragOver={(e) => e.preventDefault()} onDragLeave={() => setOver((n) => Math.max(0, n - 1))} onDrop={(e) => void drop(e)}>
        <PageHead title="文件" count={list.length} right={<button className="btn btn-primary" style={{ height: 30 }} onClick={() => void pick()}><Icon name="plus" size={13} />添加文件</button>} />
        <div className="page" style={{ padding: '16px 20px' }}>
          {list.length === 0 ? (
            <div className="empty-state">
              <div className="kb-stack" aria-hidden="true"><i /><i /><i /></div>
              <div>{tab === 'chat' ? '在对话里发给 AI 的文件会出现在这里' : '暂无文件'}</div>
              <div style={{ fontSize: 12 }}>把文件拖进来，或点右上角「添加文件」</div>
            </div>
          ) : (
            <div className="kb-list">
              {list.map((f) => (
                <div key={f.id} className="card kb-f">
                  <span className="kb-ic">{(f.name.split('.').pop() ?? '').slice(0, 4).toUpperCase()}</span>
                  <button className="linkish" style={{ flex: 1, minWidth: 0 }} onClick={async () => { const err = await window.api.files.open(id, f.id); if (err) toast(err); }} title="用系统默认程序打开">
                    <b style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</b>
                    <span className="muted tnum" style={{ fontSize: 11.5 }}>{kb(f.size)} · {f.src === 'chat' ? '聊天附件' : '直接上传'} · {new Date(f.addedAt).toLocaleDateString('zh-CN')}</span>
                  </button>
                  <button className="btn btn-quiet btn-icon" style={{ width: 28, height: 28 }} aria-label={`移除 ${f.name}`} onClick={() => void remove(f)}><Icon name="trash" size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={`kb-over${over ? ' on' : ''}`} aria-hidden="true">松开即可添加到知识库</div>
      </section>
    </div>
  );
}
