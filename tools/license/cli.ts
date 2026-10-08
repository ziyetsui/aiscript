// Offline activation codes (spec 0002 §6.3). Runs only on your own computer; the private key never ships.
//   pnpm license keypair                                  create ~/.ancher-scripter/license/{private,public}.pem
//   pnpm license issue --machine AS-… --customer 北京 --seat 1/3 [--exp 2027-12-31]
//   pnpm license verify --code AIS1-… --machine AS-…
import { appendFileSync, chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { generateKeypair, issueOfflineCode, verifyOfflineCode } from '../../packages/license/src/offline.ts';

const dir = process.env.SCRIPTER_LICENSE_DIR ?? join(homedir(), '.ancher-scripter', 'license');
const priv = join(dir, 'private.pem');
const pub = join(dir, 'public.pem');
const ledger = join(dir, 'licenses.csv');
const [cmd, ...rest] = process.argv.slice(2);
const { values: a } = parseArgs({ args: rest, options: { machine: { type: 'string' }, customer: { type: 'string' }, seat: { type: 'string' }, exp: { type: 'string' }, code: { type: 'string' }, force: { type: 'boolean' } } });

function need(v: string | undefined, name: string): string {
  if (!v) { console.error(`缺少 --${name}`); process.exit(2); }
  return v;
}

if (cmd === 'keypair') {
  if (existsSync(priv) && !a.force) { console.error(`已存在 ${priv}；确实要换新密钥对请加 --force（旧码会全部失效）`); process.exit(1); }
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const { privatePem, publicPem } = generateKeypair();
  writeFileSync(priv, privatePem, { mode: 0o600 });
  chmodSync(priv, 0o600);
  writeFileSync(pub, publicPem);
  console.log(`私钥：${priv}（只留在本机）\n公钥：${pub}\n把公钥内容放进 apps/desktop/resources/license-public.pem 后重新打包。`);
} else if (cmd === 'issue') {
  const machine = need(a.machine, 'machine');
  const customer = need(a.customer, 'customer');
  const seat = need(a.seat, 'seat');
  const code = issueOfflineCode(readFileSync(priv, 'utf8'), { mid: machine, cust: customer, seat, exp: a.exp ?? null });
  if (!existsSync(ledger)) writeFileSync(ledger, 'date,customer,seat,machine,exp\n');
  appendFileSync(ledger, `${new Date().toISOString().slice(0, 10)},${customer},${seat},${machine},${a.exp ?? ''}\n`);
  console.log(code);
} else if (cmd === 'verify') {
  console.log(verifyOfflineCode(need(a.code, 'code'), readFileSync(pub, 'utf8'), need(a.machine, 'machine')));
} else {
  console.log('用法：pnpm license keypair | issue --machine AS-… --customer 名称 --seat 1/3 [--exp YYYY-MM-DD] | verify --code AIS1-… --machine AS-…');
}
