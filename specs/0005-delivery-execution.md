# 0005 · 交付执行记录

2026-10-09；spec 0003 v1.1；基线 5cdcbb7，已有 feat/shots-production 改动保留。

- 基线 typecheck 通过，vitest 5 文件 / 68 测试通过。
- Git origin 已指向 ziyeprompttheworld/aiscript；目标仓库可访问且私有。
- T1–T6 按 docs/superpowers/plans/2026-10-09-desktop-delivery.md 连续执行。
- 决定：共享一个 Workspace 对话，通过 portal 放入内容页，不复制 Chat/流式状态/撤销逻辑。
- 决定：客户接收人和渠道未提供，发送阶段保留待办；所有可在本机完成的开发、测试与打包继续执行。

## 原型与审查修复

- 0006 是用户所要的「提取原提示词→项目改写版→验收」执行主线，0003 保留为差异附件。
- final 知识库：256px 左栏、合集/固定/笔记、中心圆角笔记页、400px 对话 dock、当前笔记引用卡。
- 写作：独立左侧项目/集/视图，中心工具栏/纸张，右侧圆角对话。增加实际可用的格式工具栏。
- 最近/设置：220px 独立导航；制作按原型保持全宽双卡，不添加原型没有的右侧 dock。
- 修复独立审查 P1：原文编辑读取完整正文而非 20k excerpt；已有镜头 AI 替换走预览并比对镜头快照；反推期间项目登记 busy；后台文件解析遇到项目删除停止写回。
- 修复独立审查 P2：导出/导入清理历史 Ancher 对话 ID；修改预览完整比对原目标结构，包括改格式。
- core 回归从失败到通过：6 文件 / 70 单测。当前仍在跑完整 Electron E2E 和新交付测试。
- 首轮本机 mac arm64/x64 dmg+zip 成功（未签名、候选）；app.asar 237 个文本文件扫描未匹配常见私钥/key 格式。后续 UI 修改需要重新打包，不能将此轮称最终包。

## 第二轮原型细节修复

- 知识库独立 `starred` 与写作参考 `pinned`；空合集/重命名/删除进项目 meta，与整项目归档一起迁移；正文修改递增 revision，版本按钮显示实际当前版本。原型只有当前版本 toast，没有历史恢复功能。
- 固定顶部工具栏、更多菜单（固定/移合集/原文件导出/删除）、Mac/Windows 快捷键提示、展开标签输入及安全色值、Markdown 只读与完整正文编辑器、处理说明；对话开关归位。
- 地点导出勘景本 PDF，道具 CSV，角色 JSON；概览可缩放与展开。制作设置改为居中 880px 双栏，片段初始15s；本版只生成提示词，没有已生成画面，所以允许调整画幅。
- 最近有两类入口卡，快速视频入口明确未开放；设置增加独立编辑器、字体分段、逐字生成和默认导出，偏好真实保存并被编辑器/导出菜单使用。
- 原型复核仍发现的 JSON 导出格式/更多菜单关闭/跨平台快捷键/默认导出分段均已继续修复。
- 本机可用证书只有 Apple Development，未发现面向客户分发的 Developer ID；目标仓库未配置 secrets。不得把 development/adhoc 签名称正式客户签名。
- mac arm64 原始 app、只读挂载的 dmg、x64 app 在本机 Rosetta 均冷启动到激活页，`app.isPackaged === true`；使用 Chromium 标准独立用户目录，不带开发覆盖变量。不等于 Intel/Windows 客户完整使用验收。

## 本轮最终本机门禁

- `pnpm typecheck` 通过；`pnpm test`：6 文件、70 测试通过。
- 完整 Electron E2E 通过，新增长正文、独立固定、空合集、revision=2、跨页共享对话/写回撤销、生成期间拒绝新会话、删除后重启恢复、14 张内容页亮/暗截图。
- 截图已等待各页真实内容加载；复核后修复 hidden 按钮被 btn display 覆盖导致的多余对话图标，角色工具条归位到底部。
- 不宣称像素级完全一致或客户设备验收完成。外部服务真实媒体解析/搜索、签名公证、客户授权机器码与接收渠道仍需对应证据。

## 外部阻塞与最终复跑

- 推送 `origin HEAD:main` 被 GitHub 明确拒绝：当前 ziyeprompttheworld OAuth token 缺少 workflow scope（仓库含 CI/release 工作流）。已有 SSH 不可用；另一现有登录账号不能访问目标私有仓库。没有删掉工作流规避授权，也没有扩大账号权限。
- 已请求用户完成 `gh auth refresh -h github.com -s workflow`；因此远端落盘及 Windows 原生 CI 安装冒烟当前待授权。
- 最终复跑发现工作流表单打开后 composer 的延迟 focus 抢焦点，已对 workflow/video 分支提前 return，避免将导演意见输入主输入框。修复后 typecheck、70 单测与完整 Electron E2E 再次通过。
- 客户收件人/发送渠道/各机器码、Developer ID 公证与 Windows 分发签名仍待输入，不能记为已发送或正式签名交付。
