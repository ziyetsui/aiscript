import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { saveSnapshot, loadSnapshot, listScriptRevisions, readScriptRevision, backupSnapshot, readBackup, exportScriptRevisions, importScriptRevisions, listOutlineRevisions, readOutlineRevision, importOutlineRevisions, exportOutlineRevisions, listBeatsRevisions, readBeatsRevision, importBeatsRevisions } from '../../apps/desktop/src/main/local-data.ts';

const snapshot = (text: string) => ({ meta: JSON.stringify({ title: text }), script: new Uint8Array([1, 2, text.length]) });
const version = (text: string, episodeId = 'first', force = false) => ({ episodeId, nodes: [{ id: 'scene1', type: 'heading' as const, text }], label: '编辑剧本', force });
const withDir = (test: (dir: string) => void) => { const dir = mkdtempSync(join(tmpdir(), 'script-revisions-')); try { test(dir); } finally { rmSync(dir, { recursive: true, force: true }); } };

describe('script revision durability', () => {
  it('reads all revision history from a backup and imports it without overwriting duplicates', () => withDir(dir => {
    saveSnapshot(dir, snapshot('初稿'), 'build', [version('初稿')]);
    saveSnapshot(dir, snapshot('改稿'), 'build', [version('改稿')]);
    const backup = readBackup(dir, backupSnapshot(dir));
    expect(backup.revisions?.map(v => v.revision)).toEqual([1, 2]);
    withDir(copy => {
      importScriptRevisions(copy, backup.revisions);
      expect(exportScriptRevisions(copy).map(v => v.nodes[0]?.text)).toEqual(['初稿', '改稿']);
      expect(() => importScriptRevisions(copy, backup.revisions)).toThrow();
      expect(exportScriptRevisions(copy)).toHaveLength(2);
    });
  }));
  it('keeps immutable per-episode versions, dedupes unchanged saves, and allows manual checkpoints', () => withDir(dir => {
    saveSnapshot(dir, snapshot('初稿'), 'build', [version('初稿')]);
    saveSnapshot(dir, snapshot('初稿'), 'build', [version('初稿')]);
    saveSnapshot(dir, snapshot('改稿'), 'build', [version('改稿'), version('另一集', 'episode2')]);
    expect(listScriptRevisions(dir, 'first').map(v => v.revision)).toEqual([2, 1]);
    expect(readScriptRevision(dir, 'first', 1).nodes[0]?.text).toBe('初稿');
    expect(readScriptRevision(dir, 'episode2', 1).nodes[0]?.text).toBe('另一集');
    saveSnapshot(dir, snapshot('改稿'), 'build', [version('改稿', 'first', true)]);
    expect(listScriptRevisions(dir, 'first').map(v => v.revision)).toEqual([3, 2, 1]);
  }));

  it('commits revisions and current project together or neither', () => withDir(dir => {
    saveSnapshot(dir, snapshot('初稿'), 'build', [version('初稿')]);
    const db = new DatabaseSync(join(dir, 'project.sqlite'));
    db.exec("CREATE TRIGGER fail_revision BEFORE INSERT ON script_revisions BEGIN SELECT RAISE(ABORT, 'disk failure'); END"); db.close();
    expect(() => saveSnapshot(dir, snapshot('改稿'), 'build', [version('改稿')])).toThrow('disk failure');
    expect(loadSnapshot(dir).meta).toBe(snapshot('初稿').meta);
    expect(listScriptRevisions(dir, 'first')).toHaveLength(1);
  }));

  it('rejects missing or malformed revisions before they can be restored', () => withDir(dir => {
    saveSnapshot(dir, snapshot('初稿'), 'build', [version('初稿')]);
    expect(() => readScriptRevision(dir, 'first', 0)).toThrow();
    expect(() => readScriptRevision(dir, 'episode2', 1)).toThrow();
    const db = new DatabaseSync(join(dir, 'project.sqlite'));
    db.prepare('UPDATE script_revisions SET nodes=?').run('[{"id":"x","type":"bad","text":"text"}]'); db.close();
    expect(() => readScriptRevision(dir, 'first', 1)).toThrow();
  }));
});


describe('outline revision durability', () => {
  it('records outlines independently from scripts, per episode, including manual checkpoints', () => withDir(dir => {
    const outline = (text: string, episodeId = 'first', force = false) => ({ episodeId, text, label: '编辑大纲', force });
    saveSnapshot(dir, snapshot('初稿'), 'build', [version('剧本')], [outline('起承转合')]);
    saveSnapshot(dir, snapshot('改稿'), 'build', [version('剧本')], [outline('起承转合')]);
    saveSnapshot(dir, snapshot('改稿'), 'build', [version('剧本')], [outline('新的结尾'), outline('另一集', 'second')]);
    expect(listOutlineRevisions(dir, 'first').map(v => v.revision)).toEqual([2, 1]);
    expect(readOutlineRevision(dir, 'first', 1).text).toBe('起承转合');
    expect(readOutlineRevision(dir, 'second', 1).text).toBe('另一集');
    expect(listScriptRevisions(dir, 'first')).toHaveLength(1);
    saveSnapshot(dir, snapshot('改稿'), 'build', [], [outline('新的结尾', 'first', true)]);
    expect(listOutlineRevisions(dir, 'first')).toHaveLength(3);
    const backup = readBackup(dir, backupSnapshot(dir));
    withDir(copy => {
      importOutlineRevisions(copy, backup.outlineRevisions);
      expect(exportOutlineRevisions(copy)).toEqual(exportOutlineRevisions(dir));
    });
  }));
  it('rolls back the snapshot when an outline version cannot be saved', () => withDir(dir => {
    const outline = { episodeId: 'first', text: '初稿', label: '编辑大纲' };
    saveSnapshot(dir, snapshot('初稿'), 'build', [], [outline]);
    const db = new DatabaseSync(join(dir, 'project.sqlite'));
    db.exec("CREATE TRIGGER fail_outline BEFORE INSERT ON outline_revisions BEGIN SELECT RAISE(ABORT, 'disk failure'); END"); db.close();
    expect(() => saveSnapshot(dir, snapshot('改稿'), 'build', [], [{ ...outline, text: '改稿' }])).toThrow('disk failure');
    expect(loadSnapshot(dir).meta).toBe(snapshot('初稿').meta);
    expect(listOutlineRevisions(dir, 'first')).toHaveLength(1);
  }));
});

it('stores standalone beat versions separately from outlines and preserves them through backups', () => withDir(dir => {
  const beats = (text: string, episodeId = 'first', force = false) => ({ episodeId, text, label: '编辑节拍', force });
  saveSnapshot(dir, snapshot('初稿'), 'build', [], [], [beats('开场 → 原结尾')]);
  saveSnapshot(dir, snapshot('改稿'), 'build', [], [], [beats('新开场 → 新结尾'), beats('第二集', 'second')]);
  expect(listBeatsRevisions(dir, 'first').map(v => v.revision)).toEqual([2, 1]);
  expect(readBeatsRevision(dir, 'first', 2).text).toBe('新开场 → 新结尾');
  expect(readBeatsRevision(dir, 'first', 1).text).toBe('开场 → 原结尾');
  expect(readBeatsRevision(dir, 'second', 1).text).toBe('第二集');
  expect(listOutlineRevisions(dir, 'first')).toEqual([]);
  saveSnapshot(dir, snapshot('改稿'), 'build', [], [], [beats('新开场 → 新结尾', 'first', true)]);
  expect(listBeatsRevisions(dir, 'first')).toHaveLength(3);
  const backup = readBackup(dir, backupSnapshot(dir));
  withDir(copy => {
    importBeatsRevisions(copy, backup.beatsRevisions);
    expect(readBeatsRevision(copy, 'first', 1).text).toBe('开场 → 原结尾');
    expect(readBeatsRevision(copy, 'first', 2).text).toBe('新开场 → 新结尾');
  });
}));
