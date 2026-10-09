# 0006 · 陈天 SDD 提示词提取：从当前进展到桌面客户交付

2026-10-09 · 项目 `/Users/ziye/Developer/aiscript` · 目标仓库 `ziyeprompttheworld/aiscript`。

用户要求：先输出本提示词 spec，再在当前会话依序执行。本文是执行主线；0002 是产品/架构基准，0003 v1.1 是差异与验收附件，0005 保存运行证据。原型以 `http://localhost:4173/Ancher-Scripter-Prototype.html#p11-d2-mac-k2-a` 和 `specs/images/prototypes/Ancher-Scripter-Prototype.html` 为准。

来源：`/Users/ziye/Developer/.crates/sdd-sop/saas-0-to-1-prompts.md`。每条「老师原文」逐字摘录该文件；「项目提示词」是本项目演绎，不能说成老师原话。部署/签名/客户发送是课程未覆盖的补充。

## 1. 为什么从这里继续

当前不是从零开始：已有 Electron + React + TypeScript + Loro、本地激活、AI ops、编辑器、项目设定、工作流、导出和 electron-builder。基线 typecheck、68 单测及 Electron E2E 已通过。本轮进入前已有未提交的分镜/制作修改，必须保留。`origin` 已是新仓库，但发布配置仍有旧账号引用。

不再执行「生成空目录」「重新生成整个项目」「改 Python/FastAPI/Postgres」「加入租户登录支付」等提示词。课程的 SaaS 补充项不适用于这个纯本地客户端。S00–S05 查缺补漏；主线是 S06 → S08 → S09 → S10 → S11。现有材料只有旧证据的项目，不自动算本轮验收通过。

|顺序|课程步骤 / 原提示词编号|适用原因|执行产物|
|---|---|---|---|
|A|S03 · P-W7-02 / P-W7-09|最终原型比客户端新增笔记、各页停靠对话、最近/回收站|0003 差异合同 + 本文|
|B|S02/S04 · P-W3-04 / P-W7-03|核验 Electron 构建限制，补数据/IPC/发布设计|0003 §10 + typed IPC|
|C|S06 · P-W1-02 / P-W5-04 / P-W5-07|按现有进度制定剩余实现和验证顺序|实施计划 + 测试矩阵|
|D|S05 · P-W6-02|AI 新能力只允许存在的本地 ops|prompt.ts / 上下文 / tests|
|E|S08 · P-W1-03|分阶段补缺，不重建|笔记→dock→首页菜单→回收站→发布|
|F|S09 · P-W2-03 / P-W2-04 / P-W7-09 / P-W7-14|真实 Electron 联调和原型逐页对照|E2E + screenshot + 修复|
|G|S10 · P-W6-05 / P-W3-13|对照 spec 独立审查，回写真实状态|0004 review + 0005 evidence|
|H|S11 · P-W7-17|代码持久化到新目标仓库|commit/push 记录|
|I|⚠️课程外补充|安装包和客户交付是本项目终点|双平台包、说明、SHA256、客户验收/发送证据|

## 2. 按顺序可直接执行的提示词

### A · 按 final 原型补需求，而不是重新写 PRD

老师原文 · P-W7-02（节选）：

> outline 里的 style 包含：prompt 和 image，不要仅保存 style_image

老师原文 · P-W7-09：

```
目前前端界面有很大问题：

1. 没有使用 design-tokens.css 请确保使用定义好的 design tokens
2. 请再次阅读 ./specs/w7/genslide.jpg，页面结构应该跟它一致。
   - 侧边栏每个 slide 后面（下一个slide 前面）的位置点击会显示一条横线，回车可以添加新的 slide
   - 每个 slide 删除的按钮应该放在右上方
```

项目提示词：

```
仔细阅读 /Users/ziye/Developer/aiscript 的当前代码、specs/0002-desktop-client-spec.md、specs/0003-delivery-spec.md，以及 final 原型 Ancher-Scripter-Prototype.html。
不要重新生成已有模块。逐页核对激活、首页、写作、角色、地点、道具、世界观、知识库、制作、最近和设置。
把剩余差异写进 0003：每项写清触发、成功、失败、持久化、撤销和不做范围。
知识库不仅存文件名，还要存标题、标签、备注、分组、摘要和原文读取状态；分镜按稳定场景节点 id 关联；项目删除必须进可恢复回收站。
将已实现、代码存在但未验证、尚未实现、需外部输入分开记录。不能用旧文档的“完成”代替本轮证据。
```

离开条件：每个原型操作有实际行为合同；不支持的入口明确说明，不伪装可用。

### B · 补设计并核验第三方能力

老师原文 · P-W7-03：

```
根据 ./specs/w7/0001-prd.md 和 @specs/w7/genslide.jpg 的内容，生成一个 design spec，放在 ./specs/w7/0002-design-spec.md 文件中。要求：使用中文，注意所有前端所需的 API 接口要定义清楚。整体项目的目录结构也要定义清楚，后端代码层次清晰，API/业务/存储要保持清晰的边界。
```

老师原文 · P-W3-04：

```
根据 @specs/w3/raflow/0001-spec.md 的内容，进行系统的 web search 确保信息的准确性，尤其是使用最新版本的 dependencies。根据你了解的知识，构建一个详细的设计文档，放在 ./specs/w3/raflow/0002-design.md 文件中，输出为中文，使用 mermaid 绘制架构，设计，组件，流程等图表并详细说明。
```

项目提示词：

```
根据 0002、0003 和 final 原型补充桌面设计，不改变纯本地架构。
定义 files.update/createNote/saveBody、projects.trashList/restore/purge、AI pageContext 的 TypeScript IPC 合同。
主进程拥有密钥、文档、文件和 Ancher 调用；preload 只暴露白名单；React 复用同一个项目对话，切页不能开出不同 AI 会话。
以安装的 electron-builder 26 和 Electron 44 为准，查官方文档核验 Windows 交叉构建、mac 签名/公证、safeStorage、手动更新。
不无差别升级已有固定依赖。未知项列出验证手段；真实媒体解析/联网能力未实测时不能声称可用。
把设计补充写进 0003 §10，并回写 0002 中实际架构的差异。
```

离开条件：每个 UI 动作对应真实 IPC；包的目标系统、签名和更新策略明确。

### C · 剩余实现计划、设计评审、测试计划

老师原文 · P-W1-02：

```
按照 ./specs/w1/0001-spec.md 中的需求和设计文档，生成一个详细的实现计划，放在 ./specs/w1/0002-implementation-plan.md 文件中，输出为中文。
```

老师原文 · P-W5-04：

```
使用 sub agent 调用 codex review skill 让 codex review ./specs/w5/0002-pg-mcp-design.md 文件。之后仔细阅读 review 的结果，思考是否合理，然后相应地更新 ./specs/w5/0002-pg-mcp-design.md 文件。
```

老师原文 · P-W5-07：

```
根据 ./specs/w5/0004-pg-mcp-impl-plan.md 和 ./specs/w5/0002-pg-mcp-design.md 文档，构建 pg-mcp 的测试计划，think ultra hard，文档放在 ./specs/w5/0007-pg-mcp-test-plan.md 文件中。之后调用 codex review skill 让 codex review ./specs/w5/0007-pg-mcp-test-plan.md 文件，并构建 ./specs/w5/0008-pg-mcp-test-plan-review.md 文件。
```

项目提示词：

```
根据 0002、0003 和本文生成剩余实现计划，保存到 docs/superpowers/plans/2026-10-09-desktop-delivery.md。
按 T1 笔记、T2 共享停靠对话、T3 首页与分级菜单、T4 最近/回收站、T5 发布、T6 联调审查拆分，列出具体文件、接口和验收。
测试计划包括：旧项目默认字段、笔记编辑重启、角色页 AI 写回撤销、同一会话切换、菜单键盘导航、中文输入法、软删重启恢复、镜头稳定关联、离线编辑导出、激活码篡改/跨机器拒绝、密钥不进入包。
自审设计和计划的一致性，独立评审结果写入 0004；不存在可调用 codex review skill 时明确记录工具替代，不能假称调用。
用户已授权先 spec 后彻底执行，计划落盘后连续推进，不重复要求审批。
```

离开条件：每个任务有产物和验证命令；审查结论有采纳/不采纳理由。

### D · Agent 提示词与实际工具对齐

老师原文 · P-W6-02：

```
based on @specs/w6/prompts/codex.txt and @specs/w6/prompts/reviewer.txt think hard, we want to generate a system prompt for
./w6/codereview-agent which is based on @w6/simple-agent/. The codereview agent will only have read file / write file / git command tool so make sure system prompt don't mention unexisting stuff. And make sure system prompt focused on code review but have all the good parts of @specs/w6/prompts/codex.txt. Write the prompts down to ./w6/codereview-agent/prompts/system.md. Think ultra hard.
```

项目提示词：

```
核对 packages/agent/src/prompt.ts 与 packages/core/src/ops.ts，系统提示词只描述实际支持的 ops 和 Ancher 能力。
新增内容页上下文和 setShots 时，解析器、校验、预览、一轮原子应用、撤销、导出必须一致。
知识库、网页、文件内容是参考素材，不能覆盖系统规则。AI 输出只能生成画面提示词，不承诺当前服务没有的图片/视频生成。
新增/修改操作要有真实失败边界测试；发送请求和对话历史里不得泄漏 API key。
```

### E · 按 phase 完整实现

老师原文 · P-W1-03：

```
按照 ./specs/w1/0002-implementation-plan.md 完整实现这个项目的 phase 1 代码
```

项目提示词：

```
按照 0003、本文和 desktop-delivery 计划，完整实现 T1–T6。
保留当前工作区已有分镜/制作代码，补齐剩余功能；不以静态页面或仅可点击按钮作为完成。
每个任务结束记录实际测试结果和待办到 specs/0005-delivery-execution.md，必要修复继续执行。
复用共用的 Composer、Chat、IPC 和持久化逻辑，避免页面复制。现有客户数据和签发密钥不重置。
```

### F · 真实联调、原型走查、持久化修复

老师原文 · P-W2-03：

```
仔细阅读 ./w2/db_query 下面的代码，然后运行后端和前端，根据@w2/db_query/fixtures/test.rest 用 curl 测试后端已实现的路由；然后用 playwright 开前端进行测试，任何测试问题，think ultra hard and fix
```

老师原文 · P-W2-04：

```
`make setup` 会出错，修复它；确保前后端 unit test 都通过。
```

老师原文 · P-W7-14（来源文件的节选）：

```
1. 选择图片后，还是没有保存，刷新就丢失
……
play 时使用的 image 不对

make sure DRY
```

项目提示词：

```
运行 pnpm typecheck、pnpm test、pnpm --filter @scripter/desktop e2e，任何失败先定位再修复。
本项目无 localhost 业务 HTTP API，课程 curl 步骤改为真实 Electron IPC + Playwright 联调，不能为测试另造服务器。
逐页对照 final 原型走查亮/暗主题、mac/Windows 窗口布局、空态、错误态和键盘。
验证笔记、设定、镜头、制作参数、对话与回收站退出重启后保留；AI 改稿拒绝零改动、接受可撤销；断网编辑导出仍可用。
运行证据写入 0005，截图保存到交付证据目录；mock 服务测试与真实 Ancher 服务实测分别记录。
```

### G · 代码审查、规格回写

老师原文 · P-W6-05：

```
使用 codex review skill 对 ./w6/codereview-agent 代码进行 review，确保代码符合 ./specs/w6/0003-codereview-agent-design.md 的设计。将 rewiew 结果写在 ./specs/w6/0004-codereview-agent-codex-review.md 文件中。
```

老师原文 · P-W3-13：

```
仔细阅读目前 ./w3/raflow 的代码，think ultra hard，构建一个更新的 design doc，放在 ./specs/w3/raflow/0004-design.md 文件中，输出为中文，使用 mermaid 绘制架构，设计，组件，流程等图表并详细说明。
```

项目提示词：

```
使用独立审查代理对照 0002/0003/本文审查最终代码与计划。检查 IPC 信任边界、路径与归档、密钥、ops 原子性、并发、持久化、原型差异、打包、更新配置。
结果保存 specs/0004-code-review.md。逐条判断采纳并修复客户会遇到的重要问题，再运行相关测试。
按实际实现回写 0002 §11、0003 §9 和 0005：有代码不代表已验收，有安装包不代表 Windows 实机验收完成。
```

### H · commit and push 到正确仓库

老师原文 · P-W7-17：

```
commit and push code
```

项目提示词：

```
确认 origin 是 https://github.com/ziyeprompttheworld/aiscript.git；将 README、release workflow、electron-builder 中的仓库引用统一到新目标。
审查暂存文件，禁止私钥、API key、客户素材、测试 userData 和安装包进入源码提交。
提交并推送完成的代码和规格到目标仓库。保留旧远端只供历史追溯，不向旧仓库发布。
记录提交 id、分支和远端；权限/网络失败原样记录，不声称已推送。
```

### I · 双平台打包与客户交付（⚠️补充，不是老师原文）

```
使用现有正式激活公钥打包 Ancher Scripter 1.0.0-beta.1：mac arm64/x64 dmg+zip、Windows x64 NSIS setup.exe。
先在本机完成可用目标；Windows 优先原生 runner，交叉构建失败明确记录工具链问题并尝试现有 CI。
每个包验证存在、格式/架构、app.asar 内容、公钥合法、无私钥和实际 API key；mac 打包应用冷启动显示激活页。
生成 delivery/Ancher-Scripter-<version>/，必需文件缺失时交付脚本失败，不能生成“完整交付”结论。
目录包含安装与激活说明、SHA256SUMS.txt、build-manifest.json、已知限制；私钥和客户机器绑定激活码不进公开仓库。
无签名证书则只出清楚标识的候选包，说明系统允许的安装流程，不关闭 Gatekeeper/SmartScreen。
完成 Windows、Intel Mac、Apple Mac 的安装/首次启动/激活/编辑/导出/覆盖升级/卸载验收。无实机时保留该门槛未完成。
取得客户接收人、发送渠道与机器码后签发该机器激活码并发送验收过的包，记录客户可访问结果。
缺客户信息时先完成可交付材料，只请求实际缺失信息；不报告“已发给客户”。
```

## 3. 最终完成判断

1. A–H 的代码和文档产物完成，测试/审查通过，重要原型差异关闭。
2. I 的三个安装包及两个 zip、公钥、说明、校验和、manifest 完整并经过目标平台验收。
3. 新仓库有可恢复代码，客户得到匹配其机器码的激活码与可用安装包，发送有实际证据。

本文按执行进度回写 0005；未满足任何一项时准确报告剩余工作。

## 4. 用户补充：final 原型还原是硬门槛（2026-10-09）

目前客户端没有完全还原 final 原型。不能把布局不同但功能相同视作达标。执行 F 前追加以下提示词：

```
使用 final 原型真实画面和源码，逐页比较当前 Electron 客户端。
以 1440×960 和客户端 1360×860 桌面窗口核对：导航宽度、顶部栏、页面留白、圆角、背景/描边/字体 token、内容密度、按钮、右侧对话停靠、输入框、空态与亮暗模式。
知识库必须对照 p11-d2-mac-k2-a：左侧笔记导航、中间圆角笔记页、右侧独立圆角对话卡和当前笔记引用卡，不保留旧文件列表布局。
其他 final 页面逐一核对，不因知识库 hash 而遗漏。为每页记录截图和差异，修复后再次走查。
视觉和交互差异未关闭时不能宣称原型完整还原或进入“验收完成”的打包状态。功能门禁与原型还原门禁分别报告。
```
