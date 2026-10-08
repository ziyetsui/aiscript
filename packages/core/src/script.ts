// Screenplay element model (spec 0002 §9.4, Phase 3: "9 种元素").
export const ELEMENT_TYPES = [
  'heading', // 场景标题  INT./EXT. 地点 — 时间
  'action', // 动作
  'character', // 角色
  'parenthetical', // 括号
  'dialogue', // 对白
  'transition', // 转场
  'shot', // 镜头
  'note', // 注释
  'subtitle', // 字幕
] as const;
export type ElementType = (typeof ELEMENT_TYPES)[number];

export interface ScriptNode {
  id: string;
  type: ElementType;
  text: string;
}

export const ELEMENT_LABEL: Record<ElementType, string> = {
  heading: '场景',
  action: '动作',
  character: '角色',
  parenthetical: '括号',
  dialogue: '对白',
  transition: '转场',
  shot: '镜头',
  note: '注释',
  subtitle: '字幕',
};

/** Tab cycles the format of the current line, the way laper and Final Draft do. */
const TAB_CYCLE: ElementType[] = ['action', 'character', 'parenthetical', 'dialogue', 'transition', 'heading'];
export function nextTypeOnTab(t: ElementType, back = false): ElementType {
  const i = TAB_CYCLE.indexOf(t);
  const n = TAB_CYCLE.length;
  return TAB_CYCLE[i < 0 ? 0 : (i + (back ? n - 1 : 1)) % n] ?? 'action';
}

/** The element that naturally follows when the writer presses Enter at the end of a line. */
export function nextTypeOnEnter(t: ElementType): ElementType {
  switch (t) {
    case 'heading': return 'action';
    case 'character': return 'dialogue';
    case 'parenthetical': return 'dialogue';
    case 'dialogue': return 'character';
    case 'transition': return 'heading';
    default: return 'action';
  }
}

/** Light auto-format: uppercase-ish conventions don't apply to Chinese, so only normalise obvious prefixes. */
export function inferType(text: string, fallback: ElementType): ElementType {
  const t = text.trim();
  if (/^(内景|外景|内外景|INT\.|EXT\.|INT\/EXT\.)/i.test(t)) return 'heading';
  if (/^[（(].*[）)]$/.test(t)) return 'parenthetical';
  if (/(切至|叠化|淡出|淡入|CUT TO:|FADE (IN|OUT))[:：]?$/i.test(t)) return 'transition';
  return fallback;
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export interface SceneSummary { index: number; heading: string; characters: string[]; dialogueCount: number; nodeId: string }

export function scenes(nodes: readonly ScriptNode[]): SceneSummary[] {
  const out: SceneSummary[] = [];
  let cur: SceneSummary | null = null;
  for (const n of nodes) {
    if (n.type === 'heading') {
      cur = { index: out.length + 1, heading: n.text, characters: [], dialogueCount: 0, nodeId: n.id };
      out.push(cur);
    } else if (cur && n.type === 'character' && !cur.characters.includes(n.text.trim())) cur.characters.push(n.text.trim());
    else if (cur && n.type === 'dialogue') cur.dialogueCount++;
  }
  return out;
}

/** Character count used for the "控字数" guardrail (spec §5.6 ⌥6): CJK chars + latin words. */
export function wordCount(nodes: readonly ScriptNode[]): number {
  let n = 0;
  for (const { text } of nodes) {
    n += (text.match(/[㐀-鿿]/g) ?? []).length;
    n += (text.replace(/[㐀-鿿]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  }
  return n;
}
