# laper.ai 登录后走查记录（2026-10-08）

- 账号：用户本人的免费档 Junior 账号，在 Claude 内置浏览器里登录
- 测试项目：《末班广播》，一句话故事是原创的
- 消耗：2 次 AI 对话；积分剩 110
- 截图：[`walkthrough/`](./walkthrough/)，编号对应下表

## 1. 完整流程（时间线）

| # | 路由 | 页面 / 状态 | 观察到的细节 | 截图 |
|---|---|---|---|---|
| 1 | `/login/?intent=signup` | 登录 / 注册 | Google、微信、邮箱 + 密码；Cloudflare Turnstile 人机验证；左边表单，右边大幅插画；顶部 "News" 公告条 | 01 |
| 2 | `/onboarding` | 一句话入口 | 标题 "Finally — what story lingers in your mind?"（"Finally" 说明前面还有问卷步骤，本账号已经做过）；大输入框；`+ Add files`；类型下拉 **Screenwriting / Quick Video**；黑色圆形发送按钮；背景是缓慢流动的模糊绿色光斑 | 02、03 |
| 3 | `/app/new` | 创作首页（过渡） | "Good afternoon, {用户名}"；右上角胶囊 "Free Plan · Upgrade"；输入框下面有 5 个意图标签 **Format / Idea / Writing / Plot / Character**；页脚 Screenplay Museum、CEO 名字、support 邮箱 | 04 |
| 4 | `/app/project/{uuid}/ep_001/script` | 自动建项目，AI 自动开跑 | 一句话直接成为第一条 AI 消息，用户不用再点。面板标题是 AI 起的会话名 "Shanghai subway" | 05、06 |
| 5 | 同上 → `/outline` | AI 先写大纲 | **AI 会自动把视图切到 Outline**，写出 Logline / Synopsis / Story Beats；**自动重命名项目和集**（英文输入，起的是中文名《末班广播》）；新建第 2 集《转移》 | 07 |
| 6 | → `/script` | AI 建实体并写正文 | 先建 4 个角色和 3 个地点，再逐个插入剧本节点；**正在写的节点会高亮**；底部 toast "Success · Done: Write some script (5/6)" 和新手清单联动 | 08 |
| 7 | 同上 | 第 1 轮完成 | AI 总结交付了什么、埋了哪些伏笔，**最后用一个创作问题把方向交还给编剧**；消息下面有 Copy / 👍 / 👎 | 09 |
| 8 | 同上 | 第 2 轮："她会先去找老赵…写完第一集" | 新建地点"三号线调度室"，写第 4、5 场；结尾留钩子 | 10 |
| 9 | 同上 | 第 2 轮完成 | **"6 edits this turn · Undo edit"**：这一轮 AI 的所有改动可以一键撤销 | 11 |
| 10 | 导出弹窗 | 三栏 | ① 集数多选；② 内容：Script / Outline / Beats / Scenes / Storyboard / Casting Sheet / Scout Book / Prop Sheet；③ 格式：PDF / DOCX / TXT / FDX，Hollywood / Asian 排版，纸张纹理开关 | 12 |
| 11 | 新手清单 popover | 6 步 | Talk to the AI → Write an outline → Write some script → Add a character → Add a location → Add a shot；进度条 x/6；全部完成后弹 toast "All six steps done 🎉" | 13 |
| 12 | `/characters` | 角色画布 | 顶部 Tab：Overview / Relationships / Casting；卡片有 Portrait / Advanced 两栏，显示性别、年龄、职业、出场场次、台词数；Edit / Upload / Generate（生成肖像）；无限画布，带缩放工具条；`+ New Character` | 14 |
| 13 | `/ep_001/production` | 制作设置弹窗 | 画幅（16:9 / 9:16，开始后不可改）、制作类型（Narrative / Commercial）、镜头风格、美术风格卡片（带年代标签和参考片名） | 15 |
| 14 | 同上 | 分镜画布 | 顶部按场景分 Tab；镜头卡片的时长 5s / 8s / 10s / 15s；`AI Storyboard`、`Generate Scene`；`+ Add Reel`；侧边导航悬停展开，显示用户名、档位、积分、What's New | 16 |
| 15 | `/app/recents` | 首页 | 导航：New / Recents / Screenwriting / Quick Video (Beta) / Community / Trash / Earn；积分卡 "110 Credits · Upgrade"；"Members can request one feature per day. Invite friends to earn credits."；项目卡片显示 "Edited 6 seconds ago" | 17 |

## 2. 工作区信息架构

```
左侧图标栏（悬停展开）: Writing · Production · Characters·N · Locations·N · Props·N · Worldview · Knowledge · Advisors · Playground
                       ─ Getting started x/6 · Project settings · Back to Home · 用户头像
第二栏: 项目名 [+ 新集] [···]
        Episode Board (N)
        集列表（第 1 集、第 2 集…）
        视图: Script · Outline · Storyboard · Scenes
        Scenes 列表: "1. INT 三号线夜班控制室 · NIGHT" …
        Overall worldview: Logline / Core issue
中间: 文档（纸张纹理）+ 浮动元素工具条:
        Scene · Action · Character · Paren · Dialogue · Transition · Comment · Subtitle
        空态提示: Tab 循环格式 / Enter 在选择器里新建实体 / @ 提及角色
        Outline 视图工具条: Body · T1 · T2 · T3 · Quote · Bold · Italic · Rule；分页 "2 / 2"
右侧栏: Writing [导出][进度][收起]
        Info | Collaboration：协作者头像 + 邀请；Pagination(Minimal/Paged)；Format(Hollywood/Asian)；
        Project Type(Film/Series)；Statistics(Scenes/Words/Characters/Locations/Beats/Shots/Relations)
浮动 AI 面板（可展开到侧边 / 折叠）: 会话名 · New chat · More
        欢迎态：插画 + "Your screenwriting copilot, ready when you are."
        快捷建议 chip：Polish format / Summarize outline（可关闭）
        输入框 "At the artist's command…" + 附件 + Advisors（毕业帽图标）+ 发送 / 停止
```

## 3. Agent 工具集（从工具调用流里观察到）

| 类别 | 工具（UI 文案） |
|---|---|
| 读 | List episodes · Reading worldview · Viewing project info · Reading script outline · Reading script full text · Viewing characters · Viewing locations |
| 写：项目 / 集 | Renaming episode · Updating project info · Creating a new episode |
| 写：大纲 | Updating outline · Replace all |
| 写：实体 | Creating character · Creating location |
| 写：正文 | Inserting script node · Deleting script node |

- 每次工具调用显示为一张卡片：图标 + "动作：对象 — done ✓"，进行中显示转圈
- 工具调用之间穿插简短的旁白（"The shell is clear. Now the epilogue outline, before any script."）
- 一轮结束后有 "N edits this turn · Undo edit"，说明一轮的改动是一个可回滚的事务，大概率是 Loro 的一次 commit 或一组 commit
- **对 AIScript 的要求**：Ancher 的工具在它的服务端执行，不能操作我们本地的 Loro 文档。所以这些"读 / 写剧本"工具要做在**我们这一侧**：让 Ancher 输出结构化指令（JSON patch），由 Mastra 在本地执行并写入 Loro。这一点写进了 spec §5.4。

## 4. 发现的问题（可以做得更好）

1. **输入被重复**：onboarding 输入框的内容在 `/app/new` 里被拼接了两遍，并原样发给了 AI（截图 04，以及会话首条消息）
2. **语言不一致**：英文输入，项目名、正文和 AI 回复都是中文（大概是按账号地区判断的）；AI 进行中的状态还出现过一次日文 "引き中"
3. `/advisors` 直链会被静默重定向回剧本页，没有任何提示（推测是免费档没有权限）
4. 新手清单的 "Add a shot" 在打开 Production 页时就被判定完成了，计数逻辑偏宽松
5. 窄窗口（约 400px）下，AI 面板会盖住主编辑区，没有响应式断点

## 5. 本次没有触达的部分（待验证）

Onboarding 问卷的前几步、Worldview / Knowledge / Playground、Relationships / Casting、协作邀请、导出真实文件、升级和付费流程、Quick Video、Community、Trash、Earn、项目设置、离线状态、额度用尽的状态。
