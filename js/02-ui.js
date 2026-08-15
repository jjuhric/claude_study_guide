/* 02-ui.js
   UI helpers, audio, search, analytics
   Part of Claude Cert Quest. Loaded as a classic script: every file
   shares one global scope, in the order listed in index.html. */
"use strict";
/* ================= AUDIO SYNTHESIZER (Web Audio API) ================= */
let audioCtx = null;
function getAudioContext(){
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global unlock on first user gesture
function playSound(type){
  if (!S.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    if (type === 'correct') {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.18, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.2);
      });
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.22);
    } else if (type === 'flip') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.09);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.04);
    } else if (type === 'level' || type === 'badge') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((f, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + idx * 0.08);
        g.gain.setValueAtTime(0.2, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + idx * 0.08); o.stop(now + idx * 0.08 + 0.35);
      });
    }
  } catch (e) {
    console.log("Web Audio notice:", e);
  }
}

function toggleSound(){
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  S.sound = !S.sound;
  save();
  renderHeader();
  if (S.sound) {
    setTimeout(() => playSound('level'), 50);
    toast("🔊 Sound Enabled!");
  } else {
    toast("🔇 Sound Muted");
  }
}

/* ================= FULL-TEXT SEARCH ================= */
let searchIndex = null;
async function buildSearchIndex(){
  const docs = [];
  for(const c of CERTS){
    if(!c._loaded){
      try { await loadCert(c); } catch(e){}
    }
    if(c._loaded){
      c.questions.forEach((q, qidx) => {
        docs.push({
          type: 'question',
          certId: c.id,
          certCode: c.code,
          domain: c.domains[q.d],
          qidx: qidx,
          id: qKey(c, qidx),
          title: q.q,
          text: q.q + " " + q.opts.join(" ") + " " + (q.exp||"") + " " + (q.why?q.why.join(" "):"")
        });
      });
      c.lessons.forEach((les, lidx) => {
        const plainBody = les.b.replace(/<[^>]+>/g, ' ');
        docs.push({
          type: 'lesson',
          certId: c.id,
          certCode: c.code,
          lidx: lidx,
          id: les.id || `${c.id}l-${lidx}`,
          title: les.h,
          text: les.h + " " + plainBody
        });
      });
    }
  }
  searchIndex = docs;
  return docs;
}
async function openSearchModal(){
  let modal = $("searchModal");
  if(!modal){
    modal = document.createElement("div");
    modal.id = "searchModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-box" role="dialog" aria-label="Search study material">
        <div class="modal-hdr">
          <h3>🔍 Search Study Material</h3>
          <button class="modal-close" onclick="closeSearchModal()" aria-label="Close search">×</button>
        </div>
        <input type="text" id="searchInput" class="search-input" placeholder="Type to search lessons, questions, topics..." oninput="doSearch(this.value)" autofocus>
        <div id="searchResults" class="search-results">
          <div class="search-hint">Indexing content... press Esc to close</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = "flex";
  $("searchInput").value = "";
  $("searchInput").focus();
  $("searchResults").innerHTML = '<div class="search-hint">Indexing content...</div>';
  await buildSearchIndex();
  $("searchResults").innerHTML = '<div class="search-hint">Type a keyword like "prompt", "token", "API", or "eval"...</div>';
}
function closeSearchModal(){
  const modal = $("searchModal");
  if(modal) modal.style.display = "none";
}
function doSearch(qStr){
  const resContainer = $("searchResults");
  if(!qStr || qStr.trim().length < 2){
    resContainer.innerHTML = '<div class="search-hint">Type at least 2 characters to search...</div>';
    return;
  }
  if(!searchIndex) return;
  const terms = qStr.toLowerCase().trim().split(/\s+/);
  const matches = searchIndex.filter(doc => {
    const txt = doc.text.toLowerCase();
    return terms.every(term => txt.includes(term));
  }).slice(0, 25);

  if(!matches.length){
    resContainer.innerHTML = '<div class="search-hint">No matching questions or lessons found.</div>';
    return;
  }

  let html = '';
  matches.forEach(m => {
    const isLesson = m.type === 'lesson';
    const tag = isLesson ? `📖 ${m.certCode} Lesson` : `⚔️ ${m.certCode} Q (${m.domain})`;
    const onClick = isLesson
      ? `closeSearchModal(); lessonView('${m.certId}', ${m.lidx});`
      : `closeSearchModal(); certView('${m.certId}');`;
    
    let titleHtml = esc(m.title);
    terms.forEach(t => {
      const reg = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      titleHtml = titleHtml.replace(reg, '<mark>$1</mark>');
    });

    html += `
      <div class="search-item" onclick="${onClick}">
        <div class="search-item-tag">${tag}</div>
        <div class="search-item-title">${titleHtml}</div>
      </div>
    `;
  });
  resContainer.innerHTML = html;
}
/* ================= PASS PROBABILITY PREDICTOR ================= */
function calculatePassProbability(c){
  const rp = prepProgress(c);
  const p = certProgress(c);
  const ret = cardRetention(c);
  const mocks = S.mocks[c.id] || [];
  const bestMock = mocks.length ? Math.max(...mocks) : 0;
  
  // Weighted prediction formula:
  // - Accuracy and Coverage: 40 percent weight
  // - Mock Exam Best Score: 30 percent weight
  // - Lesson Read Completion: 15 percent weight
  // - Flashcard Mastery: 15 percent weight
  const accScore = (p.acc || 0) * (Math.min(1, (p.seen || 0) / Math.max(1, p.total)));
  const mockScore = bestMock ? Math.min(100, Math.max(0, (bestMock - 200) / 7.5)) : (p.acc * 0.7);
  const lessonPct = (lessonProgress(c).pct || 0);
  const cardPct = Math.round(ret * 100);
  
  const prob = Math.round((accScore * 0.35) + (mockScore * 0.35) + (lessonPct * 0.15) + (cardPct * 0.15));
  const clamped = Math.min(99, Math.max(5, prob));
  
  let label = "Building Foundation";
  let badgeColor = "var(--coral)";
  if (clamped >= 85) { label = "High Pass Probability 🎯"; badgeColor = "var(--green)"; }
  else if (clamped >= 70) { label = "Ready for First Attempt 🚀"; badgeColor = "var(--blue)"; }
  else if (clamped >= 50) { label = "Progressing — Drill Weak Spots 📈"; badgeColor = "var(--gold)"; }
  
  return { prob: clamped, label, badgeColor, bestMock, lessonPct, cardPct, acc: p.acc };
}

/* ================= ANALYTICS & HEATMAP ================= */
function analyticsView(){
  renderHeader();
  const days30 = [];
  const todayDate = new Date();
  for(let i=29; i>=0; i--){
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    days30.push({ key, active: S.days.includes(key), isToday: i===0 });
  }

  let heatmapCells = '';
  days30.forEach(d => {
    heatmapCells += `<div class="heatmap-cell${d.active?' active':''}${d.isToday?' today':''}" title="${d.key}${d.active?' · Active':''}"></div>`;
  });

  let totalAnswered = 0, totalCorrect = 0;
  Object.keys(S.answered||{}).forEach(certId => {
    const certAns = S.answered[certId];
    Object.keys(certAns).forEach(qKey => {
      totalAnswered++;
      if(certAns[qKey]) totalCorrect++;
    });
  });
  const overallAcc = totalAnswered ? Math.round(totalCorrect / totalAnswered * 100) : 0;

  let h = `
    <button class="back" onclick="home()">← Back</button>
    <div class="panel">
      <h2 style="font-size:18px;">📊 Study Analytics & Habits</h2>
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin:14px 0;">
        <div style="border:2px solid var(--border); border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:22px; font-weight:800; color:var(--coral);">${dayStreak()} Days</div>
          <div style="font-size:11px; color:var(--muted);">Current Streak</div>
        </div>
        <div style="border:2px solid var(--border); border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:22px; font-weight:800; color:var(--green);">${totalAnswered}</div>
          <div style="font-size:11px; color:var(--muted);">Questions Attempted</div>
        </div>
        <div style="border:2px solid var(--border); border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:22px; font-weight:800; color:var(--blue);">${overallAcc}%</div>
          <div style="font-size:11px; color:var(--muted);">Overall Accuracy</div>
        </div>
        <div style="border:2px solid var(--border); border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:22px; font-weight:800; color:var(--purple);">${S.cardsSeen}</div>
          <div style="font-size:11px; color:var(--muted);">Cards Reviewed</div>
        </div>
      </div>
      
      <h4 style="font-size:15px; margin:20px 0 10px;">🎯 Exam Pass Probability Predictor</h4>
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:12px; margin-bottom:16px;">
        ${CERTS.map(c => {
          const pp = calculatePassProbability(c);
          return `
            <div style="border:2px solid var(--border); border-radius:12px; padding:14px; background:var(--card);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span class="code" style="color:${c.color}; font-weight:800;">${c.code}</span>
                <span style="font-size:11px; font-weight:700; color:${pp.badgeColor}; background:rgba(0,0,0,0.06); padding:2px 6px; border-radius:4px;">${pp.label}</span>
              </div>
              <div style="display:flex; align-items:baseline; gap:6px; margin:8px 0;">
                <span style="font-size:32px; font-weight:900; color:${pp.badgeColor};">${pp.prob}%</span>
                <span style="font-size:12px; color:var(--muted);">estimated readiness</span>
              </div>
              <div class="pbar" style="height:6px; margin-bottom:8px;"><div style="width:${pp.prob}%; background:${pp.badgeColor};"></div></div>
              <div style="font-size:11.5px; color:var(--muted); line-height:1.5;">
                • Lessons: <b>${pp.lessonPct}%</b> · Accuracy: <b>${pp.acc}%</b><br>
                • Flashcards: <b>${pp.cardPct}%</b> · Best Mock: <b>${pp.bestMock ? pp.bestMock + '/1000' : 'None yet'}</b>
              </div>
            </div>
          `;
        }).join('')}
      </div>
  
      <h4 style="font-size:14px; margin:16px 0 6px;">📅 30-Day Activity Calendar</h4>
      <div class="heatmap-grid">${heatmapCells}</div>
      <div style="font-size:11px; color:var(--muted); margin-top:6px;">Green cells indicate study activity logged on that calendar day.</div>
    </div>
  `;
  $("app").innerHTML = h;
}

/* ================= BACKUP =================
   All progress lives in one browser's localStorage, so clearing site data
   wipes everything. Export is the only safety net until accounts exist. */
function exportProgress(){
  try{
    const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download="cert-quest-progress-"+today()+".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast("Progress exported");
  }catch(e){ alert("Could not export progress: "+(e&&e.message||e)); }
}
function importProgress(file){
  if(!file) return;
  const r=new FileReader();
  r.onerror=()=>alert("Could not read that file.");
  r.onload=()=>{
    let raw;
    try{ raw=JSON.parse(r.result); }
    catch(e){ alert("That is not a valid progress file (could not parse JSON)."); return; }
    if(!raw||typeof raw!=="object"||Array.isArray(raw)){ alert("That file does not look like a progress export."); return; }
    const inc=migrate(raw);                       // same repair path as a normal load
    const certs=Object.keys(inc.answered||{}).length;
    if(!confirm("Import this progress?\n\n"
      +inc.xp+" XP · "+inc.badges.length+" badges · "+certs+" certification(s) with answers"
      +"\n\nThis REPLACES your current progress ("+S.xp+" XP, "+S.badges.length+" badges). "
      +"Export first if you want to keep it.")) return;
    S=inc; save(); applyTheme(); home(); toast("Progress imported");
  };
  r.readAsText(file);
}
function level(){ return Math.min(10, Math.floor(Math.sqrt(S.xp/60))+1); }
function xpForLevel(l){ return 60*(l-1)*(l-1); }
function title(){ return TITLES[Math.min(level()-1, TITLES.length-1)]; }
function dayStreak(){
  let n=0; let d=new Date();
  for(;;){ const k=d.toISOString().slice(0,10); if(S.days.includes(k)){n++; d.setDate(d.getDate()-1);} else break; }
  return n;
}
function checkDayStreak(){ if(dayStreak()>=3) award("streak3"); }

/* ================= SPACED REPETITION =================
   Leitner boxes. A card you know moves up a box and comes back later; a card
   you miss drops to box 1 and returns immediately. Recall is what fixes
   material in memory, so the schedule is the point — not the card count. */
const BOX_DAYS=[0,1,2,4,9,21];           // review gap in days, indexed by box
const dayKey=d=>d.toISOString().slice(0,10);
const today=()=>dayKey(new Date());
function inDays(n){ const d=new Date(); d.setDate(d.getDate()+n); return dayKey(d); }
function shuffleArr(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function cardBox(c,i){ const b=(S.cardBox[c.id]||{})[cardKey(c,i)]; return (b&&typeof b.b==="number")?b:{b:0,d:""}; }

function getAllCertCards(c){
  const custom = (S.customCards && S.customCards[c.id]) || [];
  return [...(c.cards || []), ...custom];
}

function dueCards(c){
  const deck = getAllCertCards(c); const t=today(); return deck.map((_,i)=>i).filter(i=>{ const s=cardBox(c,i); return !s.d||s.d<=t; }); }
function nextDueDate(c){
  const ds=getAllCertCards(c).map((_,i)=>cardBox(c,i).d).filter(Boolean).sort();
  return ds.length?ds[0]:null;
}
function scheduleCard(c,i,knew){
  S.cardBox[c.id]=S.cardBox[c.id]||{};
  const s=cardBox(c,i);
  s.b = knew ? Math.min(5, s.b+1) : 1;
  s.d = knew ? inDays(BOX_DAYS[s.b]) : today();   // missed cards stay due
  S.cardBox[c.id][cardKey(c,i)]=s;
  if(knew) playSound('correct'); else playSound('wrong');
}
/* Fraction of a deck that has reached a durable box (3+ correct recalls). */
function cardRetention(c){
  const deck=getAllCertCards(c); if(!deck.length) return 0;
  return deck.filter((_,i)=>cardBox(c,i).b>=3).length / deck.length;
}

/* ================= PREP PROGRESS =================
   A blend of the things that actually predict readiness on THIS app's material.
   It is not a prediction about the real exam — we have no verified blueprint —
   so it is framed as prep progress and always names the weakest component. */
function prepProgress(c){
  const p=certProgress(c), lp=lessonProgress(c);
  const st=S.domStats[c.id]||{};
  const domAcc=c.domains.map((_,i)=>{ const s=st[i]||{s:0,c:0}; return s.s>=3 ? s.c/s.s : null; });
  const solid=domAcc.filter(a=>a!==null&&a>=0.7).length;
  const best=(S.mocks[c.id]||[]).length?Math.max(...S.mocks[c.id]):0;
  const parts=[
    {k:"lessons",  label:"Read the study guide",      v: lp.total?lp.done/lp.total:0,
     todo:"Work through the remaining lessons — the questions assume that grounding.", go:"startLearn"},
    {k:"coverage", label:"See every question",        v: p.total?p.seen/p.total:0,
     todo:"Keep running quiz rounds until you have seen the whole bank.", go:"startQuiz"},
    {k:"accuracy", label:"Answer accurately",         v: p.seen>=5?p.correct/p.seen:0,
     todo:"Accuracy is the gap. Review your missed questions before adding new ones.", go:"startReview"},
    {k:"domains",  label:"Cover every domain",        v: c.domains.length?solid/c.domains.length:0,
     todo:"Some domains are untested or weak. Drill the weakest one.", go:"startWeakest"},
    {k:"cards",    label:"Retain the key facts",      v: cardRetention(c),
     todo:"Run your due flashcards — recall over time is what makes facts stick.", go:"startCards"},
    {k:"mock",     label:"Perform under time",        v: best?Math.min(1,Math.max(0,(best-400)/320)):0,
     todo:"Sit a timed mock exam — pacing is a separate skill from knowing the material.", go:"startMock"},
  ];
  const score=Math.round(100*parts.reduce((a,x)=>a+x.v,0)/parts.length);
  const weakest=parts.slice().sort((a,b)=>a.v-b.v)[0];
  return {score, parts, weakest};
}

function addXP(n, why){
  const before=level(); S.xp+=n; save();
  toast("+"+n+" XP"+(why?" · "+why:""));
  const after=level();
  if(after>before){
    playSound('level');
    setTimeout(()=>{ toast("🎉 Level "+after+" — "+title()+"!"); confetti(); },900);
    if(after>=3)award("lvl3"); if(after>=6)award("lvl6");
  }
  renderHeader();
}
function award(id){
  if(S.badges.includes(id)) return;
  const b=BADGES.find(x=>x.id===id); if(!b) return;
  S.badges.push(id); save();
  playSound('badge');
  setTimeout(()=>{ toast("🏅 Badge earned: "+b.name+"!"); confetti(); }, 400);
}

/* ================= UI helpers ================= */
const $=id=>document.getElementById(id);
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
/* Screen-reader announcement channel. Cleared first so repeat text re-fires. */
function announce(msg){
  const l=$("live"); if(!l) return;
  l.textContent=""; setTimeout(()=>{ l.textContent=msg; }, 60);
}
let toastTimer=null;
function toast(msg){
  const t=$("toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),1800);
}
function confetti(){
  const colors=["#d97757","#e8b448","#5a9e6f","#5b7fa6","#8a6fae"];
  for(let i=0;i<50;i++){
    const p=document.createElement("div"); p.className="cpiece";
    p.style.left=Math.random()*100+"vw";
    p.style.background=colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDuration=(1.6+Math.random()*1.6)+"s";
    p.style.animationDelay=(Math.random()*.4)+"s";
    p.style.borderRadius=Math.random()>.5?"50%":"2px";
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),3600);
  }
}
function renderHeader(){
  const l=level(), cur=S.xp-xpForLevel(l), next=xpForLevel(l+1)-xpForLevel(l);
  const pct=l>=10?100:Math.min(100, Math.round(cur/next*100));
  $("hdr").innerHTML =
    '<div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:12px; flex-wrap:wrap;">'
    + '<div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="home()">'
    + '<div class="logo">🧭</div>'
    + '<div><h1 style="font-size:18px; line-height:1.2; margin:0;">Claude Cert Quest</h1><small style="display:block; font-size:11px; color:var(--muted);">Your path to all four Anthropic certifications</small></div>'
    + '</div>'
    + '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-left:auto;">'
    + '<div class="stat"><div class="v">'+l+'</div><div class="l">Level</div></div>'
    + '<div class="stat"><div class="v">'+S.xp+'</div><div class="l">XP</div></div>'
    + '<div class="stat"><div class="v">'+dayStreak()+'🔥</div><div class="l">Streak</div></div>'
    + '<span id="pwaStatusBadge" style="font-size:11px; font-weight:700; padding:3px 7px; border-radius:6px; background:rgba(90,158,111,0.15); color:var(--green);" title="PWA Service Worker Offline Ready">● Offline Ready</span>'
    + '<button class="themebtn" onclick="bookmarksView()" title="View Bookmarks & Notes" aria-label="Bookmarks">📌</button>'
    + '<button class="themebtn" onclick="openSearchModal()" title="Search study material (Ctrl+K)" aria-label="Search study material">🔍 Search</button>'
    + '<button class="themebtn" onclick="toggleSound()" title="Toggle sound ('+(S.sound?'On':'Muted')+')" aria-label="Toggle sound">'
    + (S.sound?'🔊':'🔇')+'</button>'
    + '<button class="themebtn" onclick="cycleTheme()" title="Theme: '+S.theme+'" aria-label="Change theme (currently '+S.theme+')">'
    + (S.theme==="dark"?"🌙":S.theme==="light"?"☀️":"🌓")+'</button>'
    + '</div>'
    + '</div>'
    + '<div class="xpbar"><div style="width:'+pct+'%" role="progressbar" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100" aria-label="Progress to next level"></div></div>'
    + '<div class="lvltitle">'+title()+(l<10?' · '+(next-cur)+' XP to next level':' · MAX')+'</div>';
}
