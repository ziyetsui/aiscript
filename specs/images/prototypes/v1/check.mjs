// Verifies the built prototype honours the format contract in specs/0002 §9.3.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'dist', 'index.html'), 'utf8');
const fail = (msg) => { console.error(`✗ ${msg}`); process.exitCode = 1; };

const m = html.match(/const LAYERS = (\{.*?\});\n/s);
if (!m) fail('LAYERS payload not found');
const layers = JSON.parse(m[1].replace(/<\\\//g, '</'));
const keys = Object.keys(layers);
if (keys.length !== 20) fail(`expected 20 layers (10 pages × 2 directions), got ${keys.length}`);
for (const [k, doc] of Object.entries(layers)) {
  if (!doc.startsWith('<!doctype html>')) fail(`${k}: not a complete document (missing doctype)`);
  if (!/<\/html>\s*$/.test(doc)) fail(`${k}: not a complete document (missing </html>)`);
  if (!doc.includes('<title>')) fail(`${k}: missing <title>`);
}
// Single file, works offline: no external scripts, stylesheets, fonts or images.
const external = html.match(/(?:src|href)=["']https?:\/\/[^"']+/g) || [];
if (external.length) fail(`external resources found: ${external.slice(0, 3).join(', ')}`);
if (!process.exitCode) console.log(`✓ ${keys.length} layers, each a complete HTML document, no external resources`);
