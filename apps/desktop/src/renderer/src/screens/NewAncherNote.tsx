import { useEffect, useRef, useState } from 'react';
import type { AncherLibrary } from '@scripter/agent';
import { Icon } from '../lib/ui.tsx';

export function NewAncherNote({ collections, initialCollection, onClose, onCreated }: {
  collections: AncherLibrary['collections']; initialCollection: string; onClose: () => void;
  onCreated: (result: { noteId: string; warning?: string }) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [comment, setComment] = useState('');
  const [collectionId, setCollectionId] = useState(initialCollection);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  const addFiles = (incoming: File[]) => {
    setError('');
    if (files.length + incoming.length > 10) { setError('最多选择 10 个文件'); return; }
    if (incoming.some((f) => !f.size || f.size > 50 * 1024 * 1024)) { setError('文件不能为空，且每个文件最大 50 MB'); return; }
    setFiles((previous) => [...previous, ...incoming]);
  };
  const submit = async () => {
    if (busy || (!text.trim() && !files.length)) return;
    setBusy(true); setError('');
    try {
      const payload = await Promise.all(files.map(async (f) => ({ name: f.name, mime: f.type, bytes: new Uint8Array(await f.arrayBuffer()) })));
      onCreated(await window.api.ancherNotes.create({ text, comment, collectionId, files: payload }));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setBusy(false); }
  };
  return <dialog ref={dialog} className="new-note-dialog" aria-labelledby="new-note-title" onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }} onClick={(e) => { if (e.target === e.currentTarget && !busy) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <header><h2 id="new-note-title">新建笔记</h2><button type="button" className="btn btn-quiet" aria-label="关闭新建笔记" disabled={busy} onClick={onClose}><Icon name="x" /></button></header>
      <div className="new-note-fields">
        <div className="new-note-source" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!busy) addFiles([...e.dataTransfer.files]); }}>
          <textarea autoFocus aria-label="笔记内容" placeholder="粘贴链接、文本，或拖拽文件…" value={text} disabled={busy || !!files.length} onChange={(e) => setText(e.target.value)} />
          {files.length > 0 && <ul className="new-note-files">{files.map((file, index) => <li key={index}><Icon name="doc" /><span>{file.name}</span><button type="button" className="btn btn-quiet" disabled={busy} aria-label={`移除文件 ${file.name}`} onClick={() => setFiles((previous) => previous.filter((_, i) => i !== index))}>×</button></li>)}</ul>}
          <button type="button" className="btn btn-quiet" disabled={busy || !!text.trim()} onClick={() => picker.current?.click()}><Icon name="upload" />选择文件</button>
          <input ref={picker} type="file" multiple hidden onChange={(e) => { addFiles([...e.target.files ?? []]); e.target.value = ''; }} />
        </div>
        <p className="muted">Markdown、文本、图片、音频、视频 · 每个文件最大 50 MB</p>
        <label className="new-note-background">背景与意图 <span className="muted">可选</span><textarea aria-label="背景与意图" placeholder="写下目的、目标，或需要记住的背景…" value={comment} disabled={busy} onChange={(e) => setComment(e.target.value)} /></label>
        <p className="muted">补充一点背景，有助于生成更好的笔记</p>
        {error && <div className="err" role="alert">{error}</div>}
      </div>
      <footer><select aria-label="新笔记合集" value={collectionId} disabled={busy} onChange={(e) => setCollectionId(e.target.value)}><option value="">＋ 合集（可选）</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="submit" className="btn btn-primary" disabled={busy || (!text.trim() && !files.length)}>{busy ? '创建中…' : '创建笔记'}</button></footer>
    </form>
  </dialog>;
}
