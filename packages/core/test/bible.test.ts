import { describe, expect, it } from 'vitest';
import { ScriptDoc, applyOps, bibleBrief, characterStats, locationScenes, parseReply } from '../src/index.ts';

describe('bible collections', () => {
  it('adds, updates, moves and removes; survives a snapshot', () => {
    const d = new ScriptDoc();
    const c = d.bible('characters');
    const a = c.add({ name: '豆豆', role: '男 · 9 岁' });
    const b = c.add({ name: '门墩儿' });
    c.update(a.id, { want: '被同学看见', x: 120 });
    c.move(b.id, 0);
    d.bible('world').add({ title: '世界规则', value: '门墩儿只能"借"不能"变"' });
    d.commit();
    const back = ScriptDoc.fromSnapshot(d.snapshot()).readBible();
    expect(back.characters.map((x) => x.name)).toEqual(['门墩儿', '豆豆']);
    expect(back.characters[1]).toMatchObject({ want: '被同学看见', x: 120, castLocked: false, fear: '' });
    expect(back.world[0]!.value).toContain('借');
    d.bible('characters').remove(b.id);
    expect(d.readBible().characters).toHaveLength(1);
  });

  it('hides relations whose character no longer exists', () => {
    const d = new ScriptDoc();
    const a = d.bible('characters').add({ name: '豆豆' });
    const t = d.turn('ai', (x) => { x.bible('characters').add({ name: '门墩儿', id: 'mdr' }); });
    d.bible('relations').add({ a: a.id, b: 'mdr', label: '秘密朋友' });
    d.commit();
    expect(d.readBible().relations).toHaveLength(1);
    d.undoTurn(t.id);
    expect(d.readBible().relations).toEqual([]);
  });

  it('stores arrays (location times) intact', () => {
    const d = new ScriptDoc();
    d.bible('locations').add({ name: '胡同口', times: ['傍晚', '日'] });
    expect(d.readBible().locations[0]!.times).toEqual(['傍晚', '日']);
  });
});

describe('bible ops from the agent', () => {
  it('upserts by name inside the same undoable turn', () => {
    const d = new ScriptDoc();
    d.bible('characters').add({ name: '豆豆', role: '学生' });
    d.commit();
    const r = parseReply('<ops>[{"op":"insertNode","type":"heading","text":"外景 胡同口 — 傍晚"},{"op":"upsertCharacter","name":"豆豆","desc":"胆小心细"},{"op":"upsertCharacter","name":"门墩儿","role":"精灵"},{"op":"upsertLocation","name":"胡同口","ie":"外景","times":["傍晚"]},{"op":"setWorld","title":"世界规则","value":"只有豆豆看得见门墩儿"}]</ops>');
    expect(r.errors).toEqual([]);
    const t = applyOps(d, r.ops, '第一场');
    const b = d.readBible();
    expect(b.characters.map((c) => [c.name, c.role, c.desc])).toEqual([['豆豆', '学生', '胆小心细'], ['门墩儿', '精灵', '']]);
    expect(b.locations[0]).toMatchObject({ name: '胡同口', ie: '外景', times: ['傍晚'] });
    d.undoTurn(t.id);
    const after = d.readBible();
    expect(after.characters.map((c) => [c.name, c.desc])).toEqual([['豆豆', '']]);
    expect(after.locations).toEqual([]);
    expect(after.world).toEqual([]);
    expect(d.nodes()).toEqual([]);
  });

  it('rejects a bad location type', () => {
    expect(parseReply('<ops>[{"op":"upsertLocation","name":"x","ie":"室内"}]</ops>').errors).toHaveLength(1);
  });
});

describe('derived stats', () => {
  const nodes = [
    { id: '1', type: 'heading', text: '外景 胡同口 — 傍晚' },
    { id: '2', type: 'character', text: '豆豆' }, { id: '3', type: 'dialogue', text: '石头说话了？' },
    { id: '4', type: 'character', text: '门墩儿' }, { id: '5', type: 'dialogue', text: '别捏了。' },
    { id: '6', type: 'character', text: '豆豆（小声）' }, { id: '7', type: 'dialogue', text: '那可说不准。' },
    { id: '8', type: 'heading', text: '内景 豆豆家 — 夜' },
    { id: '9', type: 'character', text: '豆豆' }, { id: '10', type: 'dialogue', text: '姥爷。' },
  ] as const;

  it('counts scenes and lines per character, ignoring parentheticals in the name', () => {
    const s = characterStats([...nodes]);
    expect(s.get('豆豆')).toEqual({ scenes: 2, lines: 3 });
    expect(s.get('门墩儿')).toEqual({ scenes: 1, lines: 1 });
  });

  it('finds the scenes a location appears in', () => {
    expect(locationScenes([...nodes], '胡同口')).toEqual([1]);
    expect(locationScenes([...nodes], '豆豆家')).toEqual([2]);
    expect(locationScenes([...nodes], '')).toEqual([]);
  });

  it('summarises the bible for the model', () => {
    const d = new ScriptDoc();
    const a = d.bible('characters').add({ name: '豆豆', role: '学生', want: '被看见' });
    const b = d.bible('characters').add({ name: '门墩儿' });
    d.bible('relations').add({ a: a.id, b: b.id, label: '秘密朋友' });
    d.bible('world').add({ title: '空的', value: '' });
    const s = bibleBrief(d.readBible());
    expect(s).toContain('豆豆（学生）；想要：被看见');
    expect(s).toContain('豆豆 — 门墩儿：秘密朋友');
    expect(s).not.toContain('空的');
  });
});

describe('reference brief', async () => {
  const { referenceBrief } = await import('../src/index.ts');
  it('includes only pinned, extracted files within budget', () => {
    const d = new ScriptDoc();
    d.bible('files').add({ name: 'a.txt', pinned: true, extract: 'ready', excerpt: '甲'.repeat(4000) });
    d.bible('files').add({ name: 'b.txt', pinned: true, extract: 'ready', excerpt: '乙'.repeat(10) });
    d.bible('files').add({ name: 'c.txt', pinned: false, extract: 'ready', excerpt: '丙' });
    d.bible('files').add({ name: 'd.pdf', pinned: true, extract: 'working', excerpt: '' });
    const r = referenceBrief(d.readBible(), 1000);
    expect(r).toContain('《a.txt》');
    expect(r).toContain('乙'.repeat(10));
    expect(r).not.toContain('丙');
    expect(r).not.toContain('d.pdf');
    expect(r.length).toBeLessThan(1100);
  });
});

describe('storyboard shots', async () => {
  const { shotsByScene, shotsCsv } = await import('../src/index.ts');
  it('setShots replaces a scene\'s shots in one undoable turn; dropped with their heading', () => {
    const d = new ScriptDoc();
    const t0 = applyOps(d, parseReply('<ops>[{"op":"insertNode","type":"heading","text":"外景 胡同口 — 傍晚","id":"h1"},{"op":"insertNode","type":"action","text":"豆豆蹲着。"},{"op":"setShots","sceneId":"h1","shots":[{"size":"全景","desc":"胡同口，夕阳","dur":4},{"desc":"豆豆捏鞋"}]}]</ops>').ops, '第一场');
    const head = d.nodes()[0]!;
    let b = d.readBible();
    expect(b.shots.map((s) => [s.sceneId, s.size, s.dur])).toEqual([[head.id, '全景', 4], [head.id, '中景', 3]]);
    const r = parseReply(`<ops>[{"op":"setShots","sceneId":"${head.id}","shots":[{"size":"特写","desc":"鞋底的「林」字","dur":2}]}]</ops>`);
    expect(r.errors).toEqual([]);
    const t1 = applyOps(d, r.ops, '拆镜');
    b = d.readBible();
    expect(b.shots.map((s) => s.desc)).toEqual(['鞋底的「林」字']);
    expect(shotsCsv(d.nodes(), b.shots)).toContain('"1","外景 胡同口 — 傍晚","1","特写"');
    d.undoTurn(t1.id);
    expect(d.readBible().shots).toHaveLength(2);
    expect(shotsByScene(d.nodes(), d.readBible().shots)[0]!.shots).toHaveLength(2);
    d.undoTurn(t0.id);
    expect(d.readBible().shots).toEqual([]);
  });

  it('rejects an unknown shot size', () => {
    expect(parseReply('<ops>[{"op":"setShots","sceneId":"x","shots":[{"size":"大远景","desc":"a"}]}]</ops>').errors).toHaveLength(1);
  });

  it('keeps production settings with defaults', () => {
    const d = new ScriptDoc();
    expect(d.production.aspect).toBe('16:9');
    d.setProduction({ aspect: '9:16', style: '胡同水彩' });
    expect(ScriptDoc.fromSnapshot(d.snapshot()).production).toMatchObject({ aspect: '9:16', style: '胡同水彩', kind: '叙事' });
  });
});
