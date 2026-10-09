import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { containsSecret } from './secrets.ts';
describe('package secret scan', () => {
  it('detects a real private key both as PEM and escaped JSON', () => {
    const pem = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    expect(containsSecret(pem)).toBe(true);
    expect(containsSecret(JSON.stringify({ key: pem }))).toBe(true);
  });
  it('does not confuse a crypto library PEM header check with private key material', () => {
    expect(containsSecret("if (pem.startsWith('-----BEGIN PRIVATE KEY-----')) parse(pem);")).toBe(false);
  });
  it('still detects common API key formats', () => {
    expect(containsSecret('AIza' + 'x'.repeat(35))).toBe(true);
    expect(containsSecret('sk-proj-' + 'x'.repeat(25))).toBe(true);
    expect(containsSecret('sk_live_' + 'x'.repeat(25))).toBe(true);
  });
});
