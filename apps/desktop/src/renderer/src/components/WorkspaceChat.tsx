import { useEffect, useImperativeHandle, useState, type ComponentProps, type Ref, type RefObject, type SetStateAction } from 'react';
import { Composer, Thinking } from './Chat.tsx';

export interface ComposerDraft { set(value: SetStateAction<string>): void }
export interface StreamDraft { reqId: string; text: string; inOps: boolean }

/** Keep keystrokes local; the workspace can still prefill or restore a failed message. */
export function WorkspaceComposer({ draftRef, savedDraft, onSend, ghost, ...props }: Omit<ComponentProps<typeof Composer>, 'value' | 'onChange' | 'onSend'> & { draftRef: Ref<ComposerDraft>; savedDraft: RefObject<string>; onSend: (text: string) => void }) {
  const [value, setValue] = useState(() => savedDraft.current);
  const [dismissedGhost, setDismissedGhost] = useState(false);
  useEffect(() => setDismissedGhost(false), [ghost]);
  const set = (update: SetStateAction<string>) => {
    const next = typeof update === 'function' ? update(savedDraft.current) : update;
    savedDraft.current = next;
    setValue(next);
    if (next) setDismissedGhost(true);
  };
  useImperativeHandle(draftRef, () => ({ set }), []);
  return <Composer {...props} value={value} onChange={set} onSend={() => onSend(savedDraft.current)} ghost={dismissedGhost ? '' : ghost} />;
}

/** Only the live response subscribes to deltas, with at most one visible update per frame. */
export function StreamingThinking({ reqId, savedStream, onContentChange }: { reqId: string; savedStream: RefObject<StreamDraft | null>; onContentChange: () => void }) {
  const [partial, setPartial] = useState(() => savedStream.current?.reqId === reqId ? savedStream.current.text.trim() : '');
  useEffect(() => {
    const buffer = savedStream.current?.reqId === reqId ? savedStream.current : { reqId, text: '', inOps: false };
    savedStream.current = buffer;
    let frame: number | undefined;
    const unsubscribe = window.api.ai.onDelta((delta) => {
      if (delta.reqId !== reqId || buffer.inOps) return;
      buffer.text += delta.text;
      const marker = buffer.text.indexOf('<ops>');
      if (marker >= 0) { buffer.text = buffer.text.slice(0, marker); buffer.inOps = true; }
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => { frame = undefined; setPartial(buffer.text.trim()); });
    });
    return () => { unsubscribe(); if (frame !== undefined) cancelAnimationFrame(frame); };
  }, [reqId, savedStream]);
  useEffect(onContentChange, [partial, onContentChange]);
  return <Thinking partial={partial} />;
}
