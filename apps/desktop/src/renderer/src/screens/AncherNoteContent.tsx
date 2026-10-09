import { Fragment, type ReactNode } from 'react';
import type { AncherNoteContent } from '@scripter/agent';
import { getSourceEmbedUrl } from '../lib/note-source.ts';
import { Markdown } from '../lib/markdown.tsx';

/** Only note-scoped image references resolved by the main process become images. */
export function AncherMarkdown({ text, imageUrls, onMediaError }: { text: string; imageUrls: Record<string, string>; onMediaError?: () => void }) {
  const parts: ReactNode[] = [];
  const pattern = /!\[([^\]]*)\]\(streamify-file:\/\/([a-zA-Z0-9-]+)\)/g;
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > offset) parts.push(<Markdown key={`text-${offset}`} text={text.slice(offset, match.index)} />);
    const url = imageUrls[match[2]!];
    parts.push(url ? <img className="cloud-note-image" key={`image-${match.index}`} src={url} alt={match[1] || '笔记图片'} loading="lazy" crossOrigin="anonymous" onError={onMediaError} /> : <p className="muted" key={`image-${match.index}`}>图片暂时无法加载，请刷新重试</p>);
    offset = match.index + match[0].length;
  }
  if (offset < text.length) parts.push(<Markdown key={`text-${offset}`} text={text.slice(offset)} />);
  return <>{parts.map((part, i) => <Fragment key={i}>{part}</Fragment>)}</>;
}

type ViewerProps = { content: AncherNoteContent; fileId: string; onSelect: (id: string) => void; onMediaError: () => void };

/** Ancher UrlSourceViewer: source preview followed directly by provider transcript. */
export function AncherOriginalViewer(props: ViewerProps) {
  const { content, onSelect } = props;
  const { sourceUrl } = content.note;
  if (!sourceUrl) return <OriginalFiles {...props} />;
  const embedUrl = getSourceEmbedUrl(sourceUrl);
  const transcript = content.originals.find((file) => file.id === content.transcriptId);
  const otherFiles = content.originals.filter((file) => file.id !== content.transcriptId && !(embedUrl && file.mime.startsWith('video/')));
  return <div className="cloud-source-viewer">
    <section className="cloud-preview-card" aria-label="原文预览">
      <div className="cloud-preview-header"><span>原文预览</span><a href={sourceUrl} target="_blank" rel="noopener noreferrer">打开 ↗</a></div>
      {embedUrl ? <iframe className="cloud-source-embed" title="YouTube 原文视频" src={embedUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen sandbox="allow-scripts allow-same-origin allow-presentation" referrerPolicy="strict-origin-when-cross-origin" />
        : <a className="cloud-source-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">{content.note.thumbnail && <img src={content.note.thumbnail} alt="" />}<span>打开原文 ↗</span></a>}
    </section>
    <section className="cloud-preview-card" aria-label="转录">
      <div className="cloud-preview-header"><span>转录</span>{transcript && <button onClick={() => onSelect(transcript.id)}>重新加载</button>}</div>
      <div className="cloud-transcript">{transcript?.error ? <p role="alert" className="err">{transcript.error}</p> : <pre>{transcript?.body?.trim() || '暂无转录内容。'}</pre>}</div>
    </section>
    {otherFiles.length > 0 && <details className="cloud-source-files"><summary>源文件 · {otherFiles.length}</summary><OriginalFiles {...props} content={{ ...content, originals: otherFiles }} /></details>}
  </div>;
}

function OriginalFiles({ content, fileId, onSelect, onMediaError }: ViewerProps) {
  const file = content.originals.find((f) => f.id === fileId) ?? content.originals[0];
  if (!file) return <p className="muted">这条笔记尚无可查看的原文文件。</p>;
  return <>
    {content.originals.length > 1 && <label className="cloud-file-picker">原文文件<select className="input" aria-label="选择原文文件" value={file.id} onChange={(e) => onSelect(e.target.value)}>{content.originals.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}
    <div className="cloud-original-card" key={file.id}>
      {file.error ? <p role="alert" className="err">{file.error}</p>
        : file.body !== undefined ? file.mime === 'text/markdown' ? <AncherMarkdown text={file.body} imageUrls={content.imageUrls} onMediaError={onMediaError} /> : <pre className="cloud-original-text">{file.body}</pre>
        : file.mime.startsWith('video/') ? <video aria-label="原文视频" src={file.url} controls preload="metadata" crossOrigin="anonymous" onError={onMediaError} />
        : file.mime.startsWith('audio/') ? <audio aria-label="原文音频" src={file.url} controls preload="metadata" crossOrigin="anonymous" onError={onMediaError} />
        : file.mime.startsWith('image/') ? <img src={file.url} alt={file.name} crossOrigin="anonymous" onError={onMediaError} />
        : file.mime === 'application/pdf' ? <iframe title="原文 PDF" src={file.url} sandbox="" />
        : <p className="muted">此文件暂不支持内嵌预览，请在 Ancher 官网查看。</p>}
      <div className="cloud-original-footer"><span>{file.name}</span><button className="btn btn-quiet" onClick={() => onSelect(file.id)}>重新加载原文</button></div>
    </div>
  </>;
}
