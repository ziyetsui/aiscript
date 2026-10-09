// Rebuild the bundled method text from reviewed, pinned local vendor files. No network at runtime.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../packages/agent/src/skills');
const resources = {};
function visit(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (entry.name === 'SKILL.md') {
      const id = dirname(path).split(/[\\/]/).at(-1);
      if (Object.hasOwn(resources, id)) throw new Error(`Duplicate skill id: ${id}`);
      const refs = join(dirname(path), 'references');
      resources[id] = {
        body: readFileSync(path, 'utf8').trimEnd(),
        references: existsSync(refs) ? readdirSync(refs).sort().filter((x) => x.endsWith('.md')).map((name) => ({ path: name, body: readFileSync(join(refs, name), 'utf8') })) : [],
      };
    }
  }
}
visit(join(root, 'vendor'));
const sources = JSON.parse(readFileSync(join(root, 'sources.json'), 'utf8'));
for (const source of sources) if (!Object.hasOwn(resources, source.id)) throw new Error(`Missing source: ${source.id}`);
const output = join(root, 'resources.json');
writeFileSync(output, `${JSON.stringify(resources, null, 2)}\n`);
console.log(`Bundled ${Object.keys(resources).length} skills into ${relative(process.cwd(), output)}`);
