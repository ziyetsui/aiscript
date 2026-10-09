# 0004 · 本轮代码审查

2026-10-09，独立 reviewer：delivery_review；范围为当前未提交实现及原有分镜开发。未把审查通过等同于客户验收。

|级别|发现|处理|
|---|---|---|
|P1|长笔记编辑使用 excerpt 导致 20k 后正文丢失|完整 readBody、原子写入；新增长正文 E2E|
|P1|已有分镜直接覆盖|needsReview 检查现有镜头、保存快照、accept 时检测过期|
|P1|反推/后台解析可复活已删除项目|AI busy 门禁、解析写回前检查项目存在|
|P2|归档携带历史远端会话 ID|递归清理历史与工作流 context|
|P2|改格式的过期检测不含原格式|比较完整 PreviewItem|
|P1|生成中切换/新建会话导致回复错归属|主进程 chatIdle 门禁、ai.status 恢复 UI busy 状态|
|P2|中断解析重启后永久 working|加载恢复 failed，允许重试|
|P2|PDF 原文解析后不更新|NoteBody extract version 依赖|
|P2|扫描仅验证源码公钥|读取打包 Resources 公钥并比较 Ed25519 DER|
|P2|交付 manifest 未标明脏源码|加入 dirty 标志|
|P2|分镜覆盖预览只有数量，无法评审|PreviewItem 增加 after，共享 PreviewCard 展示全部景别、描述、时长|

复核确认前十项修复。最后一项在复核后补齐，继续经过类型检查、core 与 Electron 验证。签名/公证、Windows/Intel 实机安装、全部原型状态视觉验收、客户实际接收仍为独立交付门禁。

## 原型复核闭环

独立审查继续指出版本按钮、独立固定、空合集、工具栏、标签、Markdown、制作 modal、最近入口、编辑器设置。已逐项实施，并修复复核后的地点 PDF/道具 CSV、菜单外点/Esc、Windows Ctrl 提示、对话开关归位及默认导出分段。字体与导出、逐字生成设置都有实际消费路径。最终门禁仍包含扩展 E2E、截图和签名/客户设备验收。
