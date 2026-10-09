import type { ChatNoteAttachment } from '../../../shared/ipc.ts';
export function addNoteToChat(projectId: string, note: ChatNoteAttachment) {
  window.dispatchEvent(new CustomEvent('scripter:attach-note', { detail: { projectId, note } }));
}
