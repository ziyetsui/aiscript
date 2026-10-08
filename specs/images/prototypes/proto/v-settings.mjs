// Variants 2–5 for P8 (settings). Same real settings in every variant: activation, Ancher key (required),
// Gemini key (optional), editor (font, typing, sound), default export format, project data.
import { chrome } from '../src/pages.mjs';

const ITEMS = [
  { g: '激活与授权', k: 'act', t: '激活状态', v: '已激活 · 北京 1 / 3', d: '激活码 AIS-7K3F-••••-••••-B8NC · 本机 AS-7K3F-9Q2M' },
  { g: '模型与密钥', k: 'ancher', t: 'Ancher API key', v: '已连接', d: '必填 · 对话、联网搜索、解析、检索', input: 'ak_live_J-3m_demo' },
  { g: '模型与密钥', k: 'gemini', t: 'Gemini API key', v: '未添加', d: '可选 · 用于视频 / 音频转写', input: '' },
  { g: '编辑器', k: 'font', t: '剧本字体', v: '打字机', d: 'Courier + 仿宋', choices: ['打字机', '宋体', '系统字体'] },
  { g: '编辑器', k: 'typing', t: 'AI 写作时逐字打出', v: true, d: '"减少动态效果"开启时整段出现', toggle: true },
  { g: '编辑器', k: 'sound', t: '打字机音效', v: true, d: '按键声、换行声，写完"叮"一下', toggle: true },
  { g: '导出', k: 'fmt', t: '默认导出格式', v: 'PDF', d: '', choices: ['PDF', 'Final Draft', 'Fountain', 'Word', 'TXT'] },
  { g: '项目数据', k: 'data', t: '项目文件夹', v: '~/AIScript', d: '剧本、规则库、逐字稿都在本机' },
];
const SET_JS = String.raw`const ITEMS=${JSON.stringify(ITEMS)}; const S=Object.fromEntries(ITEMS.map(i=>[i.k,i.v]));
async function verify(k,val){ await wait(600); return k==='ancher'?/^ak_live_/.test(val):val.trim().length>10; }
function control(it){ if(it.toggle) return '<label class="tg"><input type="checkbox" data-k="'+it.k+'" '+(S[it.k]?'checked':'')+'><span class="tg-ui" aria-hidden="true"></span><span class="sr">'+it.t+'</span></label>';
  if(it.choices) return '<select class="sel" data-k="'+it.k+'" aria-label="'+it.t+'">'+it.choices.map(c=>'<option'+(c===S[it.k]?' selected':'')+'>'+c+'</option>').join('')+'</select>';
  if('input' in it) return '<form class="keyf" data-k="'+it.k+'"><input class="input mono" type="password" value="'+it.input+'" placeholder="'+(it.k==='ancher'?'ak_live_…':'粘贴 Gemini key')+'" aria-label="'+it.t+'" autocomplete="off" spellcheck="false"><button class="btn btn-ghost" style="height:40px">验证并保存</button><span class="kmsg muted" aria-live="polite"></span></form>';
  if(it.k==='data') return '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost" onclick="toast(\'已导出 门墩儿.aiscript\')">导出项目</button><button class="btn btn-ghost">导入</button></div>';
  return '<span class="muted">'+it.v+'</span>'; }
function wire(root){ root.querySelectorAll('input[type=checkbox][data-k]').forEach(c=>c.onchange=()=>{ S[c.dataset.k]=c.checked; toast((c.checked?'已开启：':'已关闭：')+ITEMS.find(i=>i.k===c.dataset.k).t); window.onSetting&&onSetting(); });
  root.querySelectorAll('select[data-k]').forEach(s=>s.onchange=()=>{ S[s.dataset.k]=s.value; toast('已设为 '+s.value); window.onSetting&&onSetting(); });
  root.querySelectorAll('form.keyf').forEach(f=>f.onsubmit=async e=>{ e.preventDefault(); const m=f.querySelector('.kmsg'), v=f.querySelector('input').value; m.textContent='正在验证…'; const ok=await verify(f.dataset.k,v);
    m.innerHTML=ok?'<span style="color:var(--color-success-500)">✓ 已连接</span>':'<span style="color:var(--color-danger-500)">✕ '+(f.dataset.k==='ancher'?'应以 ak_live_ 开头':'key 太短')+'</span>'; if(ok){ S[f.dataset.k]='已连接'; window.onSetting&&onSetting(); } }); }`;
const CTRL_CSS = `.tg{position:relative;display:inline-flex;align-items:center;cursor:pointer}.tg input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.tg-ui{width:40px;height:24px;border-radius:999px;background:var(--line-strong);position:relative;transition:background-color 150ms ease}
.tg-ui::after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgb(0 0 0 / .2);transition:transform 180ms var(--ease-enter)}
.tg input:checked+.tg-ui{background:var(--primary)}.tg input:checked+.tg-ui::after{transform:translateX(16px)}
.tg input:focus-visible+.tg-ui{outline:2px solid var(--ink-3);outline-offset:2px}
.sel{height:36px;border-radius:var(--r);border:1px solid var(--line-strong);background:var(--paper);padding:0 10px;font-size:16px}
.keyf{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.keyf .input{flex:1;min-width:220px}.mono{font-family:var(--font-family-mono)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`;

/* ═══ P8 · 2 「分组列表」 — native grouped list: rows drill into a detail view ═══ */
const p8Grouped = {
  name: '分组列表', axis: '导航：系统设置式分组，点进下一层',
  body: chrome('AIScript — 设置', `<main class="gl"><div class="gl-view" id="root"></div><div class="gl-view" id="detail" hidden></div></main>`),
  css: `${CTRL_CSS}
.gl{flex:1;overflow:auto;padding:32px 24px;display:flex;justify-content:center}.gl-view{width:min(620px,100%)}
.grp-t{font-size:12px;color:var(--ink-3);font-weight:600;margin:20px 12px 6px;letter-spacing:.04em}
.grp{border-radius:var(--r-xl);background:var(--surface);box-shadow:var(--shadow-card);overflow:hidden}
.row{display:flex;align-items:center;gap:12px;min-height:48px;padding:0 16px;width:100%;text-align:left;font-size:14.5px}
.row+.row{box-shadow:inset 0 1px 0 var(--line)}.row .v{margin-left:auto;color:var(--ink-3);font-size:13.5px}.row .chev{color:var(--ink-3)}
button.row:active{background:var(--hover)}@media (hover:hover) and (pointer:fine){button.row:hover{background:var(--hover)}}
.gl-view.push{animation:push 260ms var(--ease-drawer) both}.gl-view.pop{animation:pop 220ms var(--ease-drawer) both}
@keyframes push{from{transform:translateX(30%);opacity:0}}@keyframes pop{from{transform:translateX(-30%);opacity:0}}
@media (prefers-reduced-motion: reduce){.gl-view.push,.gl-view.pop{animation:none}}`,
  js: SET_JS + String.raw`
const root=document.getElementById('root'), det=document.getElementById('detail');
function val(it){ return it.toggle?(S[it.k]?'开':'关'):S[it.k]; }
function list(){ const groups=[...new Set(ITEMS.map(i=>i.g))]; root.innerHTML='<h1 class="display" style="font-size:30px;margin:0 12px">设置</h1>'+groups.map(g=>'<div class="grp-t">'+g+'</div><div class="grp">'+ITEMS.filter(i=>i.g===g).map(i=>i.toggle?'<div class="row"><span>'+i.t+'</span><span style="margin-left:auto">'+control(i)+'</span></div>':'<button class="row" data-k="'+i.k+'"><span>'+i.t+'</span><span class="v">'+val(i)+'</span><span class="chev" aria-hidden="true">›</span></button>').join('')+'</div>').join(''); wire(root);
  root.querySelectorAll('button.row').forEach(b=>b.onclick=()=>open(b.dataset.k)); }
function open(k){ const it=ITEMS.find(i=>i.k===k); det.innerHTML='<button class="btn btn-quiet" id="bk" style="height:30px">‹ 设置</button><h1 class="display" style="font-size:26px;margin:14px 12px 4px">'+it.t+'</h1><p class="muted" style="margin:0 12px 16px">'+it.d+'</p><div class="grp" style="padding:16px">'+control(it)+'</div>';
  wire(det); root.hidden=true; det.hidden=false; det.className='gl-view push'; document.getElementById('bk').onclick=back; document.getElementById('bk').focus(); }
function back(){ det.hidden=true; root.hidden=false; root.className='gl-view pop'; list(); }
window.onSetting=()=>{};
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!det.hidden) back(); });
list();`,
};

/* ═══ P8 · 3 「搜索设置」 — search first: one flat list, filtered as you type ═══ */
const p8Search = {
  name: '搜索设置', axis: '找东西的方式：一个搜索框过滤所有设置',
  body: chrome('AIScript — 设置', `<main class="ss"><h1 class="display" style="font-size:30px;margin:0 0 14px">设置</h1>
    <label class="sr" for="q">搜索设置</label><input class="input" id="q" type="search" placeholder="搜索：key、字体、音效、导出…" autocomplete="off" spellcheck="false">
    <div id="list" class="ss-list" aria-live="polite"></div></main>`),
  css: `${CTRL_CSS}
.ss{flex:1;overflow:auto;padding:32px 24px;width:min(720px,100%);margin:0 auto}
.ss-list{margin-top:16px;display:flex;flex-direction:column}
.si{display:grid;grid-template-columns:1fr auto;gap:6px 16px;align-items:center;padding:14px 4px;border-top:1px solid var(--line)}
.si .meta{font-size:12px;color:var(--ink-3)}.si mark{background:var(--primary-soft);color:inherit;border-radius:2px}
.si .ctl{grid-column:1 / -1}.si.inline .ctl{grid-column:auto;grid-row:1 / span 2;grid-column-start:2}.empty{padding:28px 0;color:var(--ink-3)}`,
  js: SET_JS + String.raw`
const q=document.getElementById('q'), L=document.getElementById('list'); const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const hl=(s,w)=>{ s=String(s); if(!w) return esc(s); const i=s.toLowerCase().indexOf(w.toLowerCase()); return i<0?esc(s):esc(s.slice(0,i))+'<mark>'+esc(s.slice(i,i+w.length))+'</mark>'+esc(s.slice(i+w.length)); };
function render(){ const w=q.value.trim(); const hits=ITEMS.filter(i=>!w||(i.t+i.g+i.d+(i.choices||[]).join('')).toLowerCase().includes(w.toLowerCase()));
  L.innerHTML=hits.length?hits.map(i=>'<div class="si'+(i.toggle||i.choices?' inline':'')+'"><div><b>'+hl(i.t,w)+'</b><div class="meta">'+esc(i.g)+(i.d?' · '+hl(i.d,w):'')+'</div></div><div class="ctl">'+control(i)+'</div></div>').join(''):'<div class="empty">没有和「'+esc(w)+'」有关的设置。试试"key"或"字体"。</div>'; wire(L); }
let t; q.addEventListener('input',()=>{ clearTimeout(t); t=setTimeout(render,120); });
render(); q.focus();`,
};

/* ═══ P8 · 4 「顶部标签」 — tabs: clip-path colour transition on the tab bar (Emil) ═══ */
const TABS = ['激活与授权', '模型与密钥', '编辑器', '导出', '项目数据'];
const p8Tabs = {
  name: '顶部标签', axis: '结构：横向标签页，一次只看一组',
  body: chrome('AIScript — 设置', `<main class="tb-main"><h1 class="display" style="font-size:30px;margin:0 0 16px">设置</h1>
    <div class="tabs" role="tablist" aria-label="设置分组"><div class="tabs-base">${TABS.map((t, i) => `<button role="tab" data-i="${i}" aria-selected="${i === 0}">${t}</button>`).join('')}</div>
      <div class="tabs-hi" aria-hidden="true">${TABS.map((t) => `<span>${t}</span>`).join('')}</div></div>
    <section class="panel card" id="panel" role="tabpanel"></section></main>`),
  css: `${CTRL_CSS}
.tb-main{flex:1;overflow:auto;padding:32px 40px;max-width:900px}
.tabs{position:relative;display:inline-block;padding:3px;border-radius:999px;background:var(--muted)}
.tabs-base,.tabs-hi{display:flex}.tabs-base button,.tabs-hi span{height:34px;padding:0 16px;border-radius:999px;font-size:13.5px;display:flex;align-items:center;white-space:nowrap}
.tabs-base button{color:var(--ink-3)}.tabs-hi{position:absolute;inset:3px;pointer-events:none;transition:clip-path 240ms var(--ease-enter)}
.tabs-hi span{background:var(--surface);color:var(--ink);box-shadow:var(--shadow-card)}
.kbd-nav .tabs-hi{transition:none}
.panel{margin-top:18px;padding:8px 20px}.prow{display:grid;grid-template-columns:1fr auto;gap:4px 16px;align-items:center;padding:14px 0;border-top:1px solid var(--line)}.prow:first-child{border-top:0}
.prow .meta{font-size:12px;color:var(--ink-3)}.prow.wide .ctl{grid-column:1 / -1}`,
  js: SET_JS + String.raw`
const T=${JSON.stringify(TABS)}, base=[...document.querySelectorAll('.tabs-base button')], hi=document.querySelector('.tabs-hi'), panel=document.getElementById('panel');
function clip(i){ const b=base[i], w=hi.offsetWidth; const l=b.offsetLeft-3, r=w-(l+b.offsetWidth); hi.style.clipPath='inset(0 '+r+'px 0 '+l+'px round 999px)'; }
function show(i, kb){ document.body.classList.toggle('kbd-nav',!!kb); base.forEach((b,j)=>{ b.setAttribute('aria-selected',j===i); b.tabIndex=j===i?0:-1; }); clip(i);
  panel.innerHTML=ITEMS.filter(it=>it.g===T[i]).map(it=>'<div class="prow'+('input' in it||it.k==='data'||it.k==='act'?' wide':'')+'"><div><b>'+it.t+'</b><div class="meta">'+it.d+'</div></div><div class="ctl">'+control(it)+'</div></div>').join(''); wire(panel); }
base.forEach((b,i)=>{ b.onclick=()=>show(i); b.onkeydown=e=>{ const n=e.key==='ArrowRight'?(i+1)%T.length:e.key==='ArrowLeft'?(i-1+T.length)%T.length:null; if(n!=null){ e.preventDefault(); base[n].focus(); show(n,true); } }; });
requestAnimationFrame(()=>{ document.body.classList.add('kbd-nav'); show(0,true); requestAnimationFrame(()=>document.body.classList.remove('kbd-nav')); });`,
};

/* ═══ P8 · 5 「状态清单」 — status first: what's set up, what's missing, expand to fix ═══ */
const p8Check = {
  name: '状态清单', axis: '视角：先看哪些设好了、哪些没设，就地展开修改',
  body: chrome('AIScript — 设置', `<main class="ck"><div><h1 class="display" style="font-size:30px;margin:0">准备情况</h1><p class="muted" id="sum" style="margin:4px 0 0"></p></div><div id="list" class="ck-list"></div></main>`),
  css: `${CTRL_CSS}
.ck{flex:1;overflow:auto;padding:32px 24px;width:min(680px,100%);margin:0 auto;display:flex;flex-direction:column;gap:18px}
.ck-list{display:flex;flex-direction:column;gap:8px}
.ci{border-radius:var(--r-xl);background:var(--surface);box-shadow:var(--shadow-card);overflow:hidden}
.ci-h{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;text-align:left}
.st{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px;flex:none}
.st.ok{background:var(--color-success-500);color:#fff}.st.todo{box-shadow:inset 0 0 0 1.5px var(--line-strong);color:var(--ink-3)}
.ci-h .v{margin-left:auto;font-size:13px;color:var(--ink-3)}.ci-h .chev{transition:transform 200ms var(--ease-enter);color:var(--ink-3)}
.ci[data-open] .chev{transform:rotate(90deg)}
.ci-b{display:grid;grid-template-rows:0fr;transition:grid-template-rows 220ms var(--ease-enter)}.ci[data-open] .ci-b{grid-template-rows:1fr}
.ci-b>div{overflow:hidden}.ci-b .in{padding:0 16px 16px 50px}.ci-b .meta{font-size:12.5px;color:var(--ink-3);margin-bottom:10px}
@media (prefers-reduced-motion: reduce){.ci-b,.ci-h .chev{transition:none}}`,
  js: SET_JS + String.raw`
const L=document.getElementById('list');
const done=it=>it.k==='gemini'?S.gemini==='已连接':it.k==='ancher'?S.ancher==='已连接':true;
function render(){ const n=ITEMS.filter(done).length; document.getElementById('sum').textContent=n+' / '+ITEMS.length+' 项已就绪'+(n<ITEMS.length?' · Gemini 是可选的':'');
  const open=[...L.querySelectorAll('.ci[data-open]')].map(x=>x.dataset.k);
  L.innerHTML=ITEMS.map(it=>'<div class="ci" data-k="'+it.k+'" '+(open.includes(it.k)?'data-open':'')+'><button class="ci-h" aria-expanded="'+open.includes(it.k)+'"><span class="st '+(done(it)?'ok':'todo')+'">'+(done(it)?'✓':'')+'</span><b>'+it.t+'</b><span class="v">'+(it.toggle?(S[it.k]?'开':'关'):S[it.k])+'</span><span class="chev" aria-hidden="true">›</span></button><div class="ci-b"><div><div class="in"><div class="meta">'+it.d+'</div>'+control(it)+'</div></div></div></div>').join('');
  wire(L); L.querySelectorAll('.ci-h').forEach(h=>h.onclick=()=>{ const c=h.closest('.ci'); const o=!c.hasAttribute('data-open'); c.toggleAttribute('data-open',o); h.setAttribute('aria-expanded',o); }); }
window.onSetting=render;
render();`,
};

export const SETTINGS = { p8: [p8Grouped, p8Search, p8Tabs, p8Check] };
