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
  it('invalidates old episode turns before replacing a script, without disabling the restore undo', () => {
    const d = new ScriptDoc();
    d.insert('end', 'action', '第一稿', 'node1'); d.commit();
    const old = d.turn('删除', x => x.remove('node1'));
    d.invalidateEpisodeTurns('first');
    const restored = d.turn('恢复', x => x.insert('end', 'action', '第一稿', 'node1'));
    d.undoTurn(old.id);
    expect(d.nodes()).toEqual([{ id: 'node1', type: 'action', text: '第一稿' }]);
    expect(d.listTurns().find(t => t.id === old.id)?.stale).toBe(true);
    d.undoTurn(restored.id);
    expect(d.nodes()).toEqual([]);
    const reloaded = ScriptDoc.fromSnapshot(d.snapshot()); reloaded.loadTurns([...d.listTurns()]);
    reloaded.undoTurn(old.id); expect(reloaded.nodes()).toEqual([]);
  });
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

  it('leaves the doc untouched when applying a turn fails', () => {
    const { d } = seed();
    expect(() => applyOps(d, [{ op: 'insertNode', after: 'end', type: 'action', text: 'x' }, { op: 'setType', id: d.nodes()[0]!.id, type: 'bogus' as never }], 'bad')).toThrow();
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

describe('modification preview', () => {
  it('only rewrites and deletions of existing text need review', async () => {
    const { needsReview } = await import('../src/index.ts');
    expect(needsReview([{ op: 'insertNode', after: 'end', type: 'action', text: 'x' }])).toBe(false);
    expect(needsReview([{ op: 'insertNode', after: 'end', type: 'action', text: 'x' }, { op: 'updateNode', id: 'a', text: 'y' }])).toBe(true);
    expect(needsReview([{ op: 'deleteNode', id: 'a' }])).toBe(true);
  });

  it('describes changes against the current text and flags vanished targets', async () => {
    const { previewOps } = await import('../src/index.ts');
    const { d, h, a } = seed();
    const p = previewOps(d, [
      { op: 'updateNode', id: a, text: '豆豆一屁股坐在地上。' },
      { op: 'deleteNode', id: h },
      { op: 'insertNode', after: '$1', type: 'dialogue', text: '哎哟。' },
      { op: 'updateNode', id: 'gone', text: 'x' },
    ]);
    expect(p.items).toEqual([
      { kind: 'update', id: a, type: 'action', before: '豆豆蹲在门墩儿旁边。', after: '豆豆一屁股坐在地上。' },
      { kind: 'delete', id: h, type: 'heading', before: '外景 胡同口 — 傍晚' },
      { kind: 'insert', type: 'dialogue', text: '哎哟。' },
    ]);
    expect(p.missing).toEqual(['gone']);
    expect(d.nodes()[1]!.text).toBe('豆豆蹲在门墩儿旁边。'); // previewing changes nothing
  });
});

describe('docx export', () => {
  it('writes a real .docx (zip with document.xml carrying the text)', async () => {
    const { toDocx } = await import('../src/index.ts');
    const { unzipSync, strFromU8 } = await import('fflate');
    const bytes = await toDocx('门墩儿', [
      { id: '1', type: 'heading', text: '外景 胡同口 — 傍晚' },
      { id: '2', type: 'character', text: '门墩儿' },
      { id: '3', type: 'dialogue', text: '别捏了 & 放手' },
    ]);
    expect(String.fromCharCode(bytes[0]!, bytes[1]!)).toBe('PK');
    const xml = strFromU8(unzipSync(bytes)['word/document.xml']!);
    expect(xml).toContain('外景 胡同口 — 傍晚');
    expect(xml).toContain('别捏了 &amp; 放手');
    expect(xml).toContain('w:eastAsia="Zhuque Fangsong"');
  });
});

describe('ops references (models number new nodes in different ways)', () => {
  it('accepts $n counted over inserts even when an update comes first', () => {
    const { d, h } = seed();
    const r = parseReply(`<ops>[{"op":"updateNode","id":"${h}","text":"外景 胡同口 — 夜"},{"op":"insertNode","after":"end","type":"character","text":"豆豆"},{"op":"insertNode","after":"$1","type":"dialogue","text":"谁？"}]</ops>`);
    applyOps(d, r.ops, 't');
    expect(d.nodes().map((n) => n.text)).toEqual(['外景 胡同口 — 夜', '豆豆蹲在门墩儿旁边。', '豆豆', '谁？']);
  });

  it('accepts ids the model gave its own inserts, and falls back for unknown anchors', () => {
    const { d } = seed();
    const r = parseReply('<ops>[{"op":"insertNode","id":"c1","type":"character","text":"门墩儿"},{"op":"insertNode","after":"c1","type":"dialogue","text":"别捏了。"},{"op":"insertNode","after":"no-such-node","type":"action","text":"豆豆往后一坐。"}]</ops>');
    expect(r.errors).toEqual([]);
    applyOps(d, r.ops, 't');
    expect(d.nodes().map((n) => n.text).slice(-3)).toEqual(['门墩儿', '别捏了。', '豆豆往后一坐。']);
  });

  it('skips an update whose target has gone instead of failing the turn', () => {
    const { d } = seed();
    applyOps(d, [{ op: 'updateNode', id: 'gone', text: 'x' }, { op: 'insertNode', after: 'end', type: 'action', text: '新的一行' }], 't');
    expect(d.nodes().at(-1)!.text).toBe('新的一行');
  });
});

describe('outline ops', async () => {
  const { needsReview, previewOps } = await import('../src/index.ts');
  it('append / replace the outline inside the undoable turn', () => {
    const { d } = seed();
    const t1 = applyOps(d, [{ op: 'appendOutline', text: '一、相遇\n二、悲惨的未来' }], '大纲');
    expect(d.outline).toBe('一、相遇\n二、悲惨的未来');
    applyOps(d, [{ op: 'appendOutline', text: '三、命运的分岔' }], '续');
    expect(d.outline).toBe('一、相遇\n二、悲惨的未来\n\n三、命运的分岔');
    d.undoTurn(t1.id);
    expect(d.outline.trim()).toBe('三、命运的分岔'); // the later turn's own text survives the undo
    expect(d.nodes()).toHaveLength(2); // the script itself is untouched
  });
  it('only replacing a non-empty outline needs review, and the preview shows before/after', () => {
    const { d } = seed();
    expect(needsReview([{ op: 'setOutline', text: '新' }], '')).toBe(false);
    expect(needsReview([{ op: 'appendOutline', text: '加' }], '旧')).toBe(false);
    expect(needsReview([{ op: 'setOutline', text: '新' }], '旧')).toBe(true);
    applyOps(d, [{ op: 'setOutline', text: '旧大纲' }], 'x');
    expect(previewOps(d, [{ op: 'setOutline', text: '新大纲' }]).items).toEqual([{ kind: 'outline', mode: 'replace', before: '旧大纲', after: '新大纲' }]);
  });
});

it('writes beats as their own undoable document and previews replacements', async () => {
 const { parseReply, applyOps, previewOps, needsReview } = await import('../src/index.ts');
 const d = new ScriptDoc();
 const parsed = parseReply(`<ops>${JSON.stringify([{op:'setBeats',text:'起：借来神笔\n转：发现代价'}])}</ops>`);
 expect(parsed.errors).toEqual([]);
 const turn = applyOps(d, parsed.ops, '写入故事节拍');
 expect(d.beats).toContain('发现代价');expect(d.outline).toBe('');expect(d.nodes()).toHaveLength(0);
 expect(needsReview(parsed.ops, '', [], '旧节拍')).toBe(true);
 expect(previewOps(d, parsed.ops).items[0]).toMatchObject({kind:'beats',after:'起：借来神笔\n转：发现代价'});
 d.undoTurn(turn.id);expect(d.beats).toBe('');
});
