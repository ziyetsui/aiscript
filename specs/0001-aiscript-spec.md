## constitutions



### 准备提示词
sass原提示词 ： /Users/ziye/Developer/.crates/sdd-sop/saas-0-to-1-prompts.md
aicv沉淀的提示词：aicv/aicv-prompts-2026-09-29-to-2026-10-08.md


### 准备资料

帮我找一下 llm space   这个 github repo ， 然后clone 到 /Users/ziye/Developer/aiscript/vendors


### aiscript 提示词


1、 原型+ 开发


这是sdd：

/Users/ziye/Developer/.crates/sdd-sop/saas-0-to-1-prompts.md

需要你根据我想做的桌面客户端 （windows + mac ） ，输出一份 spec 文档：对照陈天老师的原提示词，梳理出接下来继续往下推进还需要做些什么。我最终的目标是要让它顺利上线，所以想清楚知道： 从想法到 原型 到sdd 到开发 到 部署 到 测试， 都需要什么。


简单来说， 我想把这个网站 https://laper.ai/  做成 windows + mac 版本客户端， 100%由 Claude Code 构建特别鸣谢Loro CRDT/Mastra ，这是用到的技术栈，你可以找一下。

我已经在chrome 浏览器打开了 这个网站， 需要登录你可以告诉我，用computer use复刻完整交互流程，可以操控实际写一次剧本，体验一下从onboarding 到 最终生产出来一集剧本的完整流程 （的每一个交互状态和细节）， 我想用 emil的 skill 把目前每个页面再做 2 个不同方向的发散，可以一起给我，我最终选出一版来进行真正的整合 ， 原型格式是"单文件 + 悬浮层级切换器 + 每层一个完整 HTML 文档"。


然后这是之前的客户调研 ， 你可以看一下基于用户访谈，以及他们的痛点， 原型有哪些细节/ 交互流程可以增加或者增强的。'/Users/ziye/Library/Mobile Documents/com~apple~CloudDocs/wiki/20-29 Beta/monetization/products/ai-services/ai-script-agent/docs/solution-script-agent-qa.md' '/Users/ziye/Library/Mobile Documents/com~apple~CloudDocs/wiki/20-29 Beta/monetization/products/ai-services/ai-script-agent/docs/meeting' '/Users/ziye/Library/Mobile Documents/com~apple~CloudDocs/wiki/20-29 Beta/monetization/products/ai-services/ai-script-agent/docs/client-inputs/20260917-intake-client-audio-transcript.md' '/Users/ziye/Library/Mobile Documents/com~apple~CloudDocs/wiki/20-29 Beta/monetization/products/ai-services/ai-script-agent/docs/client-inputs/research-client-needs-and-pain-points.md'
比如客户现在已经有了第一集动画片的剧本，但是对于内容不是很满意，想复刻哆啦A梦的第一集的原型， 换成自己的人物等等， 生成剧本


你可以看一下 我的 ancher.ai 这个网站， 以及 切换 github ， 看一下这个网站的repo ， 根据这个 repo 的 design token 去发散5个方向不同的原型页面 （注意只是design token）， 你刚才提到的很多交互 其实可以通过对话 窗口的agent 完成， 原型交互功能还是尽量 向laper 靠拢

最终的目的，就是 原型 能实现功能就可以了， 比如客户现在已经有了第一集动画片的剧本，但是对于内容不是很满意，想复刻哆啦A梦的第一集的原型， 换成自己的人物等等， 生成剧本


还有一个事，如果我需要转录视频， 把本地的视频路径给 agent对话窗口， 让它转成逐字稿， 我是否可以自己选择 模型，比如gemini ， 因为 vita api 非常高昂，这是否可实现， 就像我在codex里的操作一样


创建pr， 分支 ， 并合并部署。

/Users/ziye/Developer/aiscript/vendors/llm-space ， 这是一个桌面客户端的 repo ， 查看一下 这个客户端 用到的技术 ，包括登录等等， 更新到 spec。


这个剧本产品的封装主要是为了调用这个 vita 的sdk ，https://www.npmjs.com/package/@ancher-ai/sdk ，客户买了ancher.ai 的api，用于剧本生成，原型复刻等等，我想百分之百还原 ancher.ai 上的一切 agent能力，  尤其是联网搜索、解析、 逆向提示词等等。  你看看接入这三种的区别是什么， 如果 1:1 还原 在ancher.ai 上的能力，接入哪种最好？

https://www.npmjs.com/package/@ancher-ai/sdk
https://www.npmjs.com/package/@ancher-ai/agent-skills
https://www.npmjs.com/package/@ancher-ai/cli


最后，需要一个账户只能绑定三台电脑， 并且可以让我们在后台追踪到每一个账户的token使用量 ，这个是否可以做到？

以及客户端是否还需要服务器和域名？


寻找产品走查相关的 Skill：

你先帮我去 GitHub 仓库上检查一下，有没有高 Star 的产品走查相关的 Skill。我希望能找到这样的 Skill 帮我整体走查一遍。

去看一下陈天老师的 SDD 开发文档

/Users/ziye/Developer/.crates/sdd-sop/saas-0-to-1-prompts.md

，把所有与 Test 相关的提示词都帮我摘抄出来。比如 Agent 的 Test，检查几个用例看是否能够生成；或者把整个网站 Test 相关的提示词搜索出来，然后按照 spec 执行



先输出 spec， 然后按照 spec 彻底执行 。



补充： 我先不要服务器， 先要本地， /Users/ziye/Developer/aiscript/docs/chat-exports ， /Users/ziye/Developer/aiscript/docs/chat-exports/桌面应用与-Ancher-SDK-讨论记录-2026-10-08.md

这是我和大模型讨论的方案， 仔细阅读， 你可以基于这个， 更新spec ， 以及原型 ， 还有一点快捷指令， 针对用户痛点的工作流可以加上
以及不要账号登录了， 给api （ 我在ancher.ai  上生成的）， 以及三个激活码， 用户安装完 填写激活码 ， 需要想个办法 （因为我不想要 服务器， 只在本地），需要想个办法， 这个激活码用过一次 就不能用了 ，类似 invitation code ，是否可实现

这是原型 ：prototypes/dist/index.html





{
  "todos": [
    {
      "content": "确认执行环境与权限：本地文件/终端、GitHub、浏览器 computer use、测试账户；明确付费生成、推送、合并及生产部署的授权范围",
      "status": "pending"
    },
    {
      "content": "读取陈天老师 saas-0-to-1-prompts.md，整理 SDD 阶段、交付物与执行门禁",
      "status": "pending"
    },
    {
      "content": "逐字摘抄 SDD 文档内全部 Test 相关提示词，保留章节与行号，分类为 Agent、网站、端到端及上线验证",
      "status": "pending"
    },
    {
      "content": "检查 llm-space 仓库：桌面框架、Windows/macOS 支持、登录与凭据存储、数据同步、打包更新、测试及 CI/CD",
      "status": "pending"
    },
    {
      "content": "检索 GitHub 产品走查 Skills，核验 Star、活跃度、许可证、浏览器能力及安全性，给出候选与推荐",
      "status": "pending"
    },
    {
      "content": "定位用户所指 Emil skill，确认版本、使用方式及原型输出约束",
      "status": "pending"
    },
    {
      "content": "核验 laper.ai、Loro CRDT、Mastra 的公开资料，区分实证技术栈、推测与拟选技术栈",
      "status": "pending"
    },
    {
      "content": "对比 @ancher-ai/sdk、agent-skills、cli 的官方文档及源码：能力、认证、工具执行、流式输出、会话、权限、分发与商业限制",
      "status": "pending"
    },
    {
      "content": "制定 ancher.ai 能力对齐清单，重点核验联网搜索、内容解析、逆向提示词及其 API 可用性；形成接入方案与最小验证计划",
      "status": "pending"
    },
    {
      "content": "使用浏览器走查 laper.ai；需要时请用户登录，以专用测试项目完成 onboarding 到生成一集剧本",
      "status": "pending"
    },
    {
      "content": "记录产品走查证据：页面、路由、操作、输入输出、加载/空白/失败状态、重试、持久化与恢复；未触达状态单列待验证",
      "status": "pending"
    },
    {
      "content": "确定产品范围、目标用户、核心流程、MVP 与后续版本、复刻边界、内容版权及量化上线验收标准",
      "status": "pending"
    },
    {
      "content": "设计账户和三设备绑定：设备注册、并发限额、解绑换机、令牌撤销、离线策略及防滥用规则",
      "status": "pending"
    },
    {
      "content": "设计账户级 token 用量后台：请求归属、上游 usage、流式中断、重试去重、费用与对账；区分官方计量和估算",
      "status": "pending"
    },
    {
      "content": "决定客户端/服务端边界，说明服务器与域名需求，并设计密钥保管、认证、同步、审计、隐私及数据删除方案",
      "status": "pending"
    },
    {
      "content": "编写首版 spec：对照陈天 SDD 原提示词列出已有证据、缺口、后续任务、依赖、交付物与验收标准",
      "status": "pending"
    },
    {
      "content": "在 spec 中纳入页面状态、Agent 能力矩阵、数据模型/API、桌面架构、技术选型、成本、测试、部署与回滚计划",
      "status": "pending"
    },
    {
      "content": "先交付 spec 及待确认决策，明确阻塞项和默认方案，再按 spec 推进实施",
      "status": "pending"
    },
    {
      "content": "按页面输出两种设计发散，使用 Emil skill（确认可用后），覆盖核心交互及关键异常状态",
      "status": "pending"
    },
    {
      "content": "制作原型：单文件入口、悬浮层级切换器、每层独立完整 HTML 文档；验证切换、交互和离线资源策略",
      "status": "pending"
    },
    {
      "content": "请用户选择整合方向，收敛原型并更新 spec、组件规范和验收基线",
      "status": "pending"
    },
    {
      "content": "创建开发分支与小粒度任务计划，建立格式检查、类型检查、测试、构建和安全扫描 CI",
      "status": "pending"
    },
    {
      "content": "完成 Ancher 最小接入验证，对照网页端测试搜索、解析、逆向提示词、剧本生成与流式恢复；记录不可对齐能力",
      "status": "pending"
    },
    {
      "content": "实现桌面客户端骨架、登录、安全凭据存储、三设备绑定、会话与本地持久化",
      "status": "pending"
    },
    {
      "content": "实现后端认证、设备管理、Agent 请求与用量账本、管理后台及必要的数据同步",
      "status": "pending"
    },
    {
      "content": "实现 onboarding、创作工作区、Agent 工具交互、生成/编辑/保存/导出完整剧本链路",
      "status": "pending"
    },
    {
      "content": "将摘抄的 Test 提示词转为可执行用例，建立提示词—需求—测试—验收追踪矩阵",
      "status": "pending"
    },
    {
      "content": "执行 Agent 能力评测：固定数据集、生成质量、工具正确性、异常恢复、成本与耗时阈值",
      "status": "pending"
    },
    {
      "content": "执行单元、集成、端到端、权限隔离、设备并发、token 对账、注入防护及密钥泄漏测试",
      "status": "pending"
    },
    {
      "content": "在 Windows/macOS 实机验收安装、首次启动、系统权限、断网恢复、升级与卸载，并修复回归问题",
      "status": "pending"
    },
    {
      "content": "配置测试环境与生产部署、域名/TLS、监控告警、备份恢复、配额限流和发布回滚",
      "status": "pending"
    },
    {
      "content": "完成 Windows 签名、macOS 签名/公证、安装包、自动更新及发布物完整性验证",
      "status": "pending"
    },
    {
      "content": "创建 PR，附 spec、原型、测试证据和风险；通过评审及 CI 后按授权合并",
      "status": "pending"
    },
    {
      "content": "先发布测试版本并执行冒烟验收，再按授权部署生产后端、分发桌面客户端和验证正式更新通道",
      "status": "pending"
    },
    {
      "content": "交付上线清单、操作手册、测试报告、监控与应急方案；跟踪首批反馈并完成上线复盘",
      "status": "pending"
    }
  ]
}



##  fix

http://localhost:4173/Ancher-Scripter-Prototype.html#p11-d2-mac-k2-a
这是我的final原型页面



这是sdd：
/Users/ziye/Developer/.crates/sdd-sop/saas-0-to-1-prompts.md

需要你根据我目前的开发进展， 到最终原型呈现的的桌面客户端 （windows + mac ） ，输出一份 spec 文档：对照陈天老师的原提示词，梳理出接下来继续往下推进还需要做些什么。直到成功打包，发给客户。

先输出 spec， 然后按照 spec 彻底执行 。


