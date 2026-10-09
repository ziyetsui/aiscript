# 编剧 Skills GitHub 调研

调研日期：2026-10-09。根据本次 GitHub 搜索、仓库 README 和实际技能文件整理。

目标：覆盖灵感开发、剧情结构、角色设计、对白、场景写作、剧本格式、审稿、分集流程和分镜，以及视频转录和热点选题等辅助能力。

> Star 是查询时的整个仓库星数，不是单个 skill 的星数；下表为本次找到并核验的相关项目，非 GitHub 全站完整榜单。能力介绍依据公开文件，不代表已实际运行或验证创作效果。

## 1. 优先推荐

- **专业编剧细分能力：** `jtydhr88/screenwriting-skills`。将前提、结构、人物、对白、场景、格式、剧集与喜剧拆成独立技能，最贴近参考截图里的创作功能。
- **小说改编与短剧制作交付：** `eternityspring/shuohao-skills`。覆盖大纲、人物、场景道具、剧本、时长估算与分镜，提供结构化文件、校验脚本和报告。
- **中文短剧整体流程：** `zenstory-ai/drama-skills`。开发、写作、资产、分镜、审查和制作分别处理，适合组合为应用工作流。

## 2. 相关仓库排名

按本次查询的 Star 降序排列。

| 仓库 | Star | 类型 | 内容与适用场景 |
|---|---:|---|---|
| [zenstory-ai/oh-story-claudecode](https://github.com/zenstory-ai/oh-story-claudecode) | 7,377 | 网文创作技能包 | 中文网文扫榜、拆文、构思、长短篇写作与持续状态追踪。适合题材研究、故事结构分析和改编素材准备，主要面向小说。 |
| [eternityspring/shuohao-skills](https://github.com/eternityspring/shuohao-skills) | 4,288 | 短剧制作技能管线 | 小说改编大纲、角色、场景道具、剧本、分镜；附带 JSON、Markdown、脚本校验与可视化报告。 |
| [zenstory-ai/drama-skills](https://github.com/zenstory-ai/drama-skills) | 2,645 | 短剧／漫剧技能合集 | 分别处理开发、写作、资产、分镜、图片／视频提示词、审查、生产和剪辑。 |
| [liangdabiao/Seedance2-Storyboard-Generator](https://github.com/liangdabiao/Seedance2-Storyboard-Generator) | 2,546 | AI 视频脚本与分镜 | 将小说或故事转为多集视频剧本、角色／场景／道具提示词与时间轴分镜，偏 Seedance 制作流程。 |
| [jtydhr88/screenwriting-skills](https://github.com/jtydhr88/screenwriting-skills) | 1,613 | 专业编剧细分技能库 | 26 个技能，覆盖电影、电视剧与舞台剧。正文中文，适配 Claude Code 和 Codex。 |
| [0xsline/short-drama](https://github.com/0xsline/short-drama) | 1,371 | 商业微短剧综合技能 | 选题、三幕规划、角色、分集、开篇钩子、付费卡点、审稿与导出；一个综合 skill 配合多个命令和参考文档。 |
| [Shanyin-ai/shanyin-screenwriting-master](https://github.com/Shanyin-ai/shanyin-screenwriting-master) | 1,289 | 全格式编剧综合技能 | 概念超短片、叙事短片、电影长片和多集剧集；强调视觉动作、潜台词、口语对白、自检与逐步确认。 |
| [haowjy/creative-writing-skills](https://github.com/haowjy/creative-writing-skills) | 507 | 创意写作技能包 | 创意探索、结构规划、角色模拟、稿件审查、故事记忆。偏小说，人物声音和一致性方法可借鉴。 |
| [ur-grue/autopunk-media-skills](https://github.com/ur-grue/autopunk-media-skills) | 33 | 媒体专业技能合集 | 包含独立的节拍表、人物档案、对白润色、场景写作、改稿意见与剧本评估技能。 |

## 3. 专业编剧细分技能

以下技能均来自 [screenwriting-skills](https://github.com/jtydhr88/screenwriting-skills)。该仓库声明其技能提炼自 47 本剧作理论书与 23 卷出版剧本、曲谱及戏剧作品。

| 创作环节 | Skill 与源码 | 能力介绍 |
|---|---|---|
| 前提、主题、戏核 | [sw-premise-theme](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-premise-theme) | 将模糊设定提炼成前提、主控思想、主题与一句话故事，检查故事驱动力。 |
| 三幕结构、节拍 | [sw-story-structure](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-story-structure) | 情节点、《救猫咪》十五节拍、激励事件、递进冲突、危机高潮与结局；诊断第二幕松散。 |
| 人物、反派、冲突 | [sw-character-conflict](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-character-conflict) | 人物动机、欲望、错误信念、弧光、人物编排、对手强度与冲突升级。 |
| 对白与潜台词 | [sw-dialogue](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-dialogue) | 将对白作为行动，区分说出、未说出和不能说出的内容，减少解释性台词并区分人物声音。 |
| 场景与段落 | [sw-scene-craft](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-scene-craft) | 场景价值转折、目标与策略、晚进早出、节奏过渡、道具伏笔、动作细节和悬念。 |
| 格式与改编 | [sw-format-adaptation](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-format-adaptation) | 剧本元素规范、Fountain、中文场号、改编原则，以及大纲到初稿的流程。 |
| 有机结构诊断 | [sw-truby-anatomy](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-truby-anatomy) | 特鲁比七大步骤和 22 步结构、四角对立、假盟友、揭露与抉择、道德议题与场景编排。 |
| 类型与混合类型 | [sw-genre-anatomy](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-genre-anatomy) | 类型节拍、主角与对手模板、类型混合，以及恐怖、爱情、侦探等故事的缺失要素诊断。 |
| 单集与整季结构 | [sw-series-structure](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-series-structure) | 冷开场、分幕、出幕点、集尾悬念、A/B/C 故事线编织与整季布局。 |
| 剧集引擎与圣经 | [sw-series-engine-bible](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-series-engine-bible) | 持续产生故事的系列引擎、人物网络、试播集类型、提案与剧集圣经。 |
| 喜剧与笑点 | [sw-sitcom-comedy](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-sitcom-comedy) | 铺垫与包袱、包袱词置尾、追加笑点、反复梗、喜剧人物组合和困境设计。 |
| 编剧室与反馈 | [sw-writers-room](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-writers-room) | 拆故事、接收和提出改稿意见、制作条件下的重写与文档交接。 |
| 国产剧创作 | [sw-chinese-series-practice](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-chinese-series-practice) | 创意、梗概、人物小传、分集大纲、分场大纲和剧本的文档体系，以及 IP 改编方法。 |
| 项目调度与记忆 | [sw-workflow](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-workflow) | 分阶段调度技能、定义交付物与检查点，用 story-bible.md 保存项目状态并跨会话继续。 |

### 风格与经典案例

| Skill | 可借鉴的方向 |
|---|---|
| [sw-american-case-studies](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-american-case-studies) | 美国电影结构、人物和主题的案例拆解。 |
| [sw-series-case-studies](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/sw-series-case-studies) | 《白宫风云》《黑道家族》《唐顿庄园》《伦敦生活》等剧集案例。 |
| [ozu-screenplay-style](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/ozu-screenplay-style) | 日常家庭戏、画外事件、克制对白、物件呼应与余韵结尾。 |
| [chekhov-dramaturgy](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/chekhov-dramaturgy) | 群像、潜台词、环境冲突、错位对白与反高潮结构。 |
| [succession-series-writing](https://github.com/jtydhr88/screenwriting-skills/tree/main/plugins/screenwriting/skills/succession-series-writing) | 家族权力群像、压力场景、人物联盟变化与仪式型单集。 |

使用经典案例时，适合迁移结构和戏剧方法，保留自己的角色、设定与故事。

## 4. 短剧改编与制作技能

### shuohao-skills：分集与制作交付

| Skill | 作用 |
|---|---|
| [novel-outline](https://github.com/eternityspring/shuohao-skills/tree/main/skills/novel-outline) | 小说改编说明、人物表、爽点表、分集梗概和资产清单；支持已有大纲体检。 |
| [novel-characters](https://github.com/eternityspring/shuohao-skills/tree/main/skills/novel-characters) | 提取角色表、人物画像、形象与音色提示词，生成角色卡及报告。 |
| [novel-script](https://github.com/eternityspring/shuohao-skills/tree/main/skills/novel-script) | 将分集梗概写成场次、动作节拍与逐句对白；按语速和动作节拍估算时长，校验人物、场景与上游信息。 |
| [novel-art](https://github.com/eternityspring/shuohao-skills/tree/main/skills/novel-art) | 场景、叙事道具、光照与状态变体，一致性锚点和美术设定。 |
| [novel-storyboard](https://github.com/eternityspring/shuohao-skills/tree/main/skills/novel-storyboard) | 视频段、镜头、关键帧和制作提示词，提供分镜报告与投产包。 |
| [character-refs](https://github.com/eternityspring/shuohao-skills/tree/main/skills/character-refs) | 实际生成角色参考图，以正面全身锚点派生其他视角并追踪过期图。 |

其校验脚本可检查字段、引用、时长预算等结构约束，不能据此认定戏剧质量或成片效果达标。时长也是估算值。

### drama-skills：按阶段拆分的中文短剧流程

源码入口：[skills 目录](https://github.com/zenstory-ai/drama-skills/tree/main/skills)。

| Skill | 作用 |
|---|---|
| short-drama | 初始化项目、跨阶段路由、进度与 Dashboard。 |
| short-drama-novel-analyze | 原著章节索引、剧情功能、人物设定归并与改编价值判断。 |
| short-drama-develop | 开发点子、改编方案、创作简报、导演阐述、故事引擎和分集地图。 |
| short-drama-write | 编写、续写、修改中文单集剧本，规范化已有稿件与对白动作。 |
| short-drama-assets | 拆人物造型、地点、道具状态和跨场连续性。 |
| short-drama-storyboard | 分镜、镜头职责、关键帧、轴线、站位、视线和持物连续性。 |
| short-drama-image-prompts / short-drama-video-prompts | 将确定的视觉设定与分镜转成图片、视频制作提示词。 |
| short-drama-review | 审查原著分析、故事、剧本、资产、分镜和提示词，提出问题与修订要求。 |
| short-drama-produce / short-drama-edit | 执行媒体生成任务与成片剪辑，依赖相应生产工具。 |

## 5. 写作、审稿与记忆补充

### creative-writing-skills

源码入口：[skills 目录](https://github.com/haowjy/creative-writing-skills/tree/main/skills)。

- `story-planning`：创意方向、多个方案探索、故事架构与大纲。
- `character-sim`：在人物当前知识、声音与情绪状态下模拟对话，发现口吻并测试关系。
- `story-review`：结构、写作技巧、连续性、人物声音和文字层面的稿件诊断。
- `story-memory`：保存既定事实、人物状态、时间线、知识参考与持续问题。
- `creative-writing-craft`：场景、对白、节奏、声音与风格参考；偏文学文本，转为剧本时需限制不可拍摄的心理描写。

### autopunk-media-skills

源码入口：[screenwriting 目录](https://github.com/ur-grue/autopunk-media-skills/tree/main/skills/screenwriting)。

- `beat-sheet-builder`：十五节拍与三幕故事地图。
- `character-profile-writer`：人物心理、背景、欲望、需求、缺陷、创伤与声音。
- `logline-writer` / `treatment-writer`：一句话故事与完整故事处理稿。
- `scene-writer`：依据场景简报和人物笔记生成规范剧本场景。
- `dialogue-polisher`：潜台词、人物声音区分与对白精修。
- `script-notes-writer`：结构、人物和场景层面的具体改稿意见。
- `coverage-report-writer`：结构化剧本评估报告。

## 6. 与参考截图的功能对应关系

下表是结合技能内容提出的组合建议，不表示这些仓库已实现截图中的应用界面。

| 截图功能 | 建议对应能力 | 实现说明 |
|---|---|---|
| 一个创意 → 三个走向 | sw-premise-theme + story-planning | 探索不同冲突来源与结局方向，用户选定后再落入大纲。 |
| 参考经典结构重写 | sw-american-case-studies / sw-series-case-studies + sw-story-structure | 提取结构方法，再用自己的角色与故事重构。 |
| 笑点方案 | sw-sitcom-comedy | 铺垫、包袱、追加笑点、反复梗与喜剧困境。 |
| 写飘检查 | sw-premise-theme + sw-story-structure + story-review | 将稿件与主题、故事核心、大纲和既定事实对照。 |
| 导演意见 → 规则 | sw-writers-room + sw-workflow / story-memory | 可参考反馈与记忆方法；待确认规则、版本和全剧生效机制仍需应用实现。 |
| 控字数／时长 | novel-script + sw-scene-craft | 时长预算、冗余对白和场景删减；真实时长需结合表演与剪辑验证。 |
| 一集剧本流水线 | sw-workflow + sw-series-structure + sw-scene-craft | 按故事方向、结构、分场、场景写作和审稿逐步推进。 |
| 润色格式 | sw-format-adaptation / short-drama-write | 场景标题、动作、对白、人物名与生产标签规范。 |
| 总结大纲 | sw-story-structure / short-drama-develop | 技能可生成或整理大纲；自动写入应用的大纲面板需要接口。 |
| 润色对白、儿童口吻 | sw-dialogue + character-sim | 根据年龄、背景和语言样本调整声音；没有核验到专门的儿童对白独立技能。 |
| 续写场景、增强张力 | sw-scene-craft | 目标、策略、冲突升级、价值转折与结尾。 |
| 检查人物一致性 | story-review + story-memory / short-drama-review | 对照人物设定、口吻、知识边界和跨场状态。 |
| 角色小传、反派、弧光、关系 | sw-character-conflict + sw-series-engine-bible | 人物内在驱动与能持续产生冲突的关系网。 |
| 主线副线交织、第二幕转折 | sw-series-structure + sw-truby-anatomy | 故事线编排、揭露与抉择、对手反击和中段诊断。 |
| 整理转场与镜头标记 | sw-format-adaptation + short-drama-storyboard | 剧本文本规范与制作分镜分阶段处理。 |
| 分集看板、剧本、分镜、故事节拍、场景导航 | 项目文件 + 应用界面 | 部分仓库有 Dashboard 或报告，截图中的编辑器与导航仍需产品实现。 |

## 7. 转录、热点与时长专项补充

### 视频 → 逐字稿

[OpenAI 官方 transcribe](https://github.com/openai/skills/tree/main/skills/.curated/transcribe) 支持语音转写、可选说话人区分和已知说话人参考，需要 OpenAI API Key。所属 [openai/skills](https://github.com/openai/skills) 合集查询时为 **27,955 Star**，该数字不代表转录技能单独的热度。

本地视频可能需要先提取音轨；写入知识库、建立索引并作为当前对话参考，需要额外存储与检索流程。

### 今日热点选题

[oh-story-claudecode](https://github.com/zenstory-ai/oh-story-claudecode) 的 `story-long-scan` 与 `story-short-scan` 面向网文榜单和市场趋势。新闻热点选题仍需联网搜索，不能直接等同于网文扫榜。

### 时长估算与删减

[gaojesse999/ai-scripts 的 screenwriter-skill](https://github.com/gaojesse999/ai-scripts/tree/main/skills/screenwriter-skill) 查询时为 **0 Star**，但包含专门的 [timing-and-cutting.md](https://github.com/gaojesse999/ai-scripts/blob/main/skills/screenwriter-skill/timing-and-cutting.md)，可参考按场分类、目标时长差额和删减优先级的输出方式。其中换算系数属于该技能的经验规则，应自行校准。

## 8. 对当前产品的建议

以 `screenwriting-skills` 的前提、结构、人物、对白、场景、格式、喜剧和剧集技能作为创作知识底座；借鉴 `shuohao-skills` 的分集、时长预算、资产关联和分镜交付；用 `drama-skills` 参考阶段路由与审查职责。

优先对应截图中的核心入口：灵感、剧情、角色、写作、格式、审稿与一集流水线。转录、热点搜索、导演规则管理、自动写入和分集看板分别由工具与应用层补齐。

本次仅调研和整理文档，未安装上述技能，也未运行其创作或媒体生产流程。
