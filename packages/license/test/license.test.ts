import { createCipheriv, createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { KeygenClient, generateKeypair, issueOfflineCode, machineCode, readMachineFile, verifyOfflineCode } from '../src/index.ts';

describe('machine code', () => {
  it('is stable, formatted and differs per machine', () => {
    const a = machineCode('4C4C4544-0042-3510-8051-B4C04F4E4D32');
    expect(a).toMatch(/^AS-[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
    expect(machineCode('4c4c4544-0042-3510-8051-b4c04f4e4d32')).toBe(a);
    expect(machineCode('other')).not.toBe(a);
  });
});

describe('offline code', () => {
  const { privatePem, publicPem } = generateKeypair();
  const mine = machineCode('machine-a');
  const code = issueOfflineCode(privatePem, { mid: mine, cust: '北京', seat: '1/3', exp: null });

  it('activates on the machine it was issued for', () => {
    expect(verifyOfflineCode(code, publicPem, mine)).toMatchObject({ ok: true, payload: { cust: '北京', seat: '1/3' } });
    expect(verifyOfflineCode(code.replace(/(.{20})$/, ' $1'), publicPem, mine).ok).toBe(true); // pasted with a stray space
  });

  it('rejects another machine, any tampered character, a foreign key and expiry', () => {
    expect(verifyOfflineCode(code, publicPem, machineCode('machine-b'))).toEqual({ ok: false, reason: 'machine' });
    const i = 12;
    const tampered = code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1);
    expect(verifyOfflineCode(tampered, publicPem, mine).ok).toBe(false);
    expect(verifyOfflineCode(code, generateKeypair().publicPem, mine)).toEqual({ ok: false, reason: 'signature' });
    const old = issueOfflineCode(privatePem, { mid: mine, cust: 'x', seat: '1/1', exp: '2020-01-01' });
    expect(verifyOfflineCode(old, publicPem, mine)).toEqual({ ok: false, reason: 'expired' });
    expect(verifyOfflineCode('hello', publicPem, mine)).toEqual({ ok: false, reason: 'format' });
  });
});

// Builds a machine file the way Keygen documents it, so the offline reader is tested end to end.
function fakeMachineFile(licenseKey: string, fp: string, expiry: string | null) {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const verifyKeyHex = (publicKey.export({ format: 'der', type: 'spki' }) as Buffer).subarray(12).toString('hex');
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', createHash('sha256').update(licenseKey + fp).digest(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify({ meta: { issued: '2026-10-08', expiry, ttl: 1 }, data: { id: 'm1' } })), c.final()]);
  const enc = [ct, iv, c.getAuthTag()].map((b) => b.toString('base64')).join('.');
  const sig = sign(null, Buffer.from(`machine/${enc}`), privateKey).toString('base64');
  const cert = `-----BEGIN MACHINE FILE-----\n${Buffer.from(JSON.stringify({ enc, sig, alg: 'aes-256-gcm+ed25519' })).toString('base64')}\n-----END MACHINE FILE-----\n`;
  return { cert, verifyKeyHex };
}

describe('keygen machine file', () => {
  it('verifies and decrypts offline, and refuses another machine or a stale file', () => {
    const { cert, verifyKeyHex } = fakeMachineFile('KEY-1', 'fp-a', '2099-01-01T00:00:00Z');
    expect(readMachineFile(cert, 'KEY-1', 'fp-a', verifyKeyHex)).toMatchObject({ ok: true });
    expect(readMachineFile(cert, 'KEY-1', 'fp-b', verifyKeyHex)).toEqual({ ok: false, reason: 'decrypt' });
    const stale = fakeMachineFile('KEY-1', 'fp-a', '2020-01-01T00:00:00Z');
    expect(readMachineFile(stale.cert, 'KEY-1', 'fp-a', stale.verifyKeyHex)).toEqual({ ok: false, reason: 'expired' });
    expect(readMachineFile(cert, 'KEY-1', 'fp-a', stale.verifyKeyHex)).toEqual({ ok: false, reason: 'signature' });
  });
});

describe('keygen client', () => {
  it('reuses an existing machine and decrypts its checked-out certificate without network access', async () => {
    const key = 'TEST-LICENSE';
    const fp = 'existing-fingerprint';
    const { cert, verifyKeyHex } = fakeMachineFile(key, fp, '2099-01-01T00:00:00Z');
    const requests: string[] = [];
    const client = new KeygenClient({ accountId: 'acc', verifyKeyHex, fetch: (async (input, init) => {
      const url = new URL(String(input));
      requests.push(`${init?.method} ${url.pathname}`);
      if (url.pathname.endsWith('/validate-key')) {
        expect(JSON.parse(String(init?.body))).toEqual({ meta: { key, scope: { fingerprint: fp } } });
        return Response.json({ meta: { code: 'VALID' }, data: { id: 'lic' } });
      }
      expect(new Headers(init?.headers).get('Authorization')).toBe(`License ${key}`);
      if (init?.method === 'GET') {
        expect(url.searchParams.get('fingerprint')).toBe(fp);
        return Response.json({ data: [{ id: 'm1' }] });
      }
      expect(url.pathname).toBe('/v1/accounts/acc/machines/m1/actions/check-out');
      expect(Object.fromEntries(url.searchParams)).toEqual({ encrypt: 'true', ttl: '31556952', include: 'license' });
      return Response.json({ data: { attributes: { certificate: cert, expiry: '2099-01-01T00:00:00Z' } } });
    }) as typeof fetch });
    const result = await client.activate(key, fp, 'test computer', 'macOS');
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(readMachineFile(result.machineFile, key, fp, verifyKeyHex)).toMatchObject({ ok: true, data: { data: { id: 'm1' } } });
    expect(requests).toHaveLength(3);
    expect(requests).not.toContain('POST /v1/accounts/acc/machines');
  });

  const routes = (handlers: Record<string, (body: any) => [number, unknown]>) =>
    (async (url: string | URL, init?: RequestInit) => {
      const path = String(url).replace(/^.*\/accounts\/acc/, '').split('?')[0]!;
      const h = handlers[`${init?.method} ${path}`];
      if (!h) return new Response('{}', { status: 404 });
      const [status, body] = h(init?.body ? JSON.parse(String(init.body)) : null);
      return new Response(JSON.stringify(body), { status });
    }) as typeof fetch;

  it('activates a fresh license on this machine and checks out a file', async () => {
    const k = new KeygenClient({ accountId: 'acc', verifyKeyHex: '', fetch: routes({
      'POST /licenses/actions/validate-key': () => [200, { meta: { code: 'NO_MACHINE' }, data: { id: 'lic' } }],
      'POST /machines': (b) => [201, { data: { id: 'm1', attributes: b.data.attributes } }],
      'POST /machines/m1/actions/check-out': () => [200, { data: { attributes: { certificate: 'CERT', expiry: '2027-10-08' } } }],
    }) });
    expect(await k.activate('KEY', 'fp', 'Lin 的 MacBook', 'macOS')).toEqual({ ok: true, machineFile: 'CERT', machineId: 'm1', expiresAt: '2027-10-08' });
  });

  it('refuses a code already bound to another computer', async () => {
    const k = new KeygenClient({ accountId: 'acc', verifyKeyHex: '', fetch: routes({
      'POST /licenses/actions/validate-key': () => [200, { meta: { code: 'FINGERPRINT_SCOPE_MISMATCH' }, data: { id: 'lic' } }],
      'POST /machines': () => [422, { errors: [{ detail: 'machine count has exceeded maximum allowed for license (1)' }] }],
    }) });
    expect(await k.activate('KEY', 'fp2', 'x', 'win')).toMatchObject({ ok: false, reason: 'taken' });
  });

  it('reports unknown keys and network failures', async () => {
    const k = new KeygenClient({ accountId: 'acc', verifyKeyHex: '', fetch: routes({ 'POST /licenses/actions/validate-key': () => [404, { meta: { code: 'NOT_FOUND' } }] }) });
    expect(await k.activate('NOPE', 'fp', 'x', 'mac')).toEqual({ ok: false, reason: 'invalid-key' });
    const down = new KeygenClient({ accountId: 'acc', verifyKeyHex: '', fetch: (async () => { throw new TypeError('fetch failed'); }) as typeof fetch });
    expect(await down.activate('K', 'fp', 'x', 'mac')).toMatchObject({ ok: false, reason: 'network' });
  });
});
