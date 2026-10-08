// Keygen hosted activation (spec 0002 §6.2). One license = one machine (policy maxMachines=1,
// users may not deactivate). The client authenticates with the license key itself — no admin token ships.
// [待实测] Written against keygen.sh/docs/api (validate-key, machines, check-out); verify with a real account.
import { createDecipheriv, createHash, createPublicKey, verify } from 'node:crypto';

export interface KeygenConfig { accountId: string; verifyKeyHex: string; baseUrl?: string; fetch?: typeof fetch }
export type ActivateResult =
  | { ok: true; machineFile: string; machineId: string; expiresAt: string | null }
  | { ok: false; reason: 'invalid-key' | 'taken' | 'suspended' | 'expired' | 'network' | 'unknown'; detail?: string };

const JSONAPI = { 'Content-Type': 'application/vnd.api+json', Accept: 'application/vnd.api+json' };

export class KeygenClient {
  private readonly base: string;
  private readonly f: typeof fetch;
  constructor(private readonly cfg: KeygenConfig) {
    this.base = `${cfg.baseUrl ?? 'https://api.keygen.sh'}/v1/accounts/${cfg.accountId}`;
    this.f = cfg.fetch ?? fetch;
  }

  private async call(path: string, init: RequestInit): Promise<{ status: number; body: any }> {
    const res = await this.f(`${this.base}${path}`, init);
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  }

  /** Validate → activate this machine if needed → check out an encrypted machine file for offline use. */
  async activate(licenseKey: string, fp: string, name: string, platform: string): Promise<ActivateResult> {
    try {
      const v = await this.call('/licenses/actions/validate-key', {
        method: 'POST', headers: JSONAPI,
        body: JSON.stringify({ meta: { key: licenseKey, scope: { fingerprint: fp } } }),
      });
      const code: string | undefined = v.body?.meta?.code;
      const licenseId: string | undefined = v.body?.data?.id;
      if (!licenseId || code === 'NOT_FOUND') return { ok: false, reason: 'invalid-key' };
      if (code === 'SUSPENDED' || code === 'BANNED') return { ok: false, reason: 'suspended' };
      if (code === 'EXPIRED') return { ok: false, reason: 'expired' };
      const auth = { ...JSONAPI, Authorization: `License ${licenseKey}` };
      let machineId: string | undefined;
      if (code === 'VALID') {
        const m = await this.call(`/machines?fingerprint=${encodeURIComponent(fp)}`, { method: 'GET', headers: auth });
        machineId = m.body?.data?.[0]?.id;
      } else if (code === 'NO_MACHINE' || code === 'NO_MACHINES' || code === 'FINGERPRINT_SCOPE_MISMATCH') {
        const m = await this.call('/machines', {
          method: 'POST', headers: auth,
          body: JSON.stringify({ data: { type: 'machines', attributes: { fingerprint: fp, name, platform }, relationships: { license: { data: { type: 'licenses', id: licenseId } } } } }),
        });
        if (m.status === 422) return { ok: false, reason: 'taken', detail: m.body?.errors?.[0]?.detail };
        machineId = m.body?.data?.id;
      } else if (code === 'TOO_MANY_MACHINES') {
        return { ok: false, reason: 'taken' };
      }
      if (!machineId) return { ok: false, reason: 'unknown', detail: code };
      const c = await this.call(`/machines/${machineId}/actions/check-out?encrypt=true&ttl=31556952&include=license`, { method: 'POST', headers: auth });
      const cert: string | undefined = c.body?.data?.attributes?.certificate;
      if (!cert) return { ok: false, reason: 'unknown', detail: `check-out ${c.status}` };
      return { ok: true, machineFile: cert, machineId, expiresAt: c.body?.data?.attributes?.expiry ?? null };
    } catch (e) {
      return { ok: false, reason: 'network', detail: String(e) };
    }
  }
}

export interface MachineFileData { meta: { issued: string; expiry: string | null; ttl: number }; data: unknown; included?: unknown[] }

/** Verify (Ed25519) and decrypt (AES-256-GCM, key = SHA-256(licenseKey + fingerprint)) a machine file, offline. */
export function readMachineFile(certificate: string, licenseKey: string, fp: string, verifyKeyHex: string, now = new Date()):
  { ok: true; data: MachineFileData } | { ok: false; reason: 'format' | 'signature' | 'decrypt' | 'expired' } {
  const b64 = certificate.replace(/-----(BEGIN|END) MACHINE FILE-----/g, '').replace(/\s+/g, '');
  let doc: { enc: string; sig: string; alg: string };
  try {
    doc = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  } catch {
    return { ok: false, reason: 'format' };
  }
  if (doc.alg !== 'aes-256-gcm+ed25519') return { ok: false, reason: 'format' };
  const key = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(verifyKeyHex, 'hex')]), format: 'der', type: 'spki' });
  if (!verify(null, Buffer.from(`machine/${doc.enc}`), key, Buffer.from(doc.sig, 'base64'))) return { ok: false, reason: 'signature' };
  const [ct, iv, tag] = doc.enc.split('.').map((p) => Buffer.from(p, 'base64'));
  if (!ct || !iv || !tag) return { ok: false, reason: 'format' };
  let data: MachineFileData;
  try {
    const d = createDecipheriv('aes-256-gcm', createHash('sha256').update(licenseKey + fp).digest(), iv);
    d.setAuthTag(tag);
    data = JSON.parse(Buffer.concat([d.update(ct), d.final()]).toString('utf8'));
  } catch {
    return { ok: false, reason: 'decrypt' };
  }
  if (data.meta?.expiry && new Date(data.meta.expiry) < now) return { ok: false, reason: 'expired' };
  return { ok: true, data };
}
