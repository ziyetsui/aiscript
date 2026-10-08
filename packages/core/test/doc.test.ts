import { describe, expect, it } from 'vitest';
import { ScriptDoc, applyOps, parseReply, scenes, toFdx, toFountain, toTxt, wordCount, nextTypeOnEnter, nextTypeOnTab, inferType } from '../src/index.ts';

const seed = () => {
  const d = new ScriptDoc();
  const h = d.insert('end', 'heading', '外景 胡同口 — 傍晚');
  const a = d.insert(h, 'action', '豆豆蹲在门墩儿旁边。');
  d.commit();
  return { d, h, a };
};

describe('ScriptDoc', () => {
  it('survives a snapshot round trip', () => {
    const { d } = seed();
    d.setTitle('门墩儿');
    const back = ScriptDoc.fromSnapshot(d.snapshot());
    expect(back.title).toBe('门墩儿');
    expect(back.nodes().map((n) => n.type)).toEqual(['heading', 'action']);
  });

  it('undoes one AI turn while keeping what the writer typed afterwards', () => {
    const { d, a } = seed();
    const t = d.turn('写对白', (x) => {
      const c = x.insert(a, 'character', '门墩儿');
      x.insert(c, 'dialogue', '别捏了。');
    });
    d.insert('end', 'action', '作者自己加的一行');
    d.commit();
    d.undoTurn(t.id);
    expect(d.nodes().map((n) => n.text)).toEqual(['外景 胡同口 — 傍晚', '豆豆蹲在门墩儿旁边。', '作者自己加的一行']);
  });

  it('rolls back a turn that throws half way', () => {
    const { d } = seed();
    expect(() => d.turn('坏的', (x) => { x.insert('end', 'action', '半截'); throw new Error('boom'); })).toThrow('boom');
    expect(d.nodes()).toHaveLength(2);
  });
});

describe('ops', () => {
  it('parses narration and validated ops, rejecting bad ones', () => {
    const r = parseReply('好的，加一段。<ops>[{"op":"insertNode","type":"character","text":"豆豆"},{"op":"insertNode","after":"$1","type":"dialogue","text":"真的？"},{"op":"explode"}]</ops>');
    expect(r.narration).toBe('好的，加一段。');
    expect(r.ops).toHaveLength(2);
    expect(r.errors).toHaveLength(1);
  });

  it('applies ops in order with $n aliases as one undoable turn', () => {
    const { d, a } = seed();
    const r = parseReply(`<ops>[{"op":"insertNode","after":"${a}","type":"character","text":"豆豆"},{"op":"insertNode","after":"$1","type":"dialogue","text":"石头说话了？"},{"op":"updateNode","id":"${a}","text":"豆豆往后一坐。"}]</ops>`);
    const t = applyOps(d, r.ops, 'turn 1');
    expect(d.nodes().map((n) => n.text)).toEqual(['外景 胡同口 — 傍晚', '豆豆往后一坐。', '豆豆', '石头说话了？']);
    d.undoTurn(t.id);
    expect(d.nodes().map((n) => n.text)).toEqual(['外景 胡同口 — 傍晚', '豆豆蹲在门墩儿旁边。']);
  });

  it('leaves the doc untouched when an op targets a missing node', () => {
    const { d } = seed();
    expect(() => applyOps(d, [{ op: 'insertNode', after: 'end', type: 'action', text: 'x' }, { op: 'updateNode', id: 'nope', text: 'y' }], 'bad')).toThrow();
    expect(d.nodes()).toHaveLength(2);
  });
});

describe('model helpers', () => {
  it('summarises scenes and counts words', () => {
    const { d, a } = seed();
    const c = d.insert(a, 'character', '豆豆');
    d.insert(c, 'dialogue', '那可说不准。');
    d.commit();
    const s = scenes(d.nodes());
    expect(s).toEqual([expect.objectContaining({ index: 1, characters: ['豆豆'], dialogueCount: 1 })]);
    expect(wordCount(d.nodes())).toBeGreaterThan(10);
    expect(nextTypeOnEnter('character')).toBe('dialogue');
    expect(nextTypeOnTab('dialogue')).toBe('transition');
    expect(nextTypeOnTab('dialogue', true)).toBe('parenthetical');
    expect(nextTypeOnTab('note')).toBe('action');
    expect(inferType('内景 豆豆家 — 夜', 'action')).toBe('heading');
  });
});

describe('export', () => {
  const nodes = [
    { id: '1', type: 'heading', text: '外景 胡同口 — 傍晚' },
    { id: '2', type: 'character', text: '门墩儿' },
    { id: '3', type: 'parenthetical', text: '（探出脑袋）' },
    { id: '4', type: 'dialogue', text: '别捏了 & 放手' },
    { id: '5', type: 'transition', text: '切至：' },
  ] as const;

  it('writes Fountain with forced Chinese elements', () => {
    const f = toFountain('门墩儿', [...nodes]);
    expect(f).toContain('.外景 胡同口 — 傍晚');
    expect(f).toContain('@门墩儿');
    expect(f).toContain('> 切至：');
  });

  it('writes escaped Final Draft XML', () => {
    const x = toFdx('门墩儿', [...nodes]);
    expect(x).toContain('<Paragraph Type="Scene Heading"><Text>外景 胡同口 — 傍晚</Text></Paragraph>');
    expect(x).toContain('别捏了 &amp; 放手');
    expect(x.startsWith('<?xml')).toBe(true);
  });

  it('writes indented TXT', () => {
    expect(toTxt('门墩儿', [...nodes])).toMatch(/\n {20}门墩儿\n/);
  });
});
