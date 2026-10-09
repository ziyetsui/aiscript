# Ancher 笔记侧栏：多选与操作菜单

## 官网来源

参照私有仓库 `streamify-one/streamify-one-design-system` 的 main，提交 `bf0cd935a20b41f5c1215b81583738068ea14abf`（2026-10-09）。

- `apps/web/src/components/product/notes/note-sidebar-list.tsx`：侧栏图标、悬浮 ⋯、右键菜单、排序和拖动。
- `apps/web/src/hooks/use-multi-select.ts`、`apps/web/src/lib/multi-select.ts`：选择状态、Shift 区间、全选和清空。
- `apps/web/src/components/product/notes/note-selection-bar.tsx`、`packages/domain-ui/knowledge-ui/src/selection/selection-toolbar.tsx`：底部浮动工具栏，计数、取消、合集、对话、删除。
- `apps/web/src/components/product/notes/note-actions-menu.tsx`：固定、重命名、对话、合集、来源链接、分享、信息、删除。
- `apps/web/src/components/product/notes/note-collection-move-dialog.tsx`：搜索、多合集勾选、创建合集和追加成员。
- `apps/web/src/components/product/notes/note-share-dialog.tsx`：公开/私有状态以及 `/notes/<slug>` 分享链接。

官网原本在主笔记面板提供多选；本次将相同选择语义移到用户指定的客户端侧栏。适配现有 React、Electron IPC 和官方 SDK，不引入官网的路由、认证及查询框架。保留 Ancher 笔记 / 项目笔记切换。

## 客户端操作

1. 悬浮笔记图标显示复选框；也可点击“笔记”标题右侧的多选按钮。
2. 勾选后点击行正文切换选择，避免打开笔记；Shift 点击按当前显示顺序连续选择。
3. 全选仅包含当前搜索/合集过滤结果。在选择模式按 Cmd/Ctrl+A 全选，Escape 清空；输入框中的快捷键继续用于文本编辑。
4. 选择后出现官网同样的浮动工具栏：计数、取消、添加到合集、添加到对话、删除。
5. 只允许就绪笔记批量加入对话，按实际笔记 ID 附加；不会复制正文或调用 AI 重写。
6. 添加到合集允许多个目标合集，可搜索或创建；使用 `Collection.addNote` 追加，保留已有成员。
7. 每条笔记的 ⋯ / 右键菜单提供固定、重命名、对话、合集、复制/打开来源、分享、信息、重试失败笔记和删除。
8. 排序支持最近更新、最新创建、标题和手动；拖动行切换手动排序，本地保存顺序偏好。
9. 云端操作失败显示错误；批量部分失败保留失败项，重试不会再次处理已成功项。所有操作经主进程 SDK 执行，API key 不进入渲染器。

## 明确的接口与交互差异

- 官网菜单使用“移到废纸篓”。SDK 0.4.0 仅暴露 `Note.delete`，没有恢复/废纸篓 API。客户端使用“删除笔记”，确认框说明其官网同步影响，不声称可恢复。
- 行内重命名沿用官网的 Enter/确认提交、Escape/失焦取消、请求去重与失败保留输入行为，标题最长 255 字符。
- 网站触摸长按并非本次桌面侧栏入口；桌面使用悬浮复选框及明确多选按钮。
- 分享链接采用官网 `https://app.ancher.ai/notes/<slug-or-id>`。公开设置必须由用户在分享对话框明确开启；不自动公开。
- 本次范围是笔记列表操作，不宣称整个 Ancher 网站所有页面已完成像素级复刻。

## 验证

`pnpm test`、`pnpm typecheck`、`pnpm --filter @scripter/desktop build`。

`pnpm --filter @scripter/desktop exec node e2e/note-selection.e2e.ts` 使用独立用户目录和假的云端账号，真实经过渲染器、IPC、官方 SDK。覆盖选择、Shift 区间、过滤后全选、禁用未就绪附加、真实附加到对话、排序、追加合集、创建合集、重命名、固定、分享开关、删除取消/部分失败、快捷键，以及项目笔记入口。不会删除或公开客户的真实笔记。
