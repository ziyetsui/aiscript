# 独立选题池

用户确认：世界观与知识库之间新增灯泡入口，将现有项目选题独立成面板，保留选中、否掉操作和原有数据。后续要求使用 Emil 设计工程原则，并保持 Ancher 风格一致。

设计参考：
- Ancher [`note-card.tsx`](https://github.com/streamify-one/streamify-one-design-system/blob/main/apps/desktop/src/components/product/notes/note-card.tsx)：标题、描述、状态和底部操作的分层。
- Ancher [`sidebar-nav-list.tsx`](https://github.com/streamify-one/streamify-one-design-system/blob/main/apps/desktop/src/components/product/sidebar/sidebar-nav-list.tsx)：实体页面的独立导航与选中状态。
- Emil `emil-design-eng`：常用导航和状态筛选即时切换，复用现有按钮按压反馈与键盘焦点，遵守减少动态效果设置。

实现复用客户端 React、`PageHead`、`Tabs`、`bulb` 图标及明暗主题变量，无新增依赖。选题仍存储在当前项目 `bible.topics`，无需迁移。明确的否掉按钮保留 Enter 提交；恢复待定同时清理已保存原因和输入框。

端到端验证覆盖：聊天选题工作流加入三条选题，独立导航显示，选中与筛选，否掉与恢复待定，重启后状态和原因保留，世界观中不重复显示。明暗主题截图保存为 `topics-panel-light.png` / `topics-panel-dark.png`。

## 2026-10-09：Ancher 作品双视图与操作

按用户提供的作品截图及官方仓库当前 `main` 读取以下组件：
- `apps/web/src/components/product/artifacts/artifact-card.tsx`：192px 最小高度文本卡片，列表缩略图 + 标题 + 文件名与大小，悬停快捷操作与勾选。
- `artifacts-grid.tsx`：12px 间距瀑布流、8px 间距列表。
- `artifacts-header.tsx`：视图与排序控件。
- `artifact-actions-menu.tsx`：分享、保存为笔记、下载、信息 / 添加到对话、添加到合集 / 喜欢、不喜欢 / 删除，统一右键与更多菜单。

选题保持项目 `bible.topics` 数据；新增可选 `reaction` 字段兼容已有项目。卡片点击打开完整选题信息和推荐理由，可选中、否掉（Enter 提交）、恢复待定；紧凑视图显示故事简介与日期。卡片/列表和排序偏好保存在本地，支持搜索、状态过滤、多选、批量添加到对话、下载和确认删除。

添加到对话复用笔记附件事件，扩展 `source: topic`，以当前项目内 ID 在发送时读取完整选题正文、推荐理由与来源，不自动发送消息或创建笔记。支持附件去重、移除和 @ 选题提及。保存为笔记调用已接入的 Ancher 创建接口；添加到合集创建选题笔记后关联实际云端合集，关联失败明确保留接口返回的提示。分享提供复制 Markdown 内容，未提供云端公开选题链接。下载导出 Markdown，点赞独立于选题决策状态。

验证入口：`apps/desktop/e2e/topics-artifacts.e2e.ts`，覆盖双视图和重启持久化、搜索、筛选、排序控件、右键菜单与键盘、决策与恢复、点赞、笔记保存失败/重试、云端合集、剪贴板分享、Electron 实际下载、隐藏对话栏开启与附件去重、发送选题正文、取消/确认批量删除。截图保存为 `topics-artifacts-{light,dark}-{grid,list}.png`。附件解析单测补充选题内容解析、去重和跨项目/已删除 ID 拒绝。
