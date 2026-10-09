import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { loadSnapshot, saveSnapshot, backupSnapshot, listBackups, readBackup } from '../../apps/desktop/src/main/local-data.ts';
const sample = (text: string) => ({ meta: JSON.stringify({ id: 'test', chat: [{ text }], archive: [] }), script: new Uint8Array([1, 2, text.length]) });
const dir = () => mkdtempSync(join(tmpdir(), 'scripter-storage-'));
describe('local SQLite durability', () => {
  it('imports legacy files without deleting them and keeps whole conversations across builds', () => {
    const d = dir();
    try {
      const old = sample('旧对话'); writeFileSync(join(d, 'meta.json'), old.meta); writeFileSync(join(d, 'script.loro'), old.script);
      expect(loadSnapshot(d)).toMatchObject({ ...old, legacy: true });
      saveSnapshot(d, old, 'build1');
      const next = sample('新对话'); saveSnapshot(d, next, 'build2');
      expect(loadSnapshot(d)).toMatchObject(next);
      expect(readFileSync(join(d, 'meta.json'), 'utf8')).toBe(old.meta);
      const backups = listBackups(d); expect(backups.some((b) => b.reason === '升级前')).toBe(true);
      expect(readBackup(d, backups.find((b) => b.reason === '升级前')!.name)).toMatchObject(old);
    } finally { rmSync(d, { recursive: true, force: true }); }
  });
  it('rolls back a failed transaction and preserves the previous snapshot', () => {
    const d = dir();
    try {
      const old = sample('完整历史'); saveSnapshot(d, old, 'build1');
      const db = new DatabaseSync(join(d, 'project.sqlite'));
      db.exec("CREATE TRIGGER fail BEFORE UPDATE ON snapshot BEGIN SELECT RAISE(ABORT, 'disk failure'); END"); db.close();
      expect(() => saveSnapshot(d, sample('部分写入'), 'build1')).toThrow('disk failure');
      expect(loadSnapshot(d)).toMatchObject(old);
    } finally { rmSync(d, { recursive: true, force: true }); }
  });
  it('manual backups remain readable when the active database is corrupt; rejects path traversal', () => {
    const d = dir();
    try {
      const old = sample('重要对话'); saveSnapshot(d, old, 'build1');
      const name = backupSnapshot(d, 'manual'); writeFileSync(join(d, 'project.sqlite'), 'corrupt');
      expect(() => loadSnapshot(d)).toThrow(); expect(readBackup(d, name)).toMatchObject(old);
      expect(() => readBackup(d, '../project.sqlite')).toThrow('备份名称');
    } finally { rmSync(d, { recursive: true, force: true }); }
  });
  it('never overwrites data from a newer database schema', () => {
    const d = dir();
    try {
      saveSnapshot(d, sample('未来版本'), 'build2');
      const db = new DatabaseSync(join(d, 'project.sqlite')); db.exec('PRAGMA user_version=99'); db.close();
      expect(() => saveSnapshot(d, sample('旧版本'), 'build1')).toThrow('较新版本');
      expect(() => loadSnapshot(d)).toThrow('较新版本');
    } finally { rmSync(d, { recursive: true, force: true }); }
  });
  it('recovers the last committed snapshot after a killed transaction with a hot journal', () => {
    if (process.platform === 'win32') return; // Windows termination is covered by Electron persistence tests.
    const d = dir();
    try {
      const old = { ...sample('已提交'), script: new Uint8Array(3 * 1024 * 1024).fill(7) }; saveSnapshot(d, old, 'build1');
      const result = spawnSync(process.execPath, ['-e', "const {DatabaseSync}=require('node:sqlite'); const db=new DatabaseSync(process.argv[1]); db.exec('PRAGMA cache_size=1; BEGIN IMMEDIATE; UPDATE snapshot SET script=zeroblob(4000000)'); process.kill(process.pid,'SIGKILL');", join(d, 'project.sqlite')]);
      expect(result.signal).toBe('SIGKILL'); const recovered = loadSnapshot(d); expect(recovered.meta).toBe(old.meta); expect(Buffer.from(recovered.script).equals(Buffer.from(old.script))).toBe(true);
    } finally { rmSync(d, { recursive: true, force: true }); }
  });
  it('repairs an interrupted daily backup instead of trusting a partial final file', () => {
    const d = dir();
    try {
      const old = sample('有效快照'); saveSnapshot(d, old, 'build1');
      const daily = listBackups(d).find((b) => b.reason === '每日自动')!;
      writeFileSync(join(d, 'backups', daily.name), '');
      saveSnapshot(d, sample('随后保存'), 'build1');
      expect(readBackup(d, daily.name)).toMatchObject(old);
    } finally { rmSync(d, { recursive: true, force: true }); }
  });

  it('retains the documented backup limits without removing the migration checkpoint', () => {
    const d = dir();
    try {
      const old = sample('迁移原稿'); writeFileSync(join(d, 'meta.json'), old.meta); writeFileSync(join(d, 'script.loro'), old.script);
      saveSnapshot(d, old, 'build0');
      for (let i = 1; i <= 8; i++) { saveSnapshot(d, sample(`版本${i}`), `build${i}`); backupSnapshot(d, 'manual'); }
      const backups = listBackups(d);
      expect(backups.filter((b) => b.reason === '升级前')).toHaveLength(5);
      expect(backups.filter((b) => b.reason === '手动')).toHaveLength(5);
      expect(backups.filter((b) => b.reason === '旧数据迁移')).toHaveLength(1);
    } finally { rmSync(d, { recursive: true, force: true }); }
  });

});
