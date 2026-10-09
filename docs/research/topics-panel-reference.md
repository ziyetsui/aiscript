# 独立选题池

用户确认：世界观与知识库之间新增灯泡入口，将现有项目选题独立成面板，保留选中、否掉操作和原有数据。后续要求使用 Emil 设计工程原则，并保持 Ancher 风格一致。

设计参考：
- Ancher [`note-card.tsx`](https://github.com/streamify-one/streamify-one-design-system/blob/main/apps/desktop/src/components/product/notes/note-card.tsx)：标题、描述、状态和底部操作的分层。
- Ancher [`sidebar-nav-list.tsx`](https://github.com/streamify-one/streamify-one-design-system/blob/main/apps/desktop/src/components/product/sidebar/sidebar-nav-list.tsx)：实体页面的独立导航与选中状态。
- Emil `emil-design-eng`：常用导航和状态筛选即时切换，复用现有按钮按压反馈与键盘焦点，遵守减少动态效果设置。

实现复用客户端 React、`PageHead`、`Tabs`、`bulb` 图标及明暗主题变量，无新增依赖。选题仍存储在当前项目 `bible.topics`，无需迁移。明确的否掉按钮保留 Enter 提交；恢复待定同时清理已保存原因和输入框。

端到端验证覆盖：聊天选题工作流加入三条选题，独立导航显示，选中与筛选，否掉与恢复待定，重启后状态和原因保留，世界观中不重复显示。明暗主题截图保存为 `topics-panel-light.png` / `topics-panel-dark.png`。
