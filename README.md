# Ancher Scripter

AI 编剧桌面客户端（Windows + macOS），AI 能力来自用户自己的 Ancher API key。规格见 [`specs/0002-desktop-client-spec.md`](specs/0002-desktop-client-spec.md)，原型见 [`specs/images/prototypes/Ancher-Scripter-Prototype.html`](specs/images/prototypes/Ancher-Scripter-Prototype.html)。

## 开发

```bash
pnpm install
pnpm dev          # 启动桌面端（热更新）
pnpm test         # 单元测试
pnpm typecheck
pnpm --filter @scripter/desktop e2e   # 构建并用 Playwright 驱动真实 Electron 窗口
```

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
