import { expect, it } from 'vitest';
import { writingTargets, writingContract } from '../src/writing-intent.ts';
it('routes explicit writes to each document, including the beats typo',()=>{
 expect(writingTargets('把刚才的内容写入剧本')).toEqual(['script']);
 expect(writingTargets('自动写大纲、剧本、分镜和故事街拍')).toEqual(['script','outline','shots','beats']);
 expect(writingTargets('写入这里','beats')).toEqual(['beats']);
 expect(writingTargets('帮我生成分镜')).toEqual(['shots']);
 expect(writingTargets('完善故事节拍')).toEqual(['beats']);
});
it('does not turn analysis, quoted references or negations into write commands',()=>{
 expect(writingTargets('解释一下如何写剧本')).toEqual([]);
 expect(writingTargets('不要写入剧本，只分析结构')).toEqual([]);
 expect(writingTargets('这个剧本哪里不好？')).toEqual([]);
 expect(writingContract(['beats'])).toContain('setBeats');
 expect(writingContract(['script','shots'])).toContain('$1');
});
