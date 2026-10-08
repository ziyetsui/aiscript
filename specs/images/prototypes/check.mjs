// Verifies the built prototype honours the format contract in specs/0002 §9.3.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './src/pages.mjs';
import { DIRECTIONS } from './src/tokens.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'dist', 'index.html'), 'utf8');
const fail = (msg) => { console.error(`✗ ${msg}`); process.exitCode = 1; };

const m = html.match(/const LAYERS = (\{.*?\});\n/s);
if (!m) fail('LAYERS payload not found');
const layers = JSON.parse(m[1].replace(/<\\\//g, '</'));
const expected = PAGES.length * Object.keys(DIRECTIONS).length;
if (Object.keys(layers).length !== expected) fail(`expected ${expected} layers, got ${Object.keys(layers).length}`);
for (const [k, doc] of Object.entries(layers)) {
  if (!doc.startsWith('<!doctype html>')) fail(`${k}: not a complete document (missing doctype)`);
  if (!/<\/html>\s*$/.test(doc)) fail(`${k}: not a complete document (missing </html>)`);
  if (!doc.includes('<title>')) fail(`${k}: missing <title>`);
}
// Directions may only differ by tokens: strip the per-direction token block and compare bodies.
for (const page of PAGES) {
  const bodies = Object.keys(DIRECTIONS).map((d) => layers[`${page.id}-${d}`].replace(/<title>.*?<\/title>/, '').replace(/:root \{[^}]*\}/g, '').replace(/<body[^>]*>/, '<body>'));
  if (new Set(bodies).size !== 1) fail(`${page.id}: directions differ beyond design tokens`);
}
const external = html.match(/(?:src|href)=["']https?:\/\/[^"']+/g) || [];
if (external.length) fail(`external resources found: ${external.slice(0, 3).join(', ')}`);
if (!process.exitCode) console.log(`✓ ${expected} layers, each a complete HTML document; directions differ only by tokens; no external resources`);
