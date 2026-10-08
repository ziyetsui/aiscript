// Offline fallback (spec 0002 §6.3): a code signed with your private key and bound to one machine.
// Format: AIS1-<base64url(payload)>.<base64url(ed25519 signature over the payload bytes)>
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, type KeyObject } from 'node:crypto';
import { normaliseMachineCode } from './machine.ts';

export interface OfflinePayload { v: 1; mid: string; cust: string; seat: string; iat: string; exp: string | null }
export type OfflineResult =
  | { ok: true; payload: OfflinePayload }
  | { ok: false; reason: 'format' | 'signature' | 'machine' | 'expired' };

const PREFIX = 'AIS1-';
const b64u = (b: Uint8Array) => Buffer.from(b).toString('base64url');

export function generateKeypair(): { privatePem: string; publicPem: string } {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  };
}

export function issueOfflineCode(privatePem: string, p: Omit<OfflinePayload, 'v' | 'iat'> & { iat?: string }): string {
  const payload: OfflinePayload = { v: 1, mid: normaliseMachineCode(p.mid), cust: p.cust, seat: p.seat, iat: p.iat ?? new Date().toISOString().slice(0, 10), exp: p.exp };
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  const sig = sign(null, body, createPrivateKey(privatePem));
  return `${PREFIX}${b64u(body)}.${b64u(sig)}`;
}

export function verifyOfflineCode(code: string, publicPem: string | KeyObject, localMachineCode: string, now = new Date()): OfflineResult {
  const s = code.replace(/\s+/g, '');
  if (!s.startsWith(PREFIX)) return { ok: false, reason: 'format' };
  const [body64, sig64, extra] = s.slice(PREFIX.length).split('.');
  if (!body64 || !sig64 || extra !== undefined) return { ok: false, reason: 'format' };
  const body = Buffer.from(body64, 'base64url');
  const key = typeof publicPem === 'string' ? createPublicKey(publicPem) : publicPem;
  let good = false;
  try {
    good = verify(null, body, key, Buffer.from(sig64, 'base64url'));
  } catch {
    good = false;
  }
  if (!good) return { ok: false, reason: 'signature' };
  let payload: OfflinePayload;
  try {
    payload = JSON.parse(body.toString('utf8')) as OfflinePayload;
  } catch {
    return { ok: false, reason: 'format' };
  }
  if (payload.v !== 1) return { ok: false, reason: 'format' };
  if (normaliseMachineCode(payload.mid) !== normaliseMachineCode(localMachineCode)) return { ok: false, reason: 'machine' };
  if (payload.exp && new Date(payload.exp) < now) return { ok: false, reason: 'expired' };
  return { ok: true, payload };
}
