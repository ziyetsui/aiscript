// v2 pages — interaction follows laper.ai as walked through on 2026-10-08 (docs/research/laper-walkthrough.md).
// Copy is localised; the sample story is original placeholder content. Our only additions: the device
// activation page (P1) and the settings page (P8). The reference-structure rewrite is offered as a chat suggestion.

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
  x: 'M18 6 6 18M6 6l12 12', at: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1', mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM19 11a7 7 0 0 1-14 0M12 18v3', square: 'M7 7h10v10H7Z', tag: 'M3 12V3h9l9 9-9 9ZM7.5 7.5h.01', arrowDown: 'M12 5v14M5 12l7 7 7-7', note: 'M14 3H6v18h12V7ZM14 3v4h4M12 11v6M9 14h6', newchat: 'M12 20H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v4M16 16h6M19 13v6', phone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM11 18h2', play: 'M7 4.5v15l12-7.5Z', chev: 'm6 9 6 6 6-6', menu: 'M4 6h16M4 12h16M4 18h16', expand: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z', copy: 'M9 9h12v12H9ZM5 15H3V3h12v2', up: 'M7 10v11M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 18.4 21H7V10l4-8a3 3 0 0 1 4 3.9Z',
  down: 'M17 14V3M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-7A2 2 0 0 1 5.6 3H17v11l-4 8a3 3 0 0 1-4-3.9Z', undo: 'M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6', trash: 'M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15', check: 'M20 6 9 17l-5-5',
  upload: 'M12 15V3M7 8l5-5 5 5M4 21h16', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z', zoom: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3M8 11h6M11 8v6',
  gift: 'M20 12v9H4v-9M2 7h20v5H2ZM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z',
  bulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z', indent: 'M3 8l4 4-4 4M11 6h10M11 12h10M11 18h10',
};
import { symbolSvg, ART } from './brand.mjs';
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

/* ═════ P1 激活（v0.2：不登录。激活码由托管 license 服务一次性绑定本机，见 spec §6） ═════ */
const p1 = () => chrome('Ancher Scripter · 激活', `
  <div class="act-layout" style="flex:1;display:grid;grid-template-columns:minmax(400px,0.95fr) 1.05fr;gap:16px;padding:16px">
    <div class="act-form" style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px">
      <div class="fade-up" style="--i:0;text-align:center"><div class="logo" id="brand-logo" style="margin:0 auto 14px;width:44px;height:44px" aria-label="Ancher" role="img">${symbolSvg(44)}</div><h1 class="display" style="font-size:36px;line-height:1.1;margin:0 0 8px">激活 Ancher Scripter</h1><p class="muted" style="margin:0">输入你收到的激活码。不需要注册，也不需要登录。</p></div>
      <div class="card fade-up" style="--i:1;width:min(400px,100%);padding:18px;display:flex;flex-direction:column;gap:12px" id="act-card">
        <label style="font-size:12.5px;font-weight:600" for="code">激活码</label>
        <input class="input" id="code" value="AIS-7K3F-9Q2M-4XHD-B8NC" spellcheck="false" autocomplete="off" style="font-family:var(--font-family-mono);letter-spacing:.04em">
        <button class="btn btn-primary" style="height:40px" id="act-btn" onclick="activate('ok')">激活</button>
        <div id="act-steps" style="display:flex;flex-direction:column;gap:6px"></div>
        <div class="muted" style="font-size:12px;line-height:1.6">首次激活需要联网一次，之后可以离线使用。<br>每个激活码只能激活一台电脑。</div>
      </div>
      <div style="--i:2;display:flex;gap:14px;font-size:12px" class="muted fade-up">
        <button style="text-decoration:underline;text-underline-offset:3px" onclick="activate('used')">演示：激活码已被别的电脑使用</button>
        <button style="text-decoration:underline;text-underline-offset:3px" onclick="activate('offline')">演示：没有网络</button>
      </div>
    </div>
    <figure class="act-art reveal" id="reveal" role="img" aria-label="ancher 品牌画作：窗边读书的女子（斯卡恩画派风格）" style="--art:url(${ART})">
      <div class="rv-base" aria-hidden="true"></div><div class="rv-paint" id="rv-paint" aria-hidden="true"></div><div class="rv-grain" aria-hidden="true"></div>
      <canvas class="film-gl" id="gl" aria-hidden="true"></canvas>
      <div class="film-lines" id="film" aria-live="polite"></div>
      <div class="film-slug" id="slug" aria-hidden="true">内景　窗边　午后</div>
      <button class="film-ctl" id="film-ctl" type="button">跳过</button></figure>
  </div>`, `
  <div class="scrim" id="manual"><div class="modal" role="dialog" aria-labelledby="mt" style="padding:22px">
    <div class="display" id="mt" style="font-size:20px;margin-bottom:4px">手动激活（无法联网时）</div>
    <p class="muted" style="margin:0 0 12px;font-size:13px">把下面的机器码发给提供方，对方会给你一个只对这台电脑有效的离线激活码。</p>
    <div style="display:flex;gap:8px;align-items:center"><code class="input" style="display:flex;align-items:center;font-family:var(--font-family-mono)">AS-7K3F-9Q2M-4XHD-B8NC</code><button class="btn btn-ghost" style="height:40px" onclick="toast('机器码已复制')">复制</button></div>
    <textarea class="input" style="height:84px;padding:10px 12px;margin-top:10px;font-family:var(--font-family-mono);font-size:12px;resize:none" placeholder="粘贴离线激活码（AIS1-…），或把 .scripter-license 文件拖到这里"></textarea>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn btn-ghost" onclick="closeModal('manual')">取消</button><button class="btn btn-primary" onclick="closeModal('manual');toast('离线激活成功')">激活</button></div></div></div>
  <script>
  async function activate(kind){ const b=document.getElementById('act-btn'), box=document.getElementById('act-steps'); b.disabled=true; box.innerHTML='';
    const steps={ok:[['联网验证激活码'],['绑定这台电脑','设备标识自动生成'],['下载授权文件','已签名 · 已加密，之后离线可用']],
      used:[['联网验证激活码'],['绑定这台电脑','',true]], offline:[['联网验证激活码','',true]]}[kind];
    for(const [t,d,bad] of steps){ const r=document.createElement('div'); r.className='tool enter'; r.innerHTML='<span class="spin"></span><span><b>'+t+'</b>'+(d?' · '+d:'')+'</span>'; box.appendChild(r); await wait(520);
      if(bad){ r.querySelector('.spin').outerHTML='<span class="fail">✕</span>'; box.insertAdjacentHTML('beforeend', kind==='used'
        ? '<div class="result enter" style="border-color:var(--color-danger-500)"><b>这个激活码已经在另一台电脑上激活过</b><div class="muted" style="font-size:12.5px">每个激活码只能用一次。如果是你自己换了电脑，请联系提供方处理。</div></div>'
        : '<div class="result enter"><b>连不上激活服务</b><div class="muted" style="font-size:12.5px">首次激活需要联网。检查网络后重试，或者改用手动激活。</div><div class="row"><button class="btn btn-ghost" style="height:28px" onclick="activate(\\'ok\\')">重试</button><button class="btn btn-ghost" style="height:28px" onclick="openModal(\\'manual\\')">手动激活</button></div></div>');
        b.disabled=false; return; }
      r.querySelector('.spin').outerHTML='<span class="ok">✓</span>'; }
    box.insertAdjacentHTML('beforeend','<div class="result enter"><div class="row"><span class="ok">✓</span><b style="flex:1">已激活</b><span class="chip" style="height:22px">北京 · 1 / 3</span></div><div class="muted" style="font-size:12.5px">本机 AS-7K3F-9Q2M · 2026-10-08</div></div>'+
      '<div class="result enter" id="key-step"><b>最后一步：填写你的 Ancher API key</b><div class="muted" style="font-size:12.5px">在 ancher.ai → 设置 → API 密钥 里创建，以 ak_live_ 开头。key 只存在本机钥匙串。</div>'+
      '<input class="input" id="akey" type="password" value="ak_live_demo_key" autocomplete="off" spellcheck="false" style="font-family:var(--font-family-mono)">'+
      '<div class="row"><button class="btn btn-primary" style="height:32px" onclick="checkKey(true)">验证并保存</button><button class="btn btn-ghost" style="height:32px" onclick="checkKey(false)">演示：key 无效</button></div><div id="key-out"></div></div>');
    b.textContent='已激活'; const lg=document.getElementById('brand-logo'); lg.classList.remove('spin'); void lg.offsetWidth; lg.classList.add('spin'); }
  // ancher CTA reveal (ancher-website webgl-reveal-effect spec), done with clip-path: a spring-following circular window
  // onto the painting. Entrance: the window shrinks from full cover to its resting size (easeInOutExpo, ancher's choice).
  function cssReveal(){ const fig=document.getElementById('reveal'), paint=document.getElementById('rv-paint'); if(!fig) return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){ paint.style.clipPath='none'; return; }
    const REST={x:.68,y:.5}, STIFF=.08, DAMP=.85, ENTER=1400; let pos={...REST}, vel={x:0,y:0}, target={...REST}, t0=null, raf=0;
    const expo=t=>t<=0?0:t>=1?1:t<.5?Math.pow(2,20*t-10)/2:(2-Math.pow(2,-20*t+10))/2;
    let ticked=false;
    function frame(now){ ticked=true; t0??=now; const e=expo((now-t0)/ENTER); const w=fig.clientWidth, h=fig.clientHeight, rest=Math.min(w,h)*.36, full=Math.hypot(w,h);
      vel.x=vel.x*DAMP+(target.x-pos.x)*STIFF; vel.y=vel.y*DAMP+(target.y-pos.y)*STIFF; pos.x+=vel.x; pos.y+=vel.y;
      const r=full+(rest-full)*e; paint.style.clipPath='circle('+r.toFixed(1)+'px at '+(pos.x*100).toFixed(2)+'% '+(pos.y*100).toFixed(2)+'%)';
      const settled=e>=1&&Math.abs(target.x-pos.x)<.0005&&Math.abs(target.y-pos.y)<.0005&&Math.abs(vel.x)+Math.abs(vel.y)<.0002;
      raf=settled?0:requestAnimationFrame(frame); }   // rAF already pauses in hidden tabs
    const wake=()=>{ if(!raf) raf=requestAnimationFrame(frame); };
    fig.addEventListener('pointermove',ev=>{ const r=fig.getBoundingClientRect(); target={x:(ev.clientX-r.left)/r.width,y:(ev.clientY-r.top)/r.height}; wake(); });
    fig.addEventListener('pointerleave',()=>{ target={...REST}; wake(); });
    addEventListener('resize',wake); wake();
    // Watchdog: if the first frame never arrives (e.g. the document was loaded while invisible), restart the loop.
    setTimeout(()=>{ if(!ticked){ raf=0; wake(); } },200); }
  // ── Opening film (three.js): 2.5D depth from a hand-painted depth map, ink-wash dissolve, slow push-in,
  //    typewriter lines. First-run only (Emil: rare moment → delight is allowed), skippable, replayable;
  //    reduced motion or no WebGL → static painting / the CSS reveal above.
  (async function(){ const fig=document.getElementById('reveal'), canvas=document.getElementById('gl'), film=document.getElementById('film'), slug=document.getElementById('slug'), ctl=document.getElementById('film-ctl');
    if(!fig) return; const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches; const SEEN='ancher-scripter-intro-seen';
    const seen=(()=>{ try{ return localStorage.getItem(SEEN)==='1'; }catch(_){ return false; } })();
    let THREE=null; for(let i=0;i<40&&!THREE;i++){ try{ THREE=(window.parent&&window.parent.THREE)||window.THREE; }catch(_){} if(!THREE) await wait(50); }
    if(!THREE||REDUCED){ slug.classList.add('on'); ctl.hidden=true; if(REDUCED){ document.getElementById('rv-paint').style.clipPath='none'; } else cssReveal(); return; }
    let renderer; try{ renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'}); }catch(_){ cssReveal(); slug.classList.add('on'); ctl.hidden=true; return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    const artUrl=getComputedStyle(fig).getPropertyValue('--art').trim().replace(/^url\\(["']?/,'').replace(/["']?\\)$/,'');
    const img=new Image(); img.src=artUrl; await img.decode();
    const tex=new THREE.Texture(img); tex.colorSpace=THREE.SRGBColorSpace; tex.minFilter=THREE.LinearFilter; tex.needsUpdate=true;
    // Hand-painted depth: window far, wall mid, floor rising, chair near, the reader nearest.
    const dc=document.createElement('canvas'); dc.width=256; dc.height=192; const g=dc.getContext('2d'); const W=256,H=192; g.filter='blur(9px)';
    g.fillStyle='#5c5c5c'; g.fillRect(-20,-20,W+40,H+40); g.fillStyle='#181818'; g.fillRect(.04*W,-20,.6*W,.55*H);
    const fl=g.createLinearGradient(0,.62*H,0,H); fl.addColorStop(0,'#666'); fl.addColorStop(1,'#a0a0a0'); g.fillStyle=fl; g.fillRect(-20,.62*H,W+40,H);
    const ell=(x,y,rx,ry,c)=>{ g.fillStyle=c; g.beginPath(); g.ellipse(x*W,y*H,rx*W,ry*H,0,0,Math.PI*2); g.fill(); };
    ell(.8,.74,.1,.22,'#c8c8c8'); ell(.7,.62,.13,.3,'#fff'); ell(.74,.34,.06,.085,'#fff'); ell(.6,.47,.06,.05,'#eee');
    const depth=new THREE.CanvasTexture(dc);
    const paper=getComputedStyle(fig).backgroundColor.match(/[\d.]+/g)||[250,248,244]; const toLin=v=>Math.pow(v/255,2.2);
    const U={uTex:{value:tex},uDepth:{value:depth},uRes:{value:new THREE.Vector2(1,1)},uMouse:{value:new THREE.Vector2()},uTime:{value:0},uReveal:{value:0},uDolly:{value:0},uImgAspect:{value:img.width/img.height},uPaper:{value:new THREE.Vector3(toLin(+paper[0]),toLin(+paper[1]),toLin(+paper[2]))}};
    const mat=new THREE.ShaderMaterial({uniforms:U,vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',fragmentShader:'uniform sampler2D uTex,uDepth; uniform vec2 uRes,uMouse; uniform float uTime,uReveal,uDolly,uImgAspect; uniform vec3 uPaper; varying vec2 vUv; float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); } float noise(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); } float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; } void main(){ float ca=uRes.x/uRes.y; vec2 sc=ca>uImgAspect?vec2(1.,uImgAspect/ca):vec2(ca/uImgAspect,1.); vec2 uv=(vUv-.5)*sc+.5; vec2 F=vec2(.71,.47); float d=texture2D(uDepth,uv).r; float breath=sin(uTime*.35)*.005; float z=mix(1.,1.08,uDolly)+breath; vec2 p=F+(uv-F)/(z*(1.+d*.055*uDolly)); p+=uMouse*(d-.45)*.022+vec2(sin(uTime*.23),cos(uTime*.19))*.004*(d-.45); vec3 col=texture2D(uTex,clamp(p,.002,.998)).rgb; col+=vec3(1.,.93,.8)*smoothstep(.5,0.,distance(p,vec2(.3,.76)))*(.045+.025*sin(uTime*.6)); col*=mix(.84,1.,smoothstep(.9,.3,distance(vUv,vec2(.5)))); col+=(hash(vUv*uRes+fract(uTime*7.)*91.)-.5)*.035; float n=fbm(vUv*3.+vec2(0.,uTime*.03)); float m=smoothstep(n-.07,n+.07,uReveal*1.3-.15); col=mix(uPaper,col,m); col*=1.-.22*m*(1.-m)*4.; gl_FragColor=vec4(col,1.); }'});
    const scene=new THREE.Scene(); scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat)); const cam=new THREE.Camera();
    function size(){ const w=fig.clientWidth,h=fig.clientHeight; renderer.setSize(w,h,false); U.uRes.value.set(w,h); } size(); addEventListener('resize',size);
    fig.classList.add('gl-on');
    let mouse={x:0,y:0}, mv={x:0,y:0}, raf=0, t0=performance.now();
    fig.addEventListener('pointermove',e=>{ const r=fig.getBoundingClientRect(); mouse={x:((e.clientX-r.left)/r.width-.5)*2,y:-((e.clientY-r.top)/r.height-.5)*2}; });
    fig.addEventListener('pointerleave',()=>{ mouse={x:0,y:0}; });
    function loop(now){ U.uTime.value=(now-t0)/1000; mv.x+=(mouse.x-mv.x)*.06; mv.y+=(mouse.y-mv.y)*.06; U.uMouse.value.set(mv.x,mv.y); renderer.render(scene,cam); raf=requestAnimationFrame(loop); }
    raf=requestAnimationFrame(loop); setTimeout(()=>{ if(U.uTime.value===0){ cancelAnimationFrame(raf); raf=requestAnimationFrame(loop); } },200);
    // timeline helpers (cancelled by "skip")
    let run=0; const easeOut=t=>1-Math.pow(1-t,3), inOut=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    const tween=(k,to,ms,ease,id)=>new Promise(res=>{ const from=U[k].value, s0=performance.now(); (function step(n){ if(id!==run) return res(); const t=Math.min(1,(n-s0)/ms); U[k].value=from+(to-from)*ease(t); t<1?requestAnimationFrame(step):res(); })(s0); });
    const pause=(ms,id)=>new Promise(r=>setTimeout(r,ms)).then(()=>id===run);
    async function type(text,cls,id){ const el=document.createElement('div'); el.className='fl '+cls; film.appendChild(el); requestAnimationFrame(()=>el.classList.add('on'));
      for(let i=0;i<text.length;i++){ if(id!==run) return el; el.textContent=text.slice(0,i+1); await wait(/[，。：]/.test(text[i])?220:70); } return el; }
    function end(){ run++; U.uReveal.value=1; U.uDolly.value=1; film.innerHTML=''; slug.classList.add('on'); ctl.textContent='重播'; try{ localStorage.setItem(SEEN,'1'); }catch(_){} }
    async function play(){ const id=++run; film.innerHTML=''; slug.classList.remove('on'); U.uReveal.value=0; U.uDolly.value=0; ctl.textContent='跳过'; film.dataset.mode='paper';
      await pause(500,id); const a=await type('淡入：','fl-small',id); if(id!==run) return; await pause(450,id);
      const b=await type('内景　窗边　午后','fl-slug',id); if(id!==run) return; await pause(700,id);
      [a,b].forEach(x=>x.classList.add('out')); tween('uReveal',1,2000,inOut,id); await pause(900,id); if(id!==run) return; film.innerHTML=''; film.dataset.mode='paint';
      tween('uDolly',1,6000,easeOut,id); await pause(900,id); if(id!==run) return;
      const c=await type('很久很久以前，有人在这扇窗下写下了第一句话。','fl-line',id); if(id!==run) return; await pause(2400,id); if(id!==run) return;
      c.classList.add('out'); await pause(600,id); if(id===run) end(); }
    ctl.onclick=()=>ctl.textContent==='跳过'?end():play();
    if(seen){ U.uReveal.value=0; U.uDolly.value=1; ctl.textContent='重播'; slug.classList.add('on'); const id=++run; tween('uReveal',1,900,easeOut,id); }
    else play(); })();
  async function checkKey(good){ const o=document.getElementById('key-out'); o.innerHTML='<div class="tool"><span class="spin"></span><span><b>连接 Ancher</b> · User.me()</span></div>'; await wait(700);
    o.innerHTML=good ? '<div class="tool"><span class="ok">✓</span><span><b>Ancher 已连接</b> · key 已存进系统钥匙串</span></div><button class="btn btn-primary" style="height:32px;margin-top:8px;width:100%" onclick="toast(\\'进入应用 → 第 02 页\\')">开始使用</button>'
      : '<div class="tool"><span class="fail">✕</span><span><b>key 无效或已被删除</b> · 请在 ancher.ai 重新复制</span></div>'; }
  </script>`);

/* ═════ P2 Onboarding（laper：一句话 + 添加文件 + 类型） ═════ */
const p2 = () => chrome('Ancher Scripter', `
  <div class="ob" style="flex:1;position:relative;display:grid;place-items:center;overflow:hidden">
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

/* ═════ P3 创作首页（laper /app/new）：意图标签展开成建议面板 + 项目类型下拉 ═════ */
const INTENTS = [
  ['indent', '格式', '整理格式', ['把我贴的文字整理成标准剧本格式', '修正所有场景标题（内外景、地点、时间）', '把这段对白和动作排成规范格式', '把这段小说片段转成剧本场景', '统一全剧的人物名和对白缩进', '整理我的转场和镜头标记']],
  ['bulb', '灵感', '临时想法', ['我有个一句话点子，帮我发展成完整故事', '把这个设定演成三种不同走向', '这个设定里能挖出什么戏剧冲突', '把我脑子里那个画面写成开场', '帮这个想法找一个钩子和主题', '这个题材适合什么类型和篇幅']],
  ['pen', '写作', '写作', ['帮我写一场深夜便利店的戏', '给主角写一段有潜台词的对白', '把这场戏改写得更有张力', '给这场戏写一个意料之外的结尾', '用动作和细节展现情绪，少用台词', '给这段对白加一层潜台词']],
  ['film', '剧情', '剧情', ['帮我搭一个三幕结构大纲', '用"救猫咪"节拍表列出关键节拍', '让中点反转更有冲击力', '检查我的剧情有没有逻辑漏洞', '在第二幕加一个推动主角的转折', '帮我把主线和副线交织起来']],
  ['user', '角色', '角色', ['设计一个有秘密也有弱点的反派', '给主角写一份完整人物小传', '梳理这个角色的人物弧光', '让这两个角色的关系更丰富更紧张', '给一个配角一个让人记住的标志特征', '理清每个角色想要什么、害怕什么']],
];
const p3 = () => chrome('Ancher Scripter', `
  <div class="home" style="flex:1;display:flex;flex-direction:column;align-items:center;padding:14px 18px;position:relative">
    <div style="align-self:stretch;display:flex;justify-content:space-between;align-items:center"><button class="btn btn-quiet" style="width:34px;padding:0" aria-label="菜单">${icon('menu', 16)}</button><span class="chip" style="height:30px"><span style="width:6px;height:6px;border-radius:50%;background:var(--color-success-500)"></span> 已激活 · Ancher 已连接</span></div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:16px;width:min(680px,100%)">
      <div style="display:flex;align-items:center;gap:12px"><div class="logo" style="margin:0;width:36px;height:36px" aria-label="Ancher" role="img">${symbolSvg(36)}</div><h1 class="display" style="font-size:28px;margin:0">下午好，林</h1></div>
      <form class="card" id="ask-f" style="padding:16px;box-shadow:var(--shadow-pop)"><label for="ask" class="sr-only">输入</label>
        <textarea id="ask" style="width:100%;min-height:84px;border:0;outline:none;resize:none;background:transparent;font-size:17px" placeholder="帮您处理剧本格式或从新点子开始？"></textarea>
        <div style="display:flex;gap:8px;align-items:center"><button type="button" class="btn btn-ghost" style="height:34px">${icon('plus', 14)} 添加文件</button>
          <span class="kind-wrap" style="position:relative"><button type="button" class="btn btn-ghost" style="height:34px" id="kind-btn" aria-haspopup="listbox" aria-expanded="false">${icon('doc', 14)} <span id="kind">剧本项目</span> ${icon('chev', 12)}</button>
            <div class="kind-menu card" id="kind-menu" role="listbox" aria-label="项目类型">${[['doc', '剧本项目', '写出专业、结构清晰的剧本'], ['video', '快速视频', '为 AI 视频创作而生']].map(([ic, t, d], i) => `<button type="button" role="option" aria-selected="${i === 0}" class="kind-opt" data-t="${t}">${icon(ic, 15)}<span><b>${t}</b><br><span class="muted" style="font-size:12px">${d}</span></span></button>`).join('')}</div></span>
          <span style="flex:1"></span><button class="btn btn-primary" style="width:38px;height:38px;padding:0;border-radius:50%" aria-label="发送">${icon('send', 16)}</button></div></form>
      <div class="intents" id="intents">${INTENTS.map(([ic, t], i) => `<button type="button" class="btn btn-ghost intent" data-i="${i}" style="height:34px">${icon(ic, 14)} ${t}</button>`).join('')}</div>
      <section class="sugg card" id="sugg" hidden aria-labelledby="sugg-t"><div class="sugg-hd"><span id="sugg-ic"></span><b id="sugg-t"></b><span style="flex:1"></span>
        <button type="button" class="sugg-x" id="sugg-x" aria-label="关闭建议">${icon('x', 16)}</button></div><div class="sugg-list" id="sugg-list" role="listbox"></div></section>
    </div>
    <div class="muted" style="font-size:11.5px;display:flex;gap:16px">Ancher Scripter · 剧本博物馆 · 帮助与支持 · 服务条款 · 隐私政策</div>
  </div>`, `
  <style>
  .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
  .intents{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.intents[hidden],.sugg[hidden]{display:none}
  /* Suggestion panel opens from under the input (origin top), 180ms ease-out; closing is faster (120ms). Switching category is instant. */
  .sugg{padding:10px 10px 12px;transform-origin:top center}
  .sugg.in{animation:suggIn 180ms var(--ease-out,cubic-bezier(.23,1,.32,1)) both}.sugg.leaving{animation:suggOut 120ms ease both}
  @keyframes suggIn{from{opacity:0;transform:translateY(-4px) scale(.985)}}@keyframes suggOut{to{opacity:0;transform:translateY(-4px) scale(.985)}}
  .sugg-hd{display:flex;align-items:center;gap:10px;padding:6px 8px 10px;font-size:15px}
  .sugg-x{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 1px var(--line);color:var(--ink-2);transition:transform 140ms var(--ease-enter),background-color 150ms ease}
  .sugg-x:active{transform:scale(.95)}@media (hover:hover) and (pointer:fine){.sugg-x:hover{background:var(--hover)}}
  .sugg-list{display:flex;flex-direction:column}
  .sugg-it{display:block;width:100%;text-align:left;padding:12px 10px;border-radius:var(--r);font-size:15px;color:var(--ink-2)}
  .sugg-it[aria-selected=true]{background:var(--hover);color:var(--ink)}
  .sugg.in .sugg-it{animation:itIn 220ms var(--ease-out,cubic-bezier(.23,1,.32,1)) both}
  @keyframes itIn{from{opacity:0;transform:translateY(3px)}}
  .intent[aria-pressed=true]{background:var(--surface);box-shadow:inset 0 0 0 1.5px var(--ink);color:var(--ink)}
  .kind-menu{position:absolute;left:0;top:calc(100% + 6px);z-index:20;width:250px;padding:6px;box-shadow:var(--shadow-pop);transform-origin:top left;opacity:0;transform:scale(.97);pointer-events:none;transition:opacity 150ms var(--ease-enter),transform 150ms var(--ease-enter)}
  .kind-menu.open{opacity:1;transform:none;pointer-events:auto}
  .kind-opt{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;padding:8px 10px;border-radius:var(--r-sm);font-size:13.5px}
  .kind-opt[aria-selected=true]{background:var(--hover)}@media (hover:hover) and (pointer:fine){.kind-opt:hover{background:var(--hover)}}
  </style>
  <script>
  const INT=${JSON.stringify(INTENTS)}, ICONS=${JSON.stringify(Object.fromEntries(INTENTS.map(([ic]) => [ic, icon(ic, 18)])))};
  const sugg=document.getElementById('sugg'), list=document.getElementById('sugg-list'), intents=document.getElementById('intents'), ask=document.getElementById('ask'); let cur=-1, sel=0;
  function mark(){ list.querySelectorAll('.sugg-it').forEach((b,i)=>b.setAttribute('aria-selected',i===sel)); }
  function open(i, fromKey){ const [ic,,title,items]=INT[i]; const switching=!sugg.hidden; cur=i; sel=fromKey?0:-1;
    document.getElementById('sugg-ic').innerHTML=ICONS[ic]; document.getElementById('sugg-t').textContent=title;
    list.innerHTML=items.map((t,k)=>'<button type="button" role="option" class="sugg-it" style="animation-delay:'+(k*30)+'ms">'+t+'</button>').join('');
    list.querySelectorAll('.sugg-it').forEach((b,k)=>{ b.onpointerenter=()=>{ sel=k; mark(); }; b.onclick=()=>pick(k); }); mark();
    intents.hidden=true; sugg.hidden=false; sugg.classList.remove('in','leaving'); if(!switching&&!fromKey){ void sugg.offsetWidth; sugg.classList.add('in'); }
    if(fromKey) list.querySelector('.sugg-it').focus(); }
  function close(){ if(sugg.hidden) return; sugg.classList.remove('in'); sugg.classList.add('leaving'); setTimeout(()=>{ sugg.hidden=true; sugg.classList.remove('leaving'); intents.hidden=false; const b=intents.querySelector('[data-i="'+cur+'"]'); b&&b.focus(); },120); }
  function pick(k){ ask.value=INT[cur][3][k]; close(); setTimeout(()=>{ ask.focus(); ask.setSelectionRange(ask.value.length,ask.value.length); },130); }
  intents.querySelectorAll('.intent').forEach(b=>{ b.onclick=e=>open(+b.dataset.i, e.detail===0); });
  document.getElementById('sugg-x').onclick=close;
  sugg.addEventListener('keydown',e=>{ const n=list.children.length; if(e.key==='ArrowDown'){ sel=(sel+1)%n; mark(); list.children[sel].focus(); e.preventDefault(); } else if(e.key==='ArrowUp'){ sel=(sel-1+n)%n; mark(); list.children[sel].focus(); e.preventDefault(); } else if(e.key==='Escape'){ close(); e.preventDefault(); } });
  // project type dropdown
  const kb=document.getElementById('kind-btn'), km=document.getElementById('kind-menu');
  const setKind=o=>{ km.classList.toggle('open',o); kb.setAttribute('aria-expanded',o); };
  kb.onclick=()=>setKind(!km.classList.contains('open'));
  km.querySelectorAll('.kind-opt').forEach(o=>o.onclick=()=>{ km.querySelectorAll('.kind-opt').forEach(x=>x.setAttribute('aria-selected',x===o)); document.getElementById('kind').textContent=o.dataset.t; setKind(false); kb.focus(); });
  document.addEventListener('pointerdown',e=>{ if(!e.target.closest('.kind-wrap')) setKind(false); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') setKind(false); });
  document.getElementById('ask-f').addEventListener('submit',e=>{ e.preventDefault(); if(ask.value.trim()) toast('已开始：'+ask.value.trim().slice(0,24)+'…'); else ask.focus(); });
  </script>`);

/* ═════ P4 工作区（laper 主流程：AI 自动开跑） ═════ */
function nodes(list) {
  const cls = { heading: 'sc-heading', action: 'sc-action', char: 'sc-char', paren: 'sc-paren', dial: 'sc-dial', trans: 'sc-trans' };
  return list.map(([t, x]) => `<p class="sc-node ${cls[t]}">${x}</p>`).join('');
}
const RAIL = [['pen', '写作', '', 'p4'], ['film', '制作', '', 'p6'], ['users', '角色', 'c-chars', 'p5'], ['map', '地点', 'c-locs', 'p12'], ['box', '道具', '', 'p9'], ['globe', '世界观', '', 'p10'], ['book', '知识库', '', 'p11']];
const rail = (on) => `<nav class="rail" aria-label="项目导航"><div class="logo" aria-label="Ancher" role="img">${symbolSvg(24)}</div>
  ${RAIL.map(([ic, t, id, go]) => `<button data-go="${go}" class="${t === on ? 'on' : ''}" title="${t}" aria-label="${t}" style="position:relative">${icon(ic, 17)}${id ? `<i id="${id}" class="tnum" style="position:absolute;right:-2px;top:-2px;font-style:normal;font-size:9.5px;min-width:15px;height:15px;border-radius:8px;background:var(--ink);color:var(--bg);display:grid;place-items:center">${t === '角色' ? (on === '角色' ? 4 : 0) : (on === '角色' ? 3 : 0)}</i>` : ''}</button>`).join('')}
  <div class="grow"></div>
  <button title="新手任务" aria-label="新手任务" onclick="typeof gs==='function'&&gs()" style="position:relative"><svg width="22" height="22" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--line-strong)" stroke-width="4"/><circle id="ring" cx="18" cy="18" r="15" fill="none" stroke="var(--primary)" stroke-width="4" stroke-dasharray="94.2" stroke-dashoffset="${on === '角色' ? 0 : 94.2}" transform="rotate(-90 18 18)" style="transition:stroke-dashoffset var(--dur-modal) var(--ease-enter)"/></svg></button>
  <button title="项目设置" aria-label="项目设置">${icon('gear', 17)}</button><button title="返回首页" aria-label="返回首页" data-go="p3">${icon('home', 17)}</button>
  <div style="width:26px;height:26px;border-radius:50%;background:var(--primary-soft);color:var(--primary);display:grid;place-items:center;font-size:11px;font-weight:700;margin-top:4px">林</div></nav>`;
const gsPopover = `<div id="gs" class="card" hidden style="position:fixed;left:62px;bottom:120px;width:260px;padding:14px;z-index:20;box-shadow:var(--shadow-pop);transform-origin:bottom left">
  <div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:8px">新手任务 <span class="tnum muted" id="gs-n">0 / 6</span></div>
  <div style="height:5px;border-radius:3px;background:var(--muted);margin-bottom:10px"><div id="gs-bar" style="height:100%;width:0;border-radius:3px;background:var(--primary);transition:width var(--dur-modal) var(--ease-enter)"></div></div>
  ${['和 AI 聊聊', '写一份大纲', '写一些剧本', '添加一个角色', '添加一个地点', '添加一个镜头'].map((t, i) => `<div class="gs-i" data-i="${i}" style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px"><span class="gs-c" style="width:16px;height:16px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--line-strong);display:grid;place-items:center;font-size:9px"></span><span class="gs-t">${t}</span></div>`).join('')}</div>`;
const exportModal = `<div class="scrim" id="export"><div class="modal" style="padding:20px;width:min(780px,calc(100vw - 32px))">
  <div style="display:flex;align-items:center;margin-bottom:2px"><b class="display" style="font-size:22px;flex:1">导出</b><button class="btn btn-quiet" style="width:30px;padding:0;border-radius:50%" onclick="closeModal('export')" aria-label="关闭">${icon('x', 14)}</button></div>
  <div class="muted" style="font-size:12px;margin-bottom:14px">已选 2 集 · 全部分集</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
    <div style="background:var(--muted);border-radius:var(--r-xl);padding:12px"><div style="display:flex;justify-content:space-between;font-weight:600;font-size:13px;margin-bottom:8px">分集 <span class="muted" style="font-weight:400;font-size:12px">清空</span></div>
      ${[['门墩儿', '第 1 集'], ['借来的东西', '第 2 集']].map(([t, s]) => `<label class="card" style="display:flex;align-items:center;padding:10px;margin-bottom:6px;font-size:13px"><span style="flex:1"><b>${t}</b><br><span class="muted" style="font-size:11px">${s}</span></span><input type="checkbox" checked style="accent-color:var(--primary)"></label>`).join('')}</div>
    <div style="background:var(--muted);border-radius:var(--r-xl);padding:12px"><div style="font-weight:600;font-size:13px;margin-bottom:8px">导出内容</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${['剧本', '大纲', '节拍', '场景', '分镜', '选角表', '勘景本', '道具表'].map((t, i) => `<label class="card" style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;font-size:12.5px">${t}<input type="radio" name="ec" value="${t}" ${i === 0 ? 'checked' : ''} style="accent-color:var(--primary)"></label>`).join('')}</div></div>
    <div style="background:var(--muted);border-radius:var(--r-xl);padding:12px"><div style="font-weight:600;font-size:13px;margin-bottom:8px">文件格式</div>
      ${[['pdf', 'PDF', '打印排版，可直接发给导演'], ['fdx', 'Final Draft', '.fdx · 行业标准'], ['fountain', 'Fountain', '.fountain · 纯文本剧本标准'], ['doc', 'Word', '可继续编辑'], ['txt', 'TXT', '纯文本']].map(([v, t, d], i) => `<label class="card" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 10px;margin-bottom:6px;font-size:12.5px"><span><b>${t}</b><br><span class="muted" style="font-size:11px">${d}</span></span><input type="radio" name="ff" value="${v}" ${i === 0 ? 'checked' : ''} style="accent-color:var(--primary)"></label>`).join('')}
      <div style="font-size:12px;margin:8px 0 6px" class="muted">剧本格式</div><div class="seg"><button class="on">好莱坞</button><button>亚洲</button></div>
      <label style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;margin-top:10px">纸张纹理 <input type="checkbox" checked style="accent-color:var(--primary)"></label></div>
  </div>
  <div style="display:flex;justify-content:flex-end;margin-top:14px"><span class="muted" style="font-size:12px;margin-right:auto;align-self:center">字体：Courier + 仿宋（打字机）</span><button class="btn btn-primary" onclick="doExport()">${icon('export', 14)} 导出</button></div></div></div>`;
// Pain-point workflows from the client's 2026-09-17 meeting (specs/0002 §5.6). Each runs locally as a state machine.
const WORKFLOWS = [
  ['一个创意 → 3 个走向', '联网调研 + 规则与反例，三个走向冲突来源不同'],
  ['参考经典结构重写', '解析参考视频 → 节拍 → 换成自家角色 → 修改预览'],
  ['笑点方案', '3–5 个方案，标出笑点机制和规则冲突'],
  ['写飘检查', '对照大纲和锁定核心，列出偏离点'],
  ['导演意见 → 规则', '截图 / 录音 → 待确认规则 → 本地规则库'],
  ['控字数 / 时长', '按场估算时长，删减方案先预览'],
  ['视频 → 逐字稿', '本机抽音轨 → Ancher / Gemini 转写 → 存入项目'],
  ['今日热点选题', 'Ancher 联网搜索，按儿童 / 家庭 / 学校筛选'],
];
const welcome = `<div id="welcome" style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 8px;text-align:center">
  <div style="width:100%;height:96px;border-radius:var(--r-xl);background:radial-gradient(60% 90% at 30% 40%, var(--primary-soft), transparent 70%),radial-gradient(50% 80% at 75% 60%, var(--hl), transparent 70%),var(--muted)"></div>
  <b>你的编剧搭档，随时待命。</b><div class="muted" style="font-size:13px">我的任务是替你处理繁琐的格式工作。<br>还有更多。</div></div>`;
const workspace = () => chrome('Ancher Scripter — <span id="t-proj">新剧本</span>', `
  ${rail('写作')}
  <aside class="col2">
    <div class="hd"><span id="proj">新剧本</span><span style="flex:1"></span><button class="btn btn-quiet" style="height:24px;padding:0 6px" aria-label="新建一集">${icon('plus', 13)}</button><button class="btn btn-quiet" style="height:24px;padding:0 6px" aria-label="更多">···</button></div>
    <div class="item">${icon('film', 14)} 分集看板<small class="tnum" id="ep-count" style="background:var(--ink);color:var(--bg);border-radius:8px;padding:0 6px;font-weight:700">1</small></div>
    <div id="eps"><div class="item on" id="ep1">第 1 集</div></div>
    <div style="height:8px"></div>
    <div class="item on" id="nv-script" onclick="view('script')">${icon('doc', 14)} 剧本</div><div class="item" id="nv-outline" onclick="view('outline')">${icon('book', 14)} 大纲</div><div class="item" id="nv-shots" onclick="view('shots')">${icon('film', 14)} 分镜</div><div class="item" id="nv-scn" onclick="view('scn')">${icon('map', 14)} 场景</div>
    <div class="sec eyebrow" id="scenes-h" hidden>场景</div><div id="scenes"></div>
    <div class="sec eyebrow" id="wv-h" hidden>总体世界观</div><div id="wv"></div>
  </aside>
  <section class="center">
    <div class="center-hd"><b id="hd-title">剧本</b><span style="flex:1"></span><div class="seg" id="hd-seg"><button class="on">${icon('doc', 12)} 剧本</button><button>封面</button></div><span style="flex:1"></span>
      <button class="chip sound-off" id="snd" style="height:28px" onclick="TW.toggle()" aria-pressed="false" title="生成时播放打字机音效">🔇 点一下开启打字机音效</button>
      <button class="btn btn-quiet" style="width:28px;padding:0" aria-label="撤销">${icon('undo', 14)}</button><button class="btn btn-quiet" style="width:28px;padding:0" aria-label="批注">${icon('chat', 14)}</button>
      <button class="btn btn-ghost" style="height:28px" onclick="openModal('export')">${icon('export', 13)} 导出</button></div>
    <div class="toolbar" id="tb">${[['film', '场景'], ['pen', '动作'], ['user', '角色'], ['indent', '括号'], ['chat', '对白'], ['export', '转场'], ['doc', '注释'], ['book', '字幕']].map(([ic, t], i) => `<button class="${i === 1 ? 'on' : ''}">${icon(ic, 14)}${t}</button>`).join('')}</div>
    <div class="scroll" id="scroll">
      <article class="page" id="page"><div id="empty" style="font-family:var(--font-family-mono);font-size:12px;color:var(--ink-3);display:grid;grid-template-columns:auto 1fr;gap:10px 14px;align-items:center">
        <span class="kbd">Tab</span><span>反复按 Tab 切换格式</span><span class="kbd">Enter</span><span>在选择器里新建角色、地点等实体</span><span class="kbd">@</span><span>用 @ 提及角色，让剧本更好读</span></div>
        <p class="sc-heading" id="ph" style="color:var(--ink-3);margin-top:28px">内景/外景 地点 — 日/夜</p></article>
      <article class="page outline-doc" id="outline" hidden><div class="muted">还没有大纲。</div></article><article class="page" id="shots" hidden></article><article class="page" id="scn" hidden></article></div>
    <section class="agent" id="agent" aria-label="AI 编剧">
      <div class="sheet-grip" id="grip" aria-hidden="true"></div>
      <div class="ag-hd"><button class="ag-title" aria-label="会话列表"><span id="chat-title">新对话</span>${icon('chev', 13)}</button><span style="flex:1"></span>
        <button class="ag-save" onclick="toast('已把这段对话存为笔记')">${icon('note', 15)}保存</button><button class="ico-btn" aria-label="新对话" onclick="toast('新对话')">${icon('newchat', 16)}</button><button class="ico-btn" aria-label="收起" onclick="agentOpen(false)">${icon('chev', 14)}</button></div>
      <div class="ag-body"><div class="ag-feed" id="feed">${welcome}</div><button class="jump-pill" id="jump" onclick="toLatest()" aria-label="回到最新消息">${icon('arrowDown', 13)}最新<span class="n" id="jump-n" hidden></span></button></div>
      <div class="agent-ft" style="border:0;padding:0 0 0;gap:0">
        <div id="chips" class="cmp-chips">
          <button class="chip" onclick="prefill('把这一场润色成标准格式。')">${icon('spark', 12)} 润色格式</button><button class="chip" onclick="prefill('总结一下现在的大纲。')">${icon('book', 12)} 总结大纲</button>
          ${['润色对白', '续写场景', '检查人物一致性'].map((t) => `<button class="chip" onclick="prefill('${t}：')">${t}</button>`).join('')}
          <span id="wf-wrap" style="position:relative"><button class="chip" style="background:var(--primary-soft);color:var(--primary);font-weight:600" onclick="wfMenu()" aria-haspopup="menu">⚡ 工作流 ${icon('chev', 11)}</button>
            <div class="pop" id="wf-menu" role="menu" style="width:330px;left:0">
              <div class="eyebrow" style="padding:4px 8px 6px">针对客户痛点 · 本地执行，可取消、可重试</div>
              ${WORKFLOWS.map(([t, d], i) => `<button class="wf-item" role="menuitem" onclick="runWF(${i + 1})"><span style="flex:1;text-align:left"><b style="font-weight:600">${t}</b><br><span class="muted" style="font-size:11.5px">${d}</span></span><span class="kbd">⌥${i + 1}</span></button>`).join('')}
            </div></span></div>
        <div class="queue" id="queue" aria-live="polite"></div>
        <div class="cmp"><div class="cmp-card" id="cmp-card"><div class="ghost" id="ghost" hidden><span></span><kbd>Tab</kbd></div><textarea id="ask" aria-label="给 AI 的指令" placeholder="随便问，@ 提及角色、地点或设定" rows="2" onkeydown="composerKey(event)" oninput="composerInput()"></textarea>
          <div class="cmp-bar"><button class="ico-btn" aria-label="提及" onclick="prefill($('ask').value+'@')">${icon('at', 16)}</button><button class="ico-btn" aria-label="添加文件或图片" onclick="toast('选择文件或图片')">${icon('plus', 16)}</button>
            <button class="ico-btn" id="web" aria-pressed="false" aria-label="联网搜索" title="联网搜索" onclick="this.setAttribute('aria-pressed',this.getAttribute('aria-pressed')!=='true')">${icon('globe', 15)}</button><span style="flex:1"></span>
            <span id="model-wrap" style="position:relative"><button class="chip" style="height:28px;font-weight:600" onclick="modelMenu()" aria-haspopup="menu"><span style="width:6px;height:6px;border-radius:50%;background:var(--color-success-500)"></span><span id="model">Ancher</span><span id="model-caret" hidden>${icon('chev', 11)}</span></button>
              <div class="pop" id="model-menu" role="menu" style="width:270px;right:0;left:auto;bottom:calc(100% + 6px);top:auto;transform-origin:bottom right"></div></span>
            <button class="ico-btn" aria-label="语音输入" onclick="toast('按住说话')">${icon('mic', 16)}</button>
            <button class="q-pill" id="qpill" hidden onclick="sendTyped()">加入队列<kbd>↵</kbd></button>
            <button class="cmp-send" id="send" aria-label="发送" onclick="sendTyped()">${icon('send', 15)}</button></div></div>
          <div class="cmp-note">AI 可能会出错。请核对重要信息。</div></div>
      </div>
    </section>
    <button class="fab" id="fab" hidden onclick="agentOpen(true)">${icon('spark', 15)} AI</button>
  </section>
  <aside class="info">
    <div style="display:flex;align-items:center;gap:6px"><b style="flex:1">写作</b><button class="btn btn-quiet" style="width:26px;padding:0" aria-label="导出" onclick="openModal('export')">${icon('export', 14)}</button><button class="btn btn-quiet" style="width:26px;padding:0" aria-label="写作进度">${icon('chart', 14)}</button><button class="btn btn-quiet" style="width:26px;padding:0" aria-label="收起工具栏">${icon('panel', 14)}</button></div>
    <div><div class="muted" style="font-size:12px;margin-bottom:6px">分页</div><div class="seg"><button class="on">精简</button><button>分页</button></div></div>
    <div><div class="muted" style="font-size:12px;margin-bottom:6px">格式</div><div class="seg"><button class="on">好莱坞</button><button>亚洲</button></div></div>
    <div><div class="muted" style="font-size:12px;margin-bottom:6px">项目类型</div><div class="seg"><button>电影</button><button class="on">剧集</button></div></div>
    <div><div class="muted" style="font-size:12px;margin-bottom:6px">统计</div><div class="kv tnum" style="font-size:12.5px">${[['场景', 's-scenes'], ['字数', 's-words'], ['角色', 's-chars'], ['地点', 's-locs'], ['节拍', 's-beats'], ['镜头', 's-shots'], ['关系', 's-rel']].map(([k, id]) => `<span>${k}</span><span id="${id}">0</span>`).join('')}</div></div>
  </aside>`, `${gsPopover}${exportModal}
  <script>window.DATA=${JSON.stringify({ IDEA, SCRIPT1, SCRIPT2, OUTLINE, CHARS: CHARS.map((c) => c[0]), LOCS })};</script>
  <script>${LAPER_JS}</script>`);

// Replays the laper run observed in the walkthrough: auto-start from the onboarding sentence, tool
// calls in the same order, view switching, node highlight, checklist toasts, a closing question,
// and a per-turn "N edits · undo" on the second turn.
const LAPER_JS = String.raw`
const $=s=>document.getElementById(s), feed=$('feed'), page=$('page');
const CLS={heading:'sc-heading',action:'sc-action',char:'sc-char',paren:'sc-paren',dial:'sc-dial',trans:'sc-trans'};
let busy=false, turn=0, done=new Set(), sceneN=0, words=0, inserted=[];
// ── Typewriter sound, synthesised with Web Audio (no audio files). Browsers only allow sound after a click. ──
const TW={ ctx:null, on:true, vol:.32, last:0,
  ensure(){ try{ if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)(); if(this.ctx.state==='suspended') this.ctx.resume().then(()=>this.ui()); }catch(_){} this.ui(); return this.ctx; },
  ready(){ return this.on && this.ctx && this.ctx.state==='running'; },
  ui(){ const b=$('snd'); if(!b) return; const live=this.ready(); b.textContent=!this.on?'🔇 打字机音效已关':(live?'🔊 打字机音效':'🔇 点一下开启打字机音效'); b.classList.toggle('sound-off',!live); b.setAttribute('aria-pressed',live); },
  toggle(){ if(this.ctx && this.ctx.state==='running' && this.on){ this.on=false; } else { this.on=true; this.ensure(); } this.ui(); },
  burst(dur, f0, q, gain, t){ const c=this.ctx, n=Math.floor(c.sampleRate*dur), b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,5);
    const s=c.createBufferSource(); s.buffer=b; const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=f0; f.Q.value=q; const g=c.createGain(); g.gain.value=gain*this.vol;
    s.connect(f).connect(g).connect(c.destination); s.start(t); },
  thock(freq, dur, gain, t){ const c=this.ctx, o=c.createOscillator(), g=c.createGain(); o.type='triangle'; o.frequency.setValueAtTime(freq,t); o.frequency.exponentialRampToValueAtTime(freq*.6,t+dur);
    g.gain.setValueAtTime(gain*this.vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g).connect(c.destination); o.start(t); o.stop(t+dur+.01); },
  key(ch){ if(!this.ready()) return; const c=this.ctx, t=c.currentTime; if(t-this.last<.018) return; this.last=t;   // typebar strike: bright click + body thock
    const soft=/[\s，。、；：！？“”‘’（）…—,.;:!?'"()]/.test(ch); this.burst(.03, 2200+Math.random()*1800, 1.4, soft?.5:1, t); this.thock(120+Math.random()*50, .035, soft?.35:.6, t); },
  ret(){ if(!this.ready()) return; const t=this.ctx.currentTime; this.burst(.16, 900, .7, .5, t); this.thock(70, .09, .8, t+.12); },   // carriage return
  ding(){ if(!this.ready()) return; const c=this.ctx, t=c.currentTime; [[2093,.35],[3136,.18],[4186,.08]].forEach(([f,a])=>{ const o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.value=f;
    g.gain.setValueAtTime(a*this.vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+1.4); o.connect(g).connect(c.destination); o.start(t); o.stop(t+1.5); }); },
};
document.addEventListener('pointerdown',(e)=>{ if(e.target.closest('#snd')) return; if(TW.on && (!TW.ctx || TW.ctx.state!=='running')) TW.ensure(); },{capture:true});
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
async function typeInto(p, text){ p.classList.add('typing'); if(REDUCED){ p.textContent=text; p.classList.remove('typing'); return; }
  const ms=text.length>40?16:24; for(let i=0;i<text.length;i++){ p.textContent=text.slice(0,i+1); TW.key(text[i]); await wait(ms); }
  p.classList.remove('typing'); TW.ret(); await wait(90); }

// ── Export: real files from the current script (the desktop app writes the same formats via the save dialog) ──
function collect(){ return [...page.querySelectorAll('.sc-node:not([hidden])')].map(n=>[Object.keys(CLS).find(k=>n.classList.contains(CLS[k]))||'action', n.textContent]).filter(([,x])=>x.trim()); }
const xesc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function download(name, mime, text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['﻿'+text],{type:mime+';charset=utf-8'})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); }
const FDX_TYPE={heading:'Scene Heading',action:'Action',char:'Character',paren:'Parenthetical',dial:'Dialogue',trans:'Transition'};
const EXPORTERS={
  fountain:(ns)=>ns.map(([t,x])=>t==='heading'?'\n.'+x.replace(' — ',' - '):t==='char'?'\n@'+x:t==='trans'?'\n> '+x:t==='action'?'\n'+x:x).join('\n').trim()+'\n',
  txt:(ns)=>ns.map(([t,x])=>t==='heading'?'\n'+x:t==='char'?'\n'+' '.repeat(20)+x:t==='paren'?' '.repeat(16)+x:t==='dial'?' '.repeat(10)+x:t==='trans'?'\n'+' '.repeat(40)+x:'\n'+x).join('\n').trim()+'\n',
  fdx:(ns)=>'<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n<FinalDraft DocumentType="Script" Template="No" Version="5">\n<Content>\n'+ns.map(([t,x])=>'<Paragraph Type="'+FDX_TYPE[t]+'"><Text>'+xesc(x)+'</Text></Paragraph>').join('\n')+'\n</Content>\n</FinalDraft>\n',
  doc:(ns)=>'<html><head><meta charset="utf-8"><style>body{font-family:"Courier New",FangSong,STFangsong,serif;font-size:12pt;line-height:1.5}p{margin:0 0 6pt}.h{font-weight:bold;margin-top:14pt}.c{margin-left:2.2in;margin-top:10pt}.p{margin-left:1.6in}.d{margin-left:1.1in;margin-right:1.2in}.t{text-align:right}</style></head><body>'+
    ns.map(([t,x])=>'<p class="'+({heading:'h',char:'c',paren:'p',dial:'d',trans:'t'}[t]||'')+'">'+xesc(x)+'</p>').join('')+'</body></html>',
};
function doExport(){ const fmt=(document.querySelector('input[name="ff"]:checked')||{}).value||'pdf', what=(document.querySelector('input[name="ec"]:checked')||{}).value||'剧本';
  if(what!=='剧本'){ toast('演示里只实现了导出剧本；'+what+'在桌面版里提供'); return; }
  const ns=collect(); if(!ns.length){ toast('剧本还是空的，先让 AI 写几场'); return; }
  const base=($('proj').textContent||'剧本')+'-第1集'; closeModal('export');
  if(fmt==='pdf'){ view('script'); setTimeout(()=>window.print(),120); toast('在打印对话框里选"存储为 PDF"'); return; }
  const meta={fdx:['.fdx','application/xml'],fountain:['.fountain','text/plain'],doc:['.doc','application/msword'],txt:['.txt','text/plain']}[fmt];
  download(base+meta[0], meta[1], EXPORTERS[fmt](ns)); toast('已导出 '+base+meta[0]+' · '+ns.length+' 段'); }

// Follows the bottom only while the reader is there; otherwise counts unread and shows the 「↓ 最新」pill.
let unread=0;
const nearBottom=()=>feed.scrollHeight-feed.scrollTop-feed.clientHeight<48;
function pill(){ const j=$('jump'), n=$('jump-n'); j.classList.toggle('show',unread>0||!nearBottom()); n.hidden=!unread; n.textContent=unread>99?'99+':unread; }
feed.addEventListener('scroll',()=>{ if(nearBottom()) unread=0; pill(); });
function toLatest(){ feed.scrollTo({top:feed.scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); unread=0; pill(); }
const add=h=>{ const stick=nearBottom(); const th=$('thinking'); const d=document.createElement('div'); d.className='enter'; d.innerHTML=h;
  if(th) feed.insertBefore(d,th); else feed.appendChild(d);
  if(stick) feed.scrollTop=feed.scrollHeight; else { unread++; pill(); } return d; };
async function tool(name,obj,ms){const t=add('<div class="tool"><span class="spin"></span><span><b>'+name+'</b>'+(obj?'：'+obj:'')+' — <span class="st">进行中</span></span></div>');await wait(ms||420);t.querySelector('.spin').outerHTML='<span class="ok">✓</span>';t.querySelector('.st').textContent='完成';}
const VT={script:'剧本',outline:'大纲',shots:'分镜',scn:'场景'};
function view(v){ ['page','outline','shots','scn'].forEach(id=>$(id).hidden=(id==='page'?'script':id)!==v); $('tb').hidden=v!=='script';$('hd-seg').hidden=v!=='script';$('hd-title').textContent=VT[v];
  ['script','outline','shots','scn'].forEach(k=>$('nv-'+k).classList.toggle('on',k===v)); if(v==='shots') renderShots(); if(v==='scn') renderScn(); }
// Scenes are read live from the script page, so they always match what's written.
function readScenes(){ const out=[]; let cur=null; document.querySelectorAll('#page .sc-node').forEach(n=>{ const t=n.textContent.trim();
  if(n.classList.contains('sc-heading')){ cur={el:n,h:t,chars:new Set(),lines:[],dl:0}; out.push(cur); return; } if(!cur) return;
  if(n.classList.contains('sc-char')){ cur.chars.add(t); cur.who=t; } else if(n.classList.contains('sc-dial')){ cur.lines.push(['dial',t,cur.who]); cur.dl++; } else if(n.classList.contains('sc-action')) cur.lines.push(['action',t]); }); return out; }
const EMPTY_V=(what)=>'<div class="muted" style="text-align:center;padding:60px 0;font-family:var(--font-family-sans)">剧本里还没有场景，'+what+'会在 AI 写完剧本后自动出现。<br><button class="btn btn-ghost" style="height:30px;margin-top:12px" onclick="view(\'script\')">回到剧本</button></div>';
function renderScn(){ const sc=readScenes(); $('scn').innerHTML=sc.length?'<div style="display:flex;flex-direction:column;gap:10px;font-family:var(--font-family-sans)">'+sc.map((s,i)=>{ const [ie,...rest]=s.h.split(' '); const tm=s.h.split('—')[1]||'';
  return '<button class="card scn-c" data-i="'+i+'"><span class="tnum scn-n">'+(i+1)+'</span><span style="flex:1;min-width:0"><b class="sc-heading" style="margin:0;font-size:13px">'+s.h+'</b><span class="muted" style="display:block;font-size:12px;margin-top:4px">'+((s.lines.find(l=>l[0]==='action')||['',''])[1]).slice(0,60)+'</span><span style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">'+[...s.chars].map(c=>'<span class="chip" style="height:20px;font-size:11px">'+c+'</span>').join('')+'<span class="chip tnum" style="height:20px;font-size:11px">'+s.dl+' 句对白</span>'+(tm?'<span class="chip" style="height:20px;font-size:11px">'+tm.trim()+'</span>':'')+'</span></span><span class="muted" style="font-size:11.5px;white-space:nowrap">跳到剧本 →</span></button>'; }).join('')+'</div>':EMPTY_V('场景');
  $('scn').querySelectorAll('.scn-c').forEach(b=>b.onclick=()=>{ const s=sc[+b.dataset.i]; view('script'); s.el.scrollIntoView({block:'center'}); s.el.classList.add('flash'); setTimeout(()=>s.el.classList.remove('flash'),900); }); }
const SHOTS={}; const SIZE=['全景','中景','近景','特写'];
function cut(s){ const out=[]; s.lines.forEach((l,k)=>{ if(l[0]==='action') out.push([k===0?'全景':'中景', l[1], 4]); else out.push([l[1].length>14?'近景':'特写', l[2]+'：'+l[1], Math.max(2,Math.round(l[1].length/5))]); }); return out; }
function renderShots(){ const sc=readScenes(); if(!sc.length){ $('shots').innerHTML=EMPTY_V('分镜'); return; }
  $('shots').innerHTML='<div style="font-family:var(--font-family-sans);display:flex;flex-direction:column;gap:18px"><div style="display:flex;align-items:center;gap:8px"><span class="muted" style="font-size:12.5px;flex:1">按场拆镜头。点格子直接改；景别点一下切换。</span><button class="btn btn-primary" style="height:30px" id="shots-all">${icon('spark', 13)} AI 拆全部分镜</button></div>'+
    sc.map((s,i)=>{ const list=SHOTS[i]; return '<section><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b class="sc-heading" style="margin:0;flex:1;font-size:13px">'+(i+1)+'. '+s.h+'</b>'+(list?'<span class="muted tnum" style="font-size:11.5px">'+list.length+' 镜 · '+list.reduce((a,x)=>a+x[2],0)+' 秒</span>':'')+'<button class="btn btn-ghost" style="height:26px" data-cut="'+i+'">'+(list?'重新拆':'拆分镜')+'</button></div>'+
      (list?'<table class="shot-tb"><thead><tr><th>镜号</th><th>景别</th><th>画面 / 台词</th><th>时长</th></tr></thead><tbody>'+list.map((x,k)=>'<tr'+(x.fresh?' class="new" style="animation-delay:'+(k*40)+'ms"':'')+'><td class="tnum">'+(i+1)+'-'+(k+1)+'</td><td><button class="chip shot-sz" data-s="'+i+'" data-k="'+k+'">'+x[0]+'</button></td><td contenteditable="true" data-s="'+i+'" data-k="'+k+'">'+x[1]+'</td><td class="tnum">'+x[2]+'s</td></tr>').join('')+'</tbody></table>':'<div class="muted" style="font-size:12px;padding:10px;border:1px dashed var(--line-strong);border-radius:var(--r)">还没拆镜头</div>')+'</section>'; }).join('')+'</div>';
  Object.values(SHOTS).forEach(l=>l.forEach(x=>x.fresh=false));
  const go=(i)=>{ SHOTS[i]=cut(sc[i]).map(x=>Object.assign(x,{fresh:true})); };
  $('shots').querySelectorAll('[data-cut]').forEach(b=>b.onclick=()=>{ go(+b.dataset.cut); renderShots(); stat('s-shots',Object.values(SHOTS).reduce((a,l)=>a+l.length,0)); step(5); });
  $('shots-all').onclick=()=>{ sc.forEach((_,i)=>go(i)); renderShots(); stat('s-shots',Object.values(SHOTS).reduce((a,l)=>a+l.length,0)); step(5); toast('已为 '+sc.length+' 场拆出分镜'); };
  $('shots').querySelectorAll('.shot-sz').forEach(b=>b.onclick=()=>{ const x=SHOTS[+b.dataset.s][+b.dataset.k]; x[0]=SIZE[(SIZE.indexOf(x[0])+1)%4]; b.textContent=x[0]; });
  $('shots').querySelectorAll('[contenteditable]').forEach(c=>c.oninput=()=>{ SHOTS[+c.dataset.s][+c.dataset.k][1]=c.textContent; }); }
function agentOpen(o){$('agent').classList.toggle('min',!o);$('fab').hidden=o;}
const STEPS=['和 AI 聊聊','写一份大纲','写一些剧本','添加一个角色','添加一个地点','添加一个镜头'];
function step(i){ if(done.has(i)) return; done.add(i); const n=done.size; $('ring').style.strokeDashoffset=94.2*(1-n/6); $('gs-n').textContent=n+' / 6'; $('gs-bar').style.width=(n/6*100)+'%';
  const el=document.querySelector('.gs-i[data-i="'+i+'"]'); el.querySelector('.gs-c').innerHTML='✓'; el.querySelector('.gs-c').style.cssText+='background:var(--primary);color:var(--primary-fg);box-shadow:none'; el.querySelector('.gs-t').style.cssText='text-decoration:line-through;color:var(--ink-3)';
  toast(n===6?'全部 6 步完成 🎉 你已经摸清门路了':'完成：'+STEPS[i]+'（'+n+'/6）'); }
function gs(){ $('gs').hidden=!$('gs').hidden; }
function stat(id,v){ $(id).textContent=v; }
async function insertNodes(list){ const s=$('empty'); if(s){s.remove();$('ph').remove();}
  for(const [ty,x] of list){ const p=document.createElement('p'); p.className='sc-node writing '+CLS[ty]; page.appendChild(p); inserted.push(p); p.scrollIntoView({block:'nearest'});
    await typeInto(p, x);
    if(ty==='heading'){ sceneN++; const [loc,tod]=x.split(' — '); $('scenes-h').hidden=false; $('scenes').insertAdjacentHTML('beforeend','<div class="item enter"><span class="tnum muted">'+sceneN+'.</span>'+loc+'<small>'+tod+'</small></div>'); stat('s-scenes',sceneN); }
    words+=x.length; stat('s-words',words.toLocaleString()); setTimeout(()=>p.classList.remove('writing'),700); } }
function userSay(t){
  const d=add('<div class="ag-user"><div class="bubble"><div class="bd"></div></div><div class="msg-acts"><button class="ico-btn" aria-label="复制消息">'+ICON.copy+'</button></div></div>');
  d.querySelector('.bd').textContent=t; const b=d.querySelector('.bubble');
  // Clamp long messages (Ancher: 164px) with a fade and 展开更多 / 收起.
  requestAnimationFrame(()=>{ if(b.querySelector('.bd').scrollHeight>164){ const m=document.createElement('button'); m.className='more'; m.setAttribute('aria-expanded','false'); m.innerHTML='<span>展开更多</span>'+ICON.chevD;
    m.onclick=()=>{ const o=b.classList.toggle('open'); m.setAttribute('aria-expanded',o); m.firstChild.textContent=o?'收起':'展开更多'; }; b.appendChild(m); } });
  d.querySelector('.msg-acts .ico-btn').onclick=e=>{ navigator.clipboard&&navigator.clipboard.writeText(t).catch(()=>{}); const btn=e.currentTarget; btn.innerHTML=ICON.check; setTimeout(()=>btn.innerHTML=ICON.copy,2000); };
}
function actions(){ const t=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  return '<div class="msg-acts"><button class="ico-btn" aria-label="复制" onclick="this.innerHTML=ICON.check;setTimeout(()=>this.innerHTML=ICON.copy,2000)">'+ICON.copy+'</button><button class="ico-btn" aria-label="存为笔记" onclick="toast(\'已存为笔记\')">'+ICON.note+'</button><button class="ico-btn" aria-label="好的回答" aria-pressed="false" onclick="this.setAttribute(\'aria-pressed\',this.getAttribute(\'aria-pressed\')!==\'true\')">'+ICON.up+'</button><button class="ico-btn" aria-label="不好的回答" aria-pressed="false" onclick="this.setAttribute(\'aria-pressed\',this.getAttribute(\'aria-pressed\')!==\'true\')">'+ICON.down+'</button><span class="msg-time">'+t+'</span></div>'; }
// While the agent works: Thinking with ascii dots + shimmer, a rotating waiting tip, a running light on the composer,
// and the send button turns into a square stop (Ancher agent-input / message-thinking / waiting-tip).
const TIPS=['把参考剧本放进知识库并打开「写作时参考」，AI 会照着它写。','按 ⌥1–⌥9 可以直接启动工作流。','选中剧本里的文字，可以让 AI 解释、总结或翻译。','改写已有内容时会先给你修改预览，接受才写入。'];
let dotsT, tipT;
function lock(on){ busy=on; ghost(''); const s=$('send'); s.innerHTML=on?ICON.square:ICON.send; s.classList.toggle('stop',on); s.setAttribute('aria-label',on?'停止':'发送'); $('cmp-card').classList.toggle('busy',on);
  clearInterval(dotsT); clearInterval(tipT); $('thinking')&&$('thinking').remove();
  composerInput();
  if(!on){ // turn over: send the next queued message, else offer a suggestion
    if(queue.length){ const next=queue.shift(); renderQueue(); setTimeout(()=>{ $('ask').value=next; sendTyped(); },400); }
    else ghost(SUGG[(turn||0)%SUGG.length]);
    return; }
  const th=document.createElement('div'); th.id='thinking'; th.style.cssText='display:flex;flex-direction:column;gap:8px';
  th.innerHTML='<button class="thinking" aria-label="正在思考"><span class="dots" aria-hidden="true">⠋</span><span class="shimmer">Thinking</span>'+ICON.chevR+'</button><div class="wait-tip">'+ICON.bulb+'<span></span><button class="ico-btn" aria-label="关闭提示" onclick="this.parentElement.remove()">'+ICON.x+'</button></div>';
  feed.appendChild(th); if(nearBottom()||true) feed.scrollTop=feed.scrollHeight;
  const F='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'; let i=0; const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce) dotsT=setInterval(()=>{ const d=th.querySelector('.dots'); if(d) d.textContent=F[i++%F.length]; },90);
  let k=Math.floor(Math.random()*TIPS.length); const tip=()=>{ const sp=th.querySelector('.wait-tip span'); if(sp) sp.textContent=TIPS[k++%TIPS.length]; }; tip(); tipT=setInterval(tip,5000); }

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
  await insertNodes(DATA.SCRIPT1); t.querySelector('.spin').outerHTML='<span class="ok">✓</span>'; t.querySelector('.st').textContent='完成 × '+DATA.SCRIPT1.length; TW.ding(); step(2); stat('s-rel',2);
  add('<div class="narr">《门墩儿》前三场落好了。<br><br>项目改名为《门墩儿》，第二集已经建好，暂定叫《借来的东西》。两集大纲都写了：第一集立住"只有豆豆看得见门墩儿"这条规矩，第二集往"借来的东西会想家"的方向走。<br><br>正文只写了第一集前三场：门墩儿开口、饭桌上的心不在焉、操场上的亮灯鞋。第三场书包里那块会动的石头碎屑，是我埋的线。<br><br>要不要往下想：豆豆第一次求门墩儿帮忙，会求什么？</div>'+actions());
  inserted=[]; lock(false); $('ask').value='他会求一双会亮灯的鞋。按大纲把第一集剩下的写完，结尾留个钩子接第二集。'; }

async function turn2(text){ lock(true); turn=2; inserted=[]; userSay(text);
  await tool('读取剧本大纲'); await tool('查看地点'); await tool('创建地点','姥爷修车铺',300); $('c-locs').textContent=+$('c-locs').textContent+1; stat('s-locs',$('c-locs').textContent);
  const t=add('<div class="tool"><span class="spin"></span><span><b>插入剧本节点</b> — <span class="st">进行中</span></span></div>');
  await insertNodes(DATA.SCRIPT2); t.querySelector('.spin').outerHTML='<span class="ok">✓</span>'; t.querySelector('.st').textContent='完成 × '+DATA.SCRIPT2.length; TW.ding();
  add('<div class="narr">第一集写完了，五场。鞋底那个"建"字就是钩子——第二集一开场，姥爷就得回答"这鞋你从哪儿拿的"。<br><br>要不要想想：姥爷是会追问，还是假装没看见？</div>'+actions());
  const n=inserted.length+1;
  add('<div class="turn"><span class="tnum">本轮 '+n+' 处修改</span><button class="btn btn-ghost" style="height:26px;padding:0 10px" onclick="undo(this)">'+ICON.undo+' 撤销</button></div>');
  add('<div style="display:flex;flex-wrap:wrap;gap:6px"><button class="chip" onclick="runWF(7)">'+ICON.video+' 把 ~/Movies/参考第1集.mp4 转成逐字稿</button><button class="chip" onclick="runWF(2)">'+ICON.video+' 这集不满意，参考哆啦A梦第 1 集的结构重写</button></div>');
  lock(false); }
function undo(b){ inserted.forEach(p=>p.remove()); const n=inserted.length+1; inserted=[]; sceneN-=2; const sc=$('scenes'); sc.lastElementChild.remove(); sc.lastElementChild.remove(); stat('s-scenes',sceneN);
  $('c-locs').textContent=+$('c-locs').textContent-1; stat('s-locs',$('c-locs').textContent); b.closest('.turn').innerHTML='<span class="muted">已撤销本轮 '+n+' 处修改</span>'; toast('已撤销 '+n+' 处修改'); }
// ── Pain-point workflows: local state machines with progress, cancel and retry (spec §5.6) ──
let model='Ancher', geminiOn=false, wfCancel=false, wfEdits=null;
const WF={
  1:{name:'一个创意 → 3 个走向', say:'这个创意给我 3 个冲突来源和解决方式都不同的走向。', steps:[['读取大纲'],['读取规则与反例','12 条 · 反例 4'],['Ancher 联网调研','小学生 攀比 球鞋',900],['生成 3 个走向','每个 ≤ 500 字',700]], result:()=>resOptions()},
  2:{name:'参考经典结构重写', say:'这集不满意，参考哆啦A梦第 1 集的结构重写，换成我们的人物。<div style="margin-top:6px"><span class="att">'+ICON.video+' 哆啦A梦 第1集.mp4 · 22:14</span></div>', steps:[['Ancher 解析参考视频','转写 · 关键帧',1000],['拆解节拍','6 拍'],['功能位映射','4 个角色'],['原创度检查','人物 / 道具 / 台词 0% 重合'],['生成改写','第 3 场',800]], result:()=>resRewrite()},
  3:{name:'笑点方案', say:'第 3 场操场这里不够好笑，给几个笑点方案，别用摔跤。', steps:[['读取上下文','第 3 场'],['读取正反例','好笑 9 · 不好笑 6'],['生成方案','4 个',700]], result:()=>resJokes()},
  4:{name:'写飘检查', say:'对照大纲和锁定的故事核心，检查这一稿有没有写飘。', steps:[['读取大纲与故事核心'],['读取剧本全文'],['逐项比对','核心 · 重场戏 · 人物规矩',700]], result:()=>resDrift()},
  5:{name:'导演意见 → 规则', say:'把导演这张批注整理成规则。<div style="margin-top:6px"><span class="att">导演批注 10/06.png</span></div>', steps:[['识别截图','2 处批注',700],['对照本地规则库','12 条 · 1 条相近'],['生成待确认规则']], result:()=>resRule()},
  6:{name:'控字数 / 时长', say:'把这集压到 10 分钟以内，重场戏不动。', steps:[['读取剧本全文'],['按场估算时长','预计 11.2 分钟'],['生成删减方案','重场戏锁定',700]], result:()=>resTrim()},
  7:{name:'视频 → 逐字稿', say:'把 ~/Movies/参考第1集.mp4 转成逐字稿。', steps:()=>[['检查格式和大小','MP4 · 22:14 · 412 MB'],['抽取音轨（ffmpeg，本机）','16 kHz 单声道 · 21 MB',700],[model==='Ancher'?'上传音频到 Ancher':'上传音频到 Gemini Files API','21 MB',900,true],[model==='Ancher'?'Ancher 转写':'Gemini 转写','分段 · 时间轴 · 说话人',1100],['保存到项目','逐字稿 / SRT / JSON']], result:()=>resTranscript()},
  8:{name:'今日热点选题', say:'从今天的热点里挑 5 个适合 5–10 岁孩子的选题。', steps:[['Ancher 联网搜索','开学季 · 校园 · 家庭',900],['按儿童 / 家庭 / 学校筛选','保留 5 个'],['生成选题卡']], result:()=>resTopics()},
};
function wfMenu(open){ const m=$('wf-menu'); m.classList.toggle('open', open===undefined?!m.classList.contains('open'):open); }
async function runWF(k){ wfMenu(false); if(busy){ toast('AI 正在写，等这一轮结束再试'); return; } const w=WF[k]; const steps=typeof w.steps==='function'?w.steps():w.steps;
  lock(true); wfCancel=false; userSay(w.say);
  const card=add('<div class="wf"><div class="row"><b style="flex:1">⚡ '+w.name+'</b><span class="muted tnum wf-state" style="font-size:12px">0 / '+steps.length+'</span><button class="btn btn-ghost wf-cancel" style="height:24px;padding:0 8px;font-size:12px">取消</button></div>'+
    steps.map(([n,d])=>'<div class="wf-step pending"><span class="dot-pending"></span><span>'+n+(d?' <span class="muted">· '+d+'</span>':'')+'</span><span class="st">等待</span></div>').join('')+'</div>');
  card.querySelector('.wf-cancel').onclick=()=>{ wfCancel=true; };
  const rows=[...card.querySelectorAll('.wf-step')]; const t0=Date.now(); let failedOnce=false;
  for(let i=0;i<steps.length;i++){ const [n,d,ms,flaky]=steps[i]; const r=rows[i];
    if(wfCancel){ rows.slice(i).forEach(x=>{x.querySelector('.st').textContent='已取消';}); card.querySelector('.wf-state').textContent='已取消 · 没有写入任何内容'; card.querySelector('.wf-cancel').remove(); lock(false); return; }
    r.classList.remove('pending'); r.firstElementChild.outerHTML='<span class="spin"></span>'; r.querySelector('.st').textContent='进行中';
    await wait(ms||480);
    if(flaky && !failedOnce){ failedOnce=true; r.firstElementChild.outerHTML='<span class="fail">✕</span>'; r.querySelector('.st').innerHTML='失败：网络超时 <button class="chip" style="height:22px;margin-left:6px">重试</button>';
      card.querySelector('.wf-state').textContent='第 '+(i+1)+' 步失败';
      await new Promise(res=>{ r.querySelector('.st button').onclick=res; card.querySelector('.wf-cancel').onclick=()=>{ wfCancel=true; res(); }; });
      if(wfCancel){ i--; continue; } card.querySelector('.wf-cancel').onclick=()=>{ wfCancel=true; }; i--; r.firstElementChild.outerHTML='<span class="dot-pending"></span>'; continue; }
    r.firstElementChild.outerHTML='<span class="ok">✓</span>'; r.querySelector('.st').textContent='完成'; card.querySelector('.wf-state').textContent=(i+1)+' / '+steps.length; }
  card.querySelector('.wf-state').textContent='已完成 · '+((Date.now()-t0)/1000).toFixed(1)+' 秒'; card.querySelector('.wf-cancel').remove();
  w.result(); lock(false); }

// Results
function resOptions(){ add('<div class="result"><b>3 个走向 · 冲突来源和解决方式都不同</b>'+[['借来的鞋','道具失控','鞋停不下来，姥爷认出旧主'],['修车铺的一天','换位体验','帮姥爷补一天鞋，看见每双鞋的路'],['一只鞋的旅行','物件回望','旧鞋开口讲它陪豆豆走过哪儿']].map(([t,m,d],k)=>'<div style="border-top:1px solid var(--line);padding-top:8px"><div class="row"><b style="flex:1">'+'ABC'[k]+' · '+t+'</b><span class="chip" style="height:20px">'+m+'</span></div><div class="muted" style="font-size:12.5px;margin:4px 0">'+d+'</div><button class="btn btn-ghost" style="height:26px" onclick="toast(\'已把「'+t+'」写进大纲\')">用这个</button></div>').join('')+'</div>'); }
function resJokes(){ add('<div class="result"><b>笑点方案</b>'+[['大壮跺一下脚，鞋灯亮；豆豆跺一下，书包里传出门墩儿一声"哎哟"','反差',''],['全班学大壮跺脚，教室像迪厅，老师推门那一刻全体定格','升级 + 定格',''],['豆豆的鞋头张着嘴，门墩儿替它配音："我也想亮灯！"','物件拟人',''],['豆豆摔了个四脚朝天','摔跤类','与导演规则「不用摔跤类笑点」冲突']].map(([t,m,w])=>'<div style="border-top:1px solid var(--line);padding-top:8px;'+(w?'opacity:.55':'')+'"><div>'+t+'</div><div class="row" style="margin-top:6px"><span class="muted" style="font-size:12px;flex:1">'+m+(w?' · <span style="color:var(--color-danger-500)">'+w+'</span>':'')+'</span><button class="chip" onclick="this.parentElement.innerHTML=\'<span class=chip>已记为好笑 · 进正例</span>\'">好笑</button><button class="chip" onclick="this.parentElement.innerHTML=\'<span class=chip>已记为不好笑 · 进反例</span>\'">不好笑</button></div></div>').join('')+'</div>'); }
function resDrift(){ add('<div class="result"><b>写飘检查</b>'+[['ok','故事核心「借来的东西会想家」保留'],['ok','重场戏「姥爷认出鞋底的字」在第 5 场'],['m','第 2 场饭桌戏和主线关系弱，可以删或合并'],['m','门墩儿第 3 场没出场，"只有豆豆看得见"的规矩没用上']].map(([l,t])=>'<div class="row">'+(l==='ok'?'<span class="ok">✓</span>':'<span class="lvl m">提醒</span>')+t+'</div>').join('')+'<div class="row"><button class="chip" onclick="runWF(2)">用"参考结构重写"修第 3 场</button><button class="chip" onclick="runWF(6)">删减第 2 场</button></div></div>'); }
function resRule(){ add('<div class="result"><b>不用摔跤、踩香蕉皮这类笑点</b><div class="muted" style="font-size:12px">原话："孩子们笑的不是摔，是没想到。" · 导演 · 10/06</div><div class="row" style="font-size:12.5px">适用：<label><input type="radio" name="sc" checked style="accent-color:var(--primary)"> 全剧</label><label><input type="radio" name="sc" style="accent-color:var(--primary)"> 本集</label><label><input type="radio" name="sc" style="accent-color:var(--primary)"> 某个人物</label></div><div class="row"><button class="btn btn-primary" style="height:28px" onclick="this.parentElement.innerHTML=\'<span class=chip>已存入本地规则库 · 之后的生成都会遵守</span>\';toast(\'规则已入库 · 共 13 条\')">确认入库</button><button class="btn btn-ghost" style="height:28px" onclick="this.closest(\'.result\').style.opacity=.5">驳回</button></div></div>'); }
function resTranscript(){ add('<div class="result"><div class="row"><b style="flex:1">逐字稿 · 参考第1集</b><span class="muted tnum" style="font-size:12px">3,960 字 · 312 段</span></div>'+
  '<div style="font-family:var(--font-family-mono);font-size:12px;color:var(--ink-2);line-height:1.7">[00:00:12] 甲：……<br>[00:00:15] 乙：……<br>[00:00:21] 甲：……</div>'+
  '<div class="row muted" style="font-size:12px">模型：'+model+'</div>'+
  '<div class="row"><button class="btn btn-ghost" style="height:28px" onclick="toast(\'已存入项目资料 · 可在对话里引用\')">存入项目资料</button><button class="btn btn-ghost" style="height:28px" onclick="toast(\'已导出 .srt / .txt / .json\')">导出 SRT</button></div></div>'); }
function resTopics(){ add('<div class="result"><b>今日选题 · 5 个</b>'+[['全班比谁的球鞋会亮','品德'],['午休偷偷刷短视频','健康'],['胡同里的共享单车停哪儿','劳动'],['姥爷的修车铺要搬走了','生命'],['值日变成"雇人值日"','劳动']].map(([t,th])=>'<div class="row" style="border-top:1px solid var(--line);padding-top:6px"><span style="flex:1">'+t+'</span><span class="chip" style="height:20px">'+th+'</span></div>').join('')+'</div>'); }

// Modification preview: rewrites of existing text are shown as a diff and only written after "accept".
function preview(title, note, ops){ const box=add('<div class="result"><div class="row"><b style="flex:1">修改预览 · '+title+'</b><span class="muted" style="font-size:12px">'+note+'</span></div>'+
  ops.map(o=>'<div class="diff-del">'+o.find+'</div>'+o.put.map(([,x])=>'<div class="diff-add">'+x+'</div>').join('')).join('')+
  '<div class="row"><button class="btn btn-primary" style="height:28px">接受并写入</button><button class="btn btn-ghost" style="height:28px">拒绝</button></div></div>');
  const [ok,no]=box.querySelectorAll('.row:last-child button');
  no.onclick=()=>{ box.querySelector('.row:last-child').innerHTML='<span class="muted">已拒绝，剧本没有改动</span>'; };
  ok.onclick=async()=>{ box.querySelector('.row:last-child').innerHTML='<span class="muted">正在写入…</span>'; view('script'); const removed=[], added=[];
    for(const o of ops){ const old=[...page.querySelectorAll('.sc-node')].find(n=>n.textContent===o.find); if(!old) continue; let anchor=old;
      for(const [ty,x] of o.put){ const n=document.createElement('p'); n.className='sc-node writing '+CLS[ty]; anchor.after(n); anchor=n; added.push(n); n.scrollIntoView({block:'nearest'}); await typeInto(n, x); setTimeout(()=>n.classList.remove('writing'),700); }
      removed.push(old); old.hidden=true; }
    TW.ding(); wfEdits={removed,added}; box.querySelector('.row:last-child').outerHTML='<div class="turn"><span class="tnum">本轮 '+(removed.length+added.length)+' 处修改</span><button class="btn btn-ghost" style="height:26px;padding:0 10px" onclick="wfUndo(this)">'+ICON.undo+' 撤销</button></div>'; };
}
function wfUndo(b){ if(!wfEdits) return; wfEdits.added.forEach(n=>n.remove()); wfEdits.removed.forEach(n=>n.hidden=false); const n=wfEdits.added.length+wfEdits.removed.length; wfEdits=null; b.closest('.turn').innerHTML='<span class="muted">已撤销本轮 '+n+' 处修改</span>'; toast('已撤销 '+n+' 处修改'); }
function resRewrite(){
  add('<div class="result"><b>参考结构 · 只取骨架，不取内容</b><ol class="beats">'+['日常困境','奇幻伙伴给出"捷径"','捷径奏效','捷径失控、越帮越忙','主角靠自己的选择收场','小反转收尾'].map(x=>'<li>'+x+'</li>').join('')+'</ol>'+
    '<div class="map">'+[['受挫的主角','豆豆'],['带道具的奇幻伙伴','门墩儿（只能借胡同老物件）'],['炫耀的同学','大壮'],['温和的长辈','姥爷']].map(([a,b])=>'<span class="muted">'+a+'</span><span>→</span><b style="font-weight:600">'+b+'</b>').join('')+'</div></div>');
  preview('第 3 场按"奇幻捷径"重写','只改 1 处，其他不动',[{find:'豆豆把脚往身后缩。书包侧兜里，一小块石头碎屑悄悄动了一下。',put:[['action','豆豆把脚往身后缩。书包侧兜里，传出门墩儿闷闷的声音。'],['char','门墩儿'],['paren','（小声）'],['dial','想要会亮的？我给你借一双会跑的。'],['action','豆豆还没来得及说不，脚上的旧鞋带自己松开了。']]}]); }
function resTrim(){ add('<div class="narr">预计从 <b>11.2</b> 分钟压到 <b>9.6</b> 分钟。重场戏（第 5 场）没动。</div>');
  preview('删减第 1、2 场','−1.6 分钟',[{find:'饭桌上，姥爷剥着毛豆。豆豆扒拉着米饭，眼睛一直往门口瞟。',put:[['action','饭桌上，豆豆的眼睛一直往门口瞟。']]},{find:'在这儿蹲了一百多年，头一回有人看得见我。',put:[['dial','一百多年了，头一回有人看见我。']]}]); }

// Model indicator: a fixed label while only Ancher is configured; a menu once a Gemini key exists (spec D11).
function modelMenu(){ const m=$('model-menu'); m.classList.toggle('open'); }
function enableGemini(){ geminiOn=true; $('model-caret').hidden=false; renderModelMenu(); toast('已添加 Gemini key（演示）· 现在可以切换模型'); }
function pickModel(v){ model=v; $('model').textContent=v; $('model-menu').classList.remove('open'); toast('之后的对话和工作流使用：'+v); }
function renderModelMenu(){ $('model-menu').innerHTML=geminiOn
  ? ['Ancher','Gemini · Flash'].map(v=>'<button class="btn" style="width:100%;justify-content:flex-start;font-weight:500;height:30px" onclick="pickModel(\''+v+'\')">'+(v===model?'✓ ':'　')+v+'<span class="muted" style="margin-left:auto;font-size:11px">'+(v==='Ancher'?'对话 · 联网 · 解析':'转写 · 视频理解')+'</span></button>').join('')
  : '<div style="font-size:12.5px;line-height:1.6;padding:4px 6px">现在只配置了 <b>Ancher</b>（你填写的 key）。<br>在 设置 → 模型与密钥 添加 Gemini key 后，这里才会变成下拉菜单。</div><button class="btn btn-ghost" style="height:28px;width:100%;margin-top:6px" onclick="enableGemini()">演示：已添加 Gemini key</button>'; }
function prefill(t){ $('ask').value=t; $('ask').focus(); }
document.addEventListener('keydown',e=>{ if(e.altKey&&/^Digit[1-8]$/.test(e.code)){ e.preventDefault(); runWF(+e.code.slice(5)); } });
document.addEventListener('click',e=>{ if(!e.target.closest('#wf-wrap')) $('wf-menu').classList.remove('open'); if(!e.target.closest('#model-wrap')) $('model-menu').classList.remove('open'); });
renderModelMenu();
// Ancher composer: while the agent works, typing turns send into 「加入队列 ↵」; queued messages go out in order
// when the turn ends. After a turn, a ghost suggestion sits in the empty box — Tab takes it.
const queue=[];
const SUGG=['写第二场：豆豆第一次求门墩儿帮忙','把第一场的对白改得更像孩子说话','给第一集加一个意料之外的结尾'];
function ghost(t){ const g=$('ghost'); g.querySelector('span').textContent=t||''; g.hidden=!t||!!$('ask').value; }
function composerInput(){ const has=!!$('ask').value.trim(); $('qpill').hidden=!(busy&&has); $('send').hidden=busy&&has; ghost(has?'':$('ghost').querySelector('span').textContent); }
function composerKey(e){
  if(e.key==='Tab'&&!$('ask').value&&!$('ghost').hidden){ e.preventDefault(); $('ask').value=$('ghost').querySelector('span').textContent; ghost(''); composerInput(); return; }
  if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){ e.preventDefault(); sendTyped(); } }
function renderQueue(){ $('queue').innerHTML=queue.map((t,i)=>'<div class="q-item"><small>排队中</small><span></span><button class="ico-btn xs" aria-label="移出队列" onclick="queue.splice('+i+',1);renderQueue()">'+ICON.x+'</button></div>').join('');
  $('queue').querySelectorAll('.q-item span').forEach((s,i)=>s.textContent=queue[i]); }
function sendTyped(){
  const typed=$('ask').value.trim();
  if(busy&&typed){ queue.push(typed); $('ask').value=''; renderQueue(); composerInput(); toast('已加入队列，这一轮结束后发送'); return; }
  if(busy){ toast('已停止'); return; } const v=$('ask').value.trim(); if(!v) return; $('ask').value=''; if(turn===0) return turn1(); if(turn===1) return turn2(v); userSay(v); add('<div class="narr">（演示里只预置了前两轮）</div>'); }
document.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey&&document.activeElement===$('ask')){ e.preventDefault(); sendTyped(); } });
// Direction D: the agent is a side sheet you can fling away (pointer capture, velocity threshold, rubber-band).
(function(){ const ag=$('agent'); let st=null;
  ag.addEventListener('pointerdown',e=>{ if(document.body.dataset.v!=='d'||st) return; if(!e.target.closest('#grip,.agent-hd')||e.target.closest('button')) return;
    st={x:e.clientX,t:performance.now(),id:e.pointerId,dx:0}; try{ ag.setPointerCapture(e.pointerId); }catch(_){} ag.classList.add('dragging'); });
  ag.addEventListener('pointermove',e=>{ if(!st||e.pointerId!==st.id) return; let dx=e.clientX-st.x; if(dx<0) dx*=.25; st.dx=dx; ag.style.transform='translateX('+dx+'px)'; });
  const end=e=>{ if(!st||e.pointerId!==st.id) return; try{ ag.releasePointerCapture(e.pointerId); }catch(_){} ag.classList.remove('dragging'); const v=st.dx/Math.max(1,performance.now()-st.t);
    ag.style.transform=''; if(st.dx>140||v>.11) agentOpen(false); st=null; };
  ag.addEventListener('pointerup',end); ag.addEventListener('pointercancel',end); })();
TW.ui(); setTimeout(turn1, 700);
`;
const ICONS_JS = `<script>window.ICON=${JSON.stringify({ copy: icon('copy', 13), up: icon('up', 13), down: icon('down', 13), undo: icon('undo', 13), send: icon('send', 15), stop: icon('stop', 13), video: icon('video', 12), check: icon('check', 13), note: icon('note', 13), square: '<svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/></svg>', chevD: icon('chev', 12), chevR: icon('chev', 12).replace('<svg', '<svg style="transform:rotate(-90deg)"'), bulb: icon('bulb', 15), x: icon('x', 12) })};</script>`;

/* ═════ P5 角色画布（laper /characters） ═════ */
const RELS = [[0, 1, '秘密朋友', '只有豆豆看得见门墩儿'], [0, 2, '祖孙', '豆豆跟姥爷住，姥爷不知道门墩儿的事'], [0, 3, '同学 · 较劲', '大壮总拿新鞋显摆，豆豆不服又不敢说'],
  [1, 2, '旧相识', '那双白球鞋是姥爷小时候的——门墩儿认得他'], [1, 3, '捉弄', '门墩儿偷偷让大壮的鞋灯不亮']];
const CAST = [['童声 · 清亮', '8–10 岁 · 偏快 · 带京腔'], ['童声 · 软糯', '8–10 岁 · 偏慢 · 气声多'], ['AI 音色 · 少年 01', '可调年龄 / 语速']];
const LOOKS = ['圆脸短发 · 蓝校服', '寸头 · 红毛衣', '大眼 · 黄雨衣'];
const p5 = () => chrome('Ancher Scripter — 角色', `${rail('角色')}
  <section class="center" style="background-image:radial-gradient(var(--line-strong) 1px, transparent 1px);background-size:20px 20px">
    <div class="center-hd" style="background:var(--bg)"><b>角色</b><span class="chip tnum" style="height:20px">4</span><span style="flex:1"></span><div class="seg" role="tablist" id="cv-tabs">${['概览', '关系', '选角'].map((t, i) => `<button role="tab" data-v="${i}" class="${i ? '' : 'on'}" aria-selected="${!i}">${t}</button>`).join('')}</div><span style="flex:1"></span>
      <button class="btn btn-quiet" style="width:28px;padding:0" aria-label="导出">${icon('export', 14)}</button><button class="btn btn-primary" style="height:28px">${icon('plus', 13)} 新角色</button></div>
    <div class="cv" data-v="0" style="flex:1;display:flex;flex-direction:column;min-height:0;position:relative">
    <div class="card" style="position:absolute;right:16px;top:10px;display:flex;gap:2px;padding:4px;z-index:2">${['chat', 'trash', 'expand', 'zoom', 'zoom'].map((ic) => `<button class="btn btn-quiet" style="width:26px;height:26px;padding:0">${icon(ic, 13)}</button>`).join('')}</div>
    <div class="chars-row" style="flex:1;overflow:auto;padding:40px 32px;display:flex;gap:20px;align-items:flex-start">
      ${CHARS.map(([n, m, d, c, sc, ln], ci) => `<div style="width:230px;flex:none"><div class="seg ch-seg" style="margin-bottom:6px"><button class="on" data-m="0">肖像</button><button data-m="1">高级</button></div>
        <div class="card enter" style="overflow:hidden"><div class="ch-face" style="height:150px;background:linear-gradient(160deg, ${c}, color-mix(in srgb, ${c}, black 35%));display:flex;flex-direction:column;justify-content:flex-end;padding:12px;color:#fff">
          <div style="flex:1;display:grid;place-items:center;opacity:.7">${icon('user', 40)}</div><b style="font-size:17px">${n}</b><span style="font-size:11.5px;opacity:.9">${m}</span></div>
          <dl class="ch-adv" hidden>${[['外形', LOOKS[ci % 3]], ['口头禅', ['"那可说不准。"', '"借，不叫偷。"', '"跑不了。"', '"看我的！"'][ci]], ['想要', ['被同学看见', '有人陪他说话', '把胡同守住', '赢'][ci]], ['害怕', ['被当成怪孩子', '被忘掉', '胡同拆了', '输给豆豆'][ci]], ['配音', '未定 · 去「选角」']].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
          <div style="padding:12px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:6px"><span class="chip" style="height:22px">${icon('film', 11)} ${sc} 场</span><span class="chip" style="height:22px">${icon('chat', 11)} ${ln} 句</span></div>
          <p style="margin:0;font-size:13px;color:var(--ink-2)">${d}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button class="btn btn-ghost" style="height:30px">${icon('pen', 13)} 编辑</button><button class="btn btn-ghost" style="height:30px">${icon('upload', 13)} 上传</button></div>
          <button class="btn btn-quiet" style="height:30px" onclick="toast('正在根据角色设定生成肖像…')">${icon('spark', 13)} 生成</button></div></div></div>`).join('')}
    </div></div>

    <div class="cv" data-v="1" hidden style="flex:1;display:flex;min-height:0">
      <div class="rel-stage" id="rel-stage"><svg id="rel-svg" aria-hidden="true"></svg>
        ${CHARS.map(([n, m, , c], i) => `<button class="rel-node" data-i="${i}" style="--c:${c}"><span class="rel-dot">${n[0]}</span><span><b>${n}</b><br><span class="muted" style="font-size:11px">${m.split(' · ')[0]}</span></span></button>`).join('')}
        <div class="muted rel-hint">拖动角色调整位置 · 点角色看它的关系 · 点连线上的标签可改</div></div>
      <aside class="rel-side"><b style="font-size:14px" id="rel-side-t">全部关系</b><div id="rel-list" style="display:flex;flex-direction:column;gap:8px;margin-top:10px"></div>
        <form id="rel-add" class="card" style="padding:10px;display:flex;flex-direction:column;gap:8px;margin-top:14px"><b style="font-size:12.5px">添加关系</b>
          <div style="display:flex;gap:6px">${['ra', 'rb'].map((id, k) => `<select id="${id}" aria-label="角色${k ? '二' : '一'}" class="rel-in">${CHARS.map(([n], i) => `<option value="${i}" ${i === k + 2 ? 'selected' : ''}>${n}</option>`).join('')}</select>`).join('')}</div>
          <input id="rl" class="rel-in" placeholder="关系，比如：互相看不顺眼" aria-label="关系">
          <button class="btn btn-primary" style="height:30px">${icon('plus', 13)} 添加</button>
          <button type="button" class="btn btn-quiet" style="height:30px" onclick="toast('Agent 正在从剧本里梳理人物关系…')">${icon('spark', 13)} 让 Agent 从剧本梳理</button></form></aside>
    </div>

    <div class="cv" data-v="2" hidden style="flex:1;overflow:auto;padding:22px 28px">
      <p class="muted" style="margin:0 0 14px;font-size:13px">为每个角色定配音和形象。试听用的是本角色在剧本里的第一句台词。定角后，制作页的分镜和配音会用这里的选择。</p>
      <div style="display:flex;flex-direction:column;gap:14px">${CHARS.map(([n, m, , c], ci) => `<section class="card cast" data-c="${ci}" style="padding:14px;display:grid;grid-template-columns:150px 1fr 1fr auto;gap:18px;align-items:start">
        <div style="display:flex;gap:10px;align-items:center"><span class="rel-dot" style="--c:${c}">${n[0]}</span><span><b>${n}</b><br><span class="muted" style="font-size:11.5px">${m}</span></span></div>
        <div><div class="cast-h">配音</div>${CAST.map(([t, d], k) => `<label class="cast-opt"><input type="radio" name="v${ci}" ${k === 0 && ci === 0 ? 'checked' : ''}><span style="flex:1"><b>${t}</b><br><span class="muted" style="font-size:11.5px">${d}</span></span>
          <button type="button" class="btn btn-quiet cast-play" style="width:28px;height:28px;padding:0" aria-label="试听 ${t}" data-f="${[440, 520, 380][k] + ci * 30}">${icon('play', 12)}</button><i class="cast-bar"></i></label>`).join('')}</div>
        <div><div class="cast-h">形象</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${LOOKS.map((t, k) => `<label class="cast-look"><input type="radio" name="l${ci}" ${k === 0 && ci === 0 ? 'checked' : ''}><span class="cast-sw" style="background:linear-gradient(160deg, ${c}, color-mix(in srgb, ${c}, ${['black 35%', 'white 25%', 'var(--ink) 50%'][k]}))">${icon('user', 22)}</span><span style="font-size:11px">${t}</span></label>`).join('')}</div>
          <button type="button" class="btn btn-quiet" style="height:28px;margin-top:6px" onclick="toast('正在为 ${n} 生成 3 个新形象…')">${icon('spark', 12)} 再生成 3 个</button></div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><span class="chip cast-st" style="height:22px">待定</span><button type="button" class="btn btn-primary cast-ok" style="height:30px">定角</button></div>
      </section>`).join('')}</div>
    </div>
  </section>`, `
  <style>
  .ch-adv{margin:0;padding:12px 12px 0;display:grid;grid-template-columns:auto 1fr;gap:6px 10px;font-size:12.5px}.ch-adv[hidden]{display:none}.ch-adv dt{color:var(--ink-3)}.ch-adv dd{margin:0}
  .cv[hidden]{display:none!important}
  .rel-stage{flex:1;position:relative;overflow:hidden;touch-action:none}
  #rel-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
  #rel-svg line{stroke:var(--line-strong);stroke-width:1.5;transition:stroke 150ms ease,opacity 150ms ease}
  #rel-svg line.hot{stroke:var(--ink);stroke-width:2}#rel-svg line.dim,.rel-tag.dim{opacity:.25}
  .rel-node{position:absolute;display:flex;gap:8px;align-items:center;padding:8px 12px 8px 8px;background:var(--surface);border-radius:999px;box-shadow:var(--shadow-card),inset 0 0 0 1px var(--line);cursor:grab;text-align:left;font-size:13px;user-select:none;transition:box-shadow 150ms ease,opacity 150ms ease}
  .rel-node.drag{cursor:grabbing;box-shadow:var(--shadow-pop),inset 0 0 0 1px var(--line)}.rel-node.on{box-shadow:var(--shadow-card),inset 0 0 0 2px var(--ink)}.rel-node.dim{opacity:.45}
  .rel-dot{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--c);color:#fff;font-weight:700;font-size:13px}
  .rel-tag{position:absolute;transform:translate(-50%,-50%);font-size:11.5px;padding:2px 8px;border-radius:999px;background:var(--bg);box-shadow:inset 0 0 0 1px var(--line);color:var(--ink-2);white-space:nowrap;transition:opacity 150ms ease}
  .rel-hint{position:absolute;left:16px;bottom:12px;font-size:11.5px}
  .rel-side{width:260px;flex:none;border-left:1px solid var(--line);background:var(--bg);padding:14px;overflow:auto}
  .rel-it{padding:8px 10px;border-radius:var(--r);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);font-size:12.5px}
  .rel-in{height:30px;border-radius:var(--r-sm);border:1px solid var(--line);background:var(--surface);padding:0 8px;font-size:13px;min-width:0;flex:1}
  .cast-h{font-size:11.5px;color:var(--ink-3);margin-bottom:6px}
  .cast-opt{position:relative;display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:var(--r);cursor:pointer;font-size:12.5px;overflow:hidden}
  .cast-opt:has(input:checked){background:var(--hover)}@media (hover:hover) and (pointer:fine){.cast-opt:hover{background:var(--hover)}}
  .cast-bar{position:absolute;left:0;bottom:0;height:2px;width:100%;background:var(--ink);transform-origin:left;transform:scaleX(0)}
  .cast-look{display:flex;flex-direction:column;gap:4px;cursor:pointer;text-align:center}.cast-look input,.cast-opt input{accent-color:var(--ink)}
  .cast-look input{position:absolute;opacity:0;pointer-events:none}
  .cast-sw{height:64px;border-radius:var(--r);display:grid;place-items:center;color:#fff;opacity:.85;transition:box-shadow 150ms ease}
  .cast-look:has(input:checked) .cast-sw{box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--ink);opacity:1}
  .cast-look:has(input:focus-visible) .cast-sw{outline:2px solid var(--ink);outline-offset:4px}
  .cast.done{box-shadow:var(--shadow-card),inset 0 0 0 1.5px var(--color-success-500)}
  </style>
  <script>
  const CH=${JSON.stringify(CHARS.map(([n]) => n))}; let RELS=${JSON.stringify(RELS)};
  // view tabs — instant switch (used constantly)
  const views=document.querySelectorAll('.cv');
  document.querySelectorAll('#cv-tabs button').forEach(b=>b.onclick=()=>{ document.querySelectorAll('#cv-tabs button').forEach(x=>{ x.classList.toggle('on',x===b); x.setAttribute('aria-selected',x===b); }); views.forEach(v=>v.hidden=v.dataset.v!==b.dataset.v); if(b.dataset.v==='1') layout(); });
  // 肖像 / 高级 per card
  document.querySelectorAll('.ch-seg').forEach(sg=>sg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ sg.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); const card=sg.nextElementSibling; card.querySelector('.ch-face').hidden=b.dataset.m==='1'; card.querySelector('.ch-adv').hidden=b.dataset.m!=='1'; }));
  // relationship graph
  const stage=document.getElementById('rel-stage'), svg=document.getElementById('rel-svg'), nodesEl=[...stage.querySelectorAll('.rel-node')]; let pos=null, focus=-1;
  function layout(){ if(!pos){ const w=stage.clientWidth, h=stage.clientHeight; pos=[[.42,.42],[.18,.2],[.7,.18],[.66,.72]].map(([x,y])=>[x*w,y*h]); } draw(); }
  function center(i){ const n=nodesEl[i]; return [pos[i][0]+n.offsetWidth/2,pos[i][1]+n.offsetHeight/2]; }
  function draw(){ nodesEl.forEach((n,i)=>{ n.style.left=pos[i][0]+'px'; n.style.top=pos[i][1]+'px'; const rel=focus<0||i===focus||RELS.some(r=>(r[0]===focus&&r[1]===i)||(r[1]===focus&&r[0]===i)); n.classList.toggle('dim',!rel); n.classList.toggle('on',i===focus); });
    svg.innerHTML=''; stage.querySelectorAll('.rel-tag').forEach(t=>t.remove());
    RELS.forEach((r,k)=>{ const [a,b]=[center(r[0]),center(r[1])]; const on=focus<0||r[0]===focus||r[1]===focus;
      const l=document.createElementNS('http://www.w3.org/2000/svg','line'); l.setAttribute('x1',a[0]); l.setAttribute('y1',a[1]); l.setAttribute('x2',b[0]); l.setAttribute('y2',b[1]); if(focus>=0) l.classList.add(on?'hot':'dim'); svg.appendChild(l);
      const t=document.createElement('button'); t.className='rel-tag'+(on?'':' dim'); t.textContent=r[2]; t.title=r[3]; t.style.left=(a[0]+b[0])/2+'px'; t.style.top=(a[1]+b[1])/2+'px';
      t.onclick=()=>{ const v=prompt('修改关系：'+CH[r[0]]+' — '+CH[r[1]], r[2]); if(v&&v.trim()){ r[2]=v.trim(); draw(); } }; stage.appendChild(t); });
    const list=RELS.filter(r=>focus<0||r[0]===focus||r[1]===focus);
    document.getElementById('rel-side-t').textContent=focus<0?'全部关系（'+RELS.length+'）':CH[focus]+' 的关系（'+list.length+'）';
    document.getElementById('rel-list').innerHTML=list.map(r=>'<div class="rel-it"><b>'+CH[r[0]]+' — '+CH[r[1]]+'</b> · '+r[2]+'<br><span class="muted">'+(r[3]||'')+'</span></div>').join('')||'<div class="muted" style="font-size:12.5px">还没有关系，在下面添加一条。</div>'; }
  nodesEl.forEach((n,i)=>{ let sx,sy,ox,oy,moved=false;
    n.addEventListener('pointerdown',e=>{ n.setPointerCapture(e.pointerId); sx=e.clientX; sy=e.clientY; [ox,oy]=pos[i]; moved=false; });
    n.addEventListener('pointermove',e=>{ if(!n.hasPointerCapture(e.pointerId)) return; const dx=e.clientX-sx, dy=e.clientY-sy; if(!moved&&Math.hypot(dx,dy)<4) return; moved=true; n.classList.add('drag');
      pos[i]=[Math.max(0,Math.min(stage.clientWidth-n.offsetWidth,ox+dx)),Math.max(0,Math.min(stage.clientHeight-n.offsetHeight,oy+dy))]; draw(); });
    n.addEventListener('pointerup',()=>{ n.classList.remove('drag'); if(!moved){ focus=focus===i?-1:i; draw(); } }); });
  stage.addEventListener('pointerdown',e=>{ if(e.target===stage){ focus=-1; draw(); } });
  document.getElementById('rel-add').onsubmit=e=>{ e.preventDefault(); const a=+document.getElementById('ra').value, b=+document.getElementById('rb').value, l=document.getElementById('rl');
    if(a===b){ toast('请选两个不同的角色'); return; } if(!l.value.trim()){ l.focus(); return; } RELS.push([a,b,l.value.trim(),'']); l.value=''; focus=-1; draw(); toast('已添加：'+CH[a]+' — '+CH[b]); };
  addEventListener('resize',()=>{ if(!document.querySelector('.cv[data-v="1"]').hidden) draw(); });
  // casting — synthesized preview "voice" + progress bar, lock choice
  let ac, playing;
  document.querySelectorAll('.cast-play').forEach(b=>b.onclick=e=>{ e.preventDefault(); const bar=b.nextElementSibling; if(playing){ playing.stop(); } ac=ac||new (window.AudioContext||window.webkitAudioContext)();
    const o=ac.createOscillator(), g=ac.createGain(), f=+b.dataset.f, t=ac.currentTime; o.type='triangle'; [0,.25,.5,.75,1,1.25].forEach((d,k)=>o.frequency.setValueAtTime(f*(1+((k*7)%5-2)*.06),t+d)); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.06,t+.05); g.gain.setValueAtTime(.06,t+1.4); g.gain.linearRampToValueAtTime(0,t+1.5);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t+1.5); const an=bar.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:1500,easing:'linear'}); an.onfinish=()=>bar.style.transform='scaleX(0)';
    playing={stop(){ try{o.stop()}catch(_){} an.cancel(); }}; b.closest('label').querySelector('input').checked=true; });
  document.querySelectorAll('.cast').forEach(c=>{ const ok=c.querySelector('.cast-ok'), st=c.querySelector('.cast-st');
    ok.onclick=()=>{ if(c.classList.contains('done')){ c.classList.remove('done'); st.textContent='待定'; ok.textContent='定角'; return; }
      const v=c.querySelector('input[name^=v]:checked'), l=c.querySelector('input[name^=l]:checked'); if(!v||!l){ toast('先选一个配音和一个形象'); return; }
      c.classList.add('done'); st.textContent='已定角'; ok.textContent='改选'; toast(CH[+c.dataset.c]+' 已定角：'+v.closest('label').querySelector('b').textContent); }; });
  </script>`);


/* ═════ 共享：右侧抽屉（laper 新建道具） ═════ */
const DRAWER_CSS = `
  .dw-scrim{position:fixed;inset:0;background:color-mix(in srgb,var(--bg) 55%,transparent);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);z-index:40;opacity:0;pointer-events:none;transition:opacity 220ms var(--ease-enter)}
  .dw-scrim.open{opacity:1;pointer-events:auto}
  .dw{position:fixed;top:12px;right:12px;bottom:12px;width:min(460px,calc(100vw - 24px));z-index:41;display:flex;flex-direction:column;background:var(--surface);border-radius:var(--r-xl);box-shadow:var(--shadow-pop);transform:translateX(calc(100% + 24px));transition:transform 260ms cubic-bezier(.32,.72,0,1);visibility:hidden}
  .dw.open{transform:none;visibility:visible}.dw.closing{transition-duration:180ms}
  .dw-hd{display:flex;align-items:flex-start;padding:20px 20px 12px}.dw-hd h2{margin:0;font-size:20px}.dw-body{flex:1;overflow:auto;padding:4px 20px 16px;display:flex;flex-direction:column;gap:14px}
  .dw-ft{padding:12px 20px;border-top:1px solid var(--line);display:flex;justify-content:flex-end}
  .fs{border-radius:var(--r-lg);background:var(--muted);padding:4px}.fs>b{display:block;font-size:12.5px;padding:10px 12px 8px}.fs>.in{background:var(--surface);border-radius:calc(var(--r-lg) - 4px);padding:12px;display:flex;flex-direction:column;gap:6px}
  .fl{font-size:12px;color:var(--ink-2)}.fi{height:36px;border:1px solid var(--line);border-radius:var(--r);background:var(--surface);padding:0 10px;font-size:16px;width:100%}
  textarea.fi{height:auto;min-height:96px;padding:8px 10px;resize:vertical}.fi:focus-visible{outline:2px solid var(--ink);outline-offset:1px}
  .round-x{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 1px var(--line);margin-left:auto;flex:none;transition:transform 140ms var(--ease-enter)}.round-x:active{transform:scale(.95)}
  @media (prefers-reduced-motion:reduce){.dw,.dw-scrim{transition:none}}`;
const DRAWER_JS = `
  function dwOpen(id){ const d=document.getElementById(id), s=document.getElementById(id+'-s'); d.classList.remove('closing'); d.classList.add('open'); s.classList.add('open'); d.dataset.ret=document.activeElement&&document.activeElement.id||''; setTimeout(()=>{ const f=d.querySelector('input,textarea'); f&&!('ontouchstart' in window)&&f.focus(); },60); }
  function dwClose(id){ const d=document.getElementById(id), s=document.getElementById(id+'-s'); d.classList.add('closing'); d.classList.remove('open'); s.classList.remove('open'); const r=d.dataset.ret&&document.getElementById(d.dataset.ret); r&&r.focus(); }
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.dw.open').forEach(d=>dwClose(d.id)); });`;
const drawer = (id, title, sub, body, cta) => `<div class="dw-scrim" id="${id}-s" onclick="dwClose('${id}')"></div>
  <form class="dw" id="${id}" role="dialog" aria-modal="true" aria-labelledby="${id}-t"><div class="dw-hd"><div><h2 id="${id}-t">${title}</h2><div class="muted" style="font-size:12.5px;margin-top:4px">${sub}</div></div>
  <button type="button" class="round-x" onclick="dwClose('${id}')" aria-label="关闭">${icon('x', 16)}</button></div><div class="dw-body">${body}</div><div class="dw-ft"><button class="btn btn-primary" style="height:36px;padding:0 18px">${cta}</button></div></form>`;
const pageHd = (title, n, mid, right) => `<div class="center-hd" style="background:var(--bg)"><b>${title}</b><span class="chip tnum" style="height:20px" data-count>${n}</span><span style="flex:1"></span>${mid}<span style="flex:1"></span>${right}</div>`;

/* ═════ P9 道具（laper /props）：总览画布 + 清单，新建道具抽屉 ═════ */
const PROP_COLORS = [['赛车绿', 'oklch(.36 .07 160)'], ['砖红', 'oklch(.55 .15 35)'], ['琥珀', 'oklch(.75 .14 75)'], ['靛蓝', 'oklch(.42 .12 265)'], ['石灰', 'oklch(.62 .02 90)'], ['藕粉', 'oklch(.76 .07 10)']];
const PROPS = [['白球鞋', '服装', '琥珀', '一双落满灰的白球鞋，鞋底刻着一个"林"字——姥爷小时候的鞋。', '旧帆布，泛黄，鞋带自己会系'], ['石门墩', '装饰', '石灰', '豆豆家门口的抱鼓石，门墩儿住在里面。', '青石，一侧磨得发亮']];
const p9 = () => chrome('Ancher Scripter — 道具', `${rail('道具')}
  <section class="center" id="pr-center">
    ${pageHd('道具管理', PROPS.length, `<div class="seg" role="tablist" id="pr-tabs"><button class="on" data-v="0">${icon('pen', 12)} 道具总览</button><button data-v="1">${icon('panel', 12)} 道具清单</button></div>`,
      `<button class="btn btn-quiet" style="width:28px;padding:0" aria-label="导出" onclick="toast('已导出道具清单 道具.csv')">${icon('export', 14)}</button><button class="btn btn-primary" style="height:28px" id="pr-new" onclick="dwOpen('pr-dw')">${icon('plus', 13)} 新建道具</button>`)}
    <div class="pr-v" data-v="0" id="pr-board" style="flex:1;position:relative;overflow:hidden;background-image:radial-gradient(var(--line-strong) 1px, transparent 1px);background-size:20px 20px;touch-action:none"></div>
    <div class="pr-v" data-v="1" hidden style="flex:1;overflow:auto;padding:16px 20px"><table class="pr-tb"><thead><tr><th>名称</th><th>分类</th><th>主题色</th><th>描述</th><th>出场</th><th></th></tr></thead><tbody id="pr-rows"></tbody></table></div>
  </section>
  ${drawer('pr-dw', '新建道具', '为剧本创建一件新的道具', `
    <div class="fs"><b>基本信息</b><div class="in"><label class="fl" for="pn">名称</label><input class="fi" id="pn" placeholder="例如：姥爷的修车扳手" autocomplete="off" required>
      <span class="fl" style="margin-top:6px">主题色</span><div style="position:relative"><button type="button" class="chip pr-color" id="pc-btn" aria-haspopup="listbox" aria-expanded="false"><i class="pr-sw" id="pc-sw" style="background:${PROP_COLORS[0][1]}"></i><span id="pc-t">${PROP_COLORS[0][0]}</span></button>
        <div class="card pr-pal" id="pc-pal" role="listbox">${PROP_COLORS.map(([t, c]) => `<button type="button" role="option" data-t="${t}" data-c="${c}"><i class="pr-sw" style="background:${c}"></i>${t}</button>`).join('')}</div></div>
      <label class="fl" for="pk" style="margin-top:6px">分类</label><input class="fi" id="pk" placeholder="道具 / 服装 / 车辆 / 武器 / 食物 / 装饰…" list="pk-l" autocomplete="off"><datalist id="pk-l">${['道具', '服装', '车辆', '武器', '食物', '装饰'].map((t) => `<option value="${t}">`).join('')}</datalist></div></div>
    <div class="fs"><b>描述</b><div class="in"><textarea class="fi" id="pd" aria-label="描述" placeholder="形态 / 材质 / 用途 / 状态 / 故事意义…"></textarea></div></div>
    <div class="fs"><b>形象备注<br><span class="muted" style="font-weight:400;font-size:11.5px">AI 生图参考 · 质感 / 色调 / 光线 / 镜头语言</span></b><div class="in"><textarea class="fi" id="pv" aria-label="形象备注" placeholder="例如：暖黄台灯下的特写，金属反光，略带锈迹"></textarea></div></div>`, '创建')}`, `
  <style>${DRAWER_CSS}
  .pr-v[hidden]{display:none}
  .pr-card{position:absolute;width:220px;background:var(--surface);border-radius:var(--r-lg);box-shadow:var(--shadow-card),inset 0 0 0 1px var(--line);overflow:hidden;cursor:grab;user-select:none;text-align:left}
  .pr-card.drag{cursor:grabbing;box-shadow:var(--shadow-pop),inset 0 0 0 1px var(--line)}
  .pr-card.new{animation:prIn 220ms var(--ease-enter) both}@keyframes prIn{from{opacity:0;transform:scale(.96)}}
  .pr-top{height:84px;display:grid;place-items:center;color:#fff}
  .pr-empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:var(--ink-3);font-size:13px}
  .pr-tb{width:100%;border-collapse:collapse;font-size:13px}.pr-tb th{text-align:left;font-weight:600;color:var(--ink-3);font-size:12px;padding:8px 10px;border-bottom:1px solid var(--line)}
  .pr-tb td{padding:10px;border-bottom:1px solid var(--line);vertical-align:top}.pr-tb td:nth-child(4){color:var(--ink-2);max-width:360px}
  .pr-sw{display:inline-block;width:18px;height:18px;border-radius:50%;flex:none}
  .pr-color{height:40px;padding:0 14px 0 8px;gap:8px;font-weight:600;box-shadow:var(--shadow-card),inset 0 0 0 1px var(--line)}
  .pr-pal{position:absolute;top:calc(100% + 6px);left:0;z-index:5;padding:6px;display:grid;grid-template-columns:1fr 1fr;gap:2px;width:220px;transform-origin:top left;opacity:0;transform:scale(.97);pointer-events:none;transition:opacity 150ms var(--ease-enter),transform 150ms var(--ease-enter)}
  .pr-pal.open{opacity:1;transform:none;pointer-events:auto}.pr-pal button{display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:var(--r-sm);font-size:13px}
  @media (hover:hover) and (pointer:fine){.pr-pal button:hover{background:var(--hover)}}
  </style>
  <script>${DRAWER_JS}
  const COLORS=Object.fromEntries(${JSON.stringify(PROP_COLORS)}); let props=${JSON.stringify(PROPS)}.map((p,i)=>({n:p[0],k:p[1],c:p[2],d:p[3],v:p[4],x:60+i*260,y:50+i*40,sc:i?3:2}));
  const board=document.getElementById('pr-board');
  function render(){ document.querySelector('[data-count]').textContent=props.length;
    board.innerHTML=props.length?'':'<div class="pr-empty"><div>${icon('box', 34)}<br>还没有道具<br><button class="btn btn-ghost" style="height:30px;margin-top:10px" onclick="dwOpen(\\'pr-dw\\')">新建第一件道具</button></div></div>';
    props.forEach((p,i)=>{ const el=document.createElement('div'); el.className='pr-card'+(p.fresh?' new':''); p.fresh=false; el.style.left=p.x+'px'; el.style.top=p.y+'px';
      el.innerHTML='<div class="pr-top" style="background:linear-gradient(160deg,'+COLORS[p.c]+',color-mix(in oklch,'+COLORS[p.c]+',black 30%))">${icon('box', 30)}</div><div style="padding:10px 12px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;align-items:center;gap:6px"><b style="font-size:14px;flex:1">'+p.n+'</b><span class="chip" style="height:20px;font-size:11px">'+(p.k||'未分类')+'</span></div><div class="muted" style="font-size:12px">'+(p.d||'暂无描述')+'</div><div class="muted tnum" style="font-size:11px">出场 '+p.sc+' 场</div></div>';
      let sx,sy,ox,oy,mv; el.onpointerdown=e=>{ el.setPointerCapture(e.pointerId); sx=e.clientX; sy=e.clientY; ox=p.x; oy=p.y; mv=false; };
      el.onpointermove=e=>{ if(!el.hasPointerCapture(e.pointerId)) return; const dx=e.clientX-sx, dy=e.clientY-sy; if(!mv&&Math.hypot(dx,dy)<4) return; mv=true; el.classList.add('drag'); p.x=Math.max(0,ox+dx); p.y=Math.max(0,oy+dy); el.style.left=p.x+'px'; el.style.top=p.y+'px'; };
      el.onpointerup=()=>el.classList.remove('drag'); board.appendChild(el); });
    document.getElementById('pr-rows').innerHTML=props.map((p,i)=>'<tr><td><b>'+p.n+'</b></td><td>'+(p.k||'—')+'</td><td><span style="display:inline-flex;gap:6px;align-items:center"><i class="pr-sw" style="width:12px;height:12px;background:'+COLORS[p.c]+'"></i>'+p.c+'</span></td><td>'+(p.d||'—')+'</td><td class="tnum">'+p.sc+'</td><td><button class="btn btn-quiet" style="width:28px;height:28px;padding:0" aria-label="删除 '+p.n+'" data-del="'+i+'">${icon('trash', 13)}</button></td></tr>').join('')||'<tr><td colspan="6" class="muted">还没有道具</td></tr>';
    document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const [x]=props.splice(+b.dataset.del,1); render(); toast('已删除 '+x.n); }); }
  render();
  document.querySelectorAll('#pr-tabs button').forEach(b=>b.onclick=()=>{ document.querySelectorAll('#pr-tabs button').forEach(x=>x.classList.toggle('on',x===b)); document.querySelectorAll('.pr-v').forEach(v=>v.hidden=v.dataset.v!==b.dataset.v); });
  const pal=document.getElementById('pc-pal'), pcb=document.getElementById('pc-btn'); let color='${PROP_COLORS[0][0]}';
  pcb.onclick=()=>{ const o=!pal.classList.contains('open'); pal.classList.toggle('open',o); pcb.setAttribute('aria-expanded',o); };
  pal.querySelectorAll('button').forEach(b=>b.onclick=()=>{ color=b.dataset.t; document.getElementById('pc-sw').style.background=b.dataset.c; document.getElementById('pc-t').textContent=color; pal.classList.remove('open'); pcb.focus(); });
  document.addEventListener('pointerdown',e=>{ if(!e.target.closest('#pc-pal,#pc-btn')) pal.classList.remove('open'); });
  document.getElementById('pr-dw').onsubmit=e=>{ e.preventDefault(); const n=document.getElementById('pn'); if(!n.value.trim()){ n.focus(); return; }
    props.push({n:n.value.trim(),k:document.getElementById('pk').value.trim(),c:color,d:document.getElementById('pd').value.trim(),v:document.getElementById('pv').value.trim(),x:60+(props.length%3)*260,y:60+Math.floor(props.length/3)*200+(props.length%2)*30,sc:0,fresh:true});
    e.target.reset(); dwClose('pr-dw'); render(); toast('已创建道具：'+props.at(-1).n); };
  </script>`);

/* ═════ P10 世界观（laper /world）：左侧设定目录 + 官方模版 + 设定卡 ═════ */
const WORLD_TPL = [['竖屏短剧设定合同——主题、钩子、付费点', '短剧', 'phone', ['一句话故事', '核心议题', '开场钩子', '付费卡点', '人设反差']],
  ['院线/长片故事合同——logline、主题、三幕', '故事片', 'film', ['Logline', '主题', '世界规则', '三幕结构', '结局意象']],
  ['系列动画设定合同——世界规则、单集公式', '系列动画', 'spark', ['世界规则', '能力边界', '单集公式', '固定场景', '不能写的']]];
const p10 = () => chrome('Ancher Scripter — 世界观', `${rail('世界观')}
  <aside class="wd-side"><div style="display:flex;align-items:center;padding:4px 4px 10px"><b style="flex:1">世界观</b><button class="btn btn-quiet" style="width:28px;height:28px;padding:0" aria-label="添加设定" onclick="addSet()">${icon('plus', 15)}</button></div><ol id="wd-toc" class="wd-toc"></ol></aside>
  <section class="center" style="overflow:auto">
    ${pageHd('设定', 2, '', `<button class="btn btn-primary" style="height:28px" onclick="addSet()">${icon('plus', 13)} 添加设定</button>`)}
    <div style="padding:16px 20px;display:flex;flex-direction:column;gap:12px">
      <div class="muted" style="font-size:12.5px">官方模版</div>
      <div class="wd-tpls">${WORLD_TPL.map(([sub, t, ic, f], i) => `<button class="card wd-tpl" data-i="${i}"><span class="muted" style="font-size:12px">${sub}</span><b class="display" style="font-size:24px">${t}</b>
        <span class="wd-art" aria-hidden="true">${icon(ic, 64)}</span><span class="wd-meta"><span>选用量<br><b class="tnum" data-used>0</b></span><span>作者<br><b>Ancher</b></span><span>类型<br><b>官方</b></span><span>字段<br><b class="tnum">${f.length}</b></span></span></button>`).join('')}</div>
      <div class="muted" style="font-size:12.5px;margin-top:8px">设定</div>
      <div class="wd-grid" id="wd-grid"></div>
    </div>
  </section>`, `
  <style>
  .wd-side{width:240px;flex:none;border-right:1px solid var(--line);padding:14px 10px;background:var(--bg);overflow:auto}
  .wd-toc{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;counter-reset:n}
  .wd-toc li{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--r);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);font-size:13px;cursor:grab;counter-increment:n}
  .wd-toc li::before{content:counter(n);color:var(--ink-3);font-size:12px;width:12px}.wd-toc li.drag{opacity:.4}.wd-toc li .h{color:var(--ink-3);letter-spacing:-2px}
  .wd-tpls{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
  .wd-tpl{position:relative;height:190px;padding:16px;text-align:left;display:flex;flex-direction:column;gap:4px;overflow:hidden;transition:transform 150ms var(--ease-enter),box-shadow 150ms ease}
  .wd-tpl:active{transform:scale(.98)}@media (hover:hover) and (pointer:fine){.wd-tpl:hover{box-shadow:var(--shadow-pop)}}
  .wd-art{position:absolute;right:14px;bottom:14px;width:96px;height:96px;border-radius:var(--r-lg);display:grid;place-items:center;color:var(--primary);background:radial-gradient(circle at 30% 30%,var(--primary-soft),transparent 70%)}
  .wd-meta{margin-top:auto;display:grid;grid-template-columns:auto auto;gap:6px 22px;width:max-content;font-size:11px;color:var(--ink-3)}.wd-meta b{color:var(--ink);font-size:12px}
  .wd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}
  .wd-set{padding:12px 14px;display:flex;flex-direction:column;gap:6px}.wd-set.new{animation:prIn 220ms var(--ease-enter) both}@keyframes prIn{from{opacity:0;transform:scale(.97)}}
  .wd-set input{border:0;background:transparent;font-weight:700;font-size:14px;padding:0;outline:none}.wd-set textarea{border:0;background:transparent;resize:vertical;min-height:60px;font-size:14px;outline:none;color:var(--ink)}
  .wd-set:focus-within{box-shadow:var(--shadow-card),inset 0 0 0 1.5px var(--ink)}
  </style>
  <script>
  const TPL=${JSON.stringify(WORLD_TPL)}; let sets=[{t:'一句话故事',v:''},{t:'核心议题',v:''}];
  function render(focusLast){ document.querySelector('[data-count]').textContent=sets.length;
    const toc=document.getElementById('wd-toc'); toc.innerHTML=sets.map((s,i)=>'<li draggable="true" data-i="'+i+'"><span class="h" aria-hidden="true">⋮⋮</span><span style="flex:1">'+(s.t||'未命名设定')+'</span></li>').join('');
    const g=document.getElementById('wd-grid'); g.innerHTML=sets.map((s,i)=>'<div class="card wd-set'+(s.fresh?' new':'')+'" data-i="'+i+'"><div style="display:flex;gap:6px;align-items:center"><input aria-label="设定名" value="'+s.t.replace(/"/g,'&quot;')+'" placeholder="设定名" style="flex:1"><button class="btn btn-quiet" style="width:26px;height:26px;padding:0" aria-label="删除设定" data-del>${icon('trash', 12)}</button></div><textarea aria-label="'+s.t+'" placeholder="在此填写…">'+s.v+'</textarea></div>').join('');
    sets.forEach(s=>s.fresh=false);
    g.querySelectorAll('.wd-set').forEach(c=>{ const i=+c.dataset.i; c.querySelector('input').oninput=e=>{ sets[i].t=e.target.value; toc.children[i].lastChild.textContent=e.target.value||'未命名设定'; }; c.querySelector('textarea').oninput=e=>sets[i].v=e.target.value; c.querySelector('[data-del]').onclick=()=>{ sets.splice(i,1); render(); }; });
    toc.querySelectorAll('li').forEach(li=>{ li.onclick=()=>{ const c=g.children[+li.dataset.i]; c.scrollIntoView({block:'nearest',behavior:'smooth'}); c.querySelector('textarea').focus({preventScroll:true}); };
      li.ondragstart=e=>{ li.classList.add('drag'); e.dataTransfer.setData('text/plain',li.dataset.i); }; li.ondragend=()=>li.classList.remove('drag');
      li.ondragover=e=>e.preventDefault(); li.ondrop=e=>{ e.preventDefault(); const from=+e.dataTransfer.getData('text/plain'), to=+li.dataset.i; if(from===to) return; const [m]=sets.splice(from,1); sets.splice(to,0,m); render(); }; });
    if(focusLast){ const c=g.lastElementChild; c&&c.querySelector('input').focus(); } }
  window.addSet=()=>{ sets.push({t:'',v:'',fresh:true}); render(true); };
  document.querySelectorAll('.wd-tpl').forEach(b=>b.onclick=()=>{ const [,name,,fields]=TPL[+b.dataset.i]; let added=0; fields.forEach(f=>{ if(!sets.some(s=>s.t===f)){ sets.push({t:f,v:'',fresh:true}); added++; } });
    const u=b.querySelector('[data-used]'); u.textContent=+u.textContent+1; render(); toast(added?'已套用「'+name+'」模版，新增 '+added+' 个设定':'「'+name+'」的设定都已在了'); });
  render();
  </script>`);

/* ═════ P11 知识库 — rebuilt after app.ancher.ai 笔记（streamify-one-design-system: product/sidebar + product/notes） ═════ */
const KB_NOTES = [
  { id: 'n1', kind: 'doc', title: '《门墩儿·借来的白球鞋》逆向复刻提示词', when: '今天', tags: [['Animation', 'b2'], ['Prompting', 'n'], ['门墩儿', 'b4'], ['Scriptwriting', 'b3']], memo: '第一集的逆向复刻提示词，含结构化版与一段式版', ref: true,
    summary: '把第一集拆成「作品风格 · 主要角色 · 故事母题 · 四幕结构 · 对白风格」五块，可以直接喂给剧本生成。核心笑点：想偷懒省事，反而大费周章，最后回到原点。',
    body: `<h1>《门墩儿·借来的白球鞋》逆向复刻提示词</h1><h2>一、结构化版本</h2><p><b>作品风格</b>：温暖现实主义的家庭奇幻喜剧，面向 5–10 岁孩子与家长，2D 手绘，色彩明亮柔和。</p><p><b>主要角色</b></p><ul><li>豆豆：胆小心细的三年级学生，只有他看得见门墩儿。</li><li>门墩儿：住在石门墩里一百多年的小精灵，嘴硬心软，能“借”不能“变”。</li><li>姥爷：话少手巧的修车铺师傅，记得胡同每一样东西。</li><li>大壮：爱显摆的同学，其实很怕输。</li></ul><p><b>故事母题</b>：想偷懒省事，结果大费周章；结局回到原点，形成循环笑点。</p><p><b>剧情结构（四幕）</b></p><ol><li>起：大壮的发光鞋让全班围观，豆豆把脚往身后缩。</li><li>承：门墩儿借来一双落满灰的旧白球鞋，鞋带自己系上了。</li><li>转：鞋底刻着一个“林”字——是姥爷小时候的鞋。</li><li>合：豆豆没穿去比赛，把鞋放回姥爷的工具箱。</li></ol>` },
  { id: 'n2', kind: 'mic', title: '导演意见 · 第一集', when: '昨天', tags: [['导演', 'b1']], memo: '', ref: true, summary: '笑点要来自孩子的视角，不要大人式的抖机灵；节奏前紧后松。',
    body: `<p>第一集：笑点要来自孩子的视角，不要大人式的抖机灵。</p><p>第三场太长，建议删掉姥爷的回忆，留给第二集。</p>` },
  { id: 'n3', kind: 'video', title: '参考视频 · 第一集逐字稿', when: '刚刚', tags: [], memo: '', ref: false, processing: true, summary: '', body: '' },
  { id: 'n4', kind: 'user', title: '人物小传 · 豆豆', when: '3 天前', tags: [['角色', 'b4']], memo: '', ref: false, summary: '豆豆，9 岁，胆小心细，想被同学看见。',
    body: `<p>豆豆，9 岁，三年级。胆小心细，最怕被当成怪孩子。只有他看得见门墩儿。</p>` },
  { id: 'n5', kind: 'doc', title: '范本剧本 · 第一集.fdx', when: '上周', tags: [['范本', 'n']], memo: '客户指定的格式范本', ref: true, summary: '15 场，约 5000 字。', body: `<p>外景 胡同口 — 傍晚</p><p>豆豆蹲在自家门墩儿旁边……</p>` },
];
const KB_COLLECTIONS = [['第一季', 'b2'], ['导演意见', 'b1'], ['参考作品', 'b4'], ['角色设定', 'b3']];
const p11 = () => chrome('Ancher Scripter — 知识库', `${rail('知识库')}
  <aside class="nt-side" aria-label="知识库">
    <nav class="nt-nav">
      <button class="nt-item" onclick="newNote()">${icon('plus', 16)}<span>新建笔记</span><kbd class="nt-kbd">⇧⌘O</kbd></button>
      <button class="nt-item" onclick="toast('搜索知识库')">${icon('eye', 16)}<span>搜索</span><kbd class="nt-kbd">⌘K</kbd></button>
    </nav>
    <div class="nt-scroll">
      ${[['pinned', '已固定', 1, false], ['coll', '合集', KB_COLLECTIONS.length, true], ['notes', '笔记', KB_NOTES.length, true]].map(([id, label, n, actions]) => `
      <section class="nt-group" data-g="${id}">
        <div class="nt-ghd"><button class="nt-glabel" aria-expanded="true" onclick="toggleGroup(this)">${label}${icon('chev', 12)}<span class="nt-count tnum" id="cnt-${id}">${n}</span></button>
          ${actions ? `<span class="nt-gact"><button class="ico-btn xs" aria-label="排序" onclick="toast('按最近更新排序')">${icon('indent', 12)}</button><button class="ico-btn xs" aria-label="新建" onclick="${id === 'notes' ? 'newNote()' : "toast('新建合集')"}">${icon('plus', 12)}</button></span>` : ''}</div>
        <div class="nt-list" id="list-${id}"></div>
      </section>`).join('')}
    </div>
  </aside>
  <section class="nt-main">
    <div class="nt-panel">
      <div class="nt-phd">
        <button class="nt-ver" aria-haspopup="menu" onclick="toast('版本：v1（当前）')">${icon('undo', 14)}<span>v1</span>${icon('chev', 12)}</button>
        <span style="flex:1"></span>
        <button class="nt-out" id="ref-btn" aria-pressed="false" onclick="toggleRef()">${icon('spark', 14)}<span>写作时参考</span></button>
        <button class="nt-out" id="edit-btn" onclick="toggleEdit()">${icon('pen', 14)}<span>编辑</span></button>
        <button class="ico-btn" aria-label="更多" onclick="toast('固定 · 移到合集 · 导出 · 删除')">⋯</button>
      </div>
      <div class="nt-scrollarea"><article class="nt-article" id="article"></article></div>
    </div>
  </section>`, `
  <script>
  const $=id=>document.getElementById(id);
  const NOTES=${JSON.stringify(KB_NOTES)}, COLLS=${JSON.stringify(KB_COLLECTIONS)};
  const KIND={doc:${JSON.stringify(icon('doc', 16))},mic:${JSON.stringify(icon('chat', 16))},video:${JSON.stringify(icon('video', 16))},user:${JSON.stringify(icon('user', 16))}};
  const COLL_IC=${JSON.stringify(icon('box', 16))}, SPIN='<span class="spin" aria-hidden="true"></span>';
  let cur='n1', tab='summary', editing=false;
  const esc=t=>t.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function sideRow(n,pinned){ return '<button class="nt-item'+(n.id===cur?' on':'')+'" data-id="'+n.id+'" onclick="openNote(\\''+n.id+'\\')"><span class="nt-lead">'+(n.processing?SPIN:KIND[n.kind])+'</span><span>'+esc(n.title)+'</span></button>'; }
  function renderSide(){
    $('list-pinned').innerHTML=sideRow(NOTES[0]);
    $('list-coll').innerHTML=COLLS.map(([t,c])=>'<button class="nt-item" onclick="toast(\\'打开合集：'+t+'\\')"><span class="nt-lead" style="color:var(--color-'+c+'-500)">'+COLL_IC+'</span><span>'+t+'</span></button>').join('');
    $('list-notes').innerHTML=NOTES.map(n=>sideRow(n)).join(''); $('cnt-notes').textContent=NOTES.length; }
  function chip([t,c]){ return '<span class="nt-tag" data-c="'+c+'">'+esc(t)+'</span>'; }
  function renderNote(){ const n=NOTES.find(x=>x.id===cur);
    $('ref-btn').setAttribute('aria-pressed',n.ref); $('ref-btn').lastChild.textContent=n.ref?'写作时参考 ✓':'写作时参考';
    $('article').innerHTML='<header class="nt-meta"><div class="nt-kicker">'+KIND[n.kind]+'<span>笔记</span><span>·</span><span>'+n.when+'</span></div><h1 class="nt-title"'+(editing?' contenteditable="plaintext-only"':'')+'>'+esc(n.title)+'</h1><div class="nt-tags">'+n.tags.map(chip).join('')+'<button class="nt-addtag" onclick="addTag()">'+${JSON.stringify(icon('tag', 11))}+'添加标签</button></div></header>'
      +(n.processing?'<div class="nt-alert" role="status">'+SPIN+'<div><b>正在处理内容...</b><p>我们正在分析并提取笔记内容。</p></div></div>':'')
      +(n.memo?'<div class="nt-memo"><div class="nt-label">备注</div><p>'+esc(n.memo)+'</p></div>':'')
      +(n.processing?'<div class="nt-skel"><i style="width:70%"></i><i></i><i></i><i style="width:85%"></i></div>':'<div class="nt-tabs" role="tablist"><span class="nt-ind" id="ind"></span><button role="tab" data-t="summary" aria-selected="'+(tab==='summary')+'" onclick="setTab(\\'summary\\')">'+${JSON.stringify(icon('spark', 14))}+'摘要</button><button role="tab" data-t="original" aria-selected="'+(tab==='original')+'" onclick="setTab(\\'original\\')">原文</button></div><div class="nt-body md"'+(editing?' contenteditable="true"':'')+'>'+(tab==='summary'?'<p>'+esc(n.summary)+'</p>':n.body)+'</div>');
    moveInd(false); }
  function moveInd(anim){ const t=document.querySelector('.nt-tabs [aria-selected="true"]'), ind=$('ind'); if(!t||!ind) return; ind.style.transition=anim?'':'none'; ind.style.width=t.offsetWidth+'px'; ind.style.transform='translateX('+(t.offsetLeft-2)+'px)'; }
  function setTab(t){ tab=t; try{ history.replaceState(null,'','#'+(t==='original'?'original':'summary')); }catch(_){} document.querySelectorAll('.nt-tabs [role=tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===t)); moveInd(true);
    const n=NOTES.find(x=>x.id===cur); document.querySelector('.nt-body').innerHTML=t==='summary'?'<p>'+esc(n.summary)+'</p>':n.body; }
  function openNote(id){ cur=id; editing=false; $('edit-btn').lastChild.textContent='编辑'; renderSide(); renderNote(); $('article').parentElement.scrollTop=0; }
  function toggleEdit(){ editing=!editing; $('edit-btn').lastChild.textContent=editing?'完成':'编辑'; renderNote(); if(editing) document.querySelector('.nt-body').focus(); else toast('已保存为 v2'); }
  function toggleRef(){ const n=NOTES.find(x=>x.id===cur); n.ref=!n.ref; renderNote(); toast(n.ref?'AI 写作时会参考这条笔记':'不再参考这条笔记'); }
  function addTag(){ const n=NOTES.find(x=>x.id===cur); const box=document.querySelector('.nt-addtag'); const inp=document.createElement('input'); inp.className='nt-taginput'; inp.placeholder='标签名'; box.replaceWith(inp); inp.focus();
    inp.onkeydown=e=>{ if(e.key==='Enter'&&inp.value.trim()){ n.tags.push([inp.value.trim(),['b1','b2','b3','b4'][n.tags.length%4]]); renderNote(); } if(e.key==='Escape') renderNote(); }; inp.onblur=()=>renderNote(); }
  function toggleGroup(b){ const o=b.getAttribute('aria-expanded')==='true'; b.setAttribute('aria-expanded',!o); b.closest('.nt-group').querySelector('.nt-list').hidden=o; }
  function newNote(){ const id='n'+(NOTES.length+1); NOTES.unshift({id,kind:'doc',title:'未命名笔记',when:'刚刚',tags:[],memo:'',ref:false,summary:'',body:'<p></p>'}); cur=id; tab='original'; editing=true; $('edit-btn').lastChild.textContent='完成'; renderSide(); renderNote(); const t=document.querySelector('.nt-title'); t.focus(); getSelection().selectAllChildren(t); }
  renderSide(); renderNote();
  // The video transcript finishes processing a few seconds in, like Ancher's note pipeline.
  setTimeout(()=>{ const n=NOTES.find(x=>x.id==='n3'); n.processing=false; n.tags=[['逐字稿','b3']]; n.summary='一集约 10 分钟，四场戏；台词口语化、孩子气、短句多。'; n.body='<p>00:00 豆豆：石头……石头说话了？</p><p>00:04 门墩儿：在这儿蹲了一百多年，头一回有人看得见我。</p>'; renderSide(); if(cur==='n3') renderNote(); toast('「参考视频 · 第一集逐字稿」处理好了'); },4000);
  addEventListener('resize',()=>moveInd(false));
  </script>`);

/* ═════ P12 地点（laper /locations）：地点卡 + 清单，新建地点抽屉 ═════ */
const LOC_DATA = [['胡同口', '外景', ['傍晚', '日'], '青砖灰瓦的老胡同入口，门墩儿就在豆豆家门口。', [1, 4], 'var(--color-b1-500)'],
  ['豆豆家', '内景', ['夜'], '两间小平房，饭桌挨着窗，窗外能看见门墩儿。', [2], 'var(--color-b2-500)'],
  ['学校操场', '外景', ['日'], '水泥地，旗杆，一圈杨树。课间最热闹的地方。', [3], 'var(--color-b5-500)'],
  ['姥爷修车铺', '内景', ['夜'], '胡同里的修车铺，墙上挂满旧零件和工具。', [5], 'var(--color-b4-600)']];
const p12 = () => chrome('Ancher Scripter — 地点', `${rail('地点')}
  <section class="center">
    ${pageHd('地点管理', LOC_DATA.length, `<div class="seg" role="tablist" id="lc-tabs"><button class="on" data-v="0">${icon('map', 12)} 地点总览</button><button data-v="1">${icon('panel', 12)} 地点清单</button></div>`,
      `<button class="btn btn-quiet" style="width:28px;padding:0" aria-label="导出勘景本" onclick="toast('已导出勘景本 地点.pdf')">${icon('export', 14)}</button><button class="btn btn-primary" style="height:28px" id="lc-new" onclick="dwOpen('lc-dw')">${icon('plus', 13)} 新建地点</button>`)}
    <div class="lc-v" data-v="0" style="flex:1;overflow:auto;padding:20px;background-image:radial-gradient(var(--line-strong) 1px, transparent 1px);background-size:20px 20px"><div class="lc-grid" id="lc-grid"></div></div>
    <div class="lc-v" data-v="1" hidden style="flex:1;overflow:auto;padding:16px 20px"><table class="pr-tb"><thead><tr><th>地点</th><th>内/外景</th><th>时间</th><th>场次</th><th>描述</th><th></th></tr></thead><tbody id="lc-rows"></tbody></table></div>
  </section>
  ${drawer('lc-dw', '新建地点', '为剧本添加一个拍摄地点', `
    <div class="fs"><b>基本信息</b><div class="in"><label class="fl" for="ln">名称</label><input class="fi" id="ln" placeholder="例如：胡同里的小卖部" autocomplete="off" required>
      <span class="fl" style="margin-top:6px">内景 / 外景</span><div class="seg" id="lie" role="radiogroup">${['内景', '外景'].map((t, i) => `<button type="button" role="radio" aria-checked="${!i}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</div>
      <span class="fl" style="margin-top:6px">时间（可多选）</span><div style="display:flex;gap:6px;flex-wrap:wrap" id="ltm">${['日', '夜', '清晨', '傍晚', '黄昏'].map((t, i) => `<button type="button" class="chip lc-t" aria-pressed="${!i}">${t}</button>`).join('')}</div></div></div>
    <div class="fs"><b>描述</b><div class="in"><textarea class="fi" id="ld" aria-label="描述" placeholder="空间结构 / 陈设 / 氛围 / 在故事里的作用…"></textarea></div></div>
    <div class="fs"><b>视觉备注<br><span class="muted" style="font-weight:400;font-size:11.5px">AI 生图参考 · 光线 / 色调 / 年代 / 镜头角度</span></b><div class="in"><textarea class="fi" id="lv" aria-label="视觉备注" placeholder="例如：傍晚逆光，暖橙色，九十年代北京"></textarea></div></div>`, '创建')}`, `
  <style>${DRAWER_CSS}
  .lc-v[hidden]{display:none}
  .lc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
  .lc-c{overflow:hidden;display:flex;flex-direction:column}.lc-c.new{animation:prIn 220ms var(--ease-enter) both}@keyframes prIn{from{opacity:0;transform:scale(.97)}}
  .lc-img{height:120px;position:relative;display:grid;place-items:center;color:#fff}.lc-img .chip{position:absolute;left:10px;top:10px;height:20px;font-size:11px;background:color-mix(in srgb,#000 30%,transparent);color:#fff;box-shadow:none}
  .lc-img.gen::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);background-size:220% 100%;animation:lcShim 1s linear infinite}
  @keyframes lcShim{from{background-position:120% 0}to{background-position:-120% 0}}
  .lc-t[aria-pressed=true]{background:var(--ink);color:var(--bg)}
  .pr-tb{width:100%;border-collapse:collapse;font-size:13px}.pr-tb th{text-align:left;font-weight:600;color:var(--ink-3);font-size:12px;padding:8px 10px;border-bottom:1px solid var(--line)}.pr-tb td{padding:10px;border-bottom:1px solid var(--line);vertical-align:top}
  @media (prefers-reduced-motion:reduce){.lc-img.gen::after{animation:none}}
  </style>
  <script>${DRAWER_JS}
  let locs=${JSON.stringify(LOC_DATA)}.map(l=>({n:l[0],ie:l[1],tm:l[2],d:l[3],sc:l[4],c:l[5],img:false}));
  const PAL=['var(--color-b1-500)','var(--color-b2-500)','var(--color-b4-600)','var(--color-b5-500)'];
  function render(){ document.querySelector('[data-count]').textContent=locs.length;
    document.getElementById('lc-grid').innerHTML=locs.map((l,i)=>'<div class="card lc-c'+(l.fresh?' new':'')+'"><div class="lc-img" id="li'+i+'" style="background:'+(l.img?'linear-gradient(180deg,color-mix(in oklch,'+l.c+',white 25%),color-mix(in oklch,'+l.c+',black 45%))':'linear-gradient(160deg,'+l.c+',color-mix(in oklch,'+l.c+',black 35%))')+'"><span class="chip">'+l.ie+'</span>${icon('map', 30)}</div>'+
      '<div style="padding:12px;display:flex;flex-direction:column;gap:8px;flex:1"><b style="font-size:15px">'+l.n+'</b><div style="display:flex;gap:6px;flex-wrap:wrap">'+l.tm.map(t=>'<span class="chip" style="height:20px;font-size:11px">'+t+'</span>').join('')+'<span class="chip tnum" style="height:20px;font-size:11px">${icon('film', 11)} '+l.sc.length+' 场</span></div>'+
      '<p class="muted" style="margin:0;font-size:12.5px;flex:1">'+(l.d||'暂无描述')+'</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button class="btn btn-ghost" style="height:30px" data-gen="'+i+'">${icon('spark', 12)} '+(l.img?'重新生成':'生成场景图')+'</button><button class="btn btn-ghost" style="height:30px" data-del="'+i+'">${icon('trash', 12)} 删除</button></div></div></div>').join('');
    locs.forEach(l=>l.fresh=false);
    document.getElementById('lc-rows').innerHTML=locs.map((l,i)=>'<tr><td><b>'+l.n+'</b></td><td>'+l.ie+'</td><td>'+l.tm.join(' / ')+'</td><td class="tnum">'+(l.sc.length?l.sc.map(x=>'第 '+x+' 场').join('、'):'—')+'</td><td class="muted">'+(l.d||'—')+'</td><td><button class="btn btn-quiet" style="width:28px;height:28px;padding:0" aria-label="删除 '+l.n+'" data-del="'+i+'">${icon('trash', 13)}</button></td></tr>').join('');
    document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const [x]=locs.splice(+b.dataset.del,1); render(); toast('已删除地点 '+x.n); });
    document.querySelectorAll('[data-gen]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.gen, im=document.getElementById('li'+i); im.classList.add('gen'); b.disabled=true; b.lastChild.textContent=' 生成中…';
      setTimeout(()=>{ locs[i].img=true; render(); toast('已生成「'+locs[i].n+'」场景图'); },1400); }); }
  render();
  document.querySelectorAll('#lc-tabs button').forEach(b=>b.onclick=()=>{ document.querySelectorAll('#lc-tabs button').forEach(x=>x.classList.toggle('on',x===b)); document.querySelectorAll('.lc-v').forEach(v=>v.hidden=v.dataset.v!==b.dataset.v); });
  document.querySelectorAll('#lie button').forEach(b=>b.onclick=()=>document.querySelectorAll('#lie button').forEach(x=>{ x.classList.toggle('on',x===b); x.setAttribute('aria-checked',x===b); }));
  document.querySelectorAll('.lc-t').forEach(b=>b.onclick=()=>b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true'));
  document.getElementById('lc-dw').onsubmit=e=>{ e.preventDefault(); const n=document.getElementById('ln'); if(!n.value.trim()){ n.focus(); return; }
    const tm=[...document.querySelectorAll('.lc-t[aria-pressed=true]')].map(b=>b.textContent);
    locs.push({n:n.value.trim(),ie:document.querySelector('#lie .on').textContent,tm:tm.length?tm:['日'],d:document.getElementById('ld').value.trim(),sc:[],c:PAL[locs.length%4],img:false,fresh:true});
    e.target.reset(); document.querySelectorAll('.lc-t').forEach((b,i)=>b.setAttribute('aria-pressed',i===0)); dwClose('lc-dw'); render(); toast('已创建地点：'+locs.at(-1).n); };
  </script>`);

/* ═════ P6 制作设置 + 分镜（laper /production） ═════ */
const p6 = () => chrome('Ancher Scripter — 制作', `${rail('制作')}
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
const p7 = () => chrome('Ancher Scripter', `
  <nav class="rec-nav" style="width:220px;flex:none;padding:14px 10px;display:flex;flex-direction:column;gap:2px;border-right:1px solid var(--line);background:var(--sidebar)" class="col2">
    <div style="display:flex;align-items:center;gap:8px;font-weight:700;padding:0 6px 12px"><div class="logo" style="margin:0" aria-label="Ancher" role="img">${symbolSvg(24)}</div>Ancher Scripter</div>
    ${[['plus', '新建'], ['home', '最近', 1], ['doc', '剧本'], ['video', '快速视频 Beta'], ['users', '社区'], ['trash', '回收站']].map(([ic, t, on]) => `<div class="item${on ? ' on' : ''}" style="margin:0">${icon(ic, 15)} ${t}</div>`).join('')}
    <div style="flex:1"></div>
    <div class="card" style="padding:12px;margin:8px 0;background:linear-gradient(140deg, var(--primary-soft), var(--surface))"><div class="row" style="display:flex;align-items:center;gap:6px;font-weight:600"><span style="width:6px;height:6px;border-radius:50%;background:var(--color-success-500)"></span>已激活 · Ancher 已连接</div>
      <div class="muted" style="font-size:11.5px;margin-top:4px">北京 · 1 / 3<br>项目保存在本机 ~/Ancher Scripter</div></div>
    <button class="btn btn-primary" style="height:32px">新功能</button></nav>
  <main class="rec-main" style="flex:1;overflow:auto;padding:24px 32px"><div class="muted" style="margin-bottom:16px">最近</div>
    <div class="rec-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">
      ${[['plus', '新建剧本', '写出专业、结构清晰的剧本'], ['plus', '新建快速视频', '为 AI 视频创作而生']].map(([ic, t, d]) => `<button class="card" style="aspect-ratio:3/4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--ink-2);box-shadow:inset 0 0 0 1px var(--line-strong)">${icon(ic, 20)}<b style="color:var(--ink)">${t}</b><span class="muted" style="font-size:12px;padding:0 16px;text-align:center">${d}</span></button>`).join('')}
      <div class="card enter" style="aspect-ratio:3/4;padding:16px;display:flex;flex-direction:column"><b class="display" style="font-size:18px">门墩儿</b><span class="muted" style="font-size:12px">开始你的创作之旅……</span><span style="flex:1"></span><span class="muted" style="font-size:11.5px">编辑于 6 秒前</span></div>
    </div></main>`);

/* ═════ P8 设置（v0.2：激活与授权 · 模型与密钥 · 项目数据；不显示用量） ═════ */
const setRow = (k, v) => `<div style="display:flex;padding:9px 0;border-top:1px solid var(--line);font-size:13px"><span class="muted" style="width:120px;flex:none">${k}</span><span style="flex:1">${v}</span></div>`;
const p8 = () => chrome('Ancher Scripter — 设置', `
  <nav class="col2" style="width:220px;padding-top:14px">
    <div class="hd">设置</div>
    ${['激活与授权', '模型与密钥', '编辑器', '项目数据'].map((t, i) => `<a class="item${i === 0 ? ' on' : ''}" href="#s${i}" style="text-decoration:none">${t}</a>`).join('')}
  </nav>
  <main class="set-main" style="flex:1;overflow:auto;padding:28px 36px;max-width:860px;display:flex;flex-direction:column;gap:16px">
    <h1 class="display" style="font-size:30px;margin:0">设置</h1>
    <section class="card" id="s0" style="padding:18px"><div style="display:flex;align-items:center;margin-bottom:6px"><b style="flex:1">激活与授权</b><span class="chip" style="height:22px;color:var(--color-success-500)">● 已激活</span></div>
      ${setRow('激活码', '<code>AIS-7K3F-••••-••••-B8NC</code>')}${setRow('授权给', '北京 · 第 1 台 / 共 3 台')}${setRow('本机标识', '<code>AS-7K3F-9Q2M</code>（自动生成）')}${setRow('激活时间', '2026-10-08 · 授权文件已缓存，离线可用')}
      <div class="muted" style="font-size:12px;margin-top:8px">换电脑时，请联系提供方释放本机名额。</div></section>
    <section class="card" id="s1" style="padding:18px"><b>模型与密钥</b>
      <div style="padding:12px 0;border-top:1px solid var(--line);margin-top:8px"><div style="display:flex;align-items:center;gap:8px"><b style="font-weight:600">Ancher</b><span class="chip" style="height:20px">必填 · 用你自己的 key</span><span style="flex:1"></span><span class="chip" style="height:22px;color:var(--color-success-500)">● 已连接</span></div>
        <div class="muted" style="font-size:12px;margin:2px 0 8px">对话 · 联网搜索 · 解析 · 检索。在 ancher.ai → 设置 → API 密钥 里创建。</div>
        <div style="display:flex;gap:8px"><input class="input" type="password" value="ak_live_J-3m_demo" autocomplete="off" style="font-family:var(--font-family-mono)"><button class="btn btn-ghost" style="height:40px" onclick="toast('Ancher 已连接（User.me 验证通过），key 已存进钥匙串')">验证并保存</button></div></div>
      <div style="padding:12px 0;border-top:1px solid var(--line)"><b style="font-weight:600">Gemini</b> <span class="chip" style="height:20px">可选 · 用你自己的 key</span><div class="muted" style="font-size:12px;margin:2px 0 8px">用于视频 / 音频转写。添加后，对话框里的模型标识会变成下拉菜单。</div>
        <div style="display:flex;gap:8px"><input class="input" type="password" placeholder="粘贴 Gemini API key" autocomplete="off"><button class="btn btn-ghost" style="height:40px" onclick="toast('Gemini key 验证通过，已存进钥匙串')">验证并保存</button></div></div>
      <div class="muted" style="font-size:12px">所有 key 只存在本机钥匙串，应用不经过任何中间服务器。</div></section>
    <section class="card" id="s2" style="padding:18px"><b>编辑器</b>
      ${setRow('剧本字体', '<div class="seg"><button class="on">打字机（Courier + 仿宋）</button><button>宋体</button><button>系统字体</button></div>')}
      ${setRow('生成方式', '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" checked style="accent-color:var(--primary)"> AI 写作时逐字打出（系统开启"减少动态效果"时整段出现）</label>')}
      ${setRow('打字机音效', '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" checked style="accent-color:var(--primary)"> 生成时播放按键声、换行声，写完"叮"一下</label><input type="range" min="0" max="100" value="32" aria-label="音量" style="width:160px;margin-top:6px;accent-color:var(--primary)">')}
      ${setRow('默认导出格式', '<div class="seg"><button class="on">PDF</button><button>Final Draft</button><button>Fountain</button><button>Word</button><button>TXT</button></div>')}</section>
    <section class="card" id="s3" style="padding:18px"><b>项目数据</b><div class="muted" style="font-size:12.5px;margin:4px 0 10px">剧本、规则库、逐字稿都保存在本机 <code>~/Ancher Scripter</code>。换电脑时导出再导入。</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost" onclick="toast('已导出 门墩儿.scripter')">导出整个项目</button><button class="btn btn-ghost">导入项目</button><button class="btn btn-ghost" onclick="toast('已导出诊断包（不含 key 和剧本内容）')">导出诊断包</button></div></section>
  </main>`);

export const PAGES = [
  { id: 'p1', name: '激活（不登录）', render: p1 },
  { id: 'p3', name: '创作首页', render: p3 },
  { id: 'p4', name: '工作区 · AI 自动开写', render: () => ICONS_JS + workspace() },
  { id: 'p5', name: '角色画布', render: p5 },
  { id: 'p12', name: '地点', render: p12 },
  { id: 'p9', name: '道具', render: p9 },
  { id: 'p10', name: '世界观', render: p10 },
  { id: 'p11', name: '知识库', render: p11 },
  { id: 'p6', name: '制作设置 · 分镜', render: p6 },
  { id: 'p7', name: '最近', render: p7 },
  { id: 'p8', name: '设置 · 激活 / 密钥', render: p8 },
];
export { icon, chrome, nodes, IDEA, SCRIPT1, SCRIPT2, OUTLINE, CHARS, LOCS, rail, workspace, ICONS_JS };
