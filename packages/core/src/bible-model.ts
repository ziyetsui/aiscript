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
export interface KnowledgeFile {
  id: string; name: string; size: number; src: 'upload' | 'chat'; file: string; addedAt: number;
  /** "写作时参考": the extracted text is sent with writing requests as reference material. */
  title: string; tags: { label: string; color: string }[]; memo: string; group: string; summary: string;
  starred: boolean; revision: number; pinned: boolean; excerpt: string; extract: 'none' | 'working' | 'ready' | 'failed'; extractError: string;
}
/** Director-review rules (spec 0002 §1.1 "审稿与规则库"): pending until a human confirms; hard rules vs preferences. */
export interface Rule { id: string; text: string; scope: string; source: string; level: 'hard' | 'pref'; status: 'pending' | 'active'; addedAt: number }
/** Humor examples marked funny / not funny (正反例库). */
export interface Joke { id: string; text: string; mechanism: string; verdict: 'good' | 'bad'; context: string; addedAt: number }
/** Storyboard shot (分镜), attached to a scene by its heading node id; order is list order. */
export type ShotSize = '远景' | '全景' | '中景' | '近景' | '特写';
export const SHOT_SIZES: readonly ShotSize[] = ['远景', '全景', '中景', '近景', '特写'];
export interface Shot { id: string; sceneId: string; size: ShotSize; desc: string; dur: number }
/** Production settings (制作设置, prototype P6): used when writing image prompts. */
export interface Production { aspect: '16:9' | '9:16'; kind: '叙事' | '商业'; style: string; styleNote: string }
export const PRODUCTION_DEFAULTS: Production = { aspect: '16:9', kind: '叙事', style: '二维手绘 · 温暖', styleNote: '' };
export const ART_STYLES = [
  { name: '二维手绘 · 温暖', era: '2000s–2010s' },
  { name: '胡同水彩', era: '1990s–2000s' },
  { name: '定格黏土', era: '2010s–2020s' },
  { name: '剪纸皮影', era: '现代' },
] as const;
/** Topic pool (选题池). */
export interface Topic { id: string; title: string; logline: string; why: string; source: string; status: 'idea' | 'picked' | 'dropped'; reason: string; addedAt: number; reaction?: 'like' | 'dislike' | null }

export interface Bible {
  characters: Character[]; relations: Relation[]; locations: Location[];
  props: Prop[]; world: WorldSetting[]; files: KnowledgeFile[];
  rules: Rule[]; jokes: Joke[]; topics: Topic[]; shots: Shot[];
}
export type BibleKind = keyof Bible;
export type BibleItem<K extends BibleKind> = Bible[K][number];

export const BIBLE_KINDS: BibleKind[] = ['characters', 'relations', 'locations', 'props', 'world', 'files', 'rules', 'jokes', 'topics', 'shots'];

export const BIBLE_DEFAULTS: { [K in BibleKind]: Omit<BibleItem<K>, 'id'> } = {
  characters: { name: '', role: '', desc: '', color: 'oklch(0.58 0.14 45)', look: '', catchphrase: '', want: '', fear: '', voice: '', portrait: '', castLocked: false, x: 0, y: 0 },
  relations: { a: '', b: '', label: '', note: '' },
  locations: { name: '', ie: '外景', times: ['日'], desc: '', visual: '', color: 'oklch(0.55 0.06 150)', image: '' },
  props: { name: '', category: '', color: 'oklch(0.36 0.07 160)', desc: '', visual: '', x: 40, y: 40 },
  world: { title: '', value: '' },
  files: { title: '', tags: [], memo: '', group: '全部笔记', summary: '', name: '', size: 0, src: 'upload', file: '', addedAt: 0, starred: false, revision: 1, pinned: false, excerpt: '', extract: 'none', extractError: '' },
  rules: { text: '', scope: '全剧', source: '', level: 'hard', status: 'pending', addedAt: 0 },
  jokes: { text: '', mechanism: '', verdict: 'good', context: '', addedAt: 0 },
  topics: { title: '', logline: '', why: '', source: '', status: 'idea', reason: '', addedAt: 0 },
  shots: { sceneId: '', size: '中景', desc: '', dur: 3 },
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

/** Pinned knowledge excerpts for the model, budgeted across files. */
export function referenceBrief(b: Bible, maxChars = 5000): string {
  const pinned = b.files.filter((f) => f.pinned && f.extract === 'ready' && f.excerpt.trim());
  if (!pinned.length) return '';
  const each = Math.floor(maxChars / pinned.length);
  return pinned.map((f) => `《${f.name}》\n${f.excerpt.slice(0, each)}${f.excerpt.length > each ? '…' : ''}`).join('\n\n');
}

/** Shots grouped per scene, in script order. Shots whose scene heading is gone are dropped. */
export function shotsByScene(nodes: readonly ScriptNode[], shots: readonly Shot[]): { sceneId: string; heading: string; n: number; shots: Shot[] }[] {
  return nodes.filter((x) => x.type === 'heading').map((h, i) => ({ sceneId: h.id, heading: h.text, n: i + 1, shots: shots.filter((s) => s.sceneId === h.id) }));
}

/** Shot list as CSV (场次, 镜号, 景别, 描述, 时长). */
export function shotsCsv(nodes: readonly ScriptNode[], shots: readonly Shot[]): string {
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [['场次', '场景', '镜号', '景别', '描述', '时长（秒）'].map(q).join(',')];
  for (const sc of shotsByScene(nodes, shots)) sc.shots.forEach((s, k) => rows.push([sc.n, sc.heading, k + 1, s.size, s.desc, s.dur].map(q).join(',')));
  return `\uFEFF${rows.join('\r\n')}\r\n`;
}
