export type WritingTarget = 'script' | 'outline' | 'shots' | 'beats';
export const WRITING_LABELS: Record<WritingTarget, string> = { script: '剧本', outline: '大纲', shots: '分镜', beats: '故事节拍' };
/** Inspect user intent only, never the imported knowledge or the assistant's promises. */
export function writingTargets(instruction: string, current?: WritingTarget): WritingTarget[] {
  const text = instruction.split(/\n(?:参考资料|素材|以下是|剧本正文)[：:]/)[0] ?? instruction;
  if (/不要|别(?:写|改|生成)|仅(?:分析|讨论)|只(?:分析|讨论|回答)|(?:解释|介绍|讲解).*如何|(?:如何|怎么|怎样)(?:写|生成|制作)/.test(text)) return [];
  if (!/(?:写|改|生成|完善|补充|插入|添加|保存|落到|放进|放到|更新|整理|展开|续)/.test(text)) return [];
  const targets: WritingTarget[] = [];
  if (/剧本|正文|对白|台词|续写|开场|写第.{0,10}场/.test(text)) targets.push('script');
  if (/大纲|梗概|分场/.test(text)) targets.push('outline');
  if (/分镜|镜头表/.test(text)) targets.push('shots');
  if (/节拍|街拍/.test(text)) targets.push('beats');
  if (!targets.length && /(?:写入|写到|放到|放进|插入|保存到|更新)(?:这里|当前|左侧|左边|文档|里面)/.test(text)) targets.push(current ?? 'script');
  return targets;
}
export function writingContract(targets: readonly WritingTarget[]): string {
  if (!targets.length) return '';
  return `\n\n本次是实际文档写入请求，目标：${targets.map((t) => WRITING_LABELS[t]).join('、')}。必须返回可执行的 <ops> JSON，不得只声称已经写入。\n` +
    targets.map((t) => ({
      script: '剧本正文必须拆成 insertNode / updateNode：heading、action、character、dialogue 等独立节点，不能用 setScript 或把整篇剧本塞进单个节点。',
      outline: '大纲必须用一个 setOutline 写入独立完整的新版本，不要在旧稿末尾追加；修改或补充时输出整合后的完整大纲。',
      shots: '分镜必须用 setShots，sceneId 指向真实 heading ID；如果本次新增场景，使用对应插入节点的 id 或 $1、$2 引用。没有场景时先插入 heading，不能虚构已有场景 ID。',
      beats: '故事节拍必须用一个 setBeats 写入独立完整的新版本，不要在旧版末尾追加；修改或补充时输出整合后的完整节拍，不能写进大纲。',
    })[t]).join('\n') + '\n所有 JSON 字符串中的换行必须转义为 \\n。只有本地校验和保存成功才会显示写入成功。';
}
