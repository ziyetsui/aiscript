// Variants 2–5 for P1 (activation) and P2 (onboarding). Variant 1 of each page is the current build.
import { icon, chrome, nodes, IDEA, SCRIPT1 } from '../src/pages.mjs';

/* Shared activation flow pieces — every variant runs the same real states:
   verify → bind this machine → download licence file → enter your own Ancher key → User.me(). */
const ACT_JS = String.raw`
const CODE='AIS-7K3F-9Q2M-4XHD-B8NC';
const ACT_STEPS=[['联网验证激活码',''],['绑定这台电脑','设备标识自动生成'],['下载授权文件','已签名 · 已加密，之后离线可用']];
async function runSteps(box, kind){ box.innerHTML=''; const list=kind==='used'?ACT_STEPS.slice(0,2):kind==='offline'?ACT_STEPS.slice(0,1):ACT_STEPS;
  for(let i=0;i<list.length;i++){ const [t,d]=list[i]; const r=document.createElement('div'); r.className='tool enter'; r.innerHTML='<span class="spin"></span><span><b>'+t+'</b>'+(d?' · '+d:'')+'</span>'; box.appendChild(r); await wait(480);
    const bad=(kind==='used'&&i===1)||(kind==='offline'&&i===0); r.querySelector('.spin').outerHTML=bad?'<span class="fail">✕</span>':'<span class="ok">✓</span>'; if(bad) return false; }
  return true; }
const FAIL={ used:['这个激活码已经在另一台电脑上激活过','每个激活码只能用一次。如果是你自己换了电脑，请联系提供方处理。'], offline:['连不上激活服务','首次激活需要联网。检查网络后重试，或者改用手动激活。'] };
async function checkKey(v){ await wait(600); return /^ak_live_/.test(v.trim()); }
`;
const failCss = `.fail{width:15px;height:15px;border-radius:50%;background:var(--color-danger-500);color:#fff;display:grid;place-items:center;font-size:9px;flex:none}
.err{display:flex;gap:8px;align-items:flex-start;color:var(--color-danger-500);font-size:13px}.err svg{flex:none;margin-top:2px}
.field-label{font-size:12.5px;font-weight:600;display:block;margin-bottom:6px}`;
const errIcon = icon('x', 13);

/* ═══ P1 · 2 「分段码」 — input model: four 4-char groups, paste splits, Backspace walks back ═══ */
const p1Seg = {
  name: '分段码', axis: '输入方式：按组输入，粘贴自动拆分',
  body: chrome('AIScript · 激活', `
  <main class="seg-wrap"><form class="seg-card card" id="f" novalidate>
    <div class="logo" style="margin:0 0 18px;width:40px;height:40px;font-size:18px">剧</div>
    <h1 class="display" style="font-size:30px;margin:0 0 6px">激活 AIScript</h1>
    <p class="muted" style="margin:0 0 22px">输入激活码。可以直接粘贴整串，会自动分组。</p>
    <label class="field-label" id="code-l">激活码</label>
    <div class="codes" role="group" aria-labelledby="code-l"><span class="prefix">AIS</span>
      ${[0, 1, 2, 3].map((i) => `<span class="dash">–</span><input class="cbox" data-i="${i}" maxlength="4" inputmode="text" autocomplete="off" spellcheck="false" aria-label="第 ${i + 1} 组">`).join('')}</div>
    <div id="code-err" class="err" hidden></div>
    <button class="btn btn-primary act-btn" id="go" type="submit" disabled>激活</button>
    <div id="steps" class="steps"></div>
    <div id="key" hidden class="key-step">
      <label class="field-label" for="akey">你的 Ancher API key</label>
      <input class="input mono" id="akey" type="password" autocomplete="off" spellcheck="false" placeholder="ak_live_…">
      <p class="muted" style="font-size:12px;margin:6px 0 10px">在 ancher.ai → 设置 → API 密钥 里创建。只存在本机钥匙串。</p>
      <div id="key-err" class="err" hidden></div>
      <button class="btn btn-primary act-btn" id="kgo" type="button">验证并保存</button></div>
    <div class="demo muted"><button type="button" onclick="fillDemo()">填入示例码</button><button type="button" onclick="demo('used')">演示：码已被使用</button><button type="button" onclick="demo('offline')">演示：没有网络</button></div>
  </form></main>`),
  css: `${failCss}
.seg-wrap{flex:1;display:grid;place-items:center;padding:24px;background:radial-gradient(60% 50% at 50% 0%, var(--primary-soft), transparent 70%)}
.seg-card{width:min(460px,100%);padding:32px}
.codes{display:flex;align-items:center;gap:6px;margin-bottom:10px}
.prefix{font-family:var(--font-family-mono);font-weight:600;color:var(--ink-3);font-size:16px}
.dash{color:var(--ink-3)}
.cbox{width:72px;height:48px;text-align:center;font-family:var(--font-family-mono);font-size:18px;letter-spacing:.12em;text-transform:uppercase;border-radius:var(--r);border:1px solid var(--line-strong);background:var(--paper);transition:border-color 150ms ease,box-shadow 150ms ease}
.cbox:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-soft)}
.cbox.full{border-color:color-mix(in oklch,var(--primary) 45%,var(--line-strong))}
.cbox[aria-invalid=true]{border-color:var(--color-danger-500)}
.act-btn{width:100%;height:44px;margin-top:8px}
.steps{display:flex;flex-direction:column;gap:6px;margin-top:14px}.steps:empty{display:none}
.key-step{margin-top:18px;padding-top:18px;border-top:1px solid var(--line)}
.mono{font-family:var(--font-family-mono)}
.demo{display:flex;gap:14px;margin-top:18px;font-size:12px}.demo button{text-decoration:underline;text-underline-offset:3px;color:var(--ink-3)}`,
  js: ACT_JS + String.raw`
const boxes=[...document.querySelectorAll('.cbox')], go=document.getElementById('go');
const clean=s=>s.toUpperCase().replace(/[^0-9A-HJKMNP-TV-Z]/g,'');   // Crockford base32: no I, L, O, U
function sync(){ boxes.forEach(b=>b.classList.toggle('full',b.value.length===4)); go.disabled=!boxes.every(b=>b.value.length===4); }
function spread(raw, from){ const s=clean(raw.replace(/^AIS-?/i,'')); let k=0; for(let i=from;i<4&&k<s.length;i++){ boxes[i].value=s.slice(k,k+4); k+=4; } const next=boxes.find(b=>b.value.length<4); (next||boxes[3]).focus(); sync(); }
boxes.forEach((b,i)=>{
  b.addEventListener('paste',e=>{ e.preventDefault(); spread(e.clipboardData.getData('text'), i); });
  b.addEventListener('input',()=>{ const v=clean(b.value); if(v.length>4){ spread(v,i); return; } b.value=v; b.removeAttribute('aria-invalid'); document.getElementById('code-err').hidden=true;
    if(v.length===4 && boxes[i+1]) boxes[i+1].focus(); sync(); });
  b.addEventListener('keydown',e=>{ if(e.key==='Backspace'&&!b.value&&boxes[i-1]){ boxes[i-1].focus(); e.preventDefault(); } if(e.key==='ArrowLeft'&&b.selectionStart===0&&boxes[i-1]) boxes[i-1].focus(); if(e.key==='ArrowRight'&&b.selectionStart===b.value.length&&boxes[i+1]) boxes[i+1].focus(); });
});
function fillDemo(){ spread(CODE,0); }
async function activate(kind){ go.disabled=true; go.textContent='正在激活…'; const ok=await runSteps(document.getElementById('steps'), kind);
  if(!ok){ const [t,d]=FAIL[kind], e=document.getElementById('code-err'); e.innerHTML=${JSON.stringify(errIcon)}+'<span><b>'+t+'</b><br>'+d+'</span>'; e.hidden=false; boxes.forEach(b=>b.setAttribute('aria-invalid','true')); go.disabled=false; go.textContent='重试'; return; }
  go.textContent='已激活 · 北京 1 / 3'; document.getElementById('key').hidden=false; document.getElementById('akey').focus(); }
function demo(kind){ fillDemo(); activate(kind); }
document.getElementById('f').addEventListener('submit',e=>{ e.preventDefault(); if(!go.disabled) activate('ok'); });
document.getElementById('kgo').onclick=async()=>{ const b=document.getElementById('kgo'), v=document.getElementById('akey').value, e=document.getElementById('key-err'); b.disabled=true; b.textContent='正在连接 Ancher…';
  const ok=await checkKey(v||'ak_live_demo'); b.disabled=false; if(!ok){ e.innerHTML=${JSON.stringify(errIcon)}+'<span>key 无效。它应该以 ak_live_ 开头。</span>'; e.hidden=false; b.textContent='验证并保存'; return; }
  e.hidden=true; b.textContent='Ancher 已连接 · 开始使用'; toast('激活完成'); };
document.getElementById('akey').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); document.getElementById('kgo').click(); } });
boxes[0].focus();`,
};

/* ═══ P1 · 3 「系统对话框」 — footprint: a native macOS-style sheet over the dimmed app ═══ */
const p1Sheet = {
  name: '系统对话框', axis: '占用面积：原生 sheet，从标题栏滑下',
  body: chrome('AIScript', `
  <div class="behind" aria-hidden="true"><div class="page" style="min-height:0;width:560px;margin:40px auto;padding:40px 48px">${nodes(SCRIPT1.slice(0, 14))}</div></div>
  <div class="sheet-scrim"></div>
  <section class="sheet card" role="dialog" aria-modal="true" aria-labelledby="st">
    <div class="sheet-face" id="face1">
      <div style="display:flex;gap:14px;align-items:flex-start"><div class="logo" style="margin:0;width:44px;height:44px;font-size:20px;flex:none">剧</div>
        <div><b id="st" style="font-size:15px">激活 AIScript</b><p class="muted" style="margin:4px 0 0;font-size:13px">输入提供方给你的激活码。每个码只能激活一台电脑。</p></div></div>
      <form id="f1" style="margin-top:16px"><label class="field-label" for="code">激活码</label>
        <input class="input mono" id="code" value="AIS-7K3F-9Q2M-4XHD-B8NC" autocomplete="off" spellcheck="false">
        <div class="bar" aria-hidden="true"><i id="bar"></i></div><div id="msg" class="muted" style="font-size:12px;min-height:18px" aria-live="polite"></div>
        <div class="sheet-actions"><button type="button" class="btn btn-ghost" onclick="toast('已退出')">退出</button><span style="flex:1"></span>
          <button type="button" class="btn btn-quiet" onclick="act('used')">演示：已被使用</button><button class="btn btn-primary" id="go" type="submit">激活</button></div></form></div>
    <div class="sheet-face" id="face2" hidden>
      <b style="font-size:15px">连接 Ancher</b><p class="muted" style="margin:4px 0 14px;font-size:13px">已激活（北京 · 1 / 3）。最后填写你自己的 Ancher API key。</p>
      <form id="f2"><label class="field-label" for="akey">Ancher API key</label><input class="input mono" id="akey" type="password" value="ak_live_demo" autocomplete="off" spellcheck="false">
        <div id="kmsg" class="muted" style="font-size:12px;min-height:18px;margin-top:6px" aria-live="polite"></div>
        <div class="sheet-actions"><button type="button" class="btn btn-ghost" onclick="back()">返回</button><span style="flex:1"></span><button class="btn btn-primary" type="submit">连接</button></div></form></div>
  </section>`),
  css: `${failCss}
.behind{position:absolute;inset:36px 0 0;overflow:hidden;filter:blur(2px);opacity:.55}
.sheet-scrim{position:absolute;inset:36px 0 0;background:var(--scrim)}
.sheet{position:absolute;left:50%;top:36px;width:min(440px,calc(100% - 32px));margin-left:min(-220px,calc(-50% + 16px));padding:20px;border-radius:0 0 var(--r-xl) var(--r-xl);box-shadow:var(--shadow-pop);
  transform-origin:top center;animation:sheetIn 280ms var(--ease-drawer) both}
@keyframes sheetIn{from{transform:translateY(-100%)}}
.sheet-face{transition:opacity 180ms ease,filter 180ms ease}.sheet-face.swap{opacity:0;filter:blur(2px)}
.bar{height:3px;border-radius:2px;background:var(--muted);margin:10px 0 6px;overflow:hidden}.bar i{display:block;height:100%;background:var(--primary);transform:scaleX(0);transform-origin:left;transition:transform 420ms var(--ease-enter)}
.sheet-actions{display:flex;gap:8px;margin-top:14px}.mono{font-family:var(--font-family-mono)}
@media (prefers-reduced-motion: reduce){.sheet{animation:none}}`,
  js: ACT_JS + String.raw`
const bar=document.getElementById('bar'), msg=document.getElementById('msg');
async function swap(a,b){ a.classList.add('swap'); await wait(170); a.hidden=true; a.classList.remove('swap'); b.hidden=false; b.classList.add('swap'); requestAnimationFrame(()=>requestAnimationFrame(()=>b.classList.remove('swap'))); }
async function act(kind){ const go=document.getElementById('go'); go.disabled=true; go.textContent='激活中…'; const n=kind==='used'?2:3;
  for(let i=0;i<n;i++){ msg.textContent=ACT_STEPS[i][0]+'…'; bar.style.transform='scaleX('+((i+1)/3)+')'; await wait(500); }
  if(kind==='used'){ msg.innerHTML='<span style="color:var(--color-danger-500)">✕ 这个激活码已经在另一台电脑上激活过。</span>'; bar.style.transform='scaleX(0)'; go.disabled=false; go.textContent='重试'; return; }
  msg.textContent='已激活 · 授权文件已缓存'; await wait(250); swap(document.getElementById('face1'), document.getElementById('face2')); setTimeout(()=>document.getElementById('akey').focus(),220); }
function back(){ swap(document.getElementById('face2'), document.getElementById('face1')); const go=document.getElementById('go'); go.disabled=false; go.textContent='激活'; }
document.getElementById('f1').addEventListener('submit',e=>{ e.preventDefault(); act('ok'); });
document.getElementById('f2').addEventListener('submit',async e=>{ e.preventDefault(); const k=document.getElementById('kmsg'); k.textContent='正在连接…'; const ok=await checkKey(document.getElementById('akey').value);
  k.innerHTML=ok?'<span style="color:var(--color-success-500)">✓ Ancher 已连接，key 已存进钥匙串</span>':'<span style="color:var(--color-danger-500)">✕ key 无效，应以 ak_live_ 开头</span>'; if(ok) toast('激活完成'); });
document.getElementById('code').focus();`,
};

/* ═══ P1 · 4 「三步向导」 — pacing: one question per screen, direction-aware slides ═══ */
const p1Wizard = {
  name: '三步向导', axis: '流程节奏：一屏一个问题',
  body: chrome('AIScript · 激活', `
  <main class="wz">
    <ol class="rail-steps" aria-label="进度">${['激活码', 'Ancher key', '完成'].map((t, i) => `<li data-s="${i}"><span class="tnum">${i + 1}</span>${t}</li>`).join('')}</ol>
    <div class="wz-stage">
      <form class="wz-step" data-s="0"><h1 class="display">输入激活码</h1><p class="muted">提供方会发给你一串以 AIS 开头的码。</p>
        <label class="field-label" for="code">激活码</label><input class="input big mono" id="code" value="AIS-7K3F-9Q2M-4XHD-B8NC" autocomplete="off" spellcheck="false">
        <div id="steps" class="steps"></div><div id="err0" class="err" hidden></div>
        <div class="wz-nav"><button type="button" class="btn btn-quiet" onclick="activate('used')">演示：已被使用</button><span style="flex:1"></span><button class="btn btn-primary" id="go0">继续 <span class="kbd" style="color:inherit">↵</span></button></div></form>
      <form class="wz-step" data-s="1" hidden><h1 class="display">填写你的 Ancher API key</h1><p class="muted">在 ancher.ai → 设置 → API 密钥 里创建。它只存在这台电脑的钥匙串里。</p>
        <label class="field-label" for="akey">Ancher API key</label><input class="input big mono" id="akey" type="password" value="ak_live_demo" autocomplete="off" spellcheck="false">
        <div id="err1" class="err" hidden></div>
        <div class="wz-nav"><button type="button" class="btn btn-ghost" onclick="goStep(0)">上一步</button><span style="flex:1"></span><button class="btn btn-primary" id="go1">连接 Ancher <span class="kbd" style="color:inherit">↵</span></button></div></form>
      <section class="wz-step" data-s="2" hidden><div class="done-mark">✓</div><h1 class="display">都好了</h1><p class="muted">北京 · 第 1 台 / 共 3 台 · Ancher 已连接</p>
        <div class="wz-nav"><span style="flex:1"></span><button class="btn btn-primary" onclick="toast('进入应用')">开始写剧本</button></div></section>
    </div></main>`),
  css: `${failCss}
.wz{flex:1;display:flex;flex-direction:column;align-items:center;padding:40px 24px;gap:40px}
.rail-steps{display:flex;gap:28px;list-style:none;margin:0;padding:0;font-size:13px;color:var(--ink-3)}
.rail-steps li{display:flex;align-items:center;gap:8px}.rail-steps li span{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11.5px;box-shadow:inset 0 0 0 1px var(--line-strong)}
.rail-steps li[data-on]{color:var(--ink);font-weight:600}.rail-steps li[data-on] span{background:var(--primary);color:var(--primary-fg);box-shadow:none}
.rail-steps li[data-done] span{background:var(--color-success-500);color:#fff;box-shadow:none}
.wz-stage{position:relative;width:min(560px,100%);flex:1}
.wz-step{position:absolute;inset:0 0 auto;display:flex;flex-direction:column;gap:6px}
.wz-step h1{font-size:34px;margin:0}.wz-step p{margin:0 0 22px}
.wz-step.in{animation:stepIn 240ms var(--ease-enter) both}.wz-step.in.back{animation-name:stepBack}
@keyframes stepIn{from{opacity:0;transform:translateX(24px)}}@keyframes stepBack{from{opacity:0;transform:translateX(-24px)}}
.big{height:52px;font-size:18px}.mono{font-family:var(--font-family-mono)}
.wz-nav{display:flex;gap:8px;margin-top:22px}.steps{display:flex;flex-direction:column;gap:6px;margin-top:12px}.steps:empty{display:none}
.done-mark{width:56px;height:56px;border-radius:50%;background:var(--color-success-500);color:#fff;display:grid;place-items:center;font-size:26px;margin-bottom:12px}
@media (prefers-reduced-motion: reduce){.wz-step.in{animation:none}}`,
  js: ACT_JS + String.raw`
let cur=0;
function goStep(n){ const back=n<cur; document.querySelectorAll('.wz-step').forEach(s=>{ const on=+s.dataset.s===n; s.hidden=!on; s.classList.remove('in','back'); if(on){ void s.offsetWidth; s.classList.add('in'); if(back) s.classList.add('back'); } });
  document.querySelectorAll('.rail-steps li').forEach(li=>{ const i=+li.dataset.s; li.toggleAttribute('data-on',i===n); li.toggleAttribute('data-done',i<n); }); cur=n;
  const f=document.querySelector('.wz-step[data-s="'+n+'"] input'); f&&f.focus(); }
async function activate(kind){ const b=document.getElementById('go0'); b.disabled=true; const ok=await runSteps(document.getElementById('steps'),kind); b.disabled=false;
  if(!ok){ const [t,d]=FAIL[kind], e=document.getElementById('err0'); e.innerHTML=${JSON.stringify(errIcon)}+'<span><b>'+t+'</b><br>'+d+'</span>'; e.hidden=false; return; } goStep(1); }
document.querySelector('.wz-step[data-s="0"]').addEventListener('submit',e=>{ e.preventDefault(); activate('ok'); });
document.querySelector('.wz-step[data-s="1"]').addEventListener('submit',async e=>{ e.preventDefault(); const b=document.getElementById('go1'); b.disabled=true; b.textContent='正在连接…'; const ok=await checkKey(document.getElementById('akey').value); b.disabled=false; b.textContent='连接 Ancher';
  const er=document.getElementById('err1'); if(!ok){ er.innerHTML=${JSON.stringify(errIcon)}+'<span>key 无效，应以 ak_live_ 开头。</span>'; er.hidden=false; return; } er.hidden=true; goStep(2); });
goStep(0);`,
};

/* ═══ P1 · 5 「粘贴即激活」 — zero typing: paste anywhere or drop the licence file ═══ */
const p1Paste = {
  name: '粘贴即激活', axis: '零输入：⌘V 或拖文件，自动识别',
  body: chrome('AIScript · 激活', `
  <main class="pz">
    <div class="drop" id="drop" tabindex="0" role="button" aria-label="粘贴激活码或拖入授权文件">
      <div class="hint" id="hint"><div class="display" style="font-size:28px">按 <span class="kbd big-kbd">⌘V</span> 粘贴激活码</div>
        <p class="muted">或者把 <code>.aiscript-license</code> 文件拖到这里。识别到就自动激活。</p></div>
      <div class="typed mono" id="typed" aria-live="polite"></div>
      <div id="steps" class="steps"></div>
    </div>
    <div class="pz-foot muted"><button type="button" onclick="simulate('AIS-7K3F-9Q2M-4XHD-B8NC')">演示：粘贴激活码</button><button type="button" onclick="simulate('AIS-7K3F-9Q2M-4XHD-B8NC','used')">演示：码已被使用</button><button type="button" onclick="manual()">手动输入</button></div>
    <form class="manual card" id="man" hidden><label class="field-label" for="mi">激活码</label><div style="display:flex;gap:8px"><input class="input mono" id="mi" autocomplete="off" spellcheck="false"><button class="btn btn-primary" style="height:40px">激活</button></div></form>
  </main>`),
  css: `${failCss}
.pz{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px}
.drop{width:min(620px,100%);min-height:300px;border-radius:var(--r-xl);border:1.5px dashed var(--line-strong);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:32px;text-align:center;transition:border-color 150ms ease,background-color 150ms ease}
.drop.over{border-color:var(--primary);background:var(--primary-soft)}
.drop:focus-visible{outline:2px solid var(--primary);outline-offset:4px}
.big-kbd{font-size:20px;padding:2px 10px}
.typed{font-family:var(--font-script);font-size:22px;letter-spacing:.06em;min-height:30px}
.typed .caret{display:inline-block;width:.55em;height:1em;vertical-align:-.1em;background:var(--ink);animation:caret 1s steps(1) infinite}
.steps{display:flex;flex-direction:column;gap:6px;width:min(380px,100%);text-align:left}.steps:empty{display:none}
.pz-foot{display:flex;gap:16px;font-size:12px}.pz-foot button{text-decoration:underline;text-underline-offset:3px;color:var(--ink-3)}
.manual{padding:14px;width:min(460px,100%)}.mono{font-family:var(--font-family-mono)}`,
  js: ACT_JS + String.raw`
const drop=document.getElementById('drop'), typed=document.getElementById('typed'); let busy=false, stage='code';
async function typeOut(s){ typed.innerHTML=''; const t=document.createElement('span'); const c=document.createElement('span'); c.className='caret'; typed.append(t,c);
  for(let i=0;i<s.length;i++){ t.textContent=s.slice(0,i+1); await wait(matchMedia('(prefers-reduced-motion: reduce)').matches?0:28); } c.remove(); }
async function handle(text, kind){ if(busy) return; text=text.trim();
  if(stage==='code'){ const m=text.match(/AIS-?[0-9A-Z]{4}-?[0-9A-Z]{4}-?[0-9A-Z]{4}-?[0-9A-Z]{4}/i); if(!m){ toast('没识别到激活码（应以 AIS- 开头）'); return; }
    busy=true; document.getElementById('hint').hidden=true; await typeOut(m[0].toUpperCase()); const ok=await runSteps(document.getElementById('steps'),kind||'ok'); busy=false;
    if(!ok){ const [t,d]=FAIL[kind]; document.getElementById('steps').insertAdjacentHTML('beforeend','<div class="err enter">'+${JSON.stringify(errIcon)}+'<span><b>'+t+'</b><br>'+d+'</span></div>'); return; }
    stage='key'; document.getElementById('hint').hidden=false; document.getElementById('hint').innerHTML='<div class="display" style="font-size:24px">已激活。再粘贴你的 Ancher API key</div><p class="muted">ak_live_ 开头，在 ancher.ai → 设置 → API 密钥 里复制。</p>';
    document.querySelector('.pz-foot').innerHTML='<button type="button" onclick="simulate(\'ak_live_J-3m_demo\')">演示：粘贴 Ancher key</button>'; return; }
  if(stage==='key'){ if(!/ak_live_/.test(text)){ toast('这看起来不是 Ancher key（应以 ak_live_ 开头）'); return; } busy=true; await typeOut('ak_live_••••••••');
    const ok=await checkKey(text); busy=false; document.getElementById('steps').innerHTML='<div class="tool enter"><span class="ok">✓</span><span><b>Ancher 已连接</b> · key 已存进钥匙串</span></div>';
    document.getElementById('hint').innerHTML='<button class="btn btn-primary" style="height:44px" onclick="toast(\'进入应用\')">开始写剧本</button>'; stage='done'; } }
document.addEventListener('paste',e=>{ if(e.target.closest('input')) return; handle(e.clipboardData.getData('text')); });
drop.addEventListener('dragover',e=>{ e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave',()=>drop.classList.remove('over'));
drop.addEventListener('drop',async e=>{ e.preventDefault(); drop.classList.remove('over'); const f=e.dataTransfer.files[0]; if(f) handle(await f.text()); });
function simulate(s,kind){ handle(s,kind); }
function manual(){ const m=document.getElementById('man'); m.hidden=false; document.getElementById('mi').focus(); }
document.getElementById('man').addEventListener('submit',e=>{ e.preventDefault(); handle(document.getElementById('mi').value); });
drop.focus();`,
};

/* ═══ P2 · 2 「对话式」 — dialogue: the assistant asks three short questions ═══ */
const p2Chat = {
  name: '对话式', axis: '交互模型：一问一答，答案是可点的选项',
  body: chrome('AIScript · 新项目', `
  <main class="cv"><div class="thread" id="thread" aria-live="polite"></div>
    <form class="cv-input card" id="f" hidden><label class="field-label" for="q" id="ql">一句话故事</label>
      <textarea class="input" id="q" rows="2" style="height:auto;padding:10px 12px;resize:none">${IDEA}</textarea>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span class="muted" style="font-size:12px"><span class="kbd">⌘↵</span> 发送</span><button class="btn btn-primary">发送</button></div></form></main>`),
  css: `.cv{flex:1;display:flex;flex-direction:column;align-items:center;padding:32px 24px;gap:16px;overflow:auto}
.thread{width:min(620px,100%);display:flex;flex-direction:column;gap:12px}
.bub{max-width:80%;padding:10px 14px;border-radius:var(--r-xl);font-size:14.5px;line-height:1.6}
.bub.ai{background:var(--surface);box-shadow:var(--shadow-card);border-bottom-left-radius:var(--r-sm)}
.bub.me{align-self:flex-end;background:var(--primary-soft);border-bottom-right-radius:var(--r-sm)}
.opts{display:flex;gap:8px;flex-wrap:wrap}.opts .btn{height:36px}
.cv-input{width:min(620px,100%);padding:14px}.field-label{font-size:12.5px;font-weight:600;display:block;margin-bottom:6px}
.summary{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:13.5px}.summary span:nth-child(odd){color:var(--ink-3)}`,
  js: String.raw`
const th=document.getElementById('thread'); const ans={};
function say(html, who){ const d=document.createElement('div'); d.className='bub enter '+(who||'ai'); d.innerHTML=html; th.appendChild(d); d.scrollIntoView({block:'nearest'}); return d; }
async function ask(text, key, options){ await wait(260); say(text); await wait(160); const o=document.createElement('div'); o.className='opts enter'; th.appendChild(o);
  return new Promise(res=>{ options.forEach(t=>{ const b=document.createElement('button'); b.className='btn btn-ghost'; b.textContent=t; b.onclick=()=>{ o.remove(); say(t,'me'); ans[key]=t; res(t); }; o.appendChild(b); }); o.querySelector('button').focus(); }); }
(async()=>{ await ask('先告诉我，这是一部什么样的戏？','kind',['动画剧集 · 每集 10 分钟','电影 · 90 分钟','短剧 · 每集 2 分钟']);
  await ask('写给谁看？','aud',['5–10 岁的孩子','青少年','成人']);
  await wait(260); say('最后，用一句话说说这个故事。'); const f=document.getElementById('f'); f.hidden=false; document.getElementById('q').focus(); })();
function submit(){ const v=document.getElementById('q').value.trim(); if(!v){ document.getElementById('q').focus(); return; } document.getElementById('f').hidden=true; say(v,'me');
  setTimeout(()=>{ say('<div class="summary"><span>体裁</span><span>'+ans.kind+'</span><span>受众</span><span>'+ans.aud+'</span><span>故事</span><span>'+v+'</span></div><div style="margin-top:10px"><button class="btn btn-primary" onclick="toast(\'项目已创建 → 工作区，AI 开始写大纲\')">就这样，开始写</button></div>'); },300); }
document.getElementById('f').addEventListener('submit',e=>{ e.preventDefault(); submit(); });
document.getElementById('q').addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){ e.preventDefault(); submit(); } });`,
};

/* ═══ P2 · 3 「选模板」 — choose first: pick a format card, the card becomes the form ═══ */
const TPL = [['动画剧集', '每集 10 分钟 · 约 5,000 字 · 15 场左右', '适合系列动画，按集推进'], ['电影', '90–120 分钟 · 三幕结构', '一个完整故事'], ['短剧', '每集 1–3 分钟 · 强钩子', '竖屏、高频更新'], ['从已有剧本开始', '导入 docx / pdf / fdx', '先读你的稿子，再一起改']];
const p2Tpl = {
  name: '选模板', axis: '先选后写：体裁卡片展开成表单',
  body: chrome('AIScript · 新项目', `
  <main class="tp"><h1 class="display" style="font-size:30px;margin:0">从哪里开始？</h1>
    <div class="tp-grid" id="grid">${TPL.map(([t, m, d], i) => `<button class="tp-card card" data-i="${i}"><b>${t}</b><span class="muted tnum">${m}</span><span class="muted">${d}</span></button>`).join('')}</div>
    <form class="tp-form card" id="form" hidden><button type="button" class="btn btn-quiet" id="back" style="height:28px;align-self:flex-start">← 换一个</button>
      <h2 class="display" id="ft" style="font-size:24px;margin:4px 0"></h2><p class="muted tnum" id="fm" style="margin:0 0 12px"></p>
      <label class="field-label" for="logline">一句话故事</label><textarea class="input" id="logline" rows="2" style="height:auto;padding:10px 12px;resize:none">${IDEA}</textarea>
      <button class="btn btn-primary" style="height:44px;margin-top:12px">创建项目</button></form></main>`),
  css: `.tp{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:32px}
.tp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,280px));gap:14px}
.tp-card{display:flex;flex-direction:column;gap:6px;align-items:flex-start;text-align:left;padding:20px;min-height:132px;transition:transform 160ms var(--ease-enter),box-shadow 160ms ease}
.tp-card b{font-size:17px}.tp-card:active{transform:scale(.98)}
@media (hover:hover) and (pointer:fine){.tp-card:hover{box-shadow:var(--shadow-pop)}}
.tp-form{width:min(574px,100%);padding:22px;display:flex;flex-direction:column;gap:4px;transform-origin:var(--o,center)}
.tp-form.in{animation:grow 260ms var(--ease-enter) both}@keyframes grow{from{opacity:0;transform:scale(.94)}}
.field-label{font-size:12.5px;font-weight:600;display:block;margin-bottom:6px}
@media (prefers-reduced-motion: reduce){.tp-form.in{animation:none}}`,
  js: String.raw`
const grid=document.getElementById('grid'), form=document.getElementById('form'); const T=${JSON.stringify(TPL)};
grid.querySelectorAll('.tp-card').forEach(c=>c.onclick=()=>{ const r=c.getBoundingClientRect(), g=grid.getBoundingClientRect(); form.style.setProperty('--o',(r.left+r.width/2-g.left)+'px '+(r.top+r.height/2-g.top)+'px');
  const [t,m]=T[+c.dataset.i]; document.getElementById('ft').textContent=t; document.getElementById('fm').textContent=m; grid.hidden=true; form.hidden=false; form.classList.remove('in'); void form.offsetWidth; form.classList.add('in'); document.getElementById('logline').focus(); });
document.getElementById('back').onclick=()=>{ form.hidden=true; grid.hidden=false; grid.querySelector('.tp-card').focus(); };
form.addEventListener('submit',e=>{ e.preventDefault(); toast('已创建「'+document.getElementById('ft').textContent+'」项目 → 工作区'); });`,
};

/* ═══ P2 · 4 「先导入」 — material first: read the existing script, show what was understood ═══ */
const p2Import = {
  name: '先导入', axis: '材料优先：先读懂已有剧本，再开始',
  body: chrome('AIScript · 新项目', `
  <main class="im"><div class="im-col">
    <h1 class="display" style="font-size:28px;margin:0 0 6px">把已有的稿子给我</h1><p class="muted" style="margin:0 0 16px">创作大纲、第 1 集剧本、往期稿子都行。我先读完，再告诉你读到了什么。</p>
    <div class="im-drop" id="drop" tabindex="0" role="button" aria-label="选择或拖入文件">${icon('doc', 22)}<b>拖入文件，或点击选择</b><span class="muted" style="font-size:12px">docx · pdf · fdx · fountain · txt</span></div>
    <button class="btn btn-quiet" style="margin-top:10px" id="demo">用示例文件演示</button></div>
    <div class="im-col" id="out" aria-live="polite"></div></main>`),
  css: `.im{flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:32px;padding:40px;max-width:1100px;margin:0 auto;align-items:start}
.im-drop{height:220px;border:1.5px dashed var(--line-strong);border-radius:var(--r-xl);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;transition:border-color 150ms ease,background-color 150ms ease}
.im-drop.over{border-color:var(--primary);background:var(--primary-soft)}
.found{display:flex;flex-direction:column;gap:12px}.found .card{padding:14px}.found h3{font-size:13px;margin:0 0 8px;color:var(--ink-3);font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:6px}`,
  js: String.raw`
const out=document.getElementById('out');
async function parse(names){ out.innerHTML='<div class="found" id="fd"></div>'; const fd=document.getElementById('fd');
  for(const n of names){ const r=document.createElement('div'); r.className='tool enter'; r.innerHTML='<span class="spin"></span><span><b>读取</b> · '+n+'</span>'; fd.appendChild(r); await wait(420); r.querySelector('.spin').outerHTML='<span class="ok">✓</span>'; }
  const blocks=[['角色 · 5','<div class="chips">'+['豆豆 · 9 岁','门墩儿 · 石门墩精灵','姥爷 · 修车铺','妈妈 · 护士','大壮 · 同桌'].map(x=>'<span class="chip">'+x+'</span>').join('')+'</div>'],
    ['第 1 集 · 10 场 · 5,846 字','<div class="muted" style="font-size:13px">预计 12 分钟（超出 10 分钟）· 2 处摔跤类笑点 · 结尾由妈妈讲道理</div>'],
    ['读出的规则 · 7 条','<div style="font-size:13px;line-height:1.8">受众 5–10 岁 · 每集一个故事 · 门墩儿只有豆豆看得见 · 当代胡同生活，不做传统文化讲解 …</div>']];
  for(const [h,b] of blocks){ await wait(120); fd.insertAdjacentHTML('beforeend','<div class="card enter"><h3>'+h+'</h3>'+b+'</div>'); }
  fd.insertAdjacentHTML('beforeend','<div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="toast(\'项目已创建，规则和角色已导入\')">用这些开始</button><button class="btn btn-ghost" onclick="toast(\'可以逐条修改规则\')">先改改规则</button></div>'); }
const drop=document.getElementById('drop');
drop.addEventListener('dragover',e=>{ e.preventDefault(); drop.classList.add('over'); }); drop.addEventListener('dragleave',()=>drop.classList.remove('over'));
drop.addEventListener('drop',e=>{ e.preventDefault(); drop.classList.remove('over'); parse([...e.dataTransfer.files].map(f=>f.name)); });
drop.addEventListener('click',()=>{ const i=document.createElement('input'); i.type='file'; i.multiple=true; i.onchange=()=>parse([...i.files].map(f=>f.name)); i.click(); });
document.getElementById('demo').onclick=()=>parse(['创作大纲.docx','第1集 v3.docx','往期剧本 × 5']);`,
};

/* ═══ P2 · 5 「白纸」 — immersive: type the logline straight onto the paper ═══ */
const p2Paper = {
  name: '白纸', axis: '沉浸：直接在稿纸上打字，回车开始',
  body: chrome('AIScript', `
  <main class="wp"><div class="sheet-paper page" id="paper"><div class="muted wp-hint">FADE IN:</div>
    <label for="w" class="sr">一句话故事</label><textarea id="w" class="wp-input" rows="3" spellcheck="false" placeholder="在这里写下你的故事，一句话就够。"></textarea>
    <div class="muted wp-foot"><span class="kbd">↵</span> 开始 · <span class="kbd">⇧↵</span> 换行 · <button type="button" onclick="demoType()" style="text-decoration:underline;text-underline-offset:3px">演示输入</button></div></div>
    <div class="wp-status" id="st" aria-live="polite"></div></main>`),
  css: `.wp{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:24px}
.sheet-paper{width:min(640px,100%);min-height:420px !important;padding:64px 72px !important;transition:transform 420ms var(--ease-drawer),opacity 300ms ease}
.sheet-paper.rolled{transform:translateY(-70%);opacity:.0}
.wp-hint{font-family:var(--font-script);margin-bottom:18px}
.wp-input{width:100%;border:0;outline:none;resize:none;background:transparent;font-family:var(--font-script);font-size:18px;line-height:1.8;color:var(--ink);caret-color:var(--primary)}
.wp-foot{font-size:12px;margin-top:24px;font-family:var(--font-ui)}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.wp-status{display:flex;flex-direction:column;gap:6px;width:min(380px,100%);margin-top:-160px}
@media (prefers-reduced-motion: reduce){.sheet-paper{transition:none}}`,
  js: String.raw`
let ctx; function click(){ try{ ctx=ctx||new AudioContext(); if(ctx.state!=='running') return; const t=ctx.currentTime, n=ctx.sampleRate*.03|0, b=ctx.createBuffer(1,n,ctx.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,5);
  const s=ctx.createBufferSource(); s.buffer=b; const f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=2400+Math.random()*1400; const g=ctx.createGain(); g.gain.value=.25; s.connect(f).connect(g).connect(ctx.destination); s.start(t); }catch(_){} }
const w=document.getElementById('w');
document.addEventListener('pointerdown',()=>{ try{ ctx=ctx||new AudioContext(); ctx.resume(); }catch(_){} },{once:true});
w.addEventListener('input',click);
w.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); start(); } });
async function demoType(){ w.value=''; w.focus(); for(const ch of ${JSON.stringify(IDEA)}){ w.value+=ch; click(); await wait(40); } }
async function start(){ if(!w.value.trim()){ w.focus(); return; } document.getElementById('paper').classList.add('rolled'); await wait(300); const st=document.getElementById('st');
  for(const t of ['建项目','写大纲','建角色和地点']){ const r=document.createElement('div'); r.className='tool enter'; r.innerHTML='<span class="spin"></span><b>'+t+'</b>'; st.appendChild(r); await wait(420); r.querySelector('.spin').outerHTML='<span class="ok">✓</span>'; }
  toast('→ 工作区，AI 正在写第一场'); }
w.focus();`,
};

export const ENTRY = { p1: [p1Seg, p1Sheet, p1Wizard, p1Paste], p2: [p2Chat, p2Tpl, p2Import, p2Paper] };
