# AIScript 原型 v2

`dist/index.html` 是单个文件，共 40 层：**8 个页面 × 5 个 design token 方向**，每层都是一份完整的 HTML 文档。文件大约 1.2MB，有些预览器打不开，用浏览器直接打开即可，离线可用。

- **交互**：一比一按 laper.ai 的实际流程（见 [走查记录](../docs/research/laper-walkthrough.md)）。工作区一打开，AI 就自动根据那句故事开写：读取 → 改名 → 写大纲（自动切到大纲视图）→ 建角色和地点 → 逐个插入剧本节点（正在写的高亮）。新手任务 toast 联动，每轮结尾 AI 提一个问题，第二轮显示"N 处修改 · 撤销"
- **视觉**：只换 design token，用 Emil（emil-design-eng）的方法发散出 5 个方向。每个方向除了颜色、字体、圆角、阴影，还定义了**动效 token**：入场缓动、按压缩放、按钮反馈 / 弹层 / 模态时长、入场位移、spinner 速度、AI 落笔高亮时长。所有 UI 动效 ≤300ms，进出场用 ease-out，不从 scale(0) 起，越是高频使用的方向动效越少。5 个方向的 DOM 完全相同，`check.mjs` 机检
- token 来源：**app.ancher.ai** 线上 CSS 变量（n1/n2/n3 中性色、b1–b5 品牌色、Manrope / Lora / Geist Mono、radius 8、`--ease-fast`）；**ancher 仓库**桌面 Agent 的 `new-design/components/tokens.jsx`（暖纸 oklch、唯一锈红、鼠尾草绿、赭黄、Source Serif 4 / Geist / JetBrains Mono、暖棕阴影）

| # | 方向 | 色彩 / 字体 | 动效性格 |
|---|---|---|---|
| 01 | Studio Rust · 纸墨锈红 | 桌面 Agent 原生：暖纸 + 锈红，Source Serif + Geist | ease-out 强曲线，按压 0.97 / 160ms，弹层 200ms |
| 02 | App Navy · 产品藏蓝 | app.ancher.ai 浅色原样：n2 + b1，Lora + Manrope，radius 8 | 产品自带 `--ease-fast`，0.98 / 150ms |
| 03 | App Ember · 产品余烬 | app.ancher.ai 深色原样：n2 暗 + b2 橙 | 位移只有 4px，AI 落笔高亮 700ms 便于追踪 |
| 04 | Graphite Signal · 石墨信号 | n3 冷紫灰 + b3，圆角 ×0.5，Geist Mono 标签 | 为高频使用设计：100ms 按压，弹层只淡入不位移 |
| 05 | Lamplight · 台灯夜写 | 暖暗 + 赭黄 / 鼠尾草，Source Serif 斜体，毛玻璃 | 最柔：抽屉曲线 280ms，位移 10px，高亮 900ms |

快捷键：`↑/↓` 换页，`1–5` 换方向，`M/W` 切换 macOS / Windows 外框，`H` 收起切换器。

P4 工作区里还有三项我们新增的对话能力：
- 输入框里的**模型选择**：Ancher / Gemini（用自己的 key）/ 本地 SenseVoice
- **把本地视频转成逐字稿**（建议 chip）
- **参考哆啦A梦第 1 集的结构重写**（建议 chip，只取骨架）

![01 Studio Rust · 第一轮写完](screenshot-p4-d1.jpg)

构建并校验：

```bash
node prototypes/build.mjs && node prototypes/check.mjs
```

v1（10 页 × 2 个方向，按客户痛点设计的独立页面）存档在 [`v1/`](v1/)。示例故事是原创内容。
