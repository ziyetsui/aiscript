import { describe, it, expect } from 'vitest';
import { ScriptDoc } from '../src/doc.ts';

describe('project episodes', () => {
  it('keeps legacy nodes in the first episode and round trips independent scripts and outlines', () => {
    const legacy = new ScriptDoc(); legacy.insert('end', 'heading', '内景 老屋 — 日', 'old'); legacy.setOutline('第一集大纲'); legacy.commit();
    const doc = ScriptDoc.fromSnapshot(legacy.snapshot());
    expect(doc.episodes()).toEqual([{ id: 'first', title: '第 1 集' }]);
    const second = doc.addEpisode('借来的东西');
    expect(doc.nodes()).toEqual([]); expect(doc.outline).toBe('');
    doc.insert('end', 'heading', '外景 学校 — 日', 'second'); doc.setOutline('第二集大纲'); doc.setBeats('第二集节拍'); doc.setCover({ author: '第二集作者' }); doc.commit();
    doc.selectEpisode('first'); expect(doc.nodes()[0]?.id).toBe('old'); expect(doc.outline).toBe('第一集大纲');
    doc.renameEpisode('first', '门墩儿');
    const restored = ScriptDoc.fromSnapshot(doc.snapshot());
    expect(restored.episodes().map((e) => e.title)).toEqual(['门墩儿', '借来的东西']);
    restored.selectEpisode(second); expect(restored.nodes()[0]?.id).toBe('second'); expect(restored.outline).toBe('第二集大纲');
    expect(restored.beats).toBe('第二集节拍'); expect(restored.cover.author).toBe('第二集作者'); expect(restored.episode('first').cover.author).toBe('');
    expect(restored.episode('first').nodes()[0]?.id).toBe('old');
    expect(restored.activeEpisodeId).toBe(second); // read-only export view must not switch the writer
  });
  it('undo targets its episode, preserves another episode and shares project references', () => {
    const d = new ScriptDoc(); const t = d.turn('first scene', (x) => x.insert('end', 'action', '第一集', 'one'));
    const second = d.addEpisode('第二集'); d.insert('end', 'action', '第二集', 'two'); d.commit();
    d.bible('characters').add({ name: '豆豆' }); d.commit();
    d.undoTurn(t.id); expect(d.nodes().map((n) => n.text)).toEqual(['第二集']);
    expect(d.episode('first').nodes()).toEqual([]); expect(d.bible('characters').all()[0]?.name).toBe('豆豆');
    expect(d.activeEpisodeId).toBe(second);
    expect(() => d.selectEpisode('../other')).toThrow(); expect(d.activeEpisodeId).toBe(second);
  });
});
