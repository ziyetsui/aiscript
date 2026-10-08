// Pure bible model — no Loro import, safe for the renderer.
import type { ScriptNode } from './script.ts';

export interface Character {
  id: string; name: string; role: string; desc: string; color: string;
  look: string; catchphrase: string; want: string; fear: string;
  voice: string; portrait: string; castLocked: boolean; x: number; y: number;
}
export interface Relation { id: string; a: string; b: string; label: string; note: string }
export interface Location { id: string; name: string; ie: '内景' | '外景' | '内外景'; times: string[]; desc: string; visual: string; color: string; image: string }
export interface Prop { id: string; name: string; category: string; color: string; desc: string; visual: string; x: number; y: number }
export interface WorldSetting { id: string; title: string; value: string }
export interface KnowledgeFile { id: string; name: string; size: number; src: 'upload' | 'chat'; file: string; addedAt: number }
/** Director-review rules (spec 0002 §1.1 "审稿与规则库"): pending until a human confirms; hard rules vs preferences. */
export interface Rule { id: string; text: string; scope: string; source: string; level: 'hard' | 'pref'; status: 'pending' | 'active'; addedAt: number }
/** Humor examples marked funny / not funny (正反例库). */
export interface Joke { id: string; text: string; mechanism: string; verdict: 'good' | 'bad'; context: string; addedAt: number }
/** Topic pool (选题池). */
export interface Topic { id: string; title: string; logline: string; why: string; source: string; status: 'idea' | 'picked' | 'dropped'; reason: string; addedAt: number }

export interface Bible {
  characters: Character[]; relations: Relation[]; locations: Location[];
  props: Prop[]; world: WorldSetting[]; files: KnowledgeFile[];
  rules: Rule[]; jokes: Joke[]; topics: Topic[];
}
export type BibleKind = keyof Bible;
export type BibleItem<K extends BibleKind> = Bible[K][number];

export const BIBLE_KINDS: BibleKind[] = ['characters', 'relations', 'locations', 'props', 'world', 'files', 'rules', 'jokes', 'topics'];

export const BIBLE_DEFAULTS: { [K in BibleKind]: Omit<BibleItem<K>, 'id'> } = {
  characters: { name: '', role: '', desc: '', color: 'oklch(0.58 0.14 45)', look: '', catchphrase: '', want: '', fear: '', voice: '', portrait: '', castLocked: false, x: 0, y: 0 },
  relations: { a: '', b: '', label: '', note: '' },
  locations: { name: '', ie: '外景', times: ['日'], desc: '', visual: '', color: 'oklch(0.55 0.06 150)', image: '' },
  props: { name: '', category: '', color: 'oklch(0.36 0.07 160)', desc: '', visual: '', x: 40, y: 40 },
  world: { title: '', value: '' },
  files: { name: '', size: 0, src: 'upload', file: '', addedAt: 0 },
  rules: { text: '', scope: '全剧', source: '', level: 'hard', status: 'pending', addedAt: 0 },
  jokes: { text: '', mechanism: '', verdict: 'good', context: '', addedAt: 0 },
  topics: { title: '', logline: '', why: '', source: '', status: 'idea', reason: '', addedAt: 0 },
};

/** Find a character by name (the script stores names, not ids). */
export function findByName<T extends { name: string }>(items: readonly T[], name: string): T | undefined {
  const n = name.trim();
  return items.find((x) => x.name.trim() === n);
}

/** How often each character speaks and in how many scenes they appear — read live from the script. */
export function characterStats(nodes: readonly ScriptNode[]): Map<string, { scenes: number; lines: number }> {
  const out = new Map<string, { scenes: number; lines: number }>();
  let scene = 0;
  const seen = new Set<string>();
  let who = '';
  for (const n of nodes) {
    if (n.type === 'heading') { scene++; seen.clear(); continue; }
    if (n.type === 'character') {
      who = n.text.trim().replace(/[（(].*$/, '').trim();
      const s = out.get(who) ?? { scenes: 0, lines: 0 };
      if (!seen.has(who)) { s.scenes++; seen.add(who); }
      out.set(who, s);
    } else if (n.type === 'dialogue' && who) {
      out.get(who)!.lines++;
    }
  }
  if (scene === 0) for (const v of out.values()) v.scenes = Math.max(v.scenes, 0);
  return out;
}

/** Scene numbers (1-based) whose heading mentions the location name. */
export function locationScenes(nodes: readonly ScriptNode[], name: string): number[] {
  const out: number[] = [];
  let scene = 0;
  for (const n of nodes) {
    if (n.type !== 'heading') continue;
    scene++;
    if (name.trim() && n.text.includes(name.trim())) out.push(scene);
  }
  return out;
}

/** Official world-building templates (prototype P10). The 系列动画 one is ours, for 520-episode series. */
export const WORLD_TEMPLATES = [
  { id: 'short', name: '短剧', sub: '竖屏短剧设定合同——主题、钩子、付费点', fields: ['一句话故事', '核心议题', '开场钩子', '付费卡点', '人设反差'] },
  { id: 'feature', name: '故事片', sub: '院线/长片故事合同——logline、主题、三幕', fields: ['Logline', '主题', '世界规则', '三幕结构', '结局意象'] },
  { id: 'series', name: '系列动画', sub: '系列动画设定合同——世界规则、单集公式', fields: ['世界规则', '能力边界', '单集公式', '固定场景', '不能写的'] },
] as const;

/** Compact bible summary for the model, so it keeps names, places and rules consistent. */
export function bibleBrief(b: Bible, maxChars = 3000): string {
  const parts: string[] = [];
  if (b.world.some((w) => w.value.trim())) parts.push('世界观：\n' + b.world.filter((w) => w.value.trim()).map((w) => `- ${w.title}：${w.value}`).join('\n'));
  if (b.characters.length) parts.push('角色：\n' + b.characters.map((c) => `- ${c.name}${c.role ? `（${c.role}）` : ''}${c.desc ? `：${c.desc}` : ''}${c.want ? `；想要：${c.want}` : ''}${c.fear ? `；害怕：${c.fear}` : ''}`).join('\n'));
  if (b.relations.length) {
    const name = (id: string) => b.characters.find((c) => c.id === id)?.name ?? '?';
    parts.push('人物关系：\n' + b.relations.map((r) => `- ${name(r.a)} — ${name(r.b)}：${r.label}`).join('\n'));
  }
  if (b.locations.length) parts.push('地点：\n' + b.locations.map((l) => `- ${l.name}（${l.ie}）${l.desc ? `：${l.desc}` : ''}`).join('\n'));
  if (b.props.length) parts.push('道具：\n' + b.props.map((p) => `- ${p.name}${p.desc ? `：${p.desc}` : ''}`).join('\n'));
  const rules = b.rules.filter((r) => r.status === 'active');
  if (rules.length) parts.unshift('规则库（导演确认过，硬规则必须遵守）：\n' + rules.map((r) => `- [${r.level === 'hard' ? '硬规则' : '偏好'}·${r.scope}] ${r.text}`).join('\n'));
  const s = parts.join('\n\n');
  return s.length > maxChars ? `${s.slice(0, maxChars)}…` : s;
}
