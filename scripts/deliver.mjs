import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const { version } = JSON.parse(readFileSync(join(root, 'apps/desktop/package.json'), 'utf8'));
const release = join(root, 'apps/desktop/release');
const names = [`Ancher-Scripter-${version}-mac-arm64.dmg`, `Ancher-Scripter-${version}-mac-x64.dmg`, `Ancher-Scripter-${version}-mac-arm64.zip`, `Ancher-Scripter-${version}-mac-x64.zip`, `Ancher-Scripter-${version}-win-x64-setup.exe`];
const missing = names.filter((name) => !existsSync(join(release, name)) || statSync(join(release, name)).size < 1024 * 1024);
if (missing.length) throw new Error(`交付不完整，缺少安装包：${missing.join('、')}`);
const target = join(root, 'delivery', `Ancher-Scripter-${version}`);
mkdirSync(target, { recursive: true });
for (const name of names) copyFileSync(join(release, name), join(target, name));
copyFileSync(join(root, 'docs/delivery/安装与激活说明.md'), join(target, '安装与激活说明.md'));
const files = [...names, '安装与激活说明.md'].map((name) => ({ name, bytes: statSync(join(target, name)).size, sha256: createHash('sha256').update(readFileSync(join(target, name))).digest('hex') }));
writeFileSync(join(target, 'SHA256SUMS.txt'), files.map((f) => `${f.sha256}  ${f.name}`).join('\n') + '\n');
let commit = 'unknown'; let dirty = true; try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); dirty = !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim(); } catch {}
writeFileSync(join(target, 'build-manifest.json'), JSON.stringify({ product: 'Ancher Scripter', version, sourceRepository: 'ziyeprompttheworld/aiscript', commit, dirty, builtAt: new Date().toISOString(), candidate: true, signing: 'not verified; see execution report', platformAcceptance: { macArm64: 'pending', macX64: 'pending', winX64: 'pending' }, customerDelivery: 'pending recipient, channel and machine code', files }, null, 2));
console.log(`交付候选目录：${target}（目标系统验收和客户发送尚需记录）`);
