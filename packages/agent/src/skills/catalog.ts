import actions from './actions.json';
import sources from './sources.json';

/** Metadata only: renderer imports this entrypoint without the upstream prompt bodies. */
export interface WritingAction {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  skills: string[];
  keywords: string;
}
export const WRITING_ACTIONS: readonly WritingAction[] = actions;
export const WRITING_SOURCES = sources;

export function writingAction(id: string): WritingAction {
  const action = WRITING_ACTIONS.find((a) => a.id === id);
  if (!action) throw new Error(`未知编剧技能：${id}`);
  return action;
}

/** Existing workflows retain their ids, titles, keyboard bindings and result contracts. */
export const WORKFLOW_SKILLS: Record<string, readonly string[]> = {
  directions: ['sw-premise-theme', 'story-planning'],
  restructure: ['sw-story-structure', 'sw-american-case-studies', 'sw-format-adaptation'],
  jokes: ['sw-sitcom-comedy', 'sw-dialogue'],
  drift: ['sw-premise-theme', 'story-review', 'short-drama-review'],
  notes: ['sw-writers-room', 'story-memory'],
  length: ['novel-script', 'sw-scene-craft'],
  transcribe: [], // Uses the app's actual Ancher/Gemini transcription provider.
  topics: ['sw-premise-theme', 'story-short-scan'],
  episode: ['sw-workflow', 'sw-series-structure', 'sw-scene-craft', 'novel-script'],
};

/** Route only the user's instruction, never imported files, script text or the story bible. */
export function inferWritingSkills(instruction: string): string[] {
  const matches = WRITING_ACTIONS.filter((a) => instruction.includes(a.title) || a.keywords.split('|').some((word) => instruction.toLowerCase().includes(word.toLowerCase())));
  // Prefer an exact action name, then the more specific keywords, not the order of broad matches.
  matches.sort((a, b) => {
    const score = (x: WritingAction) => instruction.includes(x.title) ? 100 : Math.max(...x.keywords.split('|').filter((w) => instruction.toLowerCase().includes(w.toLowerCase())).map((w) => w.length));
    return score(b) - score(a);
  });
  return [...new Set(matches.slice(0, 2).flatMap((a) => a.skills))].slice(0, 3);
}

export function filterWritingActions(query: string): readonly WritingAction[] {
  const q = query.trim().toLowerCase();
  return q ? WRITING_ACTIONS.filter((a) => `${a.title} ${a.description} ${a.category} ${a.skills.join(' ')} ${a.keywords}`.toLowerCase().includes(q)) : WRITING_ACTIONS;
}
