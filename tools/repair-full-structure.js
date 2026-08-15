const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const isCRLF = html.includes('\r\n');
if (isCRLF) html = html.replace(/\r\n/g, '\n');

// Find start of certViewRender and end of copyCode
const startMarker = "function certViewRender(c){";
const endMarker = "/* ================= CRAM SHEETS & LAB TOOLS ================= */";

const p1 = html.indexOf(startMarker);
const p2 = html.indexOf(endMarker);

if (p1 === -1 || p2 === -1) {
  console.error("Markers not found", { p1, p2 });
  process.exit(1);
}

const replacement = `function certViewRender(c){
  const id=c.id;
  if(!S.seenCerts.includes(id)){ S.seenCerts.push(id); save(); if(S.seenCerts.length===4) award("allseen"); }
  renderHeader();
  const p=certProgress(c);
  const lp=lessonProgress(c);
  const rp=prepProgress(c);
  const due=dueCards(c).length, nd=nextDueDate(c);
  const ans=S.answered[c.id]||{};
  const misses=c.questions.filter((q,i)=>ans[qKey(c,i)]===false).length;
  let doms='';
  c.domains.forEach((d,i)=>{
    const st=(S.domStats[c.id]||{})[i]||{s:0,c:0};
    const pc=st.s?Math.round(st.c/st.s*100):0;
    const has=c.questions.some(q=>q.d===i);
    doms+='<div class="dombar'+(has?" drillable":"")+'"'+(has?' onclick="startDrill(\\''+id+'\\','+i+')" title="Drill this domain"':'')+'>'
      +'<div class="dl"><span>'+esc(d)+'</span><span class="pc">'+(st.s? pc+"% ("+st.c+"/"+st.s+")":"not yet tested")+(has?' <b>›</b>':'')+'</span></div>'
      +'<div class="pbar"><div style="width:'+pc+'%; background:'+c.color+'"></div></div></div>';
  });
  const meters=rp.parts.map(x=>{
    const v=Math.round(x.v*100);
    return '<div class="meter"><div class="dl"><span>'+x.label+'</span><span class="pc">'+v+'%</span></div>'
      +'<div class="pbar"><div style="width:'+v+'%; background:'+(x.v>=.8?"var(--green)":x.v>=.5?"var(--gold)":"var(--coral)")+'"></div></div></div>';
  }).join('');
  $("app").innerHTML =
   '<button class="back" onclick="home()">← All certifications</button>'
   +'<div class="panel"><div style="display:flex; gap:14px; align-items:center;"><div style="font-size:38px;">'+c.em+'</div>'
   +'<div><h2 style="font-size:19px;">'+c.name+' – '+c.sub+'</h2><div class="code" style="color:var(--muted); font-size:12px;">'+c.code+' · '+c.price+' · see the official exam guide for format</div>'
   +'<div style="font-size:13px; margin-top:4px; color:var(--muted);">'+c.blurb+'</div></div></div>'
   +'<div class="modes">'
   +'<div class="mode" onclick="startLearn(\\''+id+'\\')"><div class="em">📖</div><h4>Study Guide</h4><p>'+lp.total+' lessons · '+lp.done+' read</p></div>'
   +'<div class="mode" onclick="startQuiz(\\''+id+'\\')"><div class="em">⚔️</div><h4>Quiz Battle</h4><p>10 questions, instant feedback, combo XP</p></div>'
   +'<div class="mode" onclick="startCards(\\''+id+'\\')"><div class="em">🃏</div><h4>Flashcards</h4><p>'+(due?'<b style="color:var(--coral)">'+due+' due now</b>':(nd?'All caught up · next '+nd:'Spaced repetition'))+'</p></div>'
   +'<div class="mode" onclick="startMock(\\''+id+'\\')"><div class="em">⏱️</div><h4>Mock Exam</h4><p>20 questions, 40 min, practice scoring</p></div>'
   +'<div class="mode" onclick="startReview(\\''+id+'\\')"><div class="em">🎯</div><h4>Review Misses</h4><p>'+(misses?'<b style="color:var(--coral)">'+misses+' to revisit</b>':'Nothing missed yet')+'</p></div>'
   +'<div class="mode" onclick="startWeakest(\\''+id+'\\')"><div class="em">🩹</div><h4>Weakest Domain</h4><p>Target where you score lowest</p></div>'
   +'</div>'
   +'<div style="margin-top:12px; display:flex; justify-content:center;"><button class="btn ghost sm" onclick="cramSheetView(\\''+id+'\\')">📋 View '+c.code+' Exam Cram Sheet</button></div>'
   +'</div>'
   +'<div class="panel"><div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">'
   +'<div class="prepring" style="--pv:'+(rp.score*3.6)+'deg; --pc:'+c.color+'"><span>'+rp.score+'<small>%</small></span></div>'
   +'<div style="flex:1; min-width:200px;"><h3 style="font-size:15px;">Prep progress</h3>'
   +'<p style="font-size:12px; color:var(--muted); margin-top:3px; line-height:1.5;">Based on this app\\'s material only — not a prediction about the real exam.</p></div></div>'
   +'<div style="margin-top:14px;">'+meters+'</div>'
   +'<div class="nextstep"><div class="lbl">Do this next</div>'+esc(rp.weakest.todo)
   +'<div style="margin-top:10px;"><button class="btn sm" onclick="'+rp.weakest.go+'(\\''+id+'\\')">'+esc(rp.weakest.label)+' →</button></div></div>'
   +'</div>'
   +'<div class="panel"><h3 style="font-size:15px; margin-bottom:10px;">📊 Domain mastery</h3>'
   +'<p style="font-size:12px; color:var(--muted); margin:-4px 0 10px;">Tap a domain to drill just those questions.</p>'+doms+'</div>';
}

/* ================= STUDY GUIDE ================= */
function startLearn(id){ learnList(id); }
function lessonLabel(c,i){
  const les=c.lessons[i];
  return les.foundation ? "🌱 Start here" : "Domain "+i+" of "+c.domains.length;
}
function learnList(id){
  const c=CERTS.find(x=>x.id===id);
  const read=S.lessonsRead[c.id]||[];
  const lp=lessonProgress(c);
  renderHeader();
  let rows='';
  c.lessons.forEach((les,i)=>{
    const done=!!read[i];
    rows+='<div class="lesson-row'+(done?" done":"")+(les.foundation?" found":"")+'" onclick="lessonView(\\''+id+'\\','+i+')">'
      +'<div class="lchk">'+(done?"✓":(les.foundation?"🌱":i))+'</div>'
      +'<div class="ltext"><div class="ltitle">'+esc(les.h)+'</div><div class="lnum">'+lessonLabel(c,i)+'</div></div>'
      +'<div class="larrow">→</div></div>';
  });
  $("app").innerHTML =
   '<button class="back" onclick="certView(\\''+id+'\\')">← Back to '+c.code+'</button>'
   +'<div class="panel"><h2 style="font-size:18px;">📖 '+c.name+' — Study Guide</h2>'
   +'<div style="font-size:13px; color:var(--muted); margin-top:4px;">Read each domain lesson, then head to Quiz Battle or a Mock Exam to test yourself.</div>'
   +'<div class="studybar"><div class="pbar" style="flex:1;"><div style="width:'+lp.pct+'%; background:'+c.color+'"></div></div><span>'+lp.done+'/'+lp.total+' read</span></div>'
   +'<div class="lesson-list">'+rows+'</div></div>';
}
function lessonView(id,i){
  const c=CERTS.find(x=>x.id===id);
  const les=c.lessons[i];
  renderHeader();
  const prevBtn=i>0?'<button class="btn ghost sm" onclick="lessonView(\\''+id+'\\','+(i-1)+')">← Prev</button>':'';
  const nextBtn=i<c.lessons.length-1?'<button class="btn sm" onclick="markRead(\\''+id+'\\','+i+',true)">Mark read & next →</button>':'<button class="btn sm" onclick="markRead(\\''+id+'\\','+i+',false)">Mark read & finish 🏁</button>';
  $("app").innerHTML =
   '<button class="back" onclick="learnList(\\''+id+'\\')">← All lessons</button>'
   +'<div class="panel"><div class="lesson-hdr"><span class="ltag">'+lessonLabel(c,i)+' · '+c.code+'</span></div>'
   +'<h2 style="font-size:19px; margin-bottom:12px;">'+esc(les.h)+'</h2>'
   +'<div class="lesson-body">'+les.b+'</div>'
   +'<div class="rowbtns">'+prevBtn+nextBtn+'</div></div>';
  initLessonWidgets();
  if (typeof window !== 'undefined') {
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }
}

function copyCode(btn){
  const pre = btn.nextElementSibling || btn.parentElement.querySelector('pre');
  if(!pre) return;
  const txt = pre.innerText || pre.textContent;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>{
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
    }).catch(()=>{
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
    });
  } else {
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
  }
}

`;

html = html.substring(0, p1) + replacement + html.substring(p2);

if (isCRLF) html = html.replace(/\n/g, '\r\n');

// Test with vm.Script
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  new vm.Script(scriptMatch[1]);
  console.log('Script block 0 verified valid JS!');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully saved index.html');
