// Builds prototypes/dist/index.html: one self-contained file holding every layer
// (page × direction) as a complete HTML document, plus a floating layer switcher.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, DIRECTIONS, SHARED_CSS } from './src/pages.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, 'src', p), 'utf8');
const base = read('base.css');
const themes = { a: read('theme-a.css'), b: read('theme-b.css') };
const runtime = read('runtime.js');

const layerDoc = (page, dir) => `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.name} · ${DIRECTIONS[dir].name}</title>
<style>${base}
${themes[dir]}</style>
</head>
<body>
${SHARED_CSS}
${page[dir]()}
<script>${runtime}</script>
</body>
</html>`;

const layers = {};
for (const page of PAGES) for (const dir of Object.keys(DIRECTIONS)) layers[`${page.id}-${dir}`] = layerDoc(page, dir);

// Escape "</" so a layer's own </script> cannot terminate the shell's script block.
const json = JSON.stringify(layers).replace(/<\//g, '<\\/');
const meta = JSON.stringify({ pages: PAGES.map(({ id, name }) => ({ id, name })), directions: DIRECTIONS });

const shell = readFileSync(join(here, 'src', 'shell.html'), 'utf8')
  .replace('/*__LAYERS__*/', `const LAYERS = ${json};`)
  .replace('/*__META__*/', `const META = ${meta};`);

mkdirSync(join(here, 'dist'), { recursive: true });
writeFileSync(join(here, 'dist', 'index.html'), shell);
console.log(`built ${Object.keys(layers).length} layers → dist/index.html (${(shell.length / 1024).toFixed(0)} KB)`);
