// Machine code (spec 0002 §6.3): SHA-256(salt + OS machine id) → first 80 bits → Crockford Base32,
// shown as AS-XXXX-XXXX-XXXX-XXXX. Crockford drops I, L, O, U so codes survive being read aloud.
import { createHash } from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SALT = 'ancher-scripter/machine/v1';

export function crockford(bytes: Uint8Array, bits: number): string {
  let out = '';
  let acc = 0;
  let n = 0;
  let used = 0;
  for (const b of bytes) {
    acc = (acc << 8) | b;
    n += 8;
    while (n >= 5 && used < bits) {
      out += ALPHABET[(acc >> (n - 5)) & 31];
      n -= 5;
      used += 5;
    }
    acc &= (1 << n) - 1;
    if (used >= bits) break;
  }
  return out;
}

/** `rawId` is the OS id (IOPlatformUUID on macOS, MachineGuid on Windows). */
export function machineCode(rawId: string): string {
  const h = createHash('sha256').update(SALT).update(rawId.trim().toLowerCase()).digest();
  const c = crockford(h, 80);
  return `AS-${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}-${c.slice(12, 16)}`;
}

/** Fingerprint sent to Keygen: never the raw OS id. */
export function fingerprint(rawId: string): string {
  return createHash('sha256').update(`${SALT}/fp`).update(rawId.trim().toLowerCase()).digest('hex');
}

export function normaliseMachineCode(s: string): string {
  return s.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/^AS/, '');
}
