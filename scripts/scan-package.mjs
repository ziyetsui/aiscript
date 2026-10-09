import { readFileSync, readdirSync } from 'node:fs';
import { createPublicKey } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, join, dirname } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const req = createRequire(join(root, 'apps/desktop/package.json'));
const asar = req(req.resolve('@electron/asar', { paths: [req.resolve('electron-builder')] }));
const archive = process.argv[2];
if (!archive) throw new Error('用法：node scripts/scan-package.mjs /absolute/path/app.asar');
const publicKey = readFileSync(join(dirname(resolve(archive)), 'license-public.pem'), 'utf8');
const officialKey = readFileSync(join(root, 'apps/desktop/resources/license-public.pem'), 'utf8');
if (!createPublicKey(publicKey).export({ type: 'spki', format: 'der' }).equals(createPublicKey(officialKey).export({ type: 'spki', format: 'der' }))) throw new Error('安装包公钥与正式签发公钥不一致');
if (createPublicKey(publicKey).asymmetricKeyType !== 'ed25519') throw new Error('公钥不是 Ed25519');
const patterns = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /AIza[0-9A-Za-z_-]{35}/, /(?:sk-proj-|sk_live_)[0-9A-Za-z_-]{20,}/];
let scanned = 0;
for (const name of asar.listPackage(archive)) {
  const f = name.replace(/^\//, '');
  const info = asar.statFile(archive, f);
  if (info.files || !/\.(js|cjs|mjs|json|html|css|pem|txt|md)$/i.test(f)) continue;
  if (/e2e|tools\/license|private\.pem/.test(f)) throw new Error(`不应发布的文件：${f}`);
  const text = asar.extractFile(archive, f).toString('utf8');
  if (patterns.some((p) => p.test(text))) throw new Error(`安装包含疑似密钥：${f}`);
  scanned++;
}
console.log(`app.asar 扫描通过：${scanned} 个文本文件，无匹配的私钥/常见 API key；这是格式扫描，不能证明所有未知格式密钥不存在。`);
