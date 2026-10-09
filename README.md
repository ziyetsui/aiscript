# Ancher Scripter

AI 编剧桌面客户端（Windows + macOS），AI 能力来自用户自己的 Ancher API key。规格见 [`specs/0002-desktop-client-spec.md`](specs/0002-desktop-client-spec.md)，原型见 [`specs/images/prototypes/Ancher-Scripter-Prototype.html`](specs/images/prototypes/Ancher-Scripter-Prototype.html)。

客户第一次使用请阅读[新用户安装指南](docs/delivery/新用户安装指南.md)：下载、安装、激活、连接 AI、首次写作、笔记、转写、备份和更新。需要从源码运行时，阅读[从零安装依赖与运行客户端](docs/delivery/从零安装依赖与运行客户端.md)。

## 开发

```bash
pnpm install
node apps/desktop/scripts/pack-youtube.cjs # 首次开发 YouTube 转写时准备本机下载工具
pnpm dev          # 启动桌面端（热更新）
pnpm test         # 单元测试
pnpm typecheck
pnpm --filter @scripter/desktop e2e   # 构建并用 Playwright 驱动真实 Electron 窗口
pnpm --filter @scripter/desktop exec node e2e/gemini.e2e.ts  # Cloud 转写集成测试（模拟 Google 响应）
```

## 本地音视频转写

在「设置 → 模型与密钥」选择 Gemini 服务，再验证并保存对应的 API key：

- Google AI Studio：沿用 Files API 上传音视频；已有配置默认使用此服务。
- Google Cloud（GCP API key）：使用 `aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent`，与 Cloud 的 API-key / express mode REST 示例一致。此选项不处理 OAuth access token 或服务账号 JSON。验证会发送一次简短生成请求。

使用「视频 → 逐字稿」选择本地文件。Cloud 模式通过随客户端打包的 FFmpeg，在本机提取单声道音频并按 10 分钟分段，逐段直接发送给 Google，再合并字幕时间；结果保存为项目知识库中的 TXT 和 SRT。取消、失败或完成后清理临时音频，不需要自行部署服务器。没有人声的分段会跳过；格式无效或生成被截断时显示错误，避免保存不完整逐字稿。转写准确度和说话人识别仍需人工复核。

密钥在本机加密保存，请求时用于 Google 认证；音视频或提取的音频会发送给 Google，用量在对应 Google 账户结算。403 会提示权限/API 配置问题，429 会提示配额或限流，不再统一显示「key 无效」。

## 激活（开发时）

知识库入口支持「Ancher 笔记」与「项目笔记」切换。连接与 `app.ancher.ai` 同一账号的 Ancher API key 后，可查看官网保存的笔记、合集和已固定笔记；返回客户端或点击刷新可读取最新数据，转写中的笔记会自动检查状态。官网正文按需读取且只读，点击「保存到项目」后可离线编辑、导出或设为写作参考。再次保存同一篇笔记会打开已有本地副本，保留本地修改。

开发版没有配置 Keygen 时只有「手动激活」：

```bash
pnpm license keypair                         # 生成签发密钥（私钥只在本机）
cp ~/.ancher-scripter/license/public.pem apps/desktop/resources/license-public.pem
pnpm license issue --machine AS-XXXX-XXXX-XXXX-XXXX --customer 名称 --seat 1/3
```

机器码在激活页上显示。在线激活需要在构建时提供 `KEYGEN_ACCOUNT_ID` 和 `KEYGEN_VERIFY_KEY`。

## 打包与发布

```bash
pnpm --filter @scripter/desktop icon          # 从 Ancher 标志重新生成应用图标
pnpm --filter @scripter/desktop package:dir   # 本机打一个未签名的 .app / 目录，用来试装
```

打 `v*` tag 会触发 `.github/workflows/release.yml`：mac（arm64 + x64）和 Windows（x64）安装包上传到目标仓库 `ziyeprompttheworld/aiscript` 的草稿 Release，冒烟通过后在 GitHub 上转正式版。当前目标仓库为私有，beta 默认手动更新；签名的公开更新源验证后才能启用自动更新。

需要在仓库里配置：

| 名称 | 类型 | 用途 |
|---|---|---|
| `LICENSE_PUBLIC_KEY` | 变量 | `pnpm license keypair` 生成的 public.pem 内容（必填） |
| `RELEASES_TOKEN` | 密钥 | 对 `ziyeprompttheworld/aiscript` 有写权限的 token（可选；同仓库默认使用 GITHUB_TOKEN） |
| `KEYGEN_ACCOUNT_ID` / `KEYGEN_VERIFY_KEY` | 变量 | 在线激活（可选，没有就只有手动激活） |
| `MAC_CERT_P12_BASE64` / `MAC_CERT_PASSWORD` / `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` | 密钥 | macOS 签名和公证（没有就出未签名包） |
| `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` | 密钥 | Windows Azure Trusted Signing（没有就出未签名包） |


本轮执行主线：[陈天 SDD 项目提示词](specs/0006-sdd-next-prompts-spec.md)。交付包收集：`pnpm deliver`；客户说明在 `docs/delivery/`，实际验证记录在 `specs/0005-delivery-execution.md`。
