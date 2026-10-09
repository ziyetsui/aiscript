import type { ChatNoteAttachment } from '../../../shared/ipc.ts';
export function addNoteToChat(projectId: string, note: ChatNoteAttachment) {
  const detail = { projectId, note, accepted: false };
  window.dispatchEvent(new CustomEvent('scripter:attach-note', { detail }));
  return detail.accepted;
}
