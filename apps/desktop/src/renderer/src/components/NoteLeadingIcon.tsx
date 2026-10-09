import { useState } from 'react';
import { Icon } from '../lib/ui.tsx';
import '../lib/note-chat.css';

// Ancher Icons.note = Material Symbols book-4-outline-rounded (official iconography).
const NOTE_PATH = 'M6 22q-1.25 0-2.125-.875T3 19V5q0-1.25.875-2.125T6 2h9q.825 0 1.413.588T17 4v12q0 .825-.587 1.413T15 18H6q-.425 0-.712.288T5 19t.288.713T6 20h13V5q0-.425.288-.712T20 4t.713.288T21 5v15q0 .825-.587 1.413T19 22zm3-6h6V4H9zm-2 0V4H6q-.425 0-.712.288T5 5v11.175q.25-.075.488-.125T6 16zM5 4v12.175z';
export function NoteLeadingIcon({ kind = 'note', status = 'ready', thumbnail }: { kind?: 'note' | 'file' | 'link'; status?: string; thumbnail?: string }) {
  const [failed, setFailed] = useState('');
  const pending = ['queued', 'processing', 'fetched'].includes(status);
  return <span className="note-leading" aria-hidden="true" data-kind={pending ? 'processing' : kind}>
    {pending ? <span className="note-spinner" /> : thumbnail && failed !== thumbnail ? <img src={thumbnail} alt="" onError={() => setFailed(thumbnail)} /> : kind === 'file' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M8 13h8 M8 17h6" /></svg> : kind === 'link' ? <Icon name="globe" size={16} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={NOTE_PATH} /></svg>}
  </span>;
}
