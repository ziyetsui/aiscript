// Variants 2–5 for P3 (create home) and P7 (recents).
import { icon, chrome } from '../src/pages.mjs';

const PROJECTS = [
  { t: '门墩儿', ep: '第 1 集 · 跑不停的鞋', stage: '剧本', scene: '第 4 场 · 胡同 · 傍晚', pct: 64, words: 3240, when: '6 秒前', day: '今天' },
  { t: '门墩儿', ep: '第 2 集 · 借来的东西', stage: '分场', scene: '分场 9 / 15', pct: 38, words: 1980, when: '2 小时前', day: '今天' },
  { t: '门墩儿', ep: '第 3 集 · 雇人值日', stage: '故事', scene: '3 个走向待选', pct: 12, words: 486, when: '昨天 21:40', day: '昨天' },
  { t: '夜班调度', ep: '电影 · 第二稿', stage: '剧本', scene: '第 41 场 · 控制室 · 夜', pct: 81, words: 21480, when: '10/05', day: '更早' },
  { t: '南方来信', ep: '短剧 · 第 12 / 24 集', stage: '大纲', scene: '第 13 集大纲', pct: 50, words: 7320, when: '10/02', day: '更早' },
  { t: '一个很长很长的项目名字用来测试截断：胡同里的小神仙与他的十二个邻居', ep: '动画剧集 · 第 1 集', stage: '选题', scene: '选题池 7 个', pct: 4, words: 0, when: '09/28', day: '更早' },
];
const STAGES = ['选题', '故事', '大纲', '分场', '剧本'];
const WF = ['一个创意 → 3 个走向', '参考经典结构重写', '笑点方案', '视频 → 逐字稿'];
const nav = (on) => `<nav class="lnav" aria-label="导航"><div class="lnav-brand"><div class="logo" style="margin:0">剧</div>AIScript</div>
  ${[['plus', '新建'], ['home', '首页'], ['doc', '剧本'], ['trash', '回收站'], ['gear', '设置']].map(([ic, t]) => `<button class="lnav-i${t === on ? ' on' : ''}">${icon(ic, 15)} ${t}</button>`).join('')}</nav>`;
const NAV_CSS = `.lnav{width:200px;flex:none;padding:14px 10px;display:flex;flex-direction:column;gap:2px;border-right:1px solid var(--line);background:var(--sidebar)}
.lnav-brand{display:flex;align-items:center;gap:8px;font-weight:700;padding:0 8px 14px}
.lnav-i{display:flex;align-items:center;gap:10px;height:34px;padding:0 10px;border-radius:var(--r-sm);color:var(--ink-2);font-size:13.5px;text-align:left;transition:background-color 150ms ease}
.lnav-i.on{background:var(--surface);box-shadow:var(--shadow-card);color:var(--ink);font-weight:600}
@media (hover:hover) and (pointer:fine){.lnav-i:not(.on):hover{background:var(--hover)}}
.trunc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.bar{height:4px;border-radius:2px;background:var(--muted);overflow:hidden}.bar i{display:block;height:100%;background:var(--primary)}`;

/* ═══ P3 · 2 「继续写」 — resume first: one big "continue" card, everything else secondary ═══ */
const p3Resume = {
  name: '继续写', axis: '优先级：上次停下的地方占据首屏',
  body: chrome('AIScript', `${nav('首页')}
  <main class="rs"><div class="muted">下午好，林</div>
    <section class="resume card"><div class="resume-cover page" aria-hidden="true"><b>门墩儿</b><span>第 1 集</span></div>
      <div class="resume-body"><span class="chip" style="height:22px;align-self:flex-start">剧本 · 64%</span>
        <h1 class="display" style="font-size:28px;margin:6px 0 2px">第 1 集 · 跑不停的鞋</h1><p class="muted" style="margin:0 0 14px">上次停在 <b style="color:var(--ink)">第 4 场 · 胡同 · 傍晚</b> · 6 秒前</p>
        <div class="bar" style="margin-bottom:6px"><i style="width:64%"></i></div><div class="muted tnum" style="font-size:12px;margin-bottom:18px">3,240 / 5,000 字 · 6.5 / 10 分钟</div>
        <div style="display:flex;gap:8px"><button class="btn btn-primary" style="height:40px" onclick="toast('打开第 4 场')">继续写第 4 场</button><button class="btn btn-ghost" style="height:40px">看大纲</button></div></div></section>
    <div class="rs-row"><section><h2 class="h2">最近</h2>${PROJECTS.slice(1, 4).map((p) => `<button class="rs-item"><span class="trunc"><b>${p.ep}</b><br><span class="muted">${p.t} · ${p.scene}</span></span><span class="muted tnum" style="font-size:12px;flex:none">${p.when}</span></button>`).join('')}</section>
      <section><h2 class="h2">常用工作流</h2><div class="wf-grid">${WF.map((w) => `<button class="wf-btn card">⚡ ${w}</button>`).join('')}</div></section></div>
  </main>`),
  css: `${NAV_CSS}
.rs{flex:1;overflow:auto;padding:32px 40px;display:flex;flex-direction:column;gap:20px;max-width:1080px}
.resume{display:grid;grid-template-columns:180px 1fr;gap:28px;padding:24px}
.resume-cover{min-height:0 !important;aspect-ratio:3/4;padding:28px 18px !important;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:13px}
.resume-body{display:flex;flex-direction:column}
.rs-row{display:grid;grid-template-columns:1.2fr 1fr;gap:28px}.h2{font-size:13px;color:var(--ink-3);font-weight:600;margin:0 0 8px}
.rs-item{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:10px 12px;border-radius:var(--r);transition:background-color 150ms ease}
@media (hover:hover) and (pointer:fine){.rs-item:hover{background:var(--hover)}}
.wf-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wf-btn{padding:14px;text-align:left;font-size:13px;transition:transform 150ms var(--ease-enter)}.wf-btn:active{transform:scale(.97)}`,
  js: '',
};

/* ═══ P3 · 3 「搜索为先」 — search first: a command input, keyboard navigation without motion ═══ */
const SEARCH = [...PROJECTS.slice(0, 5).map((p) => ({ g: '项目', t: p.ep, s: p.t + ' · ' + p.scene, k: '打开' })),
  ...WF.map((w) => ({ g: '工作流', t: w, s: '在当前项目里运行', k: '运行' })),
  ...['新建动画剧集', '新建电影', '导入已有剧本'].map((t) => ({ g: '新建', t, s: '', k: '新建' }))];
const p3Search = {
  name: '搜索为先', axis: '交互模型：一个输入框找到一切',
  body: chrome('AIScript', `
  <main class="sr"><h1 class="display" style="font-size:28px;margin:0 0 16px;text-align:center">下午好，林。去哪儿？</h1>
    <div class="sr-box card"><label for="q" class="sr-only">搜索项目、工作流或新建</label>
      <div class="sr-in">${icon('search', 18)}<input id="q" type="search" placeholder="搜索项目、工作流，或者新建…" autocomplete="off" spellcheck="false"><span class="kbd">⌘K</span></div>
      <div class="sr-res" id="res" role="listbox" aria-label="结果"></div>
      <div class="sr-foot muted"><span><span class="kbd">↑↓</span> 选择</span><span><span class="kbd">↵</span> 打开</span></div></div></main>`),
  css: `.sr{flex:1;padding:12vh 24px 24px;display:flex;flex-direction:column;align-items:center}
.sr-box{width:min(620px,100%);overflow:hidden;box-shadow:var(--shadow-pop)}
.sr-in{display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:1px solid var(--line);color:var(--ink-3)}
.sr-in input{flex:1;height:54px;border:0;outline:none;background:transparent;font-size:17px;color:var(--ink)}
.sr-res{max-height:52vh;overflow:auto;padding:6px}.sr-g{padding:8px 10px 4px;font-size:11.5px;color:var(--ink-3);font-weight:600}
.sr-it{display:flex;align-items:center;gap:12px;width:100%;padding:9px 10px;border-radius:var(--r);text-align:left}
.sr-it[aria-selected=true]{background:var(--hover)}.sr-it .k{margin-left:auto;font-size:12px;color:var(--ink-3)}
.sr-it mark{background:var(--primary-soft);color:inherit;border-radius:2px}
.sr-foot{display:flex;gap:14px;padding:8px 16px;border-top:1px solid var(--line);font-size:12px}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.empty{padding:28px;text-align:center}`,
  js: String.raw`
const DATA=${JSON.stringify(SEARCH)}; const q=document.getElementById('q'), res=document.getElementById('res'); let sel=0, items=[];
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function hl(s,w){ if(!w) return esc(s); const i=s.toLowerCase().indexOf(w.toLowerCase()); return i<0?esc(s):esc(s.slice(0,i))+'<mark>'+esc(s.slice(i,i+w.length))+'</mark>'+esc(s.slice(i+w.length)); }
function render(){ const w=q.value.trim(); items=DATA.filter(d=>!w||(d.t+d.s+d.g).toLowerCase().includes(w.toLowerCase())); sel=Math.min(sel,Math.max(0,items.length-1)); let g='';
  res.innerHTML=items.length?items.map((d,i)=>(d.g!==g?'<div class="sr-g">'+(g=d.g)+'</div>':'')+'<button class="sr-it" role="option" data-i="'+i+'" aria-selected="'+(i===sel)+'"><span class="trunc" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>'+hl(d.t,w)+'</b>'+(d.s?' <span class="muted">· '+hl(d.s,w)+'</span>':'')+'</span><span class="k">'+d.k+' ↵</span></button>').join('')
    :'<div class="empty muted">没有找到「'+esc(w)+'」。按 ↵ 用它新建一个项目。</div>';
  res.querySelectorAll('.sr-it').forEach(b=>{ b.onpointermove=()=>{ if(sel!==+b.dataset.i){ sel=+b.dataset.i; mark(); } }; b.onclick=()=>open(+b.dataset.i); }); }
function mark(){ res.querySelectorAll('.sr-it').forEach(b=>b.setAttribute('aria-selected',+b.dataset.i===sel)); const s=res.querySelector('[aria-selected=true]'); s&&s.scrollIntoView({block:'nearest'}); }
function open(i){ const d=items[i]; toast(d?d.k+'：'+d.t:'新建项目「'+q.value+'」'); }
q.addEventListener('input',()=>{ sel=0; render(); });
q.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'){ sel=Math.min(sel+1,items.length-1); mark(); e.preventDefault(); } else if(e.key==='ArrowUp'){ sel=Math.max(sel-1,0); mark(); e.preventDefault(); } else if(e.key==='Enter'){ open(sel); e.preventDefault(); } });
document.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key==='k'){ e.preventDefault(); q.focus(); q.select(); } });
render(); q.focus();`,
};

/* ═══ P3 · 4 「书架」 — spatial browse: spines on a shelf, drag with momentum, pull one out ═══ */
const p3Shelf = {
  name: '书架', axis: '空间浏览：书脊排在书架上，拖动有惯性',
  body: chrome('AIScript', `${nav('首页')}
  <main class="sh"><div style="display:flex;align-items:baseline;justify-content:space-between"><h1 class="display" style="font-size:28px;margin:0">书架</h1><span class="muted" style="font-size:12px">拖动浏览 · 点击抽出</span></div>
    <div class="shelf" id="shelf"><div class="track" id="track">${[...PROJECTS, ...PROJECTS.slice(0, 3)].map((p, i) => `<button class="spine" data-i="${i % PROJECTS.length}" style="height:${220 + ((i * 37) % 70)}px;--h:${(i * 47) % 360}"><span>${p.t} · ${p.ep}</span></button>`).join('')}</div><div class="plank" aria-hidden="true"></div></div>
    <section class="detail card" id="detail" hidden aria-live="polite"></section></main>`),
  css: `${NAV_CSS}
.sh{flex:1;min-width:0;padding:32px 40px;display:flex;flex-direction:column;gap:18px}
.shelf{position:relative;overflow:hidden;padding-top:20px;touch-action:pan-y;cursor:grab}.shelf.drag{cursor:grabbing}
.track{display:flex;align-items:flex-end;gap:6px;padding:0 20px;width:max-content;will-change:transform}
.spine{width:46px;border-radius:4px 4px 2px 2px;background:color-mix(in oklch, var(--primary) 18%, oklch(0.93 0.03 calc(var(--h) * 1deg)));box-shadow:inset -3px 0 0 rgb(0 0 0 / .06),var(--shadow-card);
  display:flex;align-items:flex-start;justify-content:center;padding:14px 0;writing-mode:vertical-rl;font-family:var(--font-display);font-size:13px;color:var(--ink);transition:transform 220ms var(--ease-enter)}
.spine span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-height:100%}
.spine.out{transform:translateY(-18px)}
@media (hover:hover) and (pointer:fine){.spine:not(.out):hover{transform:translateY(-6px)}}
.plank{height:12px;background:var(--line-strong);border-radius:2px;margin-top:-1px}
.detail{padding:18px;max-width:520px}.detail.in{animation:dIn 220ms var(--ease-enter) both}@keyframes dIn{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion: reduce){.detail.in{animation:none}.spine{transition:none}}`,
  js: String.raw`
const P=${JSON.stringify(PROJECTS)}; const shelf=document.getElementById('shelf'), track=document.getElementById('track'); let x=0, v=0, start=null, moved=false, raf;
const max=()=>Math.min(0, shelf.clientWidth-track.scrollWidth);
const damp=(n)=>n>0?n*.3:n<max()?max()+(n-max())*.3:n;            // rubber band past the ends
function setX(n){ x=n; track.style.transform='translateX('+damp(x)+'px)'; }
shelf.addEventListener('pointerdown',e=>{ if(start) return; cancelAnimationFrame(raf); start={px:e.clientX,x,t:performance.now(),lx:e.clientX,lt:performance.now()}; moved=false; shelf.setPointerCapture(e.pointerId); shelf.classList.add('drag'); });
shelf.addEventListener('pointermove',e=>{ if(!start) return; const dx=e.clientX-start.px; if(Math.abs(dx)>4) moved=true; const now=performance.now(); v=(e.clientX-start.lx)/Math.max(1,now-start.lt); start.lx=e.clientX; start.lt=now; setX(start.x+dx); });
shelf.addEventListener('pointerup',e=>{ if(!start) return; shelf.classList.remove('drag'); start=null; x=damp(x);
  const glide=()=>{ v*=.94; x+=v*16; if(x>0||x<max()){ x+=((x>0?0:max())-x)*.2; v*=.6; } setX(x); if(Math.abs(v)>.02||x>0.5||x<max()-.5) raf=requestAnimationFrame(glide); };   // momentum, then settle
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches) glide(); else setX(Math.max(max(),Math.min(0,x))); });
track.querySelectorAll('.spine').forEach(b=>b.addEventListener('click',e=>{ if(moved){ e.preventDefault(); return; } track.querySelectorAll('.spine').forEach(s=>s.classList.toggle('out',s===b));
  const p=P[+b.dataset.i], d=document.getElementById('detail'); d.hidden=false; d.classList.remove('in'); void d.offsetWidth; d.classList.add('in');
  d.innerHTML='<div class="muted" style="font-size:12px">'+p.t+' · '+p.stage+'</div><h2 class="display" style="font-size:22px;margin:4px 0">'+p.ep+'</h2><p class="muted" style="margin:0 0 10px">'+p.scene+' · '+p.when+'</p><div class="bar" style="margin-bottom:12px"><i style="width:'+p.pct+'%"></i></div><button class="btn btn-primary">打开</button>'; }));`,
};

/* ═══ P3 · 5 「今日」 — task feed: what needs you today, not what exists ═══ */
const p3Today = {
  name: '今日', axis: '信息结构：按今天要做的事组织',
  body: chrome('AIScript', `${nav('首页')}
  <main class="td"><div><div class="muted tnum">10 月 8 日 · 周三</div><h1 class="display" style="font-size:28px;margin:2px 0 0">今天有 3 件事等你</h1></div>
    <div class="td-grid">
      <section class="card td-col"><h2 class="h2">待处理</h2>
        ${[['导演意见', '第 1 集 v2 被否决：不用摔跤类笑点', '整理成规则'], ['未完成', '第 1 集第 4–8 场还没写', '继续写'], ['待选择', '第 3 集有 3 个故事走向', '去选']].map(([k, t, a]) => `<div class="task"><span class="chip" style="height:20px">${k}</span><div class="trunc" style="flex:1"><b>${t}</b></div><button class="btn btn-ghost" style="height:28px" onclick="this.closest('.task').classList.add('done');toast('${a}')">${a}</button></div>`).join('')}</section>
      <section class="card td-col"><h2 class="h2">今日热点 · 已按儿童 / 家庭 / 学校筛过</h2>
        ${[['开学季：小学生比谁的球鞋会亮', '品德'], ['午休偷偷刷短视频', '健康'], ['胡同里的共享单车停哪儿', '劳动']].map(([t, th]) => `<div class="task"><span class="chip" style="height:20px">${th}</span><div class="trunc" style="flex:1">${t}</div><button class="btn btn-quiet" style="height:28px" onclick="toast('已转成选题')">转成选题</button></div>`).join('')}</section>
      <section class="card td-col"><h2 class="h2">本周进度</h2>${PROJECTS.slice(0, 3).map((p) => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:13px"><span class="trunc">${p.ep}</span><span class="muted tnum">${p.stage}</span></div><div class="bar" style="margin-top:6px"><i style="width:${p.pct}%"></i></div></div>`).join('')}</section>
    </div></main>`),
  css: `${NAV_CSS}
.td{flex:1;overflow:auto;padding:32px 40px;display:flex;flex-direction:column;gap:20px}
.td-grid{display:grid;grid-template-columns:1.3fr 1.3fr 1fr;gap:16px;align-items:start}.td-col{padding:16px}
.h2{font-size:12.5px;color:var(--ink-3);font-weight:600;margin:0 0 10px}
.task{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--line);font-size:13.5px;transition:opacity 200ms ease}
.task.done{opacity:.4}.task.done b{text-decoration:line-through}`,
  js: '',
};

/* ═══ P7 · 2 「列表 + 预览」 — density + preview: Finder-like list, preview pane, arrow keys ═══ */
const p7List = {
  name: '列表 + 预览', axis: '密度：表格行 + 右侧预览，方向键浏览',
  body: chrome('AIScript', `${nav('剧本')}
  <main class="ls"><div class="ls-list" role="listbox" aria-label="剧本" tabindex="0" id="list">
      <div class="ls-head"><span>名称</span><span>阶段</span><span class="r">字数</span><span class="r">修改</span></div>
      ${PROJECTS.map((p, i) => `<div class="ls-row" role="option" data-i="${i}" aria-selected="${i === 0}"><span class="trunc"><b>${p.ep}</b> <span class="muted">· ${p.t}</span></span><span>${p.stage}</span><span class="r tnum">${p.words.toLocaleString()}</span><span class="r muted tnum">${p.when}</span></div>`).join('')}</div>
    <aside class="ls-prev" id="prev" aria-live="polite"></aside></main>`),
  css: `${NAV_CSS}
.ls{flex:1;display:grid;grid-template-columns:1fr 320px;min-width:0}
.ls-list{overflow:auto;outline:none;padding:12px}.ls-list:focus-visible{box-shadow:inset 0 0 0 2px var(--primary)}
.ls-head,.ls-row{display:grid;grid-template-columns:minmax(0,1fr) 64px 80px 96px;gap:12px;align-items:center;padding:0 12px}
.ls-head{height:30px;font-size:11.5px;color:var(--ink-3);font-weight:600}.r{text-align:right}
.ls-row{height:38px;border-radius:var(--r-sm);font-size:13px;cursor:default}
.ls-row[aria-selected=true]{background:var(--primary);color:var(--primary-fg)}.ls-row[aria-selected=true] .muted{color:inherit;opacity:.75}
.ls-prev{border-left:1px solid var(--line);padding:20px;display:flex;flex-direction:column;gap:10px;background:var(--sidebar)}
.ls-prev .page{min-height:0 !important;aspect-ratio:3/4;padding:24px 20px !important;font-size:10px;width:100%}`,
  js: String.raw`
const P=${JSON.stringify(PROJECTS)}; const list=document.getElementById('list'); let sel=0;
function show(i){ sel=i; list.querySelectorAll('.ls-row').forEach(r=>r.setAttribute('aria-selected',+r.dataset.i===i)); const p=P[i];   // keyboard selection: no animation
  document.getElementById('prev').innerHTML='<div class="page"><b style="font-size:12px">'+p.t+'</b><br><br>'+p.ep+'<br><br>'+p.scene+'</div><b>'+p.ep+'</b><div class="muted" style="font-size:12.5px">'+p.t+' · '+p.stage+' · '+p.words.toLocaleString()+' 字</div><div class="bar"><i style="width:'+p.pct+'%"></i></div><button class="btn btn-primary">打开</button>'; }
list.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'){ show(Math.min(sel+1,P.length-1)); e.preventDefault(); } if(e.key==='ArrowUp'){ show(Math.max(sel-1,0)); e.preventDefault(); } if(e.key==='Enter') toast('打开 '+P[sel].ep); });
list.querySelectorAll('.ls-row').forEach(r=>{ r.onclick=()=>show(+r.dataset.i); r.ondblclick=()=>toast('打开 '+P[+r.dataset.i].ep); });
show(0); list.focus();`,
};

/* ═══ P7 · 3 「看板」 — workflow status: columns by stage, drag a card to move it ═══ */
const p7Board = {
  name: '看板', axis: '组织方式：按创作阶段分列，可拖动',
  body: chrome('AIScript', `${nav('剧本')}
  <main class="kb">${STAGES.map((s) => `<section class="col" data-s="${s}"><h2 class="h2">${s} <span class="muted tnum" data-n></span></h2><div class="drop">${PROJECTS.filter((p) => p.stage === s).map((p) => `<div class="kcard card" tabindex="0"><b class="trunc" style="display:block">${p.ep}</b><span class="muted trunc" style="display:block;font-size:12px">${p.t}</span><div class="bar" style="margin-top:8px"><i style="width:${p.pct}%"></i></div></div>`).join('')}</div></section>`).join('')}</main>`),
  css: `${NAV_CSS}
.kb{flex:1;display:grid;grid-template-columns:repeat(5,minmax(180px,1fr));gap:12px;padding:24px;overflow:auto;align-items:start}
.col{background:var(--muted);border-radius:var(--r-xl);padding:10px;min-height:300px}.h2{font-size:13px;margin:4px 6px 10px;font-weight:600}
.drop{display:flex;flex-direction:column;gap:8px;min-height:240px}
.kcard{padding:12px;cursor:grab;touch-action:none;user-select:none;transition:transform 180ms var(--ease-enter),box-shadow 180ms ease}
.kcard.lift{position:fixed;z-index:50;cursor:grabbing;box-shadow:var(--shadow-pop);transform:rotate(2deg) scale(1.02);transition:none;pointer-events:none}
.ghost{border:1.5px dashed var(--line-strong);border-radius:var(--r-xl);background:transparent}`,
  js: String.raw`
function counts(){ document.querySelectorAll('.col').forEach(c=>c.querySelector('[data-n]').textContent=c.querySelectorAll('.kcard').length); }
let drag=null;
document.querySelectorAll('.kcard').forEach(card=>card.addEventListener('pointerdown',e=>{ if(drag) return; const r=card.getBoundingClientRect(); const ghost=document.createElement('div'); ghost.className='ghost'; ghost.style.height=r.height+'px';
  card.after(ghost); card.setPointerCapture(e.pointerId); card.classList.add('lift'); card.style.width=r.width+'px'; drag={card,ghost,dx:e.clientX-r.left,dy:e.clientY-r.top}; move(e); }));
function move(e){ if(!drag) return; drag.card.style.left=(e.clientX-drag.dx)+'px'; drag.card.style.top=(e.clientY-drag.dy)+'px';
  const col=document.elementsFromPoint(e.clientX,e.clientY).find(el=>el.classList&&el.classList.contains('col')); if(!col) return; const drop=col.querySelector('.drop');
  const after=[...drop.querySelectorAll('.kcard:not(.lift)')].find(c=>{ const b=c.getBoundingClientRect(); return e.clientY<b.top+b.height/2; }); after?drop.insertBefore(drag.ghost,after):drop.appendChild(drag.ghost); }
document.addEventListener('pointermove',move);
document.addEventListener('pointerup',()=>{ if(!drag) return; const {card,ghost}=drag; ghost.replaceWith(card); card.classList.remove('lift'); card.style.cssText=''; const s=card.closest('.col').dataset.s; drag=null; counts(); toast('已移到「'+s+'」'); });
counts();`,
};

/* ═══ P7 · 4 「时间流」 — recency: what happened, grouped by day ═══ */
const EVENTS = [['今天', [['16:42', 'AI 写完了第 1 集第 4–5 场', '门墩儿', '13 处修改'], ['16:20', '逐字稿完成：参考第1集.mp4', '门墩儿', '3,960 字'], ['15:31', '导演意见整理成规则：不用摔跤类笑点', '门墩儿', '规则 13 条']]], ['昨天', [['21:40', '第 3 集生成了 3 个故事走向', '门墩儿', '待选择'], ['18:05', '导出 第1集.fdx', '门墩儿', 'Final Draft']]], ['10 月 5 日', [['11:12', '第二稿完成', '夜班调度', '21,480 字']]]];
const p7Feed = {
  name: '时间流', axis: '组织方式：按发生时间，事件而不是文件',
  body: chrome('AIScript', `${nav('剧本')}
  <main class="fd"><h1 class="display" style="font-size:28px;margin:0 0 18px">最近发生的事</h1>
    ${EVENTS.map(([d, evs]) => `<section class="day"><h2 class="h2">${d}</h2><ol class="tl">${evs.map(([t, x, p, m]) => `<li><span class="muted tnum t">${t}</span><span class="dot" aria-hidden="true"></span><button class="ev"><b>${x}</b><span class="muted">${p} · ${m}</span></button></li>`).join('')}</ol></section>`).join('')}</main>`),
  css: `${NAV_CSS}
.fd{flex:1;overflow:auto;padding:32px 40px;max-width:820px}.h2{font-size:12.5px;color:var(--ink-3);font-weight:600;margin:18px 0 6px}
.tl{list-style:none;margin:0;padding:0}.tl li{display:grid;grid-template-columns:52px 18px 1fr;align-items:center;gap:8px}
.t{font-size:12px;text-align:right}.dot{width:8px;height:8px;border-radius:50%;background:var(--primary);justify-self:center;box-shadow:0 0 0 4px var(--primary-soft)}
.ev{display:flex;flex-direction:column;gap:2px;text-align:left;padding:10px 12px;border-radius:var(--r);font-size:13.5px;transition:background-color 150ms ease}
.ev span{font-size:12px}@media (hover:hover) and (pointer:fine){.ev:hover{background:var(--hover)}}
.tl li{animation:liIn 260ms var(--ease-enter) both}${[1, 2, 3, 4, 5, 6].map((i) => `.tl li:nth-child(${i}){animation-delay:${(i - 1) * 40}ms}`).join('')}
@keyframes liIn{from{opacity:0;transform:translateY(6px)}}@media (prefers-reduced-motion: reduce){.tl li{animation:none}}`,
  js: `document.querySelectorAll('.ev').forEach(b=>b.onclick=()=>toast('打开：'+b.querySelector('b').textContent));`,
};

/* ═══ P7 · 5 「封面墙」 — visual: big covers, scroll-snap carousel, centre one in focus ═══ */
const p7Covers = {
  name: '封面墙', axis: '视觉：大封面横向滑动，居中的放大',
  body: chrome('AIScript', `${nav('剧本')}
  <main class="cw"><h1 class="display" style="font-size:28px;margin:0">剧本</h1>
    <div class="car" id="car" tabindex="0" aria-label="剧本封面，左右方向键切换">${PROJECTS.map((p, i) => `<article class="cov" data-i="${i}"><div class="cov-art page"><b class="display" style="font-size:20px">${p.t}</b><span>${p.ep}</span><span class="muted tnum" style="margin-top:auto">${p.words.toLocaleString()} 字</span></div><div class="cov-cap"><b class="trunc" style="display:block">${p.ep}</b><span class="muted" style="font-size:12px">${p.stage} · ${p.when}</span></div></article>`).join('')}</div></main>`),
  css: `${NAV_CSS}
.cw{flex:1;min-width:0;padding:32px 0;display:flex;flex-direction:column;gap:18px}.cw h1{padding:0 40px}
.car{display:flex;gap:24px;overflow-x:auto;scroll-snap-type:x mandatory;padding:20px calc(50% - 120px);scrollbar-width:none;outline:none}.car::-webkit-scrollbar{display:none}
.cov{flex:none;width:240px;scroll-snap-align:center;transform:scale(.9);opacity:.6;transition:transform 220ms var(--ease-enter),opacity 220ms ease}
.cov.on{transform:none;opacity:1}
.cov-art{min-height:0 !important;aspect-ratio:3/4;width:100% !important;padding:32px 22px !important;display:flex;flex-direction:column;gap:8px;text-align:center;align-items:center;box-shadow:var(--shadow-pop) !important}
.cov-cap{padding:12px 4px}`,
  js: String.raw`
const car=document.getElementById('car'), covs=[...car.querySelectorAll('.cov')];
const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('on',e.intersectionRatio>.75)),{root:car,threshold:[.75]}); covs.forEach(c=>io.observe(c)); covs[0].classList.add('on');
car.addEventListener('keydown',e=>{ const i=covs.findIndex(c=>c.classList.contains('on')); const n=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:null; if(n==null||!covs[n]) return; e.preventDefault(); covs[n].scrollIntoView({inline:'center',block:'nearest',behavior:'auto'}); });
covs.forEach(c=>c.onclick=()=>c.classList.contains('on')?toast('打开'):c.scrollIntoView({inline:'center',block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
car.focus();`,
};

export const BROWSE = { p3: [p3Resume, p3Search, p3Shelf, p3Today], p7: [p7List, p7Board, p7Feed, p7Covers] };
