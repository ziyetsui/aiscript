// Builds prototypes/dist/index.html: one self-contained file. Every layer (page × token direction)
// is a complete HTML document; a floating switcher swaps them into an iframe via srcdoc.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './src/pages.mjs';
import { PRIMITIVES, DIRECTIONS } from './src/tokens.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, 'src', p), 'utf8');
const base = read('base.css') + '\n' + read('variants.css');
const runtime = read('runtime.js');
// three.js (MIT) is inlined once in the shell and shared with every layer through parent.THREE.
const threeSrc = read('vendor/three.module.min.js').replace(/export\{([^}]*)\};?\s*$/, (_, list) =>
  'window.THREE={' + list.split(',').map((e) => { const [a, b] = e.trim().split(/\s+as\s+/); return `${b || a}:${a}`; }).join(',') + '};');

const layerDoc = (page, key) => {
  const d = DIRECTIONS[key];
  const dark = /color-scheme:\s*dark/.test(d.css);
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.name} · ${d.name}</title>
<style>${PRIMITIVES}
:root { ${d.css} }
${base}</style>
</head>
<body${dark ? ' data-dark' : ''}>
${page.render()}
<script>${runtime}</script>
</body>
</html>`;
};

const layers = {};
for (const page of PAGES) for (const key of Object.keys(DIRECTIONS)) layers[`${page.id}-${key}`] = layerDoc(page, key);

// Escape "</" so a layer's own </script> cannot terminate the shell's script block.
const json = JSON.stringify(layers).replace(/<\//g, '<\\/');
const meta = JSON.stringify({
  pages: PAGES.map(({ id, name }) => ({ id, name })),
  directions: Object.fromEntries(Object.entries(DIRECTIONS).map(([k, d]) => [k, { name: d.name, zh: d.zh, note: d.note, swatch: d.swatch }])),
});
const shell = read('shell.html').replace('/*__LAYERS__*/', `const LAYERS = ${json};`).replace('/*__META__*/', `const META = ${meta};`).replace('/*__THREE__*/', () => threeSrc);

mkdirSync(join(here, 'dist'), { recursive: true });
writeFileSync(join(here, 'dist', 'index.html'), shell);
console.log(`built ${Object.keys(layers).length} layers (${PAGES.length} pages × ${Object.keys(DIRECTIONS).length} directions) → dist/index.html (${(shell.length / 1024).toFixed(0)} KB)`);
