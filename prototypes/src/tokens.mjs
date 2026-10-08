// Design tokens taken from ancher-website (src/styles/tokens/*.css). Only tokens vary between the
// five directions; layout and interaction are identical across them.

// Primitives — values copied from primitives.css / typography.css / radius.css / effects.css.
export const PRIMITIVES = `
:root {
  --color-b1-50: rgba(242,251,255,1); --color-b1-100: rgba(226,245,255,1); --color-b1-500: rgba(54,111,182,1); --color-b1-600: rgba(29,83,148,1); --color-b1-700: rgba(3,53,108,1);
  --color-b2-50: rgba(255,248,237,1); --color-b2-100: rgba(255,238,216,1); --color-b2-300: rgba(255,199,147,1); --color-b2-500: rgba(235,117,20,1); --color-b2-600: rgba(189,81,0,1);
  --color-b3-50: rgba(239,252,255,1); --color-b3-100: rgba(219,245,255,1); --color-b3-500: rgba(25,107,240,1); --color-b3-600: rgba(0,76,199,1);
  --color-b4-50: rgba(240,255,243,1); --color-b4-100: rgba(222,255,228,1); --color-b4-500: rgba(39,185,90,1); --color-b4-600: rgba(0,144,56,1); --color-b4-700: rgba(0,100,22,1);
  --color-b5-50: rgba(255,245,255,1); --color-b5-100: rgba(255,232,255,1); --color-b5-300: rgba(240,179,255,1); --color-b5-500: rgba(163,59,241,1); --color-b5-900: rgba(30,0,60,1);
  --color-danger-500: rgba(239,68,68,1); --color-success-500: rgba(16,185,129,1); --color-warning-500: rgba(245,158,11,1); --color-info-500: rgba(59,130,246,1);
  --color-n2-light-1: rgba(253,253,252,1); --color-n2-light-2: rgba(249,249,248,1); --color-n2-light-3: rgba(241,240,239,1); --color-n2-light-4: rgba(233,232,230,1);
  --color-n2-light-5: rgba(226,225,222,1); --color-n2-light-6: rgba(218,217,214,1); --color-n2-light-7: rgba(207,206,202,1); --color-n2-light-8: rgba(188,187,181,1);
  --color-n2-light-9: rgba(141,141,134,1); --color-n2-light-10: rgba(130,130,124,1); --color-n2-light-11: rgba(99,99,94,1); --color-n2-light-12: rgba(33,32,28,1);
  --color-n2-dark-1: rgba(17,17,16,1); --color-n2-dark-2: rgba(25,25,24,1); --color-n2-dark-3: rgba(34,34,33,1); --color-n2-dark-4: rgba(42,42,40,1);
  --color-n2-dark-5: rgba(49,49,46,1); --color-n2-dark-6: rgba(59,58,55,1); --color-n2-dark-7: rgba(73,72,68,1); --color-n2-dark-8: rgba(98,96,91,1);
  --color-n2-dark-9: rgba(111,109,102,1); --color-n2-dark-10: rgba(124,123,116,1); --color-n2-dark-11: rgba(181,179,173,1); --color-n2-dark-12: rgba(238,238,236,1);
  --font-family-sans: "Manrope", ui-sans-serif, system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-family-serif: "Instrument Serif", ui-serif, Georgia, "Songti SC", "STSong", serif;
  --font-family-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --duration-150: 150ms; --duration-250: 250ms; --duration-500: 500ms;
  --ease-fast: cubic-bezier(0, 0, 0, 1); --ease-inout: cubic-bezier(0.63, 0.05, 0.01, 0.99);
  --corner-radius: 10px;
  --shadow-xs: 0px 1px 2px 0px rgb(0 0 0 / 0.05), 0px 1px 3px 0px rgb(0 0 0 / 0.1);
  --shadow-sm: 0px 1px 3px 0px rgb(0 0 0 / 0.04), 0px 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0px 8px 10px -3px rgb(0 0 0 / 0.04), 0px 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-xl: 0px 10px 15px -3px rgb(0 0 0 / 0.04), 0px 25px 50px -12px rgb(0 0 0 / 0.1);
  --shadow-2xl: 0px 12px 20px -4px rgb(0 0 0 / 0.04), 0px 30px 60px -18px rgb(0 0 0 / 0.12);
}`;

// Each direction maps the same semantic slots to different primitives and scalars.
export const DIRECTIONS = {
  d1: {
    name: '01 · Ink Navy', zh: '纸墨藏蓝',
    note: 'ancher 浅色默认：n2 暖白 + b1 藏蓝，衬线标题，圆角 ×1',
    css: `--bg: var(--color-n2-light-2); --rail: var(--color-n2-light-3); --sidebar: var(--color-n2-light-2); --surface: var(--color-n2-light-1);
      --muted: var(--color-n2-light-3); --line: var(--color-n2-light-4); --line-strong: var(--color-n2-light-6);
      --ink: var(--color-n2-light-12); --ink-2: var(--color-n2-light-11); --ink-3: var(--color-n2-light-9);
      --primary: var(--color-b1-500); --primary-hover: var(--color-b1-600); --primary-fg: var(--color-n2-light-1); --primary-soft: var(--color-b1-50);
      --paper: var(--color-n2-light-1); --hl: var(--color-b2-100); --hover: color-mix(in srgb, var(--color-n2-light-4), transparent 20%);
      --font-display: var(--font-family-serif); --display-weight: 400; --display-track: -0.01em;
      --radius-mult: 1; --type-scale: 1; --shadow-card: var(--shadow-xs); --shadow-pop: var(--shadow-xl);
      --scrim: rgb(33 32 28 / .28); --glass: none; color-scheme: light;`,
  },
  d2: {
    name: '02 · Ember Night', zh: '余烬橙夜',
    note: 'ancher 深色默认：n2 暗面 + b2 橙，衬线标题，阴影加深',
    css: `--bg: var(--color-n2-dark-1); --rail: var(--color-n2-dark-1); --sidebar: var(--color-n2-dark-2); --surface: var(--color-n2-dark-2);
      --muted: var(--color-n2-dark-3); --line: var(--color-n2-dark-5); --line-strong: var(--color-n2-dark-6);
      --ink: var(--color-n2-dark-12); --ink-2: var(--color-n2-dark-11); --ink-3: var(--color-n2-dark-9);
      --primary: var(--color-b2-500); --primary-hover: var(--color-b2-300); --primary-fg: var(--color-n2-dark-1); --primary-soft: rgb(235 117 20 / .14);
      --paper: var(--color-n2-dark-2); --hl: rgb(235 117 20 / .16); --hover: color-mix(in srgb, var(--color-n2-dark-6), transparent 40%);
      --font-display: var(--font-family-serif); --display-weight: 400; --display-track: 0;
      --radius-mult: 1; --type-scale: 1; --shadow-card: 0 0 0 1px var(--color-n2-dark-4); --shadow-pop: 0 0 0 1px var(--color-n2-dark-6), var(--shadow-2xl), 0 30px 60px rgb(0 0 0 / .45);
      --scrim: rgb(0 0 0 / .55); --glass: none; color-scheme: dark;`,
  },
  d3: {
    name: '03 · Signal', zh: '信号蓝 · 锐利',
    note: 'b3 信号蓝 + 纯净白，圆角 ×0.5，无衬线粗标题，字号 0.95，等宽标签',
    css: `--bg: var(--color-n2-light-1); --rail: var(--color-n2-light-1); --sidebar: var(--color-n2-light-2); --surface: var(--color-n2-light-1);
      --muted: var(--color-n2-light-2); --line: var(--color-n2-light-5); --line-strong: var(--color-n2-light-7);
      --ink: var(--color-n2-light-12); --ink-2: var(--color-n2-light-11); --ink-3: var(--color-n2-light-10);
      --primary: var(--color-b3-500); --primary-hover: var(--color-b3-600); --primary-fg: var(--color-n2-light-1); --primary-soft: var(--color-b3-50);
      --paper: var(--color-n2-light-1); --hl: var(--color-b3-100); --hover: var(--color-n2-light-3);
      --font-display: var(--font-family-sans); --display-weight: 700; --display-track: -0.03em; --eyebrow-font: var(--font-family-mono);
      --radius-mult: .5; --type-scale: .95; --shadow-card: 0 0 0 1px var(--color-n2-light-5); --shadow-pop: 0 0 0 1px var(--color-n2-light-6), var(--shadow-lg);
      --scrim: rgb(33 32 28 / .2); --glass: none; color-scheme: light;`,
  },
  d4: {
    name: '04 · Garden', zh: '苗圃绿 · 柔和',
    note: 'b4 绿 + 暖白，圆角 ×1.5，字号 1.05，大阴影卡片，最接近 laper 的气质',
    css: `--bg: var(--color-n2-light-3); --rail: var(--color-n2-light-3); --sidebar: var(--color-n2-light-2); --surface: var(--color-n2-light-1);
      --muted: var(--color-n2-light-3); --line: var(--color-n2-light-4); --line-strong: var(--color-n2-light-6);
      --ink: var(--color-n2-light-12); --ink-2: var(--color-n2-light-11); --ink-3: var(--color-n2-light-9);
      --primary: var(--color-b4-600); --primary-hover: var(--color-b4-700); --primary-fg: var(--color-n2-light-1); --primary-soft: var(--color-b4-50);
      --paper: var(--color-n2-light-1); --hl: var(--color-b4-100); --hover: color-mix(in srgb, var(--color-n2-light-5), transparent 30%);
      --font-display: var(--font-family-sans); --display-weight: 600; --display-track: -0.02em;
      --radius-mult: 1.5; --type-scale: 1.05; --shadow-card: var(--shadow-sm); --shadow-pop: var(--shadow-2xl), 0 0 0 1px var(--color-n2-light-4);
      --scrim: rgb(33 32 28 / .22); --glass: none; color-scheme: light;`,
  },
  d5: {
    name: '05 · Dusk Glass', zh: '暮紫 · 玻璃',
    note: 'b5 紫 + n2 暗面，圆角 ×1.2，衬线斜体标题，浮层毛玻璃（blur-xl）',
    css: `--bg: color-mix(in srgb, var(--color-n2-dark-2), var(--color-b5-900) 35%); --rail: transparent; --sidebar: rgb(255 255 255 / .03); --surface: rgb(255 255 255 / .05);
      --muted: rgb(255 255 255 / .06); --line: rgb(255 255 255 / .09); --line-strong: rgb(255 255 255 / .16);
      --ink: var(--color-n2-dark-12); --ink-2: var(--color-n2-dark-11); --ink-3: var(--color-n2-dark-10);
      --primary: var(--color-b5-300); --primary-hover: var(--color-b5-100); --primary-fg: var(--color-b5-900); --primary-soft: rgb(163 59 241 / .2);
      --paper: rgb(255 255 255 / .04); --hl: rgb(240 179 255 / .14); --hover: rgb(255 255 255 / .07);
      --font-display: var(--font-family-serif); --display-weight: 400; --display-track: 0; --display-style: italic;
      --radius-mult: 1.2; --type-scale: 1; --shadow-card: 0 0 0 1px rgb(255 255 255 / .08); --shadow-pop: 0 0 0 1px rgb(255 255 255 / .12), 0 30px 70px rgb(0 0 0 / .5);
      --scrim: rgb(10 0 20 / .55); --glass: blur(24px) saturate(1.4); color-scheme: dark;`,
  },
};
