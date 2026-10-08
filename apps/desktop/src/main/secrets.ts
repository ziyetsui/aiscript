// API keys live only in the OS keychain-backed safeStorage (DPAPI on Windows, Keychain on macOS).
// The renderer never receives a key back (spec 0002 §4.1, §12.4 "strings 扫描").
import { safeStorage } from 'electron';
import { readJson, writeJson } from './store.ts';

type Name = 'ancher' | 'gemini' | 'licenseKey';
const FILE = 'secrets.json';

export const encryptionAvailable = () => safeStorage.isEncryptionAvailable();

export function getSecret(name: Name): string | null {
  const all = readJson<Record<string, string>>(FILE, {});
  const v = all[name];
  if (!v || !encryptionAvailable()) return null;
  try {
    return safeStorage.decryptString(Buffer.from(v, 'base64'));
  } catch {
    return null;
  }
}

export function setSecret(name: Name, value: string | null): void {
  if (value !== null && !encryptionAvailable()) throw new Error('系统钥匙串不可用，无法安全保存密钥');
  const all = readJson<Record<string, string>>(FILE, {});
  if (value === null) delete all[name];
  else all[name] = safeStorage.encryptString(value).toString('base64');
  writeJson(FILE, all);
}
