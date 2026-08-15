/* 11-boot.js
   Relocated init + content loader. Loads last.
   Part of Claude Cert Quest. */
"use strict";
/* Top-level statements relocated here from the modules below.
   Each script file hoists only its own declarations, so init code that
   calls a function defined in a later file must run after every file
   has loaded. Behaviour is unchanged; only the execution point moved. */
/* day-streak init (calls checkDayStreak, defined much later) */
(function(){ const t=new Date().toISOString().slice(0,10); if(!S.days.includes(t)){S.days.push(t); save();} checkDayStreak(); })();
/* audio unlock listener */
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}
/* search hotkey */
document.addEventListener('keydown', e => {
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    openSearchModal();
  }
  if(e.key === 'Escape'){
    closeSearchModal();
  }
});
/* reading-progress listener */
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    const bar = document.getElementById('readingProgressBar');
    if (!bar) return;
    const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (h > 0) {
      const pct = Math.min(100, Math.max(0, (window.scrollY / h) * 100));
      bar.style.width = pct + '%';
    } else {
      bar.style.width = '0%';
    }
  });
}
/* speech-voice listener */
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    ttsCurrentVoice = getBestVoice();
    populateVoiceDropdown();
  };
}

/* Study content lives in data/<id>.json so it can be reviewed, diffed, and
   expanded without editing this file. This needs to be served over HTTP —
   browsers block fetch() on file:// URLs. */
/* Shuffle option order per load so the correct answer position varies.
   Length-agnostic, so questions with other than 4 options stay correct. */
function shuffleOptions(c){
  for(const q of c.questions){
    const n=q.opts.length, idx=Array.from({length:n},(_,i)=>i);
    for(let i=n-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
    /* Per-option rationales must ride the same permutation as the options,
       or every explanation ends up attached to the wrong answer. */
    if(Array.isArray(q.why)&&q.why.length===n) q.why=idx.map(k=>q.why[k]);
    q.opts=idx.map(k=>q.opts[k]);
    q.a=idx.indexOf(q.a);
  }
}
/* Content for one certification, fetched the first time it is opened. The
   home screen runs off the manifest counts, so a first visit downloads a few
   hundred bytes instead of every certification's question bank. */
/* Progress is keyed by a question's stable id, not its position, so editing or
   reordering the bank cannot reattach a learner's history to a different
   question. Falls back to the index only for content without an id. */
function qKey(c,qi){ const q=c.questions[qi]; return (q&&q.id)||String(qi); }
function cardKey(c,ci){ const x=c.cards[ci]; return (x&&x.id)||String(ci); }
/* Saves written before ids existed keyed everything by position. Remap them
   once, when the bank is available, using the order as it stands now. */
function migrateCertKeys(c){
  const ans=S.answered[c.id];
  if(ans){
    let changed=false;
    for(const k of Object.keys(ans)){
      if(!/^\d+$/.test(k)) continue;
      const q=c.questions[+k];
      if(q&&q.id&&!(q.id in ans)) ans[q.id]=ans[k];
      delete ans[k]; changed=true;
    }
    if(changed) save();
  }
  const box=S.cardBox[c.id];
  if(box){
    let changed=false;
    for(const k of Object.keys(box)){
      if(!/^\d+$/.test(k)) continue;
      const x=c.cards[+k];
      if(x&&x.id&&!(x.id in box)) box[x.id]=box[k];
      delete box[k]; changed=true;
    }
    if(changed) save();
  }
}
function loadCert(c){
  if(c._loaded) return Promise.resolve(c);
  if(c._loading) return c._loading;
  c._loading = fetch("data/"+c.id+".json",{cache:"no-cache"}).then(r=>{
    if(!r.ok) throw new Error("data/"+c.id+".json returned HTTP "+r.status);
    return r.json();
  }).then(d=>{
    c.questions=d.questions||[]; c.cards=d.cards||[]; c.lessons=d.lessons||[];
    migrateCertKeys(c);
    shuffleOptions(c);
    c._loaded=true; c._loading=null;
    return c;
  }).catch(e=>{ c._loading=null; throw e; });
  return c._loading;
}
function loadError(e,retry){
  $("app").innerHTML='<div class="panel"><h2 style="font-size:17px;">Could not load study content</h2>'
   +'<p style="font-size:13px; color:var(--muted); margin-top:8px;">'+esc(String(e&&e.message||e))+'</p>'
   +'<p style="font-size:13.5px; line-height:1.6; margin-top:12px;">Questions and lessons load from <code>data/*.json</code>, which browsers block when a page is opened directly from disk. Serve the folder over HTTP instead:</p>'
   +'<pre style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; font-size:12.5px; overflow-x:auto; margin:8px 0 0;">npx serve .</pre>'
   +'<p style="font-size:13.5px; color:var(--muted); margin-top:12px;">Or use the hosted copy at <b>jjuhric.github.io/claude_study_guide</b>.</p>'
   +(retry?'<div class="rowbtns"><button class="btn" onclick="'+retry+'">Try again</button></div>':'')+'</div>';
}
(async function(){
  const app=document.getElementById("app");
  applyTheme();
  renderHeader();
  app.innerHTML='<div class="panel center" style="color:var(--muted); font-size:14px;">Loading…</div>';
  try{
    const r=await fetch("data/manifest.json",{cache:"no-cache"});
    if(!r.ok) throw new Error("data/manifest.json returned HTTP "+r.status);
    const m=await r.json();
    for(const c of CERTS){ c.counts=m[c.id]||{questions:0,cards:0,lessons:0}; }
    home();
  }catch(e){
    app.innerHTML='<div class="panel"><h2 style="font-size:17px;">Could not load study content</h2>'
      +'<p style="font-size:13px; color:var(--muted); margin-top:8px;">'+esc(String(e&&e.message||e))+'</p>'
      +'<p style="font-size:13.5px; line-height:1.6; margin-top:12px;">Questions and lessons load from <code>data/*.json</code>, which browsers block when a page is opened directly from disk. Serve the folder over HTTP instead:</p>'
      +'<pre style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; font-size:12.5px; overflow-x:auto; margin:8px 0 0;">npx serve .</pre>'
      +'<p style="font-size:13.5px; color:var(--muted); margin-top:12px;">Or use the hosted copy at <b>jjuhric.github.io/claude_study_guide</b>.</p></div>';
  }
})();


if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const b = document.getElementById('pwaStatusBadge');
    if (b) { b.textContent = '● Online (PWA)'; b.style.color = 'var(--green)'; }
    toast('🌐 Back online');
  });
  window.addEventListener('offline', () => {
    const b = document.getElementById('pwaStatusBadge');
    if (b) { b.textContent = '● Offline Mode'; b.style.color = 'var(--coral)'; }
    toast('📡 Operating in Offline PWA Mode');
  });
}

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
