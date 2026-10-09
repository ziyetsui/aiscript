import { useEffect, type RefObject } from 'react';

/** Tab keeps normal focus navigation; Tab in the composer confirms an @ suggestion. */
export function useNoteShortcuts(root: RefObject<HTMLDivElement | null>, search: RefObject<HTMLInputElement | null>, selected: string | undefined, ids: string[], onSelect: (id: string) => void, onAdd: () => void, canAdd: boolean) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!root.current?.offsetParent || e.isComposing || e.keyCode === 229) return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); search.current?.focus(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Enter') { e.preventDefault(); if (canAdd) onAdd(); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      const row = target.closest<HTMLElement>('[data-note-id]');
      if (target !== search.current && !row) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!ids.length) return;
        const index = ids.indexOf(row?.dataset.noteId ?? selected ?? '');
        const next = ids[(index + (e.key === 'ArrowDown' ? 1 : -1) + ids.length) % ids.length]!;
        e.preventDefault(); onSelect(next);
        requestAnimationFrame(() => root.current?.querySelectorAll<HTMLElement>('.note-all [data-note-id]').forEach((el) => { if (el.dataset.noteId === next) { el.focus(); el.scrollIntoView({ block:'nearest' }); } }));
      } else if (e.key === 'Enter' && target === search.current && selected) {
        e.preventDefault(); onSelect(selected);
        root.current?.querySelectorAll<HTMLElement>('.note-all [data-note-id]').forEach((el) => { if (el.dataset.noteId === selected) el.focus(); });
      } else if (e.key === 'Escape' && target === search.current) { search.current.blur(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [root, search, selected, ids.join('\0'), onSelect, onAdd, canAdd]);
}
