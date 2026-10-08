// Activation gate (spec 0002 §6). Keygen first; the offline machine-bound code is the fallback.
import { app } from 'electron';
import { readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import machineIdPkg from 'node-machine-id';
import { KeygenClient, fingerprint, machineCode, readMachineFile, verifyOfflineCode } from '@scripter/license';
import type { ActivateResult, LicenseStatus } from '../shared/ipc.ts';
import { getSecret, setSecret } from './secrets.ts';
import { readJson, writeJson } from './store.ts';

declare const __KEYGEN_ACCOUNT__: string;
declare const __KEYGEN_VERIFY_KEY__: string;

type Stored = { via: 'keygen'; machineFile: string; machineId: string } | { via: 'offline'; code: string } | null;
const FILE = 'license.json';

const rawId = (() => { let v: string | undefined; return () => (v ??= machineIdPkg.machineIdSync(true)); })();
export const localMachineCode = () => machineCode(rawId());

function publicKey(): string | null {
  const p = !app.isPackaged && process.env.SCRIPTER_LICENSE_PUBKEY ? process.env.SCRIPTER_LICENSE_PUBKEY : app.isPackaged ? join(process.resourcesPath, 'license-public.pem') : join(app.getAppPath(), 'resources', 'license-public.pem');
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

const keygenConfigured = () => !!(__KEYGEN_ACCOUNT__ && __KEYGEN_VERIFY_KEY__);

export function licenseStatus(): LicenseStatus {
  const mc = localMachineCode();
  const s = readJson<Stored>(FILE, null);
  const inactive = (reason?: string): LicenseStatus => ({ state: 'inactive', reason, machineCode: mc, keygenConfigured: keygenConfigured() });
  if (!s) return inactive();
  if (s.via === 'offline') {
    const pk = publicKey();
    if (!pk) return inactive('应用缺少授权公钥');
    const r = verifyOfflineCode(s.code, pk, mc);
    if (!r.ok) return inactive({ machine: '激活码属于另一台电脑', signature: '激活码校验失败', expired: '激活码已过期', format: '激活码格式不对' }[r.reason]);
    return { state: 'active', via: 'offline', customer: r.payload.cust, seat: r.payload.seat, expiresAt: r.payload.exp, machineCode: mc };
  }
  const key = getSecret('licenseKey');
  if (!key || !keygenConfigured()) return inactive('授权信息不完整，请重新激活');
  const r = readMachineFile(s.machineFile, key, fingerprint(rawId()), __KEYGEN_VERIFY_KEY__);
  if (!r.ok) return inactive(r.reason === 'expired' ? '授权文件已到期，请联网重新激活' : '授权文件校验失败，请重新激活');
  return { state: 'active', via: 'keygen', expiresAt: r.data.meta.expiry, machineCode: mc };
}

export async function activateKeygen(key: string): Promise<ActivateResult> {
  if (!keygenConfigured()) return { ok: false, message: '这个版本没有配置在线激活，请使用手动激活' };
  const k = new KeygenClient({ accountId: __KEYGEN_ACCOUNT__, verifyKeyHex: __KEYGEN_VERIFY_KEY__ });
  const r = await k.activate(key.trim(), fingerprint(rawId()), hostname(), process.platform === 'darwin' ? 'macOS' : process.platform === 'win32' ? 'Windows' : process.platform);
  if (!r.ok) {
    const msg = { 'invalid-key': '激活码不存在，请检查是否输错', taken: '这个激活码已经绑定了另一台电脑', suspended: '这个激活码已被停用', expired: '这个激活码已过期', network: '连不上激活服务，请检查网络，或改用手动激活', unknown: `激活失败（${r.detail ?? '未知原因'}）` }[r.reason];
    return { ok: false, message: msg };
  }
  setSecret('licenseKey', key.trim());
  writeJson(FILE, { via: 'keygen', machineFile: r.machineFile, machineId: r.machineId });
  const st = licenseStatus();
  return st.state === 'active' ? { ok: true } : { ok: false, message: st.reason ?? '授权文件校验失败' };
}

export function activateOffline(code: string): ActivateResult {
  const pk = publicKey();
  if (!pk) return { ok: false, message: '应用缺少授权公钥，请联系提供者' };
  const r = verifyOfflineCode(code, pk, localMachineCode());
  if (!r.ok) return { ok: false, message: { machine: '这个激活码是给另一台电脑的。请把本机机器码发给提供者重新签发', signature: '激活码不正确（可能复制时少了字符）', expired: '激活码已过期', format: '激活码格式不对，应以 AIS1- 开头' }[r.reason] };
  writeJson(FILE, { via: 'offline', code: code.replace(/\s+/g, '') });
  return { ok: true };
}

export function deactivateLocal(): void {
  writeJson(FILE, null);
  setSecret('licenseKey', null);
}
