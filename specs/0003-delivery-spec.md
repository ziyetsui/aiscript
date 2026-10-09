# 0003 · 从当前进度到交付客户：剩余工作规格（对照陈天 SDD）

> 版本 v1.1 · 2026-10-09 · 上游：`0002-desktop-client-spec.md` v0.2（产品与架构仍以 0002 为准）
> 最终原型：`specs/images/prototypes/Ancher-Scripter-Prototype.html`（PR #34 合并后的综合版，默认「02 · Ancher 亮色」）
> SDD 来源：`~/Developer/.crates/sdd-sop/saas-0-to-1-prompts.md`（陈天老师原提示词 S00–S11）

本文只回答一件事：**从现在的 main 到「客户拿到 Windows + macOS 安装包和激活码、装上就能用」，还差什么、按什么顺序做、怎么验收。**

---

## 0. 「交付」的定义（离开条件）

满足下面全部条件，本轮才算完成：

1. `delivery/Ancher-Scripter-<版本>/` 目录里有：
   - `Ancher-Scripter-<版本>-mac-arm64.dmg`、`…-mac-x64.dmg`（Apple 芯片 / Intel）
   - `Ancher-Scripter-<版本>-win-x64-setup.exe`
   - `安装与激活说明.md`（含未签名安装包的放行步骤、机器码激活流程、填写 Ancher key、常见问题）
   - `SHA256SUMS.txt`
2. 本机（macOS, Apple 芯片）从 dmg 安装的应用能启动、激活、打开项目；打包产物里扫不到明文密钥。
3. 最终原型的 11 个页面，在客户端里都有对应的、能用的页面（§3 差异清单全部关闭，或在 §8 里明确列为「本轮不做」）。
4. 本地门禁全绿：`pnpm typecheck && pnpm test && pnpm --filter @scripter/desktop e2e`。
5. 代码审查结果落盘（`specs/0004-code-review.md`），每条意见都标了「采纳 / 不采纳 + 理由」。
6. 规格回写：0002 §11 进度、本文 §9 状态与代码一致。

最终目标包含发送给客户。先产出可核验交付目录；客户身份、机器码和发送渠道未提供时，保留待发送状态，不能报告已经发送。正式交付还需要 Windows 与 Intel Mac 的实际安装验收；无实机证据时仅能标识候选 beta 包。

---

## 1. 现状快照（2026-10-09，工作目录 feat/shots-production；基线 5cdcbb7）

| 方面 | 状态 | 证据 |
|---|---|---|
| 工程骨架 | Electron 44 + electron-vite 5 + React 19 + TS strict，pnpm workspace；`apps/desktop` + `packages/{core,license,agent}` + `tools/license` | 仓库 |
| 激活 | 离线机器码激活可用（Ed25519），本机已激活；Keygen 客户端已写，**未用真实账号测** | E2E「the right machine-bound code activates」 |
| 剧本编辑器 | Loro 文档、9 种元素、按轮撤销、自动保存 | E2E |
| AI | Ancher 流式对话 → `<ops>` → 一轮一次提交；修改预览；大纲写入；活动行；Tab 建议；加入队列；亮 / 暗主题 | E2E、真实 key 实际使用 |
| 设定页 | 角色 / 地点 / 道具 / 世界观 / 知识库（旧版文件列表） | E2E |
| 工作流 | ⌥1–⌥8 + ⌥9 一集剧本流水线，可取消 / 重试 / 重启恢复 | E2E |
| 导出 | PDF / FDX / Fountain / TXT / DOCX / 整项目 .scripter / 诊断包 | E2E |
| 打包 | electron-builder 配置齐（mac dmg+zip arm64/x64，win nsis x64），本机曾打出未签名 arm64 .app | PR #20 |
| 测试 | 68 个单元测试 + 1 条覆盖 24 个场景的 Electron E2E，**本轮 typecheck 和 68 单测通过；E2E 待重跑** | `pnpm test` / `e2e` |
| CI | **GitHub Actions 全部未启动：账号付款失败或额度不足**（"recent account payments have failed or your spending limit needs to be increased"） | run 37881387922 |
| 真实 key | 你本机已用真实 Ancher key 写过剧本；联网搜索返回「不可用」（疑似账号开关） | 实际使用 |

---

## 2. 对照陈天 SDD：每一步的现状与剩余工作

本项目把课程的 PRD（S03）和设计（S04）合并在 0002 里，编号和课程不同；下表按课程步骤对齐。

| 步骤 | 原提示词 | 本项目现状 | 剩余工作 → 产物 |
|---|---|---|---|
| S00 约束 | P-W2-01 / P-W7-05 | ✅ `CLAUDE.md`：TS strict、IPC camelCase、key 只进 safeStorage、依赖锁精确版本、纯本地无登录（课程里的「不需要 authentication」在这里成立，SaaS 补充项不适用） | 无 |
| S01 范围 | P-W1-01 / P-W2-02 | ✅ 0002 §0–§1 | 本文 §8 补「本轮不做」 |
| S02 调研 | P-W3-04 / P-W7-04 / P-W4-06 | ✅ Ancher SDK 包内实证（0002 §5.1）；真实 key 已跑通对话 / 写作 | 联网搜索不可用、视频解析未实测 → 记入 §7 阻塞项，不阻塞交付 |
| S03 PRD | P-W7-01 / P-W7-02 / P-W5-02 | ✅ 0002 §0、§5.6、§9 + 原型逐页即行为规格 | 本文 §3 把原型新增的行为（知识库笔记、停靠对话、分镜 / 制作、最近 / 回收站）写清触发 / 成功 / 失败 / 持久化 |
| S04 设计 | P-W7-03 / P-W5-03 | ✅ 0002 §4（IPC 合同在 `src/shared/ipc.ts`） | §3 每项列出新增 IPC 与数据结构 |
| S05 Agent | P-W6-02 | ✅ `packages/agent/src/prompt.ts` + 工作流提示词；只承诺 Ancher 实际具备的能力 | 分镜 / 制作的提示词（§3 G4）；生图**不承诺**（Ancher 只有反推提示词，没有生图） |
| S06 计划 + 评审 | P-W5-04 / P-W5-05 / P-W5-07 | 0002 §11–§12 有阶段与测试清单 | 本文 §5 执行计划 + §6 测试计划。课程用 codex 交叉评审；本轮用独立审查子代理（§6.3），结果落 0004 |
| S07 骨架 + 风格 | P-W7-06 / P-W1-06 | ✅ 目录结构、Ancher token（亮 / 暗） | 无 |
| S08 分阶段实现 | P-W1-03 / P-W5-06 / P-W7-07 | Phase 2–7 已做大部分 | §3 差异 G1–G6，按 §5 的 E1–E3 实现 |
| S09 测试联调 | P-W1-04 / P-W2-03 / P-W7-09 | E2E 全绿 | E4：逐页对照原型走查（P-W7-09 写法）、§6.2 上线门槛自动化、打包产物冒烟 |
| S10 审查回写 | P-W6-05 / P-W3-13 | 每个 PR 有 CodeRabbit（Actions 停摆期间不可靠） | E5：整库对照 0002 / 0003 审查 → `0004-code-review.md`；回写 0002 §11 |
| S11 交付 | P-W7-17 / P-W5-10 | 发布流水线写好但依赖 Actions + 证书 + 发布仓库 | E6：本机打双平台包 + 交付目录 + 说明（课程没有部署提示词，这里按 S04→S06→S09 的套路补齐，见 §4） |

---

## 3. 原型 ↔ 客户端差异清单（S03 / S04 补充）

原型页面：P1 激活 · P3 创作首页 · P4 工作区 · P5 角色 · P12 地点 · P9 道具 · P10 世界观 · P11 知识库 · P6 制作 · P7 最近 · P8 设置。

| # | 原型 | 客户端现状 | 差异 |
|---|---|---|---|
| G1 | P11 知识库（Ancher 笔记式） | 文件列表 + 「写作时参考」 | 整页重做 |
| G2 | P5 / P12 / P9 / P10 / P11 右侧停靠 AI 对话 | 只有工作区有 AI 面板 | 新增共享停靠对话 |
| G3 | P3 首页两层输入框 + 「+」菜单 | 旧输入框 + 「空白剧本」按钮 | 换成新输入框 |
| G4 | P4「分镜」视图 + P6 制作页（制作设置 + 镜头） | 没有 | 新增 |
| G5 | P7 最近（项目网格、回收站） | 首页底部有「最近」列表，删除是硬删 | 新增最近页与回收站 |
| G6 | P4 AI 面板为圆角停靠卡片 | 竖向分栏（360/380px） | 只改外观 |
| G7 | 「+」菜单像 Claude 一样分级 | 一长串分组列表 | 顶层精简 + 级联子菜单 |

### G1 知识库（笔记式）

- **数据**：沿用 `bible.files`，新增可选字段 `title`（默认文件名）、`tags: {label, color}[]`、`memo`、`group`（默认「全部笔记」）、`summary`（Ancher 解析时一起生成，失败为空）。旧项目读入时自动补默认值，不迁移文件。
- **布局**：左侧分组列表（全部笔记 / 写作时参考 / 聊天附件 / 直接上传，带计数）→ 中间笔记面板：类型标签、标题（可编辑）、标签（可加、可删）、处理中横幅（`extract === 'working'`）、备注、「摘要 / 原文」切换（原文是本地提取的文本片段，摘要是 `summary`）、头部按钮（写作时参考开关、用系统程序打开、删除、对话开关）→ 右侧停靠对话（G2）。
- **触发 / 成功 / 失败 / 持久化**：
  - 添加：拖入或「+」→ 复制进项目文件夹 → 列表出现「处理中」→ 解析成功显示摘要。解析失败显示「读取失败，重试」。所有修改都写进 Loro 文档并自动保存。
  - 改标题 / 标签 / 备注：失焦即保存，可撤销。
- **IPC**：沿用 `files.*`；新增 `files.update(projectId, fileId, patch)`。

### G2 停靠对话（共享组件）

- **形态**：400px 圆角卡片停靠在页面右侧。头部有标题、新对话、收起；正文是消息流和活动行；中间是引用卡（当前页上下文，例如「角色表 · 4 个角色」「当前笔记标题」）；底部是两层输入框（Tab 建议、Enter 发送、发送中可停止）。页头有开关按钮，开关状态按页记住（`localStorage`，失败时默认展开）。
- **行为**：和工作区共用**同一个项目对话**（同一个 Ancher conversation），发送时附带页面上下文：
  - 角色 / 地点 / 道具 / 世界观：`bibleBrief`。
  - 知识库：当前笔记的摘要和原文片段（标注为素材）。
  AI 返回的 `<ops>` 走现有的写入 / 修改预览流程，所以在角色页说「给大壮补一句人物弧光」能直接改角色卡，并且可以撤销。
- **失败**：没填 key、断网、Ancher 报错时，和工作区面板的提示一致。
- **实现**：把工作区 `Chat` 拆成可复用的 `<DockChat context={…} />`，不复制代码。

### G3 首页输入框

- 结构同工作区输入框：「@」、「+」（文件和图片 / 本地视频 / 知识库笔记 / 链接）、联网开关、项目类型标签（剧本项目 / 快速视频）、语音（本轮只提示「暂不支持」，见 §8）、发送。
- 「+」→ 文件和图片：选中的文件在项目创建后进知识库（`src: 'chat'`）。
- 「空白剧本」挪进「+」菜单底部；意图标签和建议面板保留。

### G4 分镜与制作

- **分镜视图（工作区「分镜」）**：
  - 按场列出镜头，每个镜头有景别（远 / 全 / 中 / 近 / 特，点击切换）、描述、时长。
  - 「AI 拆镜」：单场或全部。走 Ancher 对话，返回 `<ops>` 新操作 `setShots{sceneId, shots[]}`，一轮可撤销。
  - 数据存在 Loro 文档 `bible.shots`（使用场景 heading 节点 ID 稳定关联；改标题仍保留镜头；删除场景后不导出孤立镜头）。
- **制作页（导航「制作」）**：
  - 顶部场景标签条。
  - 镜头卡：片段时长 5/8/10/15s、镜头描述、添加镜头、AI 分镜。
  - 场景卡：「生成画面提示词」——Ancher 输出中英文生图提示词，可复制。**不生成图片**，Ancher 没有生图能力，见 §8。
  - 「制作设置」弹窗：画幅（16:9 / 9:16）、制作类型（叙事 / 商业）、美术风格（4 个预设 + 自定义描述）。存在项目 meta，生成画面提示词时带上。
- **导出**：分镜表导出为 CSV（场次、镜号、景别、描述、时长）。

### G5 最近与回收站

- 首页「最近」区换成独立的「最近」页（左侧导航：新建 / 最近 / 回收站）。网格包括新建剧本卡和项目卡（标题、编辑时间）。
- 删除项目：移进回收站（项目文件夹移到 `userData/trash/`）→ 回收站里可「恢复」或「彻底删除」（二次确认）。
- 「快速视频」「社区」不做（§8）。

### G6 工作区 AI 面板外观

- 竖向分栏改成和 G2 同款的圆角停靠卡片（`margin 8px`、`radius 22px`、细描边）。行为不变。

### G7 「+」菜单分级（2026-10-09 补充，参考 Claude 桌面端的「+」菜单）

- **顶层**只放常用的：文件和图片（⌘U）、本地视频、知识库笔记，分隔线下面是「快捷指令 ›」「工作流 ›」。
- **子菜单**向右弹出：每项是标题加一行灰色说明；工作流项右侧显示 ⌥1–⌥9。
- **键盘**：↑↓ 移动，→ / Enter 打开子菜单，← / Esc 返回上一级，再按 Esc 关闭并把焦点还给「+」。鼠标悬停也能打开子菜单，子菜单不做动画（使用频繁）。
- **范围**：工作区面板、停靠对话、首页输入框共用同一个菜单组件；首页没有项目上下文，不显示「工作流」。

---

## 4. 发布工程（S11 补齐：部署提示词课程里没有）

| # | 内容 | 默认做法 | 验收 |
|---|---|---|---|
| R1 | 版本号 | `1.0.0-beta.1`（`apps/desktop/package.json`），打 tag `v1.0.0-beta.1` | 关于页 / 设置页显示版本 |
| R2 | mac 包 | 本机 `electron-builder --mac`，arm64 + x64 dmg/zip。没有证书时 ad-hoc 签名（`identity: null` 时 electron-builder 跳过签名），不公证 | dmg 挂载 → 拖入应用程序 → 右键打开能启动 |
| R3 | win 包 | 本机交叉构建 `--win nsis x64`；如果改图标 / 版本信息需要 wine，就在构建机装 wine 或改用 Actions（恢复后） | 产出 `setup.exe`；**实机安装需要 Windows 电脑**（§7） |
| R4 | 激活公钥 | `resources/license-public.pem` 必须是正式密钥对；私钥只在 `~/.ancher-scripter/license/private.pem`（0600），不进仓库、不进安装包 | `strings` 扫描安装包只看到公钥 |
| R5 | 激活流程 | 默认离线机器码（不依赖 Keygen）：客户安装 → 激活页显示机器码 → 发给你 → `pnpm license issue` 签发 → 客户输入 | 本机走一遍 |
| R6 | 自动更新 | 未签名的 mac 包装不了自动更新（Squirrel.Mac 要求签名），Windows 可以。本轮在说明里写「新版本手动下载覆盖安装」；签名和发布仓库就绪后再开 | 设置页「检查更新」在未配置发布源时提示友好，不报错 |
| R7 | 交付目录 | `pnpm deliver` 脚本：收集安装包 → 生成 `SHA256SUMS.txt` → 复制 `安装与激活说明.md` → `delivery/Ancher-Scripter-<版本>/`（目录在 `.gitignore`） | §0 第 1 条 |
| R8 | 签名 / 公证（后续） | 证书到位后：mac Developer ID + notarize，win Azure Trusted Signing；`release.yml` 已写好 | 不阻塞本轮 |

---

## 5. 执行计划（S06 → S08，每步一个 PR，合并前跑本地门禁）

> 课程节奏是「Agent 写文档 → 人 review → 改 → 交叉评审 → 动手」。这次你明确要求「先出 spec 然后彻底执行」，所以 review 节点改成：每个 PR 的说明里写清改了什么，你可以随时叫停。

| 步 | 内容 | 产物 | 验收 |
|---|---|---|---|
| E0 | 本 spec | `specs/0003-delivery-spec.md` | 合并 |
| E1 | G1 知识库 + G2 停靠对话（5 个页面） | `DockChat` 组件、`Knowledge.tsx` 重写、`files.update`、`bible.files` 新字段 | E2E 新增：笔记改标题 / 标签、角色页对话写回角色卡并撤销 |
| E2 | G4 分镜视图 + 制作页 + `setShots` op + 画面提示词 | `Shots`、`Production` 页面、core ops 与单测 | 单测：setShots 解析 / 撤销；E2E：AI 拆镜一场、导出 CSV |
| E3 | G3 首页输入框、G5 最近与回收站、G6 面板外观、G7「+」菜单分级（原型 + 客户端） | `Home.tsx`、`Recents.tsx`、`projects.trash/restore/purge` | E2E：删除 → 回收站 → 恢复 |
| E4 | 逐页对照原型走查（亮 / 暗）+ §6.2 自动化 | 修复 PR；`scripts/scan-secrets` | 走查表全部通过 |
| E5 | 代码审查 + 回写 | `specs/0004-code-review.md`，采纳项的修复 PR；0002 §11 回写 | 每条意见都有结论 |
| E6 | 打包与交付目录（R1–R7） | `delivery/…`、`安装与激活说明.md` | §0 第 1、2 条 |

---

## 6. 测试计划（S09）

### 6.1 门禁（每个 PR）

`pnpm typecheck && pnpm test && pnpm --filter @scripter/desktop e2e`，本地执行。Actions 恢复前，PR 说明里贴本地门禁结果，代替 CI。

### 6.2 上线门槛（0002 §12.4 的可自动部分）

| 项 | 做法 |
|---|---|
| 改动激活码任意一个字符 → 拒绝；A 机器的码用在 B 机器 → 拒绝 | `packages/license` 单测（已有则核对） |
| 安装包和本地文件里没有明文 key | `scripts/scan-secrets.mjs`：解包 `app.asar` + 扫 `userData`，匹配 Ancher / Gemini key 格式 |
| 修改预览拒绝后零改动，接受后可撤销 | E2E 已有 |
| 断网时能编辑和导出，AI 显示离线提示 | E2E：假 Ancher 关掉后发送 → 提示；编辑 / 导出照常 |
| 提示词注入：知识库素材里写「忽略之前指令」 | `prompt.ts` 单测：素材被包在〈参考资料〉里，规则段落在前 |
| 打包产物冒烟 | 用 Playwright `_electron` 启动打包后的 `.app`（不带 E2E 覆盖变量），看到激活页即通过 |

### 6.3 审查（S10）

用独立的审查子代理，对照 0002 / 0003 审查整个仓库：架构边界（主进程 / 渲染进程 / IPC）、密钥处理、`<ops>` 校验与原子性、错误处理、死代码。结果写进 `specs/0004-code-review.md`，严重问题当轮修。

### 6.4 需要人做的（不能在本机自动完成）

- Windows 10/11 实机安装、首次启动、卸载
- Intel Mac 实机安装
- 客户机器的机器码签发

---

## 7. 阻塞项与默认处理

| 项 | 影响 | 本轮默认 |
|---|---|---|
| GitHub Actions 付款失败 | 没有 CI，不能在云上打 Windows 包和签名 | 本地门禁 + 本机交叉构建；你去 GitHub Billing 处理后自动恢复 |
| Apple Developer / Windows 签名证书 | 未签名：mac 要右键打开，win 要点「仍要运行」；mac 无自动更新 | 说明文档写清放行步骤 |
| `aiscript-releases` 仓库 + `RELEASES_TOKEN` | 自动更新没有发布源 | 手动分发安装包 |
| Keygen 账号 | 在线激活没测 | 用离线机器码 |
| Windows 实机 | 安装包没在 Windows 上实际运行过 | 交付说明里标「beta」，请客户或你在 Windows 上验收 |
| 字体下载许可（Courier Prime + 朱雀仿宋） | 内置字体 | 继续用系统字体回退 |
| Ancher 联网搜索返回「不可用」 | 调研类工作流降级 | 已有降级提示；请你向 Ancher 确认账号开关 |
| 客户样本 | Phase 4 评测集 | 不阻塞交付 |

---

## 8. 本轮不做

- 生成图片 / 视频（Ancher 没有这项能力；只生成提示词）
- 「快速视频」项目类型的专属流程、「社区」（原型里只作为入口展示；首页类型选「快速视频」时按剧本项目创建，并提示「快速视频流程即将推出」）
- 语音输入（按钮提示「暂不支持」）
- 多人协作、云同步、账号体系（0002 §0）

---

## 9. 状态（随执行更新）

| 步 | 状态 | PR |
|---|---|---|
| E0 | 已完成；主提示词 spec 为 0006 | 0003/0006 |
| E1 | 实现与最终扩展 E2E 已通过 | 0005 |
| E2 | core 与 Electron 验证通过 | 0005 |
| E3 | 实现与最终扩展 E2E 已通过 | 0005 |
| E4 | 逐项原型修复及截图复核中 | 0004/0005 |
| E5 | 独立审查完成；采纳项已修复 | 0004 |
| E6 | 三目标原生 CI 候选包构建通过；Windows 安装与 mac ARM64 启动冒烟通过；签名/客户完整验收与发送待外部条件 | 0005 / Release 37889834662 |


## 10. 本轮执行基线与补充合同（2026-10-09）

用户已要求「先输出 spec，然后按照 spec 彻底执行」：本文落盘后连续执行，无需重复请求流程批准。保留工作区已有改动。本轮以 final URL `http://localhost:4173/Ancher-Scripter-Prototype.html#p11-d2-mac-k2-a` 和综合原型源码为视觉基准；页面 hash 是知识库选中状态，不代表只实现知识库。

### 10.1 实际验证的现状

- `origin` 已是 `https://github.com/ziyeprompttheworld/aiscript.git`，目标仓库存在且为私有。原远端保留为 old-origin。发布源、工作流和 README 仍引用 ziyetsui，必须修复。
- 当前分镜/制作、CSV、提示词、core ops 代码已存在未提交改动；不能重新生成或丢弃。68 单测和 typecheck 在本轮通过，E2E 和原型一致性需重新验证。
- G1/G2/G3/G5/G7 尚有真实差距；0003 旧状态表不是完成证据。E2E mock 通过只能证明本地协议和行为，不证明真实 Ancher 联网搜索/媒体解析服务可用。
- 当前 public.pem 已存在。复用现有签发密钥；不得轮换私钥。安装包只带公钥，发行者工具不进入 app.asar。

### 10.2 文件与接口任务

|任务|文件/接口|验收|
|---|---|---|
|T1 知识库笔记|core KnowledgeFile 增加 title/tags/memo/group/summary；files.update(id,fileId,patch)、files.createNote(id,title,body)；Knowledge.tsx|编辑标题、标签、备注、正文；分组/搜索；重开仍保留；文本离线可编辑，非文本原文只读|
|T2 共享对话|Workspace 抽出同一 Chat 面板；App 将存活的 Workspace 对话挂载于内容页 dock；ai.write 增加 pageContext，主进程按页构建素材，不把资料当指令|切换角色/知识库仍是同一对话；写回并撤销；停止/排队/预览仍可用；页上下文进入实际 prompt|
|T3 首页与菜单|Chat.Composer 共用两层输入；层级 PlusMenu；Home 支持创建时附件；未实现快速视频只显式提示|Enter 发送，中文 IME 不误发；菜单方向键/Esc；首页附件到新项目；无 key 仍可创建空白项目|
|T4 最近与回收站|projects.trashList()/remove()/restore()/purge()；remove 改成移动目录；Recents.tsx|软删、退出重开、恢复；恢复不覆盖；清空仅经明确确认；正在生成的项目禁止移入回收站|
|T5 发布工程|electron-builder、release.yml、updater、scripts/deliver.mjs、scan-package.mjs、docs/delivery|新 repo；默认手动更新；mac arm64/x64 dmg+zip、win x64 NSIS；公钥必需；交付脚本缺任一必需包失败；SHA256 与 manifest|
|T6 联调/审查|扩展现有 E2E、独立审查 0004、执行证据 0005|门禁全绿；对照 11 页逐页记录；问题修复后再跑受影响测试|

### 10.3 打包与外部条件

保留锁定依赖，不为追逐最新版而升级整个运行时。electron-builder 26 配置按本地安装版本核验。官方资料：
- https://www.electron.build/docs/features/multi-platform-build/ ：mac 签名需要 macOS，Windows 交叉构建受工具链限制，优先原生 Windows runner。
- https://www.electronjs.org/docs/latest/api/safe-storage ：Windows 使用 DPAPI、mac 使用钥匙串；加密可用性需验证，不能降级为明文。
- https://www.electron.build/v26/docs/features/build-lifecycle/ ：以 v26 的签名/构建流程为准。

默认使用 1.0.0-beta.1 候选包，手动更新；有凭证才启用签名/公证。未签名不能宣称通过 Gatekeeper/SmartScreen。不安装未知 Wine、不关闭系统防护来制造通过结果；若本机交叉构建失败，记录具体错误并尝试原生 GitHub Actions。GitHub 付款旧结论需要重新核实，不能照抄为当前事实。

### 10.4 验收分级与交付材料

A 代码完成：T1–T4 行为与 final 原型一致、typecheck/单测/E2E 全绿。
B 包完成：三个必需安装包+两个 mac zip、公钥有效、无私钥/API key、文件校验和、打包 mac 冷启动证据。
C 客户交付：目标系统实际安装、签发该客户机器绑定码、接收人/渠道确定、发送后有可核验结果。
任何层级未达成都留待办，不以「beta」自动豁免 C 或其他未完成要求。

交付目录包含安装与激活说明、已知限制、SHA256SUMS、build-manifest.json；发行者说明包含密钥备份与按机器码签发方法，私钥和客户激活码不进入公开仓库。执行报告每项附命令/结果/路径，失败项写具体阻塞和下一步。
