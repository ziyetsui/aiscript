# Mastra 与 Loro 的文档写入链路

2026-10-09，按用户截图核对写作页和全部文档入口。

原问题：项目并未安装 Mastra；对话仅调用 Ancher，再直接解析 `<ops>`。非法修改被跳过，模型叙述仍可声称写入成功；故事节拍没有对应 op，旧提示词把节拍写入大纲。已有 Ancher 会话后续只发送简短格式提醒，更容易混淆云端笔记和本地文档。

现在对话通过 `@mastra/core@1.75.0` 的 `createWorkflow/createStep` 执行生成、校验/修复、提交。Ancher 是生成和检索接口，不是 Mastra 的模型 provider。Mastra 本地流程通过应用提供的提交回调执行 Loro 编辑，不启动新的 HTTP 服务器、不要求新的模型 key。官方接口：[Workflows](https://mastra.ai/docs/workflows/overview)。

| 写作页入口 | 数据与交互 | AI 使用方式 |
|---|---|---|
| 分集看板 | Loro 分集列表、当前集、各集文档；手动创建/命名/切换 | 现有长流程已迁移到 Mastra；「生成一集」使用原生 suspend/resume 确认故事和分场 |
| 大纲 | 当前集 LoroText `outline` | Mastra 校验 `setOutline/appendOutline`，保存后自动显示大纲 |
| 剧本 | 当前集 Loro 节点列表 | Mastra 校验场景、动作、角色、对白等独立节点操作，保存后自动打开剧本 |
| 分镜 | Loro bible.shots，通过真实场景节点 ID 关联 | Mastra 校验 `setShots`，支持本轮新场景 ID 和 `$n` 引用 |
| 故事节拍 | 当前集 LoroText `beats` | 新增 `setBeats`，独立保存；已有节拍替换须预览，接受/撤销立即刷新 |
| 场景 | 从当前集 heading 节点派生列表/看板 | AI 新增场景标题后自然出现，点击定位剧本；不另建重复场景文档 |
| 顶部九种格式 | 手动切换节点类型/新增元素，经 projects.edit 写入 Loro | 普通格式操作不调用模型或 Mastra；AI 根据同一元素类型生成 |

自然语言写入目标仅从用户指令识别，支持「写入剧本」「写大纲」「生成分镜」「完善故事节拍」「写入这里」及用户输入的「故事街拍」。分析/解释与否定指令不触发目标写入要求。「这里」使用当前正在查看的文档。写入请求携带完整编辑契约与当前剧本、大纲、节拍、设定、选择的素材，延续 Ancher 会话取得对话上下文。

格式或目标校验失败最多修复一次；仍失败则整批不执行，回复明确未写入，不保留模型虚假的成功叙述。修改已有内容显示预览，接受后执行。每次执行通过 `applyOps` 形成同一次 Loro turn，可一起撤销剧本、大纲、节拍和镜头；取消和中途切换分集会阻止写入其他集。分镜仍以场景 ID 隔离，未宣称新增云端协作同步。

验证：`writing-intent.test.ts`、`writing-workflow.test.ts`、核心 `doc.test.ts`，以及 Electron `writing-documents.e2e.ts`。端到端测试使用模拟 Ancher SSE，实际执行 Mastra 和 Loro，覆盖虚假成功修复、四类文档、当前文档指令、预览与刷新、联合修改与撤销、无效格式、普通分析、取消、分集隔离、重启持久化和全部九种手动格式控件。测试未调用真实账号生成剧本，不代表所有模型回复都可自动修复。

## 长流程迁移

`workflows/engine.ts` 仅保留可序列化类型、确认输入和退出恢复标记；原 execute 状态机已移除。主进程从 `@scripter/agent/workflows` 加载 Mastra 执行器，将现有流程定义构造成 createStep/createWorkflow 图，最后一步生成类型化结果。Renderer 不加载 Mastra，也不接收完整快照。

Mastra 原生 snapshot 随项目现有持久化链路保存（SQLite 和 JSON/Loro 镜像），每次启动执行器时重新载入原生存储缓存。不是只保存在内存：每次 persistWorkflowSnapshot 都提交项目存储。确认步骤调用 suspend，确认后使用同一 run ID 调用 resume；退出后恢复也执行这条链路。现有界面 status/steps/ctx 是兼容投影，用户确认的大纲和最终接受的剧本仍写入 Loro。

失败、取消或旧状态机记录的重试从现有 ctx 和已完成步骤导入新的原生执行；完成的远程步骤不会重新请求。逐场写作每三场新增 checkpoint 保存中间进度，失败后继续下一批。故事和分场暂停期间仍可取消，重试重新显示确认。导出/导入保留暂停快照，递归清理其中的云端 conversationId，避免跨账号复用。

新增验证：mastra-persistence.test.ts 检查 native suspended/success/failed 快照、JSON 重载、作者修改和旧记录导入；mastra-episode.e2e.ts 检查 Electron 中两次暂停跨重启、暂停状态导出导入、实际继续生成、Loro 预览/接受/保存/撤销。使用模拟 Ancher，不消耗真实账号额度。
