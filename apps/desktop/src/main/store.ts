// Small JSON files under userData. Writes are atomic (tmp + rename) so a crash never leaves half a file.
import { app } from 'electron';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const dataDir = () => app.getPath('userData');

export function readJson<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(dataDir(), name), 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export function writeAtomic(path: string, data: string | Uint8Array, mode = 0o600): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, data, { mode });
  renameSync(tmp, path);
}

export function writeJson(name: string, value: unknown): void {
  writeAtomic(join(dataDir(), name), JSON.stringify(value, null, 2));
}
