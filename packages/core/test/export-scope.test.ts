import { describe, it, expect } from 'vitest';
import { ScriptDoc } from '../src/doc.ts';
import { exportNodes, type ExportSelection } from '../src/export/scope.ts';

describe('episode export selection', () => {
  const selection = (episodes: string[], content: ExportSelection['content'] = 'script'): ExportSelection => ({ episodes, content, format: 'txt', layout: 'asian', texture: false, font: 'typewriter' });
  it('exports selected episodes in order without changing the writer or leaking other episode references', () => {
    const d = new ScriptDoc(); d.insert('end', 'heading', '内景 老屋 — 日', 'old'); d.insert('end', 'character', '豆豆'); d.insert('end', 'action', '拿起钥匙'); d.setOutline('第一集大纲'); d.setBeats('第一集节拍');
    d.bible('characters').add({ name: '豆豆' }); d.bible('characters').add({ name: '老师' }); d.bible('locations').add({ name: '老屋' }); d.bible('locations').add({ name: '学校' }); d.bible('props').add({ name: '钥匙' }); d.bible('props').add({ name: '课本' });
    const second = d.addEpisode('借来的东西'); d.insert('end', 'heading', '外景 学校 — 日', 'school'); d.insert('end', 'character', '老师'); d.insert('end', 'action', '合上课本'); d.commit();
    const texts = (content: ExportSelection['content']) => exportNodes(d, selection(['first'], content)).map((n) => n.text).join('\n');
    expect(texts('script')).toContain('拿起钥匙'); expect(texts('script')).not.toContain('合上课本');
    expect(texts('outline')).toContain('第一集大纲'); expect(texts('beats')).toContain('第一集节拍'); expect(texts('scenes')).toContain('老屋');
    expect(texts('characters')).toContain('豆豆'); expect(texts('characters')).not.toContain('老师');
    expect(texts('locations')).toContain('老屋'); expect(texts('locations')).not.toContain('学校');
    expect(texts('props')).toContain('钥匙'); expect(texts('props')).not.toContain('课本');
    expect(exportNodes(d, selection([second, 'first'])).filter((n) => n.type === 'subtitle').map((n) => n.text)).toEqual(['借来的东西', '第 1 集']);
    expect(d.activeEpisodeId).toBe(second);
  });
  it('refuses missing/duplicate episodes and non-script semantic formats', () => {
    const d = new ScriptDoc();
    for (const ids of [[], ['first','first'], ['missing']]) expect(() => exportNodes(d, selection(ids))).toThrow();
    expect(() => exportNodes(d, { ...selection(['first'], 'characters'), format: 'fdx' })).toThrow(/仅用于剧本/);
  });
});
