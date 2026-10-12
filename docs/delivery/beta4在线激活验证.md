# beta.4 在线激活验证

验证日期：2026-10-12。安装包位于本机 `delivery/Ancher-Scripter-1.0.0-beta.4/`。

构建通过 `apps/desktop/resources/keygen-public.json` 提供账号 ID 与 Ed25519 验签公钥，环境变量可覆盖。客户端不包含管理员令牌、私钥或客户激活码。

## 验证结果

- 全仓类型检查通过，29 个测试文件、216 项测试通过。
- Apple 芯片 Mac 正式打包客户端的在线激活入口默认可用。
- 独立测试授权 `Ancher Scripter - Activation Test` 完成真实 Keygen 首次绑定、同机重复激活、关闭重开与阻断 HTTP 后读取本地授权文件。
- 另一机器指纹使用测试码被服务端拒绝：最大机器数为 1。
- Keygen 机器列表仅有测试授权绑定的本机记录，3 个客户码未绑定。
- Mac arm64、Mac x64 和 Windows x64 的应用包扫描通过；未发现扫描器匹配的私钥或常见 API key。
- Mac arm64 原生、Mac x64 Rosetta 均通过启动、在线激活入口以及内置 FFmpeg、yt-dlp、Deno 执行验证。

## 交付范围

生成 Mac arm64/x64 的 DMG 与 ZIP，以及 Windows x64 安装器，共 5 个文件。交付目录含 SHA256、构建清单和安装说明。

Windows 运行验收、Intel Mac 硬件验收、发行签名与公证尚未验证。安装包没有发布到外部。测试授权保留绑定；客户授权仍可用于各自的首台电脑。

验证证据：`delivery/evidence/keygen-live-beta4.json`、`delivery/evidence/keygen-live-beta4-activated.png` 和 `delivery/evidence/verification.json`。复测脚本为 `apps/desktop/e2e/keygen-live.mjs`，必须使用单独测试码。
