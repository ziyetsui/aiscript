// Page bodies for both directions; build.mjs wraps each into a complete HTML document.
// Sample project 《胡同小神仙》 is fictional placeholder content written for this prototype. It mirrors the
// client's format (10-min kids' animation, staged director review) without using any client or third-party IP.

const ICONS = {
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14ZM20 17v4H6.5',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v7H2v-7Z',
  layers: 'M12 2 2 7l10 5 10-5ZM2 17l10 5 10-5M2 12l10 5 10-5',
  copy: 'M9 9h12v12H9ZM5 15H3V3h12v2',
  flag: 'M4 22V4s1-1 4-1 5 2 8 2 4-1 4-1v11s-1 1-4 1-5-2-8-2-4 1-4 1',
  export: 'M12 3v12M7 8l5-5 5 5M5 21h14',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z',
  laptop: 'M4 5h16v11H4ZM2 19h20',
  plus: 'M12 5v14M5 12h14',
  image: 'M3 3h18v18H3ZM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M21 15l-5-5L5 21',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  video: 'M3 6h13v12H3ZM16 10l5-3v10l-5-3',
  undo: 'M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8',
  lock: 'M5 11h14v10H5ZM8 11V7a4 4 0 0 1 8 0v4',
  x: 'M18 6 6 18M6 6l12 12',
  check: 'M20 6 9 17l-5-5',
  smile: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  msg: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z',
};
export const icon = (n, s = 16) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;

/* ───────── sample data ───────── */
const PROJECT = '胡同小神仙';
const SCRIPT = [
  ['heading', '外景 胡同口 — 傍晚'],
  ['action', '豆豆蹲在自家门墩儿旁边，盯着脚上开了胶的旧球鞋。鞋头张着嘴，像在笑他。'],
  ['char', '豆豆'], ['dial', '大壮的鞋，一走路就亮灯。'],
  ['char', '门墩儿'], ['paren', '（从石头里探出半个脑袋）'], ['dial', '亮灯算什么。我给你借一双会自己跑的。'],
  ['char', '豆豆'], ['dial', '借？跟谁借？'],
  ['char', '门墩儿'], ['dial', '胡同里那么多老物件，总有一双闲着。'],
  ['action', '门墩儿打了个响指。墙根下，一双落满灰的白球鞋，自己把鞋带系上了。'],
  ['trans', '切至：'],
  ['heading', '外景 学校操场 — 日'],
  ['action', '体育课，五十米跑。豆豆刚站上起跑线，脚下的鞋先窜了出去。'],
  ['char', '大壮'], ['paren', '（目瞪口呆）'], ['dial', '他……他还没听见哨呢！'],
];
export const NEW_SCENE = [
  ['heading', '外景 胡同 — 傍晚'],
  ['action', '鞋拖着豆豆一路跑过修车铺、跑过早点摊，书包在背上一颠一颠。'],
  ['char', '姥爷'], ['dial', '豆豆，慢点儿——'],
  ['char', '豆豆'], ['paren', '（被鞋拖着倒退跑过）'], ['dial', '姥爷，我停不下来！'],
  ['char', '门墩儿'], ['paren', '（追在后面，直喘）'], ['dial', '坏了，我忘了问它——它以前是谁的鞋。'],
];
const cls = { heading: 'sc-heading', action: 'sc-action', char: 'sc-char', paren: 'sc-paren', dial: 'sc-dial', trans: 'sc-trans' };
export const scriptHtml = (nodes) => nodes.map(([t, x]) => `<p class="sc-node ${cls[t]}">${x}</p>`).join('');
const TOOL_STEPS = [['读取项目圣经', '12 条规则'], ['读取已锁定核心', '3 项'], ['读取分场', '第 3 场'], ['查看角色', '豆豆、门墩儿、姥爷'], ['插入剧本节点', '第 3 场']];
const STAGES = ['选题', '故事', '大纲', '分场', '剧本'];
const THEMES = { 品德: '#b5651d', 劳动: '#2f7d6d', 环保: '#4f8a3a', 健康: '#2c6fb0', 爱: '#b23a68', 生命: '#7a5bb5', 成才: '#9a7b1c' };

/* ───────── shared fragments ───────── */
const chrome = (title, inner) => `
<div class="win">
  <div class="titlebar"><div class="lights"><i></i><i></i><i></i></div><div class="title">${title}</div>
    <div class="wincaps"><span>—</span><span>☐</span><span>✕</span></div></div>
  <div class="app">${inner}</div>
</div>
<div class="toast" id="toast"><span></span></div>`;
const theme = (t) => `<span class="chip" style="height:22px;background:color-mix(in oklab, ${THEMES[t]} 14%, transparent);color:color-mix(in oklab, ${THEMES[t]} 72%, var(--ink))">${t}教育</span>`;
const stageBar = (cur, dir) => `<div class="stagebar">${STAGES.map((s, i) => `<span class="st ${i < cur ? 'done' : i === cur ? 'cur' : ''}">${i < cur ? icon('check', 12) : `<i>${i + 1}</i>`}${s}</span>${i < STAGES.length - 1 ? '<span class="st-line"></span>' : ''}`).join('')}</div>`;
const meter = (label, val, max, unit, warn) => `<div class="meter"><div style="display:flex;justify-content:space-between;font-size:12px"><span class="muted">${label}</span><span class="tnum" style="${warn ? 'color:var(--accent)' : ''}">${val.toLocaleString()} / ${max.toLocaleString()} ${unit}</span></div>
  <div class="bar"><i style="width:${Math.min(100, (val / max) * 100)}%"></i></div></div>`;
const SHARED_CSS = `<style>
.stagebar{display:flex;align-items:center;flex-wrap:wrap;gap:6px;row-gap:8px;font-size:12.5px}
.st{display:inline-flex;align-items:center;gap:6px;color:var(--ink-3);white-space:nowrap}
.st i{font-style:normal;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;font-size:11px;box-shadow:inset 0 0 0 1px var(--line-strong)}
.st.done{color:var(--ink-2)} .st.done svg{color:var(--ok)}
.st.cur{color:var(--ink);font-weight:600} .st.cur i{background:var(--accent);color:var(--on-accent);box-shadow:none}
.st-line{width:18px;height:1px;background:var(--line-strong)}
.meter .bar{height:4px;border-radius:2px;background:var(--hover-strong);margin-top:5px}
.meter .bar i{display:block;height:100%;border-radius:2px;background:var(--accent)}
.rule{padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--paper);font-size:13px}
.rule .meta{font-size:11.5px;color:var(--ink-3);margin-top:4px}
.opt{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;box-shadow:inset 0 0 0 1px var(--line-strong);cursor:pointer;transition:box-shadow 160ms ease,transform 160ms var(--ease-out)}
.opt:active{transform:scale(.98)} .opt.on{box-shadow:inset 0 0 0 2px var(--accent)}
.lock{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;padding:8px 10px;border-radius:9px;background:var(--hover)}
.lock svg{flex:none;margin-top:2px;color:var(--accent)}
.cite{padding:10px 12px;border-radius:10px;background:var(--paper);border:1px solid var(--line)}
</style>`;
const navA = (on, items) => `<nav class="nav"><div class="brand" style="padding:4px 10px 14px"><div class="seal">神</div>${PROJECT}</div>
  ${items.map(([ic, t]) => `<a class="${t === on ? 'on' : ''}">${icon(ic)} ${t}</a>`).join('')}<div class="grow"></div>
  <a>${icon('gear')} 团队与设备</a></nav>`;
const NAV_ITEMS = [['book', '项目圣经'], ['inbox', '选题池'], ['layers', '故事工坊'], ['copy', '结构复刻'], ['pen', '剧本'], ['flag', '审稿与规则'], ['globe', '资料台']];
const railB = (on) => `<nav class="rail"><div class="mark" style="margin-bottom:10px"></div>
  ${NAV_ITEMS.map(([ic, t]) => `<button class="${t === on ? 'on' : ''}" title="${t}" aria-label="${t}">${icon(ic, 18)}</button>`).join('')}
  <div class="grow"></div><button title="团队与设备" aria-label="团队与设备">${icon('gear', 18)}</button></nav>`;

/* ═════════ P1 登录与设备上限 ═════════ */
const deviceModal = `
<div class="scrim" id="limit"><div class="modal" role="dialog" aria-labelledby="limit-t" style="padding:22px">
  <div class="display" id="limit-t" style="font-size:18px;margin-bottom:4px">这个账号已绑定 3 台电脑</div>
  <p class="muted" style="margin:0 0 14px">每个账号最多同时登录 3 台电脑。解绑一台后，这台电脑才能登录。本月还可以自助解绑 <b class="tnum">2</b> 次。<br>解绑不会删除任何剧本：项目都保存在团队空间，本地也留有副本。</p>
  <div style="display:flex;flex-direction:column;gap:8px">
    ${[['MacBook Pro · 工作室', 'macOS 15 · 2 分钟前活跃'], ['ThinkPad X1', 'Windows 11 · 3 天前活跃'], ['iMac · 家里', 'macOS 14 · 21 天前活跃']]
      .map(([n, m], i) => `<label class="card" style="display:flex;align-items:center;gap:12px;padding:10px 12px;cursor:pointer">
        <input type="radio" name="dev" ${i === 2 ? 'checked' : ''} style="accent-color:var(--accent)">${icon('laptop', 18)}
        <div style="flex:1"><div style="font-weight:500">${n}</div><div class="muted" style="font-size:12px">${m}</div></div></label>`).join('')}
  </div>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">
    <button class="btn btn-ghost" onclick="closeModal('limit')">取消</button>
    <button class="btn btn-primary" onclick="closeModal('limit');toast('已解绑「iMac · 家里」，本机登录成功')">解绑并登录</button>
  </div></div></div>`;
const loginForm = `
  <div style="display:flex;flex-direction:column;gap:10px">
    <button class="btn btn-ghost" style="height:42px">微信扫码登录</button>
    <div class="muted" style="text-align:center;font-size:12px;margin:4px 0">或使用手机号 / 邮箱验证码</div>
    <input class="input" placeholder="手机号或邮箱" autocomplete="username" spellcheck="false">
    <div style="display:flex;gap:8px"><input class="input" inputmode="numeric" placeholder="6 位验证码" autocomplete="one-time-code"><button class="btn btn-quiet" style="height:40px">获取验证码</button></div>
    <button class="btn btn-primary" style="height:42px;margin-top:4px" onclick="toast('欢迎回来 · 本机占用 2/3 个设备名额')">登录</button>
    <div class="muted" style="font-size:12px;display:flex;align-items:center;gap:6px;margin-top:2px">${icon('laptop', 14)} 不需要 API key、境外账号或充值。团队管理员开通后即可使用。</div>
    <button class="muted" style="font-size:12px;text-decoration:underline;text-underline-offset:3px;align-self:flex-start" onclick="openModal('limit')">演示：在第 4 台电脑上登录</button>
  </div>`;
const p1 = {
  a: () => chrome('AIScript', `
  <div class="main" style="display:grid;grid-template-columns:minmax(360px,440px) 1fr">
    <div style="padding:56px 48px;display:flex;flex-direction:column;justify-content:center;gap:22px;background:var(--surface);border-right:1px solid var(--line)">
      <div class="brand"><div class="seal">剧</div>AIScript</div>
      <div><h1 class="display" style="font-size:34px;margin:0 0 6px;line-height:1.2">把故事写下来。</h1><p class="muted" style="margin:0">剧本始终归你。AI 只在你需要的地方动笔。</p></div>
      ${loginForm}
    </div>
    <div style="display:grid;place-items:center;padding:40px;overflow:hidden">
      <div class="page" style="transform:rotate(-1.2deg);min-height:0;width:420px;padding:44px 48px;font-size:13px">${scriptHtml(SCRIPT.slice(0, 12))}</div>
    </div>
  </div>${deviceModal}`),
  b: () => chrome('AIScript', `
  <div class="main" style="display:grid;place-items:center;background:radial-gradient(600px 400px at 50% 30%, rgba(154,168,255,.12), transparent 70%)">
    <div style="width:380px;display:flex;flex-direction:column;gap:22px">
      <div class="brand" style="justify-content:center"><div class="mark"></div>AIScript</div>
      <div style="text-align:center"><h1 class="display" style="font-size:28px;margin:0 0 6px">夜深了，适合写戏。</h1><p class="muted" style="margin:0">登录后从上次停下的那一场继续。</p></div>
      <div class="card" style="padding:20px">${loginForm}</div>
    </div>
  </div>${deviceModal}`),
};

/* ═════════ P2 项目圣经（Onboarding） ═════════ */
const bibleRules = [
  ['受众', '5–10 岁儿童，正在养成品格的阶段', true], ['时长', '每集 10 分钟，一集一个故事，剧本约 5,000 字', true],
  ['调性', '温暖现实主义 + 奇幻，都市家庭轻喜剧', true], ['背景', '当代北京胡同、三代同堂、家庭和学校生活（不是传统文化讲解）', true],
  ['人物', '门墩儿只有豆豆看得见', true], ['幽默', '笑点来自人物性格和处境，不用摔跤、踩香蕉皮类笑点', false],
  ['价值', '教育意义藏在人物的选择里，结尾不说教', false],
];
const obScript = `<script>
  let step=0; function go(n){step=n;document.querySelectorAll('[data-step]').forEach(el=>el.hidden=+el.dataset.step!==step);
    document.querySelectorAll('[data-dot]').forEach(d=>d.classList.toggle('on',+d.dataset.dot<=step));}
  async function parseDocs(b){b.disabled=true;const o=document.getElementById('parse-out');
    for(const [f,t] of [['创作大纲.docx','42 页 · 抽出 9 个角色、7 大主题'],['第1集 · 范本剧本.docx','5,132 字 · 设为格式范本'],['往期剧本 ×5','26,480 字 · 加入案例库']]){
      const r=document.createElement('div');r.className='tool enter';r.innerHTML='<span class="spin"></span><b>'+f+'</b><span class="muted" style="margin-left:auto">解析中…</span>';o.appendChild(r);
      await wait(600);r.querySelector('.spin').outerHTML='<span class="ok">✓</span>';r.querySelector('.muted').textContent=t;}
    b.textContent='下一步：确认规则';b.disabled=false;b.onclick=()=>go(2);}
  go(0);
</script>`;
const obBody = `
  <section data-step="0" class="enter">
    <h2 class="display" style="font-size:28px;margin:0 0 6px">先告诉我，这是一部什么样的戏</h2><p class="muted" style="margin:0 0 18px">之后的每一步生成都会受这里约束。随时可以改。</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${[['动画剧集', '每集 10 分钟'], ['电影', '90–120 分钟'], ['短剧', '每集 1–3 分钟'], ['其他', '自定义时长']].map(([t, d], i) => `<div class="opt${i === 0 ? ' on' : ''}" onclick="this.parentElement.querySelectorAll('.opt').forEach(o=>o.classList.remove('on'));this.classList.add('on')"><div><div style="font-weight:600">${t}</div><div class="muted" style="font-size:12px">${d}</div></div></div>`).join('')}
    </div>
    <div style="display:flex;gap:10px;margin-top:14px"><input class="input" value="5–10 岁" aria-label="受众"><input class="input" value="计划 520 集" aria-label="集数"></div>
    <button class="btn btn-primary" style="margin-top:18px" onclick="go(1)">下一步</button>
  </section>
  <section data-step="1" class="enter">
    <h2 class="display" style="font-size:28px;margin:0 0 6px">把已有资料丢进来</h2><p class="muted" style="margin:0 0 18px">创作大纲、人物设定、通过的剧本、导演意见截图都可以。AI 会读完，整理成项目圣经。</p>
    <div class="card" style="padding:24px;border-style:dashed;text-align:center;display:flex;flex-direction:column;gap:6px;align-items:center">${icon('inbox', 22)}<b>拖入文件，或点击选择</b><span class="muted" style="font-size:12px">docx / pdf / txt / 图片 / 录音 · 资料只存在团队空间和本机</span></div>
    <div id="parse-out" style="display:flex;flex-direction:column;gap:8px;margin-top:12px"></div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="parseDocs(this)">解析示例资料</button>
  </section>
  <section data-step="2" class="enter">
    <h2 class="display" style="font-size:28px;margin:0 0 6px">这些是我读出来的规则，对吗？</h2><p class="muted" style="margin:0 0 14px"><b>硬规则</b>每次生成都不能违反；<b>偏好</b>会尽量遵守，可以被具体要求覆盖。</p>
    <div style="display:flex;flex-direction:column;gap:6px">${bibleRules.map(([k, v, hard]) => `<div class="rule" style="display:flex;gap:12px;align-items:center"><b style="width:44px;flex:none">${k}</b><span style="flex:1">${v}</span>
      <span class="chip" style="height:22px;cursor:pointer" onclick="this.textContent=this.textContent==='硬规则'?'偏好':'硬规则'">${hard ? '硬规则' : '偏好'}</span></div>`).join('')}</div>
    <div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-ghost">${icon('plus', 14)} 添加规则</button><button class="btn btn-primary" onclick="toast('项目圣经已建立 · 7 条规则 · 1 份范本')">确认，进入选题池</button></div>
  </section>`;
const dots = `<div style="display:flex;gap:6px">${[0, 1, 2].map((i) => `<i data-dot="${i}" class="dot"></i>`).join('')}</div>
<style>.dot{width:22px;height:4px;border-radius:2px;background:var(--line-strong);display:block;transition:background-color 200ms ease}.dot.on{background:var(--accent)}</style>`;
const p2 = {
  a: () => chrome(`新建项目 · ${PROJECT}`, `
  <div class="main" style="display:grid;grid-template-columns:280px 1fr">
    <aside style="background:var(--surface);border-right:1px solid var(--line);padding:40px 28px;display:flex;flex-direction:column;gap:18px">
      <div class="brand"><div class="seal">剧</div>AIScript</div><div class="eyebrow">建立项目圣经</div>
      <ol style="margin:0;padding-left:18px;color:var(--ink-2);line-height:2.2"><li>体裁、时长、受众</li><li>导入已有资料</li><li>确认规则</li></ol>
      <div style="flex:1"></div>${dots}<p class="muted" style="font-size:12px;margin:0">项目圣经就是 AI 的"入职手册"。不用每次重讲项目背景。</p>
    </aside>
    <div style="display:grid;place-items:center;padding:40px;overflow:auto"><div style="width:min(640px,100%)">${obBody}</div></div>
  </div>${obScript}`),
  b: () => chrome(`新建项目 · ${PROJECT}`, `
  <div class="main" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding:40px;background:radial-gradient(700px 420px at 50% 100%, rgba(242,180,92,.08), transparent 70%)">
    ${dots}<div style="width:min(660px,100%)">${obBody}</div>
    <div class="muted" style="font-size:12px">按 <span class="kbd">Enter</span> 继续 · <span class="kbd">Esc</span> 稍后再说</div>
  </div>${obScript}`),
};

/* ═════════ P3 选题池（每日热点 + 批量选题） ═════════ */
const HOT = [['开学季 小学生球鞋攀比', '微博 · 小红书', '品德'], ['小学生午休 偷偷刷短视频', '抖音 · 新闻', '健康'], ['胡同里共享单车乱停', '本地新闻', '劳动']];
const TOPICS = [
  ['全班比谁的球鞋贵', '品德', '热点改编', 0], ['姥爷的修车铺要拆了', '生命', '原创', 0], ['豆豆偷用妈妈手机刷视频', '健康', '热点改编', 0],
  ['胡同来了一只三条腿的猫', '爱', '原创', 0], ['值日变成"雇人值日"', '劳动', '原创', 0], ['垃圾分类小督导上岗', '环保', '原创', 0],
  ['胡同里的京剧脸谱课', '成才', '原创', 1],
];
const topicScript = `<script>
  function keep(b){const c=b.closest('.topic');c.classList.toggle('kept');b.textContent=c.classList.contains('kept')?'已选':'选中';
    document.getElementById('kept').textContent=document.querySelectorAll('.topic.kept').length;}
  function drop(b){const c=b.closest('.topic');const r=prompt('淘汰原因（会记入反例，以后生成时避开）','偏传统文化讲解，不贴近孩子日常');
    if(r!==null){c.classList.add('dropped');c.querySelector('.why').textContent='已淘汰 · '+r;toast('已记为反例 · 团队所有人生成时都会避开');}}
  async function batch(b){b.disabled=true;b.innerHTML='<span class="spin"></span> 生成 20 个…';await wait(1000);b.disabled=false;b.textContent='再来 20 个';toast('新增 20 个选题 · 已按 7 大主题打标签');}
</script><style>.topic{transition:opacity 200ms ease}.topic.kept{box-shadow:inset 0 0 0 2px var(--accent)}.topic.dropped{opacity:.45}</style>`;
const topicCard = ([t, th, src, dropped]) => `<div class="card topic enter ${dropped ? 'dropped' : ''}" style="padding:14px;display:flex;flex-direction:column;gap:8px">
  <div style="display:flex;gap:6px;align-items:center">${theme(th)}<span class="muted" style="font-size:11.5px">${src}</span></div>
  <div style="font-weight:600;font-size:15px">${t}</div>
  <div class="why muted" style="font-size:12px">${dropped ? '已淘汰 · 偏传统文化讲解，不贴近孩子日常' : '冲突：孩子想要 vs 家里给不了 · 有奇幻切入点'}</div>
  ${dropped ? '' : `<div style="display:flex;gap:6px"><button class="btn btn-quiet" style="height:28px;flex:1" onclick="keep(this)">选中</button><button class="btn btn-ghost" style="height:28px" onclick="drop(this)">淘汰</button></div>`}</div>`;
const hotList = HOT.map(([t, s, th]) => `<div class="cite enter" style="display:flex;flex-direction:column;gap:4px"><div style="display:flex;gap:6px;align-items:center">${theme(th)}<span class="muted" style="font-size:11.5px">${s}</span></div>
  <div style="font-weight:500">${t}</div><button class="btn btn-ghost" style="height:26px;align-self:flex-start;font-size:12px" onclick="toast('已转成创意点，加入选题池')">转成创意点</button></div>`).join('');
const p3 = {
  a: () => chrome(`${PROJECT} — 选题池`, `${navA('选题池', NAV_ITEMS)}
  <main class="main" style="padding:28px 36px;display:grid;grid-template-columns:1fr 280px;gap:24px;align-items:start">
    <div><div style="display:flex;align-items:end;gap:12px;margin-bottom:18px"><div style="flex:1"><div class="muted">选题池</div><h1 class="display" style="font-size:26px;margin:2px 0 0">今天挑哪几个往下写？</h1></div>
      <span class="muted">已选 <b id="kept" class="tnum">0</b> / 5</span><button class="btn btn-primary" onclick="batch(this)">${icon('spark', 14)} 批量生成 20 个</button></div>
      <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap"><span class="chip" style="background:var(--accent);color:var(--on-accent)">全部 · 7</span>${Object.keys(THEMES).map((t) => `<span class="chip">${t}</span>`).join('')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px">${TOPICS.map(topicCard).join('')}</div></div>
    <aside class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px;position:sticky;top:0"><div style="display:flex;align-items:center;gap:8px">${icon('globe')}<b style="flex:1">今日热点</b><span class="muted" style="font-size:11.5px">08:00 更新</span></div>
      <p class="muted" style="font-size:12px;margin:0">已按"儿童 · 家庭 · 学校 · 北京"筛过，不是大众热搜榜。</p>${hotList}</aside>
  </main>${topicScript}`),
  b: () => chrome(`${PROJECT} — 选题池`, `${railB('选题池')}
  <main class="main" style="padding:28px 36px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px"><h1 class="display" style="font-size:22px;margin:0;flex:1">选题池</h1><span class="muted">已选 <b id="kept" class="tnum">0</b> / 5</span><button class="btn btn-ghost">${icon('globe', 14)} 热点 · 3</button><button class="btn btn-primary" onclick="batch(this)">批量生成 20 个</button></div>
    <div style="display:flex;flex-direction:column">${TOPICS.map(([t, th, src, dropped]) => `<div class="topic enter ${dropped ? 'dropped' : ''}" style="display:grid;grid-template-columns:90px 1fr 280px 150px;gap:14px;align-items:center;padding:12px 10px;border-top:1px solid var(--line);border-radius:10px">
      ${theme(th)}<div><div style="font-weight:500">${t}</div><div class="muted" style="font-size:12px">${src}</div></div><div class="why muted" style="font-size:12px">${dropped ? '已淘汰 · 偏传统文化讲解' : '冲突：孩子想要 vs 家里给不了'}</div>
      <div style="display:flex;gap:6px;justify-content:flex-end">${dropped ? '<span class="chip">反例</span>' : '<button class="btn btn-quiet" style="height:28px" onclick="keep(this)">选中</button><button class="btn btn-ghost" style="height:28px" onclick="drop(this)">淘汰</button>'}</div></div>`).join('')}</div>
  </main>${topicScript}`),
};

/* ═════════ P4 故事工坊（多走向候选 + 阶段闸门） ═════════ */
const CANDIDATES = [
  ['借来的鞋', 'A1 捷径道具反噬', '门墩儿借来一双会自己跑的旧球鞋。豆豆赢了五十米跑，却怎么也停不下来，被鞋拖着跑遍胡同。最后姥爷认出这是他年轻时的鞋——它只是想再跑一次。豆豆光着脚走回家，第一次觉得旧鞋挺好。', 486, '道具规则被字面执行'],
  ['修鞋摊的一天', 'B1 一日体验', '豆豆被罚去姥爷的修车铺帮一天忙。来修鞋的人有送外卖的叔叔、跳广场舞的奶奶、刚毕业的大姐姐，每双鞋都有自己的路。豆豆把"想要新鞋"的作文改成了"鞋会记住路"。', 452, '旁观者视角的反差'],
  ['一只鞋的旅行', 'C3 物件回望', '豆豆的旧鞋被门墩儿施法开口说话，非要讲它这两年跟着豆豆去过的地方：第一次上学、摔破膝盖、陪姥爷排队挂号……豆豆发现，比鞋贵不贵更重要的是它陪他走过哪儿。', 471, '物件拟人吐槽'],
];
const p4script = `<script>function choose(b){document.querySelectorAll('.cand').forEach(c=>c.classList.remove('chosen'));b.closest('.cand').classList.add('chosen');toast('已选「'+b.dataset.t+'」 · 锁定故事核心后进入大纲');}
async function regen(b){const c=b.closest('.cand');c.style.opacity=.4;await wait(700);c.style.opacity=1;toast('已换一个走向 · 和其他两个的冲突来源不重复');}</script>
<style>.cand{transition:opacity 200ms ease}.cand.chosen{box-shadow:inset 0 0 0 2px var(--accent)}</style>`;
const candCard = ([t, model, body, words, humor], i) => `<article class="card cand enter" style="padding:16px;display:flex;flex-direction:column;gap:10px">
  <div style="display:flex;align-items:center;gap:8px"><span class="chip" style="height:22px">走向 ${'ABC'[i]}</span><b style="flex:1;font-size:16px">${t}</b></div>
  <p style="margin:0;font-size:13.5px;line-height:1.7;color:var(--ink-2)">${body}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px"><div><span class="muted">结构</span><br>${model}</div><div><span class="muted">笑点机制</span><br>${humor}</div></div>
  ${meter('字数', words, 500, '字')}
  <div style="display:flex;gap:6px"><button class="btn btn-primary" style="height:30px;flex:1" data-t="${t}" onclick="choose(this)">选这个</button><button class="btn btn-ghost" style="height:30px" onclick="regen(this)">换一个</button></div></article>`;
const lockedCore = `<div class="eyebrow" style="margin:4px 0 6px">选定后会锁定，下游扩写不能改</div>
  <div class="lock">${icon('lock', 13)}<div><b>故事核心</b><br>鞋是用来走路的，不是用来比的</div></div>
  <div class="lock">${icon('lock', 13)}<div><b>重场戏</b><br>姥爷认出这双鞋是他年轻时的</div></div>
  <div class="lock">${icon('lock', 13)}<div><b>人物动机</b><br>豆豆不是虚荣，是怕被同学看不起</div></div>`;
const p4 = {
  a: () => chrome(`${PROJECT} — 故事工坊`, `${navA('故事工坊', NAV_ITEMS)}
  <main class="main" style="padding:24px 32px">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:6px">${stageBar(1)}<span style="flex:1"></span><button class="btn btn-ghost">${icon('copy', 14)} 用结构模型生成</button></div>
    <h1 class="display" style="font-size:24px;margin:18px 0 4px">「全班比谁的球鞋贵」· 三个不同走向</h1>
    <p class="muted" style="margin:0 0 18px">三个走向的冲突来源和解决方式都不一样，避免"看一个和看十个没区别"。每个约 500 字，起承转合完整。</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr) 260px;gap:16px;align-items:start">${CANDIDATES.map(candCard).join('')}
      <aside class="card" style="padding:14px;display:flex;flex-direction:column;gap:8px">${lockedCore}<div style="height:1px;background:var(--line);margin:6px 0"></div>
        <div class="eyebrow">本次读取</div><div class="muted" style="font-size:12px">项目圣经 7 条 · 导演规则 12 条 · 范例 3 份 · 反例 4 条</div></aside></div>
  </main>${p4script}`),
  b: () => chrome(`${PROJECT} — 故事工坊`, `${railB('故事工坊')}
  <main class="main" style="display:grid;grid-template-columns:1fr 300px">
    <div style="padding:24px 32px;overflow:auto">${stageBar(1)}
      <h1 class="display" style="font-size:20px;margin:20px 0 14px">三个走向 · 全班比谁的球鞋贵</h1>
      <div style="display:flex;flex-direction:column;gap:12px">${CANDIDATES.map(candCard).join('')}</div></div>
    <aside class="inspector">${lockedCore}<div class="eyebrow" style="margin-top:8px">差异度</div>
      ${[['冲突来源', '道具 / 惩罚 / 回忆'], ['解决方式', '认出旧主 / 旁观顿悟 / 物件讲述'], ['主笑点', '失控 / 反差 / 吐槽']].map(([k, v]) => `<div style="font-size:12.5px"><span class="muted">${k}</span><br>${v}</div>`).join('')}</aside>
  </main>${p4script}`),
};

/* ═════════ P5 结构复刻（参考作品 → 模型卡 → 角色映射） ═════════ */
const BEATS = [['日常困境', '主角在学校或家里受挫，3 分钟内立住'], ['奇幻捷径', '奇幻伙伴拿出能"马上解决"的东西'], ['捷径奏效', '主角得意，问题看似解决'], ['失控升级', '捷径被滥用或按字面执行，麻烦越来越大（主要笑点区）'], ['自己收场', '主角靠自己的选择收尾，捷径失效'], ['反转尾巴', '一个小反转，让观众笑着结束']];
const MAP = [['受挫的主角', '豆豆（9 岁，三年级）'], ['带"道具"的奇幻伙伴', '门墩儿（只能借胡同里的老物件）'], ['对手 / 炫耀者', '同桌大壮'], ['严格的家长', '妈妈（护士，总在值夜班）'], ['温和的长辈', '姥爷（修车铺）']];
const p5script = `<script>async function analyze(b){b.disabled=true;const o=document.getElementById('an');o.hidden=true;b.innerHTML='<span class="spin"></span> 解析视频：抽帧、转写、拆节拍…';await wait(1300);o.hidden=false;b.disabled=false;b.textContent='重新解析';}
function apply(){toast('已套用 A1 结构到「全班比谁的球鞋贵」→ 故事工坊');}</script>`;
const libTree = `<div style="font-size:13px;display:flex;flex-direction:column;gap:2px">
  <div class="eyebrow" style="margin-bottom:6px">故事模型库 · 128</div>
  ${[['A 愿望与代价', ['A1 捷径道具反噬', 'A2 愿望成真却变味', 'A3 交换的代价']], ['B 身份与视角', ['B1 一日体验', 'B2 角色互换']], ['C 误会与揭晓', ['C1 谎言滚雪球', 'C3 物件回望']]].map(([g, items]) => `<div style="margin-top:6px;font-weight:600">${g}</div>${items.map((x, i) => `<div style="padding:5px 10px;border-radius:7px;${g.startsWith('A') && i === 0 ? 'background:var(--hover);color:var(--ink)' : 'color:var(--ink-2)'}">${x}</div>`).join('')}`).join('')}</div>`;
const refPanel = `<div class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px">
  <div style="display:flex;gap:8px;align-items:center">${icon('video', 18)}<b style="flex:1">参考作品</b><span class="chip">视频 · 链接 · 剧本</span></div>
  <div style="display:flex;gap:8px"><input class="input" value="经典日式家庭奇幻动画 · 第 1 集（本地视频 22:14）" spellcheck="false"><button class="btn btn-primary" style="height:40px" onclick="analyze(this)">解析</button></div>
  <div class="muted" style="font-size:12px">只抽取结构功能位、节拍和笑点机制。<b>不复用</b>原作的人物、道具、台词和画面。</div></div>`;
const analysis = `<div id="an" style="display:flex;flex-direction:column;gap:14px">
  <section class="card" style="padding:16px"><div style="display:flex;align-items:center;margin-bottom:10px"><b style="flex:1">模型卡 · A1 捷径道具反噬</b><span class="muted" style="font-size:12px">6 拍 · 3 种笑点机制</span></div>
    <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:13px">${BEATS.map(([k, v]) => `<li><b>${k}</b> <span class="muted">— ${v}</span></li>`).join('')}</ol>
    <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">${['道具规则被字面执行', '升级失控', '角色反差'].map((t) => `<span class="chip">${icon('smile', 12)} ${t}</span>`).join('')}</div></section>
  <section class="card" style="padding:16px"><b>功能位 → 我们的人物</b>
    <div style="display:grid;grid-template-columns:1fr 24px 1fr;gap:8px 10px;align-items:center;margin-top:10px;font-size:13px">${MAP.map(([a, b]) => `<div class="muted">${a}</div><div>→</div><div class="opt" style="padding:6px 10px">${b}</div>`).join('')}</div></section>
  <section class="card" style="padding:16px;display:flex;align-items:center;gap:18px">
    <div style="flex:1"><b>原创度检查</b><div class="muted" style="font-size:12px">结构借用是行业惯例；人物、道具、台词必须原创。</div></div>
    ${[['结构', '借用'], ['人物', '0%'], ['道具', '原创'], ['台词', '0%']].map(([k, v]) => `<div style="text-align:center"><div class="muted" style="font-size:11.5px">${k}</div><b class="tnum">${v}</b></div>`).join('')}
    <button class="btn btn-primary" onclick="apply()">套用到选题</button></section></div>`;
const diag = `<div class="card" style="padding:16px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">${icon('pen')}<b style="flex:1">诊断已有剧本 · 第 1 集 v3</b><span class="chip">5,846 字</span></div>
  ${[['高', '主要笑点靠摔跤（第 4、9 场），与导演规则冲突'], ['高', '第 8 场起主题偏到"传统手艺"，偏离当代孩子生活'], ['中', '预计时长约 12 分钟，超出 10 分钟'], ['中', '妈妈两次直接讲道理，结尾说教']].map(([lv, t]) => `<div style="display:flex;gap:8px;font-size:13px;padding:5px 0"><span class="chip" style="height:20px;${lv === '高' ? 'color:var(--accent)' : ''}">${lv}</span>${t}</div>`).join('')}
  <button class="btn btn-ghost" style="height:30px;margin-top:6px" onclick="toast('将保留人物和场景，按 A1 结构重排第 1 集')">按新结构重写</button></div>`;
const p5 = {
  a: () => chrome(`${PROJECT} — 结构复刻`, `${navA('结构复刻', NAV_ITEMS)}
  <main class="main" style="padding:24px 32px;display:grid;grid-template-columns:200px 1fr 300px;gap:20px;align-items:start">
    <aside>${libTree}</aside>
    <div style="display:flex;flex-direction:column;gap:14px"><h1 class="display" style="font-size:24px;margin:0">结构复刻</h1>${refPanel}${analysis}</div>
    <div style="display:flex;flex-direction:column;gap:14px;padding-top:44px">${diag}</div>
  </main>${p5script}`),
  b: () => chrome(`${PROJECT} — 结构复刻`, `${railB('结构复刻')}
  <main class="main" style="display:grid;grid-template-columns:220px 1fr">
    <aside style="padding:20px 14px;border-right:1px solid var(--line);overflow:auto">${libTree}</aside>
    <div style="padding:24px 32px;overflow:auto;display:flex;flex-direction:column;gap:14px"><h1 class="display" style="font-size:20px;margin:0">结构复刻</h1>${refPanel}
      <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:14px;align-items:start">${analysis}${diag}</div></div>
  </main>${p5script}`),
};

/* ═════════ P6 剧本工作区（AI 写作 + 锁定核心 + 护栏 + 幽默候选） ═════════ */
const wsData = `<script>window.NEW_SCENE=${JSON.stringify(NEW_SCENE)};window.TOOL_STEPS=${JSON.stringify(TOOL_STEPS)};
const CLS={heading:'sc-heading',action:'sc-action',char:'sc-char',paren:'sc-paren',dial:'sc-dial',trans:'sc-trans'};</script>`;
const JOKES = [['豆豆路过早点摊被塞了个烧饼，鞋带他绕胡同三圈，烧饼一口没吃上', '重复 + 反差', ''], ['鞋只在有人喊"慢点儿"时加速，全胡同都在喊慢点儿', '规则被字面执行', ''], ['姥爷骑着二八车追上来，鞋认出老主人，乖乖停下', '伏笔回收', ''], ['豆豆摔进煎饼摊，满脸面糊', '摔跤类', '与导演规则「不用摔跤类笑点」冲突']];
const jokesModal = `<div class="scrim" id="jokes"><div class="modal" role="dialog" aria-labelledby="jk" style="padding:20px;width:min(600px,calc(100vw - 32px))">
  <div class="display" id="jk" style="font-size:17px">笑点方案 · 「姥爷，我停不下来！」</div><p class="muted" style="margin:4px 0 12px;font-size:12.5px">标好笑或不好笑都会记进团队的正反例，下次生成会参考。</p>
  <div style="display:flex;flex-direction:column;gap:8px">${JOKES.map(([t, m, warn]) => `<div class="rule" style="display:flex;gap:10px;align-items:center;${warn ? 'opacity:.6' : ''}"><div style="flex:1">${t}<div class="meta">${m}${warn ? ` · <span style="color:var(--accent)">${warn}</span>` : ''}</div></div>
    <button class="btn btn-quiet" style="height:28px" onclick="this.closest('.rule').style.boxShadow='inset 0 0 0 2px var(--ok)';toast('已记为好笑 · 加入正例')">好笑</button><button class="btn btn-ghost" style="height:28px" onclick="this.closest('.rule').style.opacity=.4;toast('已记为不好笑 · 加入反例')">不好笑</button></div>`).join('')}</div>
  <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-ghost" onclick="closeModal('jokes')">完成</button></div></div></div>`;
const guard = `${meter('分场', 15, 15, '场')}${meter('剧本', 3240, 5000, '字')}${meter('预计时长', 6.5, 10, '分钟')}
  <div style="display:flex;align-items:center;gap:6px;font-size:12px"><span class="ok">✓</span> 规则检查 11/12 <button class="muted" style="margin-left:auto;text-decoration:underline;font-size:12px" onclick="toast('第 2 场：大壮的台词有点像成年人')">1 条提醒</button></div>`;
const p6 = {
  a: () => chrome(`${PROJECT} — 第 1 集 · 跑不停的鞋`, `
  <aside class="ws-left">
    <div class="sec"><div class="brand"><div class="seal">神</div>${PROJECT}</div></div>
    <div style="padding:0 12px 8px">${stageBar(4)}</div>
    <div style="padding:0 8px"><div class="item on">第 1 集 · 跑不停的鞋 <small>剧本</small></div><div class="item">第 2 集 · 门墩儿请假 <small>分场</small></div><div class="item">第 3 集 · 雇人值日 <small>故事</small></div></div>
    <div class="sec eyebrow">场景 · 15</div>
    <div style="padding:0 8px" id="scene-list"><div class="item">1. 胡同口 <small>傍晚</small></div><div class="item">2. 学校操场 <small>日</small></div></div>
    <div class="sec eyebrow">护栏</div><div style="padding:0 12px 16px;display:flex;flex-direction:column;gap:10px">${guard}</div>
  </aside>
  <section class="ws-center">
    <div class="ws-toolbar">${['场景', '动作', '角色', '括号', '对白', '转场', '注释'].map((t, i) => `<button class="${i === 1 ? 'on' : ''}">${t}</button>`).join('')}<span style="width:14px"></span><button onclick="openModal('jokes')">${icon('smile', 13)} 笑点方案</button></div>
    <div class="ws-scroll" id="scroll"><article class="page" id="page">${scriptHtml(SCRIPT)}</article></div>
  </section>
  <aside class="ws-right">
    <div class="ai-head">${icon('spark')}<b style="flex:1;font-weight:600">编剧助手</b><span class="chip tnum">团队本月 61%</span></div>
    <div class="ai-body" id="feed">
      <div style="display:flex;flex-direction:column;gap:6px">${lockedCore}</div>
      <div class="muted" style="font-size:13px">按分场第 3 场来写？我会带上锁定的核心和导演规则。写完每一轮都能一键撤销。</div>
    </div>
    <div class="ai-foot">
      <div class="composer"><textarea id="ask">按分场写第 3 场：鞋拖着豆豆跑过胡同。</textarea>
        <div style="display:flex;align-items:center;gap:6px"><button class="chip">${icon('book', 13)} 范本</button><button class="chip">${icon('flag', 13)} 规则 12</button><span style="flex:1"></span>
        <button class="btn btn-primary" id="send" style="height:30px" onclick="run()">发送</button></div></div>
    </div>
  </aside>${jokesModal}${wsData}
<script>
  const feed=document.getElementById('feed'), page=document.getElementById('page'); let inserted=[];
  const add=(html)=>{const d=document.createElement('div');d.className='enter';d.innerHTML=html;feed.appendChild(d);feed.scrollTop=feed.scrollHeight;return d;};
  async function run(){ const q=document.getElementById('ask'); document.getElementById('send').disabled=true;
    add('<div class="msg-user">'+q.value+'</div>'); q.value='';
    for(const [a,b] of TOOL_STEPS){ const t=add('<div class="tool"><span class="spin"></span><span><b>'+a+'</b> · '+b+'</span></div>'); await wait(a==='插入剧本节点'?200:480);
      if(a==='插入剧本节点'){ for(const [ty,x] of NEW_SCENE){ const p=document.createElement('p'); p.className='sc-node writing '+CLS[ty]; p.textContent=x; page.appendChild(p); inserted.push(p); p.scrollIntoView({block:'nearest'}); await wait(240); p.classList.remove('writing'); }
        document.getElementById('scene-list').insertAdjacentHTML('beforeend','<div class="item enter">3. 胡同 <small>傍晚</small></div>'); }
      t.querySelector('.spin').outerHTML='<span class="ok">✓</span>'; }
    add('<div class="narr">第 3 场写好了，386 字。门墩儿最后那句"它以前是谁的鞋"，是给第 6 场姥爷认鞋埋的线。<br><br>"停不下来"这里笑点偏弱，要不要点工具栏的<b>笑点方案</b>看几个备选？</div>');
    add('<div class="turn-bar"><span class="tnum">本轮 '+(inserted.length+1)+' 处修改 · 规则检查通过</span><button class="btn btn-ghost" style="height:26px;padding:0 10px" onclick="undo(this)">'+${JSON.stringify(icon('undo', 13))}+' 撤销</button></div>'); }
  function undo(btn){ inserted.forEach(p=>p.remove()); const n=inserted.length+1; inserted=[]; document.getElementById('scene-list').lastElementChild.remove();
    btn.closest('.turn-bar').innerHTML='<span class="muted">已撤销本轮修改</span>'; toast('已撤销 '+n+' 处修改'); document.getElementById('send').disabled=false; }
</script>`),
  b: () => chrome(`${PROJECT} — 第 1 集 · 跑不停的鞋`, `${railB('剧本')}
  <aside class="scene-rail" id="scenes"><div style="padding:0 6px 12px">${stageBar(4)}</div><div class="eyebrow" style="padding:0 10px 8px">第 1 集 · 15 场</div>
    <a class="s"><b>1. 胡同口</b>外景 · 傍晚 · 198 字</a><a class="s on"><b>2. 学校操场</b>外景 · 日 · 64 字</a></aside>
  <section class="focus">
    <div class="focus-top"><span>${PROJECT} / 第 1 集</span><span style="flex:1"></span><span class="tnum">3,240 / 5,000 字 · 6.5 / 10 分钟</span><span class="chip">● 已同步</span></div>
    <div class="agent-pill" id="pill"><span class="spin"></span><span id="pill-t">读取项目圣经</span></div>
    <div class="focus-scroll" id="scroll"><article class="page" id="page">${scriptHtml(SCRIPT)}</article></div>
    <div class="cmdbar"><div class="row">${icon('spark', 16)}<input id="ask" value="按分场写第 3 场：鞋拖着豆豆跑过胡同。" aria-label="让 AI 做点什么">
      <span class="kbd">⌘K</span><button class="btn btn-primary" id="send" style="height:32px" onclick="run()">生成提案</button></div>
      <div style="display:flex;gap:6px;padding:6px 6px 2px">${['续写下一场', '笑点方案', '检查是否写飘', '收紧对白'].map((t) => `<button class="chip" ${t === '笑点方案' ? `onclick="openModal('jokes')"` : ''}>${t}</button>`).join('')}</div></div>
  </section>
  <aside class="inspector">${lockedCore}<div style="height:1px;background:var(--line);margin:6px 0"></div>${guard}
    <div style="height:1px;background:var(--line);margin:6px 0"></div><div class="eyebrow">Agent</div><div id="steps" style="display:flex;flex-direction:column;gap:8px">
    ${TOOL_STEPS.map(([a, b]) => `<div class="step wait"><span class="ok" style="background:var(--line-strong)">·</span>${a}<span class="muted" style="margin-left:auto">${b}</span></div>`).join('')}</div>
  </aside>${jokesModal}${wsData}
<script>
  const page=document.getElementById('page'), pill=document.getElementById('pill');
  async function run(){ document.getElementById('send').disabled=true; pill.classList.add('show'); const steps=[...document.querySelectorAll('.step')];
    for(let i=0;i<TOOL_STEPS.length;i++){ document.getElementById('pill-t').textContent=TOOL_STEPS[i][0]+' · '+TOOL_STEPS[i][1];
      steps[i].classList.remove('wait'); steps[i].querySelector('.ok').outerHTML='<span class="spin"></span>'; await wait(440); steps[i].querySelector('.spin').outerHTML='<span class="ok">✓</span>'; }
    const box=document.createElement('div'); box.className='proposal enter';
    box.innerHTML=NEW_SCENE.map(([t,x])=>'<p class="sc-node '+CLS[t]+'">'+x+'</p>').join('')+'<div class="proposal-bar"><span class="muted" style="font-size:12px;margin-right:auto">提案 · 第 3 场 · 386 字 · 规则检查通过</span><button class="btn btn-ghost" style="height:28px" onclick="reject(this)">拒绝</button><button class="btn btn-primary" style="height:28px" onclick="accept(this)">接受 <span class=\\'kbd\\' style=\\'color:inherit\\'>⌘↵</span></button></div>';
    page.appendChild(box); box.querySelector('.proposal-bar').scrollIntoView({block:'center'}); pill.classList.remove('show'); }
  function accept(b){ const box=b.closest('.proposal'); box.querySelector('.proposal-bar').remove(); box.classList.remove('proposal');
    document.getElementById('scenes').insertAdjacentHTML('beforeend','<a class="s enter"><b>3. 胡同</b>外景 · 傍晚 · 386 字</a>'); toast('已接受 · 写入第 3 场'); document.getElementById('send').disabled=false; }
  function reject(b){ b.closest('.proposal').remove(); toast('已拒绝提案，剧本没有改动'); document.getElementById('send').disabled=false; }
  document.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();document.getElementById('ask').focus();}
    if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){const a=document.querySelector('.proposal .btn-primary'); if(a) a.click();} });
</script>`),
};

/* ═════════ P7 审稿与规则库 ═════════ */
const PENDING = [['不用摔跤、踩香蕉皮这类笑点', '全剧', '导演截图 · 10/06 · 第 1 集 v2'], ['妈妈不讲大道理，用行动表达关心', '人物 · 妈妈', '会议录音 · 10/05 · 00:12:40']];
const RULES = [['门墩儿只有豆豆看得见', '全剧', '项目圣经', 38, ''], ['结尾不点题、不说教', '全剧', '导演 · 09/28', 21, ''], ['姥爷永远温和', '人物 · 姥爷', '导演 · 09/20', 9, '与「姥爷也会发脾气，但很快心软」(10/03) 冲突'], ['选题贴近孩子日常，不做传统文化讲解', '选题', '反例 × 4', 15, '']];
const reviewScript = `<script>function decide(b,ok){const r=b.closest('.rule');r.style.opacity=ok?1:.45;r.querySelector('.acts').innerHTML=ok?'<span class="chip" style="color:var(--ok)">已入库</span>':'<span class="chip">已驳回</span>';toast(ok?'规则已入库 · 全团队下次生成即生效':'已驳回，不入库');}
async function importShot(b){b.disabled=true;b.innerHTML='<span class="spin"></span> 识别截图…';await wait(900);b.disabled=false;b.textContent='导入截图 / 录音';toast('从截图里识别出 2 条意见 · 待你确认');}</script>`;
const pendingList = PENDING.map(([t, scope, src]) => `<div class="rule enter" style="display:flex;gap:10px;align-items:center"><div style="flex:1"><b style="font-weight:500">${t}</b><div class="meta">适用：${scope} · 来源：${src}</div></div>
  <div class="acts" style="display:flex;gap:6px"><button class="btn btn-ghost" style="height:28px" onclick="decide(this,false)">驳回</button><button class="btn btn-primary" style="height:28px" onclick="decide(this,true)">确认入库</button></div></div>`).join('');
const ruleList = RULES.map(([t, scope, src, hits, conflict]) => `<div class="rule" style="${conflict ? 'border-color:var(--accent)' : ''}"><div style="display:flex;gap:8px"><b style="font-weight:500;flex:1">${t}</b><span class="muted tnum" style="font-size:12px">命中 ${hits} 次</span></div>
  <div class="meta">适用：${scope} · 来源：${src}</div>${conflict ? `<div class="meta" style="color:var(--accent)">⚠ ${conflict}</div>` : ''}</div>`).join('');
const annotated = `<article class="page" style="min-height:0;padding:40px 48px;font-size:13px">
  <p class="sc-node sc-heading">外景 学校操场 — 日</p><p class="sc-node sc-action" style="background:var(--accent-soft);border-radius:3px">体育课，五十米跑。豆豆刚站上起跑线，脚一滑，摔了个四脚朝天。</p>
  <p class="sc-node sc-char">大壮</p><p class="sc-node sc-dial">哈哈哈，豆豆你连站都站不稳！</p></article>`;
const comment = `<div class="card" style="padding:12px;font-size:13px"><div style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><span class="chip" style="height:20px;color:var(--accent)">否决</span><b>总导演</b><span class="muted" style="font-size:11.5px">10/06</span></div>
  又是摔跤。孩子们笑的不是摔，是"没想到"。<div class="muted" style="font-size:12px;margin-top:6px">→ AI 已整理成规则，见右侧"待确认"</div></div>`;
const p7 = {
  a: () => chrome(`${PROJECT} — 审稿与规则`, `${navA('审稿与规则', NAV_ITEMS)}
  <main class="main" style="padding:24px 32px;display:grid;grid-template-columns:1fr 380px;gap:24px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;align-items:center;gap:10px"><h1 class="display" style="font-size:24px;margin:0;flex:1">审稿 · 第 1 集 v2</h1>
      ${['通过', '可改', '否决'].map((t, i) => `<button class="btn ${i === 2 ? 'btn-primary' : 'btn-ghost'}" style="height:30px">${t}</button>`).join('')}</div>
      <div style="display:grid;grid-template-columns:1fr 240px;gap:14px;align-items:start">${annotated}${comment}</div></div>
    <aside style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;align-items:center"><b style="flex:1">待确认 · 2</b><button class="btn btn-ghost" style="height:28px" onclick="importShot(this)">导入截图 / 录音</button></div>${pendingList}
      <div style="display:flex;align-items:center;margin-top:10px"><b style="flex:1">规则库 · 12</b><span class="muted" style="font-size:12px">每次生成全量读取</span></div>${ruleList}</aside>
  </main>${reviewScript}`),
  b: () => chrome(`${PROJECT} — 审稿与规则`, `${railB('审稿与规则')}
  <main class="main" style="display:grid;grid-template-columns:1fr 1fr">
    <div style="padding:24px 28px;border-right:1px solid var(--line);overflow:auto;display:flex;flex-direction:column;gap:12px"><div class="eyebrow">导演意见收件箱</div>
      ${comment}<div class="card" style="padding:12px;font-size:13px"><div style="display:flex;gap:8px;margin-bottom:6px"><span class="chip" style="height:20px">可改</span><b>总导演</b><span class="muted" style="font-size:11.5px">会议录音 00:12:40</span></div>"妈妈别老讲道理，让她做件事。"</div>
      <button class="btn btn-ghost" onclick="importShot(this)">${icon('image', 14)} 导入截图 / 录音 / 飞书消息</button></div>
    <div style="padding:24px 28px;overflow:auto;display:flex;flex-direction:column;gap:10px"><div class="eyebrow">待确认 → 规则库</div>${pendingList}<div class="eyebrow" style="margin-top:10px">规则库 · 12 · 冲突 1</div>${ruleList}</div>
  </main>${reviewScript}`),
};

/* ═════════ P8 资料台（联网 / 视频解析 / 逆向提示词 / 风格反推） ═════════ */
const toolsScript = `<script>
  async function research(btn){ const out=document.getElementById('r-out'); btn.disabled=true; out.innerHTML='<div class="tool"><span class="spin"></span> 搜索：小学生 球鞋 攀比 · 家长 应对</div>'; await wait(1000);
    out.innerHTML=[['开学季童鞋消费调查','某消费类媒体','三成家长表示孩子会因同学的鞋提出购买要求…'],['如何和孩子聊"比较"','儿童心理科普','比起说教，陪孩子做一件具体的事更有效…']]
      .map(([t,s,x],i)=>'<div class="cite enter"><div style="font-weight:500">'+(i+1)+'. '+t+'</div><div class="muted" style="font-size:12px">'+s+'</div><div style="font-size:13px;color:var(--ink-2);margin-top:4px">'+x+'</div></div>').join(''); btn.disabled=false; }
  async function parse(btn){ const out=document.getElementById('p-out'); btn.disabled=true; out.innerHTML='<div class="tool"><span class="spin"></span> 下载、抽帧、语音转写…</div>'; await wait(1100);
    out.innerHTML='<div class="cite enter"><b>已解析 · 22:14</b><div class="muted" style="font-size:12px">转写 3,960 字 · 关键帧 48 张 · 节拍 6 个 · 笑点 9 处</div><button class="btn btn-ghost" style="height:28px;margin-top:6px" onclick="toast(\\'已存入模型库 · A1\\')">存为结构模型</button></div>'; btn.disabled=false; }
  async function style(btn){ const out=document.getElementById('s-out'); btn.disabled=true; out.innerHTML='<div class="tool"><span class="spin"></span> 反推风格…</div>'; await wait(1000);
    out.innerHTML='<div class="cite enter" style="font-size:12.5px;font-family:var(--font-mono);color:var(--ink-2)">台词短，一句一个意思；孩子说大人话制造反差；长辈的幽默来自嘴硬心软；不解释笑点…</div><button class="btn btn-ghost" style="height:28px" onclick="toast(\\'已加入风格库，可和项目范本混合使用\\')">加入风格库</button>'; btn.disabled=false; }
  async function reverse(btn){ const out=document.getElementById('i-out'); btn.disabled=true; out.innerHTML='<div class="tool"><span class="spin"></span> 识别画面…</div>'; await wait(900);
    out.innerHTML='<div class="cite enter"><div class="eyebrow">中文</div><div style="font-size:13px">傍晚的北京胡同，灰砖墙和红门，门口一对石门墩，暖橙色夕光，二维动画风格，柔和描边</div><div class="eyebrow" style="margin-top:8px">English</div><div style="font-size:12.5px;font-family:var(--font-mono);color:var(--ink-2)">Beijing hutong at dusk, grey brick walls and red doors, pair of stone door piers, warm orange sunset light, 2D animation style, soft outlines</div></div>'; btn.disabled=false; }
</script>`;
const toolCard = (ic, title, desc, ctl, outId) => `<section class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px">
  <div style="display:flex;gap:10px;align-items:center">${icon(ic, 18)}<div><div style="font-weight:600">${title}</div><div class="muted" style="font-size:12.5px">${desc}</div></div></div>
  ${ctl}<div id="${outId}" style="display:flex;flex-direction:column;gap:8px"></div></section>`;
const toolCards = [
  toolCard('globe', '联网调研', '在对话里开启联网搜索，结果带来源', `<div style="display:flex;gap:8px"><input class="input" value="现在的小学生会因为什么互相攀比？"><button class="btn btn-primary" style="height:40px" onclick="research(this)">调研</button></div>`, 'r-out'),
  toolCard('video', '视频 / 链接解析', 'B 站、YouTube 链接或本地 MP4：转写、抽帧、拆节拍', `<div style="display:flex;gap:8px"><input class="input" value="本地视频 · 参考第 1 集.mp4" spellcheck="false"><button class="btn btn-primary" style="height:40px" onclick="parse(this)">解析</button></div>`, 'p-out'),
  toolCard('msg', '风格反推', '把一部作品的台词风格反推成写作规则，可以多来源混合', `<div style="display:flex;gap:8px"><input class="input" value="某国产家庭情景喜剧 · 台词风格"><button class="btn btn-primary" style="height:40px" onclick="style(this)">反推</button></div>`, 's-out'),
  toolCard('image', '逆向提示词', '参考图 → 中英文视觉提示词，用于美术和分镜', `<button class="btn btn-ghost" style="height:64px;border-style:dashed" onclick="reverse(this)">${icon('image', 16)} 拖入或点击上传参考图</button>`, 'i-out'),
];
const p8 = {
  a: () => chrome(`${PROJECT} — 资料台`, `${navA('资料台', NAV_ITEMS)}
  <main class="main" style="padding:28px 36px"><h1 class="display" style="font-size:26px;margin:0 0 4px">资料台</h1><p class="muted" style="margin:0 0 20px">这里收进来的资料，团队所有人生成时都能引用。</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;align-items:start">${toolCards.join('')}</div></main>${toolsScript}`),
  b: () => chrome(`${PROJECT} — 资料台`, `${railB('资料台')}
  <main class="main" style="padding:28px 36px;display:grid;grid-template-columns:1fr 280px;gap:22px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:14px"><h1 class="display" style="font-size:20px;margin:0">资料台</h1>${toolCards.join('')}</div>
    <aside class="card" style="padding:16px;position:sticky;top:0"><div class="eyebrow" style="margin-bottom:10px">已收录 · 11</div>
      ${['创作大纲.docx', '第 1 集 · 范本剧本', '往期剧本 × 5', '参考第 1 集 · 视频解析', '风格 · 家庭情景喜剧台词', '导演意见 × 14'].map((t) => `<div style="padding:8px 0;border-top:1px solid var(--line);font-size:13px;color:var(--ink-2)">${t}</div>`).join('')}</aside></main>${toolsScript}`),
};

/* ═════════ P9 版本与导出 ═════════ */
const VERS = [['v4', '今天 14:20', '林 · 编剧', '按导演意见删掉摔跤笑点', '待审'], ['v3', '10/06', '总导演', '否决：笑点老套', '否决'], ['v2', '10/05', 'AI + 林', '分场扩写为剧本', ''], ['v1', '10/03', 'AI', '故事大纲 486 字', '通过']];
const exportScript = `<script>function pick(el){el.parentElement.querySelectorAll('.opt').forEach(o=>o.classList.remove('on'));el.classList.add('on');}
async function doExport(b){b.disabled=true;b.innerHTML='<span class="spin"></span> 正在排版…';await wait(900);b.disabled=false;b.textContent='导出';toast('已导出 第1集-跑不停的鞋-v4.docx · 按范本格式');}</script>`;
const opts = (arr, on = 0) => arr.map((t, i) => `<div class="opt${i === on ? ' on' : ''}" onclick="pick(this)">${t}</div>`).join('');
const versList = VERS.map(([v, t, who, note, st], i) => `<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--line)"><b class="tnum" style="width:28px">${v}</b>
  <div style="flex:1"><div style="font-size:13px">${note}</div><div class="muted" style="font-size:12px">${t} · ${who}</div></div>${st ? `<span class="chip" style="height:22px;${st === '否决' ? 'color:var(--accent)' : st === '通过' ? 'color:var(--ok)' : ''}">${st}</span>` : ''}
  ${i === 0 ? `<button class="btn btn-ghost" style="height:28px" onclick="toast('导演通过后，可一键升格为团队范例')">升格为范例</button>` : `<button class="btn btn-quiet" style="height:28px">对比</button>`}</div>`).join('');
const p9 = {
  a: () => chrome(`${PROJECT} — 版本与导出`, `${navA('剧本', NAV_ITEMS)}
  <main class="main" style="padding:28px 36px;display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:start">
    <section class="card" style="padding:18px"><h1 class="display" style="font-size:22px;margin:0 0 4px">第 1 集 · 版本</h1><p class="muted" style="margin:0 0 8px;font-size:12.5px">每次审稿和 AI 修改都会留一个版本。不会丢，也随时可以回到任何一版。</p>${versList}</section>
    <section class="card" style="padding:18px;display:flex;flex-direction:column;gap:10px"><b>导出</b>
      <div class="eyebrow">格式</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${opts(['Word (.docx)', 'PDF', 'Final Draft', '纯文本'])}</div>
      <div class="eyebrow">版式</div><div style="display:flex;flex-direction:column;gap:8px">${opts(['按项目范本（第 1 集）', '标准中文剧本', '好莱坞格式'])}</div>
      <div class="eyebrow">内容</div><div style="display:flex;flex-direction:column;gap:8px">${opts(['剧本', '故事 + 大纲 + 分场 + 剧本（全阶段）', '整季打包（含规则库）'])}</div>
      <button class="btn btn-primary" style="margin-top:6px" onclick="doExport(this)">导出</button></section>
  </main>${exportScript}`),
  b: () => chrome(`${PROJECT} — 版本对比`, `${railB('剧本')}
  <main class="main" style="display:grid;grid-template-columns:1fr 1fr 300px">
    ${[['v3 · 被否决', [['action', '体育课，五十米跑。豆豆刚站上起跑线，脚一滑，摔了个四脚朝天。'], ['char', '大壮'], ['dial', '哈哈哈，豆豆你连站都站不稳！']], 'rgba(255,107,107,.08)'], ['v4 · 待审', [['action', '体育课，五十米跑。豆豆刚站上起跑线，脚下的鞋先窜了出去。'], ['char', '大壮'], ['paren', '（目瞪口呆）'], ['dial', '他……他还没听见哨呢！']], 'rgba(79,181,122,.08)']].map(([t, nodes, bg]) => `<div style="padding:24px;border-right:1px solid var(--line);overflow:auto"><div class="eyebrow" style="margin-bottom:12px">${t}</div><div class="page" style="width:auto;background:${bg};padding:16px;border-radius:10px">${scriptHtml(nodes)}</div></div>`).join('')}
    <aside class="inspector"><div class="eyebrow">版本</div>${versList}<div style="height:1px;background:var(--line);margin:6px 0"></div><div class="eyebrow">导出</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${opts(['DOCX', 'PDF', 'FDX', 'TXT'])}</div><button class="btn btn-primary" onclick="doExport(this)">按范本格式导出</button></aside>
  </main>${exportScript}`),
};

/* ═════════ P10 团队、设备与用量 ═════════ */
const MEMBERS = [['总导演', '审稿 · 规则确认', 2, 3, 0.4], ['林（核心编剧）', '全部项目', 3, 3, 2.1], ['周（核心编剧）', '全部项目', 2, 3, 1.6], ['外地编剧 × 12', '仅分配的集 · 只读规则', 14, 36, 4.8]];
const usage = [12, 30, 18, 44, 26, 52, 38, 61, 20, 35, 48, 57, 40, 66];
const bars = `<div style="display:flex;align-items:flex-end;gap:6px;height:110px">${usage.map((v, i) => `<div title="${v}" style="flex:1;height:${(v / 66) * 100}%;border-radius:3px 3px 0 0;background:${i === usage.length - 1 ? 'var(--accent)' : 'var(--hover-strong)'}"></div>`).join('')}</div>`;
const memberRows = MEMBERS.map(([n, role, d, max, tok]) => `<div style="display:grid;grid-template-columns:1.4fr 1.4fr 90px 90px;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--line);font-size:13px">
  <b style="font-weight:500">${n}</b><span class="muted">${role}</span><span class="tnum">${icon('laptop', 13)} ${d}/${max}</span><span class="tnum" style="text-align:right">${tok}M tokens</span></div>`).join('');
const devRows = [['MacBook Pro · 工作室', 'macOS 15.1 · 本机', '刚刚', true], ['ThinkPad X1', 'Windows 11', '3 天前', false]].map(([n, m, t, me]) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)">${icon('laptop', 18)}
  <div style="flex:1"><div style="font-weight:500;font-size:13px">${n}${me ? ' <span class="chip" style="height:20px">本机</span>' : ''}</div><div class="muted" style="font-size:12px">${m} · ${t}活跃</div></div>
  ${me ? '' : `<button class="btn btn-ghost" style="height:28px" onclick="this.closest('div').remove();document.getElementById('slots').textContent='1 / 3';toast('已解绑 ThinkPad X1 · 它的本地副本保留，但不能再同步')">解绑</button>`}</div>`).join('');
const p10 = {
  a: () => chrome('AIScript — 团队与设备', `${navA('', NAV_ITEMS)}
  <main class="main" style="padding:28px 36px;max-width:980px">
    <h1 class="display" style="font-size:26px;margin:0 0 20px">团队与设备</h1>
    <section class="card" style="padding:18px 20px;margin-bottom:16px"><div style="display:flex;align-items:baseline"><b style="flex:1">成员 · 15</b><span class="muted" style="font-size:12.5px">每个成员最多 3 台电脑</span></div>${memberRows}</section>
    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:16px">
      <section class="card" style="padding:18px 20px"><div style="display:flex;margin-bottom:12px"><b style="flex:1">近 14 天用量</b><span class="muted tnum" style="font-size:12.5px">8.9M tokens · ¥ 214</span></div>${bars}
        <div class="muted" style="font-size:12px;margin-top:10px">按成员、按功能统计；数据来自服务端账本，可导出 CSV。</div></section>
      <section class="card" style="padding:18px 20px"><div style="display:flex"><b style="flex:1">我的电脑</b><span class="tnum muted" id="slots">2 / 3</span></div>${devRows}</section></div>
  </main>`),
  b: () => chrome('AIScript — 团队与设备', `${railB('')}
  <main class="main" style="padding:28px 36px">
    <h1 class="display" style="font-size:22px;margin:0 0 18px">团队</h1>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px">${[['本月 tokens', '8.9M', ''], ['费用', '¥214', '估算'], ['成员', '15', ''], ['我的设备', '2', '/ 3']].map(([k, v, s]) => `<div class="card" style="padding:16px"><div class="muted" style="font-size:12px">${k}</div><div class="tnum display" style="font-size:24px">${v} <span class="muted" style="font-size:12px;font-weight:400">${s}</span></div></div>`).join('')}</div>
    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px">
      <section class="card" style="padding:18px"><div class="eyebrow" style="margin-bottom:6px">成员</div>${memberRows}</section>
      <section class="card" style="padding:18px"><div class="eyebrow" style="margin-bottom:12px">近 14 天</div>${bars}<div style="display:flex;margin-top:14px"><div class="eyebrow" style="flex:1">我的电脑</div><span class="tnum muted" id="slots">2 / 3</span></div>${devRows}</section></div>
  </main>`),
};

export const PAGES = [
  { id: 'p1', name: '登录与设备上限', ...p1 },
  { id: 'p2', name: '项目圣经（Onboarding）', ...p2 },
  { id: 'p3', name: '选题池 · 每日热点', ...p3 },
  { id: 'p4', name: '故事工坊 · 多走向', ...p4 },
  { id: 'p5', name: '结构复刻 · 换成自己的人物', ...p5 },
  { id: 'p6', name: '剧本工作区 · AI 写作', ...p6 },
  { id: 'p7', name: '审稿与规则库', ...p7 },
  { id: 'p8', name: '资料台 · 联网 / 解析 / 反推', ...p8 },
  { id: 'p9', name: '版本与导出', ...p9 },
  { id: 'p10', name: '团队、设备与用量', ...p10 },
];
export const DIRECTIONS = {
  a: { name: 'A · Studio Paper', note: '纸感专业：AI 在右侧栏，直接写入，按轮撤销' },
  b: { name: 'B · Night Desk', note: '暗色沉浸：⌘K 指令条，AI 先出提案，接受后写入' },
};
export { SHARED_CSS };
