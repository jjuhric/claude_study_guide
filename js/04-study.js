/* 04-study.js
   Lessons, handbook, notes, cram sheets
   Part of Claude Cert Quest. Loaded as a classic script: every file
   shares one global scope, in the order listed in index.html. */
"use strict";
/* ================= STUDY GUIDE ================= */
function startLearn(id){ learnList(id); }
function lessonLabel(c,i){
  const les=c.lessons[i];
  if(les.foundation) return "🌱 Start here";
  if(i<=c.domains.length) return "Domain "+i+" of "+c.domains.length;
  return "🚀 Masterclass Deep Dive "+(i-c.domains.length);
}
function learnList(id){
  const c=CERTS.find(x=>x.id===id);
  const read=S.lessonsRead[c.id]||[];
  const lp=lessonProgress(c);
  renderHeader();
  let rows='';
  c.lessons.forEach((les,i)=>{
    const done=!!read[i];
    const isMasterclass=i>c.domains.length;
    const badgeText=done?"✓":(les.foundation?"🌱":isMasterclass?"🚀":i);
    rows+='<div class="lesson-row'+(done?" done":"")+(les.foundation?" found":"")+(isMasterclass?" masterclass-row":"")+'" onclick="lessonView(\''+id+'\','+i+')">'
      +'<div class="lchk">'+badgeText+'</div>'
      +'<div class="ltext"><div class="ltitle">'+esc(les.h)+'</div><div class="lnum">'+lessonLabel(c,i)+'</div></div>'
      +'<div class="larrow">→</div></div>';
  });
  $("app").innerHTML =
   '<button class="back" onclick="certView(\''+id+'\')">← Back to '+c.code+'</button>'
   +'<div class="panel"><h2 style="font-size:18px;">📖 '+c.name+' — Study Guide</h2>'
   +'<div style="font-size:13px; color:var(--muted); margin-top:4px;">Read each domain lesson, then head to Quiz Battle or a Mock Exam to test yourself.</div>'
   +'<div class="studybar"><div class="pbar" style="flex:1;"><div style="width:'+lp.pct+'%; background:'+c.color+'"></div></div><span>'+lp.done+'/'+lp.total+' read</span></div>'
   +'<div class="lesson-list">'+rows+'</div></div>';
}
function lessonView(id,i){
  const c=CERTS.find(x=>x.id===id);
  const les=c.lessons[i];
  renderHeader();
  const prevBtn=i>0?'<button class="btn ghost sm" onclick="lessonView(\''+id+'\','+(i-1)+')">← Prev</button>':'';
  const nextBtn=i<c.lessons.length-1?'<button class="btn sm" onclick="markRead(\''+id+'\','+i+',true)">Mark read & next →</button>':'<button class="btn sm" onclick="markRead(\''+id+'\','+i+',false)">Mark read & finish 🏁</button>';
  $("app").innerHTML =
   '<button class="back" onclick="learnList(\''+id+'\')">← All lessons</button>'
   +'<div class="panel">'
   +'<div class="lesson-tools-bar">'
   +'<div class="audio-player" style="flex-wrap:wrap; gap:6px;">'
   +'<button id="ttsPlayBtn" class="audio-btn" data-cert="'+id+'" data-idx="'+i+'" onclick="ttsPlayLesson(\''+id+'\','+i+')">▶️ Listen</button>'
   +'<select class="audio-btn" onchange="setTtsMode(this.value)" style="padding:4px 6px; font-weight:600;" aria-label="Narration Mode">'
   +'<option value="brief"'+(ttsMode==='brief'?' selected':'')+'>🎙️ High-Yield Summary</option>'
   +'<option value="full"'+(ttsMode==='full'?' selected':'')+'>📖 Full Lesson</option>'
   +'</select>'
   +'<select id="ttsVoiceSelect" class="audio-btn" onchange="setTtsVoice(this.value)" style="padding:4px 6px; max-width:160px;" aria-label="Voice Selection">'
   +'<option value="">🗣️ Natural Voice</option>'
   +'</select>'
   +'<select class="audio-btn" onchange="ttsSetSpeed(this.value)" style="padding:4px 6px;" aria-label="Audio Speed">'
   +'<option value="0.9">0.9x</option><option value="1.0" selected>1.0x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option>'
   +'</select>'
   +'<span id="ttsStatusLabel"></span>'
   +'</div>'
   +'<div style="display:inline-flex; gap:6px;">'
   +'<button id="bmBtn" class="btn ghost sm'+((S.bookmarks||[]).includes(getLessonKey(id,i))?' flagon':'')+'" onclick="toggleBookmark(\''+id+'\','+i+')">'
   +((S.bookmarks||[]).includes(getLessonKey(id,i))?'📌 Bookmarked':'🔖 Bookmark')+'</button>'
   +'<button class="btn ghost sm" onclick="toggleNotesDrawer(\''+id+'\','+i+')">📝 My Note</button>'
   +'</div></div>'
   +'<div id="notesDrawer" class="notes-drawer">'
   +'<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">'
   +'<label style="font-size:12px; font-weight:700; color:var(--coral-dark);">📝 Personal Study Notes (Auto-saved):</label>'
   +'<span id="noteSaveStatus" style="font-size:11px; color:var(--green); font-weight:700;"></span></div>'
   +'<textarea id="noteInput" placeholder="Type key takeaways, mnemonics, or tricky traps..." oninput="saveLessonNote(\''+id+'\','+i+',this.value)">'+esc((S.notes||{})[getLessonKey(id,i)]||'')+'</textarea>'
   +'</div>'
   +'<div class="lesson-hdr"><span class="ltag">'+lessonLabel(c,i)+' · '+c.code+'</span></div>'
   +'<h2 style="font-size:19px; margin-bottom:8px;">'+esc(les.h)+'</h2>'
   +'<div class="lesson-toc">'
   +'<span class="toc-title">⚡ Quick Jump In This Lesson:</span>'
   +'<span class="toc-pill" onclick="document.querySelector(\'.lesson-body\').scrollIntoView({behavior:\'smooth\'})">📌 Overview</span>'
   +'<span class="toc-pill" onclick="(document.querySelector(\'.callout, .code-wrapper, table\')||document.querySelector(\'.lesson-body\')).scrollIntoView({behavior:\'smooth\'})">🏛️ Core Concepts</span>'
   +'<span class="toc-pill" onclick="(document.querySelector(\'.warn, .exambox\')||document.querySelector(\'.takeaways\')).scrollIntoView({behavior:\'smooth\'})">⚠️ Exam Traps</span>'
   +'<span class="toc-pill" onclick="(document.querySelector(\'.takeaways\')||document.querySelector(\'.rowbtns\')).scrollIntoView({behavior:\'smooth\'})">📋 Takeaways</span>'
   +'</div>'
   +'<div class="lesson-body">'+les.b+'</div>'
   +'<div class="rowbtns">'+prevBtn+nextBtn+'</div></div>';
  initLessonWidgets();
  populateVoiceDropdown();
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

/* ================= CRAM SHEETS & LAB TOOLS ================= */

/* ================= READING PROGRESS SCROLL ================= */
/* ================= SMART HUMAN-LIKE AUDIO LESSON NARRATOR ================= */
let ttsSpeed = 1.0;
let ttsMode = 'brief'; // 'brief' (high-yield) or 'full'
let ttsIsPlaying = false;
let ttsQueue = [];
let ttsQueueIdx = 0;
let ttsCurrentVoice = null;
let ttsActiveCert = null;
let ttsActiveIdx = null;

function getAvailableVoices(){
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const all = window.speechSynthesis.getVoices() || [];
  // Filter for English and rank natural/neural voices higher
  const scored = all.filter(v => (v.lang || '').startsWith('en')).map(v => {
    let score = 0;
    const name = v.name || '';
    if (name.includes('Natural') || name.includes('Neural') || name.includes('Online')) score += 15;
    if (name.includes('Google')) score += 10;
    if (name.includes('Premium') || name.includes('Enhanced')) score += 8;
    if (name.includes('Samantha') || name.includes('Daniel') || name.includes('Jenny') || name.includes('Guy') || name.includes('Aria')) score += 6;
    if (v.default) score += 2;
    return { voice: v, score, name: v.name, lang: v.lang };
  }).sort((a, b) => b.score - a.score);
  return scored.map(x => x.voice);
}

function getBestVoice(){
  const voices = getAvailableVoices();
  const savedName = localStorage.getItem('cq_tts_voice');
  if (savedName) {
    const match = voices.find(v => v.name === savedName);
    if (match) return match;
  }
  return voices[0] || null;
}

function populateVoiceDropdown(){
  const sel = document.getElementById('ttsVoiceSelect');
  if (!sel) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    sel.innerHTML = '<option value="">🗣️ Default Voice</option>';
    return;
  }
  const voices = getAvailableVoices();
  if (!voices.length) {
    sel.innerHTML = '<option value="">🗣️ Loading Voices...</option>';
    setTimeout(populateVoiceDropdown, 300);
    return;
  }
  const cur = ttsCurrentVoice || getBestVoice();
  let opts = '';
  voices.slice(0, 15).forEach(v => {
    const isSel = cur && cur.name === v.name;
    const cleanName = v.name
      .replace(/^Microsoft\s+/i, '')
      .replace(/^Google\s+/i, '')
      .replace(/English\s*\([^)]+\)/i, 'EN')
      .replace(/\s*Online\s*\(Natural\)/i, ' (Natural)')
      .replace(/\s*\(United States\)/i, ' (US)')
      .replace(/\s*\(United Kingdom\)/i, ' (UK)')
      .trim();
    opts += '<option value="' + esc(v.name) + '"' + (isSel ? ' selected' : '') + '>🗣️ ' + esc(cleanName) + '</option>';
  });
  sel.innerHTML = opts;
}

function setTtsVoice(voiceName){
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices() || [];
  const found = voices.find(v => v.name === voiceName);
  if (found) {
    ttsCurrentVoice = found;
    try { localStorage.setItem('cq_tts_voice', found.name); } catch(e){}
    toast('Voice: ' + found.name.split(' ')[0]);
    if (ttsIsPlaying) {
      const id = ttsActiveCert;
      const idx = ttsActiveIdx;
      ttsStop();
      ttsPlayLesson(id, idx);
    }
  }
}

function setTtsMode(mode){
  ttsMode = mode;
  toast(mode === 'brief' ? '🎙️ Mode: High-Yield Brief' : '📖 Mode: Full Lesson');
  if (ttsIsPlaying) {
    const id = ttsActiveCert;
    const idx = ttsActiveIdx;
    ttsStop();
    ttsPlayLesson(id, idx);
  }
}

/* Builds a structured, conversational, high-yield audio brief */
function buildHighYieldAudioScript(les, mode){
  if (typeof document === 'undefined') return les.h;
  const div = document.createElement('div');
  div.innerHTML = les.b;

  if (mode === 'full') {
    div.querySelectorAll('pre, code, script, style, .widget-box, .sim-terminal, .code-copy-btn').forEach(el => el.remove());
    return les.h + '. ' + (div.innerText || div.textContent || '');
  }

  // --- High-Yield Executive Summary Mode ---
  let script = 'Lesson briefing: ' + les.h + '. ';

  // 1. Core Overview (Key opening insights)
  const paragraphs = Array.from(div.querySelectorAll('p')).slice(0, 3);
  paragraphs.forEach(p => {
    const text = (p.innerText || '').trim();
    if (text && !text.startsWith('Click') && !text.startsWith('Adjust') && text.length > 20) {
      script += text + ' ';
    }
  });

  // 2. High-Yield Callouts
  const callouts = div.querySelectorAll('.callout');
  if (callouts.length > 0) {
    script += ' Here is the core architecture principle: ';
    callouts.forEach(c => {
      const clone = c.cloneNode(true);
      clone.querySelectorAll('.lbl, button').forEach(el => el.remove());
      script += (clone.innerText || '').trim() + '. ';
    });
  }

  // 3. Exam Traps & Gotchas
  const traps = div.querySelectorAll('.warn, .exambox, .scenario-box');
  if (traps.length > 0) {
    script += ' Watch out for these high-yield exam traps: ';
    traps.forEach((t, idx) => {
      const clone = t.cloneNode(true);
      clone.querySelectorAll('.lbl, button').forEach(el => el.remove());
      const cleanTrap = (clone.innerText || '').trim();
      if (cleanTrap) {
        script += 'Trap ' + (idx + 1) + ': ' + cleanTrap + '. ';
      }
    });
  }

  // 4. Key Takeaways
  const takeaways = div.querySelector('.takeaways');
  if (takeaways) {
    script += ' Finally, your key takeaways for test day: ';
    const items = takeaways.querySelectorAll('li');
    items.forEach((item, idx) => {
      script += 'Rule ' + (idx + 1) + ': ' + (item.innerText || '').trim() + '. ';
    });
  }

  script += ' That concludes your high-yield audio brief. Head to Quiz Battle to test your recall.';
  return script;
}

/* Splits script into natural conversational sentences */
function splitIntoSentences(text){
  const clean = text.replace(/\s+/g, ' ').trim();
  const raw = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  return raw.map(s => s.trim()).filter(s => s.length > 0);
}

function ttsPlayLesson(id, i){
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    toast('Speech synthesis not supported in this browser');
    return;
  }
  const c = CERTS.find(x => x.id === id);
  if (!c || !c.lessons || !c.lessons[i]) return;
  const les = c.lessons[i];
  ttsActiveCert = id;
  ttsActiveIdx = i;

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    ttsIsPlaying = true;
    updateAudioControlsUI(true);
    return;
  }

  window.speechSynthesis.cancel();
  const script = buildHighYieldAudioScript(les, ttsMode);
  ttsQueue = splitIntoSentences(script);
  ttsQueueIdx = 0;
  ttsIsPlaying = true;
  updateAudioControlsUI(true);
  toast(ttsMode === 'brief' ? '🎙️ Playing High-Yield Audio Brief' : '📖 Reading Full Lesson');
  ttsSpeakNextSentence();
}

function ttsSpeakNextSentence(){
  if (!ttsIsPlaying || ttsQueueIdx >= ttsQueue.length) {
    ttsIsPlaying = false;
    updateAudioControlsUI(false);
    return;
  }

  const sentence = ttsQueue[ttsQueueIdx];
  const utt = new SpeechSynthesisUtterance(sentence);
  utt.rate = ttsSpeed;
  
  if (!ttsCurrentVoice) ttsCurrentVoice = getBestVoice();
  if (ttsCurrentVoice) utt.voice = ttsCurrentVoice;

  utt.onend = () => {
    ttsQueueIdx++;
    // short natural pause between sentences
    setTimeout(() => {
      if (ttsIsPlaying) ttsSpeakNextSentence();
    }, 40);
  };

  utt.onerror = () => {
    ttsQueueIdx++;
    if (ttsIsPlaying) ttsSpeakNextSentence();
  };

  window.speechSynthesis.speak(utt);
}

function ttsPause(){
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
    ttsIsPlaying = false;
    updateAudioControlsUI(false);
    toast('Audio paused');
  }
}

function ttsStop(){
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    ttsIsPlaying = false;
    ttsQueue = [];
    ttsQueueIdx = 0;
    updateAudioControlsUI(false);
  }
}

function ttsSetSpeed(speed){
  ttsSpeed = parseFloat(speed) || 1.0;
  toast('Speed: ' + ttsSpeed + 'x');
}

function updateAudioControlsUI(playing){
  const playBtn = document.getElementById('ttsPlayBtn');
  const statusEl = document.getElementById('ttsStatusLabel');
  if (playBtn) {
    if (playing) {
      playBtn.classList.add('playing');
      playBtn.innerHTML = '⏸️ Pause';
      playBtn.onclick = () => ttsPause();
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--green); font-size:11px; font-weight:700;">● Narrating (' + (ttsMode === 'brief' ? 'High-Yield' : 'Full') + ')...</span>';
    } else {
      playBtn.classList.remove('playing');
      playBtn.innerHTML = '▶️ Listen';
      playBtn.onclick = () => {
        const id = playBtn.getAttribute('data-cert');
        const idx = parseInt(playBtn.getAttribute('data-idx'), 10);
        ttsPlayLesson(id, idx);
      };
      if (statusEl) statusEl.innerHTML = '';
    }
  }
}

/* ================= BOOKMARKS & PERSONAL STUDY NOTES ================= */
function getLessonKey(id, i){ return id + "_l_" + i; }

function toggleBookmark(id, i){
  const key = getLessonKey(id, i);
  S.bookmarks = S.bookmarks || [];
  const at = S.bookmarks.indexOf(key);
  if (at >= 0) {
    S.bookmarks.splice(at, 1);
    toast("Bookmark removed");
  } else {
    S.bookmarks.push(key);
    toast("📌 Lesson bookmarked!");
  }
  save();
  const bmBtn = document.getElementById("bmBtn");
  if (bmBtn) {
    const isBm = S.bookmarks.includes(key);
    bmBtn.innerHTML = isBm ? "📌 Bookmarked" : "🔖 Bookmark";
    if (isBm) bmBtn.classList.add("flagon"); else bmBtn.classList.remove("flagon");
  }
}

function toggleNotesDrawer(id, i){
  const drawer = document.getElementById("notesDrawer");
  if (drawer) {
    drawer.classList.toggle("open");
    if (drawer.classList.contains("open")) {
      const ta = document.getElementById("noteInput");
      if (ta) ta.focus();
    }
  }
}

function saveLessonNote(id, i, txt){
  const key = getLessonKey(id, i);
  S.notes = S.notes || {};
  if (!txt || !txt.trim()) {
    delete S.notes[key];
  } else {
    S.notes[key] = txt;
  }
  save();
  const noteStatus = document.getElementById("noteSaveStatus");
  if (noteStatus) {
    noteStatus.textContent = "Saved to local storage ✓";
    setTimeout(() => { if (noteStatus) noteStatus.textContent = ""; }, 2000);
  }
}

/* ================= DEDICATED BOOKMARKS & NOTES HUB ================= */
function bookmarksView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  CERTS.forEach(c => { if (!c._loaded) loadCert(c); });
  
  const notes = S.notes || {};
  const bms = S.bookmarks || [];
  const allKeys = Array.from(new Set([...Object.keys(notes), ...bms]));
  
  if (!allKeys.length) {
    $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
      + '<div class="panel center"><div style="font-size:38px;">📌</div>'
      + '<h2 style="font-size:20px; margin-top:8px;">No Study Notes or Bookmarks Yet</h2>'
      + '<p class="subtext" style="margin-top:6px;">While reading any study guide lesson, click <b>🔖 Bookmark</b> or <b>📝 Study Note</b> to save takeaways here for rapid pre-exam review.</p>'
      + '<div class="rowbtns" style="justify-content:center; margin-top:16px;">'
      + '<button class="btn" onclick="learnList(\'ccao\')">📖 Open Associate Lessons</button>'
      + '<button class="btn ghost" onclick="home()">Back to Home</button>'
      + '</div></div>';
    return;
  }
  
  let list = '';
  allKeys.forEach(k => {
    const parts = k.split("_l_");
    const certId = parts[0];
    const lidx = parseInt(parts[1], 10);
    const c = CERTS.find(x => x.id === certId);
    if (!c) return;
    const les = c.lessons && c.lessons[lidx];
    const title = les ? les.h : ('Lesson ' + (lidx + 1));
    const noteTxt = notes[k] || '';
    const isBm = bms.includes(k);
    
    list += '<div class="panel" style="margin-bottom:14px; border:1px solid var(--border);">'
      + '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">'
      + '<div><span class="ltag" style="background:'+c.color+'; color:#fff;">' + c.code + ' · Lesson ' + (lidx + 1) + '</span>'
      + '<h3 style="font-size:16px; margin-top:6px;">' + esc(title) + '</h3></div>'
      + '<div style="display:flex; gap:6px;">'
      + '<button class="btn sm" onclick="lessonView(\'' + certId + '\',' + lidx + ')">Open Lesson →</button>'
      + '<button class="btn ghost sm" onclick="removeBookmark(\'' + k + '\')" title="Remove bookmark">🗑️</button>'
      + '</div>'
      + '</div>'
      + (isBm ? '<div style="font-size:11.5px; color:var(--coral); font-weight:700; margin-top:6px;">📌 Bookmarked for Review</div>' : '')
      + (noteTxt ? '<div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px; margin-top:10px; font-size:13px; line-height:1.5;"><b>📝 My Study Takeaways:</b><br>' + esc(noteTxt).replace(/\n/g, '<br>') + '</div>' : '')
      + '</div>';
  });
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:6px;">'
    + '<div><h2 style="font-size:20px;">📌 My Study Notes & Bookmarks (' + allKeys.length + ')</h2><p class="subtext">All bookmarked sections and personal lesson notes across all 4 certification tracks.</p></div>'
    + '<button class="btn ghost sm" onclick="window.print()">🖨️ Print Notes</button>'
    + '</div>'
    + '</div>'
    + list;
}

function removeBookmark(key){
  if (confirm("Remove this bookmark?")) {
    S.bookmarks = (S.bookmarks || []).filter(k => k !== key);
    if (S.notes && S.notes[key]) delete S.notes[key];
    save();
    toast("Bookmark removed");
    bookmarksView();
  }
}
function notesView(){ bookmarksView(); }

/* ================= INTERACTIVE DECISION TREES ================= */
function renderModelDecisionTree(){
  return `
    <div class="widget-box" id="modelDecisionTreeWidget">
      <h5>🌳 Interactive Model Selection Decision Tree</h5>
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">Answer 3 quick questions to determine the optimal Anthropic model and API cost strategy:</p>
      
      <div class="tree-step">
        <label><b>1. Task Primary Constraint:</b></label>
        <div id="treeQ1">
          <span class="tree-opt active" onclick="setTreeStep(1, 'speed', this)">⚡ Sub-second Latency / High Volume Classification</span>
          <span class="tree-opt" onclick="setTreeStep(1, 'code', this)">💻 Complex Coding / Vision / Multimodal Reasoning</span>
          <span class="tree-opt" onclick="setTreeStep(1, 'deep', this)">🧠 Maximum Depth Nuance & Synthesis</span>
        </div>
      </div>
      
      <div class="tree-step">
        <label><b>2. Workload Execution Timing:</b></label>
        <div id="treeQ2">
          <span class="tree-opt active" onclick="setTreeStep(2, 'sync', this)">⚡ Real-Time Synchronous (Live Chat / User Waiting)</span>
          <span class="tree-opt" onclick="setTreeStep(2, 'batch', this)">📦 Asynchronous Offline Batch (Within 24h)</span>
        </div>
      </div>
      
      <div class="tree-step">
        <label><b>3. Repeated Static Context:</b></label>
        <div id="treeQ3">
          <span class="tree-opt active" onclick="setTreeStep(3, 'caching', this)">🔄 Yes (Shared System Prompt, FAQ, or Docs above the model cache floor — 512 Opus 5, 1,024 Sonnet 5, 4,096 Haiku 4.5)</span>
          <span class="tree-opt" onclick="setTreeStep(3, 'nocache', this)">❌ No (Short or Fully Unique Prompts)</span>
        </div>
      </div>
      
      <div class="tree-result" id="treeModelResult">
        <b>Recommended Architecture:</b> <span style="color:var(--coral-dark); font-weight:700;">Claude Haiku 4.5 + Prompt Caching</span><br>
        <span style="font-size:12.5px; line-height:1.5; color:var(--ink);">
          • <b>Model:</b> Claude Haiku 4.5 ($1.00 / $5.00 per MTok)<br>
          • <b>Optimization:</b> Prompt caching bills reads at 0.1x input — $0.10/MTok on Haiku 4.5, a 90% saving on the cached portion.<br>
          • <b>Key Exam Rationale:</b> Lightweight classification, routing, and high-throughput tagging should always default to Haiku.
        </span>
      </div>
    </div>
  `;
}

let treeState = { q1: 'speed', q2: 'sync', q3: 'caching' };
function setTreeStep(step, val, el){
  const parent = el.parentElement;
  parent.querySelectorAll('.tree-opt').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if(step === 1) treeState.q1 = val;
  if(step === 2) treeState.q2 = val;
  if(step === 3) treeState.q3 = val;
  updateTreeModelResult();
}

function updateTreeModelResult(){
  const res = document.getElementById("treeModelResult");
  if(!res) return;
  
  let model = treeState.q1 === 'speed' ? 'Claude Haiku 4.5' : treeState.q1 === 'code' ? 'Claude Sonnet 5' : 'Claude Opus 5';
  let pricing = treeState.q1 === 'speed' ? '$1.00 / $5.00' : treeState.q1 === 'code' ? '$3.00 / $15.00' : '$5.00 / $25.00';
  let batchStr = treeState.q2 === 'batch' ? ' + Batches API (50% overall discount)' : '';
  let cacheStr = treeState.q3 === 'caching' ? ' + Prompt Caching (~90% input discount)' : '';
  
  let rationale = treeState.q1 === 'speed'
    ? 'High-throughput intent routing and lightweight extraction should default to Haiku for sub-second response times.'
    : treeState.q1 === 'code'
    ? 'Sonnet is the premier architectural choice for software engineering, tool calling, and multimodal vision workflows.'
    : 'Opus provides the highest ceiling on complex multi-step reasoning, philosophical analysis, and nuanced synthesis.';
    
  res.innerHTML = '<b>Recommended Architecture:</b> <span style="color:var(--coral-dark); font-weight:700;">' + model + batchStr + cacheStr + '</span><br>'
    + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
    + '• <b>Base Pricing:</b> ' + pricing + ' per MTok<br>'
    + (treeState.q2 === 'batch' ? '• <b>Batches API:</b> 50% discount across input and output tokens.<br>' : '')
    + (treeState.q3 === 'caching' ? '• <b>Prompt Caching:</b> reads bill at 0.1x input — $0.10, $0.30 or $0.50/MTok respectively.<br>' : '')
    + '• <b>Exam Rule:</b> ' + rationale
    + '</span>';
}

/* ================= INTERACTIVE ARCHITECTURAL TOPOLOGY TREE ================= */
function renderArchitectureDecisionTree(){
  return `
    <div class="widget-box" id="archDecisionTreeWidget">
      <h5>🏛️ Interactive Workflow & Agent Topology Selector</h5>
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">Choose the core characteristics of your workflow:</p>
      
      <div class="tree-step">
        <label><b>1. Task Structure:</b></label>
        <div id="archQ1">
          <span class="tree-opt active" onclick="setArchStep(1, 'seq', this)">Fixed Sequential Steps</span>
          <span class="tree-opt" onclick="setArchStep(1, 'route', this)">Distinct Category Branching</span>
          <span class="tree-opt" onclick="setArchStep(1, 'par', this)">Independent Parallel Subtasks</span>
          <span class="tree-opt" onclick="setArchStep(1, 'eval', this)">Iterative Quality Refinement</span>
          <span class="tree-opt" onclick="setArchStep(1, 'agent', this)">Unknown Multi-Step Tool Exploration</span>
        </div>
      </div>
      
      <div class="tree-result" id="treeArchResult">
        <b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Prompt Chaining / Sequential Pipeline</span><br>
        <span style="font-size:12.5px; line-height:1.5; color:var(--ink);">
          • <b>Implementation:</b> Deterministic state machine where step N passes validated structured output to step N+1.<br>
          • <b>When to use:</b> Document extraction followed by policy check followed by notification drafting.<br>
          • <b>Exam Takeaway:</b> Never use an autonomous agent loop where a predictable sequential pipeline is sufficient.
        </span>
      </div>
    </div>
  `;
}

function setArchStep(step, val, el){
  const parent = el.parentElement;
  parent.querySelectorAll('.tree-opt').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const res = document.getElementById("treeArchResult");
  if(!res) return;
  
  if(val === 'seq'){
    res.innerHTML = '<b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Prompt Chaining / Sequential Pipeline</span><br>'
      + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
      + '• <b>Implementation:</b> Deterministic state machine where step N passes validated structured output to step N+1.<br>'
      + '• <b>Exam Rule:</b> Always prefer deterministic pipelines for known business logic to minimize latency and token spend.'
      + '</span>';
  } else if(val === 'route'){
    res.innerHTML = '<b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Router Pattern (Classifier + Specialists)</span><br>'
      + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
      + '• <b>Implementation:</b> Haiku classifies intent -> dispatches to targeted specialist prompt with dedicated toolsets.<br>'
      + '• <b>Exam Rule:</b> Eliminates tool and prompt clutter by keeping specialist prompts small and modular.'
      + '</span>';
  } else if(val === 'par'){
    res.innerHTML = '<b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Orchestrator-Workers (Parallel Fan-Out)</span><br>'
      + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
      + '• <b>Implementation:</b> Central orchestrator decomposes task into N independent worker prompts running in parallel via Promise.all().<br>'
      + '• <b>Exam Rule:</b> Cuts wall-clock latency from sum(t) to max(t).'
      + '</span>';
  } else if(val === 'eval'){
    res.innerHTML = '<b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Evaluator-Optimizer Loop</span><br>'
      + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
      + '• <b>Implementation:</b> Optimizer generates draft -> Evaluator grades against rubric -> Loops until quality threshold or iteration cap.<br>'
      + '• <b>Exam Rule:</b> Enforce hard iteration bounds (max 3-5 passes) to avoid infinite loops.'
      + '</span>';
  } else {
    res.innerHTML = '<b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Autonomous Agent (Model Context Protocol / Tool Loop)</span><br>'
      + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
      + '• <b>Implementation:</b> Model iteratively chooses tools, inspects outputs, and reasons toward an open goal.<br>'
      + '• <b>Exam Rule:</b> Requires iteration caps, token spend ceilings, and human-in-the-loop gates for destructive actions.'
      + '</span>';
  }
}

/* ================= INTERACTIVE RAG CHUNKING VISUALIZER ================= */
function renderRagChunkingVisualizer(){
  return `
    <div class="widget-box" id="ragChunkVisualizer">
      <h5>🔬 Interactive RAG Chunking & Overlap Visualizer</h5>
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">Adjust Chunk Size and Overlap to see how text is segmented and contextual headers are injected:</p>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div>
          <label><b>Chunk Size (characters):</b> <span id="chunkSizeVal">300</span></label>
          <input type="range" id="chunkSizeRange" min="150" max="600" step="50" value="300" oninput="updateRagChunks()">
        </div>
        <div>
          <label><b>Chunk Overlap (%):</b> <span id="chunkOverlapVal">20%</span></label>
          <input type="range" id="chunkOverlapRange" min="0" max="40" step="5" value="20" oninput="updateRagChunks()">
        </div>
      </div>
      
      <div id="ragChunkResults"></div>
    </div>
  `;
}

function updateRagChunks(){
  const szEl = document.getElementById("chunkSizeRange");
  const ovEl = document.getElementById("chunkOverlapRange");
  if(!szEl || !ovEl) return;
  const sz = parseInt(szEl.value, 10);
  const ovPct = parseInt(ovEl.value, 10);
  document.getElementById("chunkSizeVal").textContent = sz;
  document.getElementById("chunkOverlapVal").textContent = ovPct + "%";
  
  const sampleText = "Anthropic's Model Context Protocol (MCP) provides a standardized open architecture for connecting LLMs to external data and tools. By adopting JSON-RPC 2.0 primitives, MCP establishes clean client-server boundaries. Tools provide executable functions, resources deliver structured data, and prompts furnish parameterized templates. When architecting RAG systems, preserving contextual headers and 10% to 20% chunk overlap prevents information fragmentation across chunk splits.";
  
  const ovChars = Math.round(sz * (ovPct / 100));
  const step = Math.max(50, sz - ovChars);
  
  let chunks = [];
  let pos = 0;
  let idx = 0;
  while(pos < sampleText.length && chunks.length < 5){
    const end = Math.min(sampleText.length, pos + sz);
    const body = sampleText.slice(pos, end);
    const prevOverlap = pos > 0 ? sampleText.slice(pos, pos + ovChars) : "";
    const core = pos > 0 ? sampleText.slice(pos + ovChars) : body;
    chunks.push({ idx: idx++, pos, end, prevOverlap, core });
    if(end >= sampleText.length) break;
    pos += step;
  }
  
  let html = '<div style="margin-top:10px;">';
  chunks.forEach(c => {
    html += '<div class="rag-chunk">'
      + '<div style="font-size:11px; color:var(--coral-dark); font-weight:700; margin-bottom:4px;">[Document: MCP Architecture > Section: Overview] · Chunk ' + (c.idx+1) + ' (' + c.pos + '..' + c.end + ')</div>'
      + (c.prevOverlap ? '<span class="rag-overlap" title="Overlapped with previous chunk">' + esc(c.prevOverlap) + '</span>' : '')
      + '<span>' + esc(c.core) + '</span>'
      + '</div>';
  });
  html += '</div>';
  const res = document.getElementById("ragChunkResults");
  if(res) res.innerHTML = html;
}

/* ================= 1-CLICK PRINTABLE FULL STUDY GUIDE HANDBOOK ================= */
function fullHandbookView(id){
  const c = CERTS.find(x => x.id === id);
  if(!c || !c.lessons) return;
  renderHeader();
  
  let lessonsHtml = '';
  c.lessons.forEach((les, idx) => {
    lessonsHtml += '<div class="handbook-page" style="margin-bottom:36px; padding-bottom:24px; border-bottom:2px dashed var(--border);">'
      + '<span class="ltag">' + lessonLabel(c, idx) + ' · ' + c.code + '</span>'
      + '<h2 style="font-size:22px; margin:8px 0 16px;">' + esc(les.h) + '</h2>'
      + '<div class="lesson-body">' + les.b + '</div>'
      + '</div>';
  });
  
  $("app").innerHTML = '<button class="back" onclick="learnList(\'' + id + '\')">← Back to Study Guide</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px;">'
    + '<div><h1 style="font-size:22px;">📚 ' + c.name + ' (' + c.code + ')</h1>'
    + '<p class="subtext">Full Printable Study Guide Handbook · All ' + c.lessons.length + ' Lessons</p></div>'
    + '<div class="rowbtns"><button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>'
    + '<button class="btn ghost" onclick="cramSheetView(\'' + id + '\')">📋 Cram Sheet</button></div>'
    + '</div>'
    + '<div class="handbook-content">' + lessonsHtml + '</div>'
    + '<div class="center" style="margin-top:20px;"><button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button></div>'
    + '</div>';
    
  initLessonWidgets();
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
}

const CRAM_DATA = {
  ccao: {
    name: "Claude Certified Associate (CCAO-F)",
    code: "CCAO-F",
    color: "var(--coral)",
    summary: "High-yield summary covering prompt architecture, model selection, verification matrices, and enterprise governance.",
    cards: [
      {
        title: "🎯 1. Core Prompting Principles (C-A-F-T)",
        items: [
          "<b>Prompt as Interface Specification:</b> State Context, Audience, Format, and Task. Drop any one and the model fills the gap with an average guess.",
          "<b>Role Prompting:</b> Frames tone, register, and field conventions (e.g. <i>'You are a senior auditor'</i>); does <b>not</b> unlock hidden capabilities or guarantee factuality.",
          "<b>Positive Framing vs Negative Constraints:</b> Replace weak negatives (<i>'Do not use jargon'</i>) with verifiable positive instructions (<i>'Explain using everyday analogies for an 8th grader'</i>).",
          "<b>Few-Shot Scaffolding:</b> Providing 1-3 worked examples inside <code>&lt;examples&gt;</code> is the highest-leverage technique for pinning down output format across tricky edge cases.",
          "<b>Delimiters:</b> Always isolate source materials with XML tags (<code>&lt;document&gt;</code>, <code>&lt;instructions&gt;</code>) to prevent instruction-data confusion."
        ]
      },
      {
        title: "🔢 2. Formulas, Numbers & Exact Constants",
        items: [
          "<b>Tokenization Math:</b> 100 English words ≈ 130 tokens; 1KB of raw JSON ≈ 250-350 tokens (~0.75 words per token).",
          "<b>Vision Token Formula:</b> <code>Tokens = (Width × Height) / 750</code>. Max dimension scale: 1568px.",
          "<b>Context Window:</b> 1M tokens on current Opus and Sonnet models; 200,000 on Haiku 4.5.",
          "<b>Pricing Tiers:</b> Haiku ($1.00/$5.00) · Sonnet ($3.00/$15.00) · Opus ($5.00/$25.00) per million tokens.",
          "<b>Prompt Caching Minimums:</b> 512 on Opus 5; 1,024 on Opus 4.8 and Sonnet 5; 4,096 on Haiku 4.5. 5-minute TTL refreshed on cache hit. <b>~90% discount</b> on cached input reads."
        ]
      },
      {
        title: "⚠️ 3. Top 10 Associate Exam Distractor Traps",
        items: [
          "<b>Fluency ≠ Factuality:</b> Confident, fluent presentation carries ZERO information about factual correctness. Never trust citations without verifying primary sources.",
          "<b>Disclaimers Don't Transfer Liability:</b> Adding <i>'Generated by AI'</i> does not make unverified statistics safe to publish in regulated domains.",
          "<b>Model Escalation Traps:</b> Escalate model tiers based on <b>observed reasoning errors</b> on your eval dataset — never on prompt length, document size, or stakeholder seniority.",
          "<b>Self-Grading / Round-Tripping Trap:</b> Asking the model <i>'Are you sure?'</i> or feeding its answer back to grade itself provides zero independent verification.",
          "<b>Contradictory Instructions:</b> Prompts asking for <i>'thorough but brief'</i> force an internal coin flip.",
          "<b>Retrying Without Modifying:</b> If output was generic, retrying the exact prompt produces another generic reply. Modify the prompt specification."
        ]
      },
      {
        title: "⚖️ 4. Model Selection & Sampling Parameters",
        items: [
          "<b>Claude Haiku 4.5:</b> Fast, economical tier. Ideal for high-volume routing, classification, extraction, and simple RAG summaries.",
          "<b>Claude Sonnet 5:</b> Balanced enterprise default. Best for coding, tool use, multimodal vision, and complex multi-step reasoning.",
          "<b>Claude Opus 5:</b> Maximum capability tier. Deep research, multi-day novel problem analysis, and high-consequence compliance audit.",
          "<b>Temperature:</b> <code>0.0</code> for deterministic code, math, and JSON extraction; <code>0.7-1.0</code> for creative ideation. Adjust Temperature OR Top-P, never both simultaneously.",
          "<b>Current Information:</b> LLM training data has a fixed cutoff. Current real-time data requires a web search tool or database connection, not a larger model tier."
        ]
      },
      {
        title: "🛡️ 5. AI Governance, Risk & Policy Compliance",
        items: [
          "<b>Zero Data Retention (ZDR):</b> Commercial API inputs and outputs are never stored on persistent disk after processing and are <b>never used to train future Anthropic models</b>.",
          "<b>Anthropic RSP Tiers:</b> ASL-1 (Basic LLMs) → ASL-2 (current frontier models) → ASL-3 (Autonomous cyber/CBRN containment) → ASL-4 (Nation-state level risk).",
          "<b>Scrutiny Scaling:</b> External, contractual, financial, and regulatory outputs require 100% human-in-the-loop audit.",
          "<b>Refusal Handling:</b> A safety refusal is signal about the request. Adjust the prompt to clarify legitimate business intent or escalate through official channels; do not spam jailbreaks.",
          "<b>Regulated PII/PHI:</b> Mask sensitive identifiers (SSN, medical records) on the client side before sending API payloads; execute formal enterprise BAAs for HIPAA."
        ]
      },
      {
        title: "📊 6. Workflow Integration & Measurement",
        items: [
          "<b>First Automation Candidates:</b> Start with frequent, low-risk, easily verified steps (e.g. drafting summaries). Avoid business-critical or poorly understood processes.",
          "<b>Human Accountability Boundary:</b> Drafting is assistive; sending is a commitment. Irreversible actions, contract approvals, and employee evaluations stay with humans.",
          "<b>Output Formatting:</b> Shape model outputs directly into downstream formats (e.g. CSV columns or JSON fields) to eliminate manual re-keying friction.",
          "<b>Proving Success:</b> Measure cycle time and rework rates <b>with quality held constant</b> against the legacy baseline. Perceived speed is not quantitative evidence."
        ]
      },
      {
        title: "🧠 7. High-Yield Associate Mnemonics",
        items: [
          "<b>C-A-F-T:</b> Context, Audience, Format, Task — the 4 pillars of prompt specification.",
          "<b>L-I-M:</b> Lost in the Middle — place reference docs first, place crucial task instructions last.",
          "<b>Z-D-R:</b> Zero Data Retention — contractual guarantee that commercial API calls are never trained on.",
          "<b>R-S-P:</b> Responsible Scaling Policy — Anthropic framework defining safety levels ASL-1 to ASL-4."
        ]
      },
      {
        title: "⏱️ 8. 60-Second Last-Minute Exam Review",
        items: [
          "1. 100 words ≈ 130 tokens; Vision = (W × H) / 750.",
          "2. Prompt caching bills reads at 0.1x input, a 90% saving (5-min TTL; minimum prefix 512 Opus 5 / 1,024 Sonnet 5 / 4,096 Haiku 4.5 — not ordered by tier).",
          "3. Batches API saves flat 50% for asynchronous 24-hr batch jobs.",
          "4. Role prompts set tone and vocabulary, NOT capability or factuality.",
          "5. Fluency carries 0% correlation with truthfulness.",
          "6. Commercial API data is NEVER used for model training under ZDR.",
          "7. Escalate model tiers ONLY on documented reasoning errors on your eval dataset.",
          "8. Always replace negative constraints with positive, verifiable rules.",
          "9. Temperature 0.0 for deterministic JSON/math; 1.0 for creative brainstorming.",
          "10. Disclaimers do not remove legal responsibility for unverified facts."
        ]
      }
    ]
  },
  ccdv: {
    name: "Claude Certified Developer (CCDV-F)",
    code: "CCDV-F",
    color: "var(--blue)",
    summary: "High-yield developer cheat sheet covering API mechanics, stop reasons, tool use loops, MCP protocol, and Claude Code.",
    cards: [
      {
        title: "🔑 1. API Mechanics & Request Payloads",
        items: [
          "<b>Mandatory Request Keys:</b> <code>model</code>, <code>max_tokens</code>, and <code>messages</code> array.",
          "<b>Optional Request Keys:</b> <code>system</code>, <code>tools</code>, <code>tool_choice</code>, <code>stop_sequences</code>, <code>stream</code>, <code>metadata</code>.",
          "<b>Stateless Architecture:</b> Conversation history (user + assistant turns) must be resent on every API call.",
          "<b>SSE Streaming:</b> Event lifecycle: <code>message_start</code> → <code>content_block_start</code> → <code>content_block_delta</code> → <code>content_block_stop</code> → <code>message_delta</code> → <code>message_stop</code>.",
          "<b>Assistant Prefilling:</b> Seeding assistant turn with raw JSON <code>{</code> returns HTTP 400 on latest models. Use structured outputs or tools."
        ]
      },
      {
        title: "🚦 2. stop_reason Control Flow State Machine",
        items: [
          "<code>end_turn</code>: Natural model completion. Response in <code>content</code> is complete and safe to deliver.",
          "<code>max_tokens</code>: Truncated generation. Response hit token cap. Increase <code>max_tokens</code> or pass back to continue; do not present as complete.",
          "<code>tool_use</code>: Model requested tool execution. Execute function locally and return <code>tool_result</code> turn with matching <code>tool_use_id</code>.",
          "<code>stop_sequence</code>: A string from your <code>stop_sequences</code> was generated. The matched sequence is reported in <code>stop_sequence</code> and is not included in <code>content</code>.",
          "<code>refusal</code>: Safety refusal. Terminal state — do <b>not</b> retry the identical request, and do not rephrase it to slip past the refusal. This is the only stop reason that populates <code>stop_details</code>; it is <code>null</code> for every other value, so guard before reading it.",
          "<code>pause_turn</code>: A server-side tool loop hit its iteration limit. Re-send the assistant turn verbatim to resume — appending a &quot;Continue.&quot; user message instead corrupts the loop state.",
          "<code>model_context_window_exceeded</code>: The context window was exhausted, which is a different failure from <code>max_tokens</code> and a different fix: compact the history rather than raising the output cap."
        ]
      },
      {
        title: "⚡ 3. Prompt Caching & Batches API Specifications",
        items: [
          "<b>Minimum Cache Breakpoint:</b> 512 tokens (Opus 5), 1,024 (Sonnet 5 and Opus 4.8) and 4,096 (Haiku 4.5). The floors are not ordered by tier — the cheapest model has the highest one. A sub-minimum prefix fails silently: cache_control is ignored, no error is raised, and the only symptom is cache_read_input_tokens staying at 0.",
          "<b>Cache Pricing & TTL:</b> 5-minute TTL (refreshes on hit). Cache write: 1.25x base input. Cache read: <b>0.15x base input (~90% discount)</b>.",
          "<b>Cache Placement:</b> Attach <code>'cache_control': {'type': 'ephemeral'}</code> to system prompt, tool definitions, or large reference documents. Max 4 breakpoints.",
          "<b>Batches API:</b> <code>POST /v1/messages/batches</code>. Max 10,000 requests, 32MB payload, 24-hr SLA, <b>flat 50% discount</b> on input and output tokens."
        ]
      },
      {
        title: "🛠️ 4. Model Context Protocol (MCP) Wire Specs",
        items: [
          "<b>Protocol:</b> Standardizes LLM integrations over <b>JSON-RPC 2.0</b>.",
          "<b>4 Primitives:</b> <b>Tools</b> (executable functions), <b>Resources</b> (read-only URI data), <b>Prompts</b> (reusable templates), <b>Roots</b> (workspace directories).",
          "<b>Error Propagation:</b> Tool failures must return <code>isError: true</code> inside the tool result payload; never crash the JSON-RPC transport.",
          "<b>Transports:</b> <code>stdio</code> for local processes and IDEs; <code>Server-Sent Events (SSE) over HTTP</code> for remote microservices.",
          "<b>Client Sampling:</b> MCP servers can invoke <code>sampling/createMessage</code> to request LLM generations through the host client."
        ]
      },
      {
        title: "🤖 5. Claude Code CLI & Headless CI/CD",
        items: [
          "<b>CLAUDE.md Specification:</b> Placed in repo root with build commands, test runners, code conventions, and architecture boundaries.",
          "<b>Headless CI/CD Execution:</b> Run non-interactively in automated pipelines with <code>claude -p 'prompt'</code> (print mode).",
          "<b>Ripgrep & Symbol Navigation:</b> Claude Code uses dynamic ripgrep search and AST symbol graphs to read only relevant file slices.",
          "<b>Automated Test-Driven Loop:</b> Claude Code reproduces test failures, applies unified diff edits, and re-runs test suites to self-verify."
        ]
      },
      {
        title: "🧰 6. Tool Design, Structured Output & Idempotency",
        items: [
          "<b>tool_choice Modes:</b> <code>'auto'</code> (default), <code>'any'</code> (forces model to pick a tool), <code>{'type': 'tool', 'name': '...'}</code> (forces specific tool).",
          "<b>Idempotency Keys:</b> Mutation tools (payments, database writes) must accept idempotency UUIDs to protect against duplicate execution during retries.",
          "<b>Parallel Tool Dispatch:</b> Execute multiple concurrent <code>tool_use</code> calls using <code>Promise.all()</code>, returning all results in a single return turn.",
          "<b>Schema Validation:</b> Use Zod or Pydantic. If validation fails, return structured errors via <code>is_error: true</code> for automated self-correction."
        ]
      },
      {
        title: "🧠 7. High-Yield Developer Mnemonics",
        items: [
          "<b>T-R-P-R:</b> Tools, Resources, Prompts, Roots — the 4 MCP protocol primitives.",
          "<b>M-E-T-R-P:</b> <code>message_start</code>, <code>end_turn</code>, <code>tool_use</code>, <code>refusal</code>, <code>pause_turn</code> — stop reasons and SSE events.",
          "<b>1024 / 2048:</b> Minimum prompt caching tokens for Sonnet/Opus vs Haiku."
        ]
      },
      {
        title: "⏱️ 8. 60-Second Developer Exam Checklist",
        items: [
          "1. Mandatory API request keys: <code>model</code>, <code>max_tokens</code>, <code>messages</code>.",
          "2. <code>tool_result</code> turn must match <code>tool_use.id</code> exactly.",
          "3. <code>max_tokens</code> caps thinking <b>and</b> response text together — adaptive thinking spends from the same budget.",
          "4. Prompt caching gives ~90% discount on reads with 5-minute TTL.",
          "5. Batches API gives 50% discount on input & output with 24-hr SLA.",
          "6. MCP tool failures must return <code>isError: true</code> inside the payload.",
          "7. Run headless Claude Code in CI/CD using <code>claude -p</code>.",
          "8. Always include idempotency keys in state-mutating tool schemas.",
          "9. Buffer streaming <code>input_json_delta</code> chunks until <code>content_block_stop</code>.",
          "10. Safety refusals (<code>stop_reason: 'refusal'</code>) are terminal — do not blind retry."
        ]
      }
    ]
  },
  ccaf: {
    name: "Claude Certified Architect — Foundations (CCAR-F)",
    code: "CCAR-F",
    color: "var(--green)",
    summary: "Architectural quick reference covering workflow topologies, hybrid RAG, proactive context compaction, and resilience cascades.",
    cards: [
      {
        title: "🏛️ 1. Top 5 Workflow Topologies & Trade-Offs",
        items: [
          "<b>First Principle of AI Architecture:</b> Never use an autonomous agent loop where a deterministic workflow or single prompt pipeline is sufficient.",
          "<b>Prompt Chaining:</b> Linear pipeline where step N passes structured JSON to step N+1. Best for compliance document processing.",
          "<b>Routing Topology:</b> Lightweight classifier (Haiku) directs queries to specialized prompts/tools, minimizing token cost and tool clutter.",
          "<b>Orchestrator-Workers:</b> Central model breaks task into independent subtasks, executes in parallel, and synthesizes results. Reduces clock latency by 70%.",
          "<b>Evaluator-Optimizer:</b> Generator model drafts; evaluator grades against a strict rubric. Must enforce hard iteration caps (max 3-5 passes)."
        ]
      },
      {
        title: "🔍 2. Enterprise 3-Tier Hybrid RAG Architecture",
        items: [
          "<b>Tier 1 — Dense Vector Search (Embeddings):</b> Conceptual semantic matching. Captures synonyms and natural language intent.",
          "<b>Tier 2 — Sparse BM25 Search (Lexical):</b> Exact keyword matching for error codes, alphanumeric SKUs, and statutory section numbers.",
          "<b>Tier 3 — Cross-Encoder Re-Ranking:</b> Precision scoring of query-document pairs to filter out retrieval noise before context injection.",
          "<b>Reciprocal Rank Fusion (RRF):</b> Blends vector and BM25 scores deterministically: <code>RRF = Σ [ 1 / (60 + Rank_Dense) + 1 / (60 + Rank_BM25) ]</code>.",
          "<b>Contextual Chunk Headers:</b> Prepend document title and section hierarchy metadata to every chunk before embedding."
        ]
      },
      {
        title: "📊 3. Proactive Context Management & 80% Rule",
        items: [
          "<b>Context is a Shared Finite Budget:</b> System prompt + tool schemas + retrieved RAG docs + history all share the 200k limit.",
          "<b>Proactive 80% Compaction Trigger:</b> Trigger compaction at 80% utilization (160,000 tokens). Waiting for 100% saturation leaves zero token headroom for the compaction prompt.",
          "<b>Semantic Compaction vs Truncation:</b> Structured semantic compaction preserves critical decisions in a <code>&lt;key_facts&gt;</code> block; FIFO truncation causes severe amnesia.",
          "<b>Lost in the Middle Attention Curve:</b> Transformers attend most strongly to start (system prompt) and end (final query). Place critical instructions at the end."
        ]
      },
      {
        title: "🛡️ 4. Resilience, Rate Limits & Fallback Cascades",
        items: [
          "<b>Full Jitter Exponential Backoff:</b> Formula: <code>t_sleep = rand(0, min(max_backoff, base × 2^attempt))</code>. Prevents synchronized thundering herds.",
          "<b>Graceful Degradation Cascade:</b> Sonnet (Primary) → Jittered Retry → Haiku (Fallback) → Cached Response → Human Escalation.",
          "<b>3-State Circuit Breakers:</b> <b>CLOSED</b> (normal) → <b>OPEN</b> (fail fast on 5 consecutive timeouts) → <b>HALF-OPEN</b> (probe recovery after 60s).",
          "<b>Token Bucket Rate Limiting:</b> Deploy at API gateway to meter requests within upstream TPM/RPM quotas before sending to Anthropic."
        ]
      },
      {
        title: "💰 5. Latency, Cost & Performance Optimization",
        items: [
          "<b>Parallel Fan-Out:</b> Orchestrator-worker execution drops clock latency from $\sum t_i$ to $\max(t_i) + t_{\text{synth}}$.",
          "<b>Prompt Cache Placement:</b> Keep static system instructions and tool definitions at the very beginning of the prompt to maximize cache hit rates.",
          "<b>Dead Letter Queues (DLQ):</b> Route permanently failing background worker tasks to an encrypted DLQ for root cause triage.",
          "<b>Semantic Chunking:</b> Split documents on logical paragraph breaks and Markdown headers rather than arbitrary character splits."
        ]
      },
      {
        title: "⚠️ 6. Top 10 Architect Exam Distractor Traps",
        items: [
          "<b>Over-Engineering Autonomy:</b> Selecting an autonomous multi-agent swarm for fixed, repeatable business processes is an architectural failure.",
          "<b>Table Splitting:</b> Slicing markdown or HTML tables across chunk boundaries destroys relational headers and causes data hallucination.",
          "<b>Waiting for Overflow:</b> Waiting until the context window hits 100% capacity before compacting causes unrecoverable token overflow errors.",
          "<b>Equal Spot-Checks:</b> Sampling every 5th item reviews by position rather than consequence. Always scale review to financial and regulatory risk.",
          "<b>Ignoring Jitter:</b> Standard exponential backoff without random jitter creates synchronized retry storms that keep servers overloaded."
        ]
      },
      {
        title: "🧠 7. High-Yield Architect Mnemonics",
        items: [
          "<b>C-R-O-E-A:</b> Chaining, Routing, Orchestrator, Evaluator, Agent — the 5 core architectural topologies.",
          "<b>D-S-C:</b> Dense Vector, Sparse BM25, Cross-Encoder — the 3 tiers of enterprise hybrid RAG.",
          "<b>80% Rule:</b> Compact context at 160,000 tokens to preserve execution headroom."
        ]
      },
      {
        title: "⏱️ 8. 60-Second Architect Exam Checklist",
        items: [
          "1. Always prefer deterministic state machines over open-ended autonomous loops.",
          "2. 3-tier RAG combines Dense (semantic) + BM25 (exact keyword) + Cross-Encoder re-ranking.",
          "3. Compact context proactively at 80% capacity (160k tokens).",
          "4. Apply full jitter to exponential retry backoff to prevent thundering herds.",
          "5. Circuit breakers trip to OPEN after consecutive downstream tool timeouts.",
          "6. Parallelize independent subtasks to drop latency from sum(t) to max(t).",
          "7. Place critical task instructions at the very end of long prompt contexts.",
          "8. Never split markdown or HTML tables across RAG chunk boundaries.",
          "9. Use Reciprocal Rank Fusion (RRF) to merge vector and keyword search ranks.",
          "10. Route failed asynchronous jobs to a Dead Letter Queue (DLQ) for audit."
        ]
      }
    ]
  },
  ccap: {
    name: "Claude Certified Architect — Professional (CCAR-P)",
    code: "CCAR-P",
    color: "var(--purple)",
    summary: "Principal architect reference sheet covering multi-agent blackboard systems, microVM sandboxing, OpenTelemetry APM, and disaster recovery.",
    cards: [
      {
        title: "👑 1. Production Multi-Agent Systems (Blackboard Pattern)",
        items: [
          "<b>Context Isolation:</b> Subagents buy context isolation and parallelism, not extra magical intelligence. Total token consumption increases.",
          "<b>The Blackboard Pattern:</b> Centralized typed JSON state store (backed by Redis/PostgreSQL) serves as single source of truth; prevents transcript bloat.",
          "<b>DAG Scheduling:</b> Structure multi-agent tasks as Directed Acyclic Graphs to prevent circular dependency deadlocks.",
          "<b>Clean-Room Spawning:</b> Spawn subagents with only the minimal required prompt data and schema; never pass parent conversation transcripts.",
          "<b>Deterministic State Machines:</b> Use finite state orchestrators (Temporal / AWS Step Functions) to manage transitions between agent phases."
        ]
      },
      {
        title: "🔒 2. Zero-Trust Security & MicroVM Container Sandboxing",
        items: [
          "<b>Trust Boundary:</b> System prompt & user query = TRUSTED. RAG passages, customer emails, web search results, and 3rd-party tools = UNTRUSTED DATA.",
          "<b>Indirect Prompt Injection Defense:</b> Treat all external content as untrusted data; enforce strict least-privilege egress filtering and confirmation gates.",
          "<b>Kernel-Level Sandboxing:</b> Standard Docker containers share the host Linux kernel. Isolate untrusted agent code execution inside <b>gVisor</b> or <b>Firecracker microVMs</b>.",
          "<b>Human Confirmation Gates:</b> Destructive mutations (database drop, fund transfers >$1,000, user deletion) require out-of-band human multi-factor approval.",
          "<b>Ephemeral Lifecycle:</b> Provision clean microVMs per task and immediately destroy upon completion to eliminate persistent malware residency."
        ]
      },
      {
        title: "📊 3. OpenTelemetry Observability & FinOps Governance",
        items: [
          "<b>OpenTelemetry GenAI Semantic Conventions:</b> Attributes: <code>gen_ai.system</code>, <code>gen_ai.request.model</code>, <code>gen_ai.usage.prompt_tokens</code>, <code>gen_ai.usage.completion_tokens</code>.",
          "<b>Multi-Tenant Cost Attribution:</b> Tag <code>metadata: { tenant_id, user_id, cost_center }</code> on every API request to automate department chargebacks.",
          "<b>Critical APM Metrics:</b> Time-to-First-Token (TTFT), P99 latency, token consumption per task, and cache hit ratio distributions.",
          "<b>Distributed Tracing:</b> Propagate W3C <code>traceparent</code> headers across all subagent calls to visualize end-to-end multi-agent execution graphs."
        ]
      },
      {
        title: "⚡ 4. High Availability, Circuit Breakers & DR",
        items: [
          "<b>3-State Circuit Breakers:</b> CLOSED (normal operation) → OPEN (fail fast immediately on downstream outage) → HALF-OPEN (probe recovery with canary traffic).",
          "<b>Active-Active Multi-Region DR:</b> Multi-cloud routing across Anthropic direct API, AWS Bedrock, and GCP Vertex AI with automated DNS failover.",
          "<b>Automated Synthetic Red-Teaming:</b> Deploy adversary models in CI/CD to continuously probe systems with thousands of mutated prompt injections.",
          "<b>Golden Dataset Regression Gates:</b> Enforce 500+ scenario regression test suites in CI/CD with position-swapped pairwise grading before production release."
        ]
      },
      {
        title: "🛡️ 5. Cryptographic Auditing & Guardrails",
        items: [
          "<b>Immutable Audit Trails:</b> Record all agent tool invocations, timestamps, input parameters, and outputs in append-only cryptographic logs.",
          "<b>Real-Time Cost Anomaly Alerts:</b> Trigger automated throttling if a tenant's spend exceeds 200% of baseline in a rolling 1-hour window.",
          "<b>Network Segmentation:</b> Isolate agents inside private VPC subnets with zero direct internet access; route outbound traffic through egress filtering proxies."
        ]
      },
      {
        title: "⚠️ 6. Top 10 Principal Exam Distractor Traps",
        items: [
          "<b>Swarm Anti-Pattern:</b> Unconstrained peer-to-peer agent swarms negotiating without centralized state or DAG constraints cause runaway costs and deadlocks.",
          "<b>Docker Container Sharing:</b> Assuming standard Docker provides sufficient security isolation for untrusted agent code execution (fails without gVisor/microVMs).",
          "<b>Single-Score LLM Judges:</b> Using 1-10 Likert scales for automated evaluation suffers from severe score drift and position bias.",
          "<b>Passing Full Transcripts:</b> Passing entire parent conversation histories to subagents causes prompt drift and exponential token consumption.",
          "<b>Client-Side Disclaimers:</b> Relying on disclaimers instead of architectural confirmation gates for destructive actions."
        ]
      },
      {
        title: "🧠 7. High-Yield Principal Mnemonics",
        items: [
          "<b>B-D-C:</b> Blackboard Pattern, DAG Scheduling, Clean-Room Context Isolation.",
          "<b>C-O-H:</b> Closed, Open, Half-Open — the 3 states of enterprise circuit breakers.",
          "<b>gVisor / Firecracker:</b> The standard kernel isolation virtualization technologies."
        ]
      },
      {
        title: "⏱️ 8. 60-Second Principal Exam Checklist",
        items: [
          "1. Centralized typed Blackboard pattern decouples multi-agent communication.",
          "2. Isolate untrusted agent code inside gVisor or Firecracker microVMs.",
          "3. Tag request <code>metadata</code> on every API call for multi-tenant FinOps chargebacks.",
          "4. Enforce 3-state Circuit Breakers on all downstream tool dependencies.",
          "5. Structure multi-agent workflows as Directed Acyclic Graphs (DAGs) to prevent deadlocks.",
          "6. Instrument all calls with standard OpenTelemetry GenAI span attributes.",
          "7. Treat all RAG and external tool inputs as UNTRUSTED DATA.",
          "8. Require human confirmation gates for destructive actions and high-value transactions.",
          "9. Continuous synthetic red-teaming in CI/CD before deploying prompt or model updates.",
          "10. Configure active-active failover across Anthropic direct API, AWS Bedrock, and GCP Vertex AI."
        ]
      }
    ]
  }
};

/* ================= UPGRADED EXAM CRAM SHEETS ================= */
let cramActiveRecallMode = false;
let cramActiveCertId = 'ccao';

function cramSheetSelect(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  let h = '<button class="back" onclick="home()">← Back to Home</button>'
    + '<div class="panel"><h2 style="font-size:20px; margin-bottom:6px;">📋 High-Yield Exam Cram Sheets</h2>'
    + '<p style="font-size:13px; color:var(--muted); margin-bottom:16px;">Quick-reference cheat sheets with essential formulas, distractor traps, and 60-second review checklists for all 4 Anthropic certifications.</p>'
    + '<div class="certs">';
  for (const c of CERTS) {
    const cd = CRAM_DATA[c.id] || { summary: "High-yield reference card." };
    h += '<div class="cert" onclick="cramSheetView(\''+c.id+'\')">'
      + '<div style="display:flex; justify-content:space-between; align-items:center;">'
      + '<span class="code" style="color:'+c.color+'; font-weight:800;">'+c.code+'</span>'
      + '<span class="ltag" style="font-size:10.5px;">8 Modules</span></div>'
      + '<h3 style="font-size:15px; margin:6px 0;">'+c.name+'</h3>'
      + '<p style="font-size:12px; color:var(--muted); line-height:1.4;">'+cd.summary+'</p>'
      + '<div class="rowbtns" style="margin-top:14px;"><button class="btn sm">Open Cram Sheet →</button></div>'
      + '</div>';
  }
  h += '</div></div>';
  $("app").innerHTML = h;
}

function filterCramCards(query){
  const q = (query || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.cram-card');
  let matched = 0;
  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    if (!q || text.includes(q)) {
      card.style.display = 'block';
      matched++;
    } else {
      card.style.display = 'none';
    }
  });
  const countEl = document.getElementById('cramMatchCount');
  if (countEl) {
    countEl.innerText = q ? (matched + ' matching modules') : '';
  }
}

function toggleCramActiveRecall(){
  cramActiveRecallMode = !cramActiveRecallMode;
  const grid = document.getElementById('cramGrid');
  const btn = document.getElementById('recallToggleBtn');
  if (grid) {
    if (cramActiveRecallMode) {
      grid.classList.add('active-recall-active');
      if (btn) btn.innerHTML = '👁️ Reveal All Answers';
      toast('🙈 Active Recall Mode: Hover or tap cards to reveal answers!');
    } else {
      grid.classList.remove('active-recall-active');
      if (btn) btn.innerHTML = '🙈 Active Recall Mode';
      toast('👁️ Full visibility restored');
    }
  }
}

function ttsPlayCramSummary(id){
  const data = CRAM_DATA[id];
  if (!data) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    toast('Speech synthesis not supported');
    return;
  }
  window.speechSynthesis.cancel();
  let script = 'Exam Cram Briefing for ' + data.name + '. ';
  data.cards.slice(0, 3).forEach(c => {
    script += c.title + '. ';
    c.items.slice(0, 3).forEach(it => {
      const clean = it.replace(/<[^>]+>/g, ' ');
      script += clean + '. ';
    });
  });
  script += ' Good luck on test day. Head to the mock exam to lock in your score.';
  const utt = new SpeechSynthesisUtterance(script);
  utt.rate = 1.05;
  if (typeof getBestVoice === 'function') {
    const v = getBestVoice();
    if (v) utt.voice = v;
  }
  window.speechSynthesis.speak(utt);
  toast('🎙️ Playing 2-Minute Audio Cram Summary...');
}

function cramSheetView(id){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  const data = CRAM_DATA[id];
  if(!data) return home();
  cramActiveCertId = id;
  cramActiveRecallMode = false;

  let cardsHtml = '';
  data.cards.forEach((card, idx) => {
    cardsHtml += '<div class="cram-card" data-idx="'+idx+'">'
      + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">'
      + '<h4>' + card.title + '</h4>'
      + '<span style="font-size:11px; font-weight:700; color:var(--muted);">#' + (idx+1) + '</span>'
      + '</div>'
      + '<ul class="cram-item-list">' + card.items.map(it => '<li>' + it + '</li>').join('') + '</ul>'
      + '</div>';
  });

  $("app").innerHTML = '<button class="back" onclick="certView(\''+id+'\')">← Back to '+id.toUpperCase()+'</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:'+data.color+'; color:#fff;">Official Cram Sheet</span><h2 style="font-size:20px; margin-top:4px;">📋 '+data.name+'</h2></div>'
    + '<div style="display:flex; gap:6px; flex-wrap:wrap;">'
    + '<button class="btn ghost sm" onclick="ttsPlayCramSummary(\''+id+'\')">🎙️ Audio Cram (2m)</button>'
    + '<button id="recallToggleBtn" class="btn ghost sm" onclick="toggleCramActiveRecall()">🙈 Active Recall Mode</button>'
    + '<button class="btn sm" onclick="window.print()">🖨️ Print / PDF</button>'
    + '</div>'
    + '</div>'
    + '<p class="subtext">'+data.summary+' Use the search filter below for quick keyword lookup.</p>'
    + '<div style="display:flex; align-items:center; gap:10px; margin:14px 0 10px; flex-wrap:wrap;">'
    + '<input id="cramSearchInput" type="text" placeholder="🔍 Search formulas, traps, specs, tools (e.g. caching, batches, stop_reason, gVisor)..." oninput="filterCramCards(this.value)" style="flex:1; min-width:260px; padding:9px 12px; border-radius:9px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px;" />'
    + '<span id="cramMatchCount" style="font-size:12px; color:var(--coral-dark); font-weight:700;"></span>'
    + '</div>'
    + '<div id="cramGrid" class="cram-grid">' + cardsHtml + '</div>'
    + '<div class="rowbtns" style="margin-top:24px; justify-content:center; gap:12px;">'
    + '<button class="btn" onclick="startMock(\''+id+'\')">⚔️ Test Yourself in Mock Exam</button>'
    + '<button class="btn ghost" onclick="learnList(\''+id+'\')">📖 Return to Study Guide</button>'
    + '</div></div>';
}

function labToolsModal(){
  renderHeader();
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  $("app").innerHTML = '<button class="back" onclick="home()">← Back to Home</button>'
    + '<div class="panel"><h2 style="font-size:20px;">🛠️ Interactive Exam Lab Simulators & Decision Trees</h2>'
    + '<p class="subtext">Interactive sandboxes, diagnostic decision trees, and protocol visualizers to master the mechanics tested on Developer and Architect exams.</p>'
    + '<div class="widget-box" data-widget="model-decision-tree"></div>'
    + '<div class="widget-box" data-widget="arch-decision-tree"></div>'
    + '<div class="widget-box" data-widget="rag-visualizer"></div>'
    + '<div class="widget-box" data-widget="prompt-caching-sim"></div>'
    + '<div class="widget-box" data-widget="multi-agent-dag"></div>'

    + '<div class="widget-box" data-widget="mcp-inspector"></div>'
    + '<div class="widget-box" data-widget="thinking-simulator"></div>'
    + '<div class="widget-box" data-widget="computer-use"></div>'
    + '<div class="widget-box" data-widget="token-cost"></div>'
    + '<div class="widget-box" data-widget="xml-prompt"></div>'
    + '<div class="widget-box" data-widget="stop-reason"></div>'
    + '</div>';
  initLessonWidgets();
}
