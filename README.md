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

开发版没有配置 Keygen 时只有「手动激活」：

```bash
pnpm license keypair                         # 生成签发密钥（私钥只在本机）
cp ~/.ancher-scripter/license/public.pem apps/desktop/resources/license-public.pem
pnpm license issue --machine AS-XXXX-XXXX-XXXX-XXXX --customer 名称 --seat 1/3
```

机器码在激活页上显示。在线激活需要在构建时提供 `KEYGEN_ACCOUNT_ID` 和 `KEYGEN_VERIFY_KEY`。
