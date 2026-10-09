# 0005 · 交付执行记录

2026-10-09；spec 0003 v1.1；基线 5cdcbb7，已有 feat/shots-production 改动保留。

- 基线 typecheck 通过，vitest 5 文件 / 68 测试通过。
- Git origin 已指向 ziyeprompttheworld/aiscript；目标仓库可访问且私有。
- T1–T6 按 docs/superpowers/plans/2026-10-09-desktop-delivery.md 连续执行。
- 决定：共享一个 Workspace 对话，通过 portal 放入内容页，不复制 Chat/流式状态/撤销逻辑。
- 决定：客户接收人和渠道未提供，发送阶段保留待办；所有可在本机完成的开发、测试与打包继续执行。

## 原型与审查修复

- 0006 是用户所要的「提取原提示词→项目改写版→验收」执行主线，0003 保留为差异附件。
- final 知识库：256px 左栏、合集/固定/笔记、中心圆角笔记页、400px 对话 dock、当前笔记引用卡。
- 写作：独立左侧项目/集/视图，中心工具栏/纸张，右侧圆角对话。增加实际可用的格式工具栏。
- 最近/设置：220px 独立导航；制作按原型保持全宽双卡，不添加原型没有的右侧 dock。
- 修复独立审查 P1：原文编辑读取完整正文而非 20k excerpt；已有镜头 AI 替换走预览并比对镜头快照；反推期间项目登记 busy；后台文件解析遇到项目删除停止写回。
- 修复独立审查 P2：导出/导入清理历史 Ancher 对话 ID；修改预览完整比对原目标结构，包括改格式。
- core 回归从失败到通过：6 文件 / 70 单测。当前仍在跑完整 Electron E2E 和新交付测试。
- 首轮本机 mac arm64/x64 dmg+zip 成功（未签名、候选）；app.asar 237 个文本文件扫描未匹配常见私钥/key 格式。后续 UI 修改需要重新打包，不能将此轮称最终包。

## 第二轮原型细节修复

- 知识库独立 `starred` 与写作参考 `pinned`；空合集/重命名/删除进项目 meta，与整项目归档一起迁移；正文修改递增 revision，版本按钮显示实际当前版本。原型只有当前版本 toast，没有历史恢复功能。
- 固定顶部工具栏、更多菜单（固定/移合集/原文件导出/删除）、Mac/Windows 快捷键提示、展开标签输入及安全色值、Markdown 只读与完整正文编辑器、处理说明；对话开关归位。
- 地点导出勘景本 PDF，道具 CSV，角色 JSON；概览可缩放与展开。制作设置改为居中 880px 双栏，片段初始15s；本版只生成提示词，没有已生成画面，所以允许调整画幅。
- 最近有两类入口卡，快速视频入口明确未开放；设置增加独立编辑器、字体分段、逐字生成和默认导出，偏好真实保存并被编辑器/导出菜单使用。
- 原型复核仍发现的 JSON 导出格式/更多菜单关闭/跨平台快捷键/默认导出分段均已继续修复。
- 本机可用证书只有 Apple Development，未发现面向客户分发的 Developer ID；目标仓库未配置 secrets。不得把 development/adhoc 签名称正式客户签名。
- mac arm64 原始 app、只读挂载的 dmg、x64 app 在本机 Rosetta 均冷启动到激活页，`app.isPackaged === true`；使用 Chromium 标准独立用户目录，不带开发覆盖变量。不等于 Intel/Windows 客户完整使用验收。

## 本轮最终本机门禁

- `pnpm typecheck` 通过；`pnpm test`：6 文件、70 测试通过。
- 完整 Electron E2E 通过，新增长正文、独立固定、空合集、revision=2、跨页共享对话/写回撤销、生成期间拒绝新会话、删除后重启恢复、14 张内容页亮/暗截图。
- 截图已等待各页真实内容加载；复核后修复 hidden 按钮被 btn display 覆盖导致的多余对话图标，角色工具条归位到底部。
- 不宣称像素级完全一致或客户设备验收完成。外部服务真实媒体解析/搜索、签名公证、客户授权机器码与接收渠道仍需对应证据。

## 外部阻塞与最终复跑

- 推送 `origin HEAD:main` 被 GitHub 明确拒绝：当前 ziyeprompttheworld OAuth token 缺少 workflow scope（仓库含 CI/release 工作流）。已有 SSH 不可用；另一现有登录账号不能访问目标私有仓库。没有删掉工作流规避授权，也没有扩大账号权限。
- 已请求用户完成 `gh auth refresh -h github.com -s workflow`；因此远端落盘及 Windows 原生 CI 安装冒烟当前待授权。
- 最终复跑发现工作流表单打开后 composer 的延迟 focus 抢焦点，已对 workflow/video 分支提前 return，避免将导演意见输入主输入框。修复后 typecheck、70 单测与完整 Electron E2E 再次通过。
- 客户收件人/发送渠道/各机器码、Developer ID 公证与 Windows 分发签名仍待输入，不能记为已发送或正式签名交付。

## GitHub 授权后的原生验证

- 2026-10-09 用户完成授权；已确认活动账号具备 workflow scope，`34b68d7` 成功推送到新仓库 main，权限阻塞解除。
- 首轮 CI 37889576878：原型格式、typecheck/70 单测、gitleaks 通过；E2E 的 End 键没有建立 macOS 行尾光标前提，在对白中间分行，断言失败。测试改为明确设置折叠到行尾的 selection，并等待新角色行获得焦点；不改变编辑器产品行为。
- 首轮 Release 37889573433：macOS 读取空 CSC_LINK 时解析为工作目录，报 not a file。已根据本地 electron-builder 证书读取实现确认原因，构建前清理为空的可选签名环境变量，保留实际已有凭证。
- 修复后本机完整 E2E 与云端原生打包继续验证；结果按实际 run 回写。
- 修复提交 `6b82f14`：本机完整 E2E 通过；云端 [CI 37889824766](https://github.com/ziyeprompttheworld/aiscript/actions/runs/37889824766) 全部通过（原型格式、typecheck/70 单测、完整 Electron E2E、gitleaks）。
- [Release 37889834662](https://github.com/ziyeprompttheworld/aiscript/actions/runs/37889834662) 双平台全部通过：Windows 原生 NSIS 静默安装后启动到激活页；macOS ARM64 原生包启动到激活页；两者 `app.isPackaged=true`，无开发覆盖变量。mac ARM64/x64 dmg+zip 与 Windows x64 exe 已下载，证据保存在忽略目录 delivery/evidence/native-6b82f14。
- 并发首轮/修复轮曾创建同标签的两个 draft；保留含完整五包的草稿 407555414，备份元数据后清理本会话冗余草稿 407555412。发布流程增加 prepare 单草稿步骤及同 ref 并发排队，避免平台矩阵重复创建。
- 交付脚本允许从下载的原生产物目录收集，manifest 另记 artifactSourceCommit/artifactBuildRun，区分包源码与后续文档/流水线修复提交。
- Windows 原生安装冒烟已通过，不等于客户激活/完整编辑导出/覆盖升级/卸载验收；发行签名、公证、客户机器码与接收渠道仍未提供。
- 下载的 Windows 安装器提取 app.asar，以及只读挂载两种架构的 CI dmg，237 文本文件扫描与正式公钥检查均通过；两个 CI dmg 在本机分别 ARM64 原生、x64 Rosetta 启动到激活页，已卸载挂载卷。云端原生包证据与客户完整验收明确分开。
- 草稿 Windows 资产因先前并发轮次与新 run artifact 不一致，已以第二轮实际安装验证的 artifact 替换；候选包与草稿必须逐文件核对 SHA256 后才作为交付来源。
- 流水线修复提交 f710ac2 的 [CI 37890486763](https://github.com/ziyeprompttheworld/aiscript/actions/runs/37890486763) 全部通过。GitHub 会将中文资产文件名归一为 default.md，交付脚本统一使用 INSTALLATION.zh-CN.md，避免下载后的说明文件名与校验清单不一致；源说明仍使用中文文件名。


## 2026-10-09 · 按 0006 继续执行的修订

本轮产品合同与逐页差异以 [0007-final-prototype-closure.md](0007-final-prototype-closure.md) 为续补记录：实现真实多分集、分集独立正文/大纲/节拍/封面、范围与版式导出、内置 Courier Prime / 朱雀仿宋及授权文件、知识库元数据撤销与输入时序修复。旧版测试和 beta.1 安装包只证明旧源码；新候选为 **1.0.0-beta.2**。本机74单测与类型检查通过，双平台原生 CI/新安装包证据待本轮运行记录更新。签名、公证、真实服务及客户验收/发送不因草稿构建成功自动通过。老师原文摘录保持不变。


## 2026-10-09 · beta.2 最终交付候选收集

- 最终产品源码 `a13bab25e647be2a4c9f4476f4f4f68d2aba2bf0` 的 [CI 37897105028](https://github.com/ziyeprompttheworld/aiscript/actions/runs/37897105028) 与 [Release 37897109804](https://github.com/ziyeprompttheworld/aiscript/actions/runs/37897109804) 已成功，前一轮 abdf55b Release 已取消。
- 五个 CI 安装包已收集至 `delivery/Ancher-Scripter-1.0.0-beta.2/`；逐文件 SHA256 与 GitHub 草稿资产 digest 一致。`pnpm deliver delivery/ci-a13bab2/installers` 和标准 `shasum -a 256 -c SHA256SUMS.txt` 全部通过，含安装说明共6项。
- 更新 `delivery/evidence/verification.json` 为 beta.2 最新源码及运行链接，避免交付 manifest 引用 beta.1 的70单测/旧包证据。包源码与本地未提交测试/规格文件明确分开。
- 两个最新 dmg 只读挂载，公钥一致、各240文本文件扫描通过；ARM原生与x64 Rosetta均冷启动到激活页且 `packaged=true/version=1.0.0-beta.2`。挂载已卸载。Windows安装启动/240文件扫描证据保存于原生Release日志及截图。
- 截图尺寸纠正：读取原生CI PNG头发现Mac截图被宿主屏幕限制到674px高度，不能称已获得1360×860/1440×960截图。已有未提交测试补 `setViewportSize` 与尺寸断言，本地完整Electron E2E本轮通过；修正后的远端截图仍待CI。功能CI通过与截图目标尺寸是不同结论。
- 草稿Release的targetCommitish仍指向早期提交，五个安装包的真实来源以CI run、SHA256与manifest为准；尚未提升为正式Release。
- 客户交付说明草稿已准备；签名、公证、真实外部服务、Intel硬件、升级/卸载和客户发送仍待对应信息或验证。本记录不关闭这些外部门禁。


### 补充收尾

- 客户验收表已加入交付脚本，便携文件名 `ACCEPTANCE.zh-CN.md`；五个包及两份说明共7项通过标准SHA256校验。草稿Release九个交付文件（含manifest和校验清单）均与本地digest一致，保持draft/prerelease；targetCommitish已纠正为a13bab2产品源码。
- 测试窗口按用户最新要求优先外接副屏，选工作区最宽的非主屏；无副屏时Mac测试窗口退到普通窗口层级以下。本机检测到三屏，完整Electron E2E通过且每次启动确认实际显示器id=5（横屏）；截图对激活页和内容页均显式设置CSS视口并断言尺寸。
- 上述改动仅涉及测试、交付脚本与文档，产品安装包源码仍为a13bab2，无需因测试变更重打产品包。客户发送/正式分发外部门禁仍保留。


最终截图修正的 [CI 37898717632](https://github.com/ziyeprompttheworld/aiscript/actions/runs/37898717632)（ce36e07）全部通过，包含双平台Electron E2E、typecheck/74单测、原型格式和gitleaks。已下载Mac截图并读取PNG头确认1360×860和1440×960各22张，关闭先前宿主屏幕截断的证据缺口；这不等于所有像素或外部服务验收。产品安装包仍来自a13bab2。技术候选与交付材料已就绪，客户签名/真实服务/Intel硬件/升级卸载/机器码及发送仍待外部条件。
