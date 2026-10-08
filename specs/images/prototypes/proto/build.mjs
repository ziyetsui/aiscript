// Builds proto/dist/index.html — one self-contained file: 8 pages × 5 design directions, each direction a complete
// HTML document rendered full size in an iframe. Variants switch with the standard picker (prototype skill PICKER.md,
// verbatim); pages switch with a separate page menu. Colours are fixed to one token set on purpose.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from '../src/pages.mjs';
import { PRIMITIVES, DIRECTIONS } from '../src/tokens.mjs';
import { ENTRY } from './v-entry.mjs';
import { BROWSE } from './v-browse.mjs';
import { MAKE } from './v-make.mjs';
import { SETTINGS } from './v-settings.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(here, '..', 'src', p), 'utf8');
const CSS = src('base.css') + '\n' + src('variants.css');
const RUNTIME = src('runtime.js');
const TOKENS = DIRECTIONS.d1; // one colour set; this exploration is about design direction, not colour

const doc = (title, body, { css = '', js = '', v = 'a' } = {}) => `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${PRIMITIVES}
:root { ${TOKENS.css} }
${CSS}
${css}</style>
</head>
<body data-os="mac" data-v="${v}">
${body}
<script>${RUNTIME}</script>
${js ? `<script>${js}</script>` : ''}
</body>
</html>`;

const page = (id) => PAGES.find((p) => p.id === id);
const baseline = (id, name, axis) => ({ name, axis, doc: doc(`${page(id).name} · ${name}`, page(id).render()) });
const extra = (id, list) => list.map((x) => ({ name: x.name, axis: x.axis, doc: doc(`${page(id).name} · ${x.name}`, x.body, x) }));

const WS = [['Laper 原样', '三栏 + 浮动 AI 面板（走查还原）', 'a'], ['专注稿纸', '只留稿纸；AI 收成底部指令条，悬停展开', 'b'], ['编辑部', 'AI 固定停靠右侧整列，信息更密', 'c'], ['卡片桌面', '索引卡 + 可甩开的 AI 侧边面板', 'd'], ['键盘优先', '等宽、直角、底部控制台、没有动画', 'e']];
const SET = [
  { id: 'p1', title: '激活', variants: [baseline('p1', '分栏卡片', '现状：左表单 + 右插画'), ...extra('p1', ENTRY.p1)] },
  { id: 'p2', title: 'Onboarding', variants: [baseline('p2', '一句话', '现状：laper 式一句话 + 文件 + 类型'), ...extra('p2', ENTRY.p2)] },
  { id: 'p3', title: '创作首页', variants: [baseline('p3', '问候 + 输入', '现状：laper /app/new'), ...extra('p3', BROWSE.p3)] },
  { id: 'p4', title: '剧本工作区', variants: WS.map(([n, a, v]) => ({ name: n, axis: a, top: v === 'b' || v === 'e', doc: doc(`剧本工作区 · ${n}`, page('p4').render(), { v }) })) },
  { id: 'p5', title: '角色', variants: [baseline('p5', '卡片画布', '现状：laper 角色画布'), ...extra('p5', MAKE.p5)] },
  { id: 'p6', title: '制作 · 分镜', variants: [baseline('p6', '设置 + 画布', '现状：laper 制作设置 + 分镜画布'), ...extra('p6', MAKE.p6)] },
  { id: 'p7', title: '最近', variants: [baseline('p7', '网格', '现状：laper /app/recents'), ...extra('p7', BROWSE.p7)] },
  { id: 'p8', title: '设置', variants: [baseline('p8', '侧栏分区', '现状：侧栏 + 分区卡片'), ...extra('p8', SETTINGS.p8)] },
];

const docs = {}; const meta = SET.map((s) => ({ id: s.id, title: s.title, variants: s.variants.map((v, i) => { docs[`${s.id}-${i + 1}`] = v.doc; return { name: v.name, axis: v.axis, top: !!v.top }; }) }));
const json = JSON.stringify(docs).replace(/<\//g, '<\\/');
const html = readFileSync(join(here, 'harness.html'), 'utf8').replace('/*__DOCS__*/', `const DOCS = ${json};`).replace('/*__META__*/', `const META = ${JSON.stringify(meta)};`);
mkdirSync(join(here, 'dist'), { recursive: true });
writeFileSync(join(here, 'dist', 'index.html'), html);
console.log(`built ${Object.keys(docs).length} variants (${SET.length} pages × 5) → proto/dist/index.html (${(html.length / 1024).toFixed(0)} KB)`);
