# Ancher 笔记界面参考

用户指定参考 `https://app.ancher.ai` 和官方 GitHub 仓库，沿用客户端知识库侧栏入口。

源码基准：[streamify-one-design-system](https://github.com/streamify-one/streamify-one-design-system/tree/bf0cd935a20b41f5c1215b81583738068ea14abf)，2026-10-09 读取。参考文件通过 GitHub CLI 下载到临时目录，没有引入官网路由或账号登录系统。

| 官方源码（相对于仓库） | 客户端适配 |
|---|---|
| `apps/desktop/src/components/ui/sidebar.tsx` | 32px 列表行高、14px文字、8px间距、选中状态 |
| `apps/desktop/src/components/product/notes/note-sidebar-list.tsx` | 处理状态、笔记列表和选择 |
| `apps/desktop/src/components/product/collections/collection-sidebar-list.tsx` | 保留空合集，合集图标使用对应颜色 |
| `apps/desktop/src/components/product/sidebar/sidebar-pinned-section.tsx` | 官网固定列表与排序 |
| `apps/desktop/src/components/product/notes/note-metadata-header.tsx` | 18px/600 标题、标签、日期 |
| `apps/desktop/src/components/product/notes/note-detail-view.tsx` | 正文居中、20px水平与24px垂直间距 |
| `packages/tokens/src/semantics.css` | 沿用现有客户端 Ancher 浅色/深色语义配色 |
| `apps/desktop/src/components/product/notes/note-helpers.ts` | 兼容旧 article 处理状态与新增 fetched 状态 |

本地已有原型：`specs/images/prototypes/src/pages.mjs` 的 p11，以及 `src/base.css` 的 nt 系列样式；保留 256px 侧栏、圆角正文面板、现有右侧对话布局。

本轮接入官网笔记读取、筛选、刷新和显式保存本地副本。官网编辑、远程删除、拖拽排序、图片/视频嵌入及云端双向同步尚未接入。客户端已有的项目笔记编辑和写作参考继续在「项目笔记」中使用。

### 原文与摘要修正

官网 `NoteContentSection` 的 Summary 使用 `getContent` 生成内容，Original 交给 `OriginFileViewer`，读取 `getNoteOriginalFiles`：顶层或旧版 article 的 origin_files，加上服务器公开给当前用户的顶层 downloaded_files。客户端现在遵循这一结构，追加可用的 transcript_file / files.transcript 字幕入口，不从 article 恢复隐藏下载文件。

摘要中的 streamify-file 图片引用通过 note-scoped filePresignedUrl 解析。原文文本、字幕在主进程限长读取；视频、音频、图片与 PDF 使用临时签名地址预览。账户 API key 仍只在主进程，临时预览 URL 不持久化；保存到项目保留生成内容及原始图片引用。原文与生成摘要独立，fetched 阶段也可查看源文件。

参考组件：apps/web/src/components/product/notes/origin-file-viewer.tsx、packages/product-runtime/src/notes/model.ts、apps/sdk/src/contracts/file-slots.ts。
