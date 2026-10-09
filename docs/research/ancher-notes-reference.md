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

早期接入范围是官网笔记读取、筛选、刷新和显式保存本地副本。后续已加入图片/视频原文显示，以及侧栏多选、远程操作和排序，详见 [笔记操作说明](ancher-note-actions.md)。项目笔记编辑和写作参考继续在「项目笔记」中使用。

### 原文与摘要修正

官网 `NoteContentSection` 的 Summary 使用 `getContent` 生成内容，Original 交给 `OriginFileViewer`，读取 `getNoteOriginalFiles`：顶层或旧版 article 的 origin_files，加上服务器公开给当前用户的顶层 downloaded_files。客户端现在遵循这一结构，追加可用的 transcript_file / files.transcript 字幕入口，不从 article 恢复隐藏下载文件。

摘要中的 streamify-file 图片引用通过 note-scoped filePresignedUrl 解析。原文文本、字幕在主进程限长读取；视频、音频、图片与 PDF 使用临时签名地址预览。账户 API key 仍只在主进程，临时预览 URL 不持久化；保存到项目保留生成内容及原始图片引用。原文与生成摘要独立，fetched 阶段也可查看源文件。

参考组件：apps/web/src/components/product/notes/origin-file-viewer.tsx、packages/product-runtime/src/notes/model.ts、apps/sdk/src/contracts/file-slots.ts。

### 官网 URL 原文布局对齐

对照官方同一提交的 UrlSourceViewer、NoteSourceEmbed、NoteTranscript、NoteOriginalPreviewCard 与 source-embeds/youtube-embed.tsx。URL 笔记采用「原文预览」卡片 + 「转录」卡片的顺序；YouTube 使用 iframe 原生播放器，SRT/VTT 保留原始时间码和文字，转录正文区域最大高度 384px。源音频和其它文件保留在折叠区，非 URL 上传笔记沿用文件选择。备注改为独立背景卡片。

客户端使用现有 React/TypeScript、CSS tokens 与 SDK，适配组件结构，不引入官网的路由、i18n、TanStack Query 或 react-youtube 依赖。YouTube URL 仅允许明确的官方主机名和 11 位视频 ID；本窗口 YouTube embed 子框架使用安装包 bundle ID 作为 Referer，按 Google 的桌面应用嵌入要求识别客户端。其它来源提供打开原文入口。

验证：URL 格式及伪造主机名单测，源 URL / 转录槽映射单测，以及原生 Electron 的同页播放器 + 转录、生成中字幕、上传源文件兼容和两种主题回归。CI 使用受控播放器响应，不将其视为公网 YouTube 播放验证。

### 新建笔记与单一知识库入口

知识库只展示 Ancher 账号笔记，移除「项目笔记」切换与编辑面板。侧栏「新建笔记」和 ⇧⌘O / Ctrl+Shift+O 打开居中弹窗，支持文本、URL、拖入或选择文件（最多 10 个，每个 50 MB）、可选背景与意图以及现有合集选择。SDK 上传、创建和合集关联均在主进程执行；创建后刷新并选中新笔记，沿用处理状态轮询。失败保留输入，合集关联失败仍返回成功创建的笔记，避免重试重复创建。文件与文本分开创建，补充说明可填入背景字段。本轮不含录音和 X 收藏导入。

「保存到项目」继续保存写作参考副本，不再切换到本地笔记面板。新建流程验证见 `apps/desktop/e2e/new-note.e2e.ts`；创建路由与失败处理验证见 `packages/agent/test/create-note.test.ts`。
