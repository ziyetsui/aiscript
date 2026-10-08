// v2 pages — interaction follows laper.ai as walked through on 2026-10-08 (docs/research/laper-walkthrough.md).
// Copy is localised; the sample story is original placeholder content. Our only additions: the device
// limit (P1) and the devices & usage page (P8). The reference-structure rewrite is offered as a chat suggestion.

const I = {
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z', film: 'M3 3h18v18H3ZM7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  map: 'M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11ZM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4', box: 'M21 8 12 3 3 8v8l9 5 9-5ZM3 8l9 5 9-5M12 13v8',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18', book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14ZM20 17v4H6.5',
  cap: 'M22 10 12 5 2 10l10 5 10-5ZM6 12v5c3 2 9 2 12 0v-5', flask: 'M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  home: 'M3 10.5 12 3l9 7.5V21H3ZM9 21v-6h6v6', plus: 'M12 5v14M5 12h14', export: 'M12 3v12M7 8l5-5 5 5M5 21h14',
  chart: 'M3 3v18h18M7 15v3M12 10v8M17 6v12', panel: 'M3 3h18v18H3ZM15 3v18', laptop: 'M4 5h16v11H4ZM2 19h20',
  doc: 'M14 3H6v18h12V7ZM14 3v4h4', video: 'M3 6h13v12H3ZM16 10l5-3v10l-5-3', send: 'M12 19V5M5 12l7-7 7 7', stop: 'M7 7h10v10H7Z',
  x: 'M18 6 6 18M6 6l12 12', chev: 'm6 9 6 6 6-6', menu: 'M4 6h16M4 12h16M4 18h16', expand: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z', copy: 'M9 9h12v12H9ZM5 15H3V3h12v2', up: 'M7 10v11M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 18.4 21H7V10l4-8a3 3 0 0 1 4 3.9Z',
  down: 'M17 14V3M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-7A2 2 0 0 1 5.6 3H17v11l-4 8a3 3 0 0 1-4-3.9Z', undo: 'M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6', trash: 'M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15', check: 'M20 6 9 17l-5-5',
  upload: 'M12 15V3M7 8l5-5 5 5M4 21h16', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z', zoom: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3M8 11h6M11 8v6',
  gift: 'M20 12v9H4v-9M2 7h20v5H2ZM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z',
  bulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z', indent: 'M3 8l4 4-4 4M11 6h10M11 12h10M11 18h10',
};
const icon = (n, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${I[n]}"/></svg>`;
const chrome = (title, inner, extra = '') => `
<div class="win"><div class="titlebar"><div class="lights"><i></i><i></i><i></i></div><div class="title">${title}</div><div class="wincaps"><span>—</span><span>☐</span><span>✕</span></div></div>
<div class="app">${inner}</div></div>${extra}<div class="toast" id="toast"><span></span></div>`;
const IDEA = '胡同里的小男孩豆豆发现，自家门口的石门墩里住着一个只有他看得见的小精灵。';

/* ── story data（原创示例） ── */
const SCRIPT1 = [ // turn 1 · scenes 1–3
  ['heading', '外景 胡同口 — 傍晚'], ['action', '豆豆蹲在自家门墩儿旁边，用手把开了胶的鞋头捏上，一松手，又张开了。'],
  ['char', '门墩儿'], ['paren', '（从石头里探出半个脑袋）'], ['dial', '别捏了，它要说话你也拦不住。'],
  ['char', '豆豆'], ['paren', '（吓得往后一坐）'], ['dial', '石头……石头说话了？'],
  ['char', '门墩儿'], ['dial', '在这儿蹲了一百多年，头一回有人看得见我。'],
  ['heading', '内景 豆豆家 — 夜'], ['action', '饭桌上，姥爷剥着毛豆。豆豆扒拉着米饭，眼睛一直往门口瞟。'],
  ['char', '姥爷'], ['dial', '看什么呢？门墩儿又跑不了。'],
  ['char', '豆豆'], ['paren', '（小声）'], ['dial', '那可说不准。'],
  ['heading', '外景 学校操场 — 日'], ['action', '课间。一圈脑袋围着大壮的脚。他跺一下，鞋底亮一圈彩灯。'],
  ['char', '大壮'], ['dial', '充一次电，能亮一个礼拜。'],
  ['action', '豆豆把脚往身后缩。书包侧兜里，一小块石头碎屑悄悄动了一下。'],
];
const SCRIPT2 = [ // turn 2 · scenes 4–5
  ['heading', '外景 胡同口 — 傍晚'], ['char', '豆豆'], ['dial', '你能不能……给我变一双会亮灯的鞋？'],
  ['char', '门墩儿'], ['dial', '变不了。借倒是能借——胡同里那么多老物件，总有一双闲着。'],
  ['action', '门墩儿打了个响指。墙根下，一双落满灰的白球鞋，自己把鞋带系上了。'],
  ['heading', '内景 姥爷修车铺 — 夜'], ['action', '姥爷拿起那只鞋，翻过来。鞋底刻着一个歪歪扭扭的"建"字。'],
  ['char', '姥爷'], ['paren', '（愣住）'], ['dial', '这鞋……你从哪儿拿的？'],
  ['action', '豆豆张了张嘴。门外，门墩儿把脑袋缩回了石头里。'],
];
const OUTLINE = `<h2>门墩儿</h2><div class="muted tnum">10/08/26</div>
  <h3>一句话</h3><p>豆豆发现门墩儿里住着小精灵；小精灵能"借"来胡同里的老物件，可每一件都有它原来的主人。</p>
  <h3>梗概</h3><p>第一集，豆豆认识了门墩儿，也第一次在同学面前觉得自己的旧鞋丢人。门墩儿借来一双会自己跑的老球鞋——鞋底刻着姥爷小时候的名字。</p>
  <p>第二集，借来的东西开始"想家"。豆豆得在还回去之前，弄明白它们原来属于谁。</p>
  <h3>故事节拍</h3><p>开场：门墩儿说话了。<br>催化：大壮的亮灯鞋。<br>两难：借来的鞋，要不要还？</p>`;
const CHARS = [['豆豆', '男 · 9 岁 · 三年级学生', '胆小，心细，只有他看得见门墩儿。', 'var(--color-b2-500)', 5, 12], ['门墩儿', '精灵 · 一百多岁 · 石门墩', '嘴硬心软，能"借"不能"变"。', 'var(--color-b1-500)', 4, 9], ['姥爷', '男 · 68 岁 · 修车铺', '话少，手巧，记得胡同每一样东西。', 'var(--color-b4-600)', 2, 4], ['大壮', '男 · 9 岁 · 同学', '爱显摆，其实很怕输。', 'var(--color-b5-500)', 1, 1]];
const LOCS = [['胡同口', '傍晚'], ['豆豆家', '夜'], ['学校操场', '日']];

/* ═════ P1 登录（laper：左表单右插画）+ 我们的设备上限 ═════ */
const deviceModal = `<div class="scrim" id="limit"><div class="modal" role="dialog" aria-labelledby="lt" style="padding:22px">
  <div class="display" id="lt" style="font-size:20px;margin-bottom:4px">这个账号已绑定 3 台电脑</div>
  <p class="muted" style="margin:0 0 14px;font-size:13px">每个账号最多同时登录 3 台电脑。解绑一台后，这台电脑才能登录。本月还可以自助解绑 <b class="tnum">2</b> 次，解绑不会删除任何剧本。</p>
  <div style="display:flex;flex-direction:column;gap:8px">${[['MacBook Pro · 工作室', 'macOS 15 · 2 分钟前活跃'], ['ThinkPad X1', 'Windows 11 · 3 天前活跃'], ['iMac · 家里', 'macOS 14 · 21 天前活跃']].map(([n, m], i) => `
    <label class="card" style="display:flex;align-items:center;gap:12px;padding:10px 12px;cursor:pointer"><input type="radio" name="dev" ${i === 2 ? 'checked' : ''} style="accent-color:var(--primary)">${icon('laptop', 18)}<div style="flex:1"><div style="font-weight:600">${n}</div><div class="muted" style="font-size:12px">${m}</div></div></label>`).join('')}</div>
  <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px"><button class="btn btn-ghost" onclick="closeModal('limit')">取消</button><button class="btn btn-primary" onclick="closeModal('limit');toast('已解绑「iMac · 家里」，本机登录成功')">解绑并登录</button></div></div></div>`;
const p1 = () => chrome('AIScript', `
  <div style="flex:1;display:grid;grid-template-columns:minmax(380px,0.9fr) 1.1fr;gap:16px;padding:16px">
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px">
      <div style="text-align:center"><h1 class="display" style="font-size:44px;line-height:1.08;margin:0 0 8px">把故事<br>写下来</h1><p class="muted" style="margin:0">放大你创造力的工具</p></div>
      <div class="card" style="width:min(360px,100%);padding:18px;display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-ghost" style="height:40px">使用 Google 继续</button><button class="btn btn-ghost" style="height:40px">使用微信继续</button>
        <div class="muted" style="text-align:center;font-size:12px">或</div>
        <input class="input" type="email" placeholder="邮箱" autocomplete="email" spellcheck="false">
        <input class="input" type="password" placeholder="密码" autocomplete="current-password">
        <button class="muted" style="font-size:12px;align-self:flex-end">忘记密码？</button>
        <div style="display:flex;align-items:center;gap:10px;height:56px;padding:0 12px;border:1px solid var(--line-strong);border-radius:var(--r-sm);font-size:13px"><input type="checkbox" style="width:18px;height:18px;accent-color:var(--primary)"> 确认您是真人<span style="flex:1"></span><span class="muted" style="font-size:10px">人机验证</span></div>
        <button class="btn btn-primary" style="height:40px" onclick="toast('登录成功 · 本机占用 2/3 个设备名额')">登录</button>
        <div class="muted" style="font-size:12px;text-align:center">还没有账号？<b style="color:var(--ink)">注册</b></div>
        <button class="muted" style="font-size:11.5px;text-decoration:underline;text-underline-offset:3px" onclick="openModal('limit')">演示：在第 4 台电脑上登录</button>
      </div>
      <div class="muted" style="font-size:11px">继续即表示你同意服务条款和隐私政策</div>
    </div>
    <div style="border-radius:var(--r-xl);overflow:hidden;background:radial-gradient(80% 70% at 30% 30%, var(--primary-soft), transparent 70%),radial-gradient(60% 60% at 80% 80%, var(--hl), transparent 70%),var(--muted);display:grid;place-items:center">
      <div class="page" style="min-height:0;width:380px;padding:36px 40px;transform:rotate(-2deg);box-shadow:var(--shadow-pop)">${nodes(SCRIPT1.slice(0, 11))}</div></div>
  </div>`, deviceModal);

/* ═════ P2 Onboarding（laper：一句话 + 添加文件 + 类型） ═════ */
const p2 = () => chrome('AIScript', `
  <div style="flex:1;position:relative;display:grid;place-items:center;overflow:hidden">
    <div aria-hidden="true" style="position:absolute;inset:-20%;background:radial-gradient(22% 30% at 25% 70%, var(--primary-soft), transparent 70%),radial-gradient(18% 26% at 75% 25%, var(--hl), transparent 70%),radial-gradient(20% 22% at 60% 85%, var(--primary-soft), transparent 70%);filter:blur(40px)"></div>
    <button class="chip" style="position:absolute;top:14px;right:16px">中 / EN</button>
    <div style="position:relative;width:min(620px,calc(100% - 48px));display:flex;flex-direction:column;gap:24px;align-items:center">
      <h1 style="font-size:30px;font-weight:400;margin:0;text-align:center">最后——哪个故事一直在你心里？</h1>
      <div class="card" style="width:100%;padding:16px 16px 12px;box-shadow:var(--shadow-pop)">
        <textarea id="idea" style="width:100%;min-height:72px;border:0;outline:none;resize:none;background:transparent;font-size:17px" placeholder="用一句话描述你的故事，你的旅程就从这里开始……"></textarea>
        <div style="display:flex;gap:8px;align-items:center;position:relative">
          <button class="btn btn-ghost" style="height:32px">${icon('plus', 14)} 添加文件</button>
          <button class="btn btn-ghost" style="height:32px" id="type-btn" onclick="document.getElementById('menu').hidden=!document.getElementById('menu').hidden">${icon('doc', 14)} <span id="type">剧本</span> ${icon('chev', 13)}</button>
          <div id="menu" class="card" hidden style="position:absolute;left:110px;top:38px;padding:4px;min-width:150px;box-shadow:var(--shadow-pop);transform-origin:top left">
            ${[['doc', '剧本'], ['video', '快速视频']].map(([ic, t]) => `<button class="btn" style="width:100%;justify-content:flex-start;font-weight:500" onclick="document.getElementById('type').textContent='${t}';document.getElementById('menu').hidden=true">${icon(ic, 14)} ${t}</button>`).join('')}</div>
          <span style="flex:1"></span><button class="btn btn-primary" style="width:38px;height:38px;padding:0;border-radius:50%" aria-label="开始创作" onclick="go(this)">${icon('send', 17)}</button></div>
      </div>
      <div id="status" class="muted" style="font-size:13px;min-height:20px"></div>
    </div></div>
  <script>const idea=document.getElementById('idea'); idea.value=${JSON.stringify(IDEA)};
  async function go(b){b.disabled=true;const s=document.getElementById('status');s.innerHTML='<span style="display:inline-flex;gap:8px;align-items:center"><span class="spin"></span>正在创建项目，AI 会马上开始……</span>';await wait(1100);s.textContent='→ 跳转到工作区（见第 04 页，AI 自动开跑）';b.disabled=false;}</script>`);

/* ═════ P3 创作首页（laper /app/new） ═════ */
const p3 = () => chrome('AIScript', `
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;padding:14px 18px;position:relative">
    <div style="align-self:stretch;display:flex;justify-content:space-between;align-items:center"><button class="btn btn-quiet" style="width:34px;padding:0" aria-label="菜单">${icon('menu', 16)}</button><span class="chip" style="height:30px">免费版 · <b style="color:var(--primary)">升级</b></span></div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;width:min(640px,100%)">
      <div style="display:flex;align-items:center;gap:12px"><div class="logo" style="margin:0;width:36px;height:36px;font-size:16px">剧</div><h1 class="display" style="font-size:28px;margin:0">下午好，林</h1></div>
      <div class="card" style="padding:14px;box-shadow:var(--shadow-pop)"><textarea style="width:100%;min-height:70px;border:0;outline:none;resize:none;background:transparent;font-size:16px" placeholder="写点什么，或者说说你想写的故事……"></textarea>
        <div style="display:flex;gap:8px;align-items:center"><button class="btn btn-ghost" style="height:30px">${icon('plus', 13)} 添加文件</button><button class="btn btn-ghost" style="height:30px">${icon('doc', 13)} 剧本 ${icon('chev', 12)}</button><span style="flex:1"></span><button class="btn btn-primary" style="width:34px;height:34px;padding:0;border-radius:50%" aria-label="发送">${icon('send', 15)}</button></div></div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">${[['indent', '格式'], ['bulb', '灵感'], ['pen', '写作'], ['film', '情节'], ['user', '角色']].map(([ic, t]) => `<button class="btn btn-ghost" style="height:32px">${icon(ic, 14)} ${t}</button>`).join('')}</div>
    </div>
    <div class="muted" style="font-size:11.5px;display:flex;gap:16px">AIScript · 剧本博物馆 · support@aiscript.app · 服务条款 · 隐私政策</div>
  </div>`);

/* ═════ P4 工作区（laper 主流程：AI 自动开跑） ═════ */
function nodes(list) {
  const cls = { heading: 'sc-heading', action: 'sc-action', char: 'sc-char', paren: 'sc-paren', dial: 'sc-dial', trans: 'sc-trans' };
  return list.map(([t, x]) => `<p class="sc-node ${cls[t]}">${x}</p>`).join('');
}
const RAIL = [['pen', '写作'], ['film', '制作'], ['users', '角色', 'c-chars'], ['map', '地点', 'c-locs'], ['box', '道具'], ['globe', '世界观'], ['book', '知识库'], ['cap', '顾问'], ['flask', '实验场']];
const rail = (on) => `<nav class="rail" aria-label="项目导航"><div class="logo">剧</div>
  ${RAIL.map(([ic, t, id]) => `<button class="${t === on ? 'on' : ''}" title="${t}" aria-label="${t}" style="position:relative">${icon(ic, 17)}${id ? `<i id="${id}" class="tnum" style="position:absolute;right:-2px;top:-2px;font-style:normal;font-size:9.5px;min-width:15px;height:15px;border-radius:8px;background:var(--ink);color:var(--bg);display:grid;place-items:center">${t === '角色' ? (on === '角色' ? 4 : 0) : (on === '角色' ? 3 : 0)}</i>` : ''}</button>`).join('')}
  <div class="grow"></div>
  <button title="新手任务" aria-label="新手任务" onclick="typeof gs==='function'&&gs()" style="position:relative"><svg width="22" height="22" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--line-strong)" stroke-width="4"/><circle id="ring" cx="18" cy="18" r="15" fill="none" stroke="var(--primary)" stroke-width="4" stroke-dasharray="94.2" stroke-dashoffset="${on === '角色' ? 0 : 94.2}" transform="rotate(-90 18 18)" style="transition:stroke-dashoffset 400ms var(--ease-out)"/></svg></button>
  <button title="项目设置" aria-label="项目设置">${icon('gear', 17)}</button><button title="返回首页" aria-label="返回首页">${icon('home', 17)}</button>
  <div style="width:26px;height:26px;border-radius:50%;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center;font-size:11px;font-weight:700;margin-top:4px">林</div></nav>`;
const gsPopover = `<div id="gs" class="card" hidden style="position:fixed;left:62px;bottom:120px;width:260px;padding:14px;z-index:20;box-shadow:var(--shadow-pop);transform-origin:bottom left">
  <div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:8px">新手任务 <span class="tnum muted" id="gs-n">0 / 6</span></div>
  <div style="height:5px;border-radius:3px;background:var(--muted);margin-bottom:10px"><div id="gs-bar" style="height:100%;width:0;border-radius:3px;background:var(--primary);transition:width 400ms var(--ease-out)"></div></div>
  ${['和 AI 聊聊', '写一份大纲', '写一些剧本', '添加一个角色', '添加一个地点', '添加一个镜头'].map((t, i) => `<div class="gs-i" data-i="${i}" style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px"><span class="gs-c" style="width:16px;height:16px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--line-strong);display:grid;place-items:center;font-size:9px"></span><span class="gs-t">${t}</span></div>`).join('')}</div>`;
const exportModal = `<div class="scrim" id="export"><div class="modal" style="padding:20px;width:min(780px,calc(100vw - 32px))">
  <div style="display:flex;align-items:center;margin-bottom:2px"><b class="display" style="font-size:22px;flex:1">导出</b><button class="btn btn-quiet" style="width:30px;padding:0;border-radius:50%" onclick="closeModal('export')" aria-label="关闭">${icon('x', 14)}</button></div>
  <div class="muted" style="font-size:12px;margin-bottom:14px">已选 2 集 · 全部分集</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
    <div style="background:var(--muted);border-radius:var(--r-xl);padding:12px"><div style="display:flex;justify-content:space-between;font-weight:600;font-size:13px;margin-bottom:8px">分集 <span class="muted" style="font-weight:400;font-size:12px">清空</span></div>
      ${[['门墩儿', '第 1 集'], ['借来的东西', '第 2 集']].map(([t, s]) => `<label class="card" style="display:flex;align-items:center;padding:10px;margin-bottom:6px;font-size:13px"><span style="flex:1"><b>${t}</b><br><span class="muted" style="font-size:11px">${s}</span></span><input type="checkbox" checked style="accent-color:var(--primary)"></label>`).join('')}</div>
    <div style="background:var(--muted);border-radius:var(--r-xl);padding:12px"><div style="font-weight:600;font-size:13px;margin-bottom:8px">导出内容</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${['剧本', '大纲', '节拍', '场景', '分镜', '选角表', '勘景本', '道具表'].map((t, i) => `<label class="card" style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;font-size:12.5px">${t}<input type="radio" name="ec" ${i === 0 ? 'checked' : ''} style="accent-color:var(--primary)"></label>`).join('')}</div></div>
    <div style="background:var(--muted);border-radius:var(--r-xl);padding:12px"><div style="font-weight:600;font-size:13px;margin-bottom:8px">文件格式</div>
      ${['PDF', 'DOCX', 'TXT', 'FDX'].map((t, i) => `<label class="card" style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;margin-bottom:6px;font-size:12.5px"><b>${t}</b><input type="radio" name="ff" ${i === 0 ? 'checked' : ''} style="accent-color:var(--primary)"></label>`).join('')}
      <div style="font-size:12px;margin:8px 0 6px" class="muted">剧本格式</div><div class="seg"><button class="on">好莱坞</button><button>亚洲</button></div>
      <label style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;margin-top:10px">纸张纹理 <input type="checkbox" checked style="accent-color:var(--primary)"></label></div>
  </div>
  <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" onclick="closeModal('export');toast('已导出 门墩儿.pdf')">${icon('export', 14)} 导出</button></div></div></div>`;
// Quick actions taken from the client's 2026-09-17 meeting pain points (specs/0002 §1.1).
const QUICK = [
  ['出 3 个不同走向', '这个创意给我 3 个冲突来源和解决方式都不同的故事走向，每个 500 字以内。'],
  ['参考经典结构重写', '这集不满意，参考哆啦A梦第 1 集的结构重写，换成我们的人物。'],
  ['笑点方案', '这句不够好笑，给 3–5 个笑点方案，别用摔跤这类老套笑点。'],
  ['检查是否写飘', '对照大纲和锁定的故事核心，检查这一稿有没有写飘。'],
  ['记下导演意见', '把这张导演批注截图整理成规则，确认后全团队生效。'],
  ['控字数 5000 字 / 10 分钟', '把这集压到 5000 字左右、10 分钟以内，重场戏不动。'],
  ['转写本地视频', '把 ~/Movies/参考第1集.mp4 转成逐字稿。'],
  ['今日热点选题', '从今天的热点里挑 5 个适合 5–10 岁孩子的选题。'],
];
const welcome = `<div id="welcome" style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 8px;text-align:center">
  <div style="width:100%;height:96px;border-radius:var(--r-xl);background:radial-gradient(60% 90% at 30% 40%, var(--primary-soft), transparent 70%),radial-gradient(50% 80% at 75% 60%, var(--hl), transparent 70%),var(--muted)"></div>
  <b>你的编剧搭档，随时待命。</b><div class="muted" style="font-size:13px">我的任务是替你处理繁琐的格式工作。<br>还有更多。</div></div>`;
const workspace = () => chrome('AIScript — <span id="t-proj">新剧本</span>', `
  ${rail('写作')}
  <aside class="col2">
    <div class="hd"><span id="proj">新剧本</span><span style="flex:1"></span><button class="btn btn-quiet" style="height:24px;padding:0 6px" aria-label="新建一集">${icon('plus', 13)}</button><button class="btn btn-quiet" style="height:24px;padding:0 6px" aria-label="更多">···</button></div>
    <div class="item">${icon('film', 14)} 分集看板<small class="tnum" id="ep-count" style="background:var(--ink);color:var(--bg);border-radius:8px;padding:0 6px;font-weight:700">1</small></div>
    <div id="eps"><div class="item on" id="ep1">第 1 集</div></div>
    <div style="height:8px"></div>
    <div class="item on" id="nv-script" onclick="view('script')">${icon('doc', 14)} 剧本</div><div class="item" id="nv-outline" onclick="view('outline')">${icon('book', 14)} 大纲</div><div class="item">${icon('film', 14)} 分镜</div><div class="item">${icon('map', 14)} 场景</div>
    <div class="sec eyebrow" id="scenes-h" hidden>场景</div><div id="scenes"></div>
    <div class="sec eyebrow" id="wv-h" hidden>总体世界观</div><div id="wv"></div>
  </aside>
  <section class="center">
    <div class="center-hd"><b id="hd-title">剧本</b><span style="flex:1"></span><div class="seg" id="hd-seg"><button class="on">${icon('doc', 12)} 剧本</button><button>封面</button></div><span style="flex:1"></span>
      <button class="btn btn-quiet" style="width:28px;padding:0" aria-label="撤销">${icon('undo', 14)}</button><button class="btn btn-quiet" style="width:28px;padding:0" aria-label="批注">${icon('chat', 14)}</button></div>
    <div class="toolbar" id="tb">${[['film', '场景'], ['pen', '动作'], ['user', '角色'], ['indent', '括号'], ['chat', '对白'], ['export', '转场'], ['doc', '注释'], ['book', '字幕']].map(([ic, t], i) => `<button class="${i === 1 ? 'on' : ''}">${icon(ic, 14)}${t}</button>`).join('')}</div>
    <div class="scroll" id="scroll">
      <article class="page" id="page"><div id="empty" style="font-family:var(--font-family-mono);font-size:12px;color:var(--ink-3);display:grid;grid-template-columns:auto 1fr;gap:10px 14px;align-items:center">
        <span class="kbd">Tab</span><span>反复按 Tab 切换格式</span><span class="kbd">Enter</span><span>在选择器里新建角色、地点等实体</span><span class="kbd">@</span><span>用 @ 提及角色，让剧本更好读</span></div>
        <p class="sc-heading" id="ph" style="color:var(--ink-3);margin-top:28px">内景/外景 地点 — 日/夜</p></article>
      <article class="page outline-doc" id="outline" hidden><div class="muted">还没有大纲。</div></article></div>
    <section class="agent" id="agent" aria-label="AI 编剧">
      <div class="agent-hd"><button class="btn btn-quiet" style="width:26px;padding:0" aria-label="会话列表">${icon('menu', 14)}</button><b style="flex:1" id="chat-title">新对话</b>
        <button class="btn btn-quiet" style="width:26px;padding:0" aria-label="新对话">${icon('chat', 14)}</button><button class="btn btn-quiet" style="width:26px;padding:0" aria-label="展开到侧边">${icon('expand', 13)}</button><button class="btn btn-quiet" style="width:26px;padding:0" aria-label="收起" onclick="agentOpen(false)">${icon('chev', 14)}</button></div>
      <div class="agent-bd" id="feed">${welcome}</div>
      <div class="agent-ft">
        <div style="display:flex;align-items:flex-start;gap:6px"><div id="chips" style="flex:1;display:flex;gap:6px;flex-wrap:wrap;max-height:62px;overflow:auto">
          <button class="chip" onclick="quick(0)">${icon('spark', 12)} 润色格式</button><button class="chip" onclick="quick(-1)">${icon('book', 12)} 总结大纲</button>
          ${QUICK.map(([t], i) => `<button class="chip" onclick="quick(${i + 1})" title="⌥${i + 1}">${t}<span class="kbd" style="padding:0 4px;font-size:10px">⌥${i + 1}</span></button>`).join('')}</div>
          <button class="btn btn-quiet" style="width:22px;height:22px;padding:0;flex:none" aria-label="关闭建议" onclick="this.parentElement.hidden=true">${icon('x', 11)}</button></div>
        <div class="composer"><textarea id="ask" aria-label="给 AI 的指令" placeholder="听候差遣，随时开写……"></textarea>
          <div style="display:flex;align-items:center;gap:6px"><button class="btn btn-quiet" style="width:26px;height:26px;padding:0" aria-label="附件">${icon('plus', 14)}</button><button class="btn btn-quiet" style="width:26px;height:26px;padding:0" aria-label="顾问">${icon('cap', 14)}</button><span style="flex:1"></span>
            <select id="model" aria-label="模型" class="chip" style="height:26px;border:0;font-weight:600" onchange="toast('之后的对话和工具调用改用：'+this.value)"><option>Ancher（默认）</option><option>Gemini Flash · 自带 key</option><option>本地 SenseVoice · 离线免费</option></select>
            <button class="btn btn-primary" id="send" style="width:30px;height:30px;padding:0;border-radius:50%" aria-label="发送" onclick="sendTyped()">${icon('send', 15)}</button></div></div>
      </div>
    </section>
    <button class="fab" id="fab" hidden onclick="agentOpen(true)">${icon('spark', 15)} AI</button>
  </section>
  <aside class="info">
    <div style="display:flex;align-items:center;gap:6px"><b style="flex:1">写作</b><button class="btn btn-quiet" style="width:26px;padding:0" aria-label="导出" onclick="openModal('export')">${icon('export', 14)}</button><button class="btn btn-quiet" style="width:26px;padding:0" aria-label="写作进度">${icon('chart', 14)}</button><button class="btn btn-quiet" style="width:26px;padding:0" aria-label="收起工具栏">${icon('panel', 14)}</button></div>
    <div class="seg"><button class="on" style="flex:1">信息</button><button style="flex:1">协作</button></div>
    <div><div class="muted" style="font-size:12px;margin-bottom:6px">协作者</div><div style="display:flex;gap:4px"><div style="width:28px;height:28px;border-radius:50%;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center;font-size:11px;font-weight:700">林</div><div style="width:28px;height:28px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--line-strong);display:grid;place-items:center;color:var(--ink-3)">${icon('plus', 12)}</div></div></div>
    <div><div class="muted" style="font-size:12px;margin-bottom:6px">分页</div><div class="seg"><button class="on">精简</button><button>分页</button></div></div>
    <div><div class="muted" style="font-size:12px;margin-bottom:6px">格式</div><div class="seg"><button class="on">好莱坞</button><button>亚洲</button></div></div>
    <div><div class="muted" style="font-size:12px;margin-bottom:6px">项目类型</div><div class="seg"><button>电影</button><button class="on">剧集</button></div></div>
    <div><div class="muted" style="font-size:12px;margin-bottom:6px">统计</div><div class="kv tnum" style="font-size:12.5px">${[['场景', 's-scenes'], ['字数', 's-words'], ['角色', 's-chars'], ['地点', 's-locs'], ['节拍', 's-beats'], ['镜头', 's-shots'], ['关系', 's-rel']].map(([k, id]) => `<span>${k}</span><span id="${id}">0</span>`).join('')}</div></div>
  </aside>`, `${gsPopover}${exportModal}
  <script>window.DATA=${JSON.stringify({ IDEA, SCRIPT1, SCRIPT2, OUTLINE, CHARS: CHARS.map((c) => c[0]), LOCS, QUICK })};</script>
  <script>${LAPER_JS}</script>`);

// Replays the laper run observed in the walkthrough: auto-start from the onboarding sentence, tool
// calls in the same order, view switching, node highlight, checklist toasts, a closing question,
// and a per-turn "N edits · undo" on the second turn.
const LAPER_JS = String.raw`
const $=s=>document.getElementById(s), feed=$('feed'), page=$('page');
const CLS={heading:'sc-heading',action:'sc-action',char:'sc-char',paren:'sc-paren',dial:'sc-dial',trans:'sc-trans'};
let busy=false, turn=0, done=new Set(), sceneN=0, words=0, inserted=[];
const add=h=>{const d=document.createElement('div');d.className='enter';d.innerHTML=h;feed.appendChild(d);feed.scrollTop=feed.scrollHeight;return d;};
async function tool(name,obj,ms){const t=add('<div class="tool"><span class="spin"></span><span><b>'+name+'</b>'+(obj?'：'+obj:'')+' — <span class="st">进行中</span></span></div>');await wait(ms||420);t.querySelector('.spin').outerHTML='<span class="ok">✓</span>';t.querySelector('.st').textContent='完成';}
function view(v){$('page').hidden=v!=='script';$('outline').hidden=v!=='outline';$('tb').hidden=v!=='script';$('hd-seg').hidden=v!=='script';$('hd-title').textContent=v==='script'?'剧本':'大纲';$('nv-script').classList.toggle('on',v==='script');$('nv-outline').classList.toggle('on',v==='outline');}
function agentOpen(o){$('agent').classList.toggle('min',!o);$('fab').hidden=o;}
const STEPS=['和 AI 聊聊','写一份大纲','写一些剧本','添加一个角色','添加一个地点','添加一个镜头'];
function step(i){ if(done.has(i)) return; done.add(i); const n=done.size; $('ring').style.strokeDashoffset=94.2*(1-n/6); $('gs-n').textContent=n+' / 6'; $('gs-bar').style.width=(n/6*100)+'%';
  const el=document.querySelector('.gs-i[data-i="'+i+'"]'); el.querySelector('.gs-c').innerHTML='✓'; el.querySelector('.gs-c').style.cssText+='background:var(--primary);color:var(--primary-fg);box-shadow:none'; el.querySelector('.gs-t').style.cssText='text-decoration:line-through;color:var(--ink-3)';
  toast(n===6?'全部 6 步完成 🎉 你已经摸清门路了':'完成：'+STEPS[i]+'（'+n+'/6）'); }
function gs(){ $('gs').hidden=!$('gs').hidden; }
function stat(id,v){ $(id).textContent=v; }
async function insertNodes(list){ const s=$('empty'); if(s){s.remove();$('ph').remove();}
  for(const [ty,x] of list){ const p=document.createElement('p'); p.className='sc-node writing '+CLS[ty]; p.textContent=x; page.appendChild(p); inserted.push(p); p.scrollIntoView({block:'nearest'});
    if(ty==='heading'){ sceneN++; const [loc,tod]=x.split(' — '); $('scenes-h').hidden=false; $('scenes').insertAdjacentHTML('beforeend','<div class="item enter"><span class="tnum muted">'+sceneN+'.</span>'+loc+'<small>'+tod+'</small></div>'); stat('s-scenes',sceneN); }
    words+=x.length; stat('s-words',words.toLocaleString()); await wait(110); setTimeout(()=>p.classList.remove('writing'),700); } }
function userSay(t){ add('<div class="msg-user">'+t+'</div>'); }
function actions(){ return '<div style="display:flex;gap:4px;color:var(--ink-3)"><button class="btn btn-quiet" style="width:24px;height:24px;padding:0" aria-label="复制">'+ICON.copy+'</button><button class="btn btn-quiet" style="width:24px;height:24px;padding:0" aria-label="好的回答">'+ICON.up+'</button><button class="btn btn-quiet" style="width:24px;height:24px;padding:0" aria-label="不好的回答">'+ICON.down+'</button></div>'; }
function lock(on){ busy=on; $('send').innerHTML=on?ICON.stop:ICON.send; $('send').setAttribute('aria-label',on?'停止':'发送'); }

async function turn1(){ if(busy) return; lock(true); $('welcome')&&$('welcome').remove(); turn=1;
  userSay(DATA.IDEA); $('chat-title').textContent='门墩儿里的小精灵'; step(0);
  add('<div class="narr">我先看看项目现在的状态。</div>');
  await tool('列出分集'); await tool('读取世界观'); await tool('查看项目信息'); await tool('读取剧本大纲'); await tool('读取剧本全文'); await tool('删除剧本节点','空白占位');
  add('<div class="narr">底子是空的。先把大纲立起来，再动正文。</div>');
  await tool('重命名分集','门墩儿'); $('ep1').textContent='门墩儿'; $('proj').textContent='门墩儿'; $('t-proj').textContent='门墩儿';
  await tool('更新项目信息'); view('outline'); await tool('更新大纲 · 全部替换'); $('outline').innerHTML=DATA.OUTLINE; step(1); stat('s-beats',3);
  $('wv-h').hidden=false; $('wv').innerHTML='<div class="item enter">1. 一句话</div><div class="item enter">2. 核心问题</div>';
  await tool('新建分集','借来的东西'); $('eps').insertAdjacentHTML('beforeend','<div class="item enter">借来的东西</div>'); $('ep-count').textContent='2';
  await tool('更新大纲 · 全部替换');
  add('<div class="narr">两集的大纲都有了。接下来是第一集前三场要用到的角色和地点。</div>');
  await tool('查看角色'); await tool('查看地点');
  for(const c of DATA.CHARS){ await tool('创建角色',c,300); $('c-chars').textContent=+$('c-chars').textContent+1; stat('s-chars',$('c-chars').textContent); } step(3);
  for(const [l] of DATA.LOCS){ await tool('创建地点',l,300); $('c-locs').textContent=+$('c-locs').textContent+1; stat('s-locs',$('c-locs').textContent); } step(4);
  add('<div class="narr">现在写前三场。第一场：</div>'); view('script');
  const t=add('<div class="tool"><span class="spin"></span><span><b>插入剧本节点</b> — <span class="st">进行中</span></span></div>');
  await insertNodes(DATA.SCRIPT1); t.querySelector('.spin').outerHTML='<span class="ok">✓</span>'; t.querySelector('.st').textContent='完成 × '+DATA.SCRIPT1.length; step(2); stat('s-rel',2);
  add('<div class="narr">《门墩儿》前三场落好了。<br><br>项目改名为《门墩儿》，第二集已经建好，暂定叫《借来的东西》。两集大纲都写了：第一集立住"只有豆豆看得见门墩儿"这条规矩，第二集往"借来的东西会想家"的方向走。<br><br>正文只写了第一集前三场：门墩儿开口、饭桌上的心不在焉、操场上的亮灯鞋。第三场书包里那块会动的石头碎屑，是我埋的线。<br><br>要不要往下想：豆豆第一次求门墩儿帮忙，会求什么？</div>'+actions());
  inserted=[]; lock(false); $('ask').value='他会求一双会亮灯的鞋。按大纲把第一集剩下的写完，结尾留个钩子接第二集。'; }

async function turn2(text){ lock(true); turn=2; inserted=[]; userSay(text);
  await tool('读取剧本大纲'); await tool('查看地点'); await tool('创建地点','姥爷修车铺',300); $('c-locs').textContent=+$('c-locs').textContent+1; stat('s-locs',$('c-locs').textContent);
  const t=add('<div class="tool"><span class="spin"></span><span><b>插入剧本节点</b> — <span class="st">进行中</span></span></div>');
  await insertNodes(DATA.SCRIPT2); t.querySelector('.spin').outerHTML='<span class="ok">✓</span>'; t.querySelector('.st').textContent='完成 × '+DATA.SCRIPT2.length;
  add('<div class="narr">第一集写完了，五场。鞋底那个"建"字就是钩子——第二集一开场，姥爷就得回答"这鞋你从哪儿拿的"。<br><br>要不要想想：姥爷是会追问，还是假装没看见？</div>'+actions());
  const n=inserted.length+1;
  add('<div class="turn"><span class="tnum">本轮 '+n+' 处修改</span><button class="btn btn-ghost" style="height:26px;padding:0 10px" onclick="undo(this)">'+ICON.undo+' 撤销</button></div>');
  add('<div style="display:flex;flex-wrap:wrap;gap:6px"><button class="chip" onclick="transcribe()">'+ICON.video+' 把 ~/Movies/参考第1集.mp4 转成逐字稿</button><button class="chip" onclick="ref()">'+ICON.video+' 这集不满意，参考哆啦A梦第 1 集的结构重写</button></div>');
  lock(false); }
function undo(b){ inserted.forEach(p=>p.remove()); const n=inserted.length+1; inserted=[]; sceneN-=2; const sc=$('scenes'); sc.lastElementChild.remove(); sc.lastElementChild.remove(); stat('s-scenes',sceneN);
  $('c-locs').textContent=+$('c-locs').textContent-1; stat('s-locs',$('c-locs').textContent); b.closest('.turn').innerHTML='<span class="muted">已撤销本轮 '+n+' 处修改</span>'; toast('已撤销 '+n+' 处修改'); }
async function ref(){ if(busy) return; lock(true); userSay('这集不满意，参考哆啦A梦第 1 集的结构重写，换成我们的人物。<div style="margin-top:6px"><span class="att">'+ICON.video+' 哆啦A梦 第1集.mp4 · 22:14</span></div>');
  await tool('解析参考视频','转写 3,960 字 · 关键帧 48 张',800); await tool('拆解结构','6 个节拍'); await tool('读取角色');
  add('<div class="result"><b>参考结构 · 只取骨架，不取内容</b><ol class="beats">'+['日常困境','奇幻伙伴给出"捷径"','捷径奏效','捷径失控、越帮越忙','主角靠自己的选择收场','小反转收尾'].map(x=>'<li>'+x+'</li>').join('')+'</ol>'+
    '<div class="map">'+[['受挫的主角','豆豆'],['带道具的奇幻伙伴','门墩儿（只能借胡同老物件）'],['炫耀的同学','大壮'],['温和的长辈','姥爷']].map(([a,b])=>'<span class="muted">'+a+'</span><span>→</span><b style="font-weight:600">'+b+'</b>').join('')+'</div>'+
    '<div class="muted" style="font-size:12px">原创度：结构借用 · 人物 / 道具 / 台词 0% 重合</div><button class="btn btn-primary" style="height:30px;align-self:flex-start" onclick="toast(\'下一步：按这 6 拍改写大纲并重写正文（演示到此）\')">按这个结构重写</button></div>');
  lock(false); }
async function transcribe(){ if(busy) return; lock(true); const m=$('model').value; const local=m.startsWith('本地');
  userSay('把 ~/Movies/参考第1集.mp4 转成逐字稿'); add('<div class="narr">用你选的模型：<b>'+m+'</b>。视频不上传，只在本机抽音轨'+(local?'，转写也在本机完成。':'，只把音频发给模型。')+'</div>');
  await tool('读取本地文件','参考第1集.mp4 · 22:14 · 412 MB'); await tool('抽取音轨（ffmpeg，本机）','16 kHz 单声道 · 21 MB',600);
  await tool(local?'本地转写（SenseVoice）':(m.startsWith('Gemini')?'Gemini 转写':'Ancher 转写'),'分段 · 时间轴 · 说话人',1100);
  add('<div class="result"><div class="row"><b style="flex:1">逐字稿 · 参考第1集</b><span class="muted tnum" style="font-size:12px">3,960 字 · 312 段</span></div>'+
    '<div style="font-family:var(--font-family-mono);font-size:12px;color:var(--ink-2);line-height:1.7">[00:00:12] 甲：……<br>[00:00:15] 乙：……<br>[00:00:21] 甲：……</div>'+
    '<div class="row muted tnum" style="font-size:12px;gap:14px"><span>模型：'+m+'</span><span>耗时 '+(local?'48':'21')+' 秒</span><span>费用 '+(local?'¥0':(m.startsWith('Gemini')?'约 ¥0.1（记在你自己的 key 上）':'约 ¥2.4（Ancher 积分）'))+'</span></div>'+
    '<div class="row"><button class="btn btn-ghost" style="height:28px" onclick="toast(\'已存入知识库 · 可在对话里引用\')">存入知识库</button><button class="btn btn-ghost" style="height:28px" onclick="toast(\'已导出 .srt / .txt / .json\')">导出 SRT</button></div></div>');
  lock(false); }
function quick(i){ if(i<=0){ $('ask').value=i===0?'把这一场润色成标准格式。':'总结一下现在的大纲。'; $('ask').focus(); return; }
  const [t,prompt]=DATA.QUICK[i-1]; const run={1:runOptions,2:ref,3:runJokes,4:runDrift,5:runRule,7:transcribe}[i];
  if(run){ if(busy){ toast('AI 正在写，稍等这一轮结束'); return; } run(); } else { $('ask').value=prompt; $('ask').focus(); } }
async function runOptions(){ lock(true); userSay(DATA.QUICK[0][1]); await tool('读取大纲'); await tool('读取规则与反例','12 条 · 反例 4'); await tool('联网搜索','小学生 攀比 球鞋',700);
  add('<div class="result"><b>3 个走向 · 冲突来源和解决方式都不同</b>'+[['借来的鞋','道具失控','鞋停不下来，姥爷认出旧主'],['修车铺的一天','换位体验','帮姥爷补一天鞋，看见每双鞋的路'],['一只鞋的旅行','物件回望','旧鞋开口讲它陪豆豆走过哪儿']].map(([t,m,d],k)=>'<div style="border-top:1px solid var(--line);padding-top:8px"><div class="row"><b style="flex:1">'+'ABC'[k]+' · '+t+'</b><span class="chip" style="height:20px">'+m+'</span></div><div class="muted" style="font-size:12.5px;margin:4px 0">'+d+'</div><button class="btn btn-ghost" style="height:26px" onclick="toast(\'已选「'+t+'」，写进大纲\')">用这个</button></div>').join('')+'</div>'); lock(false); }
async function runJokes(){ lock(true); userSay(DATA.QUICK[2][1]); await tool('读取上下文','第 3 场'); await tool('读取正反例','好笑 9 · 不好笑 6');
  add('<div class="result"><b>笑点方案</b>'+[['大壮跺一下脚，鞋灯亮；豆豆跺一下，门墩儿在书包里"哎哟"一声','反差',''],['全班学大壮跺脚，教室像迪厅，老师进门那一刻全体定格','升级 + 定格',''],['豆豆摔了个四脚朝天','摔跤类','与导演规则冲突']].map(([t,m,w])=>'<div style="border-top:1px solid var(--line);padding-top:8px;'+(w?'opacity:.55':'')+'"><div>'+t+'</div><div class="row" style="margin-top:6px"><span class="muted" style="font-size:12px;flex:1">'+m+(w?' · <span style="color:var(--color-danger-500)">'+w+'</span>':'')+'</span><button class="chip" onclick="this.parentElement.innerHTML=\'<span class=chip>已记为好笑 · 进正例</span>\'">好笑</button><button class="chip" onclick="this.parentElement.innerHTML=\'<span class=chip>已记为不好笑 · 进反例</span>\'">不好笑</button></div></div>').join('')+'</div>'); lock(false); }
async function runDrift(){ lock(true); userSay(DATA.QUICK[3][1]); await tool('读取大纲'); await tool('读取剧本全文'); await tool('对照故事核心与重场戏');
  add('<div class="result"><b>写飘检查</b>'+[['ok','故事核心「借来的东西会想家」保留'],['ok','重场戏「姥爷认出鞋底的字」在第 5 场'],['m','第 2 场饭桌戏和主线关系弱，可以删或合并'],['m','门墩儿第 3 场没出场，规矩"只有豆豆看得见"没被用上']].map(([l,t])=>'<div class="row">'+(l==='ok'?'<span class="ok">✓</span>':'<span class="lvl m">提醒</span>')+t+'</div>').join('')+'</div>'); lock(false); }
async function runRule(){ lock(true); userSay(DATA.QUICK[4][1]+'<div style="margin-top:6px"><span class="att">导演批注 10/06.png</span></div>'); await tool('识别截图','2 处批注'); await tool('对照规则库','12 条 · 1 条相近');
  add('<div class="result"><b>不用摔跤、踩香蕉皮这类笑点</b><div class="muted" style="font-size:12px">原话："孩子们笑的不是摔，是没想到。" · 导演 · 10/06</div><div class="row" style="font-size:12.5px">适用：<label><input type="radio" name="sc" checked style="accent-color:var(--primary)"> 全剧</label><label><input type="radio" name="sc" style="accent-color:var(--primary)"> 本集</label><label><input type="radio" name="sc" style="accent-color:var(--primary)"> 某个人物</label></div><div class="row"><button class="btn btn-primary" style="height:28px" onclick="this.parentElement.innerHTML=\'<span class=chip>已入库 · 全团队下次生成即生效</span>\';toast(\'规则已入库 · 共 13 条\')">确认入库</button><button class="btn btn-ghost" style="height:28px" onclick="this.closest(\'.result\').style.opacity=.5">驳回</button></div></div>'); lock(false); }
document.addEventListener('keydown',e=>{ if(e.altKey&&/^Digit[1-8]$/.test(e.code)){ e.preventDefault(); quick(+e.code.slice(5)); } });
function sendTyped(){ if(busy){ toast('已停止'); return; } const v=$('ask').value.trim(); if(!v) return; $('ask').value=''; if(turn===0) return turn1(); if(turn===1) return turn2(v); userSay(v); add('<div class="narr">（演示里只预置了前两轮）</div>'); }
document.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey&&document.activeElement===$('ask')){ e.preventDefault(); sendTyped(); } });
setTimeout(turn1, 700);
`;
const ICONS_JS = `<script>window.ICON=${JSON.stringify({ copy: icon('copy', 13), up: icon('up', 13), down: icon('down', 13), undo: icon('undo', 13), send: icon('send', 15), stop: icon('stop', 13), video: icon('video', 12) })};</script>`;

/* ═════ P5 角色画布（laper /characters） ═════ */
const p5 = () => chrome('AIScript — 角色', `${rail('角色')}
  <section class="center" style="background-image:radial-gradient(var(--line-strong) 1px, transparent 1px);background-size:20px 20px">
    <div class="center-hd" style="background:var(--bg)"><b>角色</b><span class="chip tnum" style="height:20px">4</span><span style="flex:1"></span><div class="seg"><button class="on">概览</button><button>关系</button><button>选角</button></div><span style="flex:1"></span>
      <button class="btn btn-quiet" style="width:28px;padding:0" aria-label="导出">${icon('export', 14)}</button><button class="btn btn-primary" style="height:28px">${icon('plus', 13)} 新角色</button></div>
    <div class="card" style="position:absolute;right:16px;top:58px;display:flex;gap:2px;padding:4px;z-index:2">${['chat', 'trash', 'expand', 'zoom', 'zoom'].map((ic) => `<button class="btn btn-quiet" style="width:26px;height:26px;padding:0">${icon(ic, 13)}</button>`).join('')}</div>
    <div style="flex:1;overflow:auto;padding:40px 32px;display:flex;gap:20px;align-items:flex-start">
      ${CHARS.map(([n, m, d, c, sc, ln]) => `<div style="width:230px;flex:none"><div class="seg" style="margin-bottom:6px"><button class="on">肖像</button><button>高级</button></div>
        <div class="card enter" style="overflow:hidden"><div style="height:150px;background:linear-gradient(160deg, ${c}, color-mix(in srgb, ${c}, black 35%));display:flex;flex-direction:column;justify-content:flex-end;padding:12px;color:#fff">
          <div style="flex:1;display:grid;place-items:center;opacity:.7">${icon('user', 40)}</div><b style="font-size:17px">${n}</b><span style="font-size:11.5px;opacity:.9">${m}</span></div>
          <div style="padding:12px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:6px"><span class="chip" style="height:22px">${icon('film', 11)} ${sc} 场</span><span class="chip" style="height:22px">${icon('chat', 11)} ${ln} 句</span></div>
          <p style="margin:0;font-size:13px;color:var(--ink-2)">${d}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button class="btn btn-ghost" style="height:30px">${icon('pen', 13)} 编辑</button><button class="btn btn-ghost" style="height:30px">${icon('upload', 13)} 上传</button></div>
          <button class="btn btn-quiet" style="height:30px" onclick="toast('正在根据角色设定生成肖像…')">${icon('spark', 13)} 生成</button></div></div></div>`).join('')}
    </div></section>`);

/* ═════ P6 制作设置 + 分镜（laper /production） ═════ */
const p6 = () => chrome('AIScript — 制作', `${rail('制作')}
  <section class="center">
    <div class="center-hd"><b>门墩儿</b><span class="muted">制作 · 5</span><span style="flex:1"></span><button class="btn btn-primary" style="height:28px">${icon('plus', 13)} 新增卷</button></div>
    <div style="display:flex;gap:6px;padding:10px 14px;border-bottom:1px solid var(--line);overflow:auto">${['1. 外景 胡同口 — 傍晚', '2. 内景 豆豆家 — 夜', '3. 外景 学校操场 — 日', '4. 外景 胡同口 — 傍晚', '5. 内景 姥爷修车铺 — 夜'].map((t, i) => `<button class="chip" style="${i === 0 ? 'background:var(--surface);box-shadow:var(--shadow-card);color:var(--ink)' : ''}">${t}</button>`).join('')}</div>
    <div style="flex:1;display:flex;gap:20px;padding:24px;overflow:auto;background-image:radial-gradient(var(--line-strong) 1px, transparent 1px);background-size:20px 20px">
      <div class="card" style="width:300px;padding:12px;display:flex;flex-direction:column;gap:10px;align-self:flex-start"><div class="muted" style="font-size:12px">分镜镜头</div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">片段时长<div class="seg">${['5s', '8s', '10s', '15s'].map((t, i) => `<button class="${i === 3 ? 'on' : ''}">${t}</button>`).join('')}</div></div>
        <div class="muted" style="font-size:12px;border:1px solid var(--line);border-radius:var(--r);padding:8px">@ 提及角色来指导表演<br>"" 用引号标出要高亮的对白</div>
        <div class="muted" style="font-size:12px">镜头描述…</div><button class="btn btn-ghost" style="height:28px">${icon('plus', 12)} 添加镜头</button>
        <button class="btn btn-primary" style="height:32px" onclick="toast('AI 正在根据第 1 场生成分镜…')">${icon('spark', 13)} AI 分镜</button></div>
      <div class="card" style="width:340px;align-self:flex-start;overflow:hidden"><div style="aspect-ratio:16/9;background:var(--muted);display:grid;place-items:center;color:var(--ink-3);font-size:12px">${icon('film', 20)}</div>
        <div style="padding:12px"><b>外景 胡同口</b><p class="muted" style="font-size:12px;margin:4px 0 10px">豆豆蹲在自家门墩儿旁边……</p><button class="btn btn-ghost" style="height:28px">${icon('spark', 12)} 生成场景</button></div></div>
    </div></section>`, `
  <div class="scrim open" id="prod"><div class="modal" style="padding:22px;width:min(880px,calc(100vw - 32px))">
    <b class="display" style="font-size:22px">制作设置</b><p class="muted" style="margin:4px 0 16px;font-size:13px">美术风格是影片的视觉灵魂——每一场、每一张分镜和最终画面都会遵循它。</p>
    <div style="display:grid;grid-template-columns:240px 1fr;gap:16px">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="background:var(--muted);border-radius:var(--r-xl);padding:12px"><b style="font-size:13px">画幅</b><div class="muted" style="font-size:11.5px;margin:2px 0 8px">开始制作后不可更改</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${['横屏 16:9', '竖屏 9:16'].map((t, i) => `<button class="card" style="padding:12px 6px;font-size:12px;${i === 0 ? 'box-shadow:inset 0 0 0 2px var(--primary)' : ''}">${t}</button>`).join('')}</div></div>
        <div style="background:var(--muted);border-radius:var(--r-xl);padding:12px"><b style="font-size:13px">制作类型</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">${['叙事', '商业'].map((t, i) => `<button class="card" style="padding:12px 6px;font-size:12px;${i === 0 ? 'box-shadow:inset 0 0 0 2px var(--primary)' : ''}">${t}</button>`).join('')}</div></div>
        <div style="background:var(--muted);border-radius:var(--r-xl);padding:12px"><b style="font-size:13px">镜头风格</b><div class="muted" style="font-size:11.5px;margin-top:2px">定义整部片的运镜和质感</div></div></div>
      <div style="background:var(--muted);border-radius:var(--r-xl);padding:12px"><b style="font-size:13px">美术风格</b>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">${[['二维手绘 · 温暖', '2000s–2010s', 'var(--color-b2-500)'], ['胡同水彩', '1990s–2000s', 'var(--color-b4-600)'], ['定格黏土', '2010s–2020s', 'var(--color-b5-500)'], ['剪纸皮影', '现代', 'var(--color-b1-500)']].map(([t, era, c], i) => `<button class="card" style="text-align:left;overflow:hidden;${i === 0 ? 'box-shadow:inset 0 0 0 2px var(--primary)' : ''}"><div style="height:84px;background:linear-gradient(135deg, ${c}, color-mix(in srgb, ${c}, black 40%));position:relative"><span class="chip" style="position:absolute;left:8px;top:8px;height:20px;background:rgb(0 0 0 / .45);color:#fff">${era}</span></div><div style="padding:8px 10px;font-size:12.5px;font-weight:600">${t}</div></button>`).join('')}</div></div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" onclick="closeModal('prod')">确认</button></div></div></div>`);

/* ═════ P7 最近（laper /app/recents） ═════ */
const p7 = () => chrome('AIScript', `
  <nav style="width:220px;flex:none;padding:14px 10px;display:flex;flex-direction:column;gap:2px;border-right:1px solid var(--line);background:var(--sidebar)" class="col2">
    <div style="display:flex;align-items:center;gap:8px;font-weight:700;padding:0 6px 12px"><div class="logo" style="margin:0">剧</div>AIScript</div>
    ${[['plus', '新建'], ['home', '最近', 1], ['doc', '剧本'], ['video', '快速视频 Beta'], ['users', '社区'], ['trash', '回收站']].map(([ic, t, on]) => `<div class="item${on ? ' on' : ''}" style="margin:0">${icon(ic, 15)} ${t}</div>`).join('')}
    <div style="flex:1"></div>
    <div class="item" style="margin:0">${icon('gift', 15)} 赚积分</div>
    <div class="card" style="padding:12px;margin:8px 0;background:linear-gradient(140deg, var(--primary-soft), var(--surface))"><div style="display:flex;align-items:baseline;gap:6px"><b class="tnum" style="font-size:22px">110</b><span class="muted" style="font-size:12px">积分</span><span style="flex:1"></span><button class="btn btn-primary" style="height:24px;padding:0 10px;font-size:12px">升级</button></div>
      <div class="muted" style="font-size:11.5px;margin-top:6px">会员每天可以提一个功能需求。邀请好友赚积分，随时联系客服。</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:10px"><div style="width:24px;height:24px;border-radius:50%;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center;font-size:11px;font-weight:700">林</div><div style="font-size:12px"><b>林</b><br><span class="muted">入门版</span></div></div></div>
    <button class="btn btn-primary" style="height:32px">新功能</button></nav>
  <main style="flex:1;overflow:auto;padding:24px 32px"><div class="muted" style="margin-bottom:16px">最近</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">
      ${[['plus', '新建剧本', '写出专业、结构清晰的剧本'], ['plus', '新建快速视频', '为 AI 视频创作而生']].map(([ic, t, d]) => `<button class="card" style="aspect-ratio:3/4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--ink-2);box-shadow:inset 0 0 0 1px var(--line-strong)">${icon(ic, 20)}<b style="color:var(--ink)">${t}</b><span class="muted" style="font-size:12px;padding:0 16px;text-align:center">${d}</span></button>`).join('')}
      <div class="card enter" style="aspect-ratio:3/4;padding:16px;display:flex;flex-direction:column"><b class="display" style="font-size:18px">门墩儿</b><span class="muted" style="font-size:12px">开始你的创作之旅……</span><span style="flex:1"></span><span class="muted" style="font-size:11.5px">编辑于 6 秒前</span></div>
    </div></main>`);

/* ═════ P8 设备与用量（我们新增） ═════ */
const usage = [12, 30, 18, 44, 26, 52, 38, 61, 20, 35, 48, 57, 40, 66];
const p8 = () => chrome('AIScript — 设备与用量', `
  <main style="flex:1;overflow:auto;padding:32px 40px;max-width:1000px">
    <h1 class="display" style="font-size:30px;margin:0 0 20px">设备与用量</h1>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px">${[['我的设备', '2', '/ 3'], ['本月对话', '412', '/ 500'], ['本月 tokens', '2.1M', '账本统计'], ['续费', '23', '天后']].map(([k, v, s]) => `<div class="card" style="padding:16px"><div class="muted" style="font-size:12px">${k}</div><div class="tnum display" style="font-size:28px">${v} <span class="muted" style="font-size:12px;font-family:var(--font-ui);font-style:normal">${s}</span></div></div>`).join('')}</div>
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:12px">
      <section class="card" style="padding:18px"><div style="display:flex;margin-bottom:12px"><b style="flex:1">已绑定的电脑</b><span class="tnum muted" id="slots">2 / 3</span></div>
        ${[['MacBook Pro · 工作室', 'macOS 15 · 本机 · 刚刚', true], ['ThinkPad X1', 'Windows 11 · 3 天前', false]].map(([n, m, me]) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)">${icon('laptop', 18)}<div style="flex:1"><div style="font-weight:600">${n}</div><div class="muted" style="font-size:12px">${m}</div></div>${me ? '<span class="chip">本机</span>' : `<button class="btn btn-ghost" style="height:28px" onclick="this.parentElement.remove();document.getElementById('slots').textContent='1 / 3';toast('已解绑 · 该设备下次请求需重新登录')">解绑</button>`}</div>`).join('')}
        <div class="muted" style="font-size:12px;padding-top:10px;border-top:1px dashed var(--line-strong)">每个账号最多 3 台 · 每 30 天可自助解绑 3 次</div></section>
      <section class="card" style="padding:18px"><div style="display:flex;margin-bottom:12px"><b style="flex:1">近 14 天 AI 用量</b><span class="muted" style="font-size:12px">服务端账本</span></div>
        <div style="display:flex;align-items:flex-end;gap:5px;height:120px">${usage.map((v, i) => `<div style="flex:1;height:${(v / 66) * 100}%;border-radius:calc(3px * var(--radius-mult)) calc(3px * var(--radius-mult)) 0 0;background:${i === usage.length - 1 ? 'var(--primary)' : 'var(--muted)'}"></div>`).join('')}</div>
        <div class="kv tnum" style="margin-top:14px;font-size:13px"><span>剧本写作</span><span>62%</span><span>联网调研</span><span>23%</span><span>解析 / 逆向提示词</span><span>15%</span></div></section></div>
  </main>`);

export const PAGES = [
  { id: 'p1', name: '登录（+ 设备上限）', render: p1 },
  { id: 'p2', name: 'Onboarding · 一句话', render: p2 },
  { id: 'p3', name: '创作首页', render: p3 },
  { id: 'p4', name: '工作区 · AI 自动开写', render: () => ICONS_JS + workspace() },
  { id: 'p5', name: '角色画布', render: p5 },
  { id: 'p6', name: '制作设置 · 分镜', render: p6 },
  { id: 'p7', name: '最近', render: p7 },
  { id: 'p8', name: '设备与用量（新增）', render: p8 },
];
