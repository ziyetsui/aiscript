// Design tokens for the five directions. Sources:
//   · app.ancher.ai (production CSS variables, read 2026-10-08): n1/n2/n3 neutrals, b1–b5 brand scales,
//     Manrope + Noto Sans SC, Lora + Noto Serif SC, Geist Mono, --radius = (10px − 2px), --ease-fast / --ease-spring,
//     durations 83 / 150 / 167 / 250 / 333 / 500 ms.
//   · streamify-one/ancher@ancher-rebrand new-design/components/tokens.jsx (desktop agent "studio system"):
//     warm paper oklch surfaces, single rust accent, sage + ochre, Source Serif 4 / Geist / JetBrains Mono,
//     radii 4/6/10/14/20, warm-brown shadows.
// Motion tokens follow emil-design-eng: ease-out for enter/exit, UI ≤ 300ms, press scale 0.95–0.98, never from
// scale(0), faster spinners read as faster apps, and high-frequency tools get the least motion.
// Layout and interaction are identical across directions; only these tokens change (checked by check.mjs).

export const PRIMITIVES = `
:root {
  /* app.ancher.ai brand scales */
  --color-b1-50:#f2fbff; --color-b1-100:#e2f5ff; --color-b1-500:#366fb6; --color-b1-600:#1d5394;
  --color-b2-50:#fff8ed; --color-b2-100:#ffeed8; --color-b2-300:#ffc793; --color-b2-400:#ffad69; --color-b2-500:#eb7514; --color-b2-600:#bd5100;
  --color-b3-50:#effcff; --color-b3-100:#dbf5ff; --color-b3-500:#196bf0; --color-b3-600:#004cc7;
  --color-b4-500:#27b95a; --color-danger-500:#ef4444; --color-success-500:#10b981; --color-warning-500:#f59e0b;
  /* app.ancher.ai neutrals: n1 pure, n2 warm, n3 cool-violet */
  --color-n1-light-1:#fcfcfc; --color-n1-light-2:#f9f9f9; --color-n1-light-3:#f0f0f0; --color-n1-light-4:#e8e8e8; --color-n1-light-6:#d9d9d9; --color-n1-light-9:#8d8d8d; --color-n1-light-11:#646464; --color-n1-light-12:#202020;
  --color-n2-light-1:#fdfdfc; --color-n2-light-2:#f9f9f8; --color-n2-light-3:#f1f0ef; --color-n2-light-4:#e9e8e6; --color-n2-light-5:#e2e1de; --color-n2-light-6:#dad9d6; --color-n2-light-9:#8d8d86; --color-n2-light-10:#82827c; --color-n2-light-11:#63635e; --color-n2-light-12:#21201c;
  --color-n2-dark-1:#111110; --color-n2-dark-2:#191918; --color-n2-dark-3:#222221; --color-n2-dark-4:#2a2a28; --color-n2-dark-5:#31312e; --color-n2-dark-6:#3b3a37; --color-n2-dark-8:#62605b; --color-n2-dark-10:#7c7b74; --color-n2-dark-11:#b5b3ad; --color-n2-dark-12:#eeeeec;
  --color-n3-light-1:#fdfcfd; --color-n3-light-2:#faf9fb; --color-n3-light-3:#f2eff3; --color-n3-light-4:#eae7ec; --color-n3-light-5:#e3dfe6; --color-n3-light-7:#d0cdd7; --color-n3-light-10:#84828e; --color-n3-light-11:#65636d; --color-n3-light-12:#211f26;
  /* ancher desktop agent "studio system" */
  --studio-paper: oklch(0.985 0.008 85); --studio-paper-deep: oklch(0.965 0.010 80); --studio-card: oklch(1 0 0);
  --studio-ink: oklch(0.22 0.015 60); --studio-ink-soft: oklch(0.40 0.012 60); --studio-ink-mute: oklch(0.58 0.010 60);
  --studio-rule: oklch(0.92 0.008 70); --studio-rule-strong: oklch(0.86 0.010 70);
  --studio-rust: oklch(0.58 0.14 45); --studio-rust-soft: oklch(0.94 0.04 45); --studio-rust-deep: oklch(0.44 0.12 45);
  --studio-sage: oklch(0.55 0.06 150); --studio-ochre: oklch(0.72 0.11 80); --studio-ochre-soft: oklch(0.96 0.04 85);
  --studio-shadow-sm: 0 1px 2px rgba(60,40,20,.06), 0 1px 1px rgba(60,40,20,.04);
  --studio-shadow-lg: 0 10px 40px rgba(60,40,20,.08), 0 2px 6px rgba(60,40,20,.05);
  /* type families */
  --ff-manrope: "Manrope Variable", "Manrope", "Noto Sans SC", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  --ff-geist: "Geist", -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", "Microsoft YaHei", sans-serif;
  --ff-lora: "Lora Variable", "Lora", "Noto Serif SC", "Songti SC", "STSong", Georgia, serif;
  --ff-source-serif: "Source Serif 4", "Source Serif Pro", "Noto Serif SC", "Songti SC", Georgia, serif;
  --ff-geist-mono: "Geist Mono Variable", "Geist Mono", ui-monospace, Menlo, Consolas, monospace;
  --ff-jetbrains: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  /* app.ancher.ai motion primitives */
  --ease-fast: cubic-bezier(0, 0, 0, 1); --ease-strong-out: cubic-bezier(0.23, 1, 0.32, 1); --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --corner-radius: 10px;
  --color-success-dot: var(--color-success-500);
}`;

const motion = ({ ease, press, pop, modal, scale, y, spin, hl }) =>
  `--ease-enter: ${ease}; --dur-press: ${press}ms; --dur-pop: ${pop}ms; --dur-modal: ${modal}ms; --press-scale: ${scale}; --enter-y: ${y}px; --spin: ${spin}ms; --dur-highlight: ${hl}ms;`;

export const DIRECTIONS = {
  d1: {
    swatch: ['oklch(0.985 0.008 85)', 'oklch(0.58 0.14 45)'],
    name: '01 · Studio Rust', zh: '纸墨锈红',
    note: '桌面 Agent 原生系统：暖纸 oklch + 唯一锈红强调，Source Serif 标题，暖棕阴影；动效克制（ease-out 160ms，按压 0.97）',
    css: `--bg: var(--studio-paper); --rail: var(--studio-paper-deep); --sidebar: var(--studio-paper-deep); --surface: var(--studio-card);
      --muted: var(--studio-paper-deep); --line: var(--studio-rule); --line-strong: var(--studio-rule-strong);
      --ink: var(--studio-ink); --ink-2: var(--studio-ink-soft); --ink-3: var(--studio-ink-mute);
      --primary: var(--studio-rust); --primary-hover: var(--studio-rust-deep); --primary-fg: oklch(0.99 0.01 85); --primary-soft: var(--studio-rust-soft);
      --paper: var(--studio-card); --hl: var(--studio-ochre-soft); --hover: oklch(0.94 0.010 75);
      --font-ui: var(--ff-geist); --font-display: var(--ff-source-serif); --font-family-mono: var(--ff-jetbrains); --display-weight: 400; --display-track: -0.01em;
      --radius-mult: 1; --type-scale: 1; --shadow-card: var(--studio-shadow-sm); --shadow-pop: var(--studio-shadow-lg), 0 0 0 0.5px var(--studio-rule-strong);
      --scrim: rgb(40 30 15 / .24); --glass: none; color-scheme: light;
      ${motion({ ease: 'var(--ease-strong-out)', press: 160, pop: 200, modal: 240, scale: 0.97, y: 6, spin: 600, hl: 600 })}`,
  },
  d2: {
    swatch: ['#f9f9f8', '#366fb6'],
    name: '02 · App Navy', zh: '产品藏蓝',
    note: 'app.ancher.ai 浅色原样：n2 + b1 藏蓝，Manrope / Lora，radius 8；动效用产品自带 --ease-fast，150/250ms，按压 0.98',
    css: `--bg: var(--color-n2-light-2); --rail: var(--color-n2-light-3); --sidebar: var(--color-n2-light-3); --surface: var(--color-n2-light-1);
      --muted: var(--color-n2-light-3); --line: var(--color-n2-light-4); --line-strong: var(--color-n2-light-6);
      --ink: var(--color-n2-light-12); --ink-2: var(--color-n2-light-11); --ink-3: var(--color-n2-light-10);
      --primary: var(--color-b1-500); --primary-hover: var(--color-b1-600); --primary-fg: var(--color-n2-light-1); --primary-soft: var(--color-b1-50);
      --paper: var(--color-n2-light-1); --hl: var(--color-b2-100); --hover: var(--color-n2-light-4);
      --font-ui: var(--ff-manrope); --font-display: var(--ff-lora); --font-family-mono: var(--ff-geist-mono); --display-weight: 500; --display-track: -0.01em;
      --radius-mult: .8; --type-scale: 1; --shadow-card: 0px 1px 2px 0px rgb(0 0 0 / .05), 0px 1px 3px 0px rgb(0 0 0 / .1); --shadow-pop: 0px 10px 15px -3px rgb(0 0 0 / .04), 0px 25px 50px -12px rgb(0 0 0 / .1);
      --scrim: rgb(33 32 28 / .28); --glass: none; color-scheme: light;
      ${motion({ ease: 'var(--ease-fast)', press: 150, pop: 150, modal: 250, scale: 0.98, y: 4, spin: 550, hl: 500 })}`,
  },
  d3: {
    swatch: ['#111110', '#eb7514'],
    name: '03 · App Ember', zh: '产品余烬',
    note: 'app.ancher.ai 深色原样：n2 暗面 + b2 橙（白字），Lora 标题；夜间写作降低动效位移（4px），高亮延长到 700ms 方便追踪 AI 落笔',
    css: `--bg: var(--color-n2-dark-1); --rail: var(--color-n2-dark-1); --sidebar: var(--color-n2-dark-3); --surface: var(--color-n2-dark-2);
      --muted: var(--color-n2-dark-3); --line: var(--color-n2-dark-5); --line-strong: var(--color-n2-dark-6);
      --ink: var(--color-n2-dark-12); --ink-2: var(--color-n2-dark-11); --ink-3: var(--color-n2-dark-10);
      --primary: var(--color-b2-500); --primary-hover: var(--color-b2-400); --primary-fg: var(--color-n2-dark-12); --primary-soft: rgb(235 117 20 / .15);
      --paper: var(--color-n2-dark-2); --hl: rgb(235 117 20 / .18); --hover: var(--color-n2-dark-4);
      --font-ui: var(--ff-manrope); --font-display: var(--ff-lora); --font-family-mono: var(--ff-geist-mono); --display-weight: 500; --display-track: 0;
      --radius-mult: .8; --type-scale: 1; --shadow-card: 0 0 0 1px var(--color-n2-dark-4); --shadow-pop: 0 0 0 1px var(--color-n2-dark-6), 0 24px 60px rgb(0 0 0 / .5);
      --scrim: rgb(0 0 0 / .55); --glass: none; color-scheme: dark;
      ${motion({ ease: 'var(--ease-fast)', press: 150, pop: 180, modal: 250, scale: 0.97, y: 4, spin: 550, hl: 700 })}`,
  },
  d4: {
    swatch: ['#fdfcfd', '#196bf0'],
    name: '04 · Graphite Signal', zh: '石墨信号',
    note: 'n3 冷紫灰 + b3 信号蓝，圆角 ×0.5，Manrope 粗体 + Geist Mono 标签；为高频使用而设：按压 0.98 / 100ms，弹层只做透明度不做位移',
    css: `--bg: var(--color-n3-light-1); --rail: var(--color-n3-light-2); --sidebar: var(--color-n3-light-2); --surface: var(--color-n3-light-1);
      --muted: var(--color-n3-light-3); --line: var(--color-n3-light-4); --line-strong: var(--color-n3-light-7);
      --ink: var(--color-n3-light-12); --ink-2: var(--color-n3-light-11); --ink-3: var(--color-n3-light-10);
      --primary: var(--color-b3-500); --primary-hover: var(--color-b3-600); --primary-fg: #fff; --primary-soft: var(--color-b3-50);
      --paper: #fff; --hl: var(--color-b3-100); --hover: var(--color-n3-light-4);
      --font-ui: var(--ff-manrope); --font-display: var(--ff-manrope); --font-family-mono: var(--ff-geist-mono); --eyebrow-font: var(--ff-geist-mono); --display-weight: 700; --display-track: -0.03em;
      --radius-mult: .5; --type-scale: .95; --shadow-card: 0 0 0 1px var(--color-n3-light-4); --shadow-pop: 0 0 0 1px var(--color-n3-light-5), 0 12px 32px rgb(33 31 38 / .10);
      --scrim: rgb(33 31 38 / .2); --glass: none; color-scheme: light;
      ${motion({ ease: 'var(--ease-fast)', press: 100, pop: 125, modal: 180, scale: 0.98, y: 0, spin: 450, hl: 400 })}`,
  },
  d5: {
    swatch: ['#111110', 'oklch(0.72 0.11 80)'],
    name: '05 · Lamplight', zh: '台灯夜写',
    note: '暖暗 n2 + 桌面系统的赭黄作强调、鼠尾草作成功色，Source Serif 斜体标题，浮层毛玻璃；动效最柔：抽屉曲线 280ms、位移 10px',
    css: `--bg: var(--color-n2-dark-1); --rail: #0d0d0c; --sidebar: rgb(255 248 230 / .03); --surface: rgb(255 248 230 / .045);
      --muted: rgb(255 248 230 / .06); --line: rgb(255 248 230 / .08); --line-strong: rgb(255 248 230 / .15);
      --ink: oklch(0.94 0.015 85); --ink-2: oklch(0.80 0.015 80); --ink-3: oklch(0.62 0.012 75);
      --primary: var(--studio-ochre); --primary-hover: oklch(0.80 0.11 82); --primary-fg: oklch(0.22 0.03 70); --primary-soft: oklch(0.72 0.11 80 / .16);
      --paper: rgb(255 248 230 / .035); --hl: oklch(0.72 0.11 80 / .18); --hover: rgb(255 248 230 / .07);
      --font-ui: var(--ff-geist); --font-display: var(--ff-source-serif); --font-family-mono: var(--ff-jetbrains); --display-weight: 400; --display-track: 0; --display-style: italic;
      --radius-mult: 1.4; --type-scale: 1.02; --shadow-card: 0 0 0 1px rgb(255 248 230 / .07); --shadow-pop: 0 0 0 1px rgb(255 248 230 / .1), 0 30px 70px rgb(0 0 0 / .55);
      --scrim: rgb(0 0 0 / .5); --glass: blur(24px) saturate(1.3); --color-success-500: var(--studio-sage); color-scheme: dark;
      ${motion({ ease: 'var(--ease-drawer)', press: 160, pop: 240, modal: 280, scale: 0.96, y: 10, spin: 650, hl: 900 })}`,
  },
};
