// Variants 2–5 for P5 (characters) and P6 (production / storyboard).
import { icon, chrome, rail } from '../src/pages.mjs';

const CH = [
  { n: '豆豆', role: '主角 · 三年级学生', age: 9, sc: 5, ln: 12, c: 'var(--color-b2-500)', line: '胆小，心细，只有他看得见门墩儿。', want: '不想被同学看不起', flaw: '遇事先躲', tic: '"那可说不准。"' },
  { n: '门墩儿', role: '石门墩里的小精灵', age: 120, sc: 4, ln: 9, c: 'var(--color-b1-500)', line: '嘴硬心软，能"借"不能"变"。', want: '再被人看见', flaw: '爱逞能', tic: '"借倒是能借。"' },
  { n: '姥爷', role: '修车铺师傅', age: 68, sc: 2, ln: 4, c: 'var(--color-b4-600)', line: '话少，手巧，记得胡同每一样东西。', want: '把老物件修好', flaw: '什么都不说', tic: '"慢点儿。"' },
  { n: '大壮', role: '同桌', age: 9, sc: 1, ln: 1, c: 'var(--color-b5-500)', line: '爱显摆，其实很怕输。', want: '被大家注意', flaw: '嘴快', tic: '"充一次电能亮一礼拜。"' },
  { n: '妈妈', role: '护士 · 常值夜班', age: 38, sc: 1, ln: 3, c: 'var(--color-warning-500)', line: '忙，但每件小事都记得。', want: '多陪豆豆', flaw: '累了就讲道理', tic: '"吃饭了吗？"' },
];
const REL = [[0, 1, '只有他看得见'], [0, 2, '祖孙'], [0, 3, '同桌 · 较劲'], [0, 4, '母子'], [1, 2, '老相识？'], [2, 4, '父女']];
const shell = (title, inner) => chrome(`AIScript — ${title}`, `${rail('角色')}<section class="center">${inner}</section>`);

/* ═══ P5 · 2 「关系图」 — relational: drag nodes, edges follow, click for detail ═══ */
const p5Graph = {
  name: '关系图', axis: '关注点：人物之间的关系，节点可拖动',
  body: shell('角色关系', `<div class="center-hd"><b>角色关系</b><span class="muted" style="font-size:12px">拖动人物调整位置 · 点击看详情</span></div>
    <div class="gr" id="gr"><svg class="edges" id="edges" aria-hidden="true"></svg>
      ${CH.map((c, i) => `<button class="node" data-i="${i}" style="--c:${c.c}" aria-label="${c.n}，${c.role}"><span class="av">${c.n[0]}</span><b>${c.n}</b></button>`).join('')}
      <aside class="gd card" id="gd" hidden></aside></div>`),
  css: `.gr{position:relative;flex:1;overflow:hidden;background-image:radial-gradient(var(--line-strong) 1px,transparent 1px);background-size:20px 20px;touch-action:none}
.edges{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.node{position:absolute;left:0;top:0;display:flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:999px;background:var(--surface);box-shadow:var(--shadow-card);cursor:grab;touch-action:none;transition:box-shadow 150ms ease}
.node.drag{cursor:grabbing;box-shadow:var(--shadow-pop)}.node.sel{box-shadow:0 0 0 2px var(--c),var(--shadow-pop)}
.av{width:32px;height:32px;border-radius:50%;background:var(--c);color:#fff;display:grid;place-items:center;font-weight:700}
.gd{position:absolute;right:16px;top:16px;width:260px;padding:16px;transform-origin:top right;animation:gdIn 200ms var(--ease-enter) both}@keyframes gdIn{from{opacity:0;transform:scale(.96)}}
@media (prefers-reduced-motion: reduce){.gd{animation:none}}`,
  js: String.raw`
const C=${JSON.stringify(CH)}, R=${JSON.stringify(REL)}; const gr=document.getElementById('gr'), svg=document.getElementById('edges'), nodes=[...gr.querySelectorAll('.node')];
const pos=[[.42,.45],[.18,.22],[.68,.22],[.2,.72],[.72,.7]].map(([x,y])=>[x,y]);
function place(){ const W=gr.clientWidth,H=gr.clientHeight; nodes.forEach((n,i)=>n.style.transform='translate('+(pos[i][0]*W-50)+'px,'+(pos[i][1]*H-22)+'px)'); edges(); }
function center(i){ const r=nodes[i].getBoundingClientRect(), g=gr.getBoundingClientRect(); return [r.left-g.left+r.width/2, r.top-g.top+r.height/2]; }
function edges(){ svg.innerHTML=R.map(([a,b,l])=>{ const [x1,y1]=center(a),[x2,y2]=center(b); return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="var(--line-strong)" stroke-width="1.5"/><text x="'+(x1+x2)/2+'" y="'+((y1+y2)/2-6)+'" text-anchor="middle" font-size="11" fill="var(--ink-3)">'+l+'</text>'; }).join(''); }
let drag=null;
nodes.forEach((n,i)=>{ n.addEventListener('pointerdown',e=>{ if(drag) return; drag={i,sx:e.clientX,sy:e.clientY,p:[...pos[i]],moved:false}; n.setPointerCapture(e.pointerId); n.classList.add('drag'); });
  n.addEventListener('pointermove',e=>{ if(!drag||drag.i!==i) return; const dx=e.clientX-drag.sx, dy=e.clientY-drag.sy; if(Math.hypot(dx,dy)>3) drag.moved=true;
    pos[i]=[Math.min(.95,Math.max(.05,drag.p[0]+dx/gr.clientWidth)), Math.min(.95,Math.max(.06,drag.p[1]+dy/gr.clientHeight))]; place(); });
  n.addEventListener('pointerup',()=>{ if(!drag) return; n.classList.remove('drag'); const moved=drag.moved; drag=null; if(!moved) detail(i); }); });
function detail(i){ nodes.forEach((n,j)=>n.classList.toggle('sel',j===i)); const c=C[i], d=document.getElementById('gd'); d.hidden=false; d.style.animation='none'; void d.offsetWidth; d.style.animation='';
  d.innerHTML='<b style="font-size:16px">'+c.n+'</b><div class="muted" style="font-size:12px;margin-bottom:8px">'+c.role+' · '+c.age+' 岁</div><p style="margin:0 0 8px;font-size:13px">'+c.line+'</p>'+R.filter(r=>r[0]===i||r[1]===i).map(r=>'<div style="font-size:12.5px;padding:4px 0;border-top:1px solid var(--line)">'+C[r[0]===i?r[1]:r[0]].n+' · <span class="muted">'+r[2]+'</span></div>').join(''); }
addEventListener('resize',place); requestAnimationFrame(place); setTimeout(place,60);`,
};

/* ═══ P5 · 3 「表格」 — density: sortable table, double-click a cell to edit in place ═══ */
const p5Table = {
  name: '表格', axis: '密度：一屏看全部人物，可排序、就地编辑',
  body: shell('角色表', `<div class="center-hd"><b>角色 · ${CH.length}</b><span class="muted" style="font-size:12px">点表头排序 · 双击单元格编辑</span><span style="flex:1"></span><button class="btn btn-primary" style="height:28px" onclick="addRow()">${icon('plus', 13)} 新角色</button></div>
    <div style="overflow:auto;padding:16px"><table class="tb" id="tb"><thead><tr>${[['n', '姓名'], ['role', '身份'], ['age', '年龄'], ['sc', '出场'], ['ln', '台词'], ['line', '一句话']].map(([k, t]) => `<th><button data-k="${k}">${t}<span class="arr" aria-hidden="true"></span></button></th>`).join('')}</tr></thead><tbody></tbody></table></div>`),
  css: `.tb{width:100%;border-collapse:collapse;font-size:13.5px}
.tb th{text-align:left;font-size:12px;color:var(--ink-3);font-weight:600;border-bottom:1px solid var(--line-strong)}.tb th button{display:flex;gap:4px;align-items:center;height:34px;padding:0 10px;width:100%}
.tb td{padding:0 10px;height:40px;border-bottom:1px solid var(--line);max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tb td.num{text-align:right;font-variant-numeric:tabular-nums}.tb th:nth-child(3) button,.tb th:nth-child(4) button,.tb th:nth-child(5) button{justify-content:flex-end}
.tb td input{width:100%;height:30px;font-size:16px;border:1px solid var(--primary);border-radius:var(--r-sm);padding:0 6px;background:var(--paper)}
.sw{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px;vertical-align:1px}
@media (hover:hover) and (pointer:fine){.tb tbody tr:hover{background:var(--hover)}}`,
  js: String.raw`
let rows=${JSON.stringify(CH)}, key='sc', dir=-1; const tbody=document.querySelector('#tb tbody'); const NUM=['age','sc','ln'];
function render(){ rows.sort((a,b)=>(a[key]>b[key]?1:a[key]<b[key]?-1:0)*dir);
  document.querySelectorAll('th button').forEach(b=>{ b.querySelector('.arr').textContent=b.dataset.k===key?(dir>0?'↑':'↓'):''; b.closest('th').setAttribute('aria-sort',b.dataset.k===key?(dir>0?'ascending':'descending'):'none'); });
  tbody.innerHTML=rows.map((r,i)=>'<tr>'+['n','role','age','sc','ln','line'].map(k=>'<td class="'+(NUM.includes(k)?'num':'')+'" data-r="'+i+'" data-k="'+k+'">'+(k==='n'?'<span class="sw" style="background:'+r.c+'"></span>':'')+r[k]+'</td>').join('')+'</tr>').join(''); }
document.querySelectorAll('th button').forEach(b=>b.onclick=()=>{ dir=key===b.dataset.k?-dir:1; key=b.dataset.k; render(); });
tbody.addEventListener('dblclick',e=>{ const td=e.target.closest('td'); if(!td) return; const r=rows[+td.dataset.r], k=td.dataset.k; const inp=document.createElement('input'); inp.value=r[k]; td.innerHTML=''; td.appendChild(inp); inp.focus(); inp.select();
  const commit=ok=>{ if(ok){ r[k]=NUM.includes(k)?(+inp.value||0):inp.value; toast('已保存'); } render(); };
  inp.onkeydown=ev=>{ if(ev.key==='Enter') commit(true); if(ev.key==='Escape') commit(false); }; inp.onblur=()=>commit(true); });
function addRow(){ rows.push({n:'新角色',role:'—',age:0,sc:0,ln:0,line:'双击编辑',c:'var(--ink-3)'}); key='sc'; dir=1; render(); }
render();`,
};

/* ═══ P5 · 4 「人物小传」 — depth: one character at a time, full profile ═══ */
const p5Sheet = {
  name: '人物小传', axis: '深度：一次只看一个人，写透他',
  body: shell('人物小传', `<div class="ps"><nav class="ps-list" aria-label="角色">${CH.map((c, i) => `<button data-i="${i}" ${i === 0 ? 'aria-current="true"' : ''}><span class="av" style="background:${c.c}">${c.n[0]}</span><span><b>${c.n}</b><br><span class="muted" style="font-size:12px">${c.role}</span></span></button>`).join('')}</nav>
    <article class="ps-main" id="pm" aria-live="polite"></article></div>`),
  css: `.ps{flex:1;display:grid;grid-template-columns:220px 1fr;min-height:0}
.ps-list{border-right:1px solid var(--line);padding:10px;display:flex;flex-direction:column;gap:2px;overflow:auto}
.ps-list button{display:flex;gap:10px;align-items:center;padding:8px;border-radius:var(--r);text-align:left}.ps-list button[aria-current]{background:var(--surface);box-shadow:var(--shadow-card)}
.av{width:34px;height:34px;border-radius:50%;color:#fff;display:grid;place-items:center;font-weight:700;flex:none}
.ps-main{overflow:auto;padding:36px 48px;max-width:760px}.ps-main h1{font-size:34px;margin:0}
.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0}.facts .card{padding:14px}.facts .k{font-size:11.5px;color:var(--ink-3);font-weight:600}
.timeline{display:flex;gap:4px;margin-top:8px}.timeline i{flex:1;height:22px;border-radius:4px;background:var(--muted)}.timeline i.on{background:var(--primary)}
.ps-main p{line-height:1.8;max-width:65ch}`,
  js: String.raw`
const C=${JSON.stringify(CH)};
function show(i){ document.querySelectorAll('.ps-list button').forEach(b=>b.toggleAttribute('aria-current',+b.dataset.i===i)); const c=C[i];
  document.getElementById('pm').innerHTML='<div class="muted">'+c.role+' · '+c.age+' 岁</div><h1 class="display">'+c.n+'</h1><p>'+c.line+'</p>'+
  '<div class="facts">'+[['想要',c.want],['缺点',c.flaw],['口头禅',c.tic]].map(([k,v])=>'<div class="card"><div class="k">'+k+'</div><div style="margin-top:4px">'+v+'</div></div>').join('')+'</div>'+
  '<div class="k muted" style="font-size:12px;font-weight:600">出场 · 第 1 集 5 场</div><div class="timeline">'+[0,1,2,3,4].map(s=>'<i class="'+(s<c.sc?'on':'')+'" title="第 '+(s+1)+' 场"></i>').join('')+'</div>'+
  '<div style="display:flex;gap:8px;margin-top:22px"><button class="btn btn-primary" onclick="toast(\'在对话里：请 AI 补全'+c.n+'的小传\')">让 AI 补全小传</button><button class="btn btn-ghost">编辑</button></div>'; }
document.querySelectorAll('.ps-list button').forEach(b=>b.onclick=()=>show(+b.dataset.i));
document.querySelector('.ps-list').addEventListener('keydown',e=>{ const cur=[...document.querySelectorAll('.ps-list button')].findIndex(b=>b.hasAttribute('aria-current')); const n=e.key==='ArrowDown'?cur+1:e.key==='ArrowUp'?cur-1:-1; if(C[n]){ e.preventDefault(); show(n); document.querySelectorAll('.ps-list button')[n].focus(); } });
show(0);`,
};

/* ═══ P5 · 5 「选角板」 — visual casting: portrait cards flip to the casting notes ═══ */
const p5Cast = {
  name: '选角板', axis: '视觉：大肖像卡，点击翻面看选角备注',
  body: shell('选角板', `<div class="center-hd"><b>选角板</b><span class="muted" style="font-size:12px">点击卡片翻面 · 空格也可以</span></div>
    <div class="cb">${CH.map((c, i) => `<button class="flip" data-i="${i}" aria-pressed="false" aria-label="${c.n}，点击查看选角备注"><span class="face front" style="--c:${c.c}"><span class="portrait">${c.n[0]}</span><b>${c.n}</b><span class="muted" style="font-size:12px">${c.role}</span></span>
      <span class="face back"><b>${c.n} · 选角备注</b><span style="font-size:12.5px;line-height:1.7">声音：${['清亮、略带鼻音', '老成、语速快', '低沉、少话', '大嗓门', '温和、疲惫'][i]}<br>参考年龄：${c.age > 100 ? '外表 8 岁' : c.age + ' 岁'}<br>${c.line}</span><span class="chip" style="height:22px;align-self:flex-start">${c.sc} 场 · ${c.ln} 句</span></span></button>`).join('')}</div>`),
  css: `.cb{flex:1;overflow:auto;padding:32px;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:22px;align-content:start;perspective:1200px}
.flip{position:relative;height:300px;transform-style:preserve-3d;transition:transform 280ms var(--ease-in-out,cubic-bezier(.77,0,.175,1));border-radius:var(--r-xl)}
.flip[aria-pressed=true]{transform:rotateY(180deg)}
.face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:var(--r-xl);background:var(--surface);box-shadow:var(--shadow-card);display:flex;flex-direction:column;gap:8px;padding:16px;text-align:left}
.front{align-items:center;justify-content:flex-end;text-align:center}.back{transform:rotateY(180deg);justify-content:space-between}
.portrait{flex:1;width:100%;border-radius:calc(var(--r-xl) - 8px);background:linear-gradient(160deg,var(--c),color-mix(in oklch,var(--c) 60%,black));color:#fff;display:grid;place-items:center;font-size:56px;font-family:var(--font-display)}
@media (hover:hover) and (pointer:fine){.flip:not([aria-pressed=true]):hover{transform:translateY(-4px)}}
@media (prefers-reduced-motion: reduce){.flip{transition:none}}`,
  js: `document.querySelectorAll('.flip').forEach(f=>f.onclick=()=>f.setAttribute('aria-pressed',f.getAttribute('aria-pressed')!=='true'));`,
};

/* ── P6 data ── */
const SHOTS = [
  ['1', '全景', '固定', 4, '胡同口，傍晚的光斜着照进来', ''], ['2', '中景', '推', 3, '豆豆蹲在门墩儿旁，捏着开胶的鞋头', ''],
  ['3', '特写', '固定', 2, '鞋头一张一合', ''], ['4', '近景', '摇', 3, '门墩儿从石头里探出半个脑袋', '别捏了，它要说话你也拦不住。'],
  ['5', '中景', '固定', 3, '豆豆吓得往后一坐', '石头……石头说话了？'], ['6', '特写', '推', 4, '门墩儿得意地眨眼', '在这儿蹲了一百多年，头一回有人看得见我。'],
];
const pshell = (inner) => chrome('AIScript — 制作', `${rail('制作')}<section class="center">${inner}</section>`);

/* ═══ P6 · 2 「时间线」 — time: shots as blocks sized by duration, drag the edge to retime ═══ */
const p6Time = {
  name: '时间线', axis: '维度：时间——镜头宽度就是时长，拖边改时长',
  body: pshell(`<div class="center-hd"><b>第 1 场 · 胡同口</b><span class="muted tnum" id="total"></span><span style="flex:1"></span><span class="muted" style="font-size:12px">拖动镜头右边缘调整时长</span></div>
    <div class="tl-wrap"><div class="ruler" id="ruler"></div><div class="lane" id="lane">${SHOTS.map(([n, s, m, d, x]) => `<div class="blk" data-d="${d}" tabindex="0"><span class="tnum"><b>${n}</b> ${s} · ${m}</span><span class="muted trunc">${x}</span><span class="dur tnum">${d}s</span><span class="grip" aria-hidden="true"></span></div>`).join('')}</div>
      <div class="sel card" id="sel">选一个镜头，用 <span class="kbd">←</span><span class="kbd">→</span> 也能调整时长</div></div>`),
  css: `.tl-wrap{flex:1;overflow:auto;padding:24px}.ruler{position:relative;height:20px;font-size:11px;color:var(--ink-3)}
.lane{display:flex;gap:3px;height:96px}
.blk{position:relative;flex:none;height:100%;border-radius:var(--r);background:var(--surface);box-shadow:var(--shadow-card);padding:8px 10px;display:flex;flex-direction:column;gap:4px;font-size:12px;overflow:hidden;outline:none}
.blk:focus-visible,.blk.on{box-shadow:0 0 0 2px var(--primary)}
.blk .dur{margin-top:auto;font-weight:600}.grip{position:absolute;right:0;top:0;bottom:0;width:10px;cursor:ew-resize;touch-action:none}
.grip::after{content:"";position:absolute;right:3px;top:50%;width:3px;height:22px;margin-top:-11px;border-radius:2px;background:var(--line-strong)}
.trunc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sel{margin-top:16px;padding:12px;font-size:13px}`,
  js: String.raw`
const PX=60, lane=document.getElementById('lane'), blks=[...lane.querySelectorAll('.blk')];
function layout(){ let t=0; blks.forEach(b=>{ const d=+b.dataset.d; b.style.width=(d*PX-3)+'px'; b.querySelector('.dur').textContent=d+'s'; t+=d; });
  document.getElementById('total').textContent='共 '+t+' 秒'; document.getElementById('ruler').innerHTML=Array.from({length:t+1},(_,i)=>'<span style="position:absolute;left:'+(i*PX)+'px">'+(i%5===0?i+'s':'·')+'</span>').join(''); }
blks.forEach(b=>{ const g=b.querySelector('.grip'); let s=null;
  g.addEventListener('pointerdown',e=>{ s={x:e.clientX,d:+b.dataset.d}; g.setPointerCapture(e.pointerId); e.stopPropagation(); });
  g.addEventListener('pointermove',e=>{ if(!s) return; b.dataset.d=Math.max(1,Math.min(15,Math.round(s.d+(e.clientX-s.x)/PX))); layout(); });   // snaps to whole seconds
  g.addEventListener('pointerup',()=>{ if(s) toast('镜头 '+b.querySelector('b').textContent+' 改为 '+b.dataset.d+' 秒'); s=null; });
  b.addEventListener('click',()=>{ blks.forEach(x=>x.classList.toggle('on',x===b)); b.focus(); document.getElementById('sel').textContent=b.querySelector('.trunc').textContent; });
  b.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'||e.key==='ArrowLeft'){ b.dataset.d=Math.max(1,Math.min(15,+b.dataset.d+(e.key==='ArrowRight'?1:-1))); layout(); e.preventDefault(); } }); });
layout();`,
};

/* ═══ P6 · 3 「漫画分格」 — print: comic-style panels with captions, generate one frame ═══ */
const p6Comic = {
  name: '漫画分格', axis: '形式：像纸面分镜本，一格一镜',
  body: pshell(`<div class="center-hd"><b>分镜本 · 第 1 场</b><span style="flex:1"></span><button class="btn btn-primary" style="height:28px" onclick="genAll()">${icon('spark', 13)} 生成全部画面</button></div>
    <div class="cm">${SHOTS.map(([n, s, m, d, x, l]) => `<figure class="panel"><div class="frame" data-n="${n}"><span class="shot tnum">${n}</span><button class="btn btn-ghost gen" onclick="gen(this)">生成画面</button></div><figcaption><b>${s} · ${m} · <span class="tnum">${d}s</span></b><br>${x}${l ? `<br><span class="dlg">「${l}」</span>` : ''}</figcaption></figure>`).join('')}</div>`),
  css: `.cm{flex:1;overflow:auto;padding:28px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px 18px;max-width:1100px}
.panel{margin:0}.frame{position:relative;aspect-ratio:16/9;border:2px solid var(--ink);background:var(--paper);display:grid;place-items:center;overflow:hidden}
.shot{position:absolute;left:6px;top:4px;font-family:var(--font-family-mono);font-size:12px;font-weight:700}
.frame.done{background:linear-gradient(160deg, color-mix(in oklch,var(--primary) 30%,white), color-mix(in oklch,var(--color-b4-500) 35%,white));}
.frame.loading::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgb(255 255 255 / .55),transparent 70%);animation:sh 900ms linear infinite}
@keyframes sh{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
figcaption{font-family:var(--font-script);font-size:12.5px;line-height:1.6;margin-top:8px}.dlg{color:var(--ink-2)}
@media (prefers-reduced-motion: reduce){.frame.loading::after{animation:none;opacity:.4}}`,
  js: String.raw`
async function gen(btn){ const f=btn.closest('.frame'); btn.remove(); f.classList.add('loading'); await wait(900+Math.random()*500); f.classList.remove('loading'); f.classList.add('done'); }
function genAll(){ document.querySelectorAll('.gen').forEach((b,i)=>setTimeout(()=>b.isConnected&&gen(b),i*120)); }`,
};

/* ═══ P6 · 4 「镜头表」 — production document: the shot list a crew actually uses ═══ */
const p6List = {
  name: '镜头表', axis: '用途：给拍摄 / 动画团队的生产文档',
  body: pshell(`<div class="center-hd"><b>镜头表 · 第 1 场</b><span class="muted tnum" id="sum"></span><span style="flex:1"></span><button class="btn btn-ghost" style="height:28px" onclick="toast('已导出 镜头表.csv')">${icon('export', 13)} 导出 CSV</button><button class="btn btn-primary" style="height:28px" onclick="add()">${icon('plus', 13)} 加一镜</button></div>
    <div style="overflow:auto;padding:16px"><table class="sl"><thead><tr><th>镜号</th><th>景别</th><th>运镜</th><th class="r">时长</th><th>画面</th><th>台词</th></tr></thead><tbody id="tb"></tbody></table></div>`),
  css: `.sl{width:100%;border-collapse:collapse;font-size:13px}.sl th{text-align:left;font-size:12px;color:var(--ink-3);font-weight:600;padding:8px 10px;border-bottom:1px solid var(--line-strong)}
.sl td{padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}.r{text-align:right}.sl td.r,.sl td:first-child{font-variant-numeric:tabular-nums}
.sl select{height:30px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--paper);padding:0 6px;font-size:16px}
.sl tr.new{animation:rowIn 220ms var(--ease-enter) both}@keyframes rowIn{from{opacity:0;transform:translateY(-4px)}}
.dl{font-family:var(--font-script);color:var(--ink-2)}`,
  js: String.raw`
let S=${JSON.stringify(SHOTS)}; const tb=document.getElementById('tb');
function sel(v,opts,i,k){ return '<select data-i="'+i+'" data-k="'+k+'" aria-label="'+(k===1?'景别':'运镜')+'">'+opts.map(o=>'<option'+(o===v?' selected':'')+'>'+o+'</option>').join('')+'</select>'; }
function render(newIdx){ tb.innerHTML=S.map((s,i)=>'<tr class="'+(i===newIdx?'new':'')+'"><td>'+s[0]+'</td><td>'+sel(s[1],['远景','全景','中景','近景','特写'],i,1)+'</td><td>'+sel(s[2],['固定','推','拉','摇','移','跟'],i,2)+'</td><td class="r">'+s[3]+'s</td><td>'+s[4]+'</td><td class="dl">'+(s[5]||'—')+'</td></tr>').join('');
  document.getElementById('sum').textContent=S.length+' 镜 · '+S.reduce((a,s)=>a+s[3],0)+' 秒';
  tb.querySelectorAll('select').forEach(x=>x.onchange=()=>{ S[+x.dataset.i][+x.dataset.k]=x.value; toast('已更新镜头 '+S[+x.dataset.i][0]); }); }
function add(){ S.push([String(S.length+1),'中景','固定',3,'新镜头 · 描述画面','']); render(S.length-1); }
render();`,
};

/* ═══ P6 · 5 「设置向导」 — guided setup: production settings as three big choices ═══ */
const STYLES = [['二维手绘 · 温暖', 'var(--color-b2-500)'], ['胡同水彩', 'var(--color-b4-600)'], ['定格黏土', 'var(--color-b5-500)'], ['剪纸皮影', 'var(--color-b1-500)']];
const p6Wiz = {
  name: '设置向导', axis: '节奏：一次只做一个制作决定',
  body: pshell(`<main class="pw"><ol class="pw-steps">${['画幅', '制作类型', '美术风格'].map((t, i) => `<li data-s="${i}">${t}</li>`).join('')}</ol>
    <section class="pw-body" id="pb" aria-live="polite"></section>
    <div class="pw-nav"><button class="btn btn-ghost" id="back">上一步</button><span style="flex:1"></span><button class="btn btn-primary" id="next">下一步</button></div></main>`),
  css: `.pw{flex:1;display:flex;flex-direction:column;align-items:center;padding:36px 24px;gap:22px}
.pw-steps{display:flex;gap:6px;list-style:none;padding:0;margin:0}.pw-steps li{padding:6px 12px;border-radius:999px;font-size:13px;color:var(--ink-3);background:var(--muted)}
.pw-steps li[data-on]{background:var(--primary);color:var(--primary-fg)}.pw-steps li[data-done]{color:var(--ink)}
.pw-body{width:min(760px,100%)}.pw-body h1{font-size:28px;margin:0 0 4px}
.opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-top:18px}
.opt{position:relative;border-radius:var(--r-xl);background:var(--surface);box-shadow:var(--shadow-card);padding:12px;text-align:left;display:flex;flex-direction:column;gap:10px;transition:transform 150ms var(--ease-enter)}
.opt:active{transform:scale(.98)}.opt[aria-checked=true]{box-shadow:0 0 0 2px var(--primary),var(--shadow-card)}
.opt .pv{border-radius:calc(var(--r-xl) - 6px);background:var(--muted);display:grid;place-items:center;color:var(--ink-3)}
.opt .ck{position:absolute;right:10px;top:10px;width:20px;height:20px;border-radius:50%;background:var(--primary);color:var(--primary-fg);display:grid;place-items:center;font-size:11px;clip-path:circle(0)}
.opt[aria-checked=true] .ck{clip-path:circle(50%);transition:clip-path 200ms var(--ease-enter)}
.pw-nav{display:flex;width:min(760px,100%)}`,
  js: String.raw`
const STEPS=[{t:'画幅',d:'开始制作后不可更改。',o:[['横屏 16:9','aspect-ratio:16/9'],['竖屏 9:16','aspect-ratio:9/16;width:45%;margin:0 auto']]},{t:'制作类型',d:'决定节奏和镜头语言。',o:[['叙事','aspect-ratio:4/3'],['商业','aspect-ratio:4/3']]},{t:'美术风格',d:'每一场、每张分镜都会遵循它。',o:${JSON.stringify(STYLES)}.map(([n,c])=>[n,'aspect-ratio:4/3;background:linear-gradient(140deg,'+c+',color-mix(in oklch,'+c+' 55%,black))'])}];
let s=0; const pick=[0,0,0];
function render(){ const st=STEPS[s]; document.querySelectorAll('.pw-steps li').forEach(li=>{ const i=+li.dataset.s; li.toggleAttribute('data-on',i===s); li.toggleAttribute('data-done',i<s); });
  document.getElementById('pb').innerHTML='<h1 class="display">'+st.t+'</h1><p class="muted" style="margin:0">'+st.d+'</p><div class="opts" role="radiogroup" aria-label="'+st.t+'">'+st.o.map(([n,css],i)=>'<button class="opt" role="radio" aria-checked="'+(pick[s]===i)+'" data-i="'+i+'"><span class="ck">✓</span><span class="pv" style="'+css+'"></span><b>'+n+'</b></button>').join('')+'</div>';
  document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ pick[s]=+b.dataset.i; document.querySelectorAll('.opt').forEach(x=>x.setAttribute('aria-checked',x===b)); });
  document.getElementById('back').disabled=s===0; document.getElementById('next').textContent=s===2?'确认并开始制作':'下一步'; }
document.getElementById('back').onclick=()=>{ if(s>0){ s--; render(); } };
document.getElementById('next').onclick=()=>{ if(s<2){ s++; render(); } else toast('已保存：'+STEPS.map((st,i)=>st.o[pick[i]][0]).join(' · ')); };
render();`,
};

export const MAKE = { p5: [p5Graph, p5Table, p5Sheet, p5Cast], p6: [p6Time, p6Comic, p6List, p6Wiz] };
