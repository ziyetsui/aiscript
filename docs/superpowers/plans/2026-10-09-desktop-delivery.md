# Desktop Delivery Implementation Plan

> 执行方式：按用户要求，在当前会话连续执行；使用 executing-plans，完成后一次独立审查。复用已有未提交代码。

**Goal:** final 原型对应的 Windows/macOS 可安装桌面客户端及客户交付材料。
**Architecture:** Electron 主进程管理数据、密钥和 AI；React 只通过类型化 IPC 调用；一个项目只有一个存活的对话面板，在内容页用 portal 停靠。
**Tech Stack:** 现有 Electron 44 / React 19 / TypeScript / Loro / electron-builder 26，pnpm 锁文件。
**Spec:** specs/0003-delivery-spec.md v1.1。

## Global Constraints
- 纯本地，无业务服务器/登录/用量展示；保留 strict、camelCase 和固定依赖。
- API key 只进 safeStorage，公钥可进入包，私钥不得进入包/仓库。
- AI 修改经 ops 校验、预览、一轮撤销；失败无部分写入。
- mac arm64/x64，Windows x64；无实机证据不得报告客户交付完成。

## Review Focus
- 老项目缺少笔记新字段：读取使用默认值。
- 场景改名/删除：镜头按 node ID 关联，孤立镜头不导出。
- 文件读取/AI 同时运行、回收项目：禁止正在生成项目软删。
- 中文输入法 Enter：只在 composition 结束后发送。
- 包缺文件、仓库私有、无签名：打包失败须记录，默认手动更新。

## Tasks
- [x] T1 笔记元数据/正文：bible-model.ts、main/files.ts、shared/ipc.ts、preload；Knowledge.tsx。旧数据默认值、标题/标签/正文重启持久化 E2E。
- [x] T2 共享 dock：Workspace.tsx portal、App.tsx host、ai.ts pageContext。角色页发送写回撤销，切换同一会话 E2E。
- [x] T3 首页/分级菜单：Chat.tsx PlusMenu、Home.tsx Composer。菜单方向键、Esc 返回、首页附件 E2E。
- [x] T4 最近/回收站：main/projects.ts、Recents.tsx、IPC。软删→重启→恢复 E2E、purge 确认。
- [x] T5 发布工程与候选包：新 owner/repo、手动更新、脚本收集全部必需包和校验和；原生 CI 全部通过、ARM64/x64 dmg 本机启动、Windows 安装冒烟及包扫描通过。正式签名和客户交付仍待外部条件。
- [ ] T6 门禁、独立审查、规格回写、执行报告：typecheck / vitest / Electron E2E / 安装包冷启动。

任务按以上顺序执行。每个任务在 specs/0005-delivery-execution.md 记录验证结果和偏离理由。既有 0003 中陈旧 E1–E6 状态由实际证据更新。
