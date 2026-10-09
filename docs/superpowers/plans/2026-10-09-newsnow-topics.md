# NewsNow 热点选题 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. 用户已授权设计、执行、创建 PR、合并和更新。

**Goal:** 用官方 NewsNow MCP 获取热点，经现有 Ancher API 生成带真实来源的简报和选题。

**Architecture:** 主进程通过 MCP stdio 启动固定版本官方包，使用 Electron 内置 Node，无需额外业务服务器。agent 包负责四来源并发获取、校验与去重，工作流生成简报后筛选选题；renderer 显示简报和来源失败提示。

**Tech Stack:** TypeScript, MCP SDK, newsnow-mcp-server 0.0.12, Electron, Vitest。

**Spec:** specs/0002-desktop-client-spec.md §5.6.1。

## Global Constraints

- 不部署业务服务器；现有 Ancher key 仅交给 Ancher SDK，不传给 NewsNow 子进程。
- 固定来源 zhihu / weibo / baidu / toutiao，各 10 条，上限 40 条；HTTP(S) 链接校验，按标题或规范链接去重。
- MCP 初始化 10 秒、单来源 15 秒超时；取消和结束时关闭子进程。
- 来源全失败时显示可重试错误，不伪造今日热点；部分失败可继续且明确展示。
- 热榜抓取时间不等于新闻发布时间，背景搜索由 Ancher web_search 单独提供。

## Review Focus

- 公共服务 403/超时：全失败不调用模型；部分失败显示对应来源。
- 恶意链接及异常工具输出：丢弃非 HTTP(S) 链接和畸形条目。
- 取消时子进程释放：真 MCP 测试检查关闭，不残留进程。
- 模型编造来源：只接收输入条目的索引，输出链接由客户端回填。
- 原有已保存 topics 工作流：维持 search / pick 两步骤，新增结果字段可选。

### Task 1: 官方 MCP 获取适配器

**Files:** packages/agent/src/newsnow.ts; packages/agent/test/newsnow.test.ts; packages/agent/src/index.ts; dependency manifests/lockfile。

**Interfaces:** `fetchNewsNow(options, signal): Promise<NewsNowDigest>`，返回 items / failedSources / fetchedAt。

- [x] 写并运行失败测试：多来源去重、非法链接、部分失败、全失败、取消。
- [x] 实现 MCP 客户端和条目规范化，固定工具名 get_hottest_latest_news。
- [x] 使用本地假上游 + 真官方 stdio 服务测试协议与释放；实测公共 URL。
- [x] 测试通过并提交。

### Task 2: 热点简报与选题 UI

**Files:** packages/agent/src/workflows/{engine,defs}.ts; apps/desktop/src/main/workflows.ts; apps/desktop/src/renderer/src/components/Workflows.tsx; workflow tests; Electron E2E mock upstream。

**Interfaces:** `WorkflowEnv.hotspots(signal)`；topics result 可选 brief / sourceWarning / fetchedAt，保留旧数据可读。

- [x] 写并运行失败测试：模型收到真实热点、不启用联网搜索、简报来源只能来自输入、零适合选题允许空列表。
- [x] search 步调用 MCP 和模型简报，pick 步筛 0–5 项；主进程启动官方包，UI 渲染简报及链接。
- [x] Electron E2E 使用本地假 HTTP 上游通过真实 MCP，验证简报显示和选题写入。
- [x] typecheck、单元测试和完整 E2E 通过并提交。

### Task 3: Spec、审阅与交付

**Files:** specs/0002-desktop-client-spec.md；本计划。

- [x] 写入接入配置、Node 要求、架构、来源限制、验收与当前实测结果。
- [x] 审阅全量 diff，检查打包后的官方 MCP 可运行。
- [ ] 创建 PR、等待 CI 通过、合并到 main、更新本机应用（交付阶段）。


## 执行记录

- 隔离工作区基线 93 项测试通过；本功能完成后 107 项通过，typecheck 通过。
- 真官方 MCP：本地假上游协议测试、部分/全部失败、取消、超时与退出清理通过；公共 URL 四来源、40 条热点实测成功。
- 独立审阅发现正文嵌入 Markdown 链接可绕过来源索引校验：新增失败→通过回归测试，拒绝正文链接，来源由客户端回填。
- 审阅所提 HTTP 链接与关闭时 PID 清理时序均已修正，并加入测试；无延期问题。
- Electron 完整 E2E 与打包 ASAR 官方服务探针通过。随包依赖的 README 不发布，许可证保留。
- 包扫描对第三方加密库 PEM 头字面量误报：仅识别实际私钥内容；动态生成 PEM、转义 JSON 与 API key 格式测试通过。
- 用户已明确授权设计后执行、PR 和合并，因此沿既定步骤推进；未暂停等待重复确认。
