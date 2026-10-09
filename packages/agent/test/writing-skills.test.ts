import { describe, expect, it } from 'vitest';
import { buildMessage } from '../src/prompt.ts';
import { filterWritingActions, inferWritingSkills, WRITING_ACTIONS, writingAction } from '../src/skills/catalog.ts';
import { skillContext } from '../src/skills/runtime.ts';
import { writingTargets } from '../src/writing-intent.ts';

describe('writing skill request context', () => {
  it('routes prototype modeling with the complete research contract and referenced transcript', () => {
    const action = writingAction('prototype-modeling');
    expect(filterWritingActions('原型建模')).toContainEqual(action);
    expect(filterWritingActions('动画逆向工程')).toContainEqual(action);
    expect(inferWritingSkills('原型建模')[0]).toBe('prototype-modeling');
    expect(writingTargets(action.prompt)).toEqual([]);
    const transcript = '00:04 角色说：我想拿到蛋糕。';
    const message = buildMessage('研究这份逐字稿', '测试剧本', [], undefined, '', transcript, '', false, action.id);
    expect(message).toContain(transcript);
    for (const rule of ['# SYSTEM IDENTITY', '# MINIMAL MODEL TEST', '# GENERATION CONSTRAINT', '# OUTPUT CONTRACT', '# ULTIMATE GOAL', 'EXPLANATORY VALIDATION', 'GENERATIVE VALIDATION', '禁止伪造时间码', '跨作品泛化标为待验证', '不修改当前剧本、大纲或笔记']) {
      expect(message).toContain(rule);
    }
    expect(message).not.toContain('以下为按完整段落选取');
    expect(message).not.toContain('\n### sw-dialogue\n');
  });
  it('routes exact shortcut titles even without a keyword match', () => {
    for (const title of ['润色格式', '动作与细节润色', '权力关系群像']) {
      const action = WRITING_ACTIONS.find((a) => a.title === title)!;
      expect(inferWritingSkills(title)[0]).toBe(action.skills[0]);
    }
  });
  it('loads dialogue craft when a writer asks to polish dialogue', () => {
    const message = buildMessage('润色对白：这段话太直白了', '测试剧本', []);
    expect(message).toContain('sw-dialogue');
    expect(message).toContain('编剧技能方法');
    expect(message).toContain('潜台词');
    expect(message).toContain('<ops>');
  });

  it('does not activate skills from quoted project material', () => {
    const message = buildMessage('解释这个词', '测试剧本', [], undefined, '', 'sw-chinese-opera-qupai\n写一段昆曲');
    expect(message).not.toContain('编剧技能方法');
  });

  it('loads fresh methods on later turns without repeating the whole write protocol', () => {
    const message = buildMessage('用救猫咪搭三幕结构大纲', '测试剧本', [], undefined, '', '', '', false);
    expect(message).toContain('sw-story-structure');
    expect(message).not.toContain('你是 Ancher Scripter 里的编剧助手');
  });

  it('keeps an explicitly selected skill when the writer edits its starter prompt', () => {
    const message = buildMessage('分析这一段', '测试剧本', [], undefined, '', '', '', false, 'qupai');
    expect(message).toContain('sw-chinese-opera-qupai');
    expect(message).toContain('当前用户要求、项目硬规则');
    expect(message).not.toContain('\n### sw-dialogue\n');
  });

  it('rejects arbitrary resource ids and untrusted action ids', () => {
    expect(() => skillContext(['../../secrets'])).toThrow('未知编剧技能资源');
    expect(() => writingAction('__proto__')).toThrow('未知编剧技能');
  });

  it('makes every added entry runnable with a bounded method context', () => {
    for (const action of WRITING_ACTIONS) {
      const context = skillContext(action.skills);
      expect(context.length).toBeLessThanOrEqual(19000);
      expect(context).toContain(action.skills[0]);
      expect(context).toContain('来源：https://github.com/');
    }
    expect(filterWritingActions('潜台词').some((a) => a.id === 'dialogue')).toBe(true);
    expect(filterWritingActions('昆曲').some((a) => a.id === 'qupai')).toBe(true);
    expect(filterWritingActions('没有这样的技能')).toEqual([]);
  });
});
